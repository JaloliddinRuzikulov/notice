#\!/bin/bash

echo "🔍 DTMF Konfiguratsiyasini tekshirish"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Asterisk DTMF settings
echo "1. Asterisk DTMF sozlamalari:"
sudo asterisk -rx "sip show peer 5530"  < /dev/null |  grep -i dtmf || echo "   ⚠️  DTMF sozlamasi topilmadi"
echo ""

echo "2. Asterisk global DTMF settings:"
sudo asterisk -rx "sip show settings" | grep -i dtmf
echo ""

echo "3. Active channels DTMF mode:"
sudo asterisk -rx "core show channels concise" | head -5
echo ""

echo "4. SIP port status:"
sudo netstat -tlnp | grep 5060
echo ""

echo "5. RTP ports (10000-20000):"
sudo netstat -ulnp | grep -E "10002|10000|20000" | head -5
echo ""

echo "📝 Tavsiyalar:"
echo "   - DTMF Mode 'rfc2833' yoki 'auto' bo'lishi kerak"
echo "   - Port 10002 ochiq bo'lishi kerak"
echo "   - Firewall RTP trafikni bloklashi mumkin"
