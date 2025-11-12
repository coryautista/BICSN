import { FastifyInstance } from 'fastify';
import { ReportesService } from './reportes.service.js';
import { ReportFiltersSchema } from './reportes.schemas.js';
import { handleReportsError } from './infrastructure/errorHandler.js';

const reportesService = new ReportesService();

export async function reportesRoutes(fastify: FastifyInstance) {
  // GET /reportes/mensual - Reporte mensual de personal con desglose por quincenas
  fastify.get('/mensual', async (request, reply) => {
    try {
      const filters = request.query as any;
      const userId = (request as any).user?.id;

      const reports = await reportesService.getMonthlyPersonnelReport(filters, userId);

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

      const movements = await reportesService.getPersonnelMovements(filters, userId);

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