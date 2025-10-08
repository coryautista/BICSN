import Fastify from 'fastify';
import helmet from 'fastify-helmet';
import cors from 'fastify-cors';
import { config } from './config/env';
import { connectDatabase, closeDatabaseConnection } from './db/mssql';

const buildServer = () => {
  const server = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  server.register(helmet);
  server.register(cors);

  // Health check route
  server.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Root route
  server.get('/', async (_request, _reply) => {
    return { message: 'BICSN API Server' };
  });

  return server;
};

const start = async () => {
  const server = buildServer();

  try {
    // Connect to database
    await connectDatabase();
    server.log.info('Database connected successfully');

    // Start server
    await server.listen({ port: config.PORT, host: config.HOST });
    server.log.info(`Server listening on ${config.HOST}:${config.PORT}`);
  } catch (error) {
    server.log.error(error);
    await closeDatabaseConnection();
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}, closing server...`);
      await server.close();
      await closeDatabaseConnection();
      process.exit(0);
    });
  });
};

// Only start the server if this file is executed directly
if (require.main === module) {
  start();
}

export { buildServer, start };
