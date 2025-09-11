#!/bin/bash

echo "🔍 DTMF Chuqur Monitoring"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Asterisk SIP peer sozlamalarini tekshirish
echo "1️⃣ Asterisk SIP Peer sozlamalari:"
sudo asterisk -rx "sip show peer 5530" 2>/dev/null | grep -E "dtmf|DTMF|Call|Host|Status" || echo "   Asterisk ulanmadi"
echo ""

# 2. Joriy portlarni tekshirish
echo "2️⃣ Ochiq UDP portlar:"
sudo netstat -unlp 2>/dev/null | grep -E "5060|10002|node" | head -10
echo ""

# 3. Firewall holatini tekshirish
echo "3️⃣ Firewall holati:"
sudo iptables -L -n 2>/dev/null | grep -E "5060|10002|ACCEPT|DROP" | head -10 || echo "   Firewall o'chirilgan"
echo ""

# 4. Real-time SIP/RTP trafik monitoring
echo "4️⃣ Real-time trafik monitoring boshlandi..."
echo "   30 soniya davomida barcha SIP/RTP trafik kuzatiladi"
echo ""

# Barcha SIP va RTP trafikni kuzatish
sudo timeout 30 tcpdump -i any -s 0 -w /tmp/dtmf-capture.pcap "port 5060 or portrange 10000-20000" 2>/dev/null &
TCPDUMP_PID=$!

# Node.js debug monitoring
echo "5️⃣ Node.js DTMF debug monitoring:"
tail -f /home/user/server.log 2>/dev/null | grep -E --color=always "DTMF|INFO|Signal|digit|button|telephone-event|4733|2833" &
LOG_PID=$!

echo ""
echo "📞 ENDI TEST QILING:"
echo "   1. 990823112 ga qo'ng'iroq qiling"
echo "   2. Javob berilgandan keyin 1 ni bosing"
echo "   3. 30 soniya kutilmoqda..."
echo ""

sleep 30

# Monitoring to'xtatish
kill $LOG_PID 2>/dev/null
sudo kill $TCPDUMP_PID 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6. Capture tahlili
echo "6️⃣ Trafik tahlili:"
if [ -f /tmp/dtmf-capture.pcap ]; then
    echo "   SIP INFO paketlar:"
    sudo tcpdump -r /tmp/dtmf-capture.pcap -A 2>/dev/null | grep -E "INFO sip:|Signal=" | head -20
    
    echo ""
    echo "   RTP telephone-event paketlar:"
    sudo tcpdump -r /tmp/dtmf-capture.pcap 2>/dev/null | grep -E "UDP.*101|telephone-event" | head -10
    
    echo ""
    echo "   Umumiy statistika:"
    sudo tcpdump -r /tmp/dtmf-capture.pcap 2>/dev/null | wc -l
    echo "   ta paket ushlandi"
fi

echo ""
echo "✅ Monitoring tugadi"
echo ""
echo "Agar DTMF ko'rinmasa:"
echo "1. Asterisk DTMF yubormagandir"
echo "2. Yoki boshqa port/protokol ishlatilgan"
echo "3. Yoki network/firewall bloklagan"