import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/auth.middleware.js';
import { handleAplicacionesQNAError } from './infrastructure/errorHandler.js';
import { LineaCapturaParamsSchema, LineaCapturaPeriodoBodySchema, LineaCapturaPeriodoQuerySchema } from './aplicacionesQNA.schemas.js';
import { GenerateLineaCapturaPeriodoCommand } from './application/commands/GenerateLineaCapturaPeriodoCommand.js';
import { GenerateLineaCapturaQuery } from './application/queries/GenerateLineaCapturaQuery.js';
import { GetLineaCapturaPeriodoQuery } from './application/queries/GetLineaCapturaPeriodoQuery.js';
import { normalizeClaveOrganica } from '../../../utils/organica.js';

function isAdmin(user: any): boolean {
  return Array.isArray(user?.roles) && user.roles.some((role: any) => String(role).toLowerCase() === 'admin');
}

function resolveOrgKeys(user: any, inputOrg0?: string, inputOrg1?: string): { org0?: string; org1?: string; forbidden: boolean } {
  const admin = isAdmin(user);
  if (!admin && (inputOrg0 || inputOrg1)) {
    return { forbidden: true };
  }

  const org0 = normalizeClaveOrganica(admin ? inputOrg0 : undefined) || normalizeClaveOrganica(user?.idOrganica0) || undefined;
  const org1 = normalizeClaveOrganica(admin ? inputOrg1 : undefined) || normalizeClaveOrganica(user?.idOrganica1) || undefined;
  return { org0, org1, forbidden: false };
}

function lineaCapturaPeriodoResponseSchema() {
  return {
    type: 'object',
    properties: {
      lineaCapturaPeriodoId: { type: 'number' },
      org0: { type: 'string' },
      org1: { type: 'string' },
      periodo: { type: 'string' },
      quincena: { type: 'number' },
      anio: { type: 'number' },
      importe: { type: 'number' },
      lineaCaptura: { type: 'string' },
      referencia4: { type: 'string' },
      fechaInicioPeriodo: { type: 'string' },
      fechaFinalPeriodo: { type: 'string' },
      fechaInicioVigencia: { type: 'string' },
      fechaFinVigencia: { type: 'string' },
      fechaReferenciaValidacion: { type: 'string' },
      tipoReferenciaValidacion: { type: 'string' },
      fechaLimite: { type: 'string' },
      fechaCondensada: { type: 'string' },
      montoCondensado: { type: 'number' },
      digitoVerificador: { type: 'string' },
      usuarioId: { type: 'string', nullable: true },
      estatus: { type: 'string' },
      reutilizada: { type: 'boolean' },
      createdAt: { type: 'string', nullable: true },
      updatedAt: { type: 'string', nullable: true }
    }
  };
}

export async function lineaCapturaRoutes(fastify: FastifyInstance) {
  fastify.post('/linea-captura-periodo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Genera, guarda y reutiliza una línea de captura vigente por orgánica, período e importe. La fecha límite se toma del primer evento calendario tipo PAGO posterior al fin del período.',
      summary: 'Generar línea de captura por período',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['periodo', 'importe'],
        properties: {
          periodo: { type: 'string', pattern: '^\\d{4}$', description: 'Periodo QQAA, ejemplo 1026' },
          importe: { type: 'number', minimum: 0.01 },
          idOrg0: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' },
          idOrg1: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: lineaCapturaPeriodoResponseSchema(),
            timestamp: { type: 'string' }
          }
        },
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: lineaCapturaPeriodoResponseSchema(),
            timestamp: { type: 'string' }
          }
        },
        400: { type: 'object' },
        401: { type: 'object' },
        403: { type: 'object' },
        409: { type: 'object' },
        500: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const parsed = LineaCapturaPeriodoBodySchema.safeParse(request.body);
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

      const org = resolveOrgKeys(user, parsed.data.idOrg0, parsed.data.idOrg1);
      if (org.forbidden) {
        return reply.code(403).send({
          success: false,
          error: { code: 'FORBIDDEN_ORGANICA_QUERY', message: 'Solo usuarios admin pueden enviar orgánicas en la solicitud.', timestamp: new Date().toISOString() }
        });
      }
      if (!org.org0 || !org.org1) {
        return reply.code(400).send({
          success: false,
          error: { code: 'MISSING_ORGANICA_KEYS', message: 'No fue posible resolver org0/org1 desde el token o la solicitud.', timestamp: new Date().toISOString() }
        });
      }

      const command = request.diScope.resolve<GenerateLineaCapturaPeriodoCommand>('generateLineaCapturaPeriodoCommand');
      const result = await command.execute({
        org0: org.org0,
        org1: org.org1,
        periodo: parsed.data.periodo,
        importe: parsed.data.importe,
        usuarioId: user?.sub?.toString() ?? user?.id?.toString()
      });

      return reply.code(result.reutilizada ? 200 : 201).send({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error: any) {
      if (error?.message === 'PAGO_EVENT_NOT_FOUND') {
        return reply.code(400).send({
          success: false,
          error: { code: 'PAGO_EVENT_NOT_FOUND', message: 'No existe un evento calendario tipo PAGO posterior al final del período.', timestamp: new Date().toISOString() }
        });
      }
      if (error?.message === 'PERIODO_INVALIDO') {
        return reply.code(400).send({
          success: false,
          error: { code: 'PERIODO_INVALIDO', message: 'Periodo inválido. Use formato QQAA con quincena entre 01 y 24.', timestamp: new Date().toISOString() }
        });
      }
      if (error?.message === 'HISTORICO_APLICADO_NOT_FOUND') {
        return reply.code(400).send({
          success: false,
          error: { code: 'HISTORICO_APLICADO_NOT_FOUND', message: 'No existe histórico aplicado para generar Línea de Pago.', timestamp: new Date().toISOString() }
        });
      }
      if (error?.message === 'LINEA_CAPTURA_IMPORTE_MISMATCH') {
        const importeLinea = Number(error.details?.importeLinea ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const importeHistorico = Number(error.details?.importeHistorico ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        return reply.code(409).send({
          success: false,
          error: {
            code: 'LINEA_CAPTURA_IMPORTE_MISMATCH',
            message: `Ya existe una Línea de Pago vigente para este periodo con importe ${importeLinea}. El histórico aplicado suma ${importeHistorico}. Requiere revisión administrativa.`,
            timestamp: new Date().toISOString()
          }
        });
      }
      const errorMessage = String(error?.message || '');
      if (errorMessage.includes('Invalid object name') || errorMessage.includes('Invalid column name')) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'LINEA_CAPTURA_SCHEMA_ERROR',
            message: 'No se pudo generar la Línea de Pago porque falta una tabla o columna requerida en la base de datos.',
            details: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
      }
      return handleAplicacionesQNAError(error, reply);
    }
  });

  fastify.get('/linea-captura-periodo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Consulta una línea de captura vigente guardada por período. Usuarios no admin usan orgánicas del token; admin debe enviar org0 y org1.',
      summary: 'Consultar línea de captura por período',
      tags: ['reportes', 'aplicaciones-qna'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['periodo'],
        properties: {
          periodo: { type: 'string', pattern: '^\\d{4}$' },
          org0: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' },
          org1: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { ...lineaCapturaPeriodoResponseSchema(), nullable: true },
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
      const user = (request as any).user;
      const parsed = LineaCapturaPeriodoQuerySchema.safeParse(request.query);
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

      const org = resolveOrgKeys(user, parsed.data.org0, parsed.data.org1);
      if (org.forbidden) {
        return reply.code(403).send({
          success: false,
          error: { code: 'FORBIDDEN_ORGANICA_QUERY', message: 'Solo usuarios admin pueden enviar orgánicas en la solicitud.', timestamp: new Date().toISOString() }
        });
      }
      if (isAdmin(user) && (!parsed.data.org0 || !parsed.data.org1)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'MISSING_ORGANICA_KEYS', message: 'Usuarios admin deben enviar org0 y org1 en query.', timestamp: new Date().toISOString() }
        });
      }
      if (!org.org0 || !org.org1) {
        return reply.code(400).send({
          success: false,
          error: { code: 'MISSING_ORGANICA_KEYS', message: 'No fue posible resolver org0/org1 desde el token o la solicitud.', timestamp: new Date().toISOString() }
        });
      }

      const query = request.diScope.resolve<GetLineaCapturaPeriodoQuery>('getLineaCapturaPeriodoQuery');
      const result = await query.execute({ org0: org.org0, org1: org.org1, periodo: parsed.data.periodo });

      return reply.send({ success: true, data: result ? { ...result, reutilizada: true } : null, timestamp: new Date().toISOString() });
    } catch (error) {
      return handleAplicacionesQNAError(error, reply);
    }
  });

  // POST /aplicaciones-qna/linea-captura - Genera referencia SPEI de 15 posiciones
  fastify.post('/linea-captura', {
    preHandler: [requireAuth],
    schema: {
      description: 'Genera una referencia SPEI de 15 posiciones para línea de captura usando algoritmos de fecha condensada, monto condensado y dígito verificador Base 97. La referencia4 se genera automáticamente desde idOrg0 e idOrg1 (opcionales en body, o del token). La fechaLimite se calcula automáticamente como fecha actual + 5 días.',
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
            pattern: '^[A-Za-z0-9]{1,2}$',
            description: 'Clave orgánica nivel 0 (1-2 caracteres numéricos, opcional - se usa del token si no se proporciona)'
          },
          idOrg1: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{1,2}$',
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
                  length: 15,
                  description: 'Línea de captura de 15 caracteres: pos 1-4 referencia, pos 5-6 mes, pos 7-8 año, pos 9-12 fecha condensada, pos 13 monto condensado, pos 14-15 dígito verificador'
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
                  description: 'Fecha condensada (posiciones 9-12)'
                },
                montoCondensado: { 
                  type: 'number',
                  minimum: 0,
                  maximum: 9,
                  description: 'Monto condensado (posición 13)'
                },
                digitoVerificador: { 
                  type: 'string',
                  length: 2,
                  description: 'Dígito verificador Base 97 (posiciones 14-15)'
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

      // Get org0/org1: from body first, fallback to token (normalized to 2 digits)
      let org0: string | undefined = normalizeClaveOrganica(body.idOrg0) || undefined;
      let org1: string | undefined = normalizeClaveOrganica(body.idOrg1) || undefined;

      // If not in body, get from token
      if (!org0 && user?.idOrganica0) {
        org0 = normalizeClaveOrganica(user.idOrganica0) || undefined;
      }

      if (!org1 && user?.idOrganica1) {
        org1 = normalizeClaveOrganica(user.idOrganica1) || undefined;
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

