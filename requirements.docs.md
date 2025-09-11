# Qashqadaryo IIB Notification System - Requirements Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Software Requirements](#software-requirements)
4. [Network Requirements](#network-requirements)
5. [External Service Dependencies](#external-service-dependencies)
6. [Security Requirements](#security-requirements)
7. [Performance Requirements](#performance-requirements)
8. [Development Environment](#development-environment)
9. [Production Environment](#production-environment)
10. [Configuration Requirements](#configuration-requirements)

## System Overview

The Qashqadaryo IIB Notification System is a comprehensive voice broadcasting and employee management platform designed for law enforcement communications. It integrates with Asterisk PBX for voice calls, supports DTMF detection, and provides multi-district employee management capabilities.

## Hardware Requirements

### Minimum Requirements
- **CPU**: 2 cores (x86_64 architecture)
- **RAM**: 2 GB minimum, 4 GB recommended
- **Storage**: 10 GB available disk space
- **Network**: Gigabit Ethernet adapter

### Recommended Requirements
- **CPU**: 4 cores or higher
- **RAM**: 8 GB or higher
- **Storage**: 50 GB SSD storage
- **Network**: Dual Gigabit Ethernet adapters (for redundancy)

### Production Scaling
- For handling 60-80 calls per minute: 4-8 CPU cores
- Additional 2 GB RAM per 100 concurrent calls
- SSD storage recommended for audio file caching

## Software Requirements

### Operating System
- **Linux**: Ubuntu 20.04 LTS or newer, CentOS 7+, Debian 10+
- **Architecture**: x86_64 (AMD64)

### Runtime Environment
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher
- **Python**: Version 3.x (for node-gyp compilation)

### Required System Packages
```bash
# Core packages
- openssl (SSL/TLS support)
- git (version control)
- curl (HTTP client)
- wget (file downloads)

# Build tools
- gcc/g++ (C++ compiler)
- make (build automation)
- python3 (for node-gyp)

# Audio processing
- ffmpeg (audio conversion)
- sox (sound processing)
- opus-tools (Opus codec support)
- espeak-ng (text-to-speech)

# Database
- sqlite3 (local database)
- sqlite-dev (development headers)
```

### Node.js Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "memorystore": "^1.6.7",
    "ejs": "^3.1.9",
    "bcrypt": "^5.1.0",
    "dotenv": "^16.0.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "socket.io": "^4.6.1",
    "ws": "^8.13.0",
    "axios": "^1.4.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.2",
    "joi": "^17.9.2",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "compression": "^1.7.4",
    "sqlite3": "^5.1.6",
    "sequelize": "^6.32.1",
    "winston": "^3.9.0",
    "rotating-file-stream": "^3.1.0",
    "express-validator": "^7.0.1",
    "sanitize-html": "^2.11.0",
    "jsonwebtoken": "^9.0.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## Network Requirements

### Network Connectivity
- **Internal Network**: Access to 10.105.x.x subnet
- **Server IP**: 172.27.64.10 (primary)
- **Asterisk PBX**: 10.105.0.3:5060 (SIP)
- **Database Server**: 192.168.99.12:3306 (if using external MySQL)

### Firewall Rules (Inbound)
```
- Port 8444/tcp: HTTPS Web Interface
- Port 8444/tcp: WebSocket connections
- Port 10000-30000/udp: RTP media streams
```

### Firewall Rules (Outbound)
```
- Port 5060/udp: SIP to Asterisk (10.105.0.3)
- Port 5038/tcp: AMI to Asterisk (10.105.0.3)
- Port 8089/tcp: WebSocket to Asterisk
- Port 443/tcp: External API calls (SMS gateway)
- Port 3306/tcp: MySQL database (if external)
```

## External Service Dependencies

### 1. Asterisk PBX Server
- **Host**: 10.105.0.3
- **SIP Port**: 5060/udp
- **AMI Port**: 5038/tcp
- **WebSocket Port**: 8089/tcp
- **Required Modules**:
  - chan_sip or chan_pjsip
  - res_http_websocket (for WebRTC)
  - codec_alaw (A-law audio codec)
  - res_agi (for AGI scripts)
  - app_mixmonitor (call recording)

### 2. SMS Gateway (Optional)
- **Provider**: Eskiz.uz
- **API URL**: https://notify.eskiz.uz/api
- **Requirements**:
  - Valid API credentials
  - Internet connectivity
  - SSL/TLS support

### 3. MySQL Database (Optional)
- **Host**: 192.168.99.12
- **Port**: 3306
- **Database**: xabarnoma_tizimi
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_general_ci

## Security Requirements

### SSL/TLS
- **Certificate**: Self-signed or CA-signed certificate
- **Key Length**: RSA 4096-bit minimum
- **TLS Version**: TLS 1.2 minimum
- **Location**: `/config/cert.pem` and `/config/key.pem`

### Authentication
- **Session Management**: Secure session tokens
- **Password Hashing**: bcrypt with salt rounds ≥ 10
- **Session Timeout**: 24 hours default
- **Cookie Security**: httpOnly, secure flags

### File Permissions
```bash
# Configuration files
chmod 600 .env
chmod 600 config/session-secret.txt
chmod 600 config/*.pem

# Data directories
chmod 755 data/
chmod 644 data/*.json

# Log files
chmod 755 logs/
chmod 644 logs/*.log
```

### Environment Variables
```bash
# Required
NODE_ENV=production|development
PORT=8444
SESSION_SECRET=<random-32-char-string>

# SIP Configuration
SIP_SERVER=10.105.0.3
SIP_EXTENSION_1=5530
SIP_EXTENSION_2=5531
SIP_EXTENSION_3=5532
SIP_PASSWORD=<sip-password>

# Admin Access
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<secure-password>

# Optional Services
SMS_API_URL=https://notify.eskiz.uz/api
SMS_LOGIN=<sms-username>
SMS_PASSWORD=<sms-password>
```

## Performance Requirements

### Call Processing
- **Concurrent Calls**: 5 calls per batch
- **Call Rate**: 20-25 calls per minute (normal mode)
- **Batch Interval**: 2 seconds between batches
- **Retry Delay**: 5 seconds for failed calls

### Audio Processing
- **Format**: WAV, MP3, OGG
- **Codec**: PCMA (A-law), PCMU (μ-law)
- **Sample Rate**: 8000 Hz
- **Bit Rate**: 64 kbps
- **Maximum File Size**: 50 MB

### API Response Times
- **Authentication**: < 100ms
- **Employee List**: < 500ms for 10,000 records
- **Call Initiation**: < 200ms
- **Dashboard Load**: < 1 second

### Resource Limits
- **Memory Usage**: < 2 GB under normal load
- **CPU Usage**: < 50% average
- **Database Connections**: Max 20 concurrent
- **WebSocket Connections**: Max 100 concurrent

## Development Environment

### Required Tools
```bash
# Version control
git >= 2.25.1

# Code editor
VSCode with extensions:
- ESLint
- Prettier
- Node.js debugging

# Development utilities
- nodemon (auto-restart)
- Chrome/Firefox DevTools
- Postman/Insomnia (API testing)
```

### Docker Support
```yaml
# Docker requirements
Docker Engine: >= 20.10
Docker Compose: >= 1.29
Base Image: node:18-alpine
```

## Production Environment

### Process Management
```bash
# Using systemd
sudo systemctl start xabarnoma.service
sudo systemctl enable xabarnoma.service

# Using nohup (legacy)
nohup node server.js > server.log 2>&1 &
```

### Monitoring Requirements
- **Health Check Endpoint**: `/api/test-auth/test-session`
- **Log Rotation**: Daily, keep 7 days
- **Metrics Collection**: Memory, CPU, call statistics
- **Alerting**: On service failure or high error rate

### Backup Requirements
- **Data Files**: Daily backup of `/data` directory
- **Database**: Daily SQL dumps if using MySQL
- **Configuration**: Version controlled in Git
- **Audio Files**: Weekly backup of `/public/audio`

## Configuration Requirements

### Directory Structure
```
/home/user/
├── config/           # SSL certificates, secrets
├── data/            # JSON data files
├── lib/             # Core libraries
├── locales/         # Translation files
├── logs/            # Application logs
├── middleware/      # Express middleware
├── public/          # Static assets
├── routes/          # API routes
├── temp/            # Temporary files
├── views/           # EJS templates
├── .env             # Environment configuration
├── server.js        # Main application
└── package.json     # Node.js dependencies
```

### Required Configuration Files
1. **`.env`**: Environment variables
2. **`data/users.json`**: User accounts
3. **`data/employees.json`**: Employee database
4. **`data/districts.json`**: District definitions
5. **`data/sip-accounts.json`**: SIP configurations
6. **`locales/uz-latin.json`**: UI translations

### Initial Setup Steps
1. Clone repository
2. Install Node.js dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Generate SSL certificates if needed
5. Initialize data files from templates
6. Set proper file permissions
7. Start application: `npm start` or `npm run dev`

### Maintenance Tasks
- **Daily**: Check logs for errors
- **Weekly**: Backup data files
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Yearly**: SSL certificate renewal

## Compliance and Standards

### Data Protection
- Employee data must be encrypted at rest
- No sensitive data in logs
- Secure session management
- Regular security updates

### Accessibility
- Multi-language support (Uzbek Latin/Cyrillic, Russian)
- Responsive design for various devices
- Keyboard navigation support
- Screen reader compatibility

### Performance Standards
- Page load time < 3 seconds
- API response time < 500ms
- 99.9% uptime target
- Maximum 5% packet loss for VoIP

## Version History
- **Version 1.0**: Initial release with basic calling features
- **Version 2.0**: Added multi-district support and DTMF detection
- **Version 3.0**: Performance optimization and batch processing
- **Current**: Enhanced security and WebRTC support