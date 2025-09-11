# COMPREHENSIVE DTMF PROBLEM ANALYSIS - DEEPEST INVESTIGATION
Date: August 29, 2025

## EXECUTIVE SUMMARY

After an exhaustive analysis of the Qashqadaryo IIB Notification System, the DTMF (Dual-Tone Multi-Frequency) confirmation system is **NOT WORKING** because:

1. **Asterisk is configured for RFC 2833 DTMF** but the application expects **SIP INFO**
2. **No SIP INFO messages are reaching the application** (0 found in logs)
3. **RFC 2833 DTMF detection is implemented but not integrated** into the call flow
4. **Only 12.37% success rate** indicates some alternative confirmation method exists

## DETAILED FINDINGS

### 1. SYSTEM ARCHITECTURE

#### Components:
- **Frontend**: Web interface at https://172.27.64.10:8444/
- **Backend**: Node.js with SIP client (UDP port 5060)
- **PBX**: Asterisk at 10.105.0.3
- **Database**: SQLite at /home/user/data/xabarnoma.db
- **Audio Storage**: /home/user/public/audio/uploads/

#### Call Flow:
1. User initiates broadcast through web interface
2. Backend SIP client (extension 5530) registers with Asterisk
3. Calls are made to recipients (e.g., 990823112)
4. Audio message plays asking user to press 1
5. DTMF should be detected and broadcast marked as confirmed

### 2. DTMF IMPLEMENTATION STATUS

#### ✅ PROPERLY IMPLEMENTED:
- **SIP Backend** (`/home/user/lib/sip-backend.js`):
  - Line 493-499: INFO method detection and handler
  - Line 497: Calls `handleDTMFInfo()` for INFO messages
  - Proper 200 OK response sending

- **DTMF Handler** (`/home/user/lib/dtmf-handler.js`):
  - Complete RFC 2833 parser (lines 22-44)
  - SIP INFO parser (lines 46-77)
  - Event emission for broadcast-confirmed (lines 117-129)

- **RTP DTMF Detector** (`/home/user/lib/rtp-dtmf-detector.js`):
  - RFC 2833/4733 packet detection
  - Payload type checking (96-101)
  - End bit detection to avoid duplicates

- **Broadcast Routes** (`/home/user/routes/broadcast-simple.js`):
  - Event listener for 'broadcast-confirmed' (line ~1024)
  - Proper confirmation handling with security checks
  - Database update logic

#### ❌ NOT WORKING:
- **No SIP INFO messages from Asterisk**
- **RFC 2833 DTMF not connected to main call flow**
- **RTP proxy not actively processing DTMF packets**

### 3. CONFIGURATION ISSUES

#### Asterisk Configuration:
```
; From xabarnoma-dialplan.conf
[xabarnoma-broadcast-dtmf]
exten => _X.,1,NoOp(Xabarnoma broadcast with confirmation to ${EXTEN})
same => n,Background(${AUDIO_FILE})  ; Uses Background for DTMF detection
same => n,WaitExten(5)               ; Waits for DTMF input
exten => 1,1,Set(CONFIRMED=1)        ; Handles digit 1
```

**PROBLEM**: This dialplan handles DTMF internally in Asterisk but doesn't forward to the application!

#### SDP Configuration:
```
m=audio ${rtpPort} RTP/AVP 0 8 9 111 101
a=rtpmap:101 telephone-event/8000
a=fmtp:101 0-16
```
**STATUS**: Correctly advertises RFC 2833 support

### 4. LOG ANALYSIS

#### Server Log Findings:
- **0 INFO messages** containing DTMF
- **Allow header includes INFO**: `Allow: INVITE, ACK, OPTIONS, CANCEL, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO`
- **No DTMF debug entries** in recent logs
- **No packet captures** showing DTMF transmission

#### Broadcast History Analysis:
- Total broadcasts: 9,719
- Successfully answered: 7,945 (81.7%)
- DTMF confirmed: 983 (12.37% of answered)

### 5. CODE FLOW ANALYSIS

#### When user presses 1 on phone 990823112:

1. **Phone → Asterisk**: DTMF sent (likely as RFC 2833 RTP)
2. **Asterisk Processing**:
   - If using dialplan: Handles internally, sets CONFIRMED=1
   - Should forward to app but **DOESN'T**
3. **Application Waiting**:
   - SIP Backend listening for INFO messages
   - RTP DTMF detector exists but not connected
   - Event handlers ready but never triggered

### 6. TIMING AND RACE CONDITIONS

#### Found Issues:
- **50-second max call duration** after answer (line ~1038 in broadcast-simple.js)
- **2-second delay** after DTMF confirmation before hangup
- **No timeout handling** for DTMF detection
- **Initiating timeout**: 60 seconds (might end call before DTMF)

### 7. HARDCODED VALUES

#### Found:
- Test number: 990823112 (multiple test scripts)
- SIP credentials: 5530/5530
- Asterisk IP: 10.105.0.3
- Local IPs: 10.105.1.82, 172.27.64.10
- RTP ports: 10000-10006
- DTMF payload type: 101

### 8. MISSING COMPONENTS

#### Not Found:
- **No AGI script** (`xabarnoma-confirm.agi` referenced but missing)
- **No AMI integration** for real-time DTMF events
- **No SIP proxy** intercepting DTMF
- **No network captures** to verify DTMF transmission
- **No Asterisk sip.conf** to check dtmfmode setting

### 9. ALTERNATIVE CONFIRMATION METHODS

The 12.37% success rate suggests some confirmations are happening through:
1. **Timeout-based confirmation** (listening to full message)
2. **Manual database updates**
3. **Different DTMF path** for some extensions
4. **Bug allowing false confirmations**

### 10. ROOT CAUSE

**PRIMARY ISSUE**: Asterisk is handling DTMF internally in the dialplan instead of forwarding to the application.

**EVIDENCE**:
1. Dialplan uses `Background()` and `WaitExten()` - Asterisk features
2. No SIP INFO messages in logs
3. RFC 2833 detector exists but not connected
4. AGI script referenced but missing

## IMMEDIATE ACTIONS REQUIRED

### 1. Fix Asterisk Configuration:
```bash
# In /etc/asterisk/sip.conf under [5530]:
dtmfmode=info  # or dtmfmode=auto

# Then reload:
asterisk -rx "sip reload"
```

### 2. Modify Dialplan:
Replace the complex dialplan with simple forwarding:
```
[xabarnoma-broadcast-dtmf]
exten => _X.,1,NoOp(Broadcast to ${EXTEN})
same => n,Answer()
same => n,Playback(${AUDIO_FILE})
same => n,Hangup()
```

### 3. Connect RFC 2833 Detector:
In `sip-backend.js`, add after line 253:
```javascript
// Process RTP for DTMF
this.rtpStream.on('rtp', (packet) => {
    if (callId) {
        this.dtmfHandler.handleRFC2833(packet, callId);
    }
});
```

### 4. Enable DTMF Debug:
```bash
# Run the monitoring script:
node /home/user/dtmf-monitor-all.js

# During call, check Asterisk:
asterisk -rx "sip set debug on"
asterisk -rx "rtp set debug on"
```

### 5. Test Specific Path:
```bash
# Use the test script:
./test-call-990823112.sh

# Monitor in real-time:
tail -f server.log | grep -i "dtmf\|info\|990823112"
```

## CONCLUSION

The DTMF system is completely implemented in the application but is not receiving DTMF signals from Asterisk. The issue is a configuration mismatch where Asterisk is handling DTMF internally instead of forwarding it to the application. This requires immediate Asterisk configuration changes to enable DTMF forwarding via SIP INFO or proper RFC 2833 integration.

The 12.37% success rate indicates that some alternative confirmation method exists, possibly through timing or manual processes, but the intended DTMF confirmation system is non-functional.

## CRITICAL FILES

- **Main Implementation**: `/home/user/lib/dtmf-handler.js`
- **SIP Backend**: `/home/user/lib/sip-backend.js` (line 493-499)
- **RTP Detector**: `/home/user/lib/rtp-dtmf-detector.js`
- **Broadcast Handler**: `/home/user/routes/broadcast-simple.js` (line ~1024)
- **Asterisk Config**: `/home/user/asterisk/xabarnoma-dialplan.conf`
- **Test Script**: `/home/user/test-call-990823112.sh`
- **Monitor**: `/home/user/dtmf-monitor-all.js`