#!/bin/bash

echo "==================================="
echo "TTS dasturlarini o'rnatish"
echo "==================================="

# Update package list
echo "1. Paketlar ro'yxatini yangilash..."
sudo apt-get update

# Install espeak-ng (O'zbek tilini qo'llab-quvvatlaydi)
echo "2. eSpeak-NG o'rnatish (O'zbek tili uchun)..."
sudo apt-get install -y espeak-ng espeak-ng-data

# Install regular espeak as fallback
echo "3. eSpeak o'rnatish (zaxira)..."
sudo apt-get install -y espeak

# Install flite (lightweight TTS)
echo "4. Flite o'rnatish..."
sudo apt-get install -y flite

# Install festival (another TTS option)
echo "5. Festival o'rnatish..."
sudo apt-get install -y festival festvox-kallpc16k

# Install mbrola voices for better quality
echo "6. MBROLA ovozlarini o'rnatish..."
sudo apt-get install -y mbrola mbrola-us1 mbrola-us2 mbrola-en1

# Install pico2wave (from Android)
echo "7. Pico TTS o'rnatish..."
sudo apt-get install -y libttspico-utils

# Install Python TTS tools
echo "8. Python TTS vositalarini o'rnatish..."
sudo apt-get install -y python3-pip
pip3 install gtts pyttsx3

# Install additional language data
echo "9. Qo'shimcha til ma'lumotlarini o'rnatish..."
sudo apt-get install -y espeak-data

# Test installations
echo ""
echo "==================================="
echo "O'rnatilgan dasturlarni tekshirish:"
echo "==================================="

# Check espeak-ng
if command -v espeak-ng &> /dev/null; then
    echo "✓ eSpeak-NG o'rnatildi - Version: $(espeak-ng --version | head -n1)"
    echo "  O'zbek tili mavjudmi?: "
    espeak-ng --voices | grep -i uz || echo "  O'zbek tili topilmadi"
else
    echo "✗ eSpeak-NG o'rnatilmadi"
fi

# Check espeak
if command -v espeak &> /dev/null; then
    echo "✓ eSpeak o'rnatildi - Version: $(espeak --version | head -n1)"
else
    echo "✗ eSpeak o'rnatilmadi"
fi

# Check flite
if command -v flite &> /dev/null; then
    echo "✓ Flite o'rnatildi"
    echo "  Mavjud ovozlar: $(flite -lv | grep -c 'available')"
else
    echo "✗ Flite o'rnatilmadi"
fi

# Check festival
if command -v festival &> /dev/null; then
    echo "✓ Festival o'rnatildi"
else
    echo "✗ Festival o'rnatilmadi"
fi

# Check pico2wave
if command -v pico2wave &> /dev/null; then
    echo "✓ Pico TTS o'rnatildi"
else
    echo "✗ Pico TTS o'rnatilmadi"
fi

# Check gtts
if pip3 show gtts &> /dev/null; then
    echo "✓ Google TTS (gtts) o'rnatildi"
else
    echo "✗ Google TTS o'rnatilmadi"
fi

echo ""
echo "==================================="
echo "Test audio yaratish:"
echo "==================================="

# Create test directory
mkdir -p /tmp/tts-test

# Test espeak-ng with Uzbek
echo "1. eSpeak-NG O'zbek tili testi..."
espeak-ng -v uz -s 140 -w /tmp/tts-test/espeak-ng-uz.wav "Salom, bu test xabari. Bir raqamini bosing" 2>/dev/null || \
espeak-ng -v ru -s 140 -w /tmp/tts-test/espeak-ng-ru.wav "Привет, это тестовое сообщение. Нажмите один" 2>/dev/null || \
echo "   eSpeak-NG test muvaffaqiyatsiz"

# Test regular espeak
echo "2. eSpeak testi..."
espeak -v ru+f3 -s 140 -w /tmp/tts-test/espeak.wav "Salom, bu test xabari" 2>/dev/null || \
echo "   eSpeak test muvaffaqiyatsiz"

# Test flite
echo "3. Flite testi..."
flite -t "Hello, this is a test message" -o /tmp/tts-test/flite.wav 2>/dev/null || \
echo "   Flite test muvaffaqiyatsiz"

# Test pico2wave
echo "4. Pico TTS testi..."
pico2wave -l ru-RU -w /tmp/tts-test/pico.wav "Привет, это тест" 2>/dev/null || \
echo "   Pico TTS test muvaffaqiyatsiz"

# List created test files
echo ""
echo "Yaratilgan test fayllar:"
ls -la /tmp/tts-test/*.wav 2>/dev/null || echo "Hech qanday test fayl yaratilmadi"

echo ""
echo "==================================="
echo "O'rnatish tugallandi!"
echo "==================================="
echo ""
echo "Tavsiyalar:"
echo "1. Agar O'zbek tili kerak bo'lsa, qo'shimcha til paketlarini o'rnating:"
echo "   sudo apt-get install espeak-ng-data-uz"
echo ""
echo "2. Server qayta ishga tushirilishi tavsiya etiladi:"
echo "   pm2 restart qashqadaryo-web"
echo ""