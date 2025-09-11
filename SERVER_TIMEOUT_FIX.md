# 🔧 25 SEKUND TIMEOUT MUAMMOSINI HAL QILISH

## Muammo sababi:
- Asterisk/FreePBX da session timer 25 sekundga sozlangan
- NAT traversal timeout
- RTP timeout

## YECHIMLAR:

### 1. Asterisk sip.conf sozlamalari:
```bash
# /etc/asterisk/sip.conf ga qo'shing:
[general]
session-timers=refuse
session-expires=1800
session-minse=90
session-refresher=uac
rtptimeout=300
rtpholdtimeout=300
```

### 2. FreePBX orqali:
1. **Settings** → **Asterisk SIP Settings**
2. **Other SIP Settings** bo'limida:
   - Session Timers: **Refuse**
   - RTP Timeout: **300**
   - RTP Hold Timeout: **300**

3. **Apply Config** bosing

### 3. Extension sozlamalari:
1. **Applications** → **Extensions**
2. Extension 4529 ni toping
3. **Advanced** tab:
   - Session Timers: **Refuse**
   - RTP Timeout: **300**

### 4. Trunk sozlamalari:
Agar trunk ishlatsangiz:
```
qualify=yes
qualifyfreq=30
keepalive=30
```

### 5. Firewall/NAT sozlamalari:
```bash
# UDP timeout ni oshirish
iptables -t nat -A PREROUTING -p udp --dport 5060 -j CT --timeout 300

# yoki
conntrack -E -p udp --dport 5060 --timeout 300
```

### 6. PJSIP uchun (agar ishlatilsa):
```ini
[global]
timer_t1=500
timer_b=32000

[endpoint-name]
timers=no
rtp_timeout=300
```

## TEST QILISH:

1. Asterisk CLI da:
```bash
asterisk -rvvv
sip show settings
# yoki
pjsip show settings
```

2. O'zgarishlarni qo'llash:
```bash
asterisk -rx "core reload"
# yoki
asterisk -rx "sip reload"
```

## ALTERNATIV YECHIMLAR:

### A. Re-INVITE yuborish:
Backend kodga qo'shish mumkin - har 20 sekundda re-INVITE

### B. OPTIONS ping:
Har 15 sekundda OPTIONS so'rov yuborish

### C. RTP comfort noise:
Doimiy RTP paketlar yuborish

## XULOSA:
Server admin bilan bog'lanib, yuqoridagi sozlamalardan birini qo'llash kerak. Eng oson yechim - FreePBX da Session Timers ni **Refuse** qilish.