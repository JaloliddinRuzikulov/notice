#!/bin/bash

# Qashqadaryo IIB Xabarnoma - Log tozalash skripti

echo "Log fayllarni tozalash boshlanmoqda..."

# Log papkasiga o'tish
cd "$(dirname "$0")/.." || exit 1

# Barcha log fayllarni topish va tozalash
find logs -name "*.log" -type f -exec sh -c 'echo "" > {}' \; 2>/dev/null

# server.log ni tozalash
[ -f server.log ] && echo "" > server.log

# O'chirilgan fayllar sonini hisoblash
cleaned_count=$(find logs -name "*.log" -type f | wc -l)
[ -f server.log ] && cleaned_count=$((cleaned_count + 1))

echo "✓ $cleaned_count ta log fayl tozalandi"
echo "✓ Log tozalash tugallandi"