/**
 * Dependency Injection Container Configuration
 * Sets up all dependencies for Clean Architecture layers
 */
import 'reflect-metadata';
export declare class DIContainer {
    /**
     * Configure all dependencies
     */
    static configure(): void;
    /**
     * Register Repository implementations with their interfaces
     */
    private static registerRepositories;
    /**
     * Register Use Cases
     */
    private static registerUseCases;
    /**
     * Register Mappers
     */
    private static registerMappers;
    /**
     * Register Controllers
     */
    private static registerControllers;
    /**
     * Register Middlewares
     */
    private static registerMiddlewares;
    /**
     * Get container instance
     */
    static getContainer(): import("tsyringe").DependencyContainer;
    /**
     * Clear all registrations (useful for testing)
     */
    static clear(): void;
    /**
     * Validate container configuration
     */
    static validate(): boolean;
    /**
     * Display registered services info (for debugging)
     */
    static displayInfo(): void;
}
//# sourceMappingURL=DIContainer.d.ts.map