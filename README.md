# Qashqadaryo IIB Xabarnoma Tizimi

SIP asosida ishlaydigan xabarnoma tizimi. 2000-3000 xodimga bir vaqtda audio xabar yuborish va DTMF orqali tasdiqlash imkoniyati.

## Asosiy imkoniyatlar

- 🎙️ **Audio xabar yuborish** - Mikrofondan yozish yoki fayl yuklash
- 📞 **SIP telefon** - Web-based SIP telefon (MicroSIP uslubida)
- ✅ **DTMF tasdiqlash** - Xodimlar 1 tugmasini bosib tasdiqlaydi
- 👥 **Xodimlar boshqaruvi** - Xodimlar ro'yxati va ma'lumotlari
- 📊 **Hisobotlar** - Statistika va tahlillar
- 🔒 **Xavfsizlik** - HTTPS va autentifikatsiya

## Texnologiyalar

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Vanilla JS
- **SIP**: SIP.js, Asterisk AMI
- **Database**: In-memory (production uchun MongoDB)
- **Security**: HTTPS, Session-based auth

## O'rnatish

```bash
# Dependencies o'rnatish
npm install

# Environment sozlash
cp .env.example .env
# .env faylini tahrirlang

# Serverni ishga tushirish
npm start
```

## Konfiguratsiya

`.env` faylida:
```
PORT=8444
SIP_SERVER=10.105.0.3
SIP_EXTENSION_1=5530
SIP_EXTENSION_2=5531
SIP_EXTENSION_3=5532
AMI_HOST=10.105.0.3
AMI_PORT=5038
AMI_USERNAME=admin
AMI_PASSWORD=mysecret
```

## API Endpoints

### Authentication
- `POST /login` - Tizimga kirish
- `GET /logout` - Tizimdan chiqish

### SIP
- `GET /api/sip/config` - SIP konfiguratsiyasi
- `POST /api/sip/test` - Ulanishni tekshirish

### Broadcast
- `POST /api/broadcast/create` - Yangi xabar yaratish
- `GET /api/broadcast/status/:id` - Xabar holati
- `POST /api/broadcast/confirm` - Tasdiqlash
- `GET /api/broadcast/recent` - Oxirgi xabarlar

### Employees
- `GET /api/employees` - Barcha xodimlar
- `POST /api/employees` - Yangi xodim
- `PUT /api/employees/:id` - Xodimni yangilash
- `DELETE /api/employees/:id` - Xodimni o'chirish

## Foydalanish

1. **Tizimga kirish**
   - URL: https://172.27.64.10:8444
   - Login: admin
   - Parol: admin123

2. **Xabar yuborish**
   - "Xabar yuborish" bo'limiga o'ting
   - Audio yozing yoki fayl yuklang
   - Qabul qiluvchilarni tanlang
   - Yuborish tugmasini bosing

3. **SIP telefon**
   - "SIP Telefon" bo'limiga o'ting
   - Raqam tering va qo'ng'iroq qiling
   - DTMF test uchun 1,2,3 tugmalarini bosing

## Xavfsizlik

- HTTPS majburiy (self-signed certificate)
- Session-based autentifikatsiya
- Environment o'zgaruvchilarda parollar

## Muammolarni hal qilish

**SIP ulanmayapti:**
- FreePBX WebRTC sozlamalarini tekshiring
- Firewall portlarini tekshiring (8444, 8089)
- SIP credentials to'g'riligini tekshiring

**Audio ishlamayapti:**
- Browser mikrofoniga ruxsat bering
- HTTPS orqali kirayotganingizni tekshiring
- Audio fayllar /public/audio/uploads papkasida

## Rivojlantirish

```bash
# Development mode
npm run dev

# Linting
npm run lint

# Tests
npm test
```

## Litsenziya

Qashqadaryo IIB uchun maxsus ishlab chiqilgan.# notice
