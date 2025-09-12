# Notice - Clean Architecture Version

## 📁 Project Structure

```
NewArchitecture/
├── src/
│   ├── core/                 # Business logic (Domain layer)
│   │   ├── domain/           # Entities, Value Objects
│   │   ├── usecases/         # Application business rules
│   │   └── repositories/     # Repository interfaces
│   │
│   ├── infrastructure/       # External services, frameworks
│   │   ├── database/         # Database implementation
│   │   ├── sip/             # SIP/VoIP implementation
│   │   ├── external/        # Third-party services
│   │   └── repositories/   # Repository implementations
│   │
│   ├── application/         # Application services
│   │   ├── services/       # Business services
│   │   ├── dto/           # Data Transfer Objects
│   │   └── mappers/       # Entity-DTO mappers
│   │
│   ├── presentation/       # User interface layer
│   │   ├── api/           # REST API controllers
│   │   ├── websocket/     # WebSocket handlers
│   │   └── views/         # EJS templates
│   │
│   └── shared/            # Shared utilities
│       ├── config/        # Configuration
│       ├── utils/         # Helper functions
│       ├── types/         # TypeScript types
│       └── constants/     # Constants
│
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/              # Utility scripts
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   cd NewArchitecture
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## 🏗️ Architecture Principles

### Clean Architecture Layers:
1. **Core (Domain)** - Business entities and rules
2. **Use Cases** - Application-specific business rules
3. **Infrastructure** - Frameworks, drivers, external services
4. **Presentation** - User interface, API endpoints

### Key Patterns:
- Repository Pattern
- Dependency Injection (tsyringe)
- Domain-Driven Design
- SOLID Principles

## 📋 Features Status

Check `../features.docs.md` for complete feature list and implementation status.

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📝 Configuration

Application name and UI settings can be configured in:
- `.env` file - `UI_APP_NAME` variable
- `src/shared/config/app.config.ts`

## 🔧 Development

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- Nodemon for hot reload

## 📚 Documentation

See `/docs` folder for:
- API documentation
- Architecture decisions
- Development guides