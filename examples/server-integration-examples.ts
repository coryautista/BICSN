// Server Integration Examples - Error Boundaries
// This shows exactly how to integrate error boundaries into your existing server.ts

import Fastify from 'fastify';
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

// Import new error boundary system
import { 
  createGlobalErrorHandler, 
  withErrorBoundary, 
  withRetry, 
  RecoveryStrategies,
  createModuleErrorBoundary
} from './utils/errorBoundaries.js';
import { registerAllRoutes } from './app/routeRegistrar.js';

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
    contentSecurityPolicy: false,
    global: true
  });
  
  await app.register(cors, {
    credentials: true,
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://tu-front-dev.example',
      'http://187.233.212.215:4000',
      'http://187.233.212.215:3000',
      /^http:\/\/187\.233\.212\.215:\d+$/,
      /^http:\/\/localhost:\d+$/
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

  app.config = {
    cookie: {
      secure: env.cookie.secure,
      domain: env.cookie.domain
    }
  };

  return app;
}

async function setupApplication(app: Fastify) {
  // Database connections
  await connectDatabase();
  await connectFirebirdDatabase();

  // Health checks with error boundaries
  app.get('/health', 
    withErrorBoundary(async (req, reply) => {
      return performBasicHealthCheck();
    }, {
      module: 'health',
      action: 'basic-check'
    })
  );

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
  }, withRetry(async (req, reply) => {
    const healthData = await performDetailedHealthCheck();
    
    const statusCode = healthData.status === 'healthy' ? 200 : 
                       healthData.status === 'degraded' ? 200 : 503;
    
    return reply.code(statusCode).send(healthData);
  }, RecoveryStrategies.database, {
    module: 'health',
    action: 'detailed-check',
    maxRetries: 3
  }));

  app.get('/health/db', withRetry(async (req, reply) => {
    try {
      const ok = await ping();
      return reply.send({ ok });
    } catch (e: any) {
      throw new Error(`Database health check failed: ${e.message}`);
    }
  }, RecoveryStrategies.database, {
    module: 'health',
    action: 'db-check',
    maxRetries: 2
  }));

  // Route registration using the new registrar
  const routeRegistrar = createRouteRegistrar(app);
  await routeRegistrar.registerAllRoutes();

  // Replace basic error handler with enhanced error boundary
  app.setErrorHandler(createGlobalErrorHandler());

  return app;
}

export async function createServer() {
  try {
    const app = await buildApp();
    await setupApplication(app);
    return app;
  } catch (error) {
    console.error('Failed to create server:', error);
    throw error;
  }
}

export async function startServer() {
  const app = await createServer();
  await app.listen({ port: env.port, host: '0.0.0.0' });
  app.log.info(`API up on :${env.port}`);
}

// Example: Individual route with error boundary
export function setupExampleRoutes(app: Fastify) {
  
  // Simple route with error boundary
  app.get('/api/users', 
    withErrorBoundary(async (req, reply) => {
      // Your user service logic here
      return reply.send({ ok: true, data: [] });
    }, {
      module: 'users',
      action: 'get-all',
      includeRequest: true
    })
  );

  // Route with retry logic for database operations
  app.get('/api/users/:id',
    withRetry(async (req, reply) => {
      const { id } = req.params;
      // Database operation that might fail
      return reply.send({ ok: true, data: { id, name: 'User' } });
    }, RecoveryStrategies.database, {
      module: 'users',
      action: 'get-by-id',
      maxRetries: 3
    })
  );

  // Route with custom fallback
  app.get('/api/dashboard',
    withErrorBoundary(async (req, reply) => {
      const boundary = createModuleErrorBoundary('dashboard', 'get-stats', {
        fallback: async (error, context) => {
          // Return cached or default data when service fails
          return reply.send({
            ok: true,
            data: { 
              message: 'Dashboard data temporarily unavailable',
              cached: true,
              lastUpdated: new Date().toISOString()
            }
          });
        },
        retryable: true,
        maxRetries: 2
      })(req, reply, req.log);

      return boundary.execute(async () => {
        // Dashboard data logic here
        return reply.send({ ok: true, data: { users: 100, orders: 50 } });
      });
    })
  );
}

// Legacy server (if you want to compare)
export async function createLegacyServer() {
  const app = Fastify({ logger: { level: env.logLevel } });

  await app.register(requestLoggerPlugin);
  await app.register(loggerPlugin);
  await app.register(versioningPlugin);
  await app.register(fastifyAwilixPlugin, { container });
  await app.register(helmet, { global: true });
  await app.register(cors, { credentials: true });
  await app.register(cookie);

  // Basic health check (old way)
  app.get('/health', async () => {
    return performBasicHealthCheck();
  });

  // Legacy error handler (basic)
  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    reply.code(500).send({ ok: false, error: { code: 'INTERNAL', message: 'Unexpected error' } });
  });

  return app;
}