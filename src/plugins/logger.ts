import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import pino from 'pino';
import { config } from '../config/env';

const loggerPlugin = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> => {
  const logger = pino({
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
  });

  fastify.decorate('logger', logger);
};

export default fp(loggerPlugin);
