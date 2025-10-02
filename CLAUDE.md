# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Qashqadaryo IIB Notification System** - Production SIP-based broadcast notification system for police department employees. Supports audio messages, DTMF confirmation, and real-time call tracking for 2000-3000 concurrent users.

## Architecture

**Monolithic Node.js Express application** running on HTTPS (port 8444) with:
- **Backend**: Express.js server (767 lines in server.js)
- **Frontend**: EJS templates with vanilla JavaScript
- **Database**: Dual storage - SQLite (`data/xabarnoma.db`) + JSON files (`data/*.json`)
- **SIP**: Multiple client implementations (JsSIP, SIP.js, custom backend)
- **WebSocket**: Real-time updates for broadcasts and calls
- **Session**: Memory-based sessions (express-session + MemoryStore)

## Repository Structure

```
/
├── server.js              # Main application entry (767 lines)
├── lib/                   # Core services and utilities
│   ├── database.js        # SQLite3 wrapper + JSON fallback
│   ├── sip-*.js          # Multiple SIP client implementations
│   ├── broadcast-*.js    # Broadcast management and queueing
│   ├── audio-*.js        # Audio processing and streaming
│   ├── rtp-*.js          # RTP stream handling
│   └── dtmf-*.js         # DTMF detection implementations
├── routes/                # API routes (auth, employees, broadcast, etc.)
├── views/                 # EJS templates (15 files)
├── public/                # Static assets (CSS, JS, audio)
├── data/                  # Database and JSON data files
│   ├── xabarnoma.db      # SQLite3 (500+ employees)
│   ├── employees.json    # Employee data backup
│   ├── users.json        # User accounts
│   ├── broadcast-history.json  # Broadcast records (~4.8MB)
│   └── backups/          # Automatic JSON backups
├── scripts/               # Deployment and maintenance scripts
└── middleware/            # Auth and validation middleware

```

## Development Commands

```bash
# Installation
npm install

# Development (with auto-reload)
npm run dev                 # Starts server on port 8444 with nodemon

# Production
npm start                   # Starts server.js directly

# Testing & Security
npm test                    # Run Jest tests
npm run security:audit      # NPM security audit (moderate level)
npm run security:fix        # Auto-fix vulnerabilities
npm run lint:security       # ESLint security checks

# Deployment
./setup-autostart.sh        # Setup systemd service
./deploy-to-server.sh       # Deploy to production server
```

## Database Architecture

### Dual Storage System
**SQLite** (`data/xabarnoma.db`): Primary storage for structured data
- Tables: districts, departments, employees, users, groups, broadcasts, calls, sip_accounts
- Managed via `lib/database.js` with automatic fallback to JSON

**JSON Files** (`data/*.json`): Backup/fallback storage
- `employees.json` - 500+ employee records (~580KB)
- `users.json` - User authentication data
- `broadcast-history.json` - Broadcast logs (4.8MB+, auto-backup to data/backups/)
- `departments.json`, `districts.json`, `groups.json` - Reference data
- `permissions.json` - Role-based access control

**Database Module** (`lib/database.js`):
- Automatic SQLite ↔ JSON synchronization
- PRAGMA foreign_keys enabled
- Auto-creates tables on startup
- Graceful degradation to JSON on SQLite errors

## SIP/VoIP Architecture

### Multiple SIP Client Implementations
The system has **several SIP client files** for different use cases:
- `lib/sip-backend.js` - Backend SIP client for automated calls
- `lib/sip-tcp-backend.js` - TCP-based SIP implementation
- `sip-client-new.js`, `sip-npm-client.js` - Alternative implementations
- `microsip-*.js` - MicroSIP-style clients
- `final-sip-client.js` - Latest stable implementation

### Asterisk Integration
**Asterisk Server**: `10.105.0.3`
- **AMI**: Port 5038 (Asterisk Manager Interface)
- **SIP**: Port 5060
- **WebSocket**: Port 8089 (FreePBX WebRTC)
- **Extensions**: 5530, 5531, 5532

**AMI Manager** (`lib/asterisk-ami.js`):
- Event monitoring (DTMF, call state changes)
- Originate calls programmatically
- Real-time call status tracking

### WebSocket Architecture
**Server-side** (`lib/ws-to-udp-proxy.js`):
- Proxies WebSocket ↔ UDP for SIP clients
- Port 8089 for WebRTC connections
- Real-time broadcast status updates

**Client-side** (`public/js/sip-phone.js`):
- JsSIP-based WebRTC phone
- DTMF tone generation and detection
- Call recording and playback

## Broadcast System

### Queue-Based Concurrent Calling
**Manager** (`lib/broadcast-queue-manager.js`):
- Concurrent call limit: 45 calls simultaneously
- Queue system for 2000-3000 employees
- Retry logic for failed calls
- DTMF confirmation tracking (expect "1" press)

**Call Limiter** (`lib/broadcast-call-limiter.js`):
- Rate limiting to prevent Asterisk overload
- Exponential backoff on failures
- Call state machine (pending → calling → answered → confirmed/failed)

**Audio Handling**:
- Upload: `routes/secure-audio.js` + `lib/audio-processor.js`
- Streaming: `lib/audio-stream.js`, `lib/rtp-stream.js`
- Recording: `lib/call-recorder.js`
- Storage: `public/audio/uploads/` (WebM format)

## API Endpoints

### Authentication (`routes/auth-db.js`)
- `POST /login` - Session-based login (bcrypt)
- `GET /logout` - Destroy session
- `GET /api/auth/check` - Session validation

### Employees (`routes/employees.js`)
- `GET /api/employees` - List all (with district/department filters)
- `POST /api/employees` - Create new
- `PUT /api/employees/:id` - Update
- `DELETE /api/employees/:id` - Delete
- `GET /api/employees/export` - Excel export

### Broadcasts (`routes/broadcast-simple.js`)
- `POST /api/broadcast/create` - New broadcast
- `GET /api/broadcast/status/:id` - Real-time status
- `POST /api/broadcast/confirm` - DTMF confirmation callback
- `GET /api/broadcast/recent` - History

### SIP (`routes/sip-accounts.js`)
- `GET /api/sip/config` - Client configuration
- `POST /api/sip/test` - Connection test
- `GET /api/sip/accounts` - SIP account list

### System
- `GET /api/system/stats` - Server statistics
- `GET /api/excel/template` - Employee import template

## Environment Configuration

**Required `.env` variables**:
```env
# Server
PORT=8444

# Asterisk
SIP_SERVER=10.105.0.3
SIP_PORT=5060
SIP_WEBSOCKET_PORT=8089
SIP_EXTENSION_1=5530
SIP_EXTENSION_2=5531
SIP_EXTENSION_3=5532

# AMI
AMI_HOST=10.105.0.3
AMI_PORT=5038
AMI_USERNAME=admin
AMI_PASSWORD=<secret>

# Session
SESSION_SECRET=<random-secret>
SESSION_MAX_AGE=86400000  # 24 hours
```

## Key Dependencies

**Backend**:
- `express` - Web framework
- `sqlite3` - Database
- `express-session` + `memorystore` - Session management
- `bcrypt` - Password hashing
- `ws`, `socket.io` - WebSocket
- `asterisk-manager` - AMI client
- `multer` - File uploads
- `xlsx` - Excel export

**SIP/VoIP**:
- `jssip` - WebRTC SIP client
- `sip.js` - Alternative SIP library
- `sip` - Low-level SIP protocol
- `sdp-transform` - SDP parsing

**Security**:
- `helmet` - Security headers
- `cors` - CORS configuration
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation

## Security Features

1. **HTTPS Only**: Self-signed certificate (port 8444)
2. **Session-based Auth**: HTTP-only cookies, 24h timeout
3. **Password Hashing**: bcrypt for user credentials
4. **CORS**: Configured for specific origins
5. **Rate Limiting**: API endpoint protection
6. **Input Validation**: express-validator on all routes
7. **Secure Audio Upload**: Validated file types, size limits

## Known Issues & Workarounds

1. **Multiple SIP Clients**: Several implementation files exist (sip-backend.js, sip-client-new.js, etc.). Current production uses `lib/sip-backend.js`
2. **DTMF Detection**: Multiple detection methods in `lib/dtmf-*.js` due to Asterisk version compatibility
3. **Large Broadcast History**: `broadcast-history.json` grows to 4.8MB+. Auto-backup system in place, but consider periodic archival
4. **Memory Sessions**: Using MemoryStore (not for multi-instance deployments). Consider Redis for scaling
5. **Dual Database**: SQLite + JSON redundancy can cause sync issues. Database module handles fallback automatically
6. **Audio RTP**: Backend SIP handles signaling only, not RTP media streams (Asterisk handles audio)

## Development Workflow

1. **Start Development**:
   ```bash
   npm run dev  # Nodemon on port 8444
   ```

2. **Access**:
   - URL: `https://172.27.64.10:8444`
   - Default: admin / admin123

3. **Testing Broadcast**:
   - Upload audio file or record
   - Select employees/groups
   - Monitor WebSocket events for real-time status
   - Check `data/broadcast-history.json` for results

4. **Logs**: Console output (consider `tail -f` if using systemd service)

## Code Patterns

### Adding a New Route
1. Create file in `routes/` (e.g., `routes/my-feature.js`)
2. Export router: `module.exports = router;`
3. Register in `server.js`: `app.use('/api/my-feature', require('./routes/my-feature'));`

### Database Query Pattern
```javascript
const db = require('./lib/database');

// SQLite with JSON fallback
const employees = await db.query('SELECT * FROM employees WHERE district_id = ?', [districtId]);

// Manual JSON access
const employeesData = JSON.parse(fs.readFileSync('./data/employees.json', 'utf8'));
```

### WebSocket Broadcast Pattern
```javascript
// In server.js, wss is global WebSocket server
wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'broadcast-update', data: status }));
    }
});
```

## Deployment

### Systemd Service
```bash
./setup-autostart.sh  # Creates qashqadaryo-iib.service
sudo systemctl start qashqadaryo-iib
sudo systemctl enable qashqadaryo-iib
```

### Server Deployment
```bash
./deploy-to-server.sh  # Automated deployment script
```

### Manual Deployment
1. Run security audit: `npm run security:audit`
2. Build/bundle: Not required (no build step)
3. Copy files to production server
4. `npm install --production`
5. Configure `.env` for production
6. Start service: `sudo systemctl start qashqadaryo-iib`

## Testing

**Jest Tests**: Focus on critical business logic
- Database operations
- SIP connection tests
- Broadcast queue management
- DTMF detection

```bash
npm test                # All tests
npm run test:security   # Security-specific tests
```

## Monitoring & Debugging

**Debug Scripts** (in root):
- `dtmf-*.js` - DTMF detection debugging (multiple implementations)
- `monitor-broadcast.sh` - Watch broadcast progress
- `debug-sip-auth.js` - SIP authentication testing
- `phone-statistics.js` - Employee phone number analysis

**System Stats**: `/api/system/stats` endpoint for server health

## File Naming Conventions

- **Routes**: Kebab-case (`employees-excel.js`, `auth-db.js`)
- **Services**: Kebab-case with prefix (`sip-backend.js`, `broadcast-queue-manager.js`)
- **Views**: Kebab-case EJS (`sip-phone.ejs`, `file-manager.ejs`)
- **Data**: Kebab-case JSON (`broadcast-history.json`)

## Important Notes

- ⚠️ **Production System**: This is actively used by 2000-3000 police department employees
- ⚠️ **Asterisk Dependency**: Requires configured Asterisk server at 10.105.0.3
- ⚠️ **HTTPS Required**: Browser WebRTC APIs require HTTPS (self-signed cert included)
- ⚠️ **Session Storage**: Uses memory-based sessions (not suitable for load balancing)
- ⚠️ **Broadcast History**: Large JSON file - monitor disk space
- ⚠️ **Concurrent Calls**: Limited to 45 to prevent Asterisk overload
