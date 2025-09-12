/**
 * SIP Phone Client
 * Frontend JavaScript for SIP phone functionality
 */

class SipPhoneClient {
    constructor() {
        this.socket = io();
        this.currentCall = null;
        this.isConnected = false;
        this.isMuted = false;
        this.isOnHold = false;
        this.callTimer = null;
        this.callStartTime = null;
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
        this.updateUI();
    }
    
    initializeEventListeners() {
        // Socket authentication
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.socket.emit('authenticate', {
                userId: 'current-user', // This should come from session
                token: null // Add token if needed
            });
        });
        
        this.socket.on('authenticated', (data) => {
            console.log('Socket authenticated:', data);
        });
    }
    
    initializeSocketListeners() {
        // Listen for call status updates
        this.socket.on('call-status-update', (data) => {
            this.handleCallStatusUpdate(data);
        });
        
        // Listen for incoming calls
        this.socket.on('incoming-call', (data) => {
            this.handleIncomingCall(data);
        });
        
        // Listen for DTMF events
        this.socket.on('dtmf-received', (data) => {
            this.handleDTMFReceived(data);
        });
        
        // Listen for system notifications
        this.socket.on('system-notification', (data) => {
            this.showNotification(data.message, data.type);
        });
    }
    
    // SIP Connection Management
    toggleSipConnection() {
        if (this.isConnected) {
            this.disconnectSip();
        } else {
            this.connectSip();
        }
    }
    
    connectSip() {
        const sipUri = document.getElementById('sipUri').value;
        const sipPassword = document.getElementById('sipPassword').value;
        const sipServer = document.getElementById('sipServer').value;
        const displayName = document.getElementById('displayName').value;
        
        if (!sipUri || !sipPassword || !sipServer) {
            this.showNotification('SIP ma\'lumotlarini to\'ldiring', 'error');
            this.showSipConfig();
            return;
        }
        
        // Here you would integrate with JsSIP or similar SIP library
        // For now, we'll simulate the connection
        this.simulateConnection(true);
        
        this.showNotification('SIP ga ulanilmoqda...', 'info');
    }
    
    disconnectSip() {
        // Disconnect from SIP service
        this.simulateConnection(false);
        this.showNotification('SIP dan uzildi', 'info');
    }
    
    simulateConnection(connected) {
        this.isConnected = connected;
        this.updateConnectionStatus(connected);
        this.updateUI();
    }
    
    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('sipConnectionStatus');
        const statusText = document.getElementById('sipStatusText');
        const connectButton = document.getElementById('connectButton');
        
        if (connected) {
            statusIndicator.style.background = 'var(--md-sys-color-primary)';
            statusText.textContent = 'Ulangan';
            connectButton.innerHTML = '<span class="material-symbols-outlined">link_off</span><span>Uzish</span>';
        } else {
            statusIndicator.style.background = 'var(--md-sys-color-error)';
            statusText.textContent = 'Ulanmagan';
            connectButton.innerHTML = '<span class="material-symbols-outlined">link</span><span>Ulash</span>';
        }
    }
    
    showSipConfig() {
        const config = document.getElementById('sipConfig');
        config.style.display = config.style.display === 'none' ? 'block' : 'none';
    }
    
    // Call Management
    async makeCall() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        
        if (!phoneNumber) {
            this.showNotification('Telefon raqamini kiriting', 'error');
            return;
        }
        
        if (!this.isConnected) {
            this.showNotification('Avval SIP ga ulanish kerak', 'error');
            return;
        }
        
        if (this.currentCall) {
            this.showNotification('Boshqa qo\'ng\'iroq faol', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/sip/call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromNumber: 'system', // This should come from SIP config
                    toNumber: phoneNumber,
                    callType: 'direct'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentCall = data.data.call;
                this.showCallInterface();
                this.startCallTimer();
                this.showNotification('Qo\'ng\'iroq qilish boshlandi', 'success');
            } else {
                this.showNotification(data.error, 'error');
            }
            
        } catch (error) {
            this.showNotification('Qo\'ng\'iroq qilishda xatolik', 'error');
            console.error('Call error:', error);
        }
    }
    
    async hangupCall() {
        if (!this.currentCall) {
            return;
        }
        
        try {
            const response = await fetch(`/api/sip/hangup/${this.currentCall.callId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: 'User hangup',
                    endedBy: 'current-user'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.endCall();
                this.showNotification('Qo\'ng\'iroq yakunlandi', 'success');
            } else {
                this.showNotification(data.error, 'error');
            }
            
        } catch (error) {
            this.showNotification('Qo\'ng\'iroqni yakunlashda xatolik', 'error');
            console.error('Hangup error:', error);
        }
    }
    
    async answerCall(callId) {
        try {
            const response = await fetch(`/api/sip/answer/${callId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answeredBy: 'current-user'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentCall = data.data.call;
                this.showCallInterface();
                this.startCallTimer();
                this.showNotification('Qo\'ng\'iroq qabul qilindi', 'success');
            } else {
                this.showNotification(data.error, 'error');
            }
            
        } catch (error) {
            this.showNotification('Qo\'ng\'iroqni qabul qilishda xatolik', 'error');
            console.error('Answer error:', error);
        }
    }
    
    // Call Controls
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('muteBtn');
        
        if (this.isMuted) {
            muteBtn.innerHTML = '<span class="material-symbols-outlined">mic_off</span><span>Unmute</span>';
            muteBtn.classList.add('active');
        } else {
            muteBtn.innerHTML = '<span class="material-symbols-outlined">mic</span><span>Mute</span>';
            muteBtn.classList.remove('active');
        }
        
        // Here you would mute/unmute the actual audio stream
        this.showNotification(this.isMuted ? 'Mikrofon o\'chirildi' : 'Mikrofon yoqildi', 'info');
    }
    
    toggleHold() {
        this.isOnHold = !this.isOnHold;
        const holdBtn = document.getElementById('holdBtn');
        
        if (this.isOnHold) {
            holdBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span><span>Resume</span>';
            holdBtn.classList.add('active');
            this.pauseCallTimer();
        } else {
            holdBtn.innerHTML = '<span class="material-symbols-outlined">pause</span><span>Hold</span>';
            holdBtn.classList.remove('active');
            this.resumeCallTimer();
        }
        
        // Here you would hold/resume the actual call
        this.showNotification(this.isOnHold ? 'Qo\'ng\'iroq kutishda' : 'Qo\'ng\'iroq davom etdi', 'info');
    }
    
    showTransfer() {
        document.getElementById('transferModal').style.display = 'block';
    }
    
    closeTransferModal() {
        document.getElementById('transferModal').style.display = 'none';
        document.getElementById('transferNumber').value = '';
    }
    
    executeTransfer() {
        const transferNumber = document.getElementById('transferNumber').value;
        
        if (!transferNumber) {
            this.showNotification('O\'tkazish raqamini kiriting', 'error');
            return;
        }
        
        // Here you would execute the call transfer
        this.showNotification(`Qo'ng'iroq ${transferNumber} ga o'tkazilmoqda`, 'info');
        this.closeTransferModal();
    }
    
    // DTMF (Dial Tone Multi-Frequency)
    sendDTMF(digit) {
        if (!this.currentCall) {
            return;
        }
        
        // Here you would send DTMF to the SIP call
        console.log('Sending DTMF:', digit);
        this.showNotification(`DTMF yuborildi: ${digit}`, 'info');
    }
    
    // UI Management
    appendNumber(digit) {
        const phoneNumberInput = document.getElementById('phoneNumber');
        phoneNumberInput.value += digit;
        
        // If in call, send as DTMF
        if (this.currentCall) {
            this.sendDTMF(digit);
        }
    }
    
    clearNumber() {
        const phoneNumberInput = document.getElementById('phoneNumber');
        phoneNumberInput.value = phoneNumberInput.value.slice(0, -1);
    }
    
    quickDial(number) {
        document.getElementById('phoneNumber').value = number;
        if (this.isConnected) {
            this.makeCall();
        }
    }
    
    showCallInterface() {
        document.getElementById('callInfo').style.display = 'block';
        document.getElementById('callBtn').style.display = 'none';
        document.getElementById('hangupBtn').style.display = 'inline-flex';
        document.getElementById('callControls').style.display = 'flex';
        
        if (this.currentCall) {
            document.getElementById('callerNumber').textContent = this.currentCall.to;
            document.getElementById('callStatus').textContent = 'Qo\'ng\'iroq qilinmoqda...';
        }
    }
    
    hideCallInterface() {
        document.getElementById('callInfo').style.display = 'none';
        document.getElementById('callBtn').style.display = 'inline-flex';
        document.getElementById('hangupBtn').style.display = 'none';
        document.getElementById('callControls').style.display = 'none';
    }
    
    updateUI() {
        const callBtn = document.getElementById('callBtn');
        callBtn.disabled = !this.isConnected;
    }
    
    // Call Timer
    startCallTimer() {
        this.callStartTime = Date.now();
        this.callTimer = setInterval(() => {
            this.updateCallTimer();
        }, 1000);
    }
    
    updateCallTimer() {
        if (!this.callStartTime || this.isOnHold) {
            return;
        }
        
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('callTimer').textContent = formattedTime;
    }
    
    pauseCallTimer() {
        // Timer continues but we mark the hold time
        // In real implementation, you'd pause the actual timer
    }
    
    resumeCallTimer() {
        // Resume timer from where it left off
    }
    
    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        this.callStartTime = null;
    }
    
    endCall() {
        this.currentCall = null;
        this.isMuted = false;
        this.isOnHold = false;
        this.stopCallTimer();
        this.hideCallInterface();
        this.clearNumber();
        
        // Reset button states
        document.getElementById('muteBtn').innerHTML = '<span class="material-symbols-outlined">mic</span><span>Mute</span>';
        document.getElementById('muteBtn').classList.remove('active');
        document.getElementById('holdBtn').innerHTML = '<span class="material-symbols-outlined">pause</span><span>Hold</span>';
        document.getElementById('holdBtn').classList.remove('active');
    }
    
    // Event Handlers
    handleCallStatusUpdate(data) {
        console.log('Call status update:', data);
        
        if (this.currentCall && this.currentCall.callId === data.callId) {
            switch (data.status) {
                case 'ringing':
                    document.getElementById('callStatus').textContent = 'Jarang...';
                    break;
                case 'answered':
                    document.getElementById('callStatus').textContent = 'Ulandi';
                    break;
                case 'completed':
                case 'cancelled':
                    this.endCall();
                    break;
                case 'failed':
                    this.endCall();
                    this.showNotification('Qo\'ng\'iroq muvaffaqiyatsiz', 'error');
                    break;
            }
        }
        
        // Refresh call history
        if (typeof refreshCallHistory === 'function') {
            refreshCallHistory();
        }
    }
    
    handleIncomingCall(data) {
        // Show incoming call notification
        const shouldAnswer = confirm(`Kiruvchi qo'ng'iroq: ${data.call.from}\\nQabul qilasizmi?`);
        
        if (shouldAnswer) {
            this.answerCall(data.call.callId);
        } else {
            // Decline call
            this.hangupCall();
        }
    }
    
    handleDTMFReceived(data) {
        console.log('DTMF received:', data);
    }
    
    // Utility Functions
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }
}

// Global functions for HTML onclick handlers
function toggleSipConnection() {
    if (window.sipPhone) {
        window.sipPhone.toggleSipConnection();
    }
}

function makeCall() {
    if (window.sipPhone) {
        window.sipPhone.makeCall();
    }
}

function hangupCall() {
    if (window.sipPhone) {
        window.sipPhone.hangupCall();
    }
}

function appendNumber(digit) {
    if (window.sipPhone) {
        window.sipPhone.appendNumber(digit);
    }
}

function clearNumber() {
    if (window.sipPhone) {
        window.sipPhone.clearNumber();
    }
}

function quickDial(number) {
    if (window.sipPhone) {
        window.sipPhone.quickDial(number);
    }
}

function toggleMute() {
    if (window.sipPhone) {
        window.sipPhone.toggleMute();
    }
}

function toggleHold() {
    if (window.sipPhone) {
        window.sipPhone.toggleHold();
    }
}

function showTransfer() {
    if (window.sipPhone) {
        window.sipPhone.showTransfer();
    }
}

function closeTransferModal() {
    if (window.sipPhone) {
        window.sipPhone.closeTransferModal();
    }
}

function executeTransfer() {
    if (window.sipPhone) {
        window.sipPhone.executeTransfer();
    }
}