import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { GetAuditLogsSchema } from './auditLog.schemas.js';
import { getAuditLogs } from './auditLog.service.js';
import { fail } from '../../utils/http.js';

export default async function auditLogRoutes(app: FastifyInstance) {

  // Obtener logs de auditoría por rango de fechas (requiere admin)
  app.get('/audit-logs', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Get audit logs by date range',
      tags: ['audit-logs'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['fechaInicio', 'fechaFin'],
        properties: {
          fechaInicio: { type: 'string', format: 'date-time' },
          fechaFin: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  entidad: { type: 'string' },
                  entidadId: { type: 'string' },
                  accion: { type: 'string' },
                  datosAntes: { type: ['string', 'null'] },
                  datosDespues: { type: ['string', 'null'] },
                  fecha: { type: 'string', format: 'date-time' },
                  userId: { type: ['string', 'null'] },
                  userName: { type: ['string', 'null'] },
                  appName: { type: 'string' },
                  ip: { type: 'string' },
                  userAgent: { type: 'string' },
                  requestId: { type: 'string' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const parsed = GetAuditLogsSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send(fail(parsed.error.message));

    try {
      const logs = await getAuditLogs(parsed.data.fechaInicio, parsed.data.fechaFin);
      return reply.send({ data: logs });
    } catch (e: any) {
      return reply.code(500).send(fail('AUDIT_LOG_FETCH_FAILED'));
    }
  });
}