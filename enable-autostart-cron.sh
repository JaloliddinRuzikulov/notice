#!/bin/bash

# Crontab orqali avtomatik ishga tushishni sozlash

echo "🔧 Crontab orqali avtomatik ishga tushish sozlanmoqda..."

# Check if Docker is installed
if command -v docker-compose &> /dev/null; then
    # Docker compose uchun
    STARTUP_CMD="cd /mnt/hdd128gb/qashqadaryo-iib-notification && /usr/bin/docker-compose up -d"
    echo "📦 Docker-compose topildi"
elif command -v pm2 &> /dev/null; then
    # PM2 uchun
    STARTUP_CMD="cd /mnt/hdd128gb/qashqadaryo-iib-notification && pm2 start ecosystem.config.js"
    echo "📦 PM2 topildi"
else
    # Oddiy Node.js
    STARTUP_CMD="cd /mnt/hdd128gb/qashqadaryo-iib-notification && /usr/bin/node server.js > logs/server.log 2>&1 &"
    echo "📦 Node.js bilan ishga tushiriladi"
fi

# Crontab ga qo'shish
(crontab -l 2>/dev/null | grep -v "qashqadaryo-iib-notification"; echo "@reboot $STARTUP_CMD") | crontab -

# Tekshirish
if crontab -l | grep -q "qashqadaryo-iib-notification"; then
    echo "✅ Avtomatik ishga tushish muvaffaqiyatli sozlandi!"
    echo ""
    echo "📋 Sozlangan buyruq:"
    crontab -l | grep "qashqadaryo-iib-notification"
    echo ""
    echo "🔄 Server o'chib yonganda dastur avtomatik ishga tushadi!"
    echo ""
    echo "ℹ️  Qo'shimcha:"
    echo "   - Hozir ishga tushirish: $STARTUP_CMD"
    echo "   - Crontab ko'rish: crontab -l"
    echo "   - Crontab tahrirlash: crontab -e"
else
    echo "❌ Xatolik yuz berdi!"
fi