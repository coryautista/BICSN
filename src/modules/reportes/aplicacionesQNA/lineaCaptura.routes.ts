import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/auth.middleware.js';
import { handleAplicacionesQNAError } from './infrastructure/errorHandler.js';
import { LineaCapturaParamsSchema } from './aplicacionesQNA.schemas.js';
import { GenerateLineaCapturaQuery } from './application/queries/GenerateLineaCapturaQuery.js';

export async function lineaCapturaRoutes(fastify: FastifyInstance) {
  // POST /aplicaciones-qna/linea-captura - Genera referencia SPEI de 11 posiciones
  fastify.post('/linea-captura', {
    preHandler: [requireAuth],
    schema: {
      description: 'Genera una referencia SPEI de 11 posiciones para línea de captura usando algoritmos de fecha condensada, monto condensado y dígito verificador Base 97. La referencia4 se genera automáticamente desde idOrg0 e idOrg1 (opcionales en body, o del token). La fechaLimite se calcula automáticamente como fecha actual + 5 días.',
      summary: 'Generar línea de captura',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['importe'],
        properties: {
          importe: {
            type: 'number',
            minimum: 0.01,
            description: 'Importe total con centavos (ej: 1000.00)'
          },
          idOrg0: {
            type: 'string',
            pattern: '^[0-9]{1,2}$',
            description: 'Clave orgánica nivel 0 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          },
          idOrg1: {
            type: 'string',
            pattern: '^[0-9]{1,2}$',
            description: 'Clave orgánica nivel 1 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          }
        }
      },
      response: {
        200: {
          description: 'Línea de captura generada exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                lineaCaptura: { 
                  type: 'string', 
                  length: 11,
                  description: 'Línea de captura de 11 caracteres: pos 1-4 referencia, pos 5-8 fecha condensada, pos 9 monto condensado, pos 10-11 dígito verificador'
                },
                referencia4: { 
                  type: 'string', 
                  length: 4,
                  description: 'Referencia base (posiciones 1-4)'
                },
                fechaLimite: { 
                  type: 'string',
                  format: 'date',
                  description: 'Fecha límite de pago en formato YYYY-MM-DD'
                },
                importe: { 
                  type: 'number',
                  description: 'Importe total con centavos'
                },
                fechaCondensada: { 
                  type: 'string',
                  length: 4,
                  description: 'Fecha condensada (posiciones 5-8)'
                },
                montoCondensado: { 
                  type: 'number',
                  minimum: 0,
                  maximum: 9,
                  description: 'Monto condensado (posición 9)'
                },
                digitoVerificador: { 
                  type: 'string',
                  length: 2,
                  description: 'Dígito verificador Base 97 (posiciones 10-11)'
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
      const user = (request as any).user;
      const body = request.body as { importe: number; idOrg0?: string; idOrg1?: string };

      // Validar body con schema de Zod
      const parsed = LineaCapturaParamsSchema.safeParse(body);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: parsed.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
            timestamp: new Date().toISOString()
          }
        });
      }

      // Obtener org0 y org1: primero de body params, si no del token
      let org0: string | undefined = body.idOrg0;
      let org1: string | undefined = body.idOrg1;

      // Si no vienen en body, obtener del token
      if (!org0 && user?.idOrganica0) {
        const idOrg0 = user.idOrganica0;
        org0 = typeof idOrg0 === 'string' 
          ? idOrg0.padStart(2, '0').substring(0, 2)
          : String(idOrg0).padStart(2, '0').substring(0, 2);
      }

      if (!org1 && user?.idOrganica1) {
        const idOrg1 = user.idOrganica1;
        org1 = typeof idOrg1 === 'string'
          ? idOrg1.padStart(2, '0').substring(0, 2)
          : String(idOrg1).padStart(2, '0').substring(0, 2);
      }

      // Normalizar org0 y org1 si vienen de body params
      if (org0) {
        org0 = typeof org0 === 'string'
          ? org0.padStart(2, '0').substring(0, 2)
          : String(org0).padStart(2, '0').substring(0, 2);
      }

      if (org1) {
        org1 = typeof org1 === 'string'
          ? org1.padStart(2, '0').substring(0, 2)
          : String(org1).padStart(2, '0').substring(0, 2);
      }

      // Validar que existan org0 y org1
      if (!org0 || !org1) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'idOrg0 e idOrg1 son requeridos. Deben proporcionarse en el body o estar disponibles en el token del usuario.',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Generar referencia4 desde org0 + org1
      const referencia4 = org0 + org1; // Ejemplo: "0101"

      // Calcular fechaLimite como fecha actual + 5 días
      const fechaActual = new Date();
      fechaActual.setDate(fechaActual.getDate() + 5);
      const fechaLimite = fechaActual.toISOString().split('T')[0]; // YYYY-MM-DD

      // Resolver query del DI container
      const query = request.diScope.resolve<GenerateLineaCapturaQuery>('generateLineaCapturaQuery');
      
      // Ejecutar query con parámetros generados automáticamente
      const result = await query.execute({
        referencia4,
        fechaLimite,
        importe: body.importe
      }, user?.id?.toString());

      // Retornar respuesta
      return reply.send({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });
}

