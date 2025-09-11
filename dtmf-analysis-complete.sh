#!/bin/bash

echo "=== COMPREHENSIVE DTMF ANALYSIS ==="
echo "Date: $(date)"
echo "==============================================="
echo ""

# 1. Check current system status
echo "1. SYSTEM STATUS CHECK"
echo "----------------------"
echo "Server process:"
ps aux | grep "node server.js" | grep -v grep
echo ""

# 2. Check recent calls
echo "2. RECENT CALL HISTORY"
echo "----------------------"
echo "Last 10 broadcast attempts:"
grep -E "makeCall|call-answered|call-ended|broadcast-confirmed" /home/user/server.log | tail -10
echo ""

# 3. Check for INFO messages
echo "3. SIP INFO MESSAGE CHECK"
echo "-------------------------"
echo "Checking for INFO requests in server.log:"
grep -C 5 "INFO sip:" /home/user/server.log | tail -20 || echo "No INFO messages found"
echo ""
echo "Checking handleMessage for INFO detection:"
grep -C 3 "firstLine.startsWith('INFO ')" /home/user/lib/sip-backend.js
echo ""

# 4. Check DTMF handler integration
echo "4. DTMF HANDLER INTEGRATION"
echo "---------------------------"
echo "DTMF Handler import:"
grep "dtmf-handler" /home/user/lib/sip-backend.js | head -5
echo ""
echo "DTMF Handler initialization:"
grep -A 2 "this.dtmfHandler" /home/user/lib/sip-backend.js | head -5
echo ""

# 5. Check broadcast route integration
echo "5. BROADCAST ROUTE INTEGRATION"
echo "------------------------------"
echo "Broadcast confirmation listener:"
grep -A 5 "broadcast-confirmed" /home/user/routes/broadcast-simple.js | head -20
echo ""

# 6. Check recent broadcast history
echo "6. RECENT BROADCAST RESULTS"
echo "---------------------------"
echo "Recent broadcasts to 990823112:"
grep -C 10 "990823112" /home/user/data/broadcast-history.json | grep -E "dtmfConfirmed|confirmations|answered" | tail -10
echo ""

# 7. Check SIP configuration
echo "7. SIP CONFIGURATION"
echo "--------------------"
echo "SDP Configuration (telephone-event):"
grep -A 5 "telephone-event" /home/user/lib/sip-backend.js
echo ""
echo "DTMF Methods allowed:"
grep "Allow:.*INFO" /home/user/lib/sip-backend.js
echo ""

# 8. Check for test results
echo "8. TEST SCRIPT RESULTS"
echo "----------------------"
echo "Available test scripts:"
ls -la /home/user/*dtmf*.sh /home/user/*dtmf*.js 2>/dev/null | head -10
echo ""

# 9. Check for DTMF in RTP
echo "9. RTP DTMF DETECTION"
echo "---------------------"
echo "RTP DTMF detector status:"
if [ -f /home/user/lib/rtp-dtmf-detector.js ]; then
    echo "✅ RTP DTMF detector exists"
    grep -A 3 "processRTPPacket" /home/user/lib/rtp-dtmf-detector.js | head -5
else
    echo "❌ RTP DTMF detector not found"
fi
echo ""

# 10. Network analysis
echo "10. NETWORK CONFIGURATION"
echo "------------------------"
echo "Local IP configuration:"
ip addr show | grep inet | grep -v inet6 | grep -v 127.0.0.1
echo ""
echo "SIP port binding:"
netstat -tuln | grep 5060 || ss -tuln | grep 5060 || echo "Cannot check port bindings"
echo ""

# 11. Check for errors
echo "11. ERROR ANALYSIS"
echo "------------------"
echo "Recent DTMF-related errors:"
grep -i "error.*dtmf\|dtmf.*error" /home/user/server.log | tail -5 || echo "No DTMF errors found"
echo ""

# 12. Summary
echo "12. ANALYSIS SUMMARY"
echo "-------------------"
echo "Key findings:"
echo ""
echo "- INFO handling in sip-backend.js:"
grep -q "if (firstLine.startsWith('INFO '))" /home/user/lib/sip-backend.js && echo "  ✅ INFO detection code exists" || echo "  ❌ INFO detection code missing"
echo ""
echo "- DTMF handler integration:"
grep -q "this.dtmfHandler = new DTMFHandler()" /home/user/lib/sip-backend.js && echo "  ✅ DTMF handler initialized" || echo "  ❌ DTMF handler not initialized"
echo ""
echo "- Broadcast confirmation listener:"
grep -q "sip.on('broadcast-confirmed'" /home/user/routes/broadcast-simple.js && echo "  ✅ Broadcast confirmation listener exists" || echo "  ❌ Broadcast confirmation listener missing"
echo ""
echo "- Recent confirmations:"
CONFIRMATIONS=$(grep -c "dtmfConfirmed.*true" /home/user/data/broadcast-history.json 2>/dev/null || echo "0")
echo "  Total DTMF confirmations in history: $CONFIRMATIONS"
echo ""

echo "==============================================="
echo "Analysis complete: $(date)"