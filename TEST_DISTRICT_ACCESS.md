# District Access Test Guide

## Test Senariylari

### 1. Test User yaratish

1. https://172.27.64.10:8444/users sahifasiga kiring
2. "Yangi foydalanuvchi" tugmasini bosing
3. Quyidagi ma'lumotlarni kiriting:
   - Foydalanuvchi nomi: `test_kitob`
   - Parol: `test123`
   - To'liq ismi: `Test Kitob Tumani`
   - Roli: `Foydalanuvchi`
   - Ruxsat etilgan tumanlar: Faqat "Kitob tumani" ni tanlang
   - Modullar ruxsati: Xodimlar, Xabarnoma, Hisobotlar

### 2. Xodimlar sahifasini test qilish

1. Test user bilan login qiling
2. Xodimlar sahifasiga o'ting
3. Tekshiring:
   - Faqat Kitob tumanidagi xodimlar ko'rinishi kerak
   - Tumani belgilanmagan xodimlar ham ko'rinishi kerak
   - Boshqa tuman xodimlari ko'rinmasligi kerak

### 3. Xabarnoma sahifasini test qilish

1. Xabarnoma sahifasiga o'ting
2. Xodimlar ro'yxatida faqat Kitob tumani xodimlari ko'rinishi kerak
3. Guruhlar ro'yxatida faqat Kitob tumani xodimlarini o'z ichiga olgan guruhlar ko'rinishi kerak

### 4. Admin user bilan test

1. Admin user bilan login qiling
2. Barcha sahifalarda barcha tumanlar ma'lumotlari ko'rinishi kerak
3. /users sahifasida test userga boshqa tumanlar qo'shish mumkinligini tekshiring

## Test Xodimlari yaratish

Admin sifatida quyidagi test xodimlarini yarating:

1. **Kitob tumani xodimi**
   - Ism: Test Kitob Xodimi
   - Tuman: Kitob tumani
   - Telefon: 901234567

2. **Qarshi shahri xodimi**
   - Ism: Test Qarshi Xodimi
   - Tuman: Qarshi shahri
   - Telefon: 901234568

3. **Tumansiz xodim**
   - Ism: Test Tumansiz Xodimi
   - Tuman: (bo'sh qoldiring)
   - Telefon: 901234569

## Kutilgan natijalar

### test_kitob user uchun:

**Ko'rinishi kerak:**
- Test Kitob Xodimi
- Test Tumansiz Xodimi

**Ko'rinmasligi kerak:**
- Test Qarshi Xodimi

### Admin user uchun:
- Barcha xodimlar ko'rinishi kerak

## API Test

```bash
# Test user token olish
curl -k -X POST https://172.27.64.10:8444/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_kitob&password=test123" \
  --cookie-jar cookies.txt

# Xodimlarni olish (faqat Kitob tumani ko'rinishi kerak)
curl -k https://172.27.64.10:8444/api/employees \
  --cookie cookies.txt
```