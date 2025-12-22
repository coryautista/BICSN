import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { handleRetencionesPorCobrarError } from './infrastructure/errorHandler.js';
import { ConsultaIntMoratorioParamsSchema } from './retencionesPorCobrar.schemas.js';
import { GetRetencionesPorCobrarQuery } from './application/queries/GetRetencionesPorCobrarQuery.js';

export default async function retencionesPorCobrarRoutes(app: FastifyInstance) {
  // GET /retenciones-por-cobrar/Consulta_Int_Moratorio
  app.get('/retenciones-por-cobrar/Consulta_Int_Moratorio', {
    preHandler: [requireAuth],
    schema: {
      description: '[FIREBIRD] Consulta de retenciones por cobrar desde ORGANICAS_INT_MORATORIO_GEN. Valida que regresen exactamente 3 registros con tipos PPV, PMP y PCP.',
      summary: 'Consulta Int Moratorio',
      tags: ['retenciones-por-cobrar', 'firebird'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['QNA'],
        properties: {
          org0: {
            type: 'string',
            description: 'Clave orgánica 0 (opcional, se toma del token si no se proporciona)',
            minLength: 1,
            maxLength: 2
          },
          org1: {
            type: 'string',
            description: 'Clave orgánica 1 (opcional, se toma del token si no se proporciona)',
            minLength: 1,
            maxLength: 2
          },
          QNA: {
            type: 'string',
            description: 'Período en formato QQAA (ej: "2225")',
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
            validado: { 
              type: 'boolean',
              description: 'true si hay exactamente 3 registros con tipos PPV, PMP y PCP'
            },
            registros: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claveOrganica0: { type: 'string' },
                  claveOrganica1: { type: 'string' },
                  claveOrganica2: { type: 'string', nullable: true },
                  claveOrganica3: { type: 'string', nullable: true },
                  periodo: { type: 'string' },
                  fechaGeneracion: { type: 'string', format: 'date-time', nullable: true },
                  userAlta: { type: 'string', nullable: true },
                  tipo: { type: 'string' }
                }
              }
            }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const parsed = ConsultaIntMoratorioParamsSchema.safeParse(request.query);
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

      const { QNA } = parsed.data;
      const user = (request as any).user;
      const userId = user?.sub;

      // Extract organica0 and organica1 from JWT token
      // Use query params if provided, otherwise use token values
      const idOrg0 = user?.idOrganica0;
      const idOrg1 = user?.idOrganica1;

      // Usar query params si se proporcionan, sino usar token
      const claveOrganica0 = parsed.data.org0 || 
        (idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null);
      const claveOrganica1 = parsed.data.org1 || 
        (idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null);

      if (!claveOrganica0 || !claveOrganica1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas. Deben estar en el token o proporcionarse como parámetros de consulta.',
            timestamp: new Date().toISOString()
          }
        });
      }

      const query = request.diScope.resolve<GetRetencionesPorCobrarQuery>('getRetencionesPorCobrarQuery');
      const result = await query.execute(claveOrganica0, claveOrganica1, QNA, userId);

      return reply.send({
        ok: true,
        validado: result.validado,
        registros: result.registros
      });
    } catch (error) {
      return handleRetencionesPorCobrarError(error, reply);
    }
  });
}

