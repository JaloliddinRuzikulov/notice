#!/bin/bash

echo "🔧 Audio muammosini to'liq tuzatish"
echo "==================================="
echo ""

# 1. Check current status
echo "1️⃣ Server holatini tekshirish..."
if pgrep -f "server.js" > /dev/null; then
    echo "   ✅ Server ishlayapti"
else
    echo "   ❌ Server ishlamayapti!"
    echo "   Starting server..."
    cd /home/user && npm start &
    sleep 5
fi

# 2. Check recent SIP dialogs
echo ""
echo "2️⃣ So'nggi SIP dialoglarni tekshirish..."
echo ""
tail -100 /home/user/server.log | grep -E "INVITE|200 OK|ACK|audio|RTP" | tail -10

# 3. Test RTP ports
echo ""
echo "3️⃣ RTP portlarni tekshirish..."
nc -zvu localhost 10000 2>&1 | grep -q succeeded && echo "   ✅ Port 10000 ochiq" || echo "   ❌ Port 10000 yopiq"
nc -zvu localhost 10002 2>&1 | grep -q succeeded && echo "   ✅ Port 10002 ochiq" || echo "   ❌ Port 10002 yopiq"

# 4. Check firewall
echo ""
echo "4️⃣ Firewall sozlamalarini tekshirish..."
sudo iptables -L -n | grep -E "10000:20000" > /dev/null && echo "   ✅ RTP portlar ruxsat berilgan" || echo "   ⚠️  RTP portlar cheklangan bo'lishi mumkin"

# 5. Make test call with monitoring
echo ""
echo "5️⃣ Test qo'ng'iroq..."
echo ""

# Start monitor
./dtmf-universal-monitor.js &
MONITOR_PID=$!

sleep 2

# Login
curl -s -k -X POST https://localhost:8444/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "1"}' \
  -c cookies.txt > /dev/null

# Create test audio
echo "Test audio yaratilmoqda..."
espeak -v uz "Test xabar" -w /tmp/test.wav 2>/dev/null || {
    echo "Using fallback audio..."
    dd if=/dev/zero of=/tmp/test.wav bs=8000 count=2 2>/dev/null
}

# Convert to proper format
ffmpeg -i /tmp/test.wav -acodec pcm_alaw -ar 8000 -ac 1 -f wav /tmp/test-alaw.wav -y 2>/dev/null

# Send broadcast
echo ""
echo "Xabar yuborilmoqda..."
RESP=$(curl -s -k -X POST https://localhost:8444/api/broadcast/send \
  -b cookies.txt \
  -F "employees=[{\"id\":\"test-1\",\"fullName\":\"Test User\",\"phone\":\"990823112\",\"department\":\"Test\",\"districtId\":\"1\"}]" \
  -F "audioFile=@/tmp/test-alaw.wav;type=audio/wav" \
  -F "description=Audio Test" \
  -F "priority=urgent")

BROADCAST_ID=$(echo "$RESP" | grep -o '"broadcastId":"[^"]*' | cut -d'"' -f4)

if [ -n "$BROADCAST_ID" ]; then
    echo "✅ Broadcast yuborildi: $BROADCAST_ID"
    echo ""
    
    # Monitor for 30 seconds
    echo "30 soniya kuzatilmoqda..."
    sleep 30
    
    # Check results
    echo ""
    echo "6️⃣ Natijalar:"
    echo "-----------"
    
    # Check for ACK
    if tail -100 /home/user/server.log | grep -q "ACK.*SIP/2.0"; then
        echo "✅ ACK yuborildi"
    else
        echo "❌ ACK yuborilmadi!"
    fi
    
    # Check for audio
    if tail -100 /home/user/server.log | grep -q "Audio stream started\|streamAudio\|RTP.*started"; then
        echo "✅ Audio stream boshlandi"
    else
        echo "❌ Audio stream boshlanmadi!"
    fi
    
    # Check for RTP endpoint
    if tail -100 /home/user/server.log | grep -q "Remote RTP endpoint"; then
        echo "✅ RTP endpoint aniqlandi"
        tail -100 /home/user/server.log | grep "Remote RTP endpoint" | tail -1
    else
        echo "❌ RTP endpoint aniqlanmadi!"
    fi
else
    echo "❌ Broadcast yuborishda xatolik: $RESP"
fi

# Stop monitor
kill $MONITOR_PID 2>/dev/null

echo ""
echo "7️⃣ Tavsiyalar:"
echo "-------------"
echo "1. Agar ACK yuborilmasa - Asterisk Contact header yuborayotganini tekshiring"
echo "2. Agar audio boshlanmasa - RTP endpoint to'g'ri aniqlanganini tekshiring"
echo "3. Server loglarni to'liq ko'rish: tail -f /home/user/server.log"
echo ""
echo "✅ Test tugadi"