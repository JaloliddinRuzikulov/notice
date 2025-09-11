// Broadcast functionality
console.log('[BROADCAST] Script version 1.3.0 loaded');

// HTML escape function to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
}

let currentStep = 1;
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let recordingStartTime = null;
let recordedBlob = null;
let selectedEmployees = new Set();
let ttsAudioFile = null;
let selectedSipAccounts = new Set();
window.selectedSipAccounts = selectedSipAccounts; // Make it globally accessible
let availableSipAccounts = [];
let groups = [];
let allEmployees = []; // Store all employees for counting

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Starting initialization');
    checkSessionStatus();
    console.log('About to show step 1');
    showStep(1);
    console.log('Loading employees, SIP accounts, etc.');
    loadEmployees();
    loadSipAccounts();
    loadGroups();
    loadDistricts();
    loadDepartments();
    
    // Handle broadcast type change
    document.querySelectorAll('input[name="broadcastType"]').forEach(radio => {
        radio.addEventListener('change', handleBroadcastTypeChange);
    });
    
    // Handle recipient type change
    document.querySelectorAll('input[name="recipientType"]').forEach(radio => {
        radio.addEventListener('change', handleRecipientTypeChange);
    });
    
    // SMS character counter for audio messages
    const audioSmsTextarea = document.getElementById('audioSmsMessage');
    const audioSmsCharCount = document.getElementById('audioSmsCharCount');
    if (audioSmsTextarea) {
        audioSmsTextarea.addEventListener('input', () => {
            const length = audioSmsTextarea.value.length;
            audioSmsCharCount.textContent = length;
            if (length > 140) {
                audioSmsCharCount.style.color = '#dc3545';
            } else {
                audioSmsCharCount.style.color = '#6c757d';
            }
        });
    }
    
    // Session check button
    const checkSessionBtn = document.getElementById('checkSession');
    if (checkSessionBtn) {
        checkSessionBtn.addEventListener('click', checkSessionStatus);
    }
    
    // Add event listeners for buttons (replacing inline handlers)
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }
    
    const deleteRecordingBtn = document.querySelector('.btn-delete');
    if (deleteRecordingBtn) {
        deleteRecordingBtn.addEventListener('click', deleteRecording);
    }
    
    const fileInput = document.getElementById('audioFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    const generateTTSBtn = document.getElementById('generateTTSBtn');
    if (generateTTSBtn) {
        generateTTSBtn.addEventListener('click', generateTTS);
    }
    
    const previewTTSBtn = document.getElementById('previewBtn');
    if (previewTTSBtn) {
        previewTTSBtn.addEventListener('click', previewTTS);
    }
    
    const acceptTTSBtn = document.getElementById('acceptBtn');
    if (acceptTTSBtn) {
        acceptTTSBtn.addEventListener('click', acceptTTS);
    }
    
    const resetTTSBtn = document.getElementById('resetBtn');
    if (resetTTSBtn) {
        resetTTSBtn.addEventListener('click', resetTTS);
    }
    
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => searchEmployees(e.target.value));
    }
    
    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', previousStep);
    }
    
    const prevBtnStep5 = document.getElementById('prevBtnStep5');
    if (prevBtnStep5) {
        prevBtnStep5.addEventListener('click', previousStep);
    }
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }
    
    const sendBroadcastBtn = document.getElementById('sendBroadcastBtn');
    if (sendBroadcastBtn) {
        sendBroadcastBtn.addEventListener('click', sendBroadcast);
    }
    
    // TTS speed slider for text section
    const speedSlider = document.getElementById('ttsSpeed');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            speedValue.textContent = e.target.value;
        });
    }
    
    // Group selection change listener
    const groupSelect = document.getElementById('groupSelect');
    if (groupSelect) {
        groupSelect.addEventListener('change', updateSelectedCount);
    }
    
    // District selection change listener
    const districtSelect = document.getElementById('districtSelect');
    if (districtSelect) {
        districtSelect.addEventListener('change', updateSelectedCount);
    }
    
    // Department selection change listener
    const departmentSelect = document.getElementById('departmentSelect');
    if (departmentSelect) {
        departmentSelect.addEventListener('change', updateSelectedCount);
    }
    
});

// Check session status
async function checkSessionStatus() {
    // Session status is already handled by the app bar
    // This function is kept for compatibility but does nothing
    return;
}

// Step navigation
window.showStep = function showStep(step) {
    console.log('Showing step ' + step);
    
    // Hide all steps
    const allSteps = document.querySelectorAll('.broadcast-step');
    console.log('Found ' + allSteps.length + ' broadcast steps');
    allSteps.forEach(el => {
        el.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.getElementById('step' + step);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
        console.log('Step ' + step + ' element found and activated');
    } else {
        console.error('Step ' + step + ' element NOT FOUND!');
    }
    
    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index < step - 1) {
            el.classList.add('completed');
        } else if (index === step - 1) {
            el.classList.add('active');
        } else {
            el.classList.remove('active', 'completed');
        }
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').style.display = step > 1 ? 'block' : 'none';
    document.getElementById('nextBtn').style.display = step < 5 ? 'block' : 'none';
    
    currentStep = step;
    
    // Update summary if on step 5
    if (step === 5) {
        updateSummary();
    }
    
    // Trigger recipient type change when showing step 3
    if (step === 3) {
        const selectedType = document.querySelector('input[name="recipientType"]:checked');
        if (selectedType) {
            handleRecipientTypeChange({ target: selectedType });
        }
    }
    
    // Load SIP accounts when showing step 4
    if (step === 4) {
        console.log('🚀 STEP 4 ACTIVATED - Loading SIP accounts...');
        console.log('Current DOM state - step4 element:', document.getElementById('step4'));
        console.log('Current DOM state - sipAccountsList element:', document.getElementById('sipAccountsList'));
        loadSipAccounts();
    }
}

window.nextStep = function nextStep() {
    console.log('nextStep called, currentStep:', currentStep);
    if (currentStep < 5) {
        // Validate current step
        const isValid = validateStep(currentStep);
        console.log('Step validation result:', isValid);
        if (isValid) {
            console.log('Moving to step:', currentStep + 1);
            showStep(currentStep + 1);
        }
    }
}

window.previousStep = function previousStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

function validateStep(step) {
    switch (step) {
        case 1:
            return true; // Type selection is always valid
        case 2:
            // Check if audio is recorded/uploaded or text is entered
            const isAudio = document.querySelector('input[name="broadcastType"]:checked').value === 'audio';
            if (isAudio) {
                if (!recordedBlob && !document.getElementById('audioFile').files.length) {
                    alert('Iltimos, audio yozib oling yoki fayl yuklang!');
                    return false;
                }
            } else {
                if (!document.getElementById('messageText').value.trim() && !ttsAudioFile) {
                    alert('Iltimos, xabar matnini kiriting va audio yarating!');
                    return false;
                }
            }
            return true;
        case 3:
            // Check if recipients are selected
            const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
            
            if (recipientType === 'group') {
                const selectedGroups = Array.from(document.getElementById('groupSelect').selectedOptions);
                if (selectedGroups.length === 0) {
                    alert('Iltimos, kamida bitta guruh tanlang!');
                    return false;
                }
            } else if (recipientType === 'department') {
                const selectedDepts = Array.from(document.getElementById('departmentSelect').selectedOptions);
                if (selectedDepts.length === 0) {
                    alert('Iltimos, kamida bitta bo\'lim tanlang!');
                    return false;
                }
            } else if (recipientType === 'selected') {
                updateSelectedCount();
                if (selectedEmployees.size === 0) {
                    alert('Iltimos, kamida bitta qabul qiluvchini tanlang!');
                    return false;
                }
            }
            return true;
        case 4:
            // Check if SIP accounts are selected
            console.log('Validating step 4...');
            
            // Check checkboxes directly
            const checkedBoxes = document.querySelectorAll('#sipAccountsList input[type="checkbox"]:checked');
            console.log('Checked SIP checkboxes:', checkedBoxes.length);
            
            if (checkedBoxes.length === 0) {
                alert('Iltimos, kamida bitta SIP raqam tanlang!');
                return false;
            }
            
            // Update selectedSipAccounts based on checkboxes
            selectedSipAccounts.clear();
            checkedBoxes.forEach(cb => {
                selectedSipAccounts.add(cb.value);
            });
            window.selectedSipAccounts = selectedSipAccounts;
            
            console.log('Updated selected SIP accounts:', Array.from(selectedSipAccounts));
            
            // Check if SMS message is provided for audio broadcasts
            const isAudioType = document.querySelector('input[name="broadcastType"]:checked').value === 'audio';
            if (isAudioType) {
                const audioSmsMessage = document.getElementById('audioSmsMessage')?.value?.trim();
                if (!audioSmsMessage) {
                    alert('Iltimos, SMS xabar matnini kiriting!');
                    return false;
                }
            }
            // For TTS, the message text itself will be used as SMS
            
            return true;
        default:
            return true;
    }
}

// Handle broadcast type change
function handleBroadcastTypeChange(e) {
    const type = e.target.value;
    console.log('Broadcast type changed to:', type);
    
    const audioSection = document.getElementById('audioSection');
    const textSection = document.getElementById('textSection');
    
    if (audioSection) {
        audioSection.style.display = type === 'audio' ? 'block' : 'none';
    }
    
    if (textSection) {
        textSection.style.display = type === 'text' ? 'block' : 'none';
        
        // Debug: Check if TTS controls exist when showing text section
        if (type === 'text') {
            setTimeout(() => {
                console.log('Checking TTS controls after showing text section:');
                console.log('ttsLanguage:', document.getElementById('ttsLanguage'));
                console.log('ttsSpeed:', document.getElementById('ttsSpeed'));
                console.log('ttsVoice:', document.getElementById('ttsVoice'));
            }, 100);
        }
    }
}

// Handle recipient type change
function handleRecipientTypeChange(e) {
    const type = e.target.value;
    
    // Hide all recipient selection areas
    document.getElementById('departmentSelection').style.display = 'none';
    document.getElementById('districtSelection').style.display = 'none';
    document.getElementById('employeeSelection').style.display = 'none';
    document.getElementById('groupSelection').style.display = 'none';
    
    // Show appropriate selection area
    if (type === 'department') {
        document.getElementById('departmentSelection').style.display = 'block';
    } else if (type === 'district') {
        document.getElementById('districtSelection').style.display = 'block';
    } else if (type === 'group') {
        document.getElementById('groupSelection').style.display = 'block';
    } else if (type === 'selected') {
        document.getElementById('employeeSelection').style.display = 'block';
    } else if (type === 'all') {
        // For 'all', we don't need to show any selection UI
        // Just count all employees
        updateSelectedCount();
    }
    
    updateSelectedCount();
}

// Audio recording
async function toggleRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        await startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(recordedBlob);
            
            // Show audio preview
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = audioUrl;
            document.getElementById('audioPreview').style.display = 'block';
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        // Update UI
        document.getElementById('recordBtn').innerHTML = '<i class="fas fa-stop"></i> Yozishni to\'xtatish';
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('recordingTimer').style.display = 'block';
        
        // Start timer
        updateRecordingTimer();
        
    } catch (error) {
        console.error('Recording error:', error);
        alert('Mikrofonga ruxsat berilmadi!');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // Update UI
        document.getElementById('recordBtn').innerHTML = '<i class="fas fa-microphone"></i> Yozishni boshlash';
        document.getElementById('recordBtn').classList.remove('recording');
        document.getElementById('recordingTimer').style.display = 'none';
        
        // Stop timer
        if (recordingTimer) {
            clearInterval(recordingTimer);
        }
    }
}

function updateRecordingTimer() {
    recordingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('recordingTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function deleteRecording() {
    recordedBlob = null;
    document.getElementById('audioPreview').style.display = 'none';
    document.getElementById('audioPlayer').src = '';
}

// File upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const audioUrl = URL.createObjectURL(file);
        document.getElementById('audioPlayer').src = audioUrl;
        document.getElementById('audioPreview').style.display = 'block';
    }
}

// Text-to-Speech
async function generateTTS() {
    console.log('generateTTS called');
    
    // Debug: Check if we're in the right section
    const textSection = document.getElementById('textSection');
    console.log('Text section display:', textSection ? textSection.style.display : 'not found');
    
    const messageText = document.getElementById('messageText').value;
    if (!messageText) {
        alert('Xabar matnini kiriting!');
        return;
    }
    
    // Get TTS settings
    const languageEl = document.getElementById('ttsLanguage');
    const speedEl = document.getElementById('ttsSpeed');
    const voiceEl = document.getElementById('ttsVoice');
    
    console.log('TTS elements:', {
        language: languageEl ? 'found' : 'not found',
        speed: speedEl ? 'found' : 'not found', 
        voice: voiceEl ? 'found' : 'not found'
    });
    
    if (!languageEl || !speedEl || !voiceEl) {
        console.error('TTS controls not found');
        // Try to find elements in the document
        console.log('All select elements:', document.querySelectorAll('select').length);
        console.log('All elements with id ttsLanguage:', document.querySelectorAll('#ttsLanguage').length);
        alert('TTS sozlamalari topilmadi!');
        return;
    }
    
    const language = languageEl.value;
    const speed = speedEl.value;
    const voice = voiceEl.value;
    
    // Show loading state
    const generateBtn = document.getElementById('generateTTSBtn');
    if (!generateBtn) {
        console.error('Generate button not found');
        return;
    }
    
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yaratilmoqda...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/broadcast/tts', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: messageText,
                language: language,
                speed: parseInt(speed),
                voice: voice
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store the TTS audio filename
            ttsAudioFile = data.filename;
            
            // Update TTS preview
            const ttsPreview = document.getElementById('ttsPreview');
            const ttsAudioPlayer = document.getElementById('ttsAudioPlayer');
            
            // Set audio source
            ttsAudioPlayer.src = `/audio/uploads/${data.filename}`;
            ttsPreview.style.display = 'block';
            
            // Update button states
            document.getElementById('previewBtn').style.display = 'inline-block';
            document.getElementById('acceptBtn').style.display = 'inline-block';
            document.getElementById('resetBtn').style.display = 'inline-block';
            
            // Hide generate button
            generateBtn.style.display = 'none';
            
        } else {
            alert('TTS xatosi: ' + data.message);
        }
    } catch (error) {
        console.error('TTS error:', error);
        alert('TTS xatosi yuz berdi');
    } finally {
        // Restore button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Preview TTS audio
function previewTTS() {
    const audioPlayer = document.getElementById('ttsAudioPlayer');
    if (audioPlayer) {
        audioPlayer.play();
    }
}

// Accept TTS audio
function acceptTTS() {
    // Hide TTS controls and show success message
    const ttsSection = document.getElementById('textSection');
    const messageText = document.getElementById('messageText').value;
    
    // Create accepted message
    const acceptedMessage = document.createElement('div');
    acceptedMessage.className = 'alert alert-success mt-3';
    acceptedMessage.innerHTML = `
        <h5><i class="fas fa-check-circle"></i> Audio tayyor!</h5>
        <p><strong>Asosiy matn:</strong> ${messageText}</p>
        <p><small class="text-muted"><strong>To'liq matn:</strong> Assalomu alaykum. Sizga xabar bor. ${messageText} Xabarni tushungan bo'lsangiz, 1 raqamini bosing.</small></p>
        <p><strong>Til:</strong> ${document.getElementById('ttsLanguage').selectedOptions[0].text}</p>
        <p><strong>Tezlik:</strong> ${document.getElementById('ttsSpeed').value} so'z/daqiqa</p>
        <button class="btn btn-warning btn-sm" id="acceptedResetBtn">
            <i class="fas fa-redo"></i> Qayta yaratish
        </button>
    `;
    
    // Replace TTS controls with accepted message
    const ttsSettings = ttsSection.querySelector('.tts-settings');
    const ttsActions = ttsSection.querySelector('.tts-actions');
    const ttsPreview = document.getElementById('ttsPreview');
    
    if (ttsSettings) ttsSettings.style.display = 'none';
    if (ttsActions) ttsActions.style.display = 'none';
    if (ttsPreview) ttsPreview.style.display = 'none';
    
    // Add accepted message
    ttsSection.appendChild(acceptedMessage);
    
    // Add event listener for the reset button
    const acceptedResetBtn = document.getElementById('acceptedResetBtn');
    if (acceptedResetBtn) {
        acceptedResetBtn.addEventListener('click', resetTTS);
    }
    
    // Disable text input
    document.getElementById('messageText').disabled = true;
}

// Reset TTS to start over
function resetTTS() {
    // Clear TTS audio file
    ttsAudioFile = null;
    
    // Show all controls again
    const ttsSection = document.getElementById('textSection');
    const ttsSettings = ttsSection.querySelector('.tts-settings');
    const ttsActions = ttsSection.querySelector('.tts-actions');
    const ttsPreview = document.getElementById('ttsPreview');
    
    if (ttsSettings) ttsSettings.style.display = 'block';
    if (ttsActions) ttsActions.style.display = 'block';
    if (ttsPreview) ttsPreview.style.display = 'none';
    
    // Remove accepted message if exists
    const acceptedMessage = ttsSection.querySelector('.alert-success');
    if (acceptedMessage) {
        acceptedMessage.remove();
    }
    
    // Reset button states
    const generateBtn = document.getElementById('generateTTSBtn');
    if (generateBtn) {
        generateBtn.style.display = 'inline-block';
    }
    
    document.getElementById('previewBtn').style.display = 'none';
    document.getElementById('acceptBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'none';
    
    // Enable text input
    document.getElementById('messageText').disabled = false;
    
    // Clear audio player
    const ttsAudioPlayer = document.getElementById('ttsAudioPlayer');
    if (ttsAudioPlayer) {
        ttsAudioPlayer.src = '';
    }
}

// Employee management
async function loadEmployees() {
    console.log('[loadEmployees] Starting...');
    console.log('[loadEmployees] Current user:', window.currentUser);
    
    try {
        // Try the working employees endpoint first
        const response = await fetch('/api/employees', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log('[loadEmployees] API response status:', response.status);
        
        let employees = [];
        
        if (!response.ok) {
            console.error('[loadEmployees] API failed, trying fallback to JSON file');
            // If API fails, try loading employees from other sources
            try {
                const [empResponse, distResponse] = await Promise.all([
                    fetch('/employees-broadcast.json'), // Direct JSON file
                    fetch('/districts.json')
                ]);
                
                console.log('[loadEmployees] Fallback responses:', {
                    employees: empResponse.status,
                    districts: distResponse.status
                });
                
                if (empResponse.ok) {
                    employees = await empResponse.json(); // Direct array of employees
                    console.log('[loadEmployees] Loaded employees from JSON:', employees.length);
                    
                    // Use user data from window.currentUser
                    if (window.currentUser && window.currentUser.allowedDistricts && !window.currentUser.allowedDistricts.includes('all')) {
                        console.log('Filtering employees for user:', window.currentUser.username, 'with districts:', window.currentUser.allowedDistricts);
                        
                        // Map district IDs to names
                        if (distResponse.ok) {
                            const districts = await distResponse.json();
                            const districtIdToName = {};
                            districts.forEach(d => {
                                districtIdToName[d.id] = d.name;
                            });
                            
                            const allowedDistrictNames = window.currentUser.allowedDistricts.map(id => 
                                districtIdToName[id] || id
                            );
                            
                            console.log('Allowed district names:', allowedDistrictNames);
                            
                            employees = employees.filter(emp => {
                                const match = allowedDistrictNames.includes(emp.district);
                                if (!match) {
                                    console.log(`Employee ${emp.name} with district "${emp.district}" filtered out`);
                                }
                                return match;
                            });
                            
                            console.log('Filtered employees count:', employees.length);
                        }
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return;
            }
        } else {
            const responseData = await response.json();
            console.log('[loadEmployees] API response data:', responseData);
            
            // Handle different response formats
            if (responseData.success && responseData.employees) {
                employees = responseData.employees;
            } else if (Array.isArray(responseData)) {
                employees = responseData;
            } else {
                console.error('[loadEmployees] Unexpected response format:', responseData);
                return;
            }
        }
        
        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);
        
        allEmployees = employees; // Store globally for counting
        
        const employeeList = document.getElementById('employeeList');
        
        if (!employees || employees.length === 0) {
            employeeList.innerHTML = '<div class="text-muted">Xodimlar topilmadi. Agar siz admin bo\'lmasangiz, faqat sizga biriktirilgan tumandagi xodimlar ko\'rinadi.</div>';
            console.log('No employees found in response');
            return;
        }
        
        console.log(`[loadEmployees] Loading ${employees.length} employees into the list`);
        console.log('[loadEmployees] Sample employee:', employees[0]);
        
        employeeList.innerHTML = employees.map(emp => `
            <div class="employee-item">
                <label>
                    <input type="checkbox" value="${escapeHtml(emp.id)}" onchange="toggleEmployee('${escapeHtml(emp.id)}')">
                    <span class="employee-name">${escapeHtml(emp.name)}</span>
                    <span class="employee-info">${escapeHtml(emp.position || emp.rank || '')} - ${escapeHtml(emp.phoneNumber)}</span>
                </label>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Load groups
async function loadGroups() {
    try {
        // Load groups
        const groupsResponse = await fetch('/api/groups-broadcast', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const fetchedGroups = await groupsResponse.json();
        
        // Load employees to calculate group membership
        const employeesResponse = await fetch('/api/employees-broadcast', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        let employees = await employeesResponse.json();
        
        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);
        console.log('Total active employees:', employees.length);
        
        // Calculate member count for each group
        fetchedGroups.forEach(group => {
            // Find employees who belong to this group
            const groupMembers = employees.filter(emp => 
                emp.groups && Array.isArray(emp.groups) && emp.groups.includes(group.id)
            );
            
            group.memberCount = groupMembers.length;
            // Also store member IDs for later use
            group.memberIds = groupMembers.map(emp => emp.id);
            
            console.log(`Group ${group.name} (${group.id}): ${group.memberCount} members`, group.memberIds);
        });
        
        groups = fetchedGroups;
        console.log('All groups loaded:', groups);
        
        const groupSelect = document.getElementById('groupSelect');
        if (groupSelect) {
            groupSelect.innerHTML = groups.map(group => `
                <option value="${escapeHtml(group.id)}">${escapeHtml(group.name)} (${group.memberCount} a'zo)</option>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Load districts
async function loadDistricts() {
    try {
        const response = await fetch('/api/districts-list', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const districts = await response.json();
        
        const districtSelect = document.getElementById('districtSelect');
        if (districtSelect) {
            districtSelect.innerHTML = districts.map(district => `
                <option value="${escapeHtml(district.id)}">${escapeHtml(district.name)}</option>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch('/api/departments-list', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const departments = await response.json();
        
        const departmentSelect = document.getElementById('departmentSelect');
        if (departmentSelect) {
            departmentSelect.innerHTML = departments.map(dept => `
                <option value="${escapeHtml(dept.id)}">${escapeHtml(dept.name)}</option>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function toggleEmployee(employeeId) {
    if (selectedEmployees.has(employeeId)) {
        selectedEmployees.delete(employeeId);
    } else {
        selectedEmployees.add(employeeId);
    }
    updateSelectedCount();
}

// Make toggleEmployee globally accessible
window.toggleEmployee = toggleEmployee;

function searchEmployees(query) {
    const items = document.querySelectorAll('.employee-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(lowerQuery) ? 'block' : 'none';
    });
}

// Removed duplicate updateSelectedCount function - using the one at line 1130

// Load SIP accounts
async function loadSipAccounts() {
    console.log('=== loadSipAccounts function called ===');
    try {
        // Call the API to get active SIP accounts
        console.log('Fetching SIP accounts from API...');
        const response = await fetch('/api/sip-accounts/active', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load SIP accounts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        // Handle both array and object responses
        if (Array.isArray(data)) {
            availableSipAccounts = data;
        } else if (data.success) {
            availableSipAccounts = data.accounts || [];
        } else {
            throw new Error(data.error || 'Failed to load SIP accounts');
        }
        
        // If no accounts from API, use defaults
        if (availableSipAccounts.length === 0) {
            console.warn('No SIP accounts from API, using defaults');
            availableSipAccounts = [
                {
                    id: '1',
                    extension: '5530',
                    name: 'Asosiy linja 1',
                    server: '10.105.0.3',
                    channels: 15,
                    active: true
                },
                {
                    id: '2',
                    extension: '5531',
                    name: 'Asosiy linja 2',
                    server: '10.105.0.3',
                    channels: 15,
                    active: true
                },
                {
                    id: '3',
                    extension: '5532',
                    name: 'Asosiy linja 3',
                    server: '10.105.0.3',
                    channels: 15,
                    active: true
                }
            ];
        }
        
        console.log('SIP accounts loaded successfully:', availableSipAccounts);
        
        // Ensure availableSipAccounts is an array
        if (!Array.isArray(availableSipAccounts)) {
            console.error('SIP accounts response is not an array:', availableSipAccounts);
            availableSipAccounts = [];
        }
        
        const sipList = document.getElementById('sipAccountsList');
        console.log('SIP accounts list element:', sipList);
        console.log('sipAccountsList innerHTML before:', sipList ? sipList.innerHTML : 'ELEMENT NOT FOUND');
        if (!sipList) {
            console.error('❌ CRITICAL: sipAccountsList element not found!');
            console.error('Available elements with ID containing "sip":', 
                Array.from(document.querySelectorAll('[id*="sip"]')).map(el => el.id));
            console.error('All elements in document:', 
                Array.from(document.querySelectorAll('*[id]')).map(el => el.id));
            return;
        }
        
        // Store previously selected accounts
        const previouslySelected = new Set(selectedSipAccounts);
        console.log('Previously selected SIP accounts:', Array.from(previouslySelected));
        
        console.log('Rendering SIP accounts:', availableSipAccounts);
        const htmlContent = availableSipAccounts.map(account => {
            const isChecked = previouslySelected.has(account.id) || (previouslySelected.size === 0 && availableSipAccounts[0].id === account.id);
            return `
            <div class="sip-account-item" style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" value="${escapeHtml(account.id)}" onchange="toggleSipAccount('${escapeHtml(account.id)}')" 
                           ${isChecked ? 'checked' : ''} style="margin-right: 10px;">
                    <div>
                        <strong>${escapeHtml(account.extension)} - ${escapeHtml(account.name)}</strong><br>
                        <small>Server: ${escapeHtml(account.server)} | Kanallar: ${account.channels}</small>
                    </div>
                </label>
            </div>
        `;
        }).join('');
        
        console.log('Generated HTML content length:', htmlContent.length);
        console.log('Generated HTML preview:', htmlContent.substring(0, 300) + '...');
        sipList.innerHTML = htmlContent;
        console.log('✅ Set sipList innerHTML successfully');
        console.log('Current sipList content length:', sipList.innerHTML.length);
        console.log('Current sipList preview:', sipList.innerHTML.substring(0, 200) + '...');
        
        // Restore or set default selection
        if (previouslySelected.size > 0) {
            // Restore previous selection
            previouslySelected.forEach(id => selectedSipAccounts.add(id));
        } else if (availableSipAccounts.length > 0) {
            // Select first account by default
            const firstAccountId = availableSipAccounts[0].id;
            selectedSipAccounts.add(firstAccountId);
            window.selectedSipAccounts = selectedSipAccounts;
        }
        
        console.log('After loading, selected SIP accounts:', Array.from(selectedSipAccounts));
        
        // Update channel info display
        updateChannelInfo();
        
    } catch (error) {
        console.error('Error loading SIP accounts:', error);
        // Show default SIP account on error
        availableSipAccounts = [
            {
                id: '1',
                extension: '5530',
                name: 'Asosiy linja 1',
                server: '10.105.0.3',
                channels: 15,
                active: true
            }
        ];
        
        // Still render the UI with default account
        const sipList = document.getElementById('sipAccountsList');
        if (sipList) {
            sipList.innerHTML = availableSipAccounts.map(account => {
                return `
                <div class="sip-account-item" style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" value="${escapeHtml(account.id)}" onchange="toggleSipAccount('${escapeHtml(account.id)}')" 
                               checked style="margin-right: 10px;">
                        <div>
                            <strong>${escapeHtml(account.extension)} - ${escapeHtml(account.name)}</strong><br>
                            <small>Server: ${escapeHtml(account.server)} | Kanallar: ${account.channels}</small>
                        </div>
                    </label>
                </div>
            `}).join('');
            
            // Select the default account
            selectedSipAccounts.add(availableSipAccounts[0].id);
            window.selectedSipAccounts = selectedSipAccounts;
        }
    }
}

// Toggle SIP account selection
function toggleSipAccount(accountId) {
    console.log('Toggle SIP account:', accountId, 'Before:', Array.from(selectedSipAccounts));
    
    if (selectedSipAccounts.has(accountId)) {
        selectedSipAccounts.delete(accountId);
    } else {
        selectedSipAccounts.add(accountId);
    }
    
    console.log('After toggle:', Array.from(selectedSipAccounts));
    
    // Force save to window object to prevent scope issues
    window.selectedSipAccounts = selectedSipAccounts;
    
    // Update channel info when SIP accounts change
    updateChannelInfo();
}

// Update channel information display
function updateChannelInfo() {
    const totalChannels = availableSipAccounts
        .filter(account => selectedSipAccounts.has(account.id))
        .reduce((sum, account) => sum + (account.channels || 15), 0);
    
    console.log('[updateChannelInfo] Total channels:', totalChannels);
    
    // Update channel info elements
    const maxChannelsEl = document.getElementById('maxChannels');
    if (maxChannelsEl) maxChannelsEl.textContent = totalChannels;
    
    const channelInfoEl = document.getElementById('channelInfo');
    if (channelInfoEl) channelInfoEl.textContent = totalChannels;
}

// Toggle employee selection
function toggleEmployee(employeeId) {
    if (selectedEmployees.has(employeeId)) {
        selectedEmployees.delete(employeeId);
    } else {
        selectedEmployees.add(employeeId);
    }
    updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
    const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
    let count = 0;
    
    if (recipientType === 'all') {
        count = allEmployees.length;
    } else if (recipientType === 'selected') {
        count = selectedEmployees.size;
    } else if (recipientType === 'group') {
        const selectedGroups = Array.from(document.getElementById('groupSelect').selectedOptions);
        const uniqueMembers = new Set();
        selectedGroups.forEach(opt => {
            const group = groups.find(g => g.id === opt.value);
            if (group && group.memberIds) {
                group.memberIds.forEach(id => uniqueMembers.add(id));
            }
        });
        count = uniqueMembers.size;
    } else if (recipientType === 'department') {
        const selectedDepts = Array.from(document.getElementById('departmentSelect').selectedOptions);
        const deptValues = selectedDepts.map(opt => opt.value);
        count = allEmployees.filter(emp => deptValues.includes(emp.department)).length;
    } else if (recipientType === 'district') {
        const selectedDistricts = Array.from(document.getElementById('districtSelect').selectedOptions);
        const districtValues = selectedDistricts.map(opt => opt.value);
        count = allEmployees.filter(emp => districtValues.includes(String(emp.district))).length;
    }
    
    const selectedCountEl = document.getElementById('selectedCount');
    if (selectedCountEl) {
        selectedCountEl.textContent = count + ' ta xodim';
    }
}

// Make toggle functions globally accessible
window.toggleSipAccount = toggleSipAccount;
window.toggleEmployee = toggleEmployee;
window.updateSelectedCount = updateSelectedCount;

// Update summary
function updateSummary() {
    const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
    const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
    
    // Update subject
    let subject = '';
    if (broadcastType === 'audio') {
        subject = document.getElementById('audioSubject')?.value || 'Xabarnoma';
    } else {
        subject = document.getElementById('messageSubject')?.value || 'Xabarnoma';
    }
    document.getElementById('summarySubject').textContent = subject;
    
    document.getElementById('summaryType').textContent = 
        broadcastType === 'audio' ? 'Audio xabar' : 'Matnli xabar (TTS)';
    
    updateSelectedCount();
    const count = document.getElementById('selectedCount').textContent;
    document.getElementById('summaryRecipients').textContent = count;
    
    // Update SIP lines count
    document.getElementById('summarySipLines').textContent = selectedSipAccounts.size;
}

// Send broadcast
async function sendBroadcast() {
    const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
    const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
    
    // Add recipients
    let employeeIds = [];
    if (recipientType === 'all') {
        employeeIds = Array.from(document.querySelectorAll('.employee-item input[type="checkbox"]'))
            .map(cb => cb.value);
    } else if (recipientType === 'selected') {
        employeeIds = Array.from(selectedEmployees);
    } else if (recipientType === 'department') {
        // Get employees by department
        const selectedDepts = Array.from(document.getElementById('departmentSelect').selectedOptions)
            .map(opt => opt.value);
        // In real app, filter employees by department
        employeeIds = Array.from(document.querySelectorAll('.employee-item input[type="checkbox"]'))
            .map(cb => cb.value);
    } else if (recipientType === 'group') {
        // Get employees from selected groups
        const selectedGroups = Array.from(document.getElementById('groupSelect').selectedOptions)
            .map(opt => opt.value);
        console.log('Selected groups:', selectedGroups);
        
        // Get all unique employee IDs from selected groups
        const uniqueEmployeeIds = new Set();
        selectedGroups.forEach(groupId => {
            const group = groups.find(g => g.id === groupId);
            console.log('Processing group:', groupId, 'Found:', group);
            if (group && group.memberIds) {
                console.log('Group members:', group.memberIds);
                group.memberIds.forEach(memberId => uniqueEmployeeIds.add(memberId));
            }
        });
        employeeIds = Array.from(uniqueEmployeeIds);
        console.log('Final employee IDs from groups:', employeeIds);
    }
    
    // Add selected SIP accounts
    const selectedSipIds = Array.from(selectedSipAccounts);
    console.log('Selected SIP accounts:', selectedSipIds);
    
    // Add WebRTC option if available
    const useWebRTC = document.getElementById('useWebRTC');
    const useWebRTCValue = useWebRTC && useWebRTC.checked;
    
    try {
        let response;
        
        if (broadcastType === 'audio' && (recordedBlob || document.getElementById('audioFile').files.length)) {
            // Send FormData with audio file
            const formData = new FormData();
            
            if (recordedBlob) {
                formData.append('audio', recordedBlob, 'recording.webm');
            } else if (document.getElementById('audioFile').files.length) {
                formData.append('audio', document.getElementById('audioFile').files[0]);
            }
            
            // Add subject field
            const audioSubject = document.getElementById('audioSubject')?.value || 'Xabarnoma';
            formData.append('subject', audioSubject);
            
            formData.append('employeeIds', JSON.stringify(employeeIds));
            formData.append('sipAccounts', JSON.stringify(selectedSipIds));
            
            // Add SMS message for audio broadcasts
            const audioSmsMessage = document.getElementById('audioSmsMessage')?.value?.trim();
            if (audioSmsMessage) {
                formData.append('smsMessage', audioSmsMessage);
            }
            
            if (useWebRTCValue) {
                formData.append('useWebRTC', 'true');
            }
            
            console.log('Sending FormData with audio file and subject:', audioSubject);
            console.log('Employee IDs being sent:', employeeIds);
            
            response = await fetch('/api/broadcast/create', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        } else {
            // Send JSON for text/TTS
            const messageText = document.getElementById('messageText')?.value || 'Test message';
            const jsonData = {
                subject: document.getElementById('messageSubject')?.value || 'Xabarnoma',
                message: messageText,
                employeeIds: employeeIds,
                sipAccounts: selectedSipIds,
                smsMessage: messageText
            };
            
            if (ttsAudioFile) {
                jsonData.ttsFile = ttsAudioFile;
            }
            
            if (useWebRTCValue) {
                jsonData.useWebRTC = 'true';
            }
            
            console.log('Sending JSON data:', jsonData);
            
            // Convert JSON to FormData for the /create endpoint
            const formData = new FormData();
            Object.keys(jsonData).forEach(key => {
                if (key === 'employeeIds' || key === 'sipAccounts') {
                    formData.append(key, JSON.stringify(jsonData[key]));
                } else {
                    formData.append(key, jsonData[key]);
                }
            });
            
            response = await fetch('/api/broadcast/create', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
                credentials: 'same-origin'
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Show status
            document.querySelector('.broadcast-container').style.display = 'none';
            document.getElementById('broadcastStatus').style.display = 'block';
            
            // Start polling for status
            pollBroadcastStatus(data.broadcastId);
            
            alert('Xabar yuborish boshlandi!');
        } else {
            alert('Xato: ' + data.message);
        }
        
    } catch (error) {
        console.error('Broadcast error:', error);
        alert('Xabar yuborishda xato yuz berdi!');
    }
}

// Poll broadcast status
async function pollBroadcastStatus(broadcastId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/broadcast/status/${broadcastId}`, {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                const broadcast = data.broadcast;
                
                // Update status display
                document.getElementById('totalCount').textContent = broadcast.totalRecipients;
                document.getElementById('sentCount').textContent = 
                    broadcast.callResults ? broadcast.callResults.length : 0;
                document.getElementById('confirmedCount').textContent = broadcast.confirmedCount;
                
                // Update channel status if available
                if (broadcast.channelStatus) {
                    document.getElementById('activeChannels').textContent = broadcast.channelStatus.activeChannels || 0;
                    document.getElementById('queuedCalls').textContent = broadcast.channelStatus.queuedCalls || 0;
                    document.getElementById('completedCalls').textContent = broadcast.channelStatus.completedCalls || 0;
                    
                    // Update max channels if available
                    if (broadcast.channelStatus.maxChannels) {
                        document.getElementById('maxChannels').textContent = broadcast.channelStatus.maxChannels;
                        document.getElementById('channelInfo').textContent = broadcast.channelStatus.maxChannels;
                    }
                }
                
                // Update progress bar
                const progress = (broadcast.confirmedCount / broadcast.totalRecipients) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
                
                // Stop polling if completed
                if (broadcast.status === 'completed' || broadcast.status === 'failed') {
                    clearInterval(interval);
                    
                    if (broadcast.status === 'completed') {
                        alert('Xabar yuborish tugallandi!');
                    } else {
                        alert('Xabar yuborishda xato yuz berdi!');
                    }
                }
            }
        } catch (error) {
            console.error('Status polling error:', error);
        }
    }, 2000); // Poll every 2 seconds
}

// Listen for SIP confirmation events
window.addEventListener('sipConfirmation', (event) => {
    console.log('Broadcast confirmation received:', event.detail);
    
    // Update confirmed count in real-time
    const confirmedElement = document.getElementById('confirmedCount');
    if (confirmedElement) {
        const currentCount = parseInt(confirmedElement.textContent);
        confirmedElement.textContent = currentCount + 1;
    }
});

