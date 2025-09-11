const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const smsGateway = require('../lib/sms-gateway');
const { v4: uuidv4 } = require('uuid');
// TTS generator is loaded when needed
const AudioProcessor = require('../lib/audio-processor');
const { checkDistrictAccess } = require('../middleware/auth');
const { filterBroadcastsByDistrict } = require('../lib/district-filter');
const PhoneFormatter = require('../lib/phone-formatter');
const safeFileOps = require('../lib/safe-file-ops');

// Broadcast history file
const broadcastHistoryFile = path.join(__dirname, '../data/broadcast-history.json');

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/audio/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ext = path.extname(sanitizedName).toLowerCase();
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'video/webm'];
        const allowedExtensions = ['.wav', '.mp3', '.ogg', '.webm'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeOk = allowedMimeTypes.includes(file.mimetype);
        const extOk = allowedExtensions.includes(ext);
        
        if (mimeOk && extOk) {
            return cb(null, true);
        } else {
            cb(new Error('Faqat audio fayllar yuklash mumkin (wav, mp3, ogg, webm)!'));
        }
    }
});

// Store active broadcasts in memory (with size limit)
const broadcasts = new Map();
const MAX_BROADCASTS_IN_MEMORY = 100;

// Store retry schedulers (with cleanup)
const retrySchedulers = new Map();

// Queue for saving broadcast history
const saveQueue = [];
let isSaving = false;

// Store employees who need retry after all calls complete
const pendingRetries = new Map();

// Track if we're currently processing initial calls or retries
const broadcastPhases = new Map(); // broadcastId -> 'initial' | 'retry'

// Global broadcast queue to manage multiple broadcasts
const globalBroadcastQueue = [];
let isProcessingBroadcasts = false;

// Global SIP channel tracking
let globalTotalChannels = 0;
let globalActiveChannels = 0;

// Reset stuck broadcasts on startup
setInterval(() => {
    if (globalActiveChannels < 0) {
        console.log('[RESET] Resetting negative active channels to 0');
        globalActiveChannels = 0;
    }
    if (isProcessingBroadcasts && globalBroadcastQueue.length === 0 && globalActiveChannels === 0) {
        console.log('[RESET] Resetting stuck processing flag');
        isProcessingBroadcasts = false;
    }
}, 30000); // Check every 30 seconds

// Load broadcast history on startup
async function loadBroadcastHistory() {
    try {
        const history = await safeFileOps.readJSON(broadcastHistoryFile, []);
        // Load last 100 broadcasts into memory for quick access
        history.slice(-100).forEach(broadcast => {
            broadcasts.set(broadcast.id, broadcast);
        });
        console.log(`Loaded ${history.length} broadcasts from history`);
        
        // Check for stuck broadcasts and fix them
        let stuckCount = 0;
        for (const broadcast of history) {
            if (broadcast.status === 'active' || (broadcast.status === 'pending' && broadcast.totalRecipients > 0)) {
                const createdAt = new Date(broadcast.createdAt);
                const now = new Date();
                const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
                
                // If broadcast is older than 1 hour and still active/pending, mark as failed
                if (hoursSinceCreated > 1) {
                    broadcast.status = 'failed';
                    broadcast.error = 'Broadcast stuck - server restart or error';
                    stuckCount++;
                }
            }
        }
        
        if (stuckCount > 0) {
            console.log(`Fixed ${stuckCount} stuck broadcasts`);
            await safeFileOps.writeJSON(broadcastHistoryFile, history);
        }
    } catch (error) {
        console.error('Error loading broadcast history:', error);
    }
    
    // Reset processing flag on startup
    isProcessingBroadcasts = false;
}

// Process save queue
async function processSaveQueue() {
    if (isSaving || saveQueue.length === 0) return;
    
    isSaving = true;
    const broadcast = saveQueue.shift();
    
    try {
        let history = await safeFileOps.readJSON(broadcastHistoryFile, []);
        
        // Find existing broadcast to update or add new
        const existingIndex = history.findIndex(b => b.id === broadcast.id);
        if (existingIndex !== -1) {
            // Update existing broadcast
            history[existingIndex] = {
                ...broadcast,
                smsSentTo: broadcast.smsSentTo ? Array.from(broadcast.smsSentTo) : [], // Convert Set to Array
                savedAt: new Date().toISOString()
            };
        } else {
            // Add new broadcast
            history.push({
                ...broadcast,
                smsSentTo: broadcast.smsSentTo ? Array.from(broadcast.smsSentTo) : [], // Convert Set to Array
                savedAt: new Date().toISOString()
            });
        }
        
        // Keep only last 1000 broadcasts to prevent file from growing too large (reduced from 10000)
        if (history.length > 1000) {
            history = history.slice(-1000);
        }
        
        await safeFileOps.writeJSON(broadcastHistoryFile, history);
    } catch (error) {
        console.error('Error saving broadcast to history:', error);
    } finally {
        isSaving = false;
        // Process next item in queue
        if (saveQueue.length > 0) {
            setTimeout(processSaveQueue, 100);
        }
    }
}

// Save broadcast to history (queued)
async function saveBroadcastToHistory(broadcast) {
    // Make a deep copy to avoid issues with concurrent modifications
    const broadcastCopy = JSON.parse(JSON.stringify(broadcast));
    
    // Add to queue
    saveQueue.push(broadcastCopy);
    
    // Start processing if not already running
    if (!isSaving) {
        processSaveQueue();
    }
}

// Load history on startup
loadBroadcastHistory().catch(console.error);

// Create new broadcast - simplified version without auth for testing
router.post('/create', upload.single('audio'), async (req, res) => {
    try {
        console.log('[BROADCAST] Request received');
        console.log('- Body:', req.body);
        console.log('- File:', req.file);
        
        const { subject, message, employeeIds, sipAccounts, ttsFile, smsMessage } = req.body;
        const audioFile = req.file;
        
        if (!audioFile && !message && !ttsFile) {
            return res.status(400).json({
                success: false,
                message: 'Audio fayl yoki xabar matnini kiriting'
            });
        }
        
        const broadcastId = uuidv4();
        
        // Parse arrays safely
        let parsedEmployeeIds = [];
        let parsedSipAccounts = [];
        
        console.log('[BROADCAST] Received employeeIds:', employeeIds);
        console.log('[BROADCAST] Type of employeeIds:', typeof employeeIds);
        
        // Check if already arrays (from JSON) or strings (from form-data)
        if (Array.isArray(employeeIds)) {
            parsedEmployeeIds = employeeIds;
        } else {
            try {
                parsedEmployeeIds = employeeIds ? JSON.parse(employeeIds) : [];
            } catch (e) {
                console.error('Error parsing employeeIds:', e);
                parsedEmployeeIds = [];
            }
        }
        
        console.log('[BROADCAST] Parsed employee IDs:', parsedEmployeeIds);
        
        if (Array.isArray(sipAccounts)) {
            parsedSipAccounts = sipAccounts;
        } else {
            try {
                parsedSipAccounts = sipAccounts ? JSON.parse(sipAccounts) : [];
            } catch (e) {
                console.error('Error parsing sipAccounts:', e);
                parsedSipAccounts = [];
            }
        }
        
        // Process audio if uploaded
        let processedAudioFile = null;
        if (audioFile) {
            const audioProcessor = new AudioProcessor();
            const inputPath = audioFile.path;
            const processedFilename = `processed_${audioFile.filename}`;
            const outputPath = path.join(path.dirname(inputPath), processedFilename);
            
            console.log('Processing uploaded audio for noise reduction...');
            const processed = await audioProcessor.processMicrophoneRecording(inputPath, outputPath);
            
            if (processed) {
                processedAudioFile = processedFilename;
                console.log('Audio processed successfully:', processedFilename);
            } else {
                // Fallback to original if processing fails
                processedAudioFile = audioFile.filename;
                console.log('Audio processing failed, using original file');
            }
        }
        
        // Validate SMS message length
        if (smsMessage && smsMessage.length > 160) {
            return res.status(400).json({
                success: false,
                message: 'SMS xabar 160 belgidan oshmasligi kerak'
            });
        }
        
        if (message && message.length > 160) {
            console.warn('TTS message is longer than 160 chars, SMS will be truncated');
        }
        
        const broadcast = {
            id: broadcastId,
            subject: subject || 'Xabarnoma',
            message: message,
            audioFile: processedAudioFile || (ttsFile || null),
            originalAudioFile: audioFile ? audioFile.filename : null,
            employeeIds: parsedEmployeeIds,
            sipAccounts: parsedSipAccounts,
            createdAt: new Date(),
            createdBy: req.session?.user?.id || 'unknown',
            createdByName: req.session?.user?.name || 'Unknown',
            createdByUsername: req.session?.user?.username || 'unknown',
            status: 'pending',
            totalRecipients: parsedEmployeeIds.length,
            confirmedCount: 0,
            confirmations: [],
            callAttempts: {}, // Will store attempts by phone number
            smsMessage: smsMessage || message || null, // SMS message for failed calls (use message text for TTS)
            smsResults: [], // Track SMS sent
            smsSentTo: new Set() // Track which numbers received SMS
        };
        
        broadcasts.set(broadcastId, broadcast);
        
        // Save to history
        await saveBroadcastToHistory(broadcast);
        
        // Add to global queue instead of immediate processing
        console.log('Adding broadcast to queue:', broadcastId);
        globalBroadcastQueue.push(broadcastId);
        
        // Start processing queue if not already running
        if (!isProcessingBroadcasts) {
            console.log('[BROADCAST] Starting global queue processor');
            setImmediate(() => {
                processGlobalBroadcastQueue().catch(err => {
                    console.error('[BROADCAST] Queue processor error:', err);
                    isProcessingBroadcasts = false;
                });
            });
        } else {
            console.log('[BROADCAST] Queue processor already running');
        }
        
        console.log('Broadcast created:', broadcastId);
        
        res.json({
            success: true,
            broadcastId: broadcastId,
            message: 'Xabar yuborish boshlandi'
        });
    } catch (error) {
        console.error('[BROADCAST] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Process global broadcast queue
async function processGlobalBroadcastQueue() {
    if (isProcessingBroadcasts) {
        console.log('[QUEUE] Already processing, skipping...');
        return;
    }
    isProcessingBroadcasts = true;
    
    console.log('\n=== STARTING GLOBAL BROADCAST QUEUE PROCESSOR ===');
    console.log('[QUEUE] Queue length:', globalBroadcastQueue.length);
    
    while (globalBroadcastQueue.length > 0) {
        const broadcastId = globalBroadcastQueue.shift();
        console.log(`\n[QUEUE] Processing broadcast from queue: ${broadcastId}`);
        console.log(`[QUEUE] Remaining in queue: ${globalBroadcastQueue.length}`);
        
        try {
            console.log('[QUEUE] Calling processBroadcast for:', broadcastId);
            await processBroadcast(broadcastId);
            console.log('[QUEUE] Finished processing:', broadcastId);
        } catch (error) {
            console.error('Error processing broadcast:', broadcastId, error);
            const broadcast = broadcasts.get(broadcastId);
            if (broadcast) {
                broadcast.status = 'failed';
                broadcast.error = error.message;
                await saveBroadcastToHistory(broadcast);
            }
        }
        
        // Wait a bit between broadcasts to allow cleanup
        if (globalBroadcastQueue.length > 0) {
            console.log('\nWaiting 5 seconds before next broadcast...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    console.log('\n=== GLOBAL BROADCAST QUEUE EMPTY ===');
    isProcessingBroadcasts = false;
    
    // Double-check and reset in case of any issues
    setTimeout(() => {
        if (isProcessingBroadcasts && globalBroadcastQueue.length === 0) {
            console.log('[QUEUE] Resetting stuck processing flag');
            isProcessingBroadcasts = false;
        }
    }, 60000); // Check after 1 minute
}

// Process broadcast with retry logic and channel limits
async function processBroadcast(broadcastId) {
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) return;
    
    console.log('=== STARTING BROADCAST PROCESSING ===');
    console.log('Processing broadcast:', broadcastId);
    console.log('- Subject:', broadcast.subject);
    console.log('- Audio file:', broadcast.audioFile);
    console.log('- Recipients:', broadcast.employeeIds.length);
    console.log('- SIP accounts:', broadcast.sipAccounts);
    console.log('- Use Test Mode:', broadcast.useTestMode);
    
    broadcast.status = 'active';
    
    try {
        // Generate TTS audio if needed
        let audioFileToUse = broadcast.audioFile;
        if (!audioFileToUse && broadcast.message) {
            console.log('Text message detected, generating TTS audio...');
            try {
                // Generate TTS audio from text message
                const TTSGenerator = require('../lib/tts-generator');
                const tts = new TTSGenerator();
                
                // Wait for TTS to initialize
                await tts.initPromise;
                
                // Generate audio file
                const audioPath = await tts.generateAudio(broadcast.message, {
                    format: 'webm',
                    voice: 'uzbek' // or 'russian' based on message content
                });
                
                if (audioPath) {
                    // Extract just the filename
                    audioFileToUse = path.basename(audioPath);
                    broadcast.audioFile = audioFileToUse;
                    console.log('TTS audio generated:', audioFileToUse);
                } else {
                    throw new Error('TTS generation returned no audio file');
                }
            } catch (error) {
                console.error('TTS generation error:', error);
                
                // Fallback: Create a simple beep audio file
                const beepFile = `beep-${uuidv4()}.webm`;
                const beepPath = path.join(__dirname, '../public/audio/uploads', beepFile);
                
                // Create a simple beep tone using existing preset if available
                const presetBeep = path.join(__dirname, '../public/audio/presets/beep.webm');
                if (fs.existsSync(presetBeep)) {
                    fs.copyFileSync(presetBeep, beepPath);
                    audioFileToUse = beepFile;
                    broadcast.audioFile = audioFileToUse;
                    console.log('Using beep preset as fallback:', audioFileToUse);
                } else {
                    console.error('No audio file available for text message and TTS failed');
                    broadcast.status = 'failed';
                    broadcast.error = 'Audio generation failed: ' + error.message;
                    await saveBroadcastToHistory(broadcast);
                    return;
                }
            }
        }
        
        // Get employee phone numbers from employees.json
        console.log('Loading employee data...');
        // Clear require cache to get fresh data
        delete require.cache[require.resolve('../data/employees.json')];
        const employeeData = require('../data/employees.json');
        const employees = [];
        
        console.log('Employee IDs to process:', broadcast.employeeIds);
        for (const empId of broadcast.employeeIds) {
            const employee = employeeData.find(emp => emp.id === empId);
            if (employee) {
                employees.push({
                    id: employee.id,
                    name: employee.name,
                    phoneNumber: employee.phoneNumber
                });
                console.log('Found employee:', employee.name, 'with phone:', employee.phoneNumber);
                
                // Initialize call attempts for this phone number
                if (!broadcast.callAttempts[employee.phoneNumber]) {
                    broadcast.callAttempts[employee.phoneNumber] = [];
                }
            } else {
                console.log('Employee not found:', empId);
            }
        }
        
        console.log(`Total employees found: ${employees.length}`);
        if (employees.length === 0) {
            console.error('No employees found for broadcast!');
            broadcast.status = 'failed';
            broadcast.error = 'No recipients found';
            await saveBroadcastToHistory(broadcast);
            return;
        }
        
        // Load SIP accounts data
        const sipAccountsFile = path.join(__dirname, '../data/sip-accounts.json');
        let availableSipAccounts = [];
        try {
            const allSipAccounts = await safeFileOps.readJSON(sipAccountsFile, []);
            // Filter to get only selected and active accounts
            if (broadcast.sipAccounts && broadcast.sipAccounts.length > 0) {
                availableSipAccounts = allSipAccounts.filter(acc => 
                    broadcast.sipAccounts.includes(acc.id) && acc.active
                );
            } else {
                // If no specific accounts selected, use default active account
                availableSipAccounts = allSipAccounts.filter(acc => acc.active && acc.extension === '5530');
            }
        } catch (e) {
            console.error('Error loading SIP accounts:', e);
            // Fallback to default
            availableSipAccounts = [{
                id: '1',
                extension: process.env.SIP_EXTENSION_1 || '5530',
                password: process.env.SIP_PASSWORD || '5530',
                server: process.env.SIP_SERVER || '10.105.0.3',
                channels: 15
            }];
        }
        
        if (availableSipAccounts.length === 0) {
            console.error('No active SIP accounts available');
            broadcast.status = 'failed';
            broadcast.error = 'No active SIP accounts';
            await saveBroadcastToHistory(broadcast);
            return;
        }
        
        console.log(`Using ${availableSipAccounts.length} SIP accounts for broadcast:`);
        availableSipAccounts.forEach(acc => {
            console.log(`- ${acc.name || acc.extension}: ${acc.channels} channels`);
        });
        
        // Initialize SIP backends for each account
        const { getSIPBackend } = require('../lib/sip-backend');
        const sipBackends = [];
        
        for (const account of availableSipAccounts) {
            try {
                // Create unique instance for each SIP account
                const sipInstance = await getSIPBackend({
                    server: account.server || '10.105.0.3',
                    port: 5060,
                    username: account.extension,
                    password: account.password,
                    domain: account.server || '10.105.0.3',
                    instanceId: account.id // Add instance ID to differentiate
                });
                
                if (sipInstance && sipInstance.registered) {
                    sipBackends.push({
                        sip: sipInstance,
                        account: account,
                        activeCallsCount: 0,
                        maxChannels: account.channels || 15
                    });
                    console.log(`✅ SIP account ${account.extension} registered successfully`);
                } else {
                    console.error(`❌ Failed to register SIP account ${account.extension}`);
                }
            } catch (error) {
                console.error(`Error initializing SIP account ${account.extension}:`, error);
            }
        }
        
        if (sipBackends.length === 0) {
            console.error('No SIP backends could be initialized');
            broadcast.status = 'failed';
            broadcast.error = 'SIP registration failed';
            await saveBroadcastToHistory(broadcast);
            return;
        }
        
        console.log(`Successfully initialized ${sipBackends.length} SIP backends`);
        
        // Update global channel tracking
        globalTotalChannels = sipBackends.reduce((sum, backend) => sum + backend.maxChannels, 0);
        console.log(`Total available channels: ${globalTotalChannels}`);
        
        // Channel management - use actual channel count from SIP accounts
        const MAX_CONCURRENT_CALLS = globalTotalChannels || 5; // Use all available channels dynamically, fallback to 5
            let totalActiveCallsCount = 0;
            const callQueue = [...employees]; // Copy employees array as queue
            const activeCalls = new Map(); // Track active calls
            
            // Function to find best SIP backend (least loaded)
            const findBestSipBackend = () => {
                let bestBackend = null;
                let minLoad = Infinity;
                
                for (const backend of sipBackends) {
                    if (backend.activeCallsCount < backend.maxChannels) {
                        const loadPercentage = backend.activeCallsCount / backend.maxChannels;
                        if (loadPercentage < minLoad) {
                            minLoad = loadPercentage;
                            bestBackend = backend;
                        }
                    }
                }
                
                return bestBackend;
            };
            
            // Track batch state
            let currentBatchCount = 0;
            let completedInCurrentBatch = 0;
            let isWaitingForBatch = false;
            let isBatchInProgress = false;  // NEW: Prevent concurrent batches
            const BATCH_SIZE = 5;
            const BATCH_WAIT_TIME = 2000; // 2 seconds between batches
            
            // Function to check if we should start next batch
            const checkAndStartNextBatch = async () => {
                // Prevent multiple simultaneous checks
                if (isWaitingForBatch || isBatchInProgress || callQueue.length === 0) return;
                
                // If all calls in current batch are completed
                if (currentBatchCount > 0 && completedInCurrentBatch >= currentBatchCount) {
                    console.log(`\n✅ Batch complete! Processed ${currentBatchCount} calls.`);
                    console.log(`📊 Remaining in queue: ${callQueue.length}`);
                    
                    if (callQueue.length > 0) {
                        // Mark that we're waiting
                        isWaitingForBatch = true;
                        isBatchInProgress = false;
                        
                        // Reset batch counters
                        currentBatchCount = 0;
                        completedInCurrentBatch = 0;
                        
                        // Wait before starting next batch
                        console.log(`⏳ Waiting ${BATCH_WAIT_TIME/1000} seconds before starting next batch...`);
                        await new Promise(resolve => setTimeout(resolve, BATCH_WAIT_TIME));
                        
                        // Start next batch
                        isWaitingForBatch = false;
                        await startNewBatch();
                    } else {
                        // No more calls, mark batch complete
                        isBatchInProgress = false;
                    }
                }
            };
            
            // Function to start a new batch of calls
            const startNewBatch = async () => {
                // Prevent concurrent batch starts
                if (isBatchInProgress || callQueue.length === 0) {
                    console.log(`⚠️ Batch already in progress or queue empty, skipping...`);
                    return;
                }
                
                isBatchInProgress = true;
                
                // Use BATCH_SIZE, not MAX_CONCURRENT_CALLS
                const batchSize = Math.min(BATCH_SIZE, callQueue.length);
                console.log(`\n🚀 Starting new batch of ${batchSize} calls...`);
                currentBatchCount = batchSize;
                completedInCurrentBatch = 0;
                
                // Start exactly batchSize calls
                for (let i = 0; i < batchSize; i++) {
                    if (totalActiveCallsCount < BATCH_SIZE) {  // Double-check we don't exceed batch size
                        await processNextInQueue();
                        if (i < batchSize - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                }
            };
            
            // Function to process next employee in queue
            const processNextInQueue = async () => {
                if (callQueue.length === 0) {
                    console.log('Call queue is empty, no more recipients');
                    return;
                }
                
                // NEW: Check if we're in a batch and if we've reached batch size
                if (isBatchInProgress && totalActiveCallsCount >= BATCH_SIZE) {
                    console.log(`Batch limit reached (${BATCH_SIZE}), waiting for calls to complete...`);
                    return;
                }
                
                // Find available SIP backend
                const backend = findBestSipBackend();
                // Check channel limits - but respect BATCH_SIZE when in batch mode
                const effectiveLimit = isBatchInProgress ? BATCH_SIZE : MAX_CONCURRENT_CALLS;
                if (!backend || totalActiveCallsCount >= effectiveLimit || (globalTotalChannels > 0 && globalActiveChannels >= globalTotalChannels)) {
                    console.log(`Channels busy - Active: ${totalActiveCallsCount}/${effectiveLimit}`);
                    return;
                }
                
                const emp = callQueue.shift();
                backend.activeCallsCount++;
                totalActiveCallsCount++;
                globalActiveChannels++;
                
                console.log(`[${backend.account.extension}] Starting call to ${emp.name} (${emp.phoneNumber})`); 
                console.log(`Active: ${backend.activeCallsCount}/${backend.maxChannels} | Total: ${totalActiveCallsCount}/${MAX_CONCURRENT_CALLS}`);
                console.log(`Batch progress: ${completedInCurrentBatch}/${currentBatchCount}`);
                
                // Set up call end handler to free up channel
                const callEndHandler = async (data) => {
                    // Check various possible phone number fields
                    const callPhoneNumber = data.phoneNumber || data.toNumber || data.number;
                    // Format phone number for comparison (ATS format includes 0 prefix)
                    const atsPhone = PhoneFormatter.formatForATS(emp.phoneNumber);
                    if (callPhoneNumber === atsPhone || callPhoneNumber === emp.phoneNumber || (data.callId && activeCalls.has(emp.phoneNumber))) {
                        backend.activeCallsCount--;
                        totalActiveCallsCount--;
                        globalActiveChannels--;
                        activeCalls.delete(emp.phoneNumber);
                        completedInCurrentBatch++;
                        
                        console.log(`[${backend.account.extension}] Call ended for ${emp.name}`);
                        console.log(`Active: ${backend.activeCallsCount}/${backend.maxChannels} | Total: ${totalActiveCallsCount}/${MAX_CONCURRENT_CALLS}`);
                        console.log(`Batch progress: ${completedInCurrentBatch}/${currentBatchCount}`);
                        
                        // Clean up listener
                        backend.sip.off('call-ended', callEndHandler);
                        backend.sip.off('call-failed', callEndHandler);
                        
                        // Check if batch is complete and start next one
                        await checkAndStartNextBatch();
                    }
                };
                
                // Listen for call end events
                backend.sip.on('call-ended', callEndHandler);
                backend.sip.on('call-failed', callEndHandler);
                
                // Track this call with backend info
                activeCalls.set(emp.phoneNumber, { 
                    employee: emp, 
                    startTime: Date.now(),
                    sipAccount: backend.account.extension,
                    backend: backend
                });
                
                // Start the call with specific SIP backend
                attemptCallToEmployee(broadcastId, emp, audioFileToUse, backend.sip, backend.account, backend);
            };
            
            // Start initial calls up to MAX_CONCURRENT_CALLS
            console.log(`Starting broadcast with ${employees.length} recipients`);
            console.log(`Total available channels: ${MAX_CONCURRENT_CALLS}`);
            console.log(`Using ${sipBackends.length} SIP accounts:`);
            sipBackends.forEach(backend => {
                console.log(`  - ${backend.account.extension}: ${backend.maxChannels} channels`);
            });
            
            // Start initial batch of calls
            console.log(`\n🚀 Starting initial batch...`);
            await startNewBatch();
            
            // Track broadcast phase
            broadcastPhases.set(broadcastId, 'initial');
            
            console.log(`✅ Initial calls started. System will maintain ${MAX_CONCURRENT_CALLS} active calls.`);
            
            // Wait for all initial calls to complete
            let waitCount = 0;
            while (totalActiveCallsCount > 0 || callQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                waitCount++;
                
                // Log progress
                if ((totalActiveCallsCount > 0 || callQueue.length > 0) && Date.now() % 5000 < 1000) {
                    console.log(`Progress: ${callQueue.length} in queue, ${totalActiveCallsCount} active calls`);
                    // Show per-account status
                    sipBackends.forEach(backend => {
                        if (backend.activeCallsCount > 0) {
                            console.log(`  - ${backend.account.extension}: ${backend.activeCallsCount}/${backend.maxChannels} channels`);
                        }
                    });
                }
                
                // Safety check - if waiting too long, check global state
                if (waitCount > 300) { // 5 minutes
                    console.warn('WARNING: Waited 5 minutes for calls to complete, checking global state...');
                    console.log(`Global active channels: ${globalActiveChannels}`);
                    if (globalActiveChannels === 0 && totalActiveCallsCount > 0) {
                        console.error('Mismatch detected! Resetting local counter...');
                        totalActiveCallsCount = 0;
                        sipBackends.forEach(backend => {
                            backend.activeCallsCount = 0;
                        });
                    }
                    break;
                }
            }
            
            // All initial calls complete
            console.log('\n=== ALL INITIAL CALLS COMPLETED ===');
            
            // Check if there are any pending retries
            const retryList = pendingRetries.get(broadcastId);
            if (retryList && retryList.length > 0) {
                console.log(`\n🔄 Starting retry phase for ${retryList.length} failed recipients...`);
                console.log('✅ Starting retries immediately after main queue completion...');
                
                // Change phase to retry
                broadcastPhases.set(broadcastId, 'retry');
                
                // Reset queue with retry list
                callQueue.push(...retryList);
                pendingRetries.delete(broadcastId);
                
                console.log('\n🔄 Starting retry calls...');
                
                // Start retry batch
                console.log(`\n🔄 Starting retry batch...`);
                // Reset batch counters for retry phase
                currentBatchCount = 0;
                completedInCurrentBatch = 0;
                isWaitingForBatch = false;
                isBatchInProgress = false;
                await startNewBatch();
                
                // Wait for all retry calls to complete
                while (totalActiveCallsCount > 0 || callQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if ((totalActiveCallsCount > 0 || callQueue.length > 0) && Date.now() % 5000 < 1000) {
                        console.log(`Retry progress: ${callQueue.length} in queue, ${totalActiveCallsCount} active calls`);
                    }
                }
                
                console.log('\n=== ALL RETRY CALLS COMPLETED ===');
            }
            
            // Clean up phase tracking
            broadcastPhases.delete(broadcastId);
            
            broadcast.status = 'in_progress';
            broadcast.activeCalls = totalActiveCallsCount; // Track active calls at broadcast level
            broadcast.channelStatus = {
                activeChannels: totalActiveCallsCount,
                queuedCalls: callQueue.length,
                completedCalls: 0,
                maxChannels: MAX_CONCURRENT_CALLS,
                perAccountStatus: sipBackends.map(backend => ({
                    extension: backend.account.extension,
                    active: backend.activeCallsCount,
                    max: backend.maxChannels
                }))
            };
            await saveBroadcastToHistory(broadcast);
            
            // Monitor progress
            const progressInterval = setInterval(async () => {
                // Update channel status
                broadcast.activeCalls = totalActiveCallsCount; // Update active calls count
                broadcast.channelStatus = {
                    activeChannels: totalActiveCallsCount,
                    queuedCalls: callQueue.length,
                    completedCalls: employees.length - callQueue.length - totalActiveCallsCount,
                    maxChannels: MAX_CONCURRENT_CALLS,
                    perAccountStatus: sipBackends.map(backend => ({
                        extension: backend.account.extension,
                        active: backend.activeCallsCount,
                        max: backend.maxChannels
                    }))
                };
                
                if (callQueue.length === 0 && totalActiveCallsCount === 0) {
                    clearInterval(progressInterval);
                    console.log('All calls completed for broadcast:', broadcastId);
                    
                    // Check if we're in initial phase and have retries pending
                    const phase = broadcastPhases.get(broadcastId) || 'initial';
                    const retryList = pendingRetries.get(broadcastId) || [];
                    
                    if (phase === 'initial' && retryList.length > 0) {
                        console.log(`Initial phase complete, ${retryList.length} calls need retry`);
                        broadcast.status = 'pending_retry';
                        broadcast.channelStatus.pendingRetries = retryList.length;
                    } else {
                        broadcast.status = 'completed';
                        broadcast.channelStatus.completedCalls = employees.length;
                    }
                    await saveBroadcastToHistory(broadcast);
                } else {
                    console.log(`Progress: ${callQueue.length} in queue, ${totalActiveCallsCount} active calls`);
                    await saveBroadcastToHistory(broadcast);
                }
            }, 5000); // Check every 5 seconds for more frequent updates
            
        // Cleanup all SIP backends on completion
        broadcast.sipBackendsCleanup = () => {
            sipBackends.forEach(backend => {
                // Additional cleanup if needed
                console.log(`Cleaned up SIP backend ${backend.account.extension}`);
            });
        };
        
        // Final cleanup
        pendingRetries.delete(broadcastId);
        broadcastPhases.delete(broadcastId);
        
        // Reset global active channels if this was the last active broadcast
        if (globalActiveChannels === 0) {
            console.log('Resetting global channel counter');
        }
        
        console.log('\n=== BROADCAST COMPLETED ===');
        console.log(`Global channels status: ${globalActiveChannels}/${globalTotalChannels}`);
        
    } catch (error) {
        console.error('Broadcast error:', error);
        broadcast.status = 'failed';
        broadcast.error = error.message;
        await saveBroadcastToHistory(broadcast);
        
        // Cleanup on error
        pendingRetries.delete(broadcastId);
        broadcastPhases.delete(broadcastId);
        
        // Reset global active channels on error
        if (globalActiveChannels > 0) {
            console.log(`Resetting global active channels from ${globalActiveChannels} to 0 due to error`);
            globalActiveChannels = 0;
        }
    } finally {
        // Ensure broadcast status is updated even if error occurs
        if (broadcast && broadcast.status === 'active') {
            broadcast.status = 'failed';
            broadcast.error = 'Broadcast interrupted or incomplete';
            await saveBroadcastToHistory(broadcast).catch(console.error);
        }
    }
}

// Attempt to call an employee with retry logic
async function attemptCallToEmployee(broadcastId, employee, audioFile, sip, sipAccount, sipBackend) {
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) return;
    
    const maxAttempts = 5;
    const retryDelay = 60000; // 1 minute
    
    const attemptNumber = broadcast.callAttempts[employee.phoneNumber].length + 1;
    
    // Check if already confirmed or max attempts reached
    const alreadyConfirmed = broadcast.confirmations.some(c => c.phoneNumber === employee.phoneNumber);
    if (alreadyConfirmed || attemptNumber > maxAttempts) {
        console.log(`Skipping call to ${employee.phoneNumber}: ${alreadyConfirmed ? 'already confirmed' : 'max attempts reached'}`);
        return;
    }
    
    // Create call attempt record
    const callAttempt = {
        attemptNumber,
        startTime: new Date(),
        status: 'initiating',
        answered: false,
        dtmfConfirmed: false,
        duration: 0,
        endTime: null,
        failureReason: null
    };
    
    broadcast.callAttempts[employee.phoneNumber].push(callAttempt);
    await saveBroadcastToHistory(broadcast);
    
    try {
        // Format phone number for ATS dialing (add 0 prefix)
        const atsPhone = PhoneFormatter.formatForATS(employee.phoneNumber);
        if (!atsPhone) {
            console.error(`Invalid phone number format for ${employee.name}: ${employee.phoneNumber}`);
            callAttempt.status = 'failed';
            callAttempt.failureReason = 'Invalid phone number format';
            callAttempt.endTime = new Date();
            await saveBroadcastToHistory(broadcast);
            return;
        }
        
        const accountExt = sipAccount ? sipAccount.extension : 'default';
        console.log(`[${accountExt}] Calling ${employee.name} at ${atsPhone} (stored as: ${employee.phoneNumber}) (Attempt ${attemptNumber}/${maxAttempts})`);
        
        // Track call events
        const callStartTime = Date.now();
        let callId = null;
        let answered = false;
        let dtmfConfirmed = false;
        
        // Set up event listeners before making the call
        const answerHandler = (data) => {
            console.log(`[EVENT] call-answered received:`, data);
            if (data.toNumber === atsPhone || data.toNumber === employee.phoneNumber || data.callId === callId) {
                answered = true;
                callAttempt.answered = true;
                callAttempt.answeredAt = new Date();
                console.log(`✅ Call answered by ${employee.name} at ${new Date().toISOString()}`);
            }
        };
        
        const dtmfHandler = async (data) => {
            console.log(`[EVENT] broadcast-confirmed (DTMF) received:`, data);
            if (data.phoneNumber === atsPhone || data.phoneNumber === employee.phoneNumber || data.callId === callId) {
                dtmfConfirmed = true;
                callAttempt.dtmfConfirmed = true;
                callAttempt.dtmfConfirmedAt = new Date();
                console.log(`DTMF confirmation received from ${employee.name}`);
                
                // Update broadcast confirmations
                broadcast.confirmedCount++;
                broadcast.confirmations.push({
                    employeeId: employee.id,
                    phoneNumber: employee.phoneNumber,
                    confirmedAt: new Date(),
                    attemptNumber: attemptNumber
                });
                
                // Cancel any scheduled retries
                const retryKey = `${broadcastId}-${employee.phoneNumber}`;
                if (retrySchedulers.has(retryKey)) {
                    clearTimeout(retrySchedulers.get(retryKey));
                    retrySchedulers.delete(retryKey);
                }
                
                await saveBroadcastToHistory(broadcast);
            }
        };
        
        const endHandler = async (data) => {
            console.log(`[EVENT] call-ended received:`, data);
            // Check if this is our call
            const callPhoneNumber = data.phoneNumber || data.toNumber || data.number;
            if ((data.callId && data.callId === callId) || callPhoneNumber === atsPhone || callPhoneNumber === employee.phoneNumber) {
                console.log(`📞 Call ended for ${employee.name} (${employee.phoneNumber})`);
                const callEndTime = Date.now();
                callAttempt.endTime = new Date();
                callAttempt.duration = Math.round((callEndTime - callStartTime) / 1000);
                callAttempt.status = 'completed';
                
                // Log call result
                console.log(`[CALL] Ended - Answered: ${answered}, Duration: ${callAttempt.duration}s, DTMF: ${dtmfConfirmed}`);
                
                // If call was answered, consider it confirmed
                if (!dtmfConfirmed && answered) {
                    console.log(`📞 Call was answered - marking as confirmed`);
                    dtmfConfirmed = true;
                    callAttempt.dtmfConfirmed = true;
                    
                    // Update broadcast
                    if (broadcast && !broadcast.confirmations.some(c => c.employeeId === employee.id)) {
                        broadcast.confirmedCount++;
                        broadcast.confirmations.push({
                            employeeId: employee.id,
                            phoneNumber: employee.phoneNumber,
                            confirmedAt: new Date(),
                            attemptNumber: attemptNumber,
                            method: 'answered' // Mark as answered
                        });
                        
                        // Cancel any scheduled retries
                        const retryKey = `${broadcastId}-${employee.phoneNumber}`;
                        if (retrySchedulers.has(retryKey)) {
                            clearTimeout(retrySchedulers.get(retryKey));
                            retrySchedulers.delete(retryKey);
                        }
                    }
                }
                
                // Remove event listeners
                sip.off('call-answered', answerHandler);
                sip.off('broadcast-confirmed', dtmfHandler);
                sip.off('call-ended', endHandler);
                sip.off('call-failed', failHandler);
                
                await saveBroadcastToHistory(broadcast);
                
                // Schedule retry if not confirmed
                if (!dtmfConfirmed && attemptNumber < maxAttempts) {
                    const phase = broadcastPhases.get(broadcastId) || 'initial';
                    if (phase === 'initial') {
                        // During initial phase, add to pending retries
                        console.log(`Call ended without confirmation (attempt ${attemptNumber}/${maxAttempts}), adding ${employee.phoneNumber} to retry queue`);
                        if (!pendingRetries.has(broadcastId)) {
                            pendingRetries.set(broadcastId, []);
                        }
                        pendingRetries.get(broadcastId).push(employee);
                    } else {
                        // During retry phase, schedule immediately
                        console.log(`Retry call ended without confirmation (attempt ${attemptNumber}/${maxAttempts}), scheduling next retry for ${employee.phoneNumber} in ${retryDelay/1000} seconds`);
                        const retryKey = `${broadcastId}-${employee.phoneNumber}`;
                        const retryTimeout = setTimeout(() => {
                            attemptCallToEmployee(broadcastId, employee, audioFile, sip, sipAccount, sipBackend);
                            retrySchedulers.delete(retryKey);
                        }, retryDelay);
                        retrySchedulers.set(retryKey, retryTimeout);
                    }
                } else if (!dtmfConfirmed && attemptNumber >= maxAttempts) {
                    // Max attempts reached (5 attempts) without confirmation, send SMS
                    console.log(`Max attempts (${maxAttempts}) reached for ${employee.phoneNumber} without confirmation`);
                    if (broadcast.smsMessage) {
                        console.log(`Sending SMS notification to ${employee.phoneNumber}...`);
                        sendFailureNotificationSMS(broadcast, employee);
                    }
                }
            }
        };
        
        const failHandler = async (data) => {
            console.log(`[EVENT] call-failed received:`, data);
            if (data.toNumber === atsPhone || data.toNumber === employee.phoneNumber || data.callId === callId) {
                callAttempt.status = 'failed';
                callAttempt.failureReason = data.reason || 'Unknown';
                callAttempt.endTime = new Date();
                callAttempt.duration = Math.round((Date.now() - callStartTime) / 1000);
                
                // Remove event listeners
                sip.off('call-answered', answerHandler);
                sip.off('broadcast-confirmed', dtmfHandler);
                sip.off('call-ended', endHandler);
                sip.off('call-failed', failHandler);
                
                await saveBroadcastToHistory(broadcast);
                
                // Schedule retry if not max attempts
                if (attemptNumber < maxAttempts) {
                    const phase = broadcastPhases.get(broadcastId) || 'initial';
                    if (phase === 'initial') {
                        // During initial phase, add to pending retries
                        console.log(`Call failed (attempt ${attemptNumber}/${maxAttempts}), adding ${employee.phoneNumber} to retry queue`);
                        if (!pendingRetries.has(broadcastId)) {
                            pendingRetries.set(broadcastId, []);
                        }
                        pendingRetries.get(broadcastId).push(employee);
                    } else {
                        // During retry phase, schedule immediately
                        console.log(`Retry call failed (attempt ${attemptNumber}/${maxAttempts}), scheduling next retry for ${employee.phoneNumber} in ${retryDelay/1000} seconds`);
                        const retryKey = `${broadcastId}-${employee.phoneNumber}`;
                        const retryTimeout = setTimeout(() => {
                            attemptCallToEmployee(broadcastId, employee, audioFile, sip, sipAccount, sipBackend);
                            retrySchedulers.delete(retryKey);
                        }, retryDelay);
                        retrySchedulers.set(retryKey, retryTimeout);
                    }
                } else {
                    // Max attempts reached (5 attempts), send SMS if configured
                    console.log(`Max attempts (${maxAttempts}) reached for ${employee.phoneNumber}`);
                    if (broadcast.smsMessage) {
                        console.log(`Sending SMS notification to ${employee.phoneNumber}...`);
                        sendFailureNotificationSMS(broadcast, employee);
                    }
                }
            }
        };
        
        // Attach event listeners
        sip.on('call-answered', answerHandler);
        sip.on('broadcast-confirmed', dtmfHandler);
        sip.on('call-ended', endHandler);
        sip.on('call-failed', failHandler);
        
        // Make the call with ATS formatted phone number
        const result = await sip.makeCall(atsPhone, {
            audioFile: audioFile,
            broadcastId: broadcastId,
            employeeId: employee.id
        });
        
        callId = result.callId;
        callAttempt.callId = callId;
        
        // Log call initiation
        console.log(`[CALL] Initiated - CallID: ${callId}, Status: ${result.status}`);
        
        if (result.status === 'failed' || result.status === 'timeout') {
            // Call failed immediately
            console.log(`[CALL] Failed immediately - ${result.reason}`);
            callAttempt.status = 'failed';
            callAttempt.failureReason = result.reason || 'Connection failed';
            callAttempt.endTime = new Date();
            
            // Trigger retry logic
            failHandler({ toNumber: atsPhone, reason: result.reason });
        } else {
            console.log(`[CALL] Waiting for answer/end events...`);
        }
        
    } catch (error) {
        console.error(`Call to ${employee.phoneNumber} (ATS: ${atsPhone}) failed:`, error.message);
        callAttempt.status = 'failed';
        callAttempt.failureReason = error.message;
        callAttempt.endTime = new Date();
        await saveBroadcastToHistory(broadcast);
        
        // Schedule retry
        if (attemptNumber < maxAttempts) {
            const phase = broadcastPhases.get(broadcastId) || 'initial';
            if (phase === 'initial') {
                // During initial phase, add to pending retries
                console.log(`Error occurred (attempt ${attemptNumber}/${maxAttempts}), adding ${employee.phoneNumber} to retry queue`);
                if (!pendingRetries.has(broadcastId)) {
                    pendingRetries.set(broadcastId, []);
                }
                pendingRetries.get(broadcastId).push(employee);
            } else {
                // During retry phase, schedule immediately
                console.log(`Retry error occurred (attempt ${attemptNumber}/${maxAttempts}), scheduling next retry for ${employee.phoneNumber}`);
                const retryKey = `${broadcastId}-${employee.phoneNumber}`;
                const retryTimeout = setTimeout(() => {
                    attemptCallToEmployee(broadcastId, employee, audioFile, sip, sipAccount, sipBackend);
                    retrySchedulers.delete(retryKey);
                }, retryDelay);
                retrySchedulers.set(retryKey, retryTimeout);
            }
        } else {
            // Max attempts reached (5 attempts), send SMS if configured
            console.log(`Max attempts (${maxAttempts}) reached for ${employee.phoneNumber} after error`);
            if (broadcast.smsMessage) {
                console.log(`Sending SMS notification to ${employee.phoneNumber}...`);
                sendFailureNotificationSMS(broadcast, employee);
            }
        }
    }
}

// Send SMS notification for failed calls
async function sendFailureNotificationSMS(broadcast, employee) {
    try {
        // Check if SMS already sent to this employee
        if (!broadcast.smsSentTo) {
            broadcast.smsSentTo = new Set();
        }
        
        if (broadcast.smsSentTo.has(employee.phoneNumber)) {
            console.log(`SMS already sent to ${employee.phoneNumber}`);
            return;
        }
        
        // Send SMS
        const result = await smsGateway.sendSMS(employee.phoneNumber, broadcast.smsMessage);
        
        if (result.success) {
            console.log(`SMS sent successfully to ${employee.name} (${employee.phoneNumber})`);
            broadcast.smsSentTo.add(employee.phoneNumber);
            
            // Track SMS sent
            if (!broadcast.smsResults) {
                broadcast.smsResults = [];
            }
            
            broadcast.smsResults.push({
                employeeId: employee.id,
                employeeName: employee.name,
                phoneNumber: employee.phoneNumber,
                sentAt: new Date(),
                status: 'sent',
                messageId: result.messageId
            });
            
            // Update broadcast record
            await saveBroadcastToHistory(broadcast);
        } else {
            console.error(`Failed to send SMS to ${employee.phoneNumber}:`, result.error);
            
            if (!broadcast.smsResults) {
                broadcast.smsResults = [];
            }
            
            broadcast.smsResults.push({
                employeeId: employee.id,
                employeeName: employee.name,
                phoneNumber: employee.phoneNumber,
                sentAt: new Date(),
                status: 'failed',
                error: result.error
            });
        }
    } catch (error) {
        console.error(`Error sending SMS to ${employee.phoneNumber}:`, error);
    }
}

// Get broadcast status
router.get('/status/:broadcastId', (req, res) => {
    const broadcast = broadcasts.get(req.params.broadcastId);
    
    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Xabar topilmadi'
        });
    }
    
    // Check if user can view this broadcast
    if (req.session?.user?.role !== 'admin' && 
        broadcast.createdBy !== req.session?.user?.id && 
        broadcast.createdByUsername !== req.session?.user?.username) {
        return res.status(403).json({
            success: false,
            message: 'Sizda bu xabarni ko\'rish huquqi yo\'q'
        });
    }
    
    res.json({
        success: true,
        broadcast: broadcast
    });
});

// Get recent broadcasts
router.get('/recent', checkDistrictAccess(), async (req, res) => {
    try {
        // First try to get from history file
        const history = await safeFileOps.readJSON(broadcastHistoryFile, []);
        
        if (history.length > 0) {
            
            // Get all broadcasts (sorted by date, newest first)
            const recentBroadcasts = history
                .reverse()
                .map(broadcast => ({
                    ...broadcast,
                    createdAt: new Date(broadcast.createdAt)
                }));
            
            // Load employees to check districts
            const employeesFile = path.join(__dirname, '../data/employees.json');
            let employees = [];
            try {
                employees = await safeFileOps.readJSON(employeesFile, []);
            } catch (e) {
                console.error('Error loading employees for filtering:', e);
            }
            
            // Filter broadcasts by district AND by creator
            let filteredBroadcasts = [];
            
            console.log('[BROADCAST] User role:', req.session?.user?.role);
            console.log('[BROADCAST] User can access all districts:', req.userCanAccessAllDistricts);
            console.log('[BROADCAST] Total broadcasts before filter:', recentBroadcasts.length);
            console.log('[BROADCAST] Current user:', req.session?.user?.username, req.session?.user?.id);
            
            if (req.session?.user?.role === 'admin') {
                // Only admins see all broadcasts
                filteredBroadcasts = recentBroadcasts;
                console.log('[BROADCAST] Admin access - showing all broadcasts');
            } else {
                // All other users only see their own broadcasts
                // More defensive filtering - exclude broadcasts without creator info unless they match current user
                filteredBroadcasts = recentBroadcasts.filter(broadcast => {
                    // If broadcast has creator info, check if it matches current user
                    if (broadcast.createdBy || broadcast.createdByUsername) {
                        return broadcast.createdBy === req.session?.user?.id ||
                               broadcast.createdByUsername === req.session?.user?.username;
                    }
                    // If no creator info, don't show to non-admin users
                    return false;
                });
                console.log('[BROADCAST] User access - filtered to:', filteredBroadcasts.length);
            }
            
            res.json(filteredBroadcasts);
        } else {
            // Fallback to memory
            const recentBroadcasts = Array.from(broadcasts.values())
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 10);
            
            // Load employees to check districts
            const employeesFile = path.join(__dirname, '../data/employees.json');
            let employees = [];
            try {
                employees = await safeFileOps.readJSON(employeesFile, []);
            } catch (e) {
                console.error('Error loading employees for filtering:', e);
            }
            
            // Filter broadcasts by district AND by creator
            let filteredBroadcasts = [];
            
            console.log('[BROADCAST] User role:', req.session?.user?.role);
            console.log('[BROADCAST] User can access all districts:', req.userCanAccessAllDistricts);
            console.log('[BROADCAST] Total broadcasts before filter:', recentBroadcasts.length);
            console.log('[BROADCAST] Current user:', req.session?.user?.username, req.session?.user?.id);
            
            if (req.session?.user?.role === 'admin') {
                // Only admins see all broadcasts
                filteredBroadcasts = recentBroadcasts;
                console.log('[BROADCAST] Admin access - showing all broadcasts');
            } else {
                // All other users only see their own broadcasts
                // More defensive filtering - exclude broadcasts without creator info unless they match current user
                filteredBroadcasts = recentBroadcasts.filter(broadcast => {
                    // If broadcast has creator info, check if it matches current user
                    if (broadcast.createdBy || broadcast.createdByUsername) {
                        return broadcast.createdBy === req.session?.user?.id ||
                               broadcast.createdByUsername === req.session?.user?.username;
                    }
                    // If no creator info, don't show to non-admin users
                    return false;
                });
                console.log('[BROADCAST] User access - filtered to:', filteredBroadcasts.length);
            }
            
            res.json(filteredBroadcasts);
        }
    } catch (error) {
        console.error('Error getting recent broadcasts:', error);
        res.json([]);
    }
});

// Delete broadcast (admin only)
router.delete('/delete/:broadcastId', async (req, res) => {
    try {
        // Check if user is admin
        if (req.session?.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Faqat admin xabarlarni o\'chirishi mumkin'
            });
        }
        
        const broadcastId = req.params.broadcastId;
        
        // Remove from memory
        const broadcast = broadcasts.get(broadcastId);
        if (broadcast) {
            // Delete associated audio files
            if (broadcast.audioFile) {
                const audioPath = path.join(__dirname, '../public/audio/uploads', broadcast.audioFile);
                try {
                    if (fs.existsSync(audioPath)) {
                        fs.unlinkSync(audioPath);
                    }
                } catch (err) {
                    console.error('Error deleting audio file:', err);
                }
            }
            
            if (broadcast.originalAudioFile && broadcast.originalAudioFile !== broadcast.audioFile) {
                const originalPath = path.join(__dirname, '../public/audio/uploads', broadcast.originalAudioFile);
                try {
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }
                } catch (err) {
                    console.error('Error deleting original audio file:', err);
                }
            }
        }
        
        broadcasts.delete(broadcastId);
        
        // Remove from history file
        let history = await safeFileOps.readJSON(broadcastHistoryFile, []);
        const filteredHistory = history.filter(b => b.id !== broadcastId);
        
        if (history.length === filteredHistory.length && !broadcast) {
            return res.status(404).json({
                success: false,
                message: 'Xabar topilmadi'
            });
        }
        
        await safeFileOps.writeJSON(broadcastHistoryFile, filteredHistory);
        
        res.json({
            success: true,
            message: 'Xabar muvaffaqiyatli o\'chirildi'
        });
        
    } catch (error) {
        console.error('Error deleting broadcast:', error);
        res.status(500).json({
            success: false,
            message: 'Xabarni o\'chirishda xatolik yuz berdi'
        });
    }
});

// Get detailed broadcast report
router.get('/report/:broadcastId', async (req, res) => {
    try {
        const broadcastId = req.params.broadcastId;
        
        console.log('[BROADCAST REPORT] Request for broadcast:', broadcastId);
        console.log('[BROADCAST REPORT] User:', req.session?.user?.username, 'Role:', req.session?.user?.role);
        
        // Try to find in memory first
        let broadcast = broadcasts.get(broadcastId);
        
        // If not in memory, search in history
        if (!broadcast) {
            const history = await safeFileOps.readJSON(broadcastHistoryFile, []);
            broadcast = history.find(b => b.id === broadcastId);
        }
        
        if (!broadcast) {
            console.log('[BROADCAST REPORT] Broadcast not found:', broadcastId);
            return res.status(404).json({
                success: false,
                message: 'Broadcast not found'
            });
        }
        
        console.log('[BROADCAST REPORT] Broadcast found. CreatedBy:', broadcast.createdBy, 'CreatedByUsername:', broadcast.createdByUsername);
        
        // Check if user can view this broadcast
        // Only admin can see all broadcasts
        // Other users can only see their own broadcasts
        const userRole = req.session?.user?.role;
        
        // If user is not admin
        if (userRole !== 'admin') {
            // Users can only see their own broadcasts
            if (broadcast.createdBy !== req.session?.user?.id && 
                broadcast.createdByUsername !== req.session?.user?.username) {
                console.log('[BROADCAST REPORT] Access denied. User ID:', req.session?.user?.id, 'Username:', req.session?.user?.username);
                return res.status(403).json({
                    success: false,
                    message: 'Sizda bu xabar hisobotini ko\'rish huquqi yo\'q'
                });
            }
        }
        
        // Calculate statistics
        const stats = {
            totalRecipients: broadcast.totalRecipients || 0,
            confirmedCount: broadcast.confirmedCount || 0,
            confirmationRate: broadcast.totalRecipients > 0 
                ? ((broadcast.confirmedCount || 0) / broadcast.totalRecipients * 100).toFixed(2) + '%'
                : '0%',
            totalCallAttempts: 0,
            answeredCalls: 0,
            failedCalls: 0,
            averageCallDuration: 0
        };
        
        // Calculate call statistics
        let totalDuration = 0;
        let answeredCallsCount = 0;
        
        Object.values(broadcast.callAttempts || {}).forEach(attempts => {
            stats.totalCallAttempts += attempts.length;
            attempts.forEach(attempt => {
                if (attempt.answered) {
                    stats.answeredCalls++;
                    answeredCallsCount++;
                    if (attempt.duration) {
                        totalDuration += attempt.duration;
                    }
                } else if (attempt.status === 'failed') {
                    stats.failedCalls++;
                }
            });
        });
        
        if (answeredCallsCount > 0) {
            stats.averageCallDuration = (totalDuration / answeredCallsCount).toFixed(2) + ' seconds';
        }
        
        res.json({
            success: true,
            broadcast: {
                ...broadcast,
                statistics: stats
            }
        });
    } catch (error) {
        console.error('Error getting broadcast report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating report'
        });
    }
});

// Simple TTS endpoint
router.post('/tts', async (req, res) => {
    const { text, language, speed, voice } = req.body;
    
    if (!text) {
        return res.status(400).json({
            success: false,
            message: 'Matn kiritilmagan'
        });
    }
    
    try {
        // Generate actual TTS audio with options
        console.log('Generating TTS for text:', text);
        console.log('Options:', { language, speed, voice });
        
        const options = {
            language: language || 'uz',
            speed: speed || 140,
            voice: voice || 'female'
        };
        
        // Use TTS generator
        const TTSGenerator = require('../lib/tts-generator');
        const ttsGen = new TTSGenerator();
        
        const filename = await ttsGen.generateAudio(text, options);
        
        if (!filename) {
            throw new Error('TTS generation failed');
        }
        
        res.json({
            success: true,
            filename: filename,
            message: 'TTS audio yaratildi'
        });
    } catch (error) {
        console.error('TTS generation error:', error);
        res.status(500).json({
            success: false,
            message: 'TTS yaratishda xatolik yuz berdi'
        });
    }
});


// Clean up retry schedulers on process exit
process.on('SIGINT', () => {
    console.log('Cleaning up retry schedulers...');
    retrySchedulers.forEach((timeout) => {
        clearTimeout(timeout);
    });
    retrySchedulers.clear();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Cleaning up retry schedulers...');
    retrySchedulers.forEach((timeout) => {
        clearTimeout(timeout);
    });
    retrySchedulers.clear();
    process.exit(0);
});

// Get global channel status
router.get('/channel-status', (req, res) => {
    res.json({
        success: true,
        channelStatus: {
            totalChannels: globalTotalChannels,
            activeChannels: globalActiveChannels,
            availableChannels: globalTotalChannels - globalActiveChannels,
            queuedBroadcasts: globalBroadcastQueue.length,
            isProcessing: isProcessingBroadcasts
        }
    });
});

// SIP accounts endpoint - temporary workaround
router.get('/sip-accounts-list', async (req, res) => {
    try {
        // Return default SIP accounts since the main endpoint isn't working
        const defaultSipAccounts = [
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
        
        res.json(defaultSipAccounts);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Force process stuck broadcasts
router.post('/force-process-queue', async (req, res) => {
    try {
        console.log('[FORCE PROCESS] Manually triggering broadcast queue processing...');
        
        // Find stuck broadcasts
        const history = loadBroadcastHistory();
        const stuckBroadcasts = history.filter(b => 
            (b.status === 'pending' || b.status === 'in-progress') &&
            b.activeCalls === 0
        );
        
        console.log(`[FORCE PROCESS] Found ${stuckBroadcasts.length} stuck broadcasts`);
        
        // Add to global queue if not already there
        stuckBroadcasts.forEach(broadcast => {
            if (!globalBroadcastQueue.find(b => b.id === broadcast.id)) {
                globalBroadcastQueue.push(broadcast);
                console.log(`[FORCE PROCESS] Added broadcast ${broadcast.id} to queue`);
            }
        });
        
        // Force start processing
        if (!isProcessingBroadcasts && globalBroadcastQueue.length > 0) {
            isProcessingBroadcasts = true;
            processGlobalBroadcastQueue();
        }
        
        res.json({
            success: true,
            message: `Processed ${stuckBroadcasts.length} stuck broadcasts`,
            queueLength: globalBroadcastQueue.length,
            isProcessing: isProcessingBroadcasts
        });
    } catch (error) {
        console.error('[FORCE PROCESS] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// TTS endpoint
router.post('/api/broadcast/tts', async (req, res) => {
    try {
        const { text, language, speed, voice } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Matn kiritilmagan'
            });
        }
        
        console.log('[TTS] Generating audio for text:', text.substring(0, 50) + '...');
        
        // Lazy load TTS generator
        const TTSGenerator = require('../lib/tts-generator');
        const ttsGenerator = new TTSGenerator();
        
        // Generate audio
        const audioFile = await ttsGenerator.generateAudio(text, {
            language: language || 'uz',
            speed: speed || 140,
            voice: voice || 'female'
        });
        
        console.log('[TTS] Audio generated:', audioFile);
        
        res.json({
            success: true,
            audioFile: audioFile
        });
    } catch (error) {
        console.error('[TTS] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;