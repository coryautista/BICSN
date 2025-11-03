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
      entidades: boolean[];
      idOrganica0?: string;
      idOrganica1?: string;
      idOrganica2?: string;
      idOrganica3?: string;
      jti: string;
      iat?: number;
      exp?: number;
    }
  }
}
// Fastify type declarations