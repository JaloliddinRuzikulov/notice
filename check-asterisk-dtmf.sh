#!/bin/bash

echo "=== Asterisk DTMF Configuration Check ==="
echo ""

# Check if we can connect to Asterisk
echo "1. Checking Asterisk connection..."
if asterisk -rx "core show version" 2>/dev/null; then
    echo "✅ Connected to Asterisk"
else
    echo "❌ Cannot connect to Asterisk CLI"
    echo "   Trying with sudo..."
    sudo asterisk -rx "core show version" 2>/dev/null || echo "Failed with sudo too"
fi

echo ""
echo "2. Checking DTMF settings for extension 5530..."
asterisk -rx "sip show peer 5530" 2>/dev/null | grep -E "DTMF|dtmf" || \
    sudo asterisk -rx "sip show peer 5530" 2>/dev/null | grep -E "DTMF|dtmf"

echo ""
echo "3. Checking global DTMF settings..."
asterisk -rx "sip show settings" 2>/dev/null | grep -i dtmf || \
    sudo asterisk -rx "sip show settings" 2>/dev/null | grep -i dtmf

echo ""
echo "4. Checking for active channels during call..."
echo "   (Make a test call to see this info)"

echo ""
echo "5. Checking sip.conf for DTMF configuration..."
if [ -f /etc/asterisk/sip.conf ]; then
    grep -i dtmf /etc/asterisk/sip.conf | head -10
else
    echo "   sip.conf not found in standard location"
fi

echo ""
echo "6. DTMF Logger command (run during active call):"
echo "   asterisk -rx 'core set debug 3'"
echo "   asterisk -rx 'sip set debug on'"
echo "   asterisk -rx 'rtp set debug on'"

echo ""
echo "7. Monitor Asterisk for DTMF in real-time:"
echo "   sudo asterisk -rvvv"
echo "   Then during call, you should see DTMF events"

echo ""
echo "=== Recommendations ==="
echo "1. Ensure dtmfmode=rfc2833 or dtmfmode=info in sip.conf"
echo "2. For INFO mode, add: dtmfmode=info"
echo "3. For RFC2833, add: dtmfmode=rfc2833"
echo "4. Reload after changes: asterisk -rx 'sip reload'"