#!/bin/bash

echo "==================================="
echo "Piper TTS O'rnatish (Yaxshi sifat)"
echo "==================================="
echo ""
echo "Piper - zamonaviy neural TTS engine, juda yaxshi sifatli ovoz chiqaradi."
echo ""

# Download Piper
echo "1. Piper TTS yuklab olish:"
echo "   wget https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
echo "   tar -xzf piper_linux_x86_64.tar.gz"
echo "   sudo mv piper /usr/local/bin/"
echo "   sudo chmod +x /usr/local/bin/piper"
echo ""

# Download Russian voices
echo "2. Rus tili uchun ovozlar:"
echo "   # Ayol ovozi (Irina)"
echo "   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx"
echo "   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx.json"
echo ""
echo "   # Erkak ovozi (Ruslan)"  
echo "   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx"
echo "   wget https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json"
echo ""

# Create voices directory
echo "3. Ovozlar papkasini yaratish:"
echo "   sudo mkdir -p /usr/share/piper-voices/ru"
echo "   sudo mv *.onnx* /usr/share/piper-voices/ru/"
echo ""

# Test command
echo "4. Test qilish:"
echo "   echo 'Salom, bu Piper TTS testi' | piper --model /usr/share/piper-voices/ru/ru_RU-irina-medium.onnx --output_file test.wav"
echo "   play test.wav"
echo ""

echo "==================================="
echo "Silero Models (Alternative)"
echo "==================================="
echo ""
echo "Silero - PyTorch asosidagi TTS, juda tabiiy ovoz:"
echo ""
echo "1. Python environment yaratish:"
echo "   python3 -m venv tts-env"
echo "   source tts-env/bin/activate"
echo "   pip install torch torchaudio omegaconf"
echo ""
echo "2. Silero modelini yuklab olish va ishlatish uchun Python script yarating."
echo ""

echo "==================================="
echo "Coqui TTS (Eng yaxshi sifat)"
echo "==================================="
echo ""
echo "1. Coqui TTS o'rnatish:"
echo "   pip install TTS"
echo ""
echo "2. Modellarni ko'rish:"
echo "   tts --list_models"
echo ""
echo "3. Rus tili uchun model yuklab olish:"
echo "   tts --model_name tts_models/ru/cv/vits --text 'Test' --out_path test.wav"
echo ""

echo "Tavsiya: Piper TTS eng yaxshi offline variant!"