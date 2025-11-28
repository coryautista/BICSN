import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { handleAfiliadosReportesError } from './infrastructure/errorHandler.js';
import {
  HistorialMovimientosQuinParamsSchema,
  HistorialMovPromedioSdoParamsSchema
} from './afiliados.schemas.js';
import { GetHistorialMovimientosQuinQuery } from './application/queries/GetHistorialMovimientosQuinQuery.js';
import { GetHistorialMovPromedioSdoQuery } from './application/queries/GetHistorialMovPromedioSdoQuery.js';

export async function afiliadosReportesRoutes(fastify: FastifyInstance) {
  // GET /reportes/afiliados/historial-movimientos-quin - HISTORIAL_MOVIMIENTOS_QUIN
  fastify.get('/historial-movimientos-quin', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene historial de movimientos quincenales ejecutando el stored procedure HISTORIAL_MOVIMIENTOS_QUIN',
      summary: 'Historial Movimientos Quincenales',
      tags: ['reportes', 'afiliados'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          }
        },
        required: ['periodo']
      },
      response: {
        200: {
          description: 'Historial obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
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
      const parsed = HistorialMovimientosQuinParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.errors,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { periodo } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetHistorialMovimientosQuinQuery>('getHistorialMovimientosQuinQuery');
      const historiales = await query.execute(periodo, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: historiales,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAfiliadosReportesError(error, reply);
    }
  });

  // GET /reportes/afiliados/historial-mov-promedio-sdo - HISTORIAL_MOV_PROMEDIO_SDO
  fastify.get('/historial-mov-promedio-sdo', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Obtiene historial de movimientos con promedio de sueldo ejecutando el stored procedure HISTORIAL_MOV_PROMEDIO_SDO',
      summary: 'Historial Mov Promedio Sueldo',
      tags: ['reportes', 'afiliados'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            description: 'Período en formato específico (ej: "2125")'
          },
          pOrg0: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 0 (2 caracteres, ej: "01")'
          },
          pOrg1: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 1 (2 caracteres, ej: "01")'
          },
          pOrg2: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 2 (2 caracteres, ej: "01")'
          },
          pOrg3: {
            type: 'string',
            pattern: '^[0-9]{2}$',
            description: 'Clave orgánica nivel 3 (2 caracteres, ej: "01")'
          }
        },
        required: ['periodo', 'pOrg0', 'pOrg1', 'pOrg2', 'pOrg3']
      },
      response: {
        200: {
          description: 'Historial obtenido exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
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
      const parsed = HistorialMovPromedioSdoParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.errors,
            timestamp: new Date().toISOString()
          }
        });
      }

      const { periodo, pOrg0, pOrg1, pOrg2, pOrg3 } = parsed.data;
      const userId = (request as any).user?.sub;

      const query = request.diScope.resolve<GetHistorialMovPromedioSdoQuery>('getHistorialMovPromedioSdoQuery');
      const promedios = await query.execute(periodo, pOrg0, pOrg1, pOrg2, pOrg3, userId);

      // SERIALIZACIÓN INMEDIATA Y MANUAL para evitar pérdida de datos
      const responseObject = {
        success: true,
        data: promedios,
        timestamp: new Date().toISOString()
      };

      const responseJson = JSON.stringify(responseObject);

      reply.raw.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(responseJson, 'utf8')
      });

      reply.raw.end(responseJson);
    } catch (error) {
      return handleAfiliadosReportesError(error, reply);
    }
  });
}

