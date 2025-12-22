import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { handleAplicacionQuincenalError } from './infrastructure/errorHandler.js';
import { AportacionQuincenalResumenParamsSchema } from './aplicacionQuincenal.schemas.js';
import { GetAportacionQuincenalResumenQuery } from './application/queries/GetAportacionQuincenalResumenQuery.js';

export default async function aplicacionQuincenalRoutes(app: FastifyInstance) {
  // GET /aplicacion-quincenal/AportacionQuincenalResumen
  app.get('/aplicacion-quincenal/AportacionQuincenalResumen', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta de resumen de aportación quincenal desde APORTACION_QUINCENAL_RESUMEN. Los usuarios admin pueden consultar cualquier clave orgánica. Los usuarios no admin solo pueden consultar sus propias claves orgánicas del token.',
      summary: 'Aportación Quincenal Resumen',
      tags: ['aplicacion-quincenal', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['PERIODO'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0 (requerido para admin, opcional para usuarios normales)',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1 (requerido para admin, opcional para usuarios normales)',
            minLength: 1,
            maxLength: 2
          },
          PERIODO: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2125")',
            minLength: 1,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          description: 'Consulta ejecutada exitosamente',
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Registro de AportacionQuincenalResumen con todos los campos'
              }
            }
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
      const parsed = AportacionQuincenalResumenParamsSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de consulta inválidos',
            details: parsed.error.issues,
            timestamp: new Date().toISOString()
          }
        });
      }

      const user = (request as any).user;
      const userId = user?.sub;
      const isAdmin = user?.roles?.includes('admin') || false;

      // Validar y determinar las claves orgánicas a usar
      let org0: string;
      let org1: string;

      if (isAdmin) {
        // Admin debe proporcionar org0 y org1 en parámetros
        if (!parsed.data.org0 || !parsed.data.org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'org0 y org1 son requeridos para usuarios admin',
              timestamp: new Date().toISOString()
            }
          });
        }

        org0 = parsed.data.org0;
        org1 = parsed.data.org1;
      } else {
        // Usuario no admin: usar claves del token
        const idOrg0 = user?.idOrganica0;
        const idOrg1 = user?.idOrganica1;

        org0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
        org1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

        if (!org0 || !org1) {
          return reply.code(400).send({
            ok: false,
            error: {
              code: 'MISSING_ORGANICA_KEYS',
              message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      const query = request.diScope.resolve<GetAportacionQuincenalResumenQuery>('getAportacionQuincenalResumenQuery');
      const registros = await query.execute(org0, org1, parsed.data.PERIODO, userId);

      // SOLUCIÓN AL PROBLEMA DE SERIALIZACIÓN DE FASTIFY
      // Fastify a veces tiene problemas serializando objetos que tienen referencias circulares,
      // getters/setters, o propiedades no enumerables. La solución es crear una copia profunda
      // completamente limpia usando JSON.parse(JSON.stringify()). Esto elimina cualquier
      // getter/setter, propiedades no enumerables, o referencias problemáticas.
      // Este problema ha ocurrido constantemente en otros endpoints (HIP, Concentrado, Movimientos, etc.)
      // y esta es la solución documentada y probada.
      // Ver: docs/SOLUCION_SERIALIZACION_FASTIFY.md
      const cleanData = JSON.parse(JSON.stringify(registros));

      const responseObject = {
        ok: true,
        data: cleanData
      };

      // Serializar manualmente ANTES de enviar
      // Esto evita que Fastify procese el objeto y pierda datos
      const jsonString = JSON.stringify(responseObject);
      
      // Asegurar que el content-type sea JSON explícitamente
      reply.type('application/json');
      
      // Enviar el JSON serializado manualmente como string
      // Fastify no lo volverá a serializar si ya es un string
      return reply.code(200).send(jsonString);
    } catch (error) {
      return handleAplicacionQuincenalError(error, reply);
    }
  });
}

