import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { handleCAIRError } from './infrastructure/errorHandler.js';
import {
  EstadoCuentaCAIRParamsSchema,
  CAIREntregadoParamsSchema
} from './CAIR.schemas.js';
import { GetEstadoCuentaCAIRQuery } from './application/queries/GetEstadoCuentaCAIRQuery.js';
import { GetCAIREntregadoQuery } from './application/queries/GetCAIREntregadoQuery.js';

export async function CAIRRoutes(fastify: FastifyInstance) {
  // GET /reportes/cair/estado-cuenta - SAR_TOTAL_A_ORG
  fastify.get('/estado-cuenta', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene el estado de cuenta del C.A.I.R ejecutando el stored procedure SAR_TOTAL_A_ORG',
      summary: 'Estado de Cuenta CAIR',
      tags: ['reportes', 'cair'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          quincena: {
            type: 'string',
            description: 'Quincena en formato específico (ej: "2125")'
          }
        },
        required: ['quincena']
      },
      response: {
        200: {
          description: 'Estado de cuenta obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = EstadoCuentaCAIRParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { quincena } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetEstadoCuentaCAIRQuery>('getEstadoCuentaCAIRQuery');
      const estados = await query.execute(quincena, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: estados,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleCAIRError(error, reply);
    }
  });

  // GET /reportes/cair/entregado - SAR_DEVOLUCION_REPORTE
  fastify.get('/entregado', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene C.A.I.R. Entregado - Totales por tipo ejecutando el stored procedure SAR_DEVOLUCION_REPORTE',
      summary: 'CAIR Entregado',
      tags: ['reportes', 'cair'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          fi: {
            type: 'string',
            description: 'Fecha inicial en formato específico'
          },
          ff: {
            type: 'string',
            description: 'Fecha final en formato específico'
          },
          tipo: {
            type: 'string',
            description: 'Tipo de reporte'
          }
        },
        required: ['fi', 'ff', 'tipo']
      },
      response: {
        200: {
          description: 'CAIR entregado obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = CAIREntregadoParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { fi, ff, tipo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetCAIREntregadoQuery>('getCAIREntregadoQuery');
      const entregados = await query.execute(fi, ff, tipo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: entregados,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleCAIRError(error, reply);
    }
  });
}

