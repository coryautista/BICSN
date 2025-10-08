import 'fastify';

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
    user?: {
      sub: string;
      roles: string[];
      jti: string;
      iat?: number;
      exp?: number;
    }
  }
}
// Fastify type declarations