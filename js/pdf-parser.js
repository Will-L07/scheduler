/* ===== PDF PARSER =====
 * Handles PDF upload, text extraction via pdf.js CDN, and schedule creation.
 */

const PdfParser = (() => {
    let pdfjsLib = null;
    let extractedText = '';

    function init() {
        setupUploadZone();
        setupStepNavigation();
        setupManualEntries();
        loadPdfJs();
    }

    // ---- Load pdf.js from CDN ----
    async function loadPdfJs() {
        try {
            // Load pdf.js via script tag (non-module approach for compatibility)
            if (window.pdfjsLib) {
                pdfjsLib = window.pdfjsLib;
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib = window.pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('pdf.js loaded successfully');
            };
            script.onerror = () => {
                console.warn('Could not load pdf.js from CDN. PDF import will use fallback.');
            };
            document.head.appendChild(script);
        } catch (e) {
            console.warn('pdf.js loading failed:', e);
        }
    }

    // ---- Upload Zone ----
    function setupUploadZone() {
        const zone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('pdfFileInput');

        zone.addEventListener('click', () => fileInput.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && (file.type === 'application/pdf' || file.name.endsWith('.json'))) {
                handleFile(file);
            } else {
                App.showToast('Please upload a PDF or JSON file.', 'warning');
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
            fileInput.value = '';
        });
    }

    // ---- Handle uploaded file ----
    async function handleFile(file) {
        // JSON files: import directly as schedule data
        if (file.name.endsWith('.json')) {
            return handleJsonFile(file);
        }

        App.showToast('Processing PDF...', 'info');

        try {
            const arrayBuffer = await file.arrayBuffer();

            if (pdfjsLib) {
                // Use pdf.js to extract text
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
                }

                extractedText = fullText;
            } else {
                // Fallback: just show file info
                extractedText = `[PDF file: ${file.name}, ${(file.size / 1024).toFixed(1)} KB]\n\nPDF.js could not be loaded. Please manually enter your schedule entries below, or paste the text content of your PDF here.`;
            }

            document.getElementById('extractedText').value = extractedText;
            showStep(2);
            App.showToast('PDF text extracted!', 'success');
        } catch (e) {
            console.error('PDF processing error:', e);
            App.showToast('Error processing PDF. Try pasting the text manually.', 'error');
            extractedText = '';
            document.getElementById('extractedText').value = '';
            showStep(2);
        }
    }

    // ---- Handle JSON schedule file ----
    async function handleJsonFile(file) {
        try {
            const text = await file.text();
            const success = DataStore.importAll(text);
            if (success) {
                const data = JSON.parse(text);
                const count = (data.schedules || []).reduce((sum, s) => sum + (s.entries || []).length, 0);
                const names = (data.schedules || []).map(s => s.name).join(', ');
                App.refresh();
                App.showToast(`Imported "${names}" with ${count} entries!`, 'success');
                App.switchView('schedules');
            } else {
                App.showToast('Invalid JSON format. Needs a "schedules" array.', 'error');
            }
        } catch (e) {
            console.error('JSON import error:', e);
            App.showToast('Error reading JSON file.', 'error');
        }
    }

    // ---- Step navigation ----
    function setupStepNavigation() {
        document.getElementById('importBack1').addEventListener('click', () => showStep(1));
        document.getElementById('importNext2').addEventListener('click', () => {
            extractedText = document.getElementById('extractedText').value;
            showStep(3);
            // Auto-fill name from first line if possible
            const firstLine = extractedText.split('\n').find(l => l.trim() && !l.startsWith('---'));
            if (firstLine) {
                document.getElementById('importName').value = firstLine.trim().substring(0, 60);
            }
        });
        document.getElementById('importBack2').addEventListener('click', () => showStep(2));
        document.getElementById('importSave').addEventListener('click', saveImportedSchedule);
    }

    function showStep(step) {
        document.getElementById('importStep1').classList.toggle('hidden', step !== 1);
        document.getElementById('importStep2').classList.toggle('hidden', step !== 2);
        document.getElementById('importStep3').classList.toggle('hidden', step !== 3);
    }

    // ---- Manual entries ----
    function setupManualEntries() {
        document.getElementById('addManualEntry').addEventListener('click', addManualEntryRow);
    }

    function addManualEntryRow() {
        const container = document.getElementById('importEntries');
        const entryId = DataStore.generateId();

        const div = document.createElement('div');
        div.className = 'manual-entry';
        div.dataset.entryId = entryId;
        div.innerHTML = `
            <input type="date" class="form-input" data-field="date" placeholder="Date">
            <input type="text" class="form-input" data-field="subject" placeholder="Subject (e.g., Physics)">
            <input type="text" class="form-input full-width" data-field="topic" placeholder="Topic / Description">
            <input type="text" class="form-input" data-field="duration" placeholder="Duration (e.g., 1h)">
            <input type="text" class="form-input" data-field="taskFocus" placeholder="Focus / Details">
            <div class="manual-entry-remove">
                <button class="btn btn-sm btn-danger" onclick="this.closest('.manual-entry').remove()">Remove</button>
            </div>
        `;
        container.appendChild(div);
    }

    // ---- Save imported schedule ----
    function saveImportedSchedule() {
        const name = document.getElementById('importName').value.trim();
        if (!name) {
            App.showToast('Please enter a schedule name.', 'warning');
            return;
        }

        const type = document.getElementById('importType').value;
        const color = document.getElementById('importColor').value;

        // Collect manual entries
        const entries = [];
        document.querySelectorAll('#importEntries .manual-entry').forEach(div => {
            const date = div.querySelector('[data-field="date"]').value;
            const subject = div.querySelector('[data-field="subject"]').value.trim();
            const topic = div.querySelector('[data-field="topic"]').value.trim();
            const duration = div.querySelector('[data-field="duration"]').value.trim();
            const taskFocus = div.querySelector('[data-field="taskFocus"]').value.trim();

            if (subject || topic) {
                entries.push({
                    id: DataStore.generateId(),
                    date: date || null,
                    dayOfWeek: null,
                    block: entries.length + 1,
                    subject: subject || 'General',
                    topic: topic || subject,
                    duration: duration || '-',
                    taskFocus: taskFocus || '',
                    completed: false,
                    completedAt: null,
                    notes: ''
                });
            }
        });

        const schedule = {
            name,
            type,
            color,
            phases: [],
            exams: [],
            entries,
            rawText: extractedText
        };

        DataStore.addSchedule(schedule);

        // Reset form
        showStep(1);
        document.getElementById('importName').value = '';
        document.getElementById('importEntries').innerHTML = '';
        extractedText = '';

        App.showToast(`Schedule "${name}" created with ${entries.length} entries!`, 'success');
        App.switchView('schedules');
    }

    return { init };
})();
