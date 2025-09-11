# Broadcast Tizimidagi Muammolar va Yechimlar

## 1. ASOSIY MUAMMO: Ko'p kishiga yuborishda ovoz yo'qolishi

### Sabab: 
- Barcha qo'ng'iroqlar uchun bitta RTP port (10002) ishlatilmoqda
- Bir vaqtda bir nechta qo'ng'iroq bo'lganda port konflikt bo'ladi

### Topilgan joylar:
- `/home/user/lib/sip-backend.js` - line 428: `const rtpPort = 10002;`
- `/home/user/lib/rtp-sender.js` - line 48: `const actualLocalPort = localPort || 10002;`
- DTMF detection ham 10002 portni ishlatadi

### Yechim:
- Dinamik port ajratish tizimi kerak (10000-20000 oralig'ida)
- Har bir qo'ng'iroq uchun alohida port

## 2. MUAMMO: SDP generation statik port ishlatadi

### Sabab:
- generateSDP() funksiyasi har doim 10002 portni e'lon qiladi
- Asterisk server barcha audio streamlarni 10002 portga yuboradi

### Yechim:
- generateSDP() funksiyasiga dinamik port parametri qo'shish kerak
- Har bir qo'ng'iroq uchun alohida SDP generatsiya qilish

## 3. MUAMMO: Port tozalash mexanizmi yo'q

### Sabab:
- Qo'ng'iroq tugaganda RTP portlar ozod qilinmayapti
- UDP socketlar yopilmayapti

### Yechim:
- Call-ended eventida portlarni tozalash
- Socket cleanup qo'shish

## 4. MUAMMO: Batch system port konfliktlarini hisobga olmayapti

### Sabab:
- 5 ta qo'ng'iroq bir vaqtda boshlanadi
- Hammasi 10002 portni olishga harakat qiladi

### Yechim:
- Har bir batch call uchun alohida port ajratish
- Port pool management

## 5. POTENTSIAL MUAMMOLAR:

### 5.1 Memory leak:
- RTP streamlar to'g'ri yopilmasa memory leak bo'lishi mumkin
- Event listenerlar tozalanmasa

### 5.2 Firewall/NAT issues:
- RTP portlar (10000-20000) firewall da ochiq bo'lishi kerak
- NAT traversal muammolari bo'lishi mumkin

### 5.3 Codec mismatch:
- Asterisk va backend turli codec kutishi mumkin
- SDP negotiation muvaffaqiyatsiz bo'lishi mumkin

### 5.4 DTMF detection port conflict:
- DTMF ham 10002 portni ishlatadi
- Bir vaqtda DTMF va audio konflikt bo'lishi mumkin

## MONITORING KOMANDALARI:

```bash
# Active ports
netstat -anup | grep node

# Memory usage
ps aux | grep node

# Open file descriptors
lsof -p $(pgrep node) | wc -l

# UDP sockets
ss -u -a | grep node

# RTP traffic
tcpdump -i any udp portrange 10000-20000
```

## TO'G'IRLASH TARTIBI:

1. RTP port allocation tizimini qo'shish
2. generateSDP() ni dinamik qilish  
3. makeCall() funksiyasida port ajratish
4. Call cleanup da port ozod qilish
5. DTMF uchun alohida port
6. Test qilish: 1 kishi -> 5 kishi -> 20 kishi

## LOG PATTERNS TO MONITOR:

- "EADDRINUSE" - port already in use
- "DTMF socket error" - DTMF port conflict  
- "RTP stream error" - audio stream muammosi
- "Failed to create RTP" - RTP yaratish xatosi
- "SDP parse error" - SDP muammolari

## OXIRGI XATOLAR:

Xatolar topilmadi

## TEST QILISH UCHUN:

1. Monitoring script:
   ```bash
   ./monitor-batch.sh
   ```

2. Test broadcast (10 ta raqam):
   ```bash
   node test-batch-system.js
   ```

3. Tekshirish kerak:
   - "Starting new batch of 5 calls..." xabari
   - Faqat 5 ta concurrent call
   - "Batch complete! Processed 5 calls." xabari
   - "Waiting 2 seconds..." xabari
   - Keyingi batch boshlanishi


## HOZIRGI HOLAT MONITORING:

### Active Node Processes:
user     3254908  0.0  0.0   2892  1008 ?        S    13:55   0:00 sh -c node server.js
user     3254909 15.3  0.7 11849520 129320 ?     Sl   13:55   7:40 node server.js
user     3255383  0.0  0.1 744684 31200 pts/1    Rl+  14:45   0:00 node /usr/bin/npm view @anthropic-ai/claude-code@latest version

### Port Usage:
udp   UNCONN 0      0                                0.0.0.0:10002      0.0.0.0:*          
tcp   LISTEN 0      511                              0.0.0.0:8444       0.0.0.0:*          

### SIP Registration Status:
Allow: OPTIONS, INVITE, ACK, BYE, CANCEL, UPDATE, PRACK, REGISTER, SUBSCRIBE, NOTIFY, PUBLISH, MESSAGE, REFER
Allow: OPTIONS, INVITE, ACK, BYE, CANCEL, UPDATE, PRACK, REGISTER, SUBSCRIBE, NOTIFY, PUBLISH, MESSAGE, REFER
Allow: OPTIONS, INVITE, ACK, BYE, CANCEL, UPDATE, PRACK, REGISTER, SUBSCRIBE, NOTIFY, PUBLISH, MESSAGE, REFER


## YANGI TOPILMALAR (Real-time monitoring):

### RTP Port Binding muammosi:
- 172.26.129.171 interfacega bind qilyapti (lib/rtp-sender.js:51)
- Barcha calls uchun 10002 port ishlatilmoqda
- 'Early media SDP saqlandi, lekin audio BOSHLANMAYDI\!' xatosi

### Retry loop muammosi:
- 27 ta call retry queue da turibdi
- 2 ta active call doim saqlanib qolmoqda
- Audio yo'qligi sababli retry loop hosil bo'lmoqda

### TO'G'IRLASH KERAK BO'LGAN FAYLLAR:
1. /home/user/lib/sip-backend.js - generateSDP() va makeCall()
2. /home/user/lib/rtp-sender.js - port binding logic
3. /home/user/lib/simple-rtp-stream.js - RTP stream yaratish
4. /home/user/routes/broadcast-simple.js - concurrent call handling


## TO'G'IRLANDI:

### 1. Global RTP port tracking qo'shildi
- Barcha SIP backend instanslar bitta global port tracking ishlatadi
- Har bir backend o'z port diapazoniga ega (10000-11998, 12000-13998, ...)

### 2. Ovoz muammosi sababi:
- Har bir SIP backend alohida port tracking ishlatgani uchun konflikt bo'lgan
- Endi global tracking va alohida diapazonlar ishlatiladi

### 3. Log qo'shildi:
- Qaysi port ajratilganini ko'rsatadi
- Qaysi instans qaysi diapazondan foydalanayotganini ko'rsatadi


## YANGI TOPILGAN MUAMMOLAR:

### 1. CODEC MISMATCH:
- RTP Sender: pcm_mulaw ishlatgan edi
- Broadcast system: pcm_alaw kutayapti
- SDP: 0=PCMU (mulaw), 8=PCMA (alaw) ikkalasini e'lon qiladi

### 2. TO'G'IRLANDI:
- rtp-sender.js endi pcm_alaw ishlatadi
- FFmpeg format ham alaw ga o'zgartirildi

### 3. QOLGAN MUAMMO:
- SDP da birinchi codec PCMU (0)
- Asterisk birinchisini tanlashi mumkin
- Keyin backend alaw yuboradi = ovoz yo'q


## MUAMMO: 5 talik navbat o'rniga 60-80 ta qo'ng'iroq/daqiqa

### SABAB:
1. BATCH_SIZE=5 belgilangan, lekin MAX_CONCURRENT_CALLS ishlatilmoqda (15-45 ta)
2. Har bir qo'ng'iroq tugaganda yangi batch boshlanishi mumkin (race condition)
3. Haqiqiy batch nazorati yo'q - uzluksiz qo'ng'iroqlar

### KUTILGAN:
- 5 ta qo'ng'iroq parallel
- Hammasi tugaguncha kutish (10-15 soniya)  
- 2 soniya tanaffus
- Keyingi 5 ta
- NATIJA: ~20-25 qo'ng'iroq/daqiqa

### HOZIRGI:
- 15-45 ta parallel qo'ng'iroq
- Kanal bo'shashi bilanoq yangi qo'ng'iroq
- NATIJA: 60-80 qo'ng'iroq/daqiqa

### TO'G'IRLANDI (16:57):
- isBatchInProgress flag qo'shildi - race condition oldini oladi
- totalActiveCallsCount < BATCH_SIZE chegarasi qo'yildi
- effectiveLimit = BATCH_SIZE (batch rejimida)
- Har bir batch tugaguncha yangi batch boshlanmaydi

## OVOZ MUAMMOSI TO'G'IRLANDI:

### RTP Payload Type xatosi:
- MUAMMO: RTP sender PT=0 (PCMU) ishlatgan edi
- YECHIM: PT=8 (PCMA) ga o'zgartirildi
- NATIJA: RTP header endi to'g'ri A-law codec ko'rsatadi

### To'liq ovoz zanjiri:
1. SDP: A-law birinchi o'rinda (codec 8)
2. FFmpeg: pcm_alaw format ishlatiladi
3. RTP: PT=8 (PCMA) header ishlatiladi
4. Port: Har bir qo'ng'iroq alohida port oladi

## RETRY TIZIMI TO'G'IRLANDI:

### MUAMMO:
- Retry 1 minut kutib boshlanardi
- Asosiy ro'yxat tugamay retry boshlanardi

### YECHIM:
- 1 minutlik kutish olib tashlandi
- Retry faqat asosiy ro'yxat to'liq tugagandan keyin boshlanadi
- "Starting retries immediately after main queue completion..."
