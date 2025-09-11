/**
 * DTMF Auto-Fixer
 * Avtomatik ravishda DTMF muammolarini aniqlaydi va tuzatadi
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

class DTMFAutoFixer extends EventEmitter {
    constructor() {
        super();
        this.issues = [];
        this.fixes = [];
        this.checkInterval = null;
    }

    /**
     * Start automatic monitoring and fixing
     */
    start() {
        console.log('[AutoFixer] Starting DTMF auto-fixer...');
        
        // Initial check
        this.performFullCheck();
        
        // Regular checks every 5 minutes
        this.checkInterval = setInterval(() => {
            this.performFullCheck();
        }, 300000); // 5 minutes
    }

    /**
     * Perform full system check
     */
    async performFullCheck() {
        console.log('[AutoFixer] Performing full DTMF check...');
        this.issues = [];
        this.fixes = [];

        // 1. Check SIP registration
        await this.checkSIPRegistration();
        
        // 2. Check port availability
        await this.checkPorts();
        
        // 3. Check Asterisk connectivity
        await this.checkAsteriskConnection();
        
        // 4. Check DTMF handler status
        await this.checkDTMFHandlers();
        
        // 5. Check recent DTMF activity
        await this.checkDTMFActivity();
        
        // Apply automatic fixes
        if (this.issues.length > 0) {
            console.log(`[AutoFixer] Found ${this.issues.length} issues`);
            await this.applyFixes();
        } else {
            console.log('[AutoFixer] No issues found ✓');
        }
        
        this.emit('check-complete', {
            issues: this.issues,
            fixes: this.fixes,
            timestamp: new Date()
        });
    }

    /**
     * Check SIP registration status
     */
    async checkSIPRegistration() {
        return new Promise((resolve) => {
            const logPath = path.join(__dirname, '../server.log');
            
            // Check last registration
            exec(`grep "registered successfully" "${logPath}" | tail -1`, (err, stdout) => {
                if (err || !stdout) {
                    this.issues.push({
                        type: 'sip_registration',
                        severity: 'high',
                        message: 'SIP not registered recently'
                    });
                } else {
                    // Check if registration is recent (within 1 hour)
                    const lastReg = stdout.trim();
                    const timeMatch = lastReg.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
                    if (timeMatch) {
                        const regTime = new Date(timeMatch[1]);
                        const hourAgo = new Date(Date.now() - 3600000);
                        
                        if (regTime < hourAgo) {
                            this.issues.push({
                                type: 'sip_registration_old',
                                severity: 'medium',
                                message: 'SIP registration is old',
                                lastRegistration: regTime
                            });
                        }
                    }
                }
                resolve();
            });
        });
    }

    /**
     * Check critical ports
     */
    async checkPorts() {
        const portsToCheck = [
            { port: 5060, name: 'SIP' },
            { port: 8444, name: 'HTTPS Server' },
            { port: 8445, name: 'Internal DTMF API' },
            { port: 10002, name: 'RTP' }
        ];
        
        for (const portInfo of portsToCheck) {
            const available = await this.isPortAvailable(portInfo.port);
            if (!available && portInfo.port === 8445) {
                // Port 8445 should be available for internal API
                this.issues.push({
                    type: 'port_blocked',
                    severity: 'medium',
                    message: `Port ${portInfo.port} (${portInfo.name}) is not available`,
                    port: portInfo.port
                });
            }
        }
    }

    /**
     * Check if port is available
     */
    isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.once('error', () => {
                resolve(false);
            });
            
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            
            server.listen(port);
        });
    }

    /**
     * Check Asterisk connection
     */
    async checkAsteriskConnection() {
        return new Promise((resolve) => {
            const socket = net.createConnection({ port: 5060, host: '10.105.0.3' }, () => {
                socket.end();
                resolve();
            });
            
            socket.on('error', () => {
                this.issues.push({
                    type: 'asterisk_connection',
                    severity: 'critical',
                    message: 'Cannot connect to Asterisk server'
                });
                resolve();
            });
            
            socket.setTimeout(5000);
            socket.on('timeout', () => {
                socket.destroy();
                this.issues.push({
                    type: 'asterisk_timeout',
                    severity: 'high',
                    message: 'Asterisk connection timeout'
                });
                resolve();
            });
        });
    }

    /**
     * Check DTMF handlers
     */
    async checkDTMFHandlers() {
        // Check if global sipBackend exists
        if (!global.sipBackend) {
            this.issues.push({
                type: 'sip_backend_missing',
                severity: 'critical',
                message: 'Global sipBackend not initialized'
            });
        } else {
            // Check if DTMF handler is active
            if (!global.sipBackend.dtmfHandler) {
                this.issues.push({
                    type: 'dtmf_handler_missing',
                    severity: 'critical',
                    message: 'DTMF handler not initialized'
                });
            }
            
            // Check alternative detector
            if (!global.sipBackend.altDTMFDetector) {
                this.issues.push({
                    type: 'alt_detector_missing',
                    severity: 'high',
                    message: 'Alternative DTMF detector not initialized'
                });
            }
        }
    }

    /**
     * Check recent DTMF activity
     */
    async checkDTMFActivity() {
        return new Promise((resolve) => {
            const logPath = path.join(__dirname, '../server.log');
            
            // Check for recent DTMF detections
            exec(`grep -E "DTMF|broadcast-confirmed" "${logPath}" | tail -10`, (err, stdout) => {
                if (!err && stdout) {
                    // Parse recent activity
                    const lines = stdout.trim().split('\n');
                    const recentTime = new Date(Date.now() - 3600000); // 1 hour ago
                    
                    let hasRecentActivity = false;
                    for (const line of lines) {
                        const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
                        if (timeMatch) {
                            const activityTime = new Date(timeMatch[1]);
                            if (activityTime > recentTime) {
                                hasRecentActivity = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasRecentActivity && lines.length > 0) {
                        this.issues.push({
                            type: 'no_recent_dtmf',
                            severity: 'low',
                            message: 'No recent DTMF activity detected'
                        });
                    }
                }
                resolve();
            });
        });
    }

    /**
     * Apply automatic fixes
     */
    async applyFixes() {
        console.log('[AutoFixer] Applying automatic fixes...');
        
        for (const issue of this.issues) {
            switch (issue.type) {
                case 'sip_registration':
                case 'sip_registration_old':
                    await this.fixSIPRegistration();
                    break;
                    
                case 'sip_backend_missing':
                    await this.fixSIPBackend();
                    break;
                    
                case 'dtmf_handler_missing':
                case 'alt_detector_missing':
                    await this.fixDTMFHandlers();
                    break;
                    
                case 'port_blocked':
                    if (issue.port === 8445) {
                        await this.fixInternalAPI();
                    }
                    break;
                    
                case 'asterisk_connection':
                case 'asterisk_timeout':
                    await this.reportAsteriskIssue();
                    break;
            }
        }
        
        console.log(`[AutoFixer] Applied ${this.fixes.length} fixes`);
    }

    /**
     * Fix SIP registration
     */
    async fixSIPRegistration() {
        console.log('[AutoFixer] Attempting to fix SIP registration...');
        
        if (global.sipBackend && global.sipBackend.register) {
            try {
                await global.sipBackend.register();
                this.fixes.push({
                    type: 'sip_re_register',
                    success: true,
                    message: 'Re-initiated SIP registration'
                });
            } catch (error) {
                this.fixes.push({
                    type: 'sip_re_register',
                    success: false,
                    message: 'Failed to re-register SIP',
                    error: error.message
                });
            }
        }
    }

    /**
     * Fix SIP backend initialization
     */
    async fixSIPBackend() {
        console.log('[AutoFixer] SIP Backend needs initialization');
        this.fixes.push({
            type: 'sip_backend_init',
            success: false,
            message: 'Server restart required to initialize SIP backend'
        });
        
        // Emit event for server to handle
        this.emit('restart-required', {
            reason: 'SIP backend not initialized'
        });
    }

    /**
     * Fix DTMF handlers
     */
    async fixDTMFHandlers() {
        console.log('[AutoFixer] Attempting to fix DTMF handlers...');
        
        if (global.sipBackend) {
            // Try to reinitialize handlers
            try {
                const DTMFHandler = require('./dtmf-handler');
                const AlternativeDTMFDetector = require('./dtmf-alternative-detector');
                
                if (!global.sipBackend.dtmfHandler) {
                    global.sipBackend.dtmfHandler = new DTMFHandler();
                    this.fixes.push({
                        type: 'dtmf_handler_init',
                        success: true,
                        message: 'Initialized DTMF handler'
                    });
                }
                
                if (!global.sipBackend.altDTMFDetector) {
                    global.sipBackend.altDTMFDetector = new AlternativeDTMFDetector();
                    global.sipBackend.altDTMFDetector.startMonitoring();
                    this.fixes.push({
                        type: 'alt_detector_init',
                        success: true,
                        message: 'Initialized alternative DTMF detector'
                    });
                }
            } catch (error) {
                this.fixes.push({
                    type: 'dtmf_handler_init',
                    success: false,
                    message: 'Failed to initialize DTMF handlers',
                    error: error.message
                });
            }
        }
    }

    /**
     * Fix internal API
     */
    async fixInternalAPI() {
        console.log('[AutoFixer] Starting internal DTMF API on port 8445...');
        
        try {
            const server = net.createServer((socket) => {
                socket.on('data', (data) => {
                    const message = data.toString();
                    console.log('[AutoFixer] Internal API received:', message);
                    
                    // Forward to DTMF handler
                    if (global.sipBackend && global.sipBackend.dtmfHandler) {
                        const parts = message.split(' ');
                        if (parts[0] === 'DTMF' && parts.length > 1) {
                            global.sipBackend.dtmfHandler.emit('dtmf-detected', {
                                digit: parts[1],
                                method: 'internal-api',
                                source: 'auto-fixer'
                            });
                        }
                    }
                });
            });
            
            server.listen(8445, () => {
                console.log('[AutoFixer] Internal API started on port 8445');
                this.fixes.push({
                    type: 'internal_api_start',
                    success: true,
                    message: 'Started internal DTMF API on port 8445'
                });
            });
            
            server.on('error', (err) => {
                this.fixes.push({
                    type: 'internal_api_start',
                    success: false,
                    message: 'Failed to start internal API',
                    error: err.message
                });
            });
        } catch (error) {
            this.fixes.push({
                type: 'internal_api_start',
                success: false,
                message: 'Failed to start internal API',
                error: error.message
            });
        }
    }

    /**
     * Report Asterisk connectivity issue
     */
    async reportAsteriskIssue() {
        console.log('[AutoFixer] Asterisk connectivity issue detected');
        
        // Log to file for admin
        const report = {
            timestamp: new Date().toISOString(),
            issue: 'Asterisk server connection problem',
            server: '10.105.0.3:5060',
            recommendation: 'Check network connectivity and Asterisk status'
        };
        
        const reportPath = path.join(__dirname, '../asterisk-issues.log');
        fs.appendFileSync(reportPath, JSON.stringify(report) + '\n');
        
        this.fixes.push({
            type: 'asterisk_issue_logged',
            success: true,
            message: 'Logged Asterisk connectivity issue for admin review'
        });
        
        this.emit('asterisk-issue', report);
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            running: !!this.checkInterval,
            lastCheck: this.lastCheck,
            issues: this.issues,
            fixes: this.fixes
        };
    }

    /**
     * Stop auto-fixer
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('[AutoFixer] Stopped');
    }
}

module.exports = DTMFAutoFixer;