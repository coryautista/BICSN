// Simple Auth Controller Examples
// This file shows how to use error boundaries in practice

import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  withErrorBoundary, 
  withRetry, 
  RecoveryStrategies,
  createModuleErrorBoundary 
} from '../../utils/errorBoundaries.js';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';

export class AuthController {
  constructor(private authService: any) {}

  // Example 1: Simple error boundary wrapper
  async login(req: FastifyRequest, reply: FastifyReply) {
    const boundary = createModuleErrorBoundary('auth', 'login')(req, reply, req.log);
    
    return boundary.execute(async () => {
      const { username, password } = req.body as { username: string; password: string };
      
      if (!username || !password) {
        throw new ValidationError('Username and password are required');
      }

      const result = await this.authService.authenticate(username, password);
      return reply.send({ ok: true, data: result });
    });
  }

  // Example 2: Using decorator pattern
  async getUserProfile = withErrorBoundary(async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).user?.sub;
    
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const user = await this.authService.getUserById(userId);
    return reply.send({ ok: true, data: user });
  }, {
    module: 'auth',
    action: 'get-profile',
    includeRequest: true
  });

  // Example 3: With retry logic for database operations
  async refreshToken = withRetry(
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { refreshToken } = req.body as { refreshToken: string };
      
      const newTokens = await this.authService.refreshTokens(refreshToken);
      return reply.send({ ok: true, data: newTokens });
    },
    RecoveryStrategies.database, // Retry on database errors
    {
      module: 'auth',
      action: 'refresh-token',
      maxRetries: 3
    }
  );

  // Example 4: With custom fallback
  async getDashboardData(req: FastifyRequest, reply: FastifyReply) {
    const boundary = createModuleErrorBoundary('auth', 'dashboard-data', {
      fallback: async (error, context) => {
        // Return cached data as fallback
        req.log.warn('Using fallback for dashboard data', { error: error.message });
        return reply.send({
          ok: true,
          data: { message: 'Dashboard data temporarily unavailable', cached: true }
        });
      },
      retryable: true,
      maxRetries: 2
    })(req, reply, req.log);

    return boundary.execute(async () => {
      const userId = (req as any).user?.sub;
      const data = await this.authService.getDashboardData(userId);
      return reply.send({ ok: true, data });
    });
  }
}

// Route registration examples
export async function registerAuthRoutes(app: any) {
  const controller = new AuthController(app.container?.resolve('authService'));

  // Apply error boundaries to routes
  app.post('/login', controller.login.bind(controller));
  app.get('/profile', controller.getUserProfile.bind(controller));
  app.post('/refresh', controller.refreshToken.bind(controller));
  app.get('/dashboard', controller.getDashboardData.bind(controller));
}