#!/bin/bash

echo "📞 Audio Recording Helper"
echo "========================"
echo ""
echo "Bu script qo'ng'iroq audio faylini saqlaydi."
echo ""

# Find the latest audio file in uploads
AUDIO_DIR="/home/user/Notification/qashqadaryo-iib/public/audio/uploads"
LATEST_AUDIO=$(ls -t $AUDIO_DIR/*.webm 2>/dev/null | head -1)

if [ -z "$LATEST_AUDIO" ]; then
    echo "❌ Audio fayl topilmadi!"
    echo ""
    echo "Avval qo'ng'iroq qiling va audio yuboring, keyin bu scriptni ishga tushiring."
    exit 1
fi

echo "✅ Oxirgi audio fayl: $(basename $LATEST_AUDIO)"
echo ""

# Copy to a known location
SAVED_AUDIO="$AUDIO_DIR/saved-recording.webm"
cp "$LATEST_AUDIO" "$SAVED_AUDIO"

echo "💾 Audio saqlandi: saved-recording.webm"
echo ""
echo "Endi bu audio bilan test qilish uchun:"
echo ""
echo "curl -k -X POST https://localhost:8443/api/broadcast/create \\"
echo "  -F \"employeeIds=[\\\"1751797284769\\\"]\" \\"
echo "  -F \"sipAccounts=[\\\"1\\\"]\" \\"
echo "  -F \"audio=@$SAVED_AUDIO;type=audio/webm\""
echo ""