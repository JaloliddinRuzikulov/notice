# DTMF Detection Methods - Qashqadaryo IIB System

## Muammo
990823112 raqamiga qo'ng'iroq qilganda 1 tugmasi bosilsa ham, sistema buni aniqlay olmayapti.

## Yechimlar

### 1. Asosiy DTMF Handler (`/lib/dtmf-handler.js`)
- SIP INFO metodini qo'llab-quvvatlaydi
- RFC 2833 RTP events ni aniqlaydi  
- Inband DTMF signallarni qayta ishlaydi
- Call state management

### 2. Alternativ DTMF Detector (`/lib/dtmf-alternative-detector.js`)
- Ko'p portlarni monitoring qiladi (5060-5080, 10000-10020)
- SIP INFO, NOTIFY xabarlarni aniqlaydi
- RFC 2833 paketlarni barcha RTP portlarda tekshiradi
- System log monitoring
- Timeout-based detection

### 3. Internal DTMF API (`/routes/internal-dtmf.js`)
- POST /api/internal/dtmf-confirm endpoint
- TCP server port 8445 da AGI uchun
- Asterisk dialplan orqali DTMF ni qabul qiladi

### 4. AGI Script (`/asterisk/xabarnoma-confirm.agi`)
- Asterisk dan DTMF ni Node.js ga yuboradi
- HTTP API yoki TCP socket orqali

## Test Vositalari

### 1. Real-time Monitor
```bash
./dtmf-monitor-realtime.js
```
Barcha DTMF faoliyatini real vaqtda ko'rsatadi.

### 2. Enhanced Test
```bash
./test-dtmf-enhanced.sh
```
To'liq test suite real-time monitoring bilan.

### 3. Quick Test
```bash
./test-dtmf-final-complete.sh
```
Oddiy test 990823112 uchun.

## Asterisk Konfiguratsiya

**MUHIM:** Asterisk serverda quyidagi o'zgarish kerak:

```
[5530]
dtmfmode=info
```

Keyin:
```bash
asterisk -rx "sip reload"
```

## Debug

Server loglarni kuzating:
```bash
tail -f server.log | grep -E "DTMF|INFO|Signal|broadcast-confirmed"
```

## Natijalar

Node.js tomonida barcha kerakli kod tayyor:
- ✅ DTMF handler yaratilgan
- ✅ Alternative detector qo'shilgan  
- ✅ Real-time monitoring mavjud
- ✅ Multiple detection methods
- ✅ Test tools tayyorlangan

Faqat Asterisk server konfiguratsiyasini yangilash kerak!