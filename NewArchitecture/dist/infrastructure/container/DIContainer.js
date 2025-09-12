"use strict";
/**
 * Dependency Injection Container Configuration
 * Sets up all dependencies for Clean Architecture layers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIContainer = void 0;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
// Infrastructure - Repository Implementations
const EmployeeRepository_1 = require("@/infrastructure/database/repositories/EmployeeRepository");
const UserRepository_1 = require("@/infrastructure/database/repositories/UserRepository");
const BroadcastRepository_1 = require("@/infrastructure/database/repositories/BroadcastRepository");
// import { CallRepository } from '@/infrastructure/database/repositories/CallRepository';
// import { GroupRepository } from '@/infrastructure/database/repositories/GroupRepository';
// import { AudioFileRepository } from '@/infrastructure/database/repositories/AudioFileRepository';
// import { DepartmentRepository } from '@/infrastructure/database/repositories/DepartmentRepository';
const DistrictRepository_1 = require("@/infrastructure/database/repositories/DistrictRepository");
// import { SIPAccountRepository } from '@/infrastructure/database/repositories/SIPAccountRepository';
// Application - Use Cases
const CreateEmployeeUseCase_1 = require("@/application/usecases/employee/CreateEmployeeUseCase");
const GetEmployeeListUseCase_1 = require("@/application/usecases/employee/GetEmployeeListUseCase");
const UpdateEmployeeUseCase_1 = require("@/application/usecases/employee/UpdateEmployeeUseCase");
const DeleteEmployeeUseCase_1 = require("@/application/usecases/employee/DeleteEmployeeUseCase");
const LoginUserUseCase_1 = require("@/application/usecases/user/LoginUserUseCase");
const LogoutUserUseCase_1 = require("@/application/usecases/user/LogoutUserUseCase");
const GetUserProfileUseCase_1 = require("@/application/usecases/user/GetUserProfileUseCase");
const StartBroadcastUseCase_1 = require("@/application/usecases/broadcast/StartBroadcastUseCase");
const StopBroadcastUseCase_1 = require("@/application/usecases/broadcast/StopBroadcastUseCase");
const GetBroadcastStatusUseCase_1 = require("@/application/usecases/broadcast/GetBroadcastStatusUseCase");
const GetBroadcastListUseCase_1 = require("@/application/usecases/broadcast/GetBroadcastListUseCase");
const CreateCallRecordUseCase_1 = require("@/application/usecases/call/CreateCallRecordUseCase");
const GetCallHistoryUseCase_1 = require("@/application/usecases/call/GetCallHistoryUseCase");
const UpdateCallStatusUseCase_1 = require("@/application/usecases/call/UpdateCallStatusUseCase");
const CreateGroupUseCase_1 = require("@/application/usecases/group/CreateGroupUseCase");
const UpdateGroupUseCase_1 = require("@/application/usecases/group/UpdateGroupUseCase");
const GetGroupListUseCase_1 = require("@/application/usecases/group/GetGroupListUseCase");
const DeleteGroupUseCase_1 = require("@/application/usecases/group/DeleteGroupUseCase");
const UploadAudioFileUseCase_1 = require("@/application/usecases/audiofile/UploadAudioFileUseCase");
const GetAudioFileListUseCase_1 = require("@/application/usecases/audiofile/GetAudioFileListUseCase");
const DeleteAudioFileUseCase_1 = require("@/application/usecases/audiofile/DeleteAudioFileUseCase");
// Application - Mappers
const EmployeeMapper_1 = require("@/application/mappers/employee/EmployeeMapper");
const UserMapper_1 = require("@/application/mappers/user/UserMapper");
const BroadcastMapper_1 = require("@/application/mappers/broadcast/BroadcastMapper");
const CallMapper_1 = require("@/application/mappers/call/CallMapper");
const GroupMapper_1 = require("@/application/mappers/group/GroupMapper");
const AudioFileMapper_1 = require("@/application/mappers/audiofile/AudioFileMapper");
// Presentation - Controllers
const EmployeeController_1 = require("@/presentation/controllers/employee/EmployeeController");
const UserController_1 = require("@/presentation/controllers/user/UserController");
const BroadcastController_1 = require("@/presentation/controllers/broadcast/BroadcastController");
const CallController_1 = require("@/presentation/controllers/call/CallController");
const GroupController_1 = require("@/presentation/controllers/group/GroupController");
const AudioFileController_1 = require("@/presentation/controllers/audiofile/AudioFileController");
// Presentation - Middlewares
const AuthMiddleware_1 = require("@/presentation/middlewares/AuthMiddleware");
class DIContainer {
    /**
     * Configure all dependencies
     */
    static configure() {
        console.log('Configuring Dependency Injection Container...');
        // Register Repository Implementations
        this.registerRepositories();
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
    static registerRepositories() {
        // Employee Repository
        tsyringe_1.container.registerSingleton('IEmployeeRepository', EmployeeRepository_1.EmployeeRepository);
        // User Repository
        tsyringe_1.container.registerSingleton('IUserRepository', UserRepository_1.UserRepository);
        // Broadcast Repository
        tsyringe_1.container.registerSingleton('IBroadcastRepository', BroadcastRepository_1.BroadcastRepository);
        // Call Repository - temporarily disabled
        // container.registerSingleton<ICallRepository>('ICallRepository', CallRepository);
        // Group Repository - temporarily disabled
        // container.registerSingleton<IGroupRepository>('IGroupRepository', GroupRepository);
        // Audio File Repository - temporarily disabled
        // container.registerSingleton<IAudioFileRepository>('IAudioFileRepository', AudioFileRepository);
        // Department Repository - temporarily disabled
        // container.registerSingleton<IDepartmentRepository>('IDepartmentRepository', DepartmentRepository);
        // District Repository
        tsyringe_1.container.registerSingleton('IDistrictRepository', DistrictRepository_1.DistrictRepository);
        // SIP Account Repository - temporarily disabled
        // container.registerSingleton<ISIPAccountRepository>('ISIPAccountRepository', SIPAccountRepository);
        console.log('✓ Repositories registered');
    }
    /**
     * Register Use Cases
     */
    static registerUseCases() {
        // Employee Use Cases
        tsyringe_1.container.registerSingleton(CreateEmployeeUseCase_1.CreateEmployeeUseCase);
        tsyringe_1.container.registerSingleton(GetEmployeeListUseCase_1.GetEmployeeListUseCase);
        tsyringe_1.container.registerSingleton(UpdateEmployeeUseCase_1.UpdateEmployeeUseCase);
        tsyringe_1.container.registerSingleton(DeleteEmployeeUseCase_1.DeleteEmployeeUseCase);
        // User Use Cases
        tsyringe_1.container.registerSingleton(LoginUserUseCase_1.LoginUserUseCase);
        tsyringe_1.container.registerSingleton(LogoutUserUseCase_1.LogoutUserUseCase);
        tsyringe_1.container.registerSingleton(GetUserProfileUseCase_1.GetUserProfileUseCase);
        // Broadcast Use Cases
        tsyringe_1.container.registerSingleton(StartBroadcastUseCase_1.StartBroadcastUseCase);
        tsyringe_1.container.registerSingleton(StopBroadcastUseCase_1.StopBroadcastUseCase);
        tsyringe_1.container.registerSingleton(GetBroadcastStatusUseCase_1.GetBroadcastStatusUseCase);
        tsyringe_1.container.registerSingleton(GetBroadcastListUseCase_1.GetBroadcastListUseCase);
        // Call Use Cases
        tsyringe_1.container.registerSingleton(CreateCallRecordUseCase_1.CreateCallRecordUseCase);
        tsyringe_1.container.registerSingleton(GetCallHistoryUseCase_1.GetCallHistoryUseCase);
        tsyringe_1.container.registerSingleton(UpdateCallStatusUseCase_1.UpdateCallStatusUseCase);
        // Group Use Cases
        tsyringe_1.container.registerSingleton(CreateGroupUseCase_1.CreateGroupUseCase);
        tsyringe_1.container.registerSingleton(UpdateGroupUseCase_1.UpdateGroupUseCase);
        tsyringe_1.container.registerSingleton(GetGroupListUseCase_1.GetGroupListUseCase);
        tsyringe_1.container.registerSingleton(DeleteGroupUseCase_1.DeleteGroupUseCase);
        // Audio File Use Cases
        tsyringe_1.container.registerSingleton(UploadAudioFileUseCase_1.UploadAudioFileUseCase);
        tsyringe_1.container.registerSingleton(GetAudioFileListUseCase_1.GetAudioFileListUseCase);
        tsyringe_1.container.registerSingleton(DeleteAudioFileUseCase_1.DeleteAudioFileUseCase);
        console.log('✓ Use Cases registered');
    }
    /**
     * Register Mappers
     */
    static registerMappers() {
        tsyringe_1.container.registerSingleton(EmployeeMapper_1.EmployeeMapper);
        tsyringe_1.container.registerSingleton(UserMapper_1.UserMapper);
        tsyringe_1.container.registerSingleton(BroadcastMapper_1.BroadcastMapper);
        tsyringe_1.container.registerSingleton(CallMapper_1.CallMapper);
        tsyringe_1.container.registerSingleton(GroupMapper_1.GroupMapper);
        tsyringe_1.container.registerSingleton(AudioFileMapper_1.AudioFileMapper);
        // container.registerSingleton(DepartmentMapper);
        // container.registerSingleton(DistrictMapper);
        // container.registerSingleton(SIPAccountMapper);
        console.log('✓ Mappers registered');
    }
    /**
     * Register Controllers
     */
    static registerControllers() {
        tsyringe_1.container.registerSingleton(EmployeeController_1.EmployeeController);
        tsyringe_1.container.registerSingleton(UserController_1.UserController);
        tsyringe_1.container.registerSingleton(BroadcastController_1.BroadcastController);
        tsyringe_1.container.registerSingleton(CallController_1.CallController);
        tsyringe_1.container.registerSingleton(GroupController_1.GroupController);
        tsyringe_1.container.registerSingleton(AudioFileController_1.AudioFileController);
        console.log('✓ Controllers registered');
    }
    /**
     * Register Middlewares
     */
    static registerMiddlewares() {
        tsyringe_1.container.registerSingleton(AuthMiddleware_1.AuthMiddleware);
        console.log('✓ Middlewares registered');
    }
    /**
     * Get container instance
     */
    static getContainer() {
        return tsyringe_1.container;
    }
    /**
     * Clear all registrations (useful for testing)
     */
    static clear() {
        tsyringe_1.container.clearInstances();
        console.log('✓ Container cleared');
    }
    /**
     * Validate container configuration
     */
    static validate() {
        try {
            // Try to resolve key dependencies to validate configuration
            tsyringe_1.container.resolve(CreateEmployeeUseCase_1.CreateEmployeeUseCase);
            tsyringe_1.container.resolve(LoginUserUseCase_1.LoginUserUseCase);
            tsyringe_1.container.resolve(StartBroadcastUseCase_1.StartBroadcastUseCase);
            tsyringe_1.container.resolve(EmployeeController_1.EmployeeController);
            tsyringe_1.container.resolve(UserController_1.UserController);
            console.log('✓ Container validation successful');
            return true;
        }
        catch (error) {
            console.error('✗ Container validation failed:', error);
            return false;
        }
    }
    /**
     * Display registered services info (for debugging)
     */
    static displayInfo() {
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
exports.DIContainer = DIContainer;
//# sourceMappingURL=DIContainer.js.map