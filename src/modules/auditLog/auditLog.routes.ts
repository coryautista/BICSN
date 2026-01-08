import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { GetAuditLogsSchema } from './auditLog.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import type { GetAuditLogsByDateRangeQuery } from './application/queries/GetAuditLogsByDateRangeQuery.js';
import { handleAuditLogError } from './infrastructure/errorHandler.js';
import { AuditLogAccessDeniedError } from './domain/errors.js';

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
          fechaInicio: { type: 'string', format: 'date' },
          fechaFin: { type: 'string', format: 'date' }
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
    try {
      // Validar permisos de administrador
      const user = req.user;
      if (!user || !user.roles || !user.roles.includes('admin')) {
        throw new AuditLogAccessDeniedError('Acceso denegado a logs de auditoría', { userId: user?.sub, userRoles: user?.roles });
      }

      // #region agent log
      const queryParams = req.query as { fechaInicio?: string; fechaFin?: string };
      fetch('http://127.0.0.1:7242/ingest/2454688e-9650-418e-b8e5-aaa5bbb75080',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auditLog.routes.ts:89',message:'Query params recibidos',data:{query:queryParams,fechaInicio:queryParams.fechaInicio,fechaFin:queryParams.fechaFin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const parsed = GetAuditLogsSchema.safeParse(req.query);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2454688e-9650-418e-b8e5-aaa5bbb75080',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auditLog.routes.ts:91',message:'Resultado de validación Zod',data:{success:parsed.success,errors:parsed.success?null:parsed.error.issues,parsedData:parsed.success?parsed.data:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      const getAuditLogsByDateRangeQuery = req.diScope.resolve<GetAuditLogsByDateRangeQuery>('getAuditLogsByDateRangeQuery');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2454688e-9650-418e-b8e5-aaa5bbb75080',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auditLog.routes.ts:97',message:'Datos antes de ejecutar query',data:{fechaInicio:parsed.data.fechaInicio,fechaFin:parsed.data.fechaFin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const logs = await getAuditLogsByDateRangeQuery.execute({
        fechaInicio: parsed.data.fechaInicio,
        fechaFin: parsed.data.fechaFin
      });
      return reply.send(ok(logs));
    } catch (error: any) {
      return handleAuditLogError(error, reply);
    }
  });
}