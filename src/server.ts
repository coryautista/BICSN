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

// Función para traducir mensajes de validación al español
function translateValidationMessage(message: string): string {
  const translations: Record<string, string> = {
    'must NOT have more than': 'no debe tener más de',
    'must NOT have fewer than': 'no debe tener menos de',
    'must be equal to': 'debe ser igual a',
    'must match': 'debe coincidir con',
    'must be': 'debe ser',
    'must be a': 'debe ser un',
    'must be an': 'debe ser un',
    'must be a string': 'debe ser una cadena de texto',
    'must be a number': 'debe ser un número',
    'must be an integer': 'debe ser un número entero',
    'must be a boolean': 'debe ser un valor booleano',
    'must be an array': 'debe ser un arreglo',
    'must be an object': 'debe ser un objeto',
    'must be required': 'es requerido',
    'must be optional': 'es opcional',
    'must be one of': 'debe ser uno de',
    'must be a valid date': 'debe ser una fecha válida',
    'must be a valid email': 'debe ser un correo electrónico válido',
    'must be a valid URL': 'debe ser una URL válida',
    'must be a valid UUID': 'debe ser un UUID válido',
    'characters': 'caracteres',
    'items': 'elementos',
    'properties': 'propiedades'
  };

  let translated = message;
  for (const [key, value] of Object.entries(translations)) {
    translated = translated.replace(new RegExp(key, 'gi'), value);
  }
  
  return translated;
}

async function buildApp() {
  const app = Fastify({ 
    logger: { level: env.logLevel },
    connectionTimeout: 120000, // 2 minutos para conexiones largas (upload de archivos)
    requestTimeout: 120000, // 2 minutos para requests largos
    schemaErrorFormatter: (errors, dataVar) => {
      // Formatear errores de validación de esquema
      const validationMessages = errors.map((error) => {
        const field = error.instancePath?.replace('/', '') || error.params?.missingProperty || 'campo desconocido';
        const originalMessage = error.message || 'Valor inválido';
        const message = translateValidationMessage(originalMessage);
        return `${field}: ${message}`;
      });
      
      const errorMessage = validationMessages.length === 1 
        ? validationMessages[0]
        : `Errores de validación: ${validationMessages.join(', ')}`;
      
      return new Error(errorMessage);
    }
  });

  // plugins
  await app.register(requestLoggerPlugin);
  await app.register(loggerPlugin);
  await app.register(versioningPlugin);
  
  // Plugin para limpiar mojibake automáticamente de todas las respuestas
  const mojibakeCleanerPlugin = (await import('./plugins/mojibakeCleaner.js')).default;
  await app.register(mojibakeCleanerPlugin);
  
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
      'http://10.20.1.90:3000', 
      'http://187.233.247.69:3000', 
      'http://187.233.247.69:4000',       // IP interna frontend
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
          url: 'http://187.233.247.69:4000/v1',
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
  // error handler - debe estar antes de registrar rutas
  app.setErrorHandler((err: any, req: any, reply: any) => {
    app.log.error(err);
    
    // Handle Fastify validation errors
    if (err.validation || err.code === 'FST_ERR_VALIDATION') {
      // Formatear mensajes de validación más descriptivos en español
      const validationMessages = (err.validation || []).map((v: any) => {
        const field = v.instancePath?.replace('/', '') || v.params?.missingProperty || 'campo desconocido';
        const originalMessage = v.message || 'Valor inválido';
        const message = translateValidationMessage(originalMessage);
        return `${field}: ${message}`;
      });
      
      const errorMessage = validationMessages.length === 1 
        ? validationMessages[0]
        : (validationMessages.length > 0 
          ? `Errores de validación: ${validationMessages.join(', ')}`
          : translateValidationMessage(err.message) || 'Error de validación en los datos proporcionados');
      
      return reply.code(err.statusCode || 400).send({
        ok: false,
        error: {
          code: err.code || 'VALIDATION_ERROR',
          message: errorMessage,
          details: err.validation || []
        }
      });
    }
    
    // Handle other errors
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Error interno del servidor';
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    
    return reply.code(statusCode).send({
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  });

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

  return app;
}

(async () => {
  try {
    const app = await buildApp();
    await setupApplication(app);
    // Asegurar que el servidor escuche en todas las interfaces para permitir acceso externo
    const listenHost = env.host === 'localhost' || env.host === '127.0.0.1' ? '0.0.0.0' : env.host;
    await app.listen({ port: env.port, host: listenHost });
    app.log.info(`API up on :${env.port} (host: ${listenHost})`);
    app.log.info(`Swagger UI disponible en: http://${listenHost === '0.0.0.0' ? 'localhost' : listenHost}:${env.port}/docs`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
})();
