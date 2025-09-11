#!/bin/bash

echo "TTS Engine o'rnatish skripti"
echo "=========================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "Bu skriptni root sifatida ishlatmang!" 
   exit 1
fi

echo ""
echo "Quyidagi TTS enginelarni o'rnatish uchun komandalar:"
echo ""

# Festival TTS
echo "1. Festival TTS (yaxshi sifat):"
echo "   sudo apt-get update"
echo "   sudo apt-get install -y festival festival-freebsoft-utils"
echo "   sudo apt-get install -y festvox-ru"  # Russian voices
echo ""

# MBROLA voices
echo "2. MBROLA voices (professional sifat):"
echo "   sudo apt-get install -y mbrola mbrola-us1 mbrola-us2 mbrola-ru1"
echo ""

# Pico TTS (Google)
echo "3. Pico TTS (Google TTS offline):"
echo "   sudo apt-get install -y libttspico-utils"
echo ""

# Mimic TTS
echo "4. Mimic TTS (Mycroft AI):"
echo "   wget https://github.com/MycroftAI/mimic1/releases/download/1.3.0/mimic_1.3.0_amd64.deb"
echo "   sudo dpkg -i mimic_1.3.0_amd64.deb"
echo "   sudo apt-get install -f"
echo ""

# RHVoice (Russian/Ukrainian TTS)
echo "5. RHVoice (Rus/O'zbek uchun yaxshi):"
echo "   sudo add-apt-repository ppa:linvinus/rhvoice"
echo "   sudo apt-get update" 
echo "   sudo apt-get install -y rhvoice rhvoice-russian rhvoice-english"
echo ""

echo "O'rnatish uchun yuqoridagi komandalarni nusxalab terminal'ga kiriting."
echo ""
echo "Tavsiya: Festival va RHVoice eng yaxshi natija beradi!"