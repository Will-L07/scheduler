/* ===== FIREBASE CLOUD SYNC =====
 * Handles Google sign-in and Firestore sync for cross-device data.
 * Offline-first: localStorage is primary, Firestore syncs in background.
 */

const CloudSync = (() => {
    // ---- Firebase Config ----
    // REPLACE with your Firebase project config from console.firebase.google.com
    const firebaseConfig = {
        apiKey: "AIzaSyBbMqJeeaOuT6g41zUHy9or2U1_ivRtkQE",
        authDomain: "williams-scheduler.firebaseapp.com",
        projectId: "williams-scheduler",
        storageBucket: "williams-scheduler.firebasestorage.app",
        messagingSenderId: "952580319953",
        appId: "1:952580319953:web:50d9d523b6c908e56433f0"
    };

    let db = null;
    let auth = null;
    let currentUser = null;
    let unsubscribe = null; // Firestore listener
    let syncEnabled = false;
    let isSyncing = false;

    function init() {
        // Don't init if config is empty
        if (!firebaseConfig.apiKey) {
            console.log('CloudSync: No Firebase config set. Cloud sync disabled.');
            return;
        }

        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();

            // Enable offline persistence
            db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence unavailable (multiple tabs).');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence not supported in this browser.');
                }
            });

            // Listen for auth state changes
            auth.onAuthStateChanged(user => {
                currentUser = user;
                syncEnabled = !!user;

                updateSyncUI();

                if (user) {
                    console.log('CloudSync: Signed in as', user.displayName);
                    // Initial sync: pull from cloud, merge, then start listening
                    syncFromCloud().then(() => {
                        startRealtimeSync();
                    });
                } else {
                    console.log('CloudSync: Signed out');
                    stopRealtimeSync();
                }
            });
        } catch (e) {
            console.error('CloudSync: Firebase init failed:', e);
        }
    }

    function isConfigured() {
        return !!firebaseConfig.apiKey;
    }

    function isSignedIn() {
        return !!currentUser;
    }

    function getUserInfo() {
        if (!currentUser) return null;
        return {
            name: currentUser.displayName,
            email: currentUser.email,
            photo: currentUser.photoURL
        };
    }

    // ---- Auth ----
    async function signIn() {
        if (!auth) return;
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
            App.showToast('Signed in! Syncing data...', 'success');
        } catch (e) {
            if (e.code === 'auth/popup-closed-by-user') return;
            console.error('Sign-in failed:', e);
            if (e.code === 'auth/unauthorized-domain') {
                App.showToast('Domain not authorized in Firebase. Add this domain in Firebase Console → Authentication → Settings → Authorized domains.', 'error');
            } else if (e.code === 'auth/operation-not-allowed') {
                App.showToast('Google sign-in not enabled. Enable it in Firebase Console → Authentication → Sign-in method.', 'error');
            } else if (e.code === 'auth/popup-blocked') {
                App.showToast('Pop-up blocked by browser. Allow pop-ups for this site.', 'error');
            } else {
                App.showToast(`Sign-in failed: ${e.code || e.message}`, 'error');
            }
        }
    }

    async function signOut() {
        if (!auth) return;
        stopRealtimeSync();
        await auth.signOut();
        currentUser = null;
        syncEnabled = false;
        updateSyncUI();
        App.showToast('Signed out. Data stays on this device.', 'info');
    }

    // ---- Sync to Cloud ----
    async function syncToCloud() {
        if (!syncEnabled || !currentUser || !db || isSyncing) return;
        isSyncing = true;

        try {
            const userDoc = db.collection('users').doc(currentUser.uid);

            // Save schedules
            await userDoc.collection('data').doc('schedules').set({
                items: DataStore.getSchedules(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Save notes
            await userDoc.collection('data').doc('notes').set({
                items: DataStore.getNotes(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Save settings
            await userDoc.collection('data').doc('settings').set({
                ...DataStore.getSettings(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            updateSyncStatus('Synced just now');
        } catch (e) {
            console.error('CloudSync: Push failed:', e);
            updateSyncStatus('Sync failed');
            App.showToast(`Sync push failed: ${e.code || e.message}`, 'error');
        } finally {
            isSyncing = false;
        }
    }

    // ---- Sync from Cloud ----
    async function syncFromCloud() {
        if (!currentUser || !db) return;
        isSyncing = true;

        try {
            const userDoc = db.collection('users').doc(currentUser.uid);

            // Check if cloud has data
            const schedulesDoc = await userDoc.collection('data').doc('schedules').get();

            if (schedulesDoc.exists) {
                const cloudSchedules = schedulesDoc.data().items || [];

                if (cloudSchedules.length > 0) {
                    // Merge cloud data with local data
                    mergeSchedules(cloudSchedules);

                    // Pull notes
                    const notesDoc = await userDoc.collection('data').doc('notes').get();
                    if (notesDoc.exists) {
                        const cloudNotes = notesDoc.data().items || [];
                        mergeNotes(cloudNotes);
                    }

                    // Pull settings
                    const settingsDoc = await userDoc.collection('data').doc('settings').get();
                    if (settingsDoc.exists) {
                        const cloudSettings = settingsDoc.data();
                        delete cloudSettings.updatedAt;
                        DataStore.saveSettings(cloudSettings);
                    }

                    // Re-render the app
                    if (typeof App !== 'undefined' && App.refresh) {
                        App.refresh();
                    }
                    updateSyncStatus('Synced just now');
                }
            } else {
                // No cloud data yet — push local data up
                // Must reset isSyncing so syncToCloud doesn't skip
                isSyncing = false;
                await syncToCloud();
            }
        } catch (e) {
            console.error('CloudSync: Pull failed:', e);
            updateSyncStatus('Sync failed');
            App.showToast(`Sync pull failed: ${e.code || e.message}`, 'error');
        } finally {
            isSyncing = false;
        }
    }

    // ---- Merge Logic ----
    function mergeSchedules(cloudSchedules) {
        const localSchedules = DataStore.getSchedules();
        const merged = [...localSchedules];

        cloudSchedules.forEach(cloudSch => {
            const localIdx = merged.findIndex(s => s.id === cloudSch.id);

            if (localIdx === -1) {
                // Schedule only in cloud — add it
                merged.push(cloudSch);
            } else {
                // Schedule exists in both — merge entries
                const localSch = merged[localIdx];
                mergeEntries(localSch, cloudSch);
            }
        });

        DataStore.saveSchedules(merged);
    }

    function mergeEntries(localSchedule, cloudSchedule) {
        const cloudEntries = cloudSchedule.entries || [];

        cloudEntries.forEach(cloudEntry => {
            const localEntry = localSchedule.entries.find(e => e.id === cloudEntry.id);

            if (!localEntry) {
                // Entry only in cloud — add it
                localSchedule.entries.push(cloudEntry);
            } else {
                // Entry exists in both — merge completion data
                // For recurring: union completedDates arrays
                if (localEntry.dayOfWeek && cloudEntry.completedDates) {
                    const allDates = new Set([
                        ...(localEntry.completedDates || []),
                        ...(cloudEntry.completedDates || [])
                    ]);
                    localEntry.completedDates = [...allDates].sort();
                }

                // For recurring: merge notesByDate (cloud wins for same date)
                if (localEntry.dayOfWeek && cloudEntry.notesByDate) {
                    localEntry.notesByDate = {
                        ...(localEntry.notesByDate || {}),
                        ...(cloudEntry.notesByDate || {})
                    };
                }

                // For dated entries: take whichever is completed
                if (!localEntry.dayOfWeek) {
                    if (cloudEntry.completed && !localEntry.completed) {
                        localEntry.completed = true;
                        localEntry.completedAt = cloudEntry.completedAt;
                    }
                    // Merge notes: keep longer/newer
                    if (cloudEntry.notes && (!localEntry.notes || cloudEntry.notes.length > localEntry.notes.length)) {
                        localEntry.notes = cloudEntry.notes;
                    }
                }
            }
        });
    }

    function mergeNotes(cloudNotes) {
        const localNotes = DataStore.getNotes();
        const localIds = new Set(localNotes.map(n => n.id));

        cloudNotes.forEach(note => {
            if (!localIds.has(note.id)) {
                localNotes.push(note);
            }
        });

        // Sort by creation date (newest first)
        localNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        DataStore.saveNotes(localNotes);
    }

    // ---- Real-time Listener ----
    function startRealtimeSync() {
        if (!currentUser || !db) return;
        stopRealtimeSync();

        const userDoc = db.collection('users').doc(currentUser.uid);

        // Listen for schedule changes from other devices
        unsubscribe = userDoc.collection('data').doc('schedules')
            .onSnapshot(doc => {
                if (isSyncing) return; // Don't react to our own writes

                if (doc.exists && doc.metadata.hasPendingWrites === false) {
                    const cloudSchedules = doc.data().items || [];
                    if (cloudSchedules.length > 0) {
                        mergeSchedules(cloudSchedules);
                        if (typeof App !== 'undefined' && App.refresh) {
                            App.refresh();
                        }
                        updateSyncStatus('Synced just now');
                    }
                }
            }, err => {
                console.error('CloudSync: Listener error:', err);
            });
    }

    function stopRealtimeSync() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    }

    // ---- UI Updates ----
    function updateSyncUI() {
        const statusEl = document.getElementById('syncStatus');
        const signInBtn = document.getElementById('cloudSignIn');
        const signOutBtn = document.getElementById('cloudSignOut');
        const userInfoEl = document.getElementById('syncUserInfo');

        if (!statusEl || !signInBtn || !signOutBtn || !userInfoEl) return;

        if (currentUser) {
            signInBtn.classList.add('hidden');
            signOutBtn.classList.remove('hidden');
            userInfoEl.innerHTML = `
                <img src="${currentUser.photoURL || ''}" alt="" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:0.5rem;">
                <span>${currentUser.displayName || currentUser.email}</span>
            `;
            userInfoEl.classList.remove('hidden');
            statusEl.textContent = 'Connected';
            statusEl.className = 'sync-status sync-connected';
        } else {
            signInBtn.classList.remove('hidden');
            signOutBtn.classList.add('hidden');
            userInfoEl.classList.add('hidden');
            statusEl.textContent = 'Not signed in';
            statusEl.className = 'sync-status';
        }
    }

    function updateSyncStatus(text) {
        const statusEl = document.getElementById('syncStatus');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    // ---- Called by DataStore after any save ----
    function onDataChanged() {
        if (syncEnabled && !isSyncing) {
            // Debounce: wait 1 second before syncing
            clearTimeout(CloudSync._syncTimeout);
            CloudSync._syncTimeout = setTimeout(() => {
                syncToCloud();
            }, 1000);
        }
    }

    return {
        init,
        isConfigured,
        isSignedIn,
        getUserInfo,
        signIn,
        signOut,
        syncToCloud,
        syncFromCloud,
        onDataChanged,
        _syncTimeout: null
    };
})();
