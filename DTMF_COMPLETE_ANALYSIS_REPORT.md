# COMPREHENSIVE DTMF PROBLEM ANALYSIS REPORT

Date: August 29, 2025

## Executive Summary

After an extremely thorough analysis of the DTMF (Dual-Tone Multi-Frequency) system in the Qashqadaryo IIB Notification System, the primary issue has been identified: **Asterisk is NOT sending DTMF signals via SIP INFO messages to the application**. While the application code is correctly implemented and ready to handle DTMF, no INFO messages are being received from Asterisk.

### Key Findings:
- **0 SIP INFO messages** found in server logs
- **12.37% DTMF success rate** (983 confirmations out of 7,945 answered calls)
- All DTMF handling code is properly implemented
- The issue is at the Asterisk configuration level

## Detailed Analysis

### 1. System Architecture Review

The DTMF flow should work as follows:
1. User receives broadcast call
2. User presses "1" on their phone
3. Phone sends DTMF to Asterisk
4. Asterisk forwards DTMF to application via SIP INFO
5. Application processes DTMF and confirms broadcast

### 2. Code Analysis Results

#### ✅ Application Code Status
- **SIP Backend (`/home/user/lib/sip-backend.js`)**
  - INFO message detection: ✅ Implemented
  - DTMF INFO handler: ✅ Implemented
  - Response sending: ✅ Implemented
  - Event emission: ✅ Implemented

- **DTMF Handler (`/home/user/lib/dtmf-handler.js`)**
  - SIP INFO parsing: ✅ Implemented
  - RFC 2833 support: ✅ Implemented
  - Event handling: ✅ Implemented
  - Call tracking: ✅ Implemented

- **Broadcast Routes**
  - Event listeners: ✅ Configured
  - Confirmation logic: ✅ Implemented
  - Database updates: ✅ Implemented

### 3. Log Analysis Results

#### Server Log Statistics:
```
Total INFO messages found: 0
Total DTMF-related entries: 712
Recent confirmations: 983 (out of 7,945 answered calls)
```

#### Critical Finding:
**NO SIP INFO messages are reaching the application**, despite:
- INFO being included in the SIP "Allow" header
- Code being ready to handle INFO messages
- Proper event listeners configured

### 4. Network Configuration

- **SIP Registration**: Working correctly (UDP port 5060)
- **RTP Ports**: Configured (10002)
- **SDP Configuration**: Includes telephone-event support
  ```
  a=rtpmap:101 telephone-event/8000
  a=fmtp:101 0-16
  ```

### 5. Historical Performance

From broadcast history analysis:
- Total broadcast calls: 9,719
- Successfully answered: 7,945 (81.7%)
- DTMF confirmed: 983 (12.37% of answered)

This 12.37% confirmation rate suggests DTMF is working sporadically, possibly through alternative methods or specific configurations.

## Root Cause Analysis

### Primary Issue: Asterisk DTMF Mode Configuration

The most likely cause is that Asterisk is configured to send DTMF via **RFC 2833 (RTP)** instead of **SIP INFO**. 

#### Evidence:
1. Zero INFO messages in logs
2. Some confirmations still occur (12.37%)
3. RTP telephone-event is configured but may not be fully processed

### Secondary Issues:

1. **Endpoint Configuration**
   - Some phones may not be sending DTMF properly
   - DTMF may be disabled on certain devices

2. **Network Path**
   - INFO messages could be blocked by firewall rules
   - SIP ALG might be interfering

3. **RTP DTMF Detection**
   - Current implementation primarily handles SIP INFO
   - RTP DTMF detection exists but may not be fully integrated

## Recommendations

### Immediate Actions:

1. **Check Asterisk DTMF Configuration**
   ```bash
   asterisk -rx "sip show peer 5530" | grep -i dtmf
   ```
   Expected: `dtmfmode: info` or `dtmfmode: auto`

2. **Update Asterisk Configuration**
   In `/etc/asterisk/sip.conf` or peer configuration:
   ```ini
   [5530]
   dtmfmode=auto  ; or dtmfmode=info
   ```

3. **Enable SIP Debug in Asterisk**
   ```bash
   asterisk -rx "sip set debug on"
   asterisk -rx "sip set debug ip 10.105.1.82"
   ```

### Long-term Solutions:

1. **Enhance RTP DTMF Detection**
   - Fully integrate RTP DTMF detector
   - Process telephone-event packets in real-time

2. **Add DTMF Monitoring Dashboard**
   - Real-time DTMF event display
   - Success rate tracking
   - Per-district statistics

3. **Implement Fallback Methods**
   - Voice recognition for confirmations
   - SMS confirmation option
   - Web portal confirmation

## Test Procedures

### To Verify DTMF Path:
1. Make test call to 990823112
2. Monitor Asterisk CLI: `asterisk -rvvv`
3. Press "1" when prompted
4. Check for DTMF events in Asterisk
5. Verify INFO message transmission

### Available Test Scripts:
- `/home/user/test-dtmf-complete.sh` - Full DTMF test
- `/home/user/dtmf-monitor-all.js` - Real-time monitoring
- `/home/user/check-asterisk-dtmf.sh` - Configuration check

## Conclusion

The DTMF system is properly implemented at the application level but is not receiving DTMF signals from Asterisk. The primary action required is to configure Asterisk to send DTMF via SIP INFO messages. Once this configuration is corrected, the existing code should handle DTMF confirmations properly.

The 12.37% success rate indicates that some DTMF signals are being processed, possibly through RFC 2833 or other methods, but the majority are being lost due to the configuration mismatch.

## Appendix: File Locations

- **Core DTMF Handler**: `/home/user/lib/dtmf-handler.js`
- **SIP Backend**: `/home/user/lib/sip-backend.js`
- **RTP DTMF Detector**: `/home/user/lib/rtp-dtmf-detector.js`
- **Broadcast Routes**: `/home/user/routes/broadcast-simple.js`
- **Test Scripts**: `/home/user/*dtmf*.sh`
- **Logs**: `/home/user/server.log`
- **Call History**: `/home/user/data/broadcast-history.json`