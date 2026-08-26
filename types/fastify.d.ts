import 'fastify';
import type { AuthenticatedUser } from '../src/modules/auth/domain/policies/OrganicaScopePolicy.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      cookie: {
        secure: boolean;
        domain: string;
      }
    }
  }

  interface FastifyRequest {
    user?: AuthenticatedUser;
    diScope?: {
      resolve<T>(name: string): T;
    };
  }
}
// Fastify type declarations
