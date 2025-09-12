/**
 * Main Router
 * Combines all route modules and provides API routing
 */
import { Router } from 'express';
export declare class APIRouter {
    private router;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    getRouter(): Router;
}
export default APIRouter;
//# sourceMappingURL=index.d.ts.map