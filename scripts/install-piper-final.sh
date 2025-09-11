#!/bin/bash

echo "======================================="
echo "Piper TTS O'rnatishni Tugatish"
echo "======================================="

# Check if Piper binary exists
if [ -f ~/piper/piper ]; then
    echo "1. Piper binary topildi, o'rnatilmoqda..."
    sudo cp ~/piper/piper /usr/local/bin/
    sudo chmod +x /usr/local/bin/piper
    echo "✓ Piper o'rnatildi"
else
    echo "✗ Piper binary topilmadi ~/piper/piper"
    exit 1
fi

# Create voices directory
echo "2. Ovozlar papkasini yaratish..."
sudo mkdir -p /usr/share/piper-voices/{ru,kk,en}

# Move voice models from /tmp if they exist
echo "3. Ovoz modellarini ko'chirish..."

if [ -f /tmp/ru_RU-irina-medium.onnx ]; then
    sudo mv /tmp/ru_RU-irina-medium.* /usr/share/piper-voices/ru/
    echo "✓ Rus ayol ovozi o'rnatildi"
fi

if [ -f /tmp/ru_RU-ruslan-medium.onnx ]; then
    sudo mv /tmp/ru_RU-ruslan-medium.* /usr/share/piper-voices/ru/
    echo "✓ Rus erkak ovozi o'rnatildi"
fi

if [ -f /tmp/kk_KZ-iseke-x_low.onnx ]; then
    sudo mv /tmp/kk_KZ-iseke-x_low.* /usr/share/piper-voices/kk/
    echo "✓ Qozoq ovozi o'rnatildi (O'zbek uchun)"
fi

# Test Piper
echo "4. Piper ni tekshirish..."
echo "Salom dunyo" | piper --model /usr/share/piper-voices/ru/ru_RU-irina-medium.onnx --output_file /tmp/test-piper.wav 2>/dev/null

if [ -f /tmp/test-piper.wav ]; then
    echo "✓ Piper TTS ishlayapti!"
    rm /tmp/test-piper.wav
else
    echo "✗ Piper test muvaffaqiyatsiz"
fi

echo ""
echo "O'rnatish tugallandi!"
echo ""
echo "Server ni qayta ishga tushiring:"
echo "pkill -f 'node.*server.js' && npm start"