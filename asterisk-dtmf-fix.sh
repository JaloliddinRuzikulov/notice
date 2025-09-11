#!/bin/bash

echo "🛠️ Asterisk DTMF Sozlamalarini To'g'rilash"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Joriy DTMF mode ni tekshirish
echo "1️⃣ Joriy DTMF mode:"
sudo asterisk -rx "sip show peer 5530" 2>/dev/null | grep -i dtmf || echo "   Topilmadi"
echo ""

# 2. sip.conf ni yangilash
echo "2️⃣ sip.conf ni yangilash..."
if [ -f /etc/asterisk/sip.conf ]; then
    # Backup
    sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # DTMF mode ni to'g'rilash
    if sudo grep -q "^\[5530\]" /etc/asterisk/sip.conf; then
        echo "   5530 peer topildi. DTMF mode yangilanmoqda..."
        
        # dtmfmode qo'shish yoki yangilash
        sudo sed -i '/^\[5530\]/,/^\[/{
            /^dtmfmode/d
        }' /etc/asterisk/sip.conf
        
        sudo sed -i '/^\[5530\]/a dtmfmode=rfc2833' /etc/asterisk/sip.conf
        
        echo "   ✅ dtmfmode=rfc2833 qo'shildi"
    else
        echo "   ❌ [5530] peer topilmadi"
    fi
    
    # Global DTMF sozlamalari
    if ! sudo grep -q "^dtmfmode=" /etc/asterisk/sip.conf; then
        echo "   Global DTMF mode qo'shilmoqda..."
        sudo sed -i '/^\[general\]/a dtmfmode=rfc2833' /etc/asterisk/sip.conf
    fi
else
    echo "   ❌ /etc/asterisk/sip.conf topilmadi"
fi

echo ""
echo "3️⃣ Asterisk'ni qayta yuklash..."
sudo asterisk -rx "sip reload" 2>/dev/null || echo "   ⚠️  Qayta yuklashda xatolik"

sleep 2

echo ""
echo "4️⃣ Yangilangan DTMF mode:"
sudo asterisk -rx "sip show peer 5530" 2>/dev/null | grep -i dtmf || echo "   Topilmadi"

echo ""
echo "✅ Tayyor! Endi qayta test qiling:
   1. Server'ni qayta ishga tushiring (Ctrl+C, npm run dev)
   2. 990823112 ga qo'ng'iroq qiling
   3. 1 raqamini bosing"