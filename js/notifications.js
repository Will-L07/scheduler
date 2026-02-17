/* ===== NOTIFICATIONS =====
 * Browser notification API + in-app toast reminders.
 * Checks upcoming tasks every minute and fires reminders.
 */

const Notifications = (() => {
    let checkInterval = null;
    let notifiedTasks = new Set(); // Track which tasks we've already notified about today

    function init() {
        // Start checking if notifications are enabled
        const settings = DataStore.getSettings();
        if (settings.notificationsEnabled) {
            startChecking();
        }
    }

    function requestPermission() {
        if (!('Notification' in window)) {
            App.showToast('Browser notifications are not supported.', 'warning');
            return;
        }

        if (Notification.permission === 'granted') {
            App.showToast('Notifications already enabled!', 'success');
            startChecking();
            return;
        }

        if (Notification.permission === 'denied') {
            App.showToast('Notifications are blocked. Please enable them in your browser settings.', 'warning');
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                App.showToast('Notifications enabled!', 'success');
                startChecking();
            } else {
                App.showToast('Notification permission denied.', 'warning');
                DataStore.updateSetting('notificationsEnabled', false);
                document.getElementById('notifToggle').checked = false;
            }
        });
    }

    function startChecking() {
        if (checkInterval) clearInterval(checkInterval);

        // Check every 60 seconds
        checkInterval = setInterval(checkUpcoming, 60 * 1000);

        // Also check immediately
        checkUpcoming();

        // Reset notified set at midnight
        scheduleMidnightReset();
    }

    function stopChecking() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }

    function checkUpcoming() {
        const settings = DataStore.getSettings();
        if (!settings.notificationsEnabled) return;

        const now = new Date();
        const today = DataStore.formatDate(now);
        const tasks = DataStore.getTasksForDate(today);
        const reminderMinutes = settings.reminderMinutes || 30;

        // Check exams coming up within 24 hours
        const exams = DataStore.getAllExams();
        exams.forEach(exam => {
            const daysUntil = DataStore.daysUntil(exam.date);
            if (daysUntil === 1) {
                const examKey = `exam-${exam.date}-${exam.name}`;
                if (!notifiedTasks.has(examKey)) {
                    notifiedTasks.add(examKey);
                    sendNotification(
                        `Exam Tomorrow: ${exam.name}`,
                        `${exam.session} session. Good luck, William!`
                    );
                }
            } else if (daysUntil === 0) {
                const examKey = `exam-today-${exam.date}-${exam.name}`;
                if (!notifiedTasks.has(examKey)) {
                    notifiedTasks.add(examKey);
                    sendNotification(
                        `EXAM TODAY: ${exam.name}`,
                        `${exam.session} session. You've got this!`
                    );
                }
            }
        });

        // Reminder for upcoming tasks (simplified - remind at start of day)
        const currentHour = now.getHours();
        if (currentHour >= 8 && currentHour < 9) {
            // Morning summary
            const morningKey = `morning-${today}`;
            if (!notifiedTasks.has(morningKey) && tasks.length > 0) {
                notifiedTasks.add(morningKey);
                const incomplete = tasks.filter(t => !t.completed).length;
                sendNotification(
                    `Good morning, William!`,
                    `You have ${incomplete} task${incomplete !== 1 ? 's' : ''} scheduled today.`
                );
            }
        }

        // Evening reminder
        if (currentHour >= 17 && currentHour < 18) {
            const eveningKey = `evening-${today}`;
            if (!notifiedTasks.has(eveningKey)) {
                const incomplete = tasks.filter(t => !t.completed).length;
                if (incomplete > 0) {
                    notifiedTasks.add(eveningKey);
                    sendNotification(
                        `Evening check-in`,
                        `${incomplete} task${incomplete !== 1 ? 's' : ''} still to complete today.`
                    );
                }
            }
        }
    }

    function sendNotification(title, body) {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>'
            });
        }

        // Also show in-app toast
        App.showToast(`${title}: ${body}`, 'info');
    }

    function scheduleMidnightReset() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            notifiedTasks.clear();
            scheduleMidnightReset(); // Schedule next reset
        }, msUntilMidnight);
    }

    return { init, requestPermission, startChecking, stopChecking };
})();
