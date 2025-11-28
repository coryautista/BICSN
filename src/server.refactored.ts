import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { fastifyAwilixPlugin } from '@fastify/awilix';
import requestLoggerPlugin from './plugins/requestLogger.js';
import loggerPlugin from './plugins/logger.js';
import versioningPlugin from './plugins/versioning.js';
import { container } from './di/container.js';
import { env } from './config/env.js';
import { connectDatabase, ping } from './db/mssql.js';
import { connectFirebirdDatabase } from './db/firebird.js';
import { performDetailedHealthCheck, performBasicHealthCheck } from './utils/health.js';
import { createRouteRegistrar } from './app/routeRegistrar.js';

async function buildApp() {
  const app = Fastify({ logger: { level: env.logLevel } });

  // plugins
  await app.register(requestLoggerPlugin);
  await app.register(loggerPlugin);
  await app.register(versioningPlugin);
  
  // Register Awilix DI Container (MUST be before routes)
  await app.register(fastifyAwilixPlugin, { 
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
    container 
  });
  
  await app.register(helmet, {
    contentSecurityPolicy: false,  // Deshabilitado para permitir Swagger UI
    global: true
  });
  
  await app.register(cors, {
    credentials: true,
    origin: [
      'http://localhost:5173',          // Vite dev
      'http://localhost:3000',          // Next dev
      'https://tu-front-dev.example',   // front en https si aplica
      'http://187.233.212.215:4000',    // IP externa para docs
      'http://187.233.212.215:3000',    // IP externa para frontend
      /^http:\/\/187\.233\.212\.215:\d+$/, // Regex para cualquier puerto en esa IP
      /^http:\/\/localhost:\d+$/        // localhost con cualquier puerto
    ],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept-Version'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  
  await app.register(cookie);

  // Swagger
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'API BICSN',
        description: 'API para la aplicación BICSN',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:4000/v1',
          description: 'Servidor de desarrollo'
        },
        {
          url: 'http://187.233.212.215:4000/v1',
          description: 'Servidor de producción'
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
    staticCSP: false,
    transformStaticCSP: (header) => header,
    baseDir: undefined
  });

// Extend FastifyInstance with custom config interface
  (app as any).config = {
    cookie: {
      secure: env.cookie.secure,
      domain: env.cookie.domain
    }
  };

  return app;
}

async function setupApplication(app: FastifyInstance) {
  // Database connections
  await connectDatabase();
  await connectFirebirdDatabase();

  // Health checks
  app.get('/health', async () => {
    return performBasicHealthCheck();
  });

  app.get('/health/detailed', {
    schema: {
      description: 'Verificación de salud detallada con todos los componentes del sistema',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  responseTime: { type: 'number' },
                  message: { type: 'string' },
                  details: { type: 'object' }
                }
              }
            },
            system: {
              type: 'object',
              properties: {
                memory: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    free: { type: 'number' },
                    used: { type: 'number' },
                    usagePercent: { type: 'number' }
                  }
                },
                cpu: {
                  type: 'object',
                  properties: {
                    loadAverage: {
                      type: 'array',
                      items: { type: 'number' }
                    }
                  }
                },
                process: {
                  type: 'object',
                  properties: {
                    pid: { type: 'number' },
                    uptime: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  responseTime: { type: 'number' },
                  message: { type: 'string' },
                  details: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  }, async (_req: any, reply: any) => {
    const healthData = await performDetailedHealthCheck();
    
    // Set appropriate HTTP status code based on health
    const statusCode = healthData.status === 'healthy' ? 200 : 
                       healthData.status === 'degraded' ? 200 : 503;
    
    return reply.code(statusCode).send(healthData);
  });

  app.get('/health/db', async (_req: any, reply: any) => {
    try {
      const ok = await ping();
      return reply.send({ ok });
    } catch (e: any) {
      app.log.error(e);
      return reply.code(500).send({ ok: false, error: e.message });
    }
  });

  // Route registration using the new registrar
  const routeRegistrar = createRouteRegistrar(app);
  await routeRegistrar.registerAllRoutes();

  // error handler
  app.setErrorHandler((err: any, _req: any, reply: any) => {
    app.log.error(err);
    reply.code(500).send({ ok: false, error: { code: 'INTERNAL', message: 'Unexpected error' } });
  });

  return app;
}

(async () => {
  try {
    const app = await buildApp();
    await setupApplication(app);
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`API up on :${env.port}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
})();