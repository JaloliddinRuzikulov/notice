# YANGI ARXITEKTURADA TELECOM FUNKTIONALLIK QO'SHISH REJASI

## MUAMMO TAHLILI
- Yangi Clean Architecture tizimida hech qanday haqiqiy telecom funktionallik yo'q
- UI/Frontend qismi mavjud emas
- SIP qo'ng'iroq qila olmaydigan
- Broadcast qila olmaydigan
- Faqat database CRUD operatsiyalari mavjud

## ASOSIY MAQSAD
Eski tizimdagi haqiqiy telecom funktionallikni yangi Clean Architecture ga to'g'ri implement qilish

---

## 1. INFRASTRUKTURA QATLAMI (Infrastructure Layer)

### 1.1 SIP Service Implementation
**Fayl:** `src/infrastructure/services/SipService.ts`
```typescript
export interface ISipService {
  connect(account: SipAccount): Promise<void>;
  disconnect(): Promise<void>;
  makeCall(number: string): Promise<Call>;
  hangupCall(callId: string): Promise<void>;
  answerCall(callId: string): Promise<void>;
  transferCall(callId: string, targetNumber: string): Promise<void>;
  holdCall(callId: string): Promise<void>;
  resumeCall(callId: string): Promise<void>;
  sendDTMF(callId: string, dtmf: string): Promise<void>;
  getActiveCall(): Call | null;
  on(event: string, callback: Function): void;
}

export class SipService implements ISipService {
  private ua: UserAgent;
  private currentCall: Call | null = null;
  private eventEmitter: EventEmitter;
  
  constructor() {
    // JsSIP UserAgent initialization
    // Event listeners setup
    // Audio context setup
  }
  
  // Barcha methodlarni implement qilish
}
```

### 1.2 WebRTC Audio Manager
**Fayl:** `src/infrastructure/services/AudioManager.ts`
```typescript
export interface IAudioManager {
  initializeAudio(): Promise<MediaStream>;
  startRecording(stream: MediaStream): Promise<void>;
  stopRecording(): Promise<Blob>;
  playAudio(audioUrl: string): Promise<void>;
  setVolume(level: number): void;
  getMicrophoneLevel(): number;
}

export class AudioManager implements IAudioManager {
  private audioContext: AudioContext;
  private mediaRecorder: MediaRecorder;
  private audioElement: HTMLAudioElement;
  
  // Audio functionality implementation
}
```

### 1.3 Real-time Communication (WebSocket)
**Fayl:** `src/infrastructure/services/WebSocketService.ts`
```typescript
export interface IWebSocketService {
  connect(): Promise<void>;
  disconnect(): void;
  emit(event: string, data: any): void;
  on(event: string, callback: Function): void;
  broadcastCallStatus(callId: string, status: CallStatus): void;
}

export class WebSocketService implements IWebSocketService {
  private socket: Socket;
  
  // Socket.io implementation
}
```

---

## 2. APPLICATION LAYER KENGAYTMALARI

### 2.1 SIP Call Use Cases
**Fayl:** `src/application/usecases/sip/MakeCallUseCase.ts`
```typescript
export interface MakeCallRequest {
  fromNumber: string;
  toNumber: string;
  callType: CallType;
  employeeId?: string;
}

export class MakeCallUseCase implements IUseCase<MakeCallRequest, UseCaseResult<Call>> {
  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IWebSocketService') private wsService: IWebSocketService
  ) {}
  
  async execute(request: MakeCallRequest): Promise<UseCaseResult<Call>> {
    // 1. Validate request
    // 2. Create call record in database
    // 3. Initiate SIP call
    // 4. Setup event listeners
    // 5. Broadcast status via WebSocket
    // 6. Return call object
  }
}
```

**Fayl:** `src/application/usecases/sip/AnswerCallUseCase.ts`
**Fayl:** `src/application/usecases/sip/HangupCallUseCase.ts`
**Fayl:** `src/application/usecases/sip/TransferCallUseCase.ts`

### 2.2 Enhanced Broadcast Use Cases
**Fayl:** `src/application/usecases/broadcast/ExecuteBroadcastUseCase.ts`
```typescript
export class ExecuteBroadcastUseCase implements IUseCase<ExecuteBroadcastRequest, UseCaseResult<BroadcastExecution>> {
  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('IBroadcastRepository') private broadcastRepository: IBroadcastRepository,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IAudioManager') private audioManager: IAudioManager
  ) {}
  
  async execute(request: ExecuteBroadcastRequest): Promise<UseCaseResult<BroadcastExecution>> {
    // 1. Get broadcast details
    // 2. Get target recipients
    // 3. For each recipient:
    //    - Create call record
    //    - Initiate SIP call
    //    - Play audio message
    //    - Handle DTMF responses
    //    - Update call status
    // 4. Update broadcast statistics
    // 5. Return execution report
  }
}
```

---

## 3. PRESENTATION LAYER (UI)

### 3.1 Views (EJS Templates)
**Katalog:** `src/presentation/views/`

**Fayl:** `src/presentation/views/dashboard.ejs`
- Dashboard sahifasi (eski tizimdagi index.ejs asosida)
- Real-time statistics
- Recent broadcasts table
- Quick actions

**Fayl:** `src/presentation/views/sip-phone.ejs`
- SIP phone interface
- Dialpad
- Call controls (answer, hangup, hold, transfer)
- Call history
- DTMF input

**Fayl:** `src/presentation/views/broadcast.ejs`
- Broadcast creation form
- Target selection (employees, departments, districts)
- Audio file upload
- Message input
- Scheduling options

**Fayl:** `src/presentation/views/call-history.ejs`
- Call logs table
- Filter options
- Export functionality
- Call recordings

**Fayl:** `src/presentation/views/layouts/main.ejs`
- Main layout template
- Navigation menu
- CSS/JS includes

### 3.2 Static Assets
**Katalog:** `public/`

**Fayl:** `public/js/sip-phone.js`
```javascript
class SipPhoneClient {
  constructor() {
    this.ws = io();
    this.currentCall = null;
    this.initializeEventListeners();
  }
  
  makeCall(number) {
    // Send request to backend
    // Handle response
    // Update UI
  }
  
  answerCall() {
    // Answer incoming call
  }
  
  hangupCall() {
    // End current call
  }
  
  updateCallStatus(status) {
    // Update UI based on call status
  }
}
```

**Fayl:** `public/js/broadcast-dashboard.js`
- Broadcast management
- Real-time statistics updates
- Progress tracking

**Fayl:** `public/css/sip-phone.css`
- SIP phone styling
- Dialpad design
- Call status indicators

---

## 4. CONTROLLERS VA ROUTES

### 4.1 SIP Controller
**Fayl:** `src/presentation/controllers/SipController.ts`
```typescript
@controller('/api/sip')
export class SipController {
  constructor(
    @inject('MakeCallUseCase') private makeCallUseCase: MakeCallUseCase,
    @inject('AnswerCallUseCase') private answerCallUseCase: AnswerCallUseCase,
    @inject('HangupCallUseCase') private hangupCallUseCase: HangupCallUseCase
  ) {}
  
  @httpPost('/call')
  async makeCall(@request() req: Request, @response() res: Response) {
    // Handle call request
  }
  
  @httpPost('/answer/:callId')
  async answerCall(@requestParam('callId') callId: string, @response() res: Response) {
    // Handle answer request
  }
  
  @httpPost('/hangup/:callId')
  async hangupCall(@requestParam('callId') callId: string, @response() res: Response) {
    // Handle hangup request
  }
}
```

### 4.2 View Routes
**Fayl:** `src/presentation/routes/ViewRoutes.ts`
```typescript
export class ViewRoutes extends BaseRouter {
  protected setupRoutes(): void {
    this.router.get('/', this.dashboard.bind(this));
    this.router.get('/sip-phone', this.sipPhone.bind(this));
    this.router.get('/broadcast', this.broadcast.bind(this));
    this.router.get('/call-history', this.callHistory.bind(this));
  }
  
  private async dashboard(req: Request, res: Response) {
    // Render dashboard with statistics
  }
  
  private async sipPhone(req: Request, res: Response) {
    // Render SIP phone interface
  }
}
```

---

## 5. WEBSOCKET INTEGRATION

### 5.1 WebSocket Events
**Fayl:** `src/infrastructure/websocket/CallEvents.ts`
```typescript
export class CallEventHandler {
  constructor(
    private wsService: IWebSocketService,
    private callRepository: ICallRepository
  ) {}
  
  handleConnection(socket: Socket) {
    socket.on('join-room', this.handleJoinRoom.bind(this));
    socket.on('call-status-update', this.handleCallStatusUpdate.bind(this));
    socket.on('dtmf-input', this.handleDTMFInput.bind(this));
  }
  
  private async handleCallStatusUpdate(data: any) {
    // Update call status in database
    // Broadcast to all connected clients
  }
}
```

---

## 6. DEPENDENCIES VA CONFIGURATION

### 6.1 Package.json Dependencies
```json
{
  "dependencies": {
    "jssip": "^3.10.1",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "ejs": "^3.1.9",
    "multer": "^1.4.5-lts.1"
  }
}
```

### 6.2 DI Container Setup
**Fayl:** `src/infrastructure/di/container.ts`
```typescript
container.register('ISipService', { useClass: SipService });
container.register('IAudioManager', { useClass: AudioManager });
container.register('IWebSocketService', { useClass: WebSocketService });
container.register('MakeCallUseCase', { useClass: MakeCallUseCase });
```

---

## 7. IMPLEMENTATION TARTIBI

### Phase 1: Core Infrastructure
1. SipService implementation
2. AudioManager implementation
3. WebSocketService setup
4. Basic DI container configuration

### Phase 2: Use Cases
1. MakeCallUseCase
2. AnswerCallUseCase, HangupCallUseCase
3. Enhanced StartBroadcastUseCase
4. ExecuteBroadcastUseCase

### Phase 3: Presentation Layer
1. Basic EJS templates
2. SIP phone interface
3. Broadcast interface
4. Dashboard with real-time data

### Phase 4: Integration
1. WebSocket real-time updates
2. Audio recording/playback
3. DTMF handling
4. Error handling va logging

### Phase 5: Testing
1. Unit tests
2. Integration tests
3. End-to-end testing
4. Performance optimization

---

## SAVOLLAR

1. **SIP Server Details:** Qaysi SIP server ishlatamiz? (Asterisk, FreeSWITCH, yoki boshqa?)
2. **Audio Format:** Qaysi audio formatlarni qo'llab-quvvatlash kerak? (WAV, MP3, OGG?)
3. **Authentication:** SIP account authentication qanday ishlashi kerak?
4. **Recording Storage:** Call recordinglarni qayerda saqlaymiz?
5. **Scalability:** Nechta concurrent calllarni qo'llab-quvvatlash kerak?
6. **Browser Compatibility:** Qaysi browserlarni qo'llab-quvvatlash kerak?

Bu rejani tasdiqlasangiz, implementation boshlash mumkin!