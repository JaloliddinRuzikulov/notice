# FreePBX WebRTC Konfiguratsiyasi - 2024 Yechimi

## 1. FreePBX serverda bajarish kerak:

### A. Asterisk HTTP/WebSocket konfiguratsiyasi:
```bash
# Asterisk CLI ga ulanish
asterisk -rv

# WebSocket modullarini tekshirish
module show like websocket
module show like http

# Agar yuklanmagan bo'lsa:
module load res_http_websocket
module load res_crypto
module reload
```

### B. HTTP server konfiguratsiyasi (/etc/asterisk/http.conf):
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/asterisk/keys/asterisk.pem
tlsprivatekey=/etc/asterisk/keys/asterisk.pem
```

### C. PJSIP transport konfiguratsiyasi (/etc/asterisk/pjsip.conf):
```ini
[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0:8088

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
```

### D. Extension 4529 ni WebRTC uchun sozlash:
```ini
[4529]
type=endpoint
transport=transport-wss
webrtc=yes
context=from-internal
disallow=all
allow=ulaw,alaw,opus
auth=4529
aors=4529
dtls_enable=yes
dtls_verify=no
dtls_cert_file=/etc/asterisk/keys/asterisk.pem
dtls_private_key=/etc/asterisk/keys/asterisk.pem
dtls_setup=actpass
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes
use_avpf=yes
```

## 2. FreePBX Web panelida:

### A. SIP Settings:
- Settings → Asterisk SIP Settings → General SIP Settings
- Chan PJSIP Settings → WebRTC: Yes
- Transport: WSS
- STUN Server: stun.l.google.com:19302

### B. Extension 4529 Settings:
- Applications → Extensions → 4529
- Advanced → Transport: WSS
- Advanced → WebRTC: Yes
- NAT → Force rport: Yes
- NAT → Comedia: Yes

## 3. Test qilish:
```bash
# HTTP status
curl http://10.102.0.3:8088/httpstatus

# WebSocket test
wscat -c wss://10.102.0.3:8089/ws

# Asterisk CLI da:
http show status
pjsip show transports
```

## 4. Firewall:
```bash
# Kerakli portlar
ufw allow 8088/tcp
ufw allow 8089/tcp
ufw allow 10000:20000/udp
```

Agar bular ishlamasa, muqobil yechim - dedicated WebRTC proxy server o'rnatish.