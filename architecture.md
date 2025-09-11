# Qashqadaryo IIB Notification System - Architecture Documentation

## Table of Contents
1. [Overall System Architecture](#overall-system-architecture)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Security Architecture](#security-architecture)
9. [Integration Points](#integration-points)
10. [Frontend Architecture](#frontend-architecture)
11. [Deployment Architecture](#deployment-architecture)
12. [Key Design Patterns](#key-design-patterns)

## 1. Overall System Architecture

The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Web UI     │  │  Socket.IO  │  │  WebRTC     │             │
│  │  (EJS/JS)   │  │  Client     │  │  Client     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Express.js │  │  Socket.IO  │  │  SIP Backend │             │
│  │  REST API   │  │  Server     │  │  (UDP/WS)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Auth       │  │  Broadcast  │  │  Data       │             │
│  │  Middleware │  │  Queue Mgr  │  │  Services   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data & External Services                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  SQLite DB  │  │  Asterisk   │  │  SMS        │             │
│  │             │  │  PBX        │  │  Gateway    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  JSON Files │  │  TTS        │                               │
│  │  (Fallback) │  │  Services   │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Technology Stack

### Backend
- **Runtime**: Node.js v18.x
- **Framework**: Express.js 4.x
- **Database**: SQLite3 (primary), JSON files (fallback)
- **Real-time**: Socket.IO 4.x
- **VoIP**: Custom SIP/RTP implementation
- **Authentication**: express-session, bcrypt
- **Template Engine**: EJS
- **Process Management**: PM2 (recommended), nohup (current)

### Frontend
- **UI Framework**: Vanilla JavaScript (no framework)
- **CSS**: Material Design 3 principles
- **Build Tools**: None (direct serving)
- **Real-time**: Socket.IO Client
- **WebRTC**: For browser-based calling

### External Integrations
- **PBX**: Asterisk 16.x
- **Protocol**: SIP over UDP/WebSocket
- **SMS**: Eskiz API
- **TTS**: Multiple providers (Google, Piper, VoiceRSS)

## 3. Directory Structure

```
/home/user/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── ecosystem.config.js       # PM2 configuration
├── docker-compose.yml        # Container orchestration
├── .env                      # Environment variables
│
├── /lib/                     # Core libraries
│   ├── sip-backend.js        # SIP client implementation
│   ├── database.js           # Database abstraction
│   ├── broadcast-*.js        # Broadcast-related modules
│   ├── rtp-*.js              # RTP audio handling
│   ├── dtmf-*.js             # DTMF detection
│   └── localization.js       # i18n support
│
├── /routes/                  # API routes
│   ├── auth-db.js            # Authentication endpoints
│   ├── broadcast*.js         # Broadcast management
│   ├── employees*.js         # Employee management
│   ├── districts.js          # District management
│   └── sip.js                # SIP phone endpoints
│
├── /middleware/              # Express middleware
│   ├── auth.js               # Authentication checks
│   ├── validation.js         # Input validation
│   └── errorHandler.js       # Error handling
│
├── /views/                   # EJS templates
│   ├── index.ejs             # Dashboard
│   ├── broadcast.ejs         # Broadcast interface
│   ├── employees.ejs         # Employee management
│   └── partials/             # Reusable components
│
├── /public/                  # Static assets
│   ├── /js/                  # Client-side JavaScript
│   ├── /css/                 # Stylesheets
│   ├── /img/                 # Images
│   └── /audio/               # Audio files
│
├── /data/                    # Data storage
│   ├── xabarnoma.db          # SQLite database
│   ├── employees.json        # Employee data (backup)
│   ├── districts.json        # District configuration
│   └── broadcast-history.json # Broadcast logs
│
├── /locales/                 # Translation files
│   ├── uz.json               # Uzbek
│   ├── uz-latin.json         # Uzbek Latin
│   ├── uz-cyrillic.json      # Uzbek Cyrillic
│   └── ru.json               # Russian
│
└── /asterisk/                # Asterisk configuration
    ├── xabarnoma-dialplan.conf
    └── xabarnoma-dtmf.conf
```

## 4. Core Components

### 4.1 Authentication & Authorization
- **Module**: `/middleware/auth.js`, `/routes/auth-db.js`
- **Features**:
  - Session-based authentication
  - Role-based access control (admin, operator, user)
  - District-based access restrictions
  - Password hashing with bcrypt

### 4.2 Broadcast Management
- **Modules**: `/routes/broadcast-simple.js`, `/lib/broadcast-queue-manager.js`
- **Features**:
  - Queue-based call processing
  - Batch processing (5 concurrent calls)
  - Retry mechanism (up to 5 attempts)
  - DTMF confirmation tracking
  - Real-time progress monitoring

### 4.3 SIP/VoIP Integration
- **Module**: `/lib/sip-backend.js`
- **Features**:
  - Multiple SIP account support
  - Dynamic RTP port allocation (10000-20000)
  - WebSocket to UDP bridge
  - Codec negotiation (G.711 A-law priority)

### 4.4 Data Management
- **Module**: `/lib/database.js`
- **Features**:
  - SQLite for persistent storage
  - JSON file fallback
  - Safe file operations with locking
  - Automatic backup creation

### 4.5 Real-time Communication
- **Technology**: Socket.IO
- **Events**:
  - `broadcast-update`: Progress updates
  - `sip-status`: Phone status
  - `employee-update`: Data changes
  - `notification`: System alerts

## 5. Data Flow

### 5.1 Broadcast Flow
```
1. User creates broadcast → 
2. Validate permissions & data →
3. Generate audio (TTS if needed) →
4. Create broadcast record →
5. Queue recipients →
6. Process in batches of 5 →
7. For each call:
   a. Allocate RTP port
   b. Send SIP INVITE
   c. Stream audio via RTP
   d. Listen for DTMF confirmation
   e. Update status
   f. Retry if failed
8. Complete broadcast →
9. Generate report
```

### 5.2 Call State Machine
```
IDLE → DIALING → RINGING → ANSWERED → PLAYING → CONFIRMED/FAILED → ENDED
         ↓          ↓          ↓           ↓            ↓
      FAILED    FAILED     FAILED      RETRY        RETRY
```

## 6. Database Schema

### SQLite Tables

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'operator', 'user')),
    permissions TEXT, -- JSON
    allowed_districts TEXT, -- JSON array
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Employees table
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    rank TEXT,
    department TEXT,
    phone_number TEXT NOT NULL,
    service_phone TEXT,
    district_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Broadcast history table
CREATE TABLE broadcast_history (
    id TEXT PRIMARY KEY,
    message TEXT,
    audio_file TEXT,
    created_by TEXT,
    total_recipients INTEGER,
    confirmed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    metadata TEXT -- JSON
);

-- Indexes for performance
CREATE INDEX idx_employees_district ON employees(district_id);
CREATE INDEX idx_employees_phone ON employees(phone_number);
CREATE INDEX idx_broadcast_created ON broadcast_history(created_at);
```

## 7. API Endpoints

### Authentication
- `POST /login` - User login
- `GET /logout` - User logout
- `GET /api/auth/status` - Check auth status

### Employees
- `GET /api/employees` - List employees (filtered by district)
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/import` - Excel import
- `GET /api/employees/export` - Excel export

### Broadcast
- `GET /api/broadcast-simple/status` - Get broadcast status
- `POST /api/broadcast-simple/start` - Start new broadcast
- `POST /api/broadcast-simple/cancel/:id` - Cancel broadcast
- `GET /api/broadcast-simple/history` - Get broadcast history
- `GET /api/broadcast-simple/report/:id` - Download report

### Districts
- `GET /api/districts` - List all districts
- `POST /api/districts` - Create district
- `PUT /api/districts/:id` - Update district
- `DELETE /api/districts/:id` - Delete district

### SIP/Phone
- `GET /api/sip/status` - SIP registration status
- `POST /api/sip/call` - Make a call
- `POST /api/sip/hangup` - End call
- `POST /api/sip/dtmf` - Send DTMF tone

### System
- `GET /api/system/stats` - System statistics
- `GET /api/localization/:locale` - Get translations
- `GET /api/channel-status` - Global channel status

## 8. Security Architecture

### 8.1 Authentication
- Session-based with secure cookies
- CSRF protection
- Session timeout (24 hours)
- Secure session storage

### 8.2 Authorization
- Role-based access control (RBAC)
- District-based data filtering
- API endpoint protection
- Frontend route guards

### 8.3 Data Security
- Password hashing (bcrypt, 10 rounds)
- HTTPS only (self-signed cert)
- Input validation & sanitization
- SQL injection prevention

### 8.4 Network Security
- Firewall rules for SIP/RTP ports
- Rate limiting on API endpoints
- WebSocket authentication
- IP-based access control (optional)

## 9. Integration Points

### 9.1 Asterisk PBX
- **Protocol**: SIP/UDP on port 5060
- **Audio**: RTP on ports 10000-20000
- **Features**:
  - Registration handling
  - Call routing
  - DTMF detection
  - Audio transcoding

### 9.2 SMS Gateway (Eskiz)
- **API**: REST over HTTPS
- **Auth**: Email/password based
- **Features**:
  - Bulk SMS sending
  - Delivery reports
  - Balance checking

### 9.3 Text-to-Speech
Multiple providers supported:
- **Google TTS**: Cloud-based
- **Piper**: Local, offline
- **VoiceRSS**: API-based
- **Custom**: Pre-recorded messages

## 10. Frontend Architecture

### 10.1 Component Structure
```
/public/js/
├── Core Components
│   ├── dashboard.js         # Main dashboard logic
│   ├── language-manager.js  # i18n handling
│   └── permission-check.js  # Frontend auth
│
├── Feature Components
│   ├── broadcast.js         # Broadcast UI
│   ├── employees.js         # Employee management
│   ├── reports.js           # Reporting UI
│   └── sip-phone.js         # WebRTC phone
│
└── Utilities
    ├── webrtc-*.js          # WebRTC helpers
    ├── codec-handler.js     # Audio codecs
    └── offline-icons.js     # Icon caching
```

### 10.2 State Management
- No framework - vanilla JavaScript
- Global state in window objects
- Event-driven updates
- LocalStorage for persistence

### 10.3 Real-time Updates
- Socket.IO for live data
- Auto-reconnection
- Event-based UI updates
- Progress bars for broadcasts

## 11. Deployment Architecture

### 11.1 Docker Deployment
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8444:8444"
    volumes:
      - ./data:/app/data
      - ./public/audio:/app/public/audio
    environment:
      - NODE_ENV=production
    restart: always
```

### 11.2 Process Management
- **Development**: nodemon
- **Production**: PM2 or systemd
- **Current**: nohup (simple background)

### 11.3 Monitoring
- Health check endpoint
- Memory usage tracking
- Active call monitoring
- Error logging to files

## 12. Key Design Patterns

### 12.1 Architectural Patterns
- **MVC Pattern**: Clear separation of concerns
- **Microservices-like**: Modular component design
- **Event-driven**: Socket.IO for real-time
- **Queue Pattern**: Broadcast processing

### 12.2 Code Patterns
- **Singleton**: Database connections
- **Factory**: SIP backend creation
- **Observer**: Real-time updates
- **Strategy**: Multiple TTS providers
- **Adapter**: WebSocket to UDP bridge

### 12.3 Communication Patterns
- **Request-Response**: REST API
- **Pub-Sub**: Socket.IO events
- **Message Queue**: Broadcast queue
- **Circuit Breaker**: Retry logic

## Performance Considerations

1. **Concurrent Calls**: Limited to 5 per batch
2. **Database**: Indexed for common queries
3. **File I/O**: Async with proper locking
4. **Memory**: Cleanup of completed calls
5. **Network**: Connection pooling for efficiency

## Scalability Options

1. **Horizontal**: Multiple SIP accounts
2. **Vertical**: Increase server resources
3. **Database**: Migration to PostgreSQL
4. **Queue**: Redis for distributed processing
5. **Load Balancing**: Nginx reverse proxy

## Maintenance & Operations

1. **Logging**: Structured logs to files
2. **Backup**: Automated JSON exports
3. **Updates**: Zero-downtime deployment
4. **Monitoring**: Health checks
5. **Debugging**: Extensive debug logging