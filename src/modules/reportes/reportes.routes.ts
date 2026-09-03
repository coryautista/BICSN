import { FastifyInstance } from 'fastify';
import { GetMonthlyPersonnelReportQuery } from './application/queries/GetMonthlyPersonnelReportQuery.js';
import { GetPersonnelMovementsQuery } from './application/queries/GetPersonnelMovementsQuery.js';
import { handleReportsError } from './infrastructure/errorHandler.js';
import { aplicacionesQNARoutes } from './aplicacionesQNA/aplicacionesQNA.routes.js';
import { CAIRRoutes } from './CAIR/CAIR.routes.js';
import { afiliadosReportesRoutes } from './afiliados/afiliados.routes.js';
import { estadoCuentaAhorroRoutes } from './estadoCuentaAhorro/estadoCuentaAhorro.routes.js';
import { revisionRoutes } from './revision/revision.routes.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { resolveOrganicaScope } from '../auth/domain/policies/OrganicaScopePolicy.js';

export async function reportesRoutes(fastify: FastifyInstance) {
  // Registrar submódulo aplicacionesQNA
  await fastify.register(aplicacionesQNARoutes, { prefix: '/aplicaciones-qna' });
  
  // Registrar submódulo CAIR
  await fastify.register(CAIRRoutes, { prefix: '/cair' });
  
  // Registrar submódulo Afiliados
  await fastify.register(afiliadosReportesRoutes, { prefix: '/afiliados' });

  await fastify.register(estadoCuentaAhorroRoutes, { prefix: '/estado-cuenta-ahorro' });
  await fastify.register(revisionRoutes, { prefix: '/revision' });
  
  // GET /reportes/mensual - Reporte mensual de personal con desglose por quincenas
  fastify.get('/mensual', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const filters = request.query as any;
      const user = (request as any).user;
      const resolvedScope = resolveOrganicaScope(user, filters, 2);
      const scope = { org0: resolvedScope.organica0, org1: resolvedScope.organica1 };
      const userId = user?.sub;

      const getMonthlyReportQuery = request.diScope.resolve<GetMonthlyPersonnelReportQuery>('getMonthlyPersonnelReportQuery');
      const reports = await getMonthlyReportQuery.execute(filters, scope, userId);

      return {
        success: true,
        data: reports,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return handleReportsError(error, reply);
    }
  });

  // GET /reportes/movimientos - Lista detallada de movimientos de personal
  fastify.get('/movimientos', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const filters = request.query as any;
      const user = (request as any).user;
      const resolvedScope = resolveOrganicaScope(user, filters, 2);
      const scope = { org0: resolvedScope.organica0, org1: resolvedScope.organica1 };
      const userId = user?.sub;

      const getPersonnelMovementsQuery = request.diScope.resolve<GetPersonnelMovementsQuery>('getPersonnelMovementsQuery');
      const movements = await getPersonnelMovementsQuery.execute(filters, scope, userId);

      return {
        success: true,
        data: movements,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return handleReportsError(error, reply);
    }
  });
}
