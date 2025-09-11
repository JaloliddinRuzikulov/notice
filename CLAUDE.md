# Qashqadaryo IIB Notification System - Instructions for Claude

## Current Status
- Backend SIP client is registered and working (UDP-based)
- WebSocket proxy is running at wss://172.27.64.10:8444/ws
- Main issue: Audio requires WebRTC or proper Asterisk WebSocket configuration

## Known Issues and Solutions

### 1. SIP Phone Disconnection
- Backend SIP is actually connected (check server.log)
- Frontend shows "ulanmagan" due to WebSocket fallback
- Solution: Use the "Test WebRTC Audio" button to verify connection

### 2. Audio Not Working
- Backend SIP handles only signaling (not RTP audio)
- For full audio support, need one of:
  a) Configure Asterisk for WebRTC (see CHECK_ASTERISK_HTTP.md)
  b) Use direct WebRTC client (Test WebRTC Audio button)
  c) Implement RTP relay in backend

### 3. Microphone Control
- Microphone should only activate after call is answered
- Already implemented in enableMicrophone() method
- Triggered by 'sip-call-answered' event

## Test Commands
```bash
# Check SIP registration status
grep -E "registered|Registration" server.log | tail -10

# Test backend call
curl -k -X POST https://localhost:8444/api/sip/test-call

# Monitor SIP messages
tail -f server.log | grep -E "SIP|Response"
```

## Server Endpoints
- Main app: https://172.27.64.10:8444/
- Direct WebRTC test: https://172.27.64.10:8444/direct-webrtc-test.html
- SIP status: https://localhost:8444/api/sip/status (requires auth)

## Important Files
- `/lib/sip-backend.js` - Backend SIP implementation
- `/public/js/sip-phone.js` - Frontend SIP phone
- `/routes/sip.js` - SIP API endpoints
- `/lib/ws-to-udp-proxy.js` - WebSocket to UDP bridge

## Next Steps for Full Audio
1. Check Asterisk WebSocket config: `asterisk -rx "module show like websocket"`
2. Enable HTTP/WebSocket in Asterisk (see CHECK_ASTERISK_HTTP.md)
3. Or use the WebRTC test button for direct audio testing