import fp from 'fastify-plugin';
import pino from 'pino';
import { env } from '../config/env.js';

export default fp(async (app) => {
  app.log = pino({ level: env.logLevel });
});
