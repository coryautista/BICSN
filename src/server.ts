import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import loggerPlugin from './plugins/logger.js';
import { env } from './config/env.js';
import { connectDatabase, ping } from './db/mssql.js';
import authRoutes from './modules/auth/auth.routes.js';
import roleRoutes from './modules/role/role.routes.js';

// después de plugins y antes del error handler:



async function buildApp() {
  const app = Fastify({ logger: { level: env.logLevel } });

  // plugins
  await app.register(loggerPlugin);
  await app.register(helmet);
  await app.register(cors, {
    origin: (_origin, cb) => cb(null, true), // ajusta whitelist después
    credentials: true
  });
  await app.register(cookie);

  // Swagger
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'BICSN API',
        description: 'API for BICSN application',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:4000/v1',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  app.config = {
    cookie: {
      secure: env.cookie.secure,
      domain: env.cookie.domain
    }
  };

  await app.register(authRoutes, { prefix: '/v1' });
  await app.register(roleRoutes, { prefix: '/v1' });
  
  // health checks
  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));
  app.get('/health/db', async (_req, reply) => {
    try {
      const ok = await ping();
      return reply.send({ ok });
    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ ok: false, error: e.message });
    }
  });

  // error handler
  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.code(500).send({ ok: false, error: { code: 'INTERNAL', message: 'Unexpected error' } });
  });

  return app;
}

(async () => {
  try {
    await connectDatabase();       // abre el pool antes de escuchar
    const app = await buildApp();
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`API up on :${env.port}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
})();
