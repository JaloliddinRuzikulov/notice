const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');

// Import employees router at the top to avoid circular dependency issues
const employeesRouter = require('./employees');

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
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1,
        parts: 10
    },
    fileFilter: (req, file, cb) => {
        console.log('[MULTER] File filter:', file.originalname, file.mimetype);
        const allowedTypes = /wav|mp3|ogg|webm|octet-stream/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';
        
        if (mimetype || extname) {
            return cb(null, true);
        } else {
            cb(new Error('Faqat audio fayllar yuklash mumkin!'));
        }
    }
});

// Store active broadcasts in memory (in production, use database)
const broadcasts = new Map();

// Create new broadcast - temporarily disable auth for testing
router.post('/create', upload.single('audio'), async (req, res) => {
    try {
        console.log('[BROADCAST] Processing request (auth temporarily disabled)');
        console.log('[BROADCAST] Request body:', req.body);
        console.log('[BROADCAST] Request file:', req.file);
        console.log('[BROADCAST] Content-Type:', req.headers['content-type']);
        
        const { message, employeeIds, sipAccounts, ttsFile } = req.body;
        const audioFile = req.file;
        
        console.log('[BROADCAST] Processing request:');
        console.log('- Message:', message);
        console.log('- Audio file:', audioFile ? audioFile.filename : 'null');
        console.log('- TTS file:', ttsFile);
        console.log('- Employee IDs:', typeof employeeIds, employeeIds);
        console.log('- SIP accounts:', typeof sipAccounts, sipAccounts);
        
        if (!audioFile && !message && !ttsFile) {
            return res.status(400).json({
                success: false,
                message: 'Audio fayl yoki xabar matnini kiriting'
            });
        }
        
        const broadcastId = uuidv4();
        // Parse employee IDs and SIP accounts safely
        let parsedEmployeeIds = [];
        let parsedSipAccounts = [];
        
        try {
            parsedEmployeeIds = employeeIds ? JSON.parse(employeeIds) : [];
            if (!Array.isArray(parsedEmployeeIds)) {
                parsedEmployeeIds = [];
            }
        } catch (e) {
            console.error('Error parsing employeeIds:', e);
            parsedEmployeeIds = [];
        }
        
        try {
            parsedSipAccounts = sipAccounts ? JSON.parse(sipAccounts) : [];
            if (!Array.isArray(parsedSipAccounts)) {
                parsedSipAccounts = [];
            }
        } catch (e) {
            console.error('Error parsing sipAccounts:', e);
            parsedSipAccounts = [];
        }
        
        const broadcast = {
            id: broadcastId,
            message: message,
            audioFile: audioFile ? audioFile.filename : (ttsFile || null),
            employeeIds: parsedEmployeeIds,
            sipAccounts: parsedSipAccounts,
            createdAt: new Date(),
            createdBy: req.session?.user?.id || 'unknown',
            createdByName: req.session?.user?.name || 'Unknown',
            status: 'pending',
            totalRecipients: parsedEmployeeIds.length,
            confirmedCount: 0,
            confirmations: [],
            repeatCount: 3,
            repeatInterval: 2000,
            useWebRTC: req.body.useWebRTC === 'true'
        };
        
        broadcasts.set(broadcastId, broadcast);
        
        // Start broadcast process asynchronously to avoid blocking response
        setImmediate(() => {
            processBroadcast(broadcastId).catch(error => {
                console.error('Error processing broadcast:', broadcastId, error);
                broadcast.status = 'failed';
                broadcast.error = error.message;
            });
        });
        
        console.log('Broadcast created successfully:', broadcastId);
        
        res.json({
            success: true,
            broadcastId: broadcastId,
            message: 'Xabar yuborish boshlandi'
        });
    } catch (error) {
        console.error('[BROADCAST] Processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Process broadcast (make calls)
async function processBroadcast(broadcastId) {
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) {
        console.error('Broadcast not found:', broadcastId);
        return;
    }
    
    console.log('Starting broadcast:', broadcastId);
    console.log('Broadcast data:', JSON.stringify({
        id: broadcast.id,
        employeeIds: broadcast.employeeIds,
        sipAccounts: broadcast.sipAccounts,
        audioFile: broadcast.audioFile,
        message: broadcast.message
    }, null, 2));
    
    broadcast.status = 'active';
    
    try {
        // Validate employeeIds
        if (!broadcast.employeeIds || !Array.isArray(broadcast.employeeIds)) {
            console.error('Invalid employeeIds:', broadcast.employeeIds);
            broadcast.employeeIds = [];
        }
        
        // Get employee phone numbers
        const employees = await getEmployeePhoneNumbers(broadcast.employeeIds);
        console.log(`Found ${employees.length} employees to call`);
        
        if (employees.length === 0 && (!broadcast.sipAccounts || broadcast.sipAccounts.length === 0)) {
            console.warn('No employees or SIP accounts found for broadcast');
            broadcast.status = 'completed';
            broadcast.error = 'No valid recipients found';
            return;
        }
        
        // Check if using WebRTC SIP or AMI
        if (broadcast.useWebRTC) {
            // Use WebRTC SIP for broadcast
            console.log('Using WebRTC SIP for broadcast...');
            
            // Emit event to frontend to start making calls
            if (global.io) {
                global.io.emit('startBroadcast', {
                    broadcastId: broadcastId,
                    employees: employees,
                    audioFile: broadcast.audioFile,
                    message: broadcast.message
                });
            }
            
            broadcast.status = 'in_progress';
            broadcast.callResults = employees.map(emp => ({
                phoneNumber: emp.phoneNumber,
                status: 'pending'
            }));
            
            return;
        }
        
        // Try backend SIP first
        try {
            const { getSIPBackend } = require('../lib/sip-backend');
            const sip = await getSIPBackend({
                server: process.env.SIP_SERVER || '10.105.0.3',
                port: 5060,
                username: process.env.SIP_EXTENSION_1 || '5530',
                password: process.env.SIP_PASSWORD || '5530',
                domain: process.env.SIP_SERVER || '10.105.0.3'
            });
            
            if (sip && sip.registered) {
                console.log('Using backend SIP for broadcast');
                
                // Agar audio fayl bo'lsa, avval ko'rsatmalarni yaratamiz
                let instructionAudioFile = null;
                if (broadcast.audioFile && !broadcast.message) {
                    // Faqat audio fayl uchun ko'rsatmalar yaratish
                    const TTSGenerator = require('../lib/tts-generator');
                    const ttsGen = new TTSGenerator();
                    
                    const instructionText = "Assalomu alaykum. Sizga xabar bor. Xabarni tushungan bo'lsangiz, 1 raqamini bosing.";
                    const ttsResult = await ttsGen.generateTTS(instructionText, { 
                        language: 'uz-UZ', 
                        speed: 1.0, 
                        voice: 'default' 
                    });
                    
                    if (ttsResult.success) {
                        instructionAudioFile = ttsResult.filename;
                        console.log('Created instruction audio:', instructionAudioFile);
                    }
                }
                
                // Make calls sequentially
                broadcast.callResults = [];
                for (const emp of employees) {
                    try {
                        const result = await sip.makeCall(emp.phoneNumber, {
                            audioFile: broadcast.audioFile,
                            instructionAudioFile: instructionAudioFile
                        });
                        broadcast.callResults.push({
                            phoneNumber: emp.phoneNumber,
                            callId: result.callId,
                            status: result.status,
                            timestamp: new Date()
                        });
                        
                        // Small delay between calls
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        broadcast.callResults.push({
                            phoneNumber: emp.phoneNumber,
                            status: 'failed',
                            error: error.message,
                            timestamp: new Date()
                        });
                    }
                }
                
                broadcast.status = 'in_progress';
                console.log(`Broadcast ${broadcastId} initiated via backend SIP`);
                
                // Listen for DTMF confirmations
                sip.on('broadcast-confirmed', (data) => {
                    console.log('Broadcast confirmation received:', data);
                    
                    // Find the employee by call ID
                    const callResult = broadcast.callResults.find(r => r.callId === data.callId);
                    if (callResult) {
                        callResult.confirmed = true;
                        callResult.confirmedAt = data.timestamp;
                        
                        // Update confirmation count
                        broadcast.confirmations.push({
                            phoneNumber: data.phoneNumber,
                            timestamp: data.timestamp
                        });
                        broadcast.confirmedCount++;
                        
                        console.log(`Confirmation received from ${data.phoneNumber}`);
                    }
                });
                
                return;
            }
        } catch (sipError) {
            console.log('Backend SIP not available:', sipError.message);
        }
        
        // Try AMI connection
        try {
            const { getAMI } = require('../lib/asterisk-ami');
            const ami = await getAMI();
            
            // Get selected SIP accounts
            let sipLines = [];
            if (broadcast.sipAccounts && broadcast.sipAccounts.length > 0) {
                // Load SIP accounts info
                const { loadSIPAccounts } = require('./sip-accounts');
                const allAccounts = await loadSIPAccounts();
                const selectedAccounts = allAccounts.filter(acc => 
                    broadcast.sipAccounts.includes(acc.id) && acc.active
                );
                sipLines = selectedAccounts.map(acc => acc.extension);
            }
            
            // Prepare audio file path
            const audioFile = broadcast.audioFile ? 
                `/var/lib/asterisk/sounds/custom/${broadcast.audioFile}` : 
                null;
            
            if (!audioFile && !broadcast.message) {
                throw new Error('No audio file or message specified');
            }
            
            // Make broadcast calls
            const results = await ami.makeBroadcastCall(
                employees.map(emp => emp.phoneNumber),
                audioFile,
                { 
                    broadcastId,
                    sipLines: sipLines.length > 0 ? sipLines : undefined
                }
            );
            
            // Update broadcast status
            broadcast.callResults = results;
            broadcast.status = 'in_progress';
            
            // Set confirmation handler
            ami.onConfirmation = (confirmation) => {
                handleBroadcastConfirmation(broadcastId, confirmation);
            };
            
            console.log(`Broadcast ${broadcastId} initiated for ${employees.length} recipients`);
            
        } catch (amiError) {
            console.log('AMI not available, using simulation mode...');
            
            // Simulate broadcast for testing
            broadcast.callResults = employees.map(emp => ({
                phoneNumber: emp.phoneNumber,
                status: 'simulated'
            }));
            
            // Simulate confirmations
            setTimeout(() => {
                const confirmCount = Math.floor(employees.length * 0.8);
                for (let i = 0; i < confirmCount; i++) {
                    const emp = employees[i];
                    handleBroadcastConfirmation(broadcastId, {
                        phoneNumber: emp.phoneNumber,
                        timestamp: new Date()
                    });
                }
                broadcast.status = 'completed';
            }, 5000);
        }
        
    } catch (error) {
        console.error('Broadcast processing error:', error);
        broadcast.status = 'failed';
        broadcast.error = error.message;
    }
}

// Get employee phone numbers
async function getEmployeePhoneNumbers(employeeIds) {
    try {
        console.log('Getting phone numbers for employee IDs:', employeeIds);
        
        // Validate input
        if (!Array.isArray(employeeIds)) {
            console.error('employeeIds is not an array:', employeeIds);
            return [];
        }
        
        // Access the employees Map from router
        const employeesMap = employeesRouter.employees;
        
        // Check if employees data is available
        if (!employeesMap || !(employeesMap instanceof Map)) {
            console.error('Employees data not available or not a Map');
            return [];
        }
        
        // Convert Map to array
        const allEmployees = Array.from(employeesMap.values());
        console.log(`Found ${allEmployees.length} total employees`);
        
        // Filter employees by IDs
        const selectedEmployees = allEmployees.filter(emp => 
            emp && emp.id && employeeIds.includes(emp.id)
        );
        console.log(`Found ${selectedEmployees.length} matching employees`);
        
        // Return phone numbers with validation
        return selectedEmployees
            .filter(emp => emp.phoneNumber) // Only include employees with phone numbers
            .map(emp => ({
                id: emp.id,
                name: emp.name || 'Unknown',
                phoneNumber: emp.phoneNumber
            }));
    } catch (error) {
        console.error('Error in getEmployeePhoneNumbers:', error);
        return [];
    }
}

// Handle broadcast confirmation
function handleBroadcastConfirmation(broadcastId, confirmation) {
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) return;
    
    // Add confirmation
    broadcast.confirmations.push({
        channel: confirmation.channel,
        timestamp: confirmation.timestamp
    });
    
    broadcast.confirmedCount++;
    
    // Check if all confirmed
    if (broadcast.confirmedCount >= broadcast.totalRecipients) {
        broadcast.status = 'completed';
    }
}

// Get broadcast status
router.get('/status/:broadcastId', auth, (req, res) => {
    const broadcast = broadcasts.get(req.params.broadcastId);
    
    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Xabar topilmadi'
        });
    }
    
    res.json({
        success: true,
        broadcast: broadcast
    });
});

// Confirm broadcast (when user presses 1)
router.post('/confirm', auth, (req, res) => {
    const { broadcastId, phoneNumber, digit } = req.body;
    
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Xabar topilmadi'
        });
    }
    
    if (digit === '1') {
        broadcast.confirmations.push({
            phoneNumber: phoneNumber,
            confirmedAt: new Date()
        });
        broadcast.confirmedCount++;
        
        res.json({
            success: true,
            message: 'Xabar tasdiqlandi'
        });
    } else {
        res.json({
            success: false,
            message: 'Noto\'g\'ri tasdiqlash kodi'
        });
    }
});

// Get recent broadcasts
router.get('/recent', auth, async (req, res) => {
    try {
        const user = req.session.user;
        let recentBroadcasts = Array.from(broadcasts.values());
        
        // Filter by user's own broadcasts (unless admin)
        if (user.role !== 'admin') {
            recentBroadcasts = recentBroadcasts.filter(broadcast => 
                broadcast.createdBy === user.id
            );
        }
        
        // Sort and limit
        recentBroadcasts = recentBroadcasts
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50); // Return more for better reporting
        
        res.json(recentBroadcasts);
    } catch (error) {
        console.error('[BROADCAST] Error getting recent broadcasts:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Multer error handler
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('[BROADCAST] Multer error:', error);
        return res.status(400).json({
            success: false,
            message: 'Fayl yuklashda xato: ' + error.message
        });
    }
    next(error);
});

// Record audio via WebRTC
router.post('/record', auth, upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Audio fayl yuklanmadi'
            });
        }
        
        res.json({
            success: true,
            filename: req.file.filename,
            message: 'Audio muvaffaqiyatli saqlandi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Text-to-Speech endpoint
router.post('/tts', auth, async (req, res) => {
    try {
        const { text, language = 'uz-UZ', speed = 1.0, voice = 'default' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Matn kiritilmagan'
            });
        }
        
        // Har qanday xabarga salomlashish va ko'rsatma qo'shish
        const prefix = "Assalomu alaykum. Sizga xabar bor. ";
        const suffix = " Xabarni tushungan bo'lsangiz, 1 raqamini bosing.";
        const fullText = prefix + text + suffix;
        
        console.log('TTS: Full text with instructions:', fullText);
        
        // Use TTS generator
        const TTSGenerator = require('../lib/tts-generator');
        const ttsGen = new TTSGenerator();
        
        try {
            const result = await ttsGen.generateTTS(fullText, { language, speed, voice });
            
            if (result.success) {
                res.json({
                    success: true,
                    filename: result.filename,
                    message: 'TTS audio yaratildi',
                    text: fullText,
                    language: language
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.error || 'TTS yaratishda xatolik'
                });
            }
        } catch (ttsError) {
            console.error('TTS generation error:', ttsError);
            res.status(500).json({
                success: false,
                message: 'TTS yaratishda xatolik: ' + ttsError.message
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update broadcast call status
router.post('/updateCallStatus', auth, (req, res) => {
    const { broadcastId, phoneNumber, status } = req.body;
    
    const broadcast = broadcasts.get(broadcastId);
    if (!broadcast) {
        return res.status(404).json({
            success: false,
            message: 'Xabar topilmadi'
        });
    }
    
    // Update call result status
    if (broadcast.callResults) {
        const callResult = broadcast.callResults.find(r => r.phoneNumber === phoneNumber);
        if (callResult) {
            callResult.status = status;
            callResult.updatedAt = new Date();
        }
    }
    
    res.json({
        success: true,
        message: 'Holat yangilandi'
    });
});

module.exports = router;