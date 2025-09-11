#!/bin/bash

# 128 GB diskni mount qilish va ma'lumotlarni ko'chirish scripti
# Bu scriptni root foydalanuvchi sifatida ishga tushiring

echo "=== Qashqadaryo IIB ma'lumotlarini yangi diskka ko'chirish ==="

# 1. Mount point yaratish
echo "1. Mount point yaratish..."
mkdir -p /mnt/data

# 2. Diskni mount qilish
echo "2. 128 GB diskni mount qilish..."
mount /dev/sdb1 /mnt/data

# 3. Dastur uchun katalog yaratish
echo "3. Dastur katalogini yaratish..."
mkdir -p /mnt/data/qashqadaryo-iib

# 4. Ma'lumotlarni ko'chirish
echo "4. Ma'lumotlarni ko'chirish..."
cp -rp /home/user/Notification/qashqadaryo-iib/data /mnt/data/qashqadaryo-iib/
cp -rp /home/user/Notification/qashqadaryo-iib/logs /mnt/data/qashqadaryo-iib/
cp -rp /home/user/Notification/qashqadaryo-iib/public/audio/uploads /mnt/data/qashqadaryo-iib/

# 5. Symbolic linklar yaratish
echo "5. Symbolic linklar yaratish..."
cd /home/user/Notification/qashqadaryo-iib

# Eski kataloglarni backup qilish
mv data data.backup
mv logs logs.backup
mv public/audio/uploads public/audio/uploads.backup

# Yangi diskkaga symbolic link
ln -s /mnt/data/qashqadaryo-iib/data data
ln -s /mnt/data/qashqadaryo-iib/logs logs
ln -s /mnt/data/qashqadaryo-iib/uploads public/audio/uploads

# 6. Ruxsatlarni sozlash
echo "6. Ruxsatlarni sozlash..."
chown -R user:user /mnt/data/qashqadaryo-iib
chmod -R 755 /mnt/data/qashqadaryo-iib

# 7. Avtomatik mount uchun fstab ga qo'shish
echo "7. /etc/fstab ga qo'shish..."
echo "# Qashqadaryo IIB data disk" >> /etc/fstab
echo "/dev/sdb1 /mnt/data ext4 defaults 0 2" >> /etc/fstab

echo "=== Tayyor! ==="
echo "Ma'lumotlar yangi 128 GB diskka ko'chirildi."
echo "Eski ma'lumotlar *.backup kataloglarda saqlanmoqda."
echo "PM2 ni qayta ishga tushiring: pm2 restart qashqadaryo-web"