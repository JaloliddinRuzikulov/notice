#!/bin/bash

echo "🔍 DTMF Debug Helper"
echo "===================="
echo ""

# Check if server is running
if pgrep -f "server.js" > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is NOT running!"
    echo "   Run: cd /home/user && npm start"
    exit 1
fi

echo ""
echo "📊 Recent DTMF Activity:"
echo "------------------------"
grep -E "DTMF|INFO|Signal|broadcast-confirmed|digit" /home/user/server.log | tail -10

echo ""
echo "📞 Recent Call Status:"
echo "---------------------"
grep -E "answered|Call was answered but NO DTMF" /home/user/server.log | tail -5

echo ""
echo "🔧 DTMF Detection Methods Status:"
echo "---------------------------------"
echo -n "SIP INFO detection: "
if grep -q "INFO REQUEST DETECTED" /home/user/server.log; then
    echo "✅ Working"
else
    echo "❌ No INFO messages detected"
fi

echo -n "RFC 2833 detection: "
if grep -q "RFC 2833 DTMF" /home/user/server.log; then
    echo "✅ Working"
else
    echo "❌ No RFC 2833 packets detected"
fi

echo -n "Alternative detector: "
if grep -q "ALT-DTMF" /home/user/server.log; then
    echo "✅ Running"
else
    echo "⚠️  Not active"
fi

echo ""
echo "💡 Quick Actions:"
echo "-----------------"
echo "1. Test DTMF locally:"
echo "   ./dtmf-simulator.js"
echo ""
echo "2. Monitor real-time:"
echo "   ./dtmf-monitor-realtime.js"
echo ""
echo "3. Check dashboard:"
echo "   https://172.27.64.10:8444/broadcast-dashboard.html"
echo ""
echo "4. Asterisk config fix:"
echo "   ssh admin@10.105.0.3"
echo "   sudo nano /etc/asterisk/sip.conf"
echo "   Add: dtmfmode=rfc2833"
echo ""

echo "📈 Current Statistics:"
echo "---------------------"
TOTAL_CALLS=$(grep -c "INVITE sip:" /home/user/server.log 2>/dev/null || echo "0")
ANSWERED_CALLS=$(grep -c "answered.*true" /home/user/server.log 2>/dev/null || echo "0") 
DTMF_DETECTED=$(grep -c "broadcast-confirmed" /home/user/server.log 2>/dev/null || echo "0")

echo "Total calls made: $TOTAL_CALLS"
echo "Calls answered: $ANSWERED_CALLS"
echo "DTMF confirmations: $DTMF_DETECTED"

if [ "$ANSWERED_CALLS" -gt 0 ] && [ "$DTMF_DETECTED" -eq 0 ]; then
    echo ""
    echo "⚠️  WARNING: Calls are being answered but NO DTMF detected!"
    echo "    This confirms Asterisk is not sending DTMF to Node.js"
fi