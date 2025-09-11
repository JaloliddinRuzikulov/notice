#!/bin/bash

echo "Loyihani 10.105.1.82 serverga ko'chirish..."

# SSH ma'lumotlari
REMOTE_USER="user"
REMOTE_HOST="10.105.1.82"
REMOTE_DIR="~/xabarnoma-tizimi"

# Arxivlash
echo "Loyihani arxivlash..."
tar -czf ../xabarnoma-project.tar.gz \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='temp/*' \
    --exclude='uploads/*' \
    --exclude='server.log' \
    --exclude='nohup.out' \
    .

echo "Arxiv hajmi: $(ls -lh ../xabarnoma-project.tar.gz | awk '{print $5}')"

echo ""
echo "Quyidagi buyruqlarni ketma-ket bajaring:"
echo ""
echo "1. Arxivni ko'chirish:"
echo "   scp ../xabarnoma-project.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:~/"
echo "   (Parol: j1a2h3o4n)"
echo ""
echo "2. SSH orqali serverga kirish:"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST}"
echo "   (Parol: j1a2h3o4n)"
echo ""
echo "3. Serverda quyidagi buyruqlarni bajaring:"
echo "   mkdir -p ${REMOTE_DIR}"
echo "   cd ${REMOTE_DIR}"
echo "   tar -xzf ~/xabarnoma-project.tar.gz"
echo "   npm install"
echo "   node server.js"
echo ""
echo "Eslatma: Server 8444 portda ishlaydi"