import { FastifyInstance } from 'fastify';
import { GetMonthlyPersonnelReportQuery } from './application/queries/GetMonthlyPersonnelReportQuery.js';
import { GetPersonnelMovementsQuery } from './application/queries/GetPersonnelMovementsQuery.js';
import { handleReportsError } from './infrastructure/errorHandler.js';
import { aplicacionesQNARoutes } from './aplicacionesQNA/aplicacionesQNA.routes.js';
import { CAIRRoutes } from './CAIR/CAIR.routes.js';
import { afiliadosReportesRoutes } from './afiliados/afiliados.routes.js';

export async function reportesRoutes(fastify: FastifyInstance) {
  // Registrar submódulo aplicacionesQNA
  await fastify.register(aplicacionesQNARoutes, { prefix: '/aplicaciones-qna' });
  
  // Registrar submódulo CAIR
  await fastify.register(CAIRRoutes, { prefix: '/cair' });
  
  // Registrar submódulo Afiliados
  await fastify.register(afiliadosReportesRoutes, { prefix: '/afiliados' });
  
  // GET /reportes/mensual - Reporte mensual de personal con desglose por quincenas
  fastify.get('/mensual', async (request, reply) => {
    try {
      const filters = request.query as any;
      const userId = (request as any).user?.id;

      const getMonthlyReportQuery = request.diScope.resolve<GetMonthlyPersonnelReportQuery>('getMonthlyPersonnelReportQuery');
      const reports = await getMonthlyReportQuery.execute(filters, userId);

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
  fastify.get('/movimientos', async (request, reply) => {
    try {
      const filters = request.query as any;
      const userId = (request as any).user?.id;

      const getPersonnelMovementsQuery = request.diScope.resolve<GetPersonnelMovementsQuery>('getPersonnelMovementsQuery');
      const movements = await getPersonnelMovementsQuery.execute(filters, userId);

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