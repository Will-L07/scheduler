/* ===== DATA LAYER =====
 * All localStorage operations for William's Scheduler.
 * Other modules call into this for CRUD on schedules, entries, notes, and settings.
 */

const DataStore = (() => {
    const KEYS = {
        schedules: 'ws_schedules',
        notes: 'ws_notes',
        settings: 'ws_settings',
        seeded: 'ws_seeded'
    };

    // ---- Helpers ----
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function load(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Failed to load', key, e);
            return null;
        }
    }

    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // Notify cloud sync if available
            if (typeof CloudSync !== 'undefined' && CloudSync.onDataChanged) {
                CloudSync.onDataChanged();
            }
        } catch (e) {
            console.error('Failed to save', key, e);
        }
    }

    // ---- Schedules ----
    function getSchedules() {
        return load(KEYS.schedules) || [];
    }

    function saveSchedules(schedules) {
        save(KEYS.schedules, schedules);
    }

    function getScheduleById(id) {
        return getSchedules().find(s => s.id === id) || null;
    }

    function addSchedule(schedule) {
        const schedules = getSchedules();
        schedule.id = schedule.id || generateId();
        schedule.createdAt = schedule.createdAt || new Date().toISOString();
        schedules.push(schedule);
        saveSchedules(schedules);
        return schedule;
    }

    function updateSchedule(id, updates) {
        const schedules = getSchedules();
        const idx = schedules.findIndex(s => s.id === id);
        if (idx === -1) return null;
        schedules[idx] = { ...schedules[idx], ...updates };
        saveSchedules(schedules);
        return schedules[idx];
    }

    function deleteSchedule(id) {
        const schedules = getSchedules().filter(s => s.id !== id);
        saveSchedules(schedules);
    }

    // ---- Entries ----
    function getEntry(scheduleId, entryId) {
        const schedule = getScheduleById(scheduleId);
        if (!schedule) return null;
        return schedule.entries.find(e => e.id === entryId) || null;
    }

    function updateEntry(scheduleId, entryId, updates) {
        const schedules = getSchedules();
        const schedule = schedules.find(s => s.id === scheduleId);
        if (!schedule) return null;
        const entry = schedule.entries.find(e => e.id === entryId);
        if (!entry) return null;
        Object.assign(entry, updates);
        saveSchedules(schedules);
        return entry;
    }

    function toggleEntryComplete(scheduleId, entryId, forDate) {
        const schedules = getSchedules();
        const schedule = schedules.find(s => s.id === scheduleId);
        if (!schedule) return null;
        const entry = schedule.entries.find(e => e.id === entryId);
        if (!entry) return null;

        if (entry.dayOfWeek && forDate) {
            // Recurring entry: toggle per-date completion
            if (!entry.completedDates) entry.completedDates = [];
            const idx = entry.completedDates.indexOf(forDate);
            if (idx === -1) {
                entry.completedDates.push(forDate);
            } else {
                entry.completedDates.splice(idx, 1);
            }
        } else {
            // Dated entry: simple toggle
            entry.completed = !entry.completed;
            entry.completedAt = entry.completed ? new Date().toISOString() : null;
        }

        saveSchedules(schedules);
        return entry;
    }

    function addEntryNote(scheduleId, entryId, note, forDate) {
        if (forDate) {
            // Recurring entry: store note per-date
            const schedules = getSchedules();
            const schedule = schedules.find(s => s.id === scheduleId);
            if (!schedule) return null;
            const entry = schedule.entries.find(e => e.id === entryId);
            if (!entry) return null;
            if (entry.dayOfWeek) {
                if (!entry.notesByDate) entry.notesByDate = {};
                entry.notesByDate[forDate] = note;
                saveSchedules(schedules);
                return entry;
            }
        }
        return updateEntry(scheduleId, entryId, { notes: note });
    }

    // ---- Get tasks for a specific date ----
    function getTasksForDate(dateStr) {
        const date = new Date(dateStr);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = dayNames[date.getDay()];
        const tasks = [];

        getSchedules().forEach(schedule => {
            schedule.entries.forEach(entry => {
                let matches = false;

                if (entry.date) {
                    // Specific dated entry
                    matches = entry.date === dateStr;
                } else if (entry.dayOfWeek) {
                    // Recurring weekly entry - check if date falls within schedule's active period
                    if (entry.dayOfWeek === dayOfWeek) {
                        const phase = getCurrentPhaseForSchedule(schedule, dateStr);
                        matches = phase !== null;
                    }
                }

                if (matches) {
                    // For recurring entries, resolve per-date completion and notes
                    const isRecurring = !!entry.dayOfWeek;
                    const completionKey = (isRecurring && schedule.weeklyReset)
                        ? getWeekStart(dateStr)
                        : dateStr;
                    const completedForDate = isRecurring
                        ? (entry.completedDates || []).includes(completionKey)
                        : entry.completed;
                    const notesForDate = isRecurring
                        ? ((entry.notesByDate || {})[completionKey] || '')
                        : (entry.notes || '');

                    tasks.push({
                        ...entry,
                        completed: completedForDate,
                        notes: notesForDate,
                        _forDate: completionKey,
                        scheduleId: schedule.id,
                        scheduleName: schedule.name,
                        scheduleColor: schedule.color
                    });
                }
            });
        });

        return tasks;
    }

    // ---- Get all exams across schedules ----
    function getAllExams() {
        const exams = [];
        getSchedules().forEach(schedule => {
            if (schedule.exams) {
                schedule.exams.forEach(exam => {
                    exams.push({
                        ...exam,
                        scheduleId: schedule.id,
                        scheduleName: schedule.name,
                        scheduleColor: schedule.color
                    });
                });
            }
        });
        return exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // ---- Get current phase for a schedule ----
    function getCurrentPhaseForSchedule(schedule, dateStr) {
        if (!schedule.phases) return null;
        const date = dateStr ? new Date(dateStr) : new Date();
        for (const phase of schedule.phases) {
            const start = new Date(phase.startDate);
            const end = new Date(phase.endDate);
            if (date >= start && date <= end) return phase;
        }
        return null;
    }

    // ---- Progress calculations ----

    // Count how many weeks a recurring entry is active (based on schedule phases)
    function countRecurringWeeks(schedule, entry) {
        if (!schedule.phases || !entry.dayOfWeek) return 0;
        const dayIndex = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(entry.dayOfWeek);
        let count = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        schedule.phases.forEach(phase => {
            const start = new Date(phase.startDate);
            const end = new Date(phase.endDate);
            // Only count up to today (don't count future weeks as "total")
            const effectiveEnd = end < today ? end : today;
            if (start > effectiveEnd) return;

            const d = new Date(start);
            while (d <= effectiveEnd) {
                if (d.getDay() === dayIndex) count++;
                d.setDate(d.getDate() + 1);
            }
        });
        return count;
    }

    function getEntryProgress(schedule, entry) {
        if (entry.dayOfWeek) {
            // Recurring: total = weeks so far, completed = completedDates count
            const total = countRecurringWeeks(schedule, entry);
            const completed = (entry.completedDates || []).length;
            return { total, completed };
        }
        // Dated: 1 task, 0 or 1 completed
        return { total: 1, completed: entry.completed ? 1 : 0 };
    }

    function getProgressForSchedule(scheduleId) {
        const schedule = getScheduleById(scheduleId);
        if (!schedule || !schedule.entries.length) return { total: 0, completed: 0, percent: 0 };
        let total = 0, completed = 0;
        schedule.entries.forEach(entry => {
            const p = getEntryProgress(schedule, entry);
            total += p.total;
            completed += p.completed;
        });
        return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
    }

    function getProgressBySubject() {
        const subjects = {};
        getSchedules().forEach(schedule => {
            schedule.entries.forEach(entry => {
                const subj = entry.subject || 'Other';
                if (!subjects[subj]) subjects[subj] = { total: 0, completed: 0 };
                const p = getEntryProgress(schedule, entry);
                subjects[subj].total += p.total;
                subjects[subj].completed += p.completed;
            });
        });
        // Calculate percentages
        Object.keys(subjects).forEach(key => {
            subjects[key].percent = subjects[key].total
                ? Math.round((subjects[key].completed / subjects[key].total) * 100)
                : 0;
        });
        return subjects;
    }

    function getOverallProgress() {
        let total = 0, completed = 0;
        getSchedules().forEach(schedule => {
            schedule.entries.forEach(entry => {
                const p = getEntryProgress(schedule, entry);
                total += p.total;
                completed += p.completed;
            });
        });
        return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
    }

    // ---- Streak ----
    function getStreak() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let checkDate = new Date(today);

        // Check if today has any completed tasks
        const todayStr = formatDate(today);
        const todayTasks = getTasksForDate(todayStr);
        const todayCompleted = todayTasks.some(t => t.completed);

        // If today has no completed tasks, start checking from yesterday
        if (!todayCompleted) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Count consecutive days with at least one completed task
        for (let i = 0; i < 365; i++) {
            const dateStr = formatDate(checkDate);
            const tasks = getTasksForDate(dateStr);
            if (tasks.length === 0) {
                // No tasks scheduled - skip (don't break streak for rest days)
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            const anyCompleted = tasks.some(t => t.completed);
            if (anyCompleted) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    // ---- Notes / Journal ----
    function getNotes() {
        return load(KEYS.notes) || [];
    }

    function saveNotes(notes) {
        save(KEYS.notes, notes);
    }

    function addNote(note) {
        const notes = getNotes();
        note.id = generateId();
        note.createdAt = new Date().toISOString();
        notes.unshift(note);
        saveNotes(notes);
        return note;
    }

    function updateNote(id, updates) {
        const notes = getNotes();
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return null;
        notes[idx] = { ...notes[idx], ...updates };
        saveNotes(notes);
        return notes[idx];
    }

    function deleteNote(id) {
        const notes = getNotes().filter(n => n.id !== id);
        saveNotes(notes);
    }

    // ---- Settings ----
    function getSettings() {
        return load(KEYS.settings) || {
            theme: 'light',
            notificationsEnabled: false,
            reminderMinutes: 30
        };
    }

    function saveSettings(settings) {
        save(KEYS.settings, settings);
    }

    function updateSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        saveSettings(settings);
        return settings;
    }

    // ---- Seed check ----
    function isSeeded() {
        return load(KEYS.seeded) === true;
    }

    function markSeeded() {
        save(KEYS.seeded, true);
    }

    // ---- Export / Import ----
    function exportAll() {
        return JSON.stringify({
            schedules: getSchedules(),
            notes: getNotes(),
            settings: getSettings(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    function importAll(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.schedules) {
                // Merge: add new schedules, update existing ones by ID
                const existing = getSchedules();
                const existingIds = new Set(existing.map(s => s.id));
                data.schedules.forEach(imported => {
                    if (existingIds.has(imported.id)) {
                        // Replace existing schedule with imported version
                        const idx = existing.findIndex(s => s.id === imported.id);
                        existing[idx] = imported;
                    } else {
                        existing.push(imported);
                    }
                });
                saveSchedules(existing);
            }
            if (data.notes) {
                // Merge: add notes that don't already exist
                const existing = getNotes();
                const existingIds = new Set(existing.map(n => n.id));
                data.notes.forEach(note => {
                    if (!existingIds.has(note.id)) existing.push(note);
                });
                saveNotes(existing);
            }
            if (data.settings) saveSettings(data.settings);
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    function resetAll() {
        localStorage.removeItem(KEYS.schedules);
        localStorage.removeItem(KEYS.notes);
        localStorage.removeItem(KEYS.settings);
        localStorage.removeItem(KEYS.seeded);
    }

    // ---- Date helpers ----
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function daysUntil(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr + 'T00:00:00');
        const diff = target - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // ---- Confidence (RAG) ----
    function setEntryConfidence(scheduleId, entryId, confidence, forDate) {
        const entry = getEntry(scheduleId, entryId);
        if (!entry) return;
        if (entry.dayOfWeek && forDate) {
            const confidenceByDate = { ...(entry.confidenceByDate || {}), [forDate]: confidence };
            return updateEntry(scheduleId, entryId, { confidenceByDate });
        } else {
            return updateEntry(scheduleId, entryId, { confidence });
        }
    }

    function getConfidenceAnalysis() {
        const results = [];
        getSchedules().forEach(schedule => {
            if (!schedule.topicGroups) return;
            Object.entries(schedule.topicGroups).forEach(([groupName, topicNames]) => {
                let red = 0, amber = 0, green = 0;
                const topicRows = topicNames.map(topicName => {
                    const entry = schedule.entries.find(e => e.topic === topicName);
                    if (!entry) return { topic: topicName, confidence: null, ratedOn: null };
                    let confidence = null, ratedOn = null;
                    if (entry.dayOfWeek) {
                        const byDate = Object.entries(entry.confidenceByDate || {});
                        if (byDate.length) {
                            byDate.sort((a, b) => b[0].localeCompare(a[0]));
                            confidence = byDate[0][1];
                            ratedOn = byDate[0][0];
                        }
                    } else {
                        confidence = entry.confidence || null;
                        ratedOn = entry.completedAt ? entry.completedAt.slice(0, 10) : null;
                    }
                    if (confidence === 'red') red++;
                    else if (confidence === 'amber') amber++;
                    else if (confidence === 'green') green++;
                    return { topic: topicName, confidence, ratedOn };
                });

                const rated = red + amber + green;
                if (rated === 0) return; // skip groups with no ratings yet

                let feedback;
                const redPct = Math.round((red / rated) * 100);
                const greenPct = Math.round((green / rated) * 100);
                if (redPct >= 50) feedback = 'Needs significant work — revisit core concepts and practice questions.';
                else if (redPct > 0 || amber > 0) feedback = 'Making progress — focus more practice on the amber and red topics.';
                else feedback = 'Strong understanding — keep refreshing to maintain confidence.';

                results.push({ groupName, scheduleName: schedule.name, red, amber, green, feedback, topics: topicRows });
            });
        });
        return results;
    }

    function getWeakAreaTopics(withinDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (withinDays || 14));
        const cutoffStr = formatDate(cutoff);
        const weakTopics = [];
        getSchedules().forEach(schedule => {
            schedule.entries.forEach(entry => {
                let confidence = null, ratedDate = null;
                if (entry.dayOfWeek) {
                    const byDate = entry.confidenceByDate || {};
                    const recent = Object.entries(byDate).filter(([d]) => d >= cutoffStr).sort((a, b) => b[0].localeCompare(a[0]));
                    if (recent.length) { confidence = recent[0][1]; ratedDate = recent[0][0]; }
                } else if (entry.confidence && entry.completed) {
                    confidence = entry.confidence;
                    ratedDate = entry.completedAt ? entry.completedAt.slice(0, 10) : null;
                }
                if ((confidence === 'red' || confidence === 'amber') && ratedDate >= cutoffStr) {
                    weakTopics.push({ topic: entry.topic, subject: entry.subject, confidence, scheduleId: schedule.id, scheduleName: schedule.name, subjectColor: (schedule.subjectColors || {})[entry.subject] });
                }
            });
        });
        return weakTopics;
    }

    // Returns the Monday of the week containing dateStr (YYYY-MM-DD)
    function getWeekStart(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
        const diff = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diff);
        return formatDate(d);
    }

    return {
        generateId,
        getSchedules,
        saveSchedules,
        getScheduleById,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getEntry,
        updateEntry,
        toggleEntryComplete,
        addEntryNote,
        getTasksForDate,
        getAllExams,
        getCurrentPhaseForSchedule,
        getProgressForSchedule,
        getProgressBySubject,
        getOverallProgress,
        getStreak,
        getNotes,
        saveNotes,
        addNote,
        updateNote,
        deleteNote,
        getSettings,
        saveSettings,
        updateSetting,
        isSeeded,
        markSeeded,
        exportAll,
        importAll,
        resetAll,
        formatDate,
        formatDateDisplay,
        daysUntil,
        getWeekStart,
        setEntryConfidence,
        getConfidenceAnalysis,
        getWeakAreaTopics
    };
})();
