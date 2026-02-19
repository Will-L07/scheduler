/* ===== SEED DATA =====
 * Pre-populates William's revision timetable and hiking training plan.
 * Only runs on first load (checks DataStore.isSeeded()).
 */

const SeedData = (() => {

    function seed() {
        if (DataStore.isSeeded()) {
            // Migrate existing recurring entries that lack completedDates
            migrateRecurringEntries();
            return;
        }

        DataStore.addSchedule(buildRevisionSchedule());
        DataStore.addSchedule(buildHikingSchedule());
        DataStore.markSeeded();
        console.log('Seed data loaded.');
    }

    // Add completedDates/notesByDate to any recurring entries missing them
    function migrateRecurringEntries() {
        const schedules = DataStore.getSchedules();
        let changed = false;
        schedules.forEach(schedule => {
            schedule.entries.forEach(entry => {
                if (entry.dayOfWeek && !entry.completedDates) {
                    entry.completedDates = [];
                    entry.notesByDate = {};
                    changed = true;
                }
            });
        });
        if (changed) {
            DataStore.saveSchedules(schedules);
            console.log('Migrated recurring entries to per-date tracking.');
        }
    }

    // ============================
    // REVISION TIMETABLE
    // ============================
    function buildRevisionSchedule() {
        const entries = [];
        let idCounter = 0;
        const rid = () => 'rev-' + (++idCounter);

        // Helper to add a dated entry
        function add(date, block, subject, topic, duration, taskFocus) {
            entries.push({
                id: rid(), date, dayOfWeek: null, block,
                subject, topic, duration, taskFocus,
                completed: false, completedAt: null, notes: ''
            });
        }

        // ---- WEEK 1: 9-15 Feb ----
        add('2026-02-09', 1, 'AS FM', 'CP1 Ch1 - Complex numbers basics', '1h', 'i notation, a+bi form, operations');
        add('2026-02-09', 2, 'AS FM', 'CP1 Ch1 - Complex conjugates', '1h', 'Conjugates, division');
        add('2026-02-09', 3, 'Maths', 'Proof 7.4 - Deduction', '45m', 'Proof by deduction');
        add('2026-02-09', 4, 'Python', 'HTML/Python', '45m', 'Continue basics');

        add('2026-02-10', 1, 'Physics', 'Circuits - Basics', '1h', 'Current, voltage, resistance');
        add('2026-02-10', 2, 'Physics', 'Circuits - Series/parallel', '1h', 'Circuit calculations');

        add('2026-02-11', 1, 'AS FM', 'CP1 Ch2 - Argand diagrams', '1h', 'Plotting complex numbers');
        add('2026-02-11', 2, 'AS FM', 'CP1 Ch2 - Modulus/argument', '1h', 'r(cos\u03B8 + isin\u03B8) form');
        add('2026-02-11', 3, 'Maths', 'Stats Ch1 - Sampling', '45m', 'Sampling methods');
        add('2026-02-11', 4, 'Python', 'HTML/Python', '45m', 'Web basics');

        add('2026-02-12', 1, 'Physics', 'Electric fields - Theory', '1h', 'Field strength, Coulomb\'s law');
        add('2026-02-12', 2, 'Physics', 'Electric fields - Calcs', '1h', 'Calculations');

        add('2026-02-13', 1, 'Maths', 'Stats Ch3 - Representation', '1h', 'Histograms, box plots');
        add('2026-02-13', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training assignment');

        add('2026-02-14', 1, 'AS FM', 'D1 Ch1 - Algorithms', '1h', 'Bubble sort, quick sort');
        add('2026-02-14', 2, 'AS FM', 'D1 Ch1 - Bin packing', '1h', 'First-fit, full-bin');
        add('2026-02-14', 3, 'Review', 'Week review', '30m', 'Review all topics');

        add('2026-02-15', 1, 'AS FM', 'CP1 Ch1-2 practice', '1.5h', 'Complex numbers mixed');
        add('2026-02-15', 2, 'AS FM', 'D1 practice', '30m', 'Algorithm problems');
        add('2026-02-15', 3, 'Physics', 'Magnetic fields - Theory', '1.5h', 'Flux density, forces');
        add('2026-02-15', 4, 'Physics', 'Magnetic fields - Practice', '1h', 'Calculations');
        add('2026-02-15', 5, 'Python', 'Practice', '30m', 'Continue');

        // ---- WEEK 2: 16-22 Feb ----
        add('2026-02-16', 1, 'AS FM', 'CP1 Ch6 - Matrices basics', '1h', 'Matrix operations, multiplication');
        add('2026-02-16', 2, 'AS FM', 'CP1 Ch6 - Determinants & inverses', '1h', 'Finding inverses');
        add('2026-02-16', 3, 'Maths', 'Pure - Algebra & functions', '45m', 'Review core algebra');
        add('2026-02-16', 4, 'Python', 'HTML/Python', '45m', 'Continue learning');

        add('2026-02-17', 1, 'Physics', 'Fields - Gravitational theory', '1h', 'Newton\'s law of gravitation');
        add('2026-02-17', 2, 'Physics', 'Fields - Gravitational calcs', '1h', 'Field strength calculations');

        add('2026-02-18', 1, 'AS FM', 'CP1 Ch4 - Roots of polynomials', '1h', 'Sum/product of roots');
        add('2026-02-18', 2, 'AS FM', 'CP1 Ch4 - Substitutions', '1h', 'New equations from roots');
        add('2026-02-18', 3, 'Maths', 'Stats Ch2 - Measures of location', '45m', 'Mean, median, quartiles');
        add('2026-02-18', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-02-19', 1, 'Physics', 'Fields - Electric potential', '1h', 'Potential, equipotentials');
        add('2026-02-19', 2, 'Physics', 'Fields - Capacitance intro', '1h', 'Capacitor basics');

        add('2026-02-20', 1, 'Maths', 'Pure - Coordinate geometry', '1h', 'Circles, straight lines');
        add('2026-02-20', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training assignment');

        add('2026-02-21', 1, 'AS FM', 'D1 Ch2 - MST (Kruskal)', '1h', 'Minimum spanning trees');
        add('2026-02-21', 2, 'AS FM', 'D1 Ch2 - MST (Prim)', '1h', 'Prim\'s algorithm');
        add('2026-02-21', 3, 'Review', 'Week review', '30m', 'Review all topics');

        add('2026-02-22', 1, 'AS FM', 'CP1 Ch4,6 practice', '1.5h', 'Roots & matrices mixed');
        add('2026-02-22', 2, 'AS FM', 'M1 Ch1 - Momentum', '1h', 'Impulse, conservation');
        add('2026-02-22', 3, 'Physics', 'Nuclear physics - Theory', '1.5h', 'Radioactive decay, half-life');
        add('2026-02-22', 4, 'Python', 'Practice', '30m', 'Continue');

        // ---- WEEK 3: 23 Feb - 1 Mar ----
        add('2026-02-23', 1, 'AS FM', 'CP1 Ch7 - Linear transformations', '1h', 'Matrix transformations');
        add('2026-02-23', 2, 'AS FM', 'CP1 Ch7 - Composite transformations', '1h', 'Combining transformations');
        add('2026-02-23', 3, 'Maths', 'Pure - Sequences & series', '45m', 'Arithmetic, geometric series');
        add('2026-02-23', 4, 'Python', 'HTML/Python', '45m', 'Continue');

        add('2026-02-24', 1, 'Physics', 'SHM - Theory', '1h', 'Simple harmonic motion basics');
        add('2026-02-24', 2, 'Physics', 'SHM - Equations', '1h', 'Displacement, velocity, acceleration');

        add('2026-02-25', 1, 'AS FM', 'CP1 Ch9 - 3D Vectors', '1h', 'Vector equations of lines');
        add('2026-02-25', 2, 'AS FM', 'CP1 Ch9 - Scalar product', '1h', 'Dot product, angles');
        add('2026-02-25', 3, 'Maths', 'Stats - Probability', '45m', 'Probability rules');
        add('2026-02-25', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-02-26', 1, 'Physics', 'SHM - Energy & damping', '1h', 'Energy in SHM');
        add('2026-02-26', 2, 'Physics', 'SHM - Practice', '1h', 'Mixed SHM problems');

        add('2026-02-27', 1, 'Maths', 'Pure - Trigonometry', '1h', 'Trig identities');
        add('2026-02-27', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training assignment');

        add('2026-02-28', 1, 'AS FM', 'D1 Ch3 - Dijkstra\'s algorithm', '1h', 'Shortest path');
        add('2026-02-28', 2, 'AS FM', 'D1 Ch3 - Route inspection', '1h', 'Chinese postman');
        add('2026-02-28', 3, 'Review', 'Week review', '30m', 'Review all topics');

        add('2026-03-01', 1, 'AS FM', 'CP1 Ch7,9 practice', '1.5h', 'Transformations & vectors');
        add('2026-03-01', 2, 'AS FM', 'M1 Ch2 - Work, energy, power', '1h', 'Energy methods');
        add('2026-03-01', 3, 'Physics', 'Thermal physics - Theory', '1.5h', 'Specific heat, ideal gas');
        add('2026-03-01', 4, 'Python', 'Practice', '30m', 'Continue');

        // ---- WEEK 4: 2-8 Mar ----
        add('2026-03-02', 1, 'AS FM', 'D1 Ch8 - Critical path analysis', '1h', 'Activity networks');
        add('2026-03-02', 2, 'AS FM', 'D1 Ch8 - Gantt charts', '1h', 'Scheduling, float');
        add('2026-03-02', 3, 'Maths', 'Pure - Differentiation', '45m', 'Chain, product, quotient rules');
        add('2026-03-02', 4, 'Python', 'HTML/Python', '45m', 'Continue');

        add('2026-03-03', 1, 'Physics', 'Particle physics - Theory', '1h', 'Standard model, quarks');
        add('2026-03-03', 2, 'Physics', 'Particle physics - Practice', '1h', 'Conservation laws');

        add('2026-03-04', 1, 'AS FM', 'CP1 Ch3 - Series', '1h', 'Summation formulae');
        add('2026-03-04', 2, 'AS FM', 'CP1 Ch5 - Volumes of revolution', '1h', 'Integration volumes');
        add('2026-03-04', 3, 'Maths', 'Stats - Binomial distribution', '45m', 'Binomial calculations');
        add('2026-03-04', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-03-05', 1, 'Physics', 'Waves - Interference', '1h', 'Superposition, Young\'s slits');
        add('2026-03-05', 2, 'Physics', 'Waves - Diffraction', '1h', 'Diffraction gratings');

        add('2026-03-06', 1, 'Maths', 'Pure - Integration', '1h', 'Integration techniques');
        add('2026-03-06', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training assignment');

        add('2026-03-07', 1, 'AS FM', 'CP1 Ch8 - Proof by induction', '1h', 'Mathematical induction');
        add('2026-03-07', 2, 'AS FM', 'D1 review', '1h', 'All D1 algorithms');
        add('2026-03-07', 3, 'Review', 'Full week review', '30m', 'Review all topics');

        add('2026-03-08', 1, 'AS FM', 'CP1 full practice', '2h', 'Mixed CP1 problems');
        add('2026-03-08', 2, 'AS FM', 'M1 Ch3 - Collisions', '1h', 'Elastic & inelastic');
        add('2026-03-08', 3, 'Physics', 'Materials & waves', '1.5h', 'Stress, strain, Young\'s modulus');
        add('2026-03-08', 4, 'Python', 'Practice', '30m', 'Continue');

        // ---- WEEKS 5-7: 9-26 Mar (continuation of Phase 1) ----
        // Week 5
        add('2026-03-09', 1, 'AS FM', 'CP1 Review - Complex numbers', '1h', 'Ch1-2 revision');
        add('2026-03-09', 2, 'AS FM', 'CP1 Review - Roots & matrices', '1h', 'Ch4,6 revision');
        add('2026-03-09', 3, 'Maths', 'Pure - Exponentials & logs', '45m', 'e^x, ln rules');
        add('2026-03-09', 4, 'Python', 'Project work', '45m', 'Continue');

        add('2026-03-10', 1, 'Physics', 'Circuits - Kirchhoff\'s laws', '1h', 'Loop & junction rules');
        add('2026-03-10', 2, 'Physics', 'Circuits - Practice problems', '1h', 'Mixed circuits');

        add('2026-03-11', 1, 'AS FM', 'D1 Ch4 - Linear programming', '1h', 'Graphical method');
        add('2026-03-11', 2, 'AS FM', 'D1 Ch6 - Matchings', '1h', 'Bipartite graphs');
        add('2026-03-11', 3, 'Maths', 'Stats - Normal distribution', '45m', 'Z-values, tables');
        add('2026-03-11', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-03-12', 1, 'Physics', 'Electric fields - Review', '1h', 'Fields revision');
        add('2026-03-12', 2, 'Physics', 'Magnetic fields - Review', '1h', 'Fields revision');

        add('2026-03-13', 1, 'Maths', 'Mechanics - Kinematics', '1h', 'SUVAT equations');
        add('2026-03-13', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training');

        add('2026-03-14', 1, 'AS FM', 'M1 Ch4 - Elastic strings', '1h', 'Hooke\'s law');
        add('2026-03-14', 2, 'AS FM', 'CP1 mixed practice', '1h', 'Past paper questions');
        add('2026-03-14', 3, 'Review', 'Week review', '30m', 'Review all topics');

        add('2026-03-15', 1, 'AS FM', 'Full CP1 practice paper', '2h', 'Timed practice');
        add('2026-03-15', 2, 'Physics', 'Nuclear - Practice', '1.5h', 'Decay calculations');
        add('2026-03-15', 3, 'Python', 'Practice', '30m', 'Continue');

        // Week 6
        add('2026-03-16', 1, 'AS FM', 'CP1 Weak topics review', '1h', 'Focus on weakest chapters');
        add('2026-03-16', 2, 'AS FM', 'D1 Weak topics review', '1h', 'Focus on weakest algorithms');
        add('2026-03-16', 3, 'Maths', 'Mechanics - Forces', '45m', 'Resolving forces');
        add('2026-03-16', 4, 'Python', 'Project work', '45m', 'Continue');

        add('2026-03-17', 1, 'Physics', 'Gravitational fields - Review', '1h', 'Revision');
        add('2026-03-17', 2, 'Physics', 'SHM - Review', '1h', 'Revision');

        add('2026-03-18', 1, 'AS FM', 'M1 Review', '1h', 'All M1 topics');
        add('2026-03-18', 2, 'AS FM', 'CP1 mixed practice', '1h', 'Past paper questions');
        add('2026-03-18', 3, 'Maths', 'Mechanics - Moments', '45m', 'Moments and equilibrium');
        add('2026-03-18', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-03-19', 1, 'Physics', 'Thermal physics - Review', '1h', 'Revision');
        add('2026-03-19', 2, 'Physics', 'Practice paper', '1h', 'Timed questions');

        add('2026-03-20', 1, 'Maths', 'Mechanics - Friction', '1h', 'Friction problems');
        add('2026-03-20', 2, 'BTEC', 'Unit 8', '1h', 'Fitness training');

        add('2026-03-21', 1, 'AS FM', 'D1 full practice', '1.5h', 'Timed D1 practice');
        add('2026-03-21', 2, 'AS FM', 'M1 full practice', '1h', 'Timed M1 practice');
        add('2026-03-21', 3, 'Review', 'Week review', '30m', 'Review all topics');

        add('2026-03-22', 1, 'AS FM', 'Full Paper 1 mock (CP1)', '2h', 'Timed mock paper');
        add('2026-03-22', 2, 'Physics', 'Particle physics - Review', '1.5h', 'Revision');
        add('2026-03-22', 3, 'Python', 'Practice', '30m', 'Continue');

        // Week 7
        add('2026-03-23', 1, 'AS FM', 'Mock review & corrections', '1h', 'Review CP1 mock');
        add('2026-03-23', 2, 'AS FM', 'Weak topics intensive', '1h', 'Targeted revision');
        add('2026-03-23', 3, 'Maths', 'Pure - Vectors', '45m', 'Vector methods');
        add('2026-03-23', 4, 'Python', 'Project work', '45m', 'Continue');

        add('2026-03-24', 1, 'Physics', 'Waves & optics review', '1h', 'Revision');
        add('2026-03-24', 2, 'Physics', 'Materials review', '1h', 'Revision');

        add('2026-03-25', 1, 'AS FM', 'Full Paper 2 mock (D1+M1)', '2h', 'Timed mock paper');
        add('2026-03-25', 3, 'Maths', 'Stats - Hypothesis testing', '45m', 'Critical values, regions');
        add('2026-03-25', 4, 'Python', 'Practice', '45m', 'Continue');

        add('2026-03-26', 1, 'Physics', 'Full review', '1h', 'Comprehensive revision');
        add('2026-03-26', 2, 'Review', 'Phase 1 complete review', '1h', 'Overview of all work');

        // ---- EASTER BREAK: 27 Mar - 13 Apr (NO REVISION) ----

        // ---- PHASE 2: WEEK 8: 14-20 Apr ----
        add('2026-04-14', 1, 'AS FM', 'CP1 Weak topics - Complex numbers', '1.5h', 'Ch1,2 intensive');
        add('2026-04-14', 2, 'AS FM', 'CP1 Weak topics - Roots', '1h', 'Ch4 intensive');
        add('2026-04-14', 3, 'Maths', 'Pure review', '45m', 'Maintain maths');

        add('2026-04-15', 1, 'Physics', 'Circuits comprehensive', '1h', 'Full topic review');
        add('2026-04-15', 2, 'Physics', 'Fields comprehensive', '1h', 'Full topic review');

        add('2026-04-16', 1, 'AS FM', 'CP1 Weak topics - Matrices', '1.5h', 'Ch6,7 intensive');
        add('2026-04-16', 2, 'AS FM', 'D1 Weak topics - Algorithms', '1h', 'Ch1 intensive');
        add('2026-04-16', 3, 'Maths', 'Stats review', '45m', 'Maintain stats');

        add('2026-04-17', 1, 'AS FM', 'M1 Complete - Momentum', '1h', 'Full M1 revision');
        add('2026-04-17', 2, 'AS FM', 'M1 Complete - Energy & collisions', '1h', 'Full M1 revision');

        add('2026-04-18', 1, 'AS FM', 'CP1 Weak topics - Vectors', '1h', 'Ch9 intensive');
        add('2026-04-18', 2, 'Maths', 'Mechanics review', '1h', 'Maintain mechanics');

        add('2026-04-19', 1, 'AS FM', 'D1 Weak topics - MST, Dijkstra', '1.5h', 'Ch2,3 intensive');
        add('2026-04-19', 2, 'AS FM', 'D1 Weak topics - Critical path', '1h', 'Ch8 intensive');
        add('2026-04-19', 3, 'Review', 'Week review', '30m', 'Review progress');

        add('2026-04-20', 1, 'AS FM', 'Full CP1 practice paper', '2h', 'Timed practice');
        add('2026-04-20', 2, 'AS FM', 'M1 practice', '1h', 'Mixed problems');
        add('2026-04-20', 3, 'Physics', 'Practice problems', '1.5h', 'Mixed topic practice');

        // ---- WEEK 9: 21-27 Apr ----
        add('2026-04-21', 1, 'AS FM', 'CP1 intensive - Full paper', '2h', 'Past paper under timed conditions');
        add('2026-04-21', 2, 'AS FM', 'CP1 review & corrections', '1h', 'Mark and review');

        add('2026-04-22', 1, 'Physics', 'Nuclear & particle', '1h', 'Review');
        add('2026-04-22', 2, 'Physics', 'Thermal & SHM', '1h', 'Review');

        add('2026-04-23', 1, 'AS FM', 'D1 + M1 intensive', '2h', 'Mixed Paper 2 practice');
        add('2026-04-23', 2, 'AS FM', 'D1 + M1 review', '1h', 'Mark and review');

        add('2026-04-24', 1, 'AS FM', 'CP1 practice paper 2', '2h', 'Another timed paper');
        add('2026-04-24', 2, 'Maths', 'Maintain - Pure', '45m', 'Keep skills sharp');

        add('2026-04-25', 1, 'AS FM', 'Weak topics final push', '1.5h', 'Target remaining weaknesses');
        add('2026-04-25', 2, 'Maths', 'Maintain - Stats', '1h', 'Keep skills sharp');

        add('2026-04-26', 1, 'AS FM', 'D1+M1 practice paper', '2h', 'Timed Paper 2 mock');
        add('2026-04-26', 2, 'AS FM', 'Review & corrections', '1h', 'Mark and review');
        add('2026-04-26', 3, 'Review', 'Week review', '30m', 'Review progress');

        add('2026-04-27', 1, 'AS FM', 'Full CP1 final practice', '2h', 'Final timed practice');
        add('2026-04-27', 2, 'AS FM', 'Full D1+M1 final practice', '2h', 'Final timed practice');
        add('2026-04-27', 3, 'Physics', 'Mixed practice', '1h', 'Keep physics ticking');

        // ---- WEEK 10: 28 Apr - 4 May ----
        add('2026-04-28', 1, 'AS FM', 'CP1 final review - Complex & roots', '1.5h', 'Ch1,2,4 polish');
        add('2026-04-28', 2, 'AS FM', 'CP1 final review - Matrices & transforms', '1h', 'Ch6,7 polish');

        add('2026-04-29', 1, 'AS FM', 'CP1 final review - Series, volumes, induction', '1.5h', 'Ch3,5,8 polish');
        add('2026-04-29', 2, 'AS FM', 'CP1 final review - Vectors', '1h', 'Ch9 polish');

        add('2026-04-30', 1, 'AS FM', 'D1 final review - All algorithms', '1.5h', 'D1 polish');
        add('2026-04-30', 2, 'AS FM', 'M1 final review - All topics', '1h', 'M1 polish');

        add('2026-05-01', 1, 'AS FM', 'CP1 practice paper (final)', '2h', 'Last timed practice');

        add('2026-05-02', 1, 'AS FM', 'D1+M1 practice paper (final)', '2h', 'Last timed practice');

        add('2026-05-03', 1, 'AS FM', 'Light review - CP1 formula sheet', '1h', 'Review key formulae');
        add('2026-05-03', 2, 'AS FM', 'Light review - D1 algorithms', '1h', 'Review algorithms');

        add('2026-05-04', 1, 'AS FM', 'Light review before exam week', '1h', 'Gentle revision, early night');

        // ---- WEEK 11: 5-11 May (EXAM WEEK) ----
        add('2026-05-05', 1, 'AS FM', 'CP1 final formulae review', '1h', 'Last look before exam');
        add('2026-05-06', 1, 'AS FM', 'CP1 light review', '45m', 'Key topics only');
        add('2026-05-07', 1, 'AS FM', 'CP1 quick recap', '30m', 'Final recap');
        add('2026-05-08', 1, 'AS FM', 'Rest / light notes', '30m', 'Stay calm, review notes');
        add('2026-05-09', 1, 'AS FM', 'CP1 final prep', '30m', 'Formulae and key methods');
        // Mon 11 May: AS FM Paper 1 (CP1) - PM
        add('2026-05-12', 1, 'AS FM', 'D1+M1 intensive review', '2h', 'Review for Paper 2');
        add('2026-05-13', 1, 'AS FM', 'D1+M1 practice', '1.5h', 'Final practice');
        add('2026-05-14', 1, 'AS FM', 'D1+M1 final prep', '1h', 'Last review');
        // Fri 15 May: AS FM Paper 2 (D1+M1) - PM

        // ---- PHASE 3: Physics Intensive (16 May - 8 Jun) ----
        add('2026-05-16', 1, 'Physics', 'Circuits full review', '2h', 'Complete circuits revision');
        add('2026-05-16', 2, 'Physics', 'Electric fields review', '1.5h', 'Complete E-fields revision');

        add('2026-05-17', 1, 'Physics', 'Magnetic fields review', '2h', 'Complete B-fields revision');
        add('2026-05-17', 2, 'Physics', 'Gravitational fields review', '1.5h', 'Complete G-fields revision');

        add('2026-05-18', 1, 'Physics', 'Nuclear physics review', '2h', 'Complete nuclear revision');
        add('2026-05-18', 2, 'Physics', 'Particle physics review', '1.5h', 'Complete particle revision');

        add('2026-05-19', 1, 'Physics', 'Thermal physics review', '2h', 'Complete thermal revision');
        add('2026-05-19', 2, 'Physics', 'Paper 1 practice', '1.5h', 'Timed practice');
        // Wed 20 May: Physics Paper 1 - PM

        add('2026-05-21', 1, 'Physics', 'Paper 1 review', '1h', 'Reflect on Paper 1');
        add('2026-05-21', 2, 'Physics', 'Materials review', '1.5h', 'Stress, strain, Young\'s modulus');

        add('2026-05-22', 1, 'Physics', 'Waves & optics', '2h', 'Full waves revision');
        add('2026-05-22', 2, 'Physics', 'SHM review', '1.5h', 'Full SHM revision');

        add('2026-05-23', 1, 'Physics', 'Space & astrophysics', '2h', 'If applicable');
        add('2026-05-23', 2, 'Physics', 'Paper 2 practice', '1.5h', 'Timed practice');

        add('2026-05-24', 1, 'Physics', 'Paper 2 review & weak topics', '2h', 'Target weaknesses');

        add('2026-05-25', 1, 'Physics', 'Mixed practice paper', '2h', 'Full timed paper');
        add('2026-05-25', 2, 'Maths', 'Maintain pure maths', '1h', 'Keep skills sharp');

        add('2026-05-26', 1, 'Physics', 'Paper 2 final review', '2h', 'Last major review');
        add('2026-05-27', 1, 'Physics', 'Paper 2 final review', '1.5h', 'Key topics');
        add('2026-05-28', 1, 'Physics', 'Paper 2 light review', '1h', 'Formulae review');
        add('2026-05-29', 1, 'Physics', 'Paper 2 final prep', '1h', 'Calm review');
        add('2026-05-30', 1, 'Physics', 'Rest / light notes', '30m', 'Stay calm');
        add('2026-05-31', 1, 'Physics', 'Paper 2 final prep', '30m', 'Last look');
        // Mon 1 Jun: Physics Paper 2 - AM

        add('2026-06-01', 2, 'Maths', 'Pure maths intensive begins', '2h', 'Paper 1 prep starts');
        add('2026-06-02', 1, 'Maths', 'Pure 1 - Algebra & functions', '2h', 'Full revision');
        add('2026-06-02', 2, 'Physics', 'Synoptic prep', '1.5h', 'Paper 3 connections');

        // Wed 3 Jun: Maths Paper 1 (Pure 1) - PM

        add('2026-06-04', 1, 'Physics', 'Synoptic practice paper', '2h', 'Paper 3 prep');
        add('2026-06-04', 2, 'Maths', 'Pure 2 review begins', '1.5h', 'Start Pure 2');

        add('2026-06-05', 1, 'Physics', 'Synoptic review', '2h', 'Cross-topic practice');
        add('2026-06-05', 2, 'Maths', 'Pure 2 - Trig & further algebra', '1.5h', 'Key topics');

        add('2026-06-06', 1, 'Physics', 'Synoptic final prep', '1.5h', 'Last review');
        add('2026-06-06', 2, 'Maths', 'Pure 2 - Calculus methods', '1.5h', 'Differentiation & integration');

        add('2026-06-07', 1, 'Physics', 'Paper 3 final prep', '1h', 'Formulae, light review');
        add('2026-06-07', 2, 'Maths', 'Pure 2 review', '1.5h', 'Continue Pure 2');
        // Mon 8 Jun: Physics Paper 3 (Synoptic) - AM

        // ---- PHASE 4: Maths Intensive (2 Jun - 18 Jun) ----
        add('2026-06-08', 2, 'Maths', 'Pure 2 intensive', '3h', 'Full Pure 2 revision');

        add('2026-06-09', 1, 'Maths', 'Pure 2 practice paper', '2h', 'Timed practice');
        add('2026-06-09', 2, 'Maths', 'Pure 2 review & corrections', '1.5h', 'Mark and review');

        add('2026-06-10', 1, 'Maths', 'Pure 2 final prep', '1.5h', 'Last review');
        // Thu 11 Jun: Maths Paper 2 (Pure 2) - PM

        add('2026-06-12', 1, 'Maths', 'Stats - Full revision', '2h', 'Complete stats review');
        add('2026-06-12', 2, 'Maths', 'Mechanics - Full revision', '2h', 'Complete mechanics review');

        add('2026-06-13', 1, 'Maths', 'Stats & Mechanics practice paper', '2h', 'Timed practice');
        add('2026-06-13', 2, 'Maths', 'Large Data Set revision', '1h', 'Data set practice');

        add('2026-06-14', 1, 'Maths', 'Stats & Mech review & corrections', '2h', 'Mark and review');

        add('2026-06-15', 1, 'Maths', 'Stats & Mechanics - weak topics', '2h', 'Target weaknesses');
        add('2026-06-15', 2, 'Maths', 'Large Data Set final review', '1h', 'Last look');

        add('2026-06-16', 1, 'Maths', 'Stats & Mechanics - final practice', '2h', 'Last timed practice');

        add('2026-06-17', 1, 'Maths', 'Paper 3 final prep', '1h', 'Formulae, calm review');
        // Thu 18 Jun: Maths Paper 3 (Stats & Mech) - PM - FINAL EXAM!

        return {
            id: 'rev-2026',
            name: 'Revision Timetable',
            type: 'revision',
            color: '#4A90D9',
            phases: [
                { name: 'Phase 1: Foundation Building', startDate: '2026-02-09', endDate: '2026-03-26' },
                { name: 'Easter Break (No Revision)', startDate: '2026-03-27', endDate: '2026-04-13' },
                { name: 'Phase 2: AS FM Intensive', startDate: '2026-04-14', endDate: '2026-05-15' },
                { name: 'Phase 3: Physics Intensive', startDate: '2026-05-16', endDate: '2026-06-08' },
                { name: 'Phase 4: Maths Intensive', startDate: '2026-06-02', endDate: '2026-06-18' }
            ],
            exams: [
                { name: 'AS FM Paper 1 (CP1)', date: '2026-05-11', session: 'PM' },
                { name: 'AS FM Paper 2 (D1+M1)', date: '2026-05-15', session: 'PM' },
                { name: 'Physics Paper 1', date: '2026-05-20', session: 'PM' },
                { name: 'Physics Paper 2', date: '2026-06-01', session: 'AM' },
                { name: 'Maths Paper 1 (Pure 1)', date: '2026-06-03', session: 'PM' },
                { name: 'Physics Paper 3 (Synoptic)', date: '2026-06-08', session: 'AM' },
                { name: 'Maths Paper 2 (Pure 2)', date: '2026-06-11', session: 'PM' },
                { name: 'Maths Paper 3 (Stats & Mech)', date: '2026-06-18', session: 'PM' }
            ],
            entries,
            createdAt: '2026-02-09T00:00:00.000Z'
        };
    }

    // ============================
    // HIKING TRAINING PLAN
    // ============================
    function buildHikingSchedule() {
        const entries = [];
        let idCounter = 0;
        const hid = () => 'hike-' + (++idCounter);

        // Recurring weekly entries (dayOfWeek based)
        entries.push({
            id: hid(), date: null, dayOfWeek: 'Monday', block: 1,
            subject: 'Easy Walk', topic: 'Steady comfortable walk', duration: '60m',
            taskFocus: 'Ashford Hill NNR or Headley village loop. Conversational pace, breathing rhythm and posture.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Tuesday', block: 1,
            subject: 'Hill Repeats', topic: 'Hill rep training', duration: '60m',
            taskFocus: 'Goose Hill or steepest local lane. Warm up 10 min, 6-8 hill reps (walk/jog up, walk down), cool down 10 min.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Wednesday', block: 1,
            subject: 'Strength & Core', topic: 'Strength training', duration: '60m',
            taskFocus: 'Squats 3x12, lunges 3x10 each, step-ups 3x10, calf raises 3x15, plank 3x45s, dead bugs 3x10.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Thursday', block: 1,
            subject: 'Brisk Hilly Walk', topic: 'Brisk pace hilly walk', duration: '60m',
            taskFocus: 'Footpaths toward Kingsclere or hilly Headley loop. Raise heart rate, no stopping on uphills.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Friday', block: 1,
            subject: 'Rest', topic: 'Rest day', duration: '-',
            taskFocus: 'Full rest. Light stretching or foam rolling if legs feel tight. Prioritise recovery and revision.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Saturday', block: 1,
            subject: 'Long Walk', topic: 'Long walk - most important session', duration: '60-90m',
            taskFocus: 'Watership Down if possible (walk there = training). Hilliest terrain, steady sustainable pace.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        entries.push({
            id: hid(), date: null, dayOfWeek: 'Sunday', block: 1,
            subject: 'Active Recovery', topic: 'Easy flat walk or light jog', duration: '30-60m',
            taskFocus: 'Ashford Hill NNR flat trails or easy local loop. Genuinely easy - a stroll, not a workout.',
            completed: false, completedAt: null, notes: '',
            completedDates: [], notesByDate: {}
        });

        return {
            id: 'hike-2026',
            name: 'Hiking & Mountaineering Fitness',
            type: 'training',
            color: '#8B5CF6',
            weeklyReset: true,
            phases: [
                { name: 'Phase 1: Foundation', startDate: '2026-02-10', endDate: '2026-03-16' },
                { name: 'Phase 2: Load Up', startDate: '2026-03-17', endDate: '2026-04-19' },
                { name: 'Phase 3: Exam-Light', startDate: '2026-04-20', endDate: '2026-05-31' },
                { name: 'Phase 4: Build Up', startDate: '2026-06-01', endDate: '2026-08-31' }
            ],
            exams: [],
            entries,
            createdAt: '2026-02-10T00:00:00.000Z'
        };
    }

    return { seed };
})();
