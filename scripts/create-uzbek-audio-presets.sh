#!/bin/bash

# O'zbek tilidagi standart xabarlar uchun audio fayllar yaratish
# Bu fayllarni professional studiyada yozib oling

PRESET_DIR="../public/audio/presets"
mkdir -p "$PRESET_DIR"

# Standart xabarlar ro'yxati
cat << EOF > uzbek-messages.txt
salom.wav|Assalomu alaykum
xabar.wav|Sizga muhim xabar bor
bir-raqamini-bosing.wav|Xabarni tasdiqlash uchun bir raqamini bosing
rahmat.wav|E'tiboringiz uchun rahmat
kutib-turing.wav|Iltimos, kutib turing
diqqat.wav|Diqqat, muhim e'lon
yigʻilish.wav|Bugun yig'ilish bo'ladi
tezkor.wav|Tezkor guruh chaqirilmoqda
hodisa.wav|Favqulodda hodisa yuz berdi
tadbir.wav|Muhim tadbir haqida xabar
EOF

echo "O'zbek tilidagi audio fayllar ro'yxati yaratildi: uzbek-messages.txt"
echo "Endi bu xabarlarni professional ovoz yozish studiyasida yozing"
echo "Yoki online TTS xizmatlaridan foydalaning:"
echo "- https://cloud.google.com/text-to-speech"
echo "- https://aws.amazon.com/polly/"
echo "- https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/"