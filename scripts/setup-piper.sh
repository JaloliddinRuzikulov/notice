#!/bin/bash

echo "======================================"
echo "Piper TTS - Professional o'rnatish"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}Bu skriptni root sifatida ishlatmang!${NC}"
   exit 1
fi

# Create directories
echo -e "${YELLOW}1. Kerakli papkalarni yaratish...${NC}"
mkdir -p ~/piper
cd ~/piper

# Download Piper
echo -e "${YELLOW}2. Piper TTS yuklab olish...${NC}"
PIPER_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
echo "Yuklanmoqda: $PIPER_URL"
wget -q --show-progress "$PIPER_URL" -O piper.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Piper muvaffaqiyatli yuklandi${NC}"
else
    echo -e "${RED}✗ Piper yuklashda xatolik${NC}"
    exit 1
fi

# Extract Piper
echo -e "${YELLOW}3. Piper arxivdan chiqarish...${NC}"
tar -xzf piper.tar.gz
rm piper.tar.gz

# Move to system path (requires sudo)
echo -e "${YELLOW}4. Piper ni tizimga o'rnatish...${NC}"
echo "Sudo parol so'raladi:"
sudo mv piper /usr/local/bin/
sudo chmod +x /usr/local/bin/piper

# Create voices directory
echo -e "${YELLOW}5. Ovozlar papkasini yaratish...${NC}"
sudo mkdir -p /usr/share/piper-voices/{ru,en,kk}

# Download Russian voices (best quality)
echo -e "${YELLOW}6. Rus tilida ovozlarni yuklab olish...${NC}"

# Irina - Female voice (very natural)
echo "Ayol ovozi (Irina) yuklanmoqda..."
cd /tmp
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx" 
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx.json"
sudo mv ru_RU-irina-medium.* /usr/share/piper-voices/ru/

# Ruslan - Male voice  
echo "Erkak ovozi (Ruslan) yuklanmoqda..."
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx"
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json"
sudo mv ru_RU-ruslan-medium.* /usr/share/piper-voices/ru/

# Download Kazakh voice (closest to Uzbek)
echo -e "${YELLOW}7. Qozoq tilida ovoz yuklab olish (O'zbek tiliga yaqin)...${NC}"
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx"
wget -q --show-progress "https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx.json"
sudo mv kk_KZ-iseke-x_low.* /usr/share/piper-voices/kk/

# Test installation
echo -e "${YELLOW}8. O'rnatishni tekshirish...${NC}"
echo "Salom, bu Piper TTS testi" | piper --model /usr/share/piper-voices/ru/ru_RU-irina-medium.onnx --output_file /tmp/test.wav

if [ -f /tmp/test.wav ]; then
    echo -e "${GREEN}✓ Piper TTS muvaffaqiyatli o'rnatildi!${NC}"
    echo ""
    echo "Mavjud ovozlar:"
    echo "- Rus (Ayol): /usr/share/piper-voices/ru/ru_RU-irina-medium.onnx"
    echo "- Rus (Erkak): /usr/share/piper-voices/ru/ru_RU-ruslan-medium.onnx"
    echo "- Qozoq: /usr/share/piper-voices/kk/kk_KZ-iseke-x_low.onnx"
else
    echo -e "${RED}✗ Piper TTS test muvaffaqiyatsiz${NC}"
fi

# Clean up
rm -f /tmp/test.wav
cd ~

echo ""
echo -e "${GREEN}O'rnatish tugallandi!${NC}"
echo ""
echo "Test qilish uchun:"
echo "echo 'Assalomu alaykum' | piper --model /usr/share/piper-voices/ru/ru_RU-irina-medium.onnx --output_file test.wav"
echo "play test.wav"