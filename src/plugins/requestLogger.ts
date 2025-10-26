import fp from 'fastify-plugin';
import { errorLogger } from '../utils/errorLogger.js';

export default fp(async (app) => {
  // Log all incoming requests
  app.addHook('onRequest', async (req, reply) => {
    // Store request start time for response time calculation
    (req as any).startTime = Date.now();

    // Log request details
    errorLogger.logInfo(`Request: ${req.method} ${req.url}`, req, {
      body: req.body,
      query: req.query,
      params: req.params
    });
  });

  // Log responses
  app.addHook('onResponse', async (req, reply) => {
    const responseTime = Date.now() - (req as any).startTime;

    // Log successful responses
    if (reply.statusCode >= 200 && reply.statusCode < 400) {
      errorLogger.logInfo(`Response: ${reply.statusCode} ${req.method} ${req.url}`, req, {
        statusCode: reply.statusCode,
        responseTime
      });
    }
    // Log client errors (4xx)
    else if (reply.statusCode >= 400 && reply.statusCode < 500) {
      errorLogger.logWarning(`Client Error: ${reply.statusCode} ${req.method} ${req.url}`, req, {
        statusCode: reply.statusCode,
        responseTime
      });
    }
    // Log server errors (5xx) - these will also be logged by onError hook
    else if (reply.statusCode >= 500) {
      errorLogger.logError(new Error(`Server Error: ${reply.statusCode} ${req.method} ${req.url}`), req, reply);
    }
  });

  // Enhanced error logging
  app.addHook('onError', async (req, reply, error) => {
    errorLogger.logRequestError(req, error, reply.statusCode);
  });

  // Log when server is ready
  app.addHook('onReady', async () => {
    errorLogger.logInfo('Server started and ready to accept connections');
  });

  // Log when server is closing
  app.addHook('onClose', async () => {
    errorLogger.logInfo('Server is shutting down');
  });
});