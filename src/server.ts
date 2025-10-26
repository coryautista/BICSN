import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import requestLoggerPlugin from './plugins/requestLogger.js';
import loggerPlugin from './plugins/logger.js';
import { env } from './config/env.js';
import { connectDatabase, ping } from './db/mssql.js';
import { connectFirebirdDatabase } from './db/firebird.js';
import authRoutes from './modules/auth/auth.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import moduloRoutes from './modules/modulo/modulo.routes.js';
import procesoRoutes from './modules/proceso/proceso.routes.js';
import eventoCalendarioRoutes from './modules/eventoCalendario/eventoCalendario.routes.js';
import roleMenuRoutes from './modules/roleMenu/roleMenu.routes.js';
import infoRoutes from './modules/info/info.routes.js';
import auditLogRoutes from './modules/auditLog/auditLog.routes.js';
import organica0Routes from './modules/organica0/organica0.routes.js';
import organica2Routes from './modules/organica2/organica2.routes.js';
import organica3Routes from './modules/organica3/organica3.routes.js';
import logRoutes from './modules/log/log.routes.js';
import organica1Routes from './modules/organica1/organica1.routes.js';
import estadosRoutes from './modules/estados/estados.routes.js';
import municipiosRoutes from './modules/municipios/municipios.routes.js';
import ejeRoutes from './modules/tablero/eje/eje.routes.js';
import programaRoutes from './modules/tablero/programa/programa.routes.js';
import lineaEstrategicaRoutes from './modules/tablero/linea-estrategica/linea-estrategica.routes.js';
import indicadorRoutes from './modules/tablero/indicador/indicador.routes.js';
import dependenciaRoutes from './modules/tablero/dependencia/dependencia.routes.js';
import dimensionRoutes from './modules/tablero/dimension/dimension.routes.js';
import unidadMedidaRoutes from './modules/tablero/unidad-medida/unidad-medida.routes.js';
import indicadorAnualRoutes from './modules/tablero/indicador-anual/indicador-anual.routes.js';
import codigosPostalesRoutes from './modules/codigosPostales/codigosPostales.routes.js';
import coloniasRoutes from './modules/colonias/colonias.routes.js';
import callesRoutes from './modules/calles/calles.routes.js';
import tipoMovimientoRoutes from './modules/tipoMovimiento/tipoMovimiento.routes.js';
import afiliadoRoutes from './modules/afiliado/afiliado.routes.js';
import afiliadoOrgRoutes from './modules/afiliadoOrg/afiliadoOrg.routes.js';
import movimientoRoutes from './modules/movimiento/movimiento.routes.js';
import personalRoutes from './modules/personal/personal.routes.js';
import orgPersonalRoutes from './modules/orgPersonal/orgPersonal.routes.js';

async function buildApp() {
  const app = Fastify({ logger: { level: env.logLevel } });

  // plugins
  await app.register(requestLoggerPlugin);
  await app.register(loggerPlugin);
  await app.register(helmet);
  await app.register(cors, {
    credentials: true,
    origin: [
      'http://localhost:5173',          // Vite dev
      'http://localhost:3000',          // Next dev
      'https://tu-front-dev.example'    // front en https si aplica
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
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
  await app.register(menuRoutes, { prefix: '/v1' });
  await app.register(moduloRoutes, { prefix: '/v1' });
  await app.register(procesoRoutes, { prefix: '/v1' });
  await app.register(eventoCalendarioRoutes, { prefix: '/v1' });
  await app.register(roleMenuRoutes, { prefix: '/v1' });
  await app.register(infoRoutes, { prefix: '/v1' });
  await app.register(auditLogRoutes, { prefix: '/v1' });
  await app.register(organica0Routes, { prefix: '/v1' });
  await app.register(organica3Routes, { prefix: '/v1' });
  await app.register(logRoutes, { prefix: '/v1' });
  await app.register(organica2Routes, { prefix: '/v1' });
  await app.register(organica1Routes, { prefix: '/v1' });
  await app.register(estadosRoutes, { prefix: '/v1' });
  await app.register(municipiosRoutes, { prefix: '/v1' });
  await app.register(ejeRoutes, { prefix: '/v1' });
  await app.register(programaRoutes, { prefix: '/v1' });
  await app.register(lineaEstrategicaRoutes, { prefix: '/v1' });
  await app.register(indicadorRoutes, { prefix: '/v1' });
  await app.register(dependenciaRoutes, { prefix: '/v1' });
  await app.register(dimensionRoutes, { prefix: '/v1' });
  await app.register(unidadMedidaRoutes, { prefix: '/v1' });
  await app.register(indicadorAnualRoutes, { prefix: '/v1' });
  await app.register(codigosPostalesRoutes, { prefix: '/v1' });
  await app.register(coloniasRoutes, { prefix: '/v1' });
  await app.register(callesRoutes, { prefix: '/v1' });
  await app.register(tipoMovimientoRoutes, { prefix: '/v1' });
  await app.register(afiliadoRoutes, { prefix: '/v1' });
  await app.register(afiliadoOrgRoutes, { prefix: '/v1' });
  await app.register(movimientoRoutes, { prefix: '/v1' });
  await app.register(personalRoutes, { prefix: '/v1' });
  await app.register(orgPersonalRoutes, { prefix: '/v1' });
  
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
    await connectFirebirdDatabase(); // conecta a Firebird
    const app = await buildApp();
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`API up on :${env.port}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
})();
