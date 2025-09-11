#!/bin/bash
echo "Qashqadaryo IIB Xabarnoma Tizimi ishga tushirilmoqda..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 o'rnatilmoqda..."
    npm install -g pm2
fi

# Stop any existing instances
pm2 stop qashqadaryo-web 2>/dev/null || true
pm2 delete qashqadaryo-web 2>/dev/null || true

# Start the server
pm2 start server.js --name "qashqadaryo-web" --watch false

# Save PM2 process list
pm2 save

echo ""
echo "========================================="
echo "Server muvaffaqiyatli ishga tushdi!"
echo "========================================="
echo ""
echo "Web interfeys: https://172.27.64.10:8444"
echo "Login: admin"
echo "Parol: admin123"
echo ""
echo "Server statusini ko'rish: pm2 status"
echo "Loglarni ko'rish: pm2 logs qashqadaryo-web"
echo "Serverni to'xtatish: pm2 stop qashqadaryo-web"
echo "========================================="