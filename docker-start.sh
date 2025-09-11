#!/bin/bash

# Qashqadaryo IIB Notification System - Docker Startup Script

set -e

echo "=========================================="
echo "Qashqadaryo IIB Xabarnoma Tizimi"
echo "Docker orqali ishga tushirish"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker o'rnatilmagan! Iltimos Docker o'rnating."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose o'rnatilmagan! Iltimos Docker Compose o'rnating."
    exit 1
fi

# Change to project directory
# cd /mnt/hdd128gb/qashqadaryo-iib-notification

# Create necessary directories if they don't exist
echo "📁 Kerakli papkalarni yaratish..."
mkdir -p data logs public/audio/uploads public/audio/presets config temp

# Set proper permissions
chmod -R 755 data logs public/audio temp

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env fayli topilmadi. Default sozlamalar ishlatiladi."
fi

# Build Docker image
echo "🔨 Docker image yaratish..."
docker-compose build --no-cache

# Stop any existing containers
echo "🛑 Mavjud konteynerlarni to'xtatish..."
docker-compose down

# Start services
echo "🚀 Xizmatlarni ishga tushirish..."
docker-compose up -d

# Wait for service to be ready
echo "⏳ Xizmat tayyor bo'lishini kutish..."
sleep 10

# Check if service is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Xizmat muvaffaqiyatli ishga tushdi!"
    echo ""
    echo "🌐 Tizimga kirish: https://172.27.64.10:8444"
    echo "👤 Login: admin"
    echo "🔑 Parol: admin123"
    echo ""
    echo "📊 Konteyner holati:"
    docker-compose ps
    echo ""
    echo "📝 Loglarni ko'rish: docker-compose logs -f"
else
    echo "❌ Xizmat ishga tushmadi!"
    echo "Loglarni tekshiring: docker-compose logs"
    exit 1
fi

echo "=========================================="
