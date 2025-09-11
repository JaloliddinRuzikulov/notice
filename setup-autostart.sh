#!/bin/bash

# Qashqadaryo IIB Notification - Auto-start setup script

echo "=========================================="
echo "Avtomatik ishga tushishni sozlash"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ushbu script'ni root (sudo) bilan ishga tushiring!"
    echo "Masalan: sudo bash setup-autostart.sh"
    exit 1
fi

echo "📋 Tanlang qaysi usul bilan sozlash kerak:"
echo "1) Systemd service (Tavsiya etiladi)"
echo "2) PM2 process manager"
echo "3) Crontab"
echo "4) Docker auto-restart (faqat docker-compose uchun)"

read -p "Tanlovingiz (1-4): " choice

case $choice in
    1)
        echo "🔧 Systemd service o'rnatilmoqda..."
        
        # Copy service file
        cp /mnt/hdd128gb/qashqadaryo-iib-notification/qashqadaryo-iib.service /etc/systemd/system/
        
        # Reload systemd
        systemctl daemon-reload
        
        # Enable service
        systemctl enable qashqadaryo-iib.service
        
        # Start service
        systemctl start qashqadaryo-iib.service
        
        # Check status
        if systemctl is-active --quiet qashqadaryo-iib.service; then
            echo "✅ Systemd service muvaffaqiyatli o'rnatildi!"
            echo "📊 Status: systemctl status qashqadaryo-iib.service"
            echo "🔄 Server o'chib yonsa avtomatik ishga tushadi!"
        else
            echo "❌ Service ishga tushmadi. Loglarni tekshiring:"
            echo "journalctl -u qashqadaryo-iib.service -n 50"
        fi
        ;;
        
    2)
        echo "🔧 PM2 o'rnatilmoqda..."
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "📦 PM2 o'rnatilmoqda..."
            npm install -g pm2
        fi
        
        # Start with PM2
        cd /mnt/hdd128gb/qashqadaryo-iib-notification
        pm2 start ecosystem.config.js
        
        # Save PM2 process list
        pm2 save
        
        # Setup startup script
        pm2 startup systemd -u $(logname) --hp /home/$(logname)
        
        echo "✅ PM2 muvaffaqiyatli sozlandi!"
        echo "📊 Status: pm2 status"
        echo "🔄 Server o'chib yonsa avtomatik ishga tushadi!"
        ;;
        
    3)
        echo "🔧 Crontab ga qo'shilmoqda..."
        
        # Add to root's crontab
        (crontab -l 2>/dev/null; echo "@reboot cd /mnt/hdd128gb/qashqadaryo-iib-notification && /usr/bin/docker-compose up -d") | crontab -
        
        echo "✅ Crontab ga qo'shildi!"
        echo "📊 Tekshirish: crontab -l"
        echo "🔄 Server o'chib yonsa avtomatik ishga tushadi!"
        ;;
        
    4)
        echo "🔧 Docker auto-restart allaqachon sozlangan!"
        echo "docker-compose.yml da 'restart: always' mavjud"
        echo ""
        echo "Docker service ni tekshirish:"
        systemctl is-enabled docker
        
        if [ $? -eq 0 ]; then
            echo "✅ Docker service avtomatik ishga tushadi"
            echo "🔄 Container to'xtasa qayta ishga tushadi"
        else
            echo "⚠️  Docker service avtomatik emas. Yoqish uchun:"
            echo "systemctl enable docker"
        fi
        ;;
        
    *)
        echo "❌ Noto'g'ri tanlov!"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Qo'shimcha ma'lumot:"
echo "- Dastur manzili: https://172.27.64.10:8444"
echo "- Backup fayl: /mnt/hdd128gb/backup/"
echo "=========================================="