import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { handleCAIRError } from './infrastructure/errorHandler.js';
import {
  SARDevolucionParamsSchema,
  DevueltoTiposResponseSchema,
  ChequesLeyendasResponseSchema,
  SARDevolucionResponseSchema
} from './CAIR.schemas.js';
import { GetDevueltoTiposQuery } from './application/queries/GetDevueltoTiposQuery.js';
import { GetChequesLeyendasQuery } from './application/queries/GetChequesLeyendasQuery.js';
import { GetSARDevolucionQuery } from './application/queries/GetSARDevolucionQuery.js';

export default async function CAIRRoutes(app: FastifyInstance) {
  // GET /cair/tipos-devolucion - Obtener tipos de devolución
  app.get('/cair/tipos-devolucion', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener todos los tipos de devolución desde SAR_DEVUELTO_TIPOS',
      summary: 'Tipos de Devolución',
      tags: ['cair', 'firebird'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Tipos de devolución obtenidos exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tipo: { type: 'string' },
                  descripcion: { type: 'string' },
                  generaCheque: { type: 'string' },
                  status: { type: 'string' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetDevueltoTiposQuery>('getDevueltoTiposQuery');
      const tipos = await query.execute(userId);

      return reply.send({
        success: true,
        data: tipos,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleCAIRError(error, reply);
    }
  });

  // GET /cair/leyendas-cheques - Obtener leyendas de cheques activas
  app.get('/cair/leyendas-cheques', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener leyendas de cheques activas desde CHEQUES_LEYENDAS_CAT',
      summary: 'Leyendas de Cheques',
      tags: ['cair', 'firebird'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Leyendas de cheques obtenidas exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cveLeyenda: { type: 'string' },
                  leyenda: { type: 'string' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetChequesLeyendasQuery>('getChequesLeyendasQuery');
      const leyendas = await query.execute(userId);

      return reply.send({
        success: true,
        data: leyendas,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleCAIRError(error, reply);
    }
  });

  // GET /cair/sar-devolucion - Obtener devolución SAR
  app.get('/cair/sar-devolucion', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Obtener devolución SAR ejecutando el stored procedure SAR_DEVOLUCION',
      summary: 'SAR Devolución',
      tags: ['cair', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['interno', 'tipo'],
        properties: {
          interno: {
            type: 'string',
            description: 'Número interno del afiliado',
            minLength: 1,
            maxLength: 50
          },
          tipo: {
            type: 'string',
            description: 'Tipo de devolución',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          description: 'Devolución SAR obtenida exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  noAporta: { type: 'number' },
                  aportacion: { type: 'number' },
                  aportacionInteres: { type: 'number' },
                  voluntario: { type: 'number' },
                  voluntarioInteres: { type: 'number' },
                  recuperado: { type: 'number' },
                  interes: { type: 'number' },
                  total: { type: 'number' },
                  error: { type: 'string' },
                  nerror: { type: 'string' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = SARDevolucionParamsSchema.safeParse(request.query);
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

      const { interno, tipo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetSARDevolucionQuery>('getSARDevolucionQuery');
      const devoluciones = await query.execute(interno, tipo, userId);

      return reply.send({
        success: true,
        data: devoluciones,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleCAIRError(error, reply);
    }
  });
}

