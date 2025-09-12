/**
 * Dependency Injection Container Configuration
 * Sets up all dependencies for Clean Architecture layers
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// Domain - Repository Interfaces (these will be registered with concrete implementations)
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IGroupRepository } from '@/core/domain/repositories/IGroupRepository';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { IDepartmentRepository } from '@/core/domain/repositories/IDepartmentRepository';
import { IDistrictRepository } from '@/core/domain/repositories/IDistrictRepository';
import { ISIPAccountRepository } from '@/core/domain/repositories/ISIPAccountRepository';

// Infrastructure - Repository Implementations
import { EmployeeRepository } from '@/infrastructure/database/repositories/EmployeeRepository';
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { BroadcastRepository } from '@/infrastructure/database/repositories/BroadcastRepository';
import { CallRepository } from '@/infrastructure/database/repositories/CallRepository';
// import { GroupRepository } from '@/infrastructure/database/repositories/GroupRepository';
import { AudioFileRepository } from '@/infrastructure/database/repositories/AudioFileRepository';
// import { DepartmentRepository } from '@/infrastructure/database/repositories/DepartmentRepository';
import { DistrictRepository } from '@/infrastructure/database/repositories/DistrictRepository';
// import { SIPAccountRepository } from '@/infrastructure/database/repositories/SIPAccountRepository';

// Application - Use Cases
import { CreateEmployeeUseCase } from '@/application/usecases/employee/CreateEmployeeUseCase';
import { GetEmployeeListUseCase } from '@/application/usecases/employee/GetEmployeeListUseCase';
import { UpdateEmployeeUseCase } from '@/application/usecases/employee/UpdateEmployeeUseCase';
import { DeleteEmployeeUseCase } from '@/application/usecases/employee/DeleteEmployeeUseCase';

import { LoginUserUseCase } from '@/application/usecases/user/LoginUserUseCase';
import { LogoutUserUseCase } from '@/application/usecases/user/LogoutUserUseCase';
import { GetUserProfileUseCase } from '@/application/usecases/user/GetUserProfileUseCase';

import { StartBroadcastUseCase } from '@/application/usecases/broadcast/StartBroadcastUseCase';
import { StopBroadcastUseCase } from '@/application/usecases/broadcast/StopBroadcastUseCase';
import { GetBroadcastStatusUseCase } from '@/application/usecases/broadcast/GetBroadcastStatusUseCase';
import { GetBroadcastListUseCase } from '@/application/usecases/broadcast/GetBroadcastListUseCase';

import { CreateCallRecordUseCase } from '@/application/usecases/call/CreateCallRecordUseCase';
import { GetCallHistoryUseCase } from '@/application/usecases/call/GetCallHistoryUseCase';
import { UpdateCallStatusUseCase } from '@/application/usecases/call/UpdateCallStatusUseCase';

// import { CreateGroupUseCase } from '@/application/usecases/group/CreateGroupUseCase';
// import { UpdateGroupUseCase } from '@/application/usecases/group/UpdateGroupUseCase';
// import { GetGroupListUseCase } from '@/application/usecases/group/GetGroupListUseCase';
// import { DeleteGroupUseCase } from '@/application/usecases/group/DeleteGroupUseCase';

import { UploadAudioFileUseCase } from '@/application/usecases/audiofile/UploadAudioFileUseCase';
import { GetAudioFileListUseCase } from '@/application/usecases/audiofile/GetAudioFileListUseCase';
import { DeleteAudioFileUseCase } from '@/application/usecases/audiofile/DeleteAudioFileUseCase';

// SIP Use Cases (NEW)
import { MakeCallUseCase } from '@/application/usecases/sip/MakeCallUseCase';
import { AnswerCallUseCase } from '@/application/usecases/sip/AnswerCallUseCase';
import { HangupCallUseCase } from '@/application/usecases/sip/HangupCallUseCase';
import { ExecuteBroadcastUseCase } from '@/application/usecases/broadcast/ExecuteBroadcastUseCase';

// Application - Mappers
import { EmployeeMapper } from '@/application/mappers/employee/EmployeeMapper';
import { UserMapper } from '@/application/mappers/user/UserMapper';
import { BroadcastMapper } from '@/application/mappers/broadcast/BroadcastMapper';
import { CallMapper } from '@/application/mappers/call/CallMapper';
// import { GroupMapper } from '@/application/mappers/group/GroupMapper';
import { AudioFileMapper } from '@/application/mappers/audiofile/AudioFileMapper';

// Presentation - Controllers
import { EmployeeController } from '@/presentation/controllers/employee/EmployeeController';
import { UserController } from '@/presentation/controllers/user/UserController';
import { BroadcastController } from '@/presentation/controllers/broadcast/BroadcastController';
import { CallController } from '@/presentation/controllers/call/CallController';
// import { GroupController } from '@/presentation/controllers/group/GroupController';
import { AudioFileController } from '@/presentation/controllers/audiofile/AudioFileController';

// SIP Controller (NEW)
import { SipController } from '@/presentation/controllers/sip/SipController';

// Presentation - Middlewares
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';

// Infrastructure - Services (NEW)
import { ISipService, SipService } from '@/infrastructure/services/SipService';
import { IAudioManager, AudioManager } from '@/infrastructure/services/AudioManager';
import { IWebSocketService, WebSocketService } from '@/infrastructure/services/WebSocketService';

export class DIContainer {
  /**
   * Configure all dependencies
   */
  public static configure(): void {
    console.log('Configuring Dependency Injection Container...');

    // Register Repository Implementations
    this.registerRepositories();

    // Register Services (NEW)
    this.registerServices();

    // Register Use Cases
    this.registerUseCases();

    // Register Mappers
    this.registerMappers();

    // Register Controllers
    this.registerControllers();

    // Register Middlewares
    this.registerMiddlewares();

    console.log('Dependency Injection Container configured successfully');
  }

  /**
   * Register Repository implementations with their interfaces
   */
  private static registerRepositories(): void {
    // Employee Repository
    container.registerSingleton<IEmployeeRepository>('IEmployeeRepository', EmployeeRepository);
    
    // User Repository
    container.registerSingleton<IUserRepository>('IUserRepository', UserRepository);
    
    // Broadcast Repository
    container.registerSingleton<IBroadcastRepository>('IBroadcastRepository', BroadcastRepository);
    
    // Call Repository - temporarily disabled
    container.registerSingleton<ICallRepository>('ICallRepository', CallRepository);
    
    // Group Repository - temporarily disabled
    // container.registerSingleton<IGroupRepository>('IGroupRepository', GroupRepository);
    
    // Audio File Repository - temporarily disabled
    container.registerSingleton<IAudioFileRepository>('IAudioFileRepository', AudioFileRepository);
    
    // Department Repository - temporarily disabled
    // container.registerSingleton<IDepartmentRepository>('IDepartmentRepository', DepartmentRepository);
    
    // District Repository
    container.registerSingleton<IDistrictRepository>('IDistrictRepository', DistrictRepository);
    
    // SIP Account Repository - temporarily disabled
    // container.registerSingleton<ISIPAccountRepository>('ISIPAccountRepository', SIPAccountRepository);

    console.log('✓ Repositories registered');
  }

  /**
   * Register Services
   */
  private static registerServices(): void {
    // SIP Service
    container.registerSingleton<ISipService>('ISipService', SipService);
    
    // Audio Manager
    container.registerSingleton<IAudioManager>('IAudioManager', AudioManager);
    
    // WebSocket Service
    container.registerSingleton<IWebSocketService>('IWebSocketService', WebSocketService);

    console.log('✓ Services registered');
  }

  /**
   * Register Use Cases
   */
  private static registerUseCases(): void {
    // Employee Use Cases
    container.registerSingleton(CreateEmployeeUseCase);
    container.registerSingleton(GetEmployeeListUseCase);
    container.registerSingleton(UpdateEmployeeUseCase);
    container.registerSingleton(DeleteEmployeeUseCase);

    // User Use Cases
    container.registerSingleton(LoginUserUseCase);
    container.registerSingleton(LogoutUserUseCase);
    container.registerSingleton(GetUserProfileUseCase);

    // Broadcast Use Cases
    container.registerSingleton(StartBroadcastUseCase);
    container.registerSingleton(StopBroadcastUseCase);
    container.registerSingleton(GetBroadcastStatusUseCase);
    container.registerSingleton(GetBroadcastListUseCase);

    // Call Use Cases
    container.registerSingleton(CreateCallRecordUseCase);
    container.registerSingleton(GetCallHistoryUseCase);
    container.registerSingleton(UpdateCallStatusUseCase);

    // Group Use Cases (temporarily disabled)
    // container.registerSingleton(CreateGroupUseCase);
    // container.registerSingleton(UpdateGroupUseCase);
    // container.registerSingleton(GetGroupListUseCase);
    // container.registerSingleton(DeleteGroupUseCase);

    // Audio File Use Cases
    container.registerSingleton(UploadAudioFileUseCase);
    container.registerSingleton(GetAudioFileListUseCase);
    container.registerSingleton(DeleteAudioFileUseCase);

    // SIP Use Cases (NEW)
    container.registerSingleton(MakeCallUseCase);
    container.registerSingleton(AnswerCallUseCase);
    container.registerSingleton(HangupCallUseCase);
    container.registerSingleton(ExecuteBroadcastUseCase);

    console.log('✓ Use Cases registered');
  }

  /**
   * Register Mappers
   */
  private static registerMappers(): void {
    container.registerSingleton(EmployeeMapper);
    container.registerSingleton(UserMapper);
    container.registerSingleton(BroadcastMapper);
    container.registerSingleton(CallMapper);
    // container.registerSingleton(GroupMapper);
    container.registerSingleton(AudioFileMapper);
    // container.registerSingleton(DepartmentMapper);
    // container.registerSingleton(DistrictMapper);
    // container.registerSingleton(SIPAccountMapper);

    console.log('✓ Mappers registered');
  }

  /**
   * Register Controllers
   */
  private static registerControllers(): void {
    container.registerSingleton(EmployeeController);
    container.registerSingleton(UserController);
    container.registerSingleton(BroadcastController);
    container.registerSingleton(CallController);
    // container.registerSingleton(GroupController);
    container.registerSingleton(AudioFileController);

    // SIP Controller (NEW)
    container.registerSingleton(SipController);

    console.log('✓ Controllers registered');
  }

  /**
   * Register Middlewares
   */
  private static registerMiddlewares(): void {
    container.registerSingleton(AuthMiddleware);

    console.log('✓ Middlewares registered');
  }

  /**
   * Get container instance
   */
  public static getContainer() {
    return container;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  public static clear(): void {
    container.clearInstances();
    console.log('✓ Container cleared');
  }

  /**
   * Validate container configuration
   */
  public static validate(): boolean {
    try {
      // Try to resolve key dependencies to validate configuration
      container.resolve(CreateEmployeeUseCase);
      container.resolve(LoginUserUseCase);
      container.resolve(StartBroadcastUseCase);
      container.resolve(EmployeeController);
      container.resolve(UserController);
      
      console.log('✓ Container validation successful');
      return true;
    } catch (error) {
      console.error('✗ Container validation failed:', error);
      return false;
    }
  }

  /**
   * Display registered services info (for debugging)
   */
  public static displayInfo(): void {
    console.log('\n=== Dependency Injection Container Info ===');
    console.log('Registered Services:');
    console.log('- Repositories: 9 interfaces → implementations');
    console.log('- Use Cases: 16 business logic handlers');
    console.log('- Mappers: 9 entity ↔ DTO converters');
    console.log('- Controllers: 6 HTTP request handlers');
    console.log('- Middlewares: Authentication & Authorization');
    console.log('============================================\n');
  }
}