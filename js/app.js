/* ===== MAIN APP =====
 * View switching, dashboard rendering, schedule display, progress, notes, settings.
 */

const App = (() => {
    // ---- Init ----
    function init() {
        SeedData.seed();
        applyTheme(DataStore.getSettings().theme);
        setupNavigation();
        setupHamburger();
        setupSettings();
        setupNotes();
        setupSchedules();
        PdfParser.init();
        Notifications.init();
        renderDashboard();
    }

    // ---- Navigation ----
    function setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                switchView(view);
            });
        });
    }

    function switchView(viewName) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const activeView = document.getElementById(`view-${viewName}`);
        if (activeView) activeView.classList.add('active');

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');

        // Render view content
        switch (viewName) {
            case 'dashboard': renderDashboard(); break;
            case 'schedules': renderSchedules(); break;
            case 'progress': renderProgress(); break;
            case 'notes': renderNotes(); break;
            case 'import': break; // PdfParser handles this
            case 'settings': break; // Already wired up
        }
    }

    // ---- Hamburger ----
    function setupHamburger() {
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        // Close sidebar when clicking outside on mobile
        document.getElementById('mainContent').addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // ==============================
    // DASHBOARD
    // ==============================
    function renderDashboard() {
        renderCurrentDate();
        renderExamCountdowns();
        renderTodayTasks();
        renderQuickStats();
        renderCurrentPhases();
    }

    function renderCurrentDate() {
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function renderExamCountdowns() {
        const container = document.getElementById('examCountdowns');
        const exams = DataStore.getAllExams();

        if (exams.length === 0) {
            container.innerHTML = '<p class="no-tasks">No exams scheduled.</p>';
            return;
        }

        container.innerHTML = exams.map(exam => {
            const days = DataStore.daysUntil(exam.date);
            const isPast = days < 0;
            const isUrgent = days >= 0 && days <= 7;
            const isSoon = days > 7 && days <= 21;

            let countdownText, countdownClass;
            if (isPast) {
                countdownText = 'Completed';
                countdownClass = '';
            } else if (days === 0) {
                countdownText = 'TODAY!';
                countdownClass = 'urgent';
            } else if (days === 1) {
                countdownText = 'Tomorrow';
                countdownClass = 'urgent';
            } else {
                countdownText = `${days} days`;
                countdownClass = isUrgent ? 'urgent' : isSoon ? 'soon' : '';
            }

            return `
                <div class="exam-card ${isPast ? 'past' : ''}">
                    <div class="exam-name">${escHtml(exam.name)}</div>
                    <div class="exam-date">${DataStore.formatDateDisplay(exam.date)} - ${exam.session}</div>
                    <div class="exam-countdown ${countdownClass}">${countdownText}</div>
                </div>
            `;
        }).join('');
    }

    function renderTodayTasks() {
        const container = document.getElementById('todayTasks');
        const today = DataStore.formatDate(new Date());
        const tasks = DataStore.getTasksForDate(today);

        if (tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">No tasks scheduled for today. Enjoy your rest!</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-schedule-id="${task.scheduleId}" data-entry-id="${task.id}" data-for-date="${task._forDate || ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-subject" data-subject="${escHtml(task.subject)}">${escHtml(task.subject)}</span>
                <div class="task-details">
                    <div class="task-topic">${escHtml(task.topic)}</div>
                    <div class="task-meta">${escHtml(task.taskFocus || '')}</div>
                </div>
                <span class="task-duration">${escHtml(task.duration)}</span>
                <button class="task-note-btn ${task.notes ? 'has-note' : ''}" title="Add note">
                    ${task.notes ? 'View Note' : 'Add Note'}
                </button>
            </div>
        `).join('');

        // Wire up checkboxes
        container.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const item = e.target.closest('.task-item');
                const scheduleId = item.dataset.scheduleId;
                const entryId = item.dataset.entryId;
                const forDate = item.dataset.forDate || null;
                DataStore.toggleEntryComplete(scheduleId, entryId, forDate);
                renderDashboard(); // Refresh
                showToast('Task updated!', 'success');
            });
        });

        // Wire up note buttons
        container.querySelectorAll('.task-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.task-item');
                const scheduleId = item.dataset.scheduleId;
                const entryId = item.dataset.entryId;
                const forDate = item.dataset.forDate || null;
                openTaskNoteModal(scheduleId, entryId, forDate);
            });
        });
    }

    function openTaskNoteModal(scheduleId, entryId, forDate) {
        const entry = DataStore.getEntry(scheduleId, entryId);
        if (!entry) return;

        // For recurring entries, get the note for this specific date
        const currentNote = (entry.dayOfWeek && forDate)
            ? ((entry.notesByDate || {})[forDate] || '')
            : (entry.notes || '');

        const modal = document.getElementById('noteModal');
        document.getElementById('noteModalTitle').textContent = `Note: ${entry.topic}`;
        document.getElementById('noteTitle').value = entry.topic;
        document.getElementById('noteCategory').value = 'revision';
        document.getElementById('noteContent').value = currentNote;

        // Override save to update entry note
        const saveBtn = document.getElementById('saveNote');
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener('click', () => {
            const noteText = document.getElementById('noteContent').value.trim();
            DataStore.addEntryNote(scheduleId, entryId, noteText, forDate);
            if (noteText) {
                DataStore.addNote({
                    title: document.getElementById('noteTitle').value || entry.topic,
                    category: document.getElementById('noteCategory').value,
                    content: noteText,
                    linkedSchedule: scheduleId,
                    linkedEntry: entryId
                });
            }
            modal.classList.remove('active');
            renderDashboard();
            showToast('Note saved!', 'success');
        });

        modal.classList.add('active');
    }

    function renderQuickStats() {
        const container = document.getElementById('quickStats');
        const today = DataStore.formatDate(new Date());
        const todayTasks = DataStore.getTasksForDate(today);
        const todayCompleted = todayTasks.filter(t => t.completed).length;
        const overall = DataStore.getOverallProgress();
        const streak = DataStore.getStreak();

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${todayCompleted}/${todayTasks.length}</div>
                <div class="stat-label">Today's Tasks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overall.percent}%</div>
                <div class="stat-label">Overall Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${overall.completed}</div>
                <div class="stat-label">Tasks Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${streak}</div>
                <div class="stat-label">Day Streak</div>
            </div>
        `;
    }

    function renderCurrentPhases() {
        const container = document.getElementById('currentPhases');
        const schedules = DataStore.getSchedules();
        const today = DataStore.formatDate(new Date());

        const phaseCards = schedules.map(schedule => {
            const phase = DataStore.getCurrentPhaseForSchedule(schedule, today);
            if (!phase) return '';
            return `
                <div class="phase-card">
                    <div class="phase-schedule">${escHtml(schedule.name)}</div>
                    <div class="phase-name">${escHtml(phase.name)}</div>
                    <div class="phase-dates">${DataStore.formatDateDisplay(phase.startDate)} - ${DataStore.formatDateDisplay(phase.endDate)}</div>
                </div>
            `;
        }).filter(Boolean);

        container.innerHTML = phaseCards.length
            ? phaseCards.join('')
            : '<p class="no-tasks">No active phases right now.</p>';
    }

    // ==============================
    // SCHEDULES
    // ==============================
    function setupSchedules() {
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            switchView('import');
        });
    }

    function renderSchedules() {
        const container = document.getElementById('schedulesList');
        const schedules = DataStore.getSchedules();

        if (schedules.length === 0) {
            container.innerHTML = '<p class="no-tasks">No schedules yet. Import a PDF to get started!</p>';
            return;
        }

        container.innerHTML = schedules.map(schedule => {
            const progress = DataStore.getProgressForSchedule(schedule.id);
            const entryGroups = groupEntriesByWeek(schedule);

            return `
                <div class="schedule-card">
                    <div class="schedule-header" data-schedule-id="${schedule.id}">
                        <div class="schedule-info">
                            <span class="schedule-color" style="background: ${schedule.color}"></span>
                            <span class="schedule-name">${escHtml(schedule.name)}</span>
                            <span class="schedule-type">${schedule.type}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">${progress.percent}% complete</span>
                            <span class="schedule-toggle">&#9660;</span>
                        </div>
                    </div>
                    <div class="schedule-body" data-schedule-body="${schedule.id}">
                        <div class="schedule-actions">
                            <button class="btn btn-sm btn-danger" data-delete-schedule="${schedule.id}">Delete Schedule</button>
                        </div>
                        ${renderScheduleEntries(schedule, entryGroups)}
                    </div>
                </div>
            `;
        }).join('');

        // Wire up toggle
        container.querySelectorAll('.schedule-header').forEach(header => {
            header.addEventListener('click', () => {
                const id = header.dataset.scheduleId;
                const body = document.querySelector(`[data-schedule-body="${id}"]`);
                const toggle = header.querySelector('.schedule-toggle');
                body.classList.toggle('open');
                toggle.classList.toggle('open');
            });
        });

        // Wire up delete
        container.querySelectorAll('[data-delete-schedule]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.deleteSchedule;
                if (confirm('Are you sure you want to delete this schedule? This cannot be undone.')) {
                    DataStore.deleteSchedule(id);
                    renderSchedules();
                    showToast('Schedule deleted.', 'info');
                }
            });
        });

        // Wire up entry checkboxes
        container.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const item = e.target.closest('.schedule-entry');
                const scheduleId = item.dataset.scheduleId;
                const entryId = item.dataset.entryId;
                const forDate = item.dataset.forDate || null;
                DataStore.toggleEntryComplete(scheduleId, entryId, forDate);
                // Don't full re-render, just toggle class
                item.classList.toggle('completed');
            });
        });
    }

    function groupEntriesByWeek(schedule) {
        if (schedule.type === 'training') {
            // Group by day of week for recurring entries
            const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const groups = {};
            schedule.entries.forEach(entry => {
                const key = entry.dayOfWeek || 'Other';
                if (!groups[key]) groups[key] = [];
                groups[key].push(entry);
            });
            // Sort by day order
            const sorted = {};
            dayOrder.forEach(day => {
                if (groups[day]) sorted[day] = groups[day];
            });
            if (groups['Other']) sorted['Other'] = groups['Other'];
            return sorted;
        }

        // Group dated entries by week
        const groups = {};
        schedule.entries.forEach(entry => {
            if (!entry.date) return;
            const d = new Date(entry.date + 'T00:00:00');
            // Get Monday of that week
            const monday = new Date(d);
            const dayOfWeek = d.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(d.getDate() - diff);
            const weekKey = DataStore.formatDate(monday);
            const weekLabel = `Week of ${DataStore.formatDateDisplay(weekKey)}`;
            if (!groups[weekLabel]) groups[weekLabel] = [];
            groups[weekLabel].push(entry);
        });
        return groups;
    }

    function renderScheduleEntries(schedule, groups) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = DataStore.formatDate(new Date());

        return Object.entries(groups).map(([groupName, entries]) => `
            <div class="schedule-week">
                <div class="schedule-week-title">${escHtml(groupName)}${entries[0] && entries[0].dayOfWeek ? ` <span style="font-weight:400; font-size:0.78rem; color:var(--text-muted);">(${(entries[0].completedDates || []).length} sessions logged)</span>` : ''}</div>
                <div class="schedule-entries">
                    ${entries.map(entry => {
                        const dayLabel = entry.date
                            ? dayNames[new Date(entry.date + 'T00:00:00').getDay()]
                            : '';
                        // For recurring entries, show completion for today only
                        const isRecurring = !!entry.dayOfWeek;
                        const isCompletedToday = isRecurring
                            ? (entry.completedDates || []).includes(today)
                            : entry.completed;
                        const totalCompleted = isRecurring
                            ? (entry.completedDates || []).length
                            : 0;
                        const recurringInfo = isRecurring && totalCompleted > 0
                            ? `<span style="font-size:0.75rem; color:var(--success); margin-left:0.5rem;">${totalCompleted} done</span>`
                            : '';
                        return `
                            <div class="schedule-entry ${isCompletedToday ? 'completed' : ''}" data-schedule-id="${schedule.id}" data-entry-id="${entry.id}" data-for-date="${isRecurring ? today : ''}">
                                <input type="checkbox" class="task-checkbox" ${isCompletedToday ? 'checked' : ''}>
                                <span class="entry-day">${dayLabel}</span>
                                <span class="task-subject" data-subject="${escHtml(entry.subject)}">${escHtml(entry.subject)}</span>
                                <span style="flex:1; font-size: 0.85rem;">${escHtml(entry.topic)}${recurringInfo}</span>
                                <span class="task-duration">${escHtml(entry.duration)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    // ==============================
    // PROGRESS
    // ==============================
    function renderProgress() {
        renderProgressOverview();
        renderProgressBySchedule();
        renderProgressBySubject();
        renderStreak();
    }

    function renderProgressOverview() {
        const container = document.getElementById('progressOverview');
        const overall = DataStore.getOverallProgress();

        container.innerHTML = `
            <div class="progress-card">
                <div class="progress-header">
                    <span class="progress-title">Overall Progress</span>
                    <span class="progress-percent">${overall.percent}% (${overall.completed}/${overall.total})</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${overall.percent}%"></div>
                </div>
            </div>
        `;
    }

    function renderProgressBySchedule() {
        const container = document.getElementById('progressBySchedule');
        const schedules = DataStore.getSchedules();

        container.innerHTML = schedules.map(schedule => {
            const p = DataStore.getProgressForSchedule(schedule.id);
            return `
                <div class="progress-card">
                    <div class="progress-header">
                        <span class="progress-title">
                            <span class="schedule-color" style="background: ${schedule.color}; display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 0.5rem;"></span>
                            ${escHtml(schedule.name)}
                        </span>
                        <span class="progress-percent">${p.percent}% (${p.completed}/${p.total})</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${p.percent}%; background: ${schedule.color}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderProgressBySubject() {
        const container = document.getElementById('progressBySubject');
        const subjects = DataStore.getProgressBySubject();

        const subjectColors = {
            'AS FM': 'var(--subject-asfm)',
            'Physics': 'var(--subject-physics)',
            'Maths': 'var(--subject-maths)',
            'BTEC': 'var(--subject-btec)',
            'Python': 'var(--subject-python)',
            'Review': 'var(--subject-review)',
            'Easy Walk': 'var(--subject-hiking)',
            'Hill Repeats': 'var(--subject-hiking)',
            'Strength & Core': 'var(--subject-hiking)',
            'Brisk Hilly Walk': 'var(--subject-hiking)',
            'Rest': 'var(--subject-review)',
            'Long Walk': 'var(--subject-hiking)',
            'Active Recovery': 'var(--subject-hiking)'
        };

        container.innerHTML = Object.entries(subjects).map(([subject, data]) => `
            <div class="progress-card">
                <div class="progress-header">
                    <span class="progress-title">${escHtml(subject)}</span>
                    <span class="progress-percent">${data.percent}% (${data.completed}/${data.total})</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.percent}%; background: ${subjectColors[subject] || 'var(--accent)'}"></div>
                </div>
            </div>
        `).join('');
    }

    function renderStreak() {
        const container = document.getElementById('streakDisplay');
        const streak = DataStore.getStreak();

        container.innerHTML = `
            <div class="streak-card">
                <div class="streak-value">${streak}</div>
                <div class="streak-label">Day Streak</div>
            </div>
        `;
    }

    // ==============================
    // NOTES
    // ==============================
    function setupNotes() {
        const modal = document.getElementById('noteModal');
        const addBtn = document.getElementById('addNoteBtn');
        const closeBtn = document.getElementById('closeNoteModal');
        const cancelBtn = document.getElementById('cancelNote');
        const saveBtn = document.getElementById('saveNote');
        const searchInput = document.getElementById('notesSearch');

        addBtn.addEventListener('click', () => {
            document.getElementById('noteModalTitle').textContent = 'New Journal Entry';
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteCategory').value = 'general';
            document.getElementById('noteContent').value = '';

            // Reset save handler
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => {
                const title = document.getElementById('noteTitle').value.trim();
                const content = document.getElementById('noteContent').value.trim();
                if (!title && !content) {
                    showToast('Please add a title or content.', 'warning');
                    return;
                }
                DataStore.addNote({
                    title: title || 'Untitled',
                    category: document.getElementById('noteCategory').value,
                    content
                });
                modal.classList.remove('active');
                renderNotes();
                showToast('Note saved!', 'success');
            });

            modal.classList.add('active');
        });

        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        searchInput.addEventListener('input', () => renderNotes());
    }

    function renderNotes() {
        const container = document.getElementById('notesList');
        const searchTerm = document.getElementById('notesSearch').value.toLowerCase();
        let notes = DataStore.getNotes();

        if (searchTerm) {
            notes = notes.filter(n =>
                (n.title || '').toLowerCase().includes(searchTerm) ||
                (n.content || '').toLowerCase().includes(searchTerm) ||
                (n.category || '').toLowerCase().includes(searchTerm)
            );
        }

        if (notes.length === 0) {
            container.innerHTML = '<p class="no-tasks">No notes yet. Click "+ New Entry" to start journaling!</p>';
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <div class="note-title">${escHtml(note.title || 'Untitled')}</div>
                    <div class="note-date">${formatNoteDate(note.createdAt)}</div>
                </div>
                <span class="note-category">${escHtml(note.category || 'general')}</span>
                <div class="note-content">${escHtml(note.content || '')}</div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-secondary" data-edit-note="${note.id}">Edit</button>
                    <button class="btn btn-sm btn-danger" data-delete-note="${note.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Wire up delete
        container.querySelectorAll('[data-delete-note]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this note?')) {
                    DataStore.deleteNote(btn.dataset.deleteNote);
                    renderNotes();
                    showToast('Note deleted.', 'info');
                }
            });
        });

        // Wire up edit
        container.querySelectorAll('[data-edit-note]').forEach(btn => {
            btn.addEventListener('click', () => {
                const noteId = btn.dataset.editNote;
                const note = DataStore.getNotes().find(n => n.id === noteId);
                if (!note) return;

                const modal = document.getElementById('noteModal');
                document.getElementById('noteModalTitle').textContent = 'Edit Note';
                document.getElementById('noteTitle').value = note.title || '';
                document.getElementById('noteCategory').value = note.category || 'general';
                document.getElementById('noteContent').value = note.content || '';

                const saveBtn = document.getElementById('saveNote');
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                newSaveBtn.addEventListener('click', () => {
                    DataStore.updateNote(noteId, {
                        title: document.getElementById('noteTitle').value.trim() || 'Untitled',
                        category: document.getElementById('noteCategory').value,
                        content: document.getElementById('noteContent').value.trim()
                    });
                    modal.classList.remove('active');
                    renderNotes();
                    showToast('Note updated!', 'success');
                });

                modal.classList.add('active');
            });
        });
    }

    function formatNoteDate(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ==============================
    // SETTINGS
    // ==============================
    function setupSettings() {
        const settings = DataStore.getSettings();

        // Theme toggle
        document.querySelectorAll('.toggle-btn[data-theme]').forEach(btn => {
            if (btn.dataset.theme === settings.theme) btn.classList.add('active');
            else btn.classList.remove('active');

            btn.addEventListener('click', () => {
                document.querySelectorAll('.toggle-btn[data-theme]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                DataStore.updateSetting('theme', theme);
                applyTheme(theme);
            });
        });

        // Notification toggle
        const notifToggle = document.getElementById('notifToggle');
        notifToggle.checked = settings.notificationsEnabled;
        notifToggle.addEventListener('change', () => {
            const enabled = notifToggle.checked;
            DataStore.updateSetting('notificationsEnabled', enabled);
            if (enabled) {
                Notifications.requestPermission();
            }
        });

        // Reminder time
        const reminderTime = document.getElementById('reminderTime');
        reminderTime.value = settings.reminderMinutes || 30;
        reminderTime.addEventListener('change', () => {
            DataStore.updateSetting('reminderMinutes', parseInt(reminderTime.value));
        });

        // Export
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            const data = DataStore.exportAll();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `williams-scheduler-backup-${DataStore.formatDate(new Date())}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported!', 'success');
        });

        // Import
        const importFile = document.getElementById('importDataFile');
        document.getElementById('importDataBtn').addEventListener('click', () => {
            importFile.click();
        });
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const success = DataStore.importAll(ev.target.result);
                if (success) {
                    showToast('Data imported successfully!', 'success');
                    renderDashboard();
                } else {
                    showToast('Import failed. Check the file format.', 'error');
                }
            };
            reader.readAsText(file);
            importFile.value = '';
        });

        // Reset
        document.getElementById('resetDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure? This will delete ALL your data including schedules, notes, and settings. This cannot be undone.')) {
                DataStore.resetAll();
                showToast('All data reset. Reloading...', 'info');
                setTimeout(() => location.reload(), 1000);
            }
        });
    }

    // ---- Theme ----
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // ---- Toast notifications ----
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ---- HTML escaping ----
    function escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Expose for other modules
    return { init, switchView, showToast, renderDashboard };
})();

// ---- Start ----
document.addEventListener('DOMContentLoaded', App.init);
