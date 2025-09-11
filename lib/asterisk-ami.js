const AsteriskManager = require('asterisk-manager');

class AsteriskAMI {
    constructor(config) {
        this.config = config || {
            port: process.env.AMI_PORT || 5038,
            host: process.env.AMI_HOST || '10.105.0.3',
            username: process.env.AMI_USERNAME || 'admin',
            password: process.env.AMI_PASSWORD || 'mysecret',
            events: true
        };
        
        this.ami = null;
        this.connected = false;
        this.activeChannels = new Map();
    }

    // Connect to Asterisk AMI
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ami = new AsteriskManager(
                    this.config.port,
                    this.config.host,
                    this.config.username,
                    this.config.password,
                    this.config.events
                );

                this.ami.on('connect', () => {
                    console.log('Connected to Asterisk AMI');
                    this.connected = true;
                    this.setupEventHandlers();
                    resolve();
                });

                this.ami.on('error', (err) => {
                    console.error('AMI Error:', err);
                    this.connected = false;
                    reject(err);
                });

                this.ami.on('disconnect', () => {
                    console.log('Disconnected from Asterisk AMI');
                    this.connected = false;
                });

                this.ami.connect();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Setup event handlers
    setupEventHandlers() {
        // Monitor call events
        this.ami.on('newchannel', (evt) => {
            console.log('New channel:', evt.channel);
            this.activeChannels.set(evt.uniqueid, {
                channel: evt.channel,
                callerid: evt.calleridnum,
                state: evt.channelstate,
                timestamp: new Date()
            });
        });

        this.ami.on('hangup', (evt) => {
            console.log('Channel hangup:', evt.channel);
            this.activeChannels.delete(evt.uniqueid);
        });

        // DTMF events
        this.ami.on('dtmf', (evt) => {
            console.log('DTMF received:', evt.digit, 'from', evt.channel);
            this.handleDTMF(evt);
        });
    }

    // Make a call
    async makeCall(extension, phoneNumber, options = {}) {
        if (!this.connected) {
            throw new Error('Not connected to Asterisk AMI');
        }

        const action = {
            action: 'Originate',
            channel: `PJSIP/${extension}`,
            exten: phoneNumber,
            context: options.context || 'from-internal',
            priority: 1,
            callerid: options.callerid || 'Xabarnoma <' + extension + '>',
            timeout: options.timeout || 30000,
            async: true,
            variable: options.variables || {}
        };

        return new Promise((resolve, reject) => {
            this.ami.action(action, (err, res) => {
                if (err) {
                    console.error('Originate error:', err);
                    reject(err);
                } else {
                    console.log('Call initiated:', res);
                    resolve(res);
                }
            });
        });
    }

    // Send DTMF
    async sendDTMF(channel, digits) {
        if (!this.connected) {
            throw new Error('Not connected to Asterisk AMI');
        }

        const action = {
            action: 'PlayDTMF',
            channel: channel,
            digit: digits
        };

        return new Promise((resolve, reject) => {
            this.ami.action(action, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    // Play audio file
    async playAudio(channel, filename) {
        if (!this.connected) {
            throw new Error('Not connected to Asterisk AMI');
        }

        const action = {
            action: 'Playback',
            channel: channel,
            filename: filename
        };

        return new Promise((resolve, reject) => {
            this.ami.action(action, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    // Handle DTMF input
    handleDTMF(evt) {
        // Check if this is a confirmation (digit 1)
        if (evt.digit === '1') {
            console.log('Confirmation received from:', evt.channel);
            // Emit confirmation event
            if (this.onConfirmation) {
                this.onConfirmation({
                    channel: evt.channel,
                    uniqueid: evt.uniqueid,
                    timestamp: new Date()
                });
            }
        }
    }

    // Get active channels
    getActiveChannels() {
        return Array.from(this.activeChannels.values());
    }

    // Hangup a channel
    async hangupChannel(channel) {
        if (!this.connected) {
            throw new Error('Not connected to Asterisk AMI');
        }

        const action = {
            action: 'Hangup',
            channel: channel
        };

        return new Promise((resolve, reject) => {
            this.ami.action(action, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    // Get SIP peers
    async getSIPPeers() {
        if (!this.connected) {
            throw new Error('Not connected to Asterisk AMI');
        }

        const action = {
            action: 'PJSIPShowEndpoints'
        };

        return new Promise((resolve, reject) => {
            const peers = [];
            
            this.ami.on('endpointlist', (evt) => {
                peers.push({
                    objectname: evt.objectname,
                    transport: evt.transport,
                    aor: evt.aor,
                    auths: evt.auths,
                    contacts: evt.contacts,
                    devicestate: evt.devicestate
                });
            });

            this.ami.on('endpointlistcomplete', () => {
                resolve(peers);
            });

            this.ami.action(action, (err) => {
                if (err) {
                    reject(err);
                }
            });
        });
    }

    // Make broadcast call
    async makeBroadcastCall(phoneNumbers, audioFile, options = {}) {
        const results = [];
        
        // Use provided SIP lines or default ones
        const sipLines = options.sipLines || [
            process.env.SIP_EXTENSION_1,
            process.env.SIP_EXTENSION_2,
            process.env.SIP_EXTENSION_3
        ].filter(ext => ext); // Filter out undefined

        if (sipLines.length === 0) {
            throw new Error('No SIP lines available');
        }

        // Distribute calls across SIP lines
        for (let i = 0; i < phoneNumbers.length; i++) {
            const sipLine = sipLines[i % sipLines.length];
            const phoneNumber = phoneNumbers[i];

            try {
                const result = await this.makeCall(sipLine, phoneNumber, {
                    ...options,
                    context: 'xabarnoma-broadcast', // Use custom context for audio playback
                    variables: {
                        AUDIO_FILE: audioFile,
                        BROADCAST_ID: options.broadcastId,
                        REPEAT_COUNT: '3',
                        REPEAT_INTERVAL: '2000'
                    }
                });

                results.push({
                    phoneNumber,
                    sipLine,
                    status: 'initiated',
                    result
                });

                // Add delay between calls to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push({
                    phoneNumber,
                    sipLine,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return results;
    }

    // Disconnect
    disconnect() {
        if (this.ami) {
            this.ami.disconnect();
            this.connected = false;
        }
    }
}

// Create singleton instance
let amiInstance = null;

module.exports = {
    getAMI: async () => {
        if (!amiInstance) {
            amiInstance = new AsteriskAMI();
            await amiInstance.connect();
        }
        return amiInstance;
    },
    
    AsteriskAMI
};