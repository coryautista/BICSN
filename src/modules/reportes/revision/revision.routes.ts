import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { normalizeClaveOrganica } from '../../../utils/organica.js';
import { ObtenerReporteRevisionQuery } from './application/queries/ObtenerReporteRevisionQuery.js';
import { GuardarAjusteRevisionCommand } from './application/commands/GuardarAjusteRevisionCommand.js';
import {
  GuardarAjusteRevisionBodySchema,
  ReporteRevisionQuery,
  ReporteRevisionQuerySchema
} from './revision.schemas.js';

export async function revisionRoutes(fastify: FastifyInstance) {
  fastify.put('/ajustes', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Inserta o actualiza el concepto 14, Ajustes, de un reporte REVISA completado.',
      summary: 'Guardar ajustes administrativos REVISA',
      tags: ['reportes', 'revision'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['periodo', 'org0', 'org1', 'cair', 'fra', 'fre', 'fh', 'fv', 'faa', 'fae', 'fat', 'fai'],
        properties: {
          periodo: { type: 'string', pattern: '^(0[1-9]|1[0-9]|2[0-4])\\d{2}$' },
          org0: { type: 'string', pattern: '^\\d{1,2}$' },
          org1: { type: 'string', pattern: '^\\d{1,2}$' },
          org2: { type: 'string', pattern: '^\\d{1,2}$', default: '01' },
          org3: { type: 'string', pattern: '^\\d{1,2}$', default: '01' },
          cair: { type: 'number', multipleOf: 0.01 },
          fra: { type: 'number', multipleOf: 0.01 },
          fre: { type: 'number', multipleOf: 0.01 },
          fh: { type: 'number', multipleOf: 0.01 },
          fv: { type: 'number', multipleOf: 0.01 },
          faa: { type: 'number', multipleOf: 0.01 },
          fae: { type: 'number', multipleOf: 0.01 },
          fat: { type: 'number', multipleOf: 0.01 },
          fai: { type: 'number', multipleOf: 0.01 }
        }
      },
      response: {
        200: {
          type: 'object',
          required: ['ok', 'data'],
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              required: ['operacion', 'idRevision', 'numeroConcepto', 'concepto'],
              properties: {
                operacion: { type: 'string', enum: ['INSERT', 'UPDATE', 'SIN_CAMBIOS'] },
                idRevision: { type: 'integer' },
                idRevisionHistorico: { type: 'integer' },
                numeroConcepto: { type: 'integer', enum: [14] },
                concepto: { type: 'string', enum: ['Ajustes'] }
              }
            }
          }
        },
        400: respuestaErrorSchema(),
        401: respuestaErrorSchema(),
        403: respuestaErrorSchema(),
        404: respuestaErrorSchema(),
        409: respuestaErrorSchema(),
        500: respuestaErrorSchema()
      }
    }
  }, async (request, reply) => {
    const parsed = GuardarAjusteRevisionBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de Ajustes inválidos.',
          details: parsed.error.issues
        }
      });
    }

    const org2 = parsed.data.org2 || '01';
    const org3 = parsed.data.org3 || '01';
    if (org2 !== '01' || org3 !== '01') {
      return reply.code(400).send({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'REVISA solo admite org2 y org3 con valor 01.' }
      });
    }
    const user = (request as any).user;
    const usuarioId = String(user?.sub || user?.id || '').trim();
    if (!usuarioId) {
      return reply.code(400).send({
        ok: false,
        error: { code: 'USUARIO_REQUERIDO', message: 'No fue posible identificar al usuario administrador.' }
      });
    }

    try {
      const command = request.diScope.resolve<GuardarAjusteRevisionCommand>('guardarAjusteRevisionCommand');
      const resultado = await command.execute({
        org0: parsed.data.org0,
        org1: parsed.data.org1,
        org2,
        org3,
        periodo: parsed.data.periodo,
        usuarioId,
        importes: {
          CAIR: parsed.data.cair,
          FRA: parsed.data.fra,
          FRE: parsed.data.fre,
          PRESTACIONES: 0,
          FH: parsed.data.fh,
          FV: parsed.data.fv,
          VIVIENDA: 0,
          FAA: parsed.data.faa,
          FAE: parsed.data.fae,
          FAT: parsed.data.fat,
          FAI: parsed.data.fai
        }
      });
      return reply.send({
        ok: true,
        data: { ...resultado, numeroConcepto: 14, concepto: 'Ajustes' }
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : String(error);
      if (code === 'REVISION_NO_ENCONTRADA') {
        return reply.code(404).send({
          ok: false,
          error: { code, message: 'No existe un reporte REVISA para la orgánica y el período indicados.' }
        });
      }
      if (code === 'REVISION_NO_COMPLETADA') {
        return reply.code(409).send({
          ok: false,
          error: { code, message: 'El reporte REVISA debe estar completado antes de registrar Ajustes.' }
        });
      }
      if (code.startsWith('CONCEPTO_INACTIVO_O_INEXISTENTE')) {
        return reply.code(409).send({
          ok: false,
          error: { code: 'CONCEPTO_AJUSTES_NO_DISPONIBLE', message: 'El concepto 14, Ajustes, no está activo en el catálogo REVISA.' }
        });
      }
      request.log.error({ error }, 'Error guardando Ajustes REVISA');
      return reply.code(500).send({
        ok: false,
        error: { code: 'REVISION_AJUSTES_ERROR', message: 'No fue posible guardar los Ajustes REVISA.' }
      });
    }
  });

  fastify.get('/', {
    preHandler: [requireAuth],
    schema: {
      description: 'Consulta el resultado REVISA almacenado en SQL Server sin recalcular sus fuentes.',
      summary: 'Consultar reporte REVISA por período',
      tags: ['reportes', 'revision'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['periodo'],
        properties: {
          periodo: { type: 'string', pattern: '^(0[1-9]|1[0-9]|2[0-4])\\d{2}$', description: 'Período QQAA.' },
          org0: { type: 'string', pattern: '^\\d{1,2}$' },
          org1: { type: 'string', pattern: '^\\d{1,2}$' },
          org2: { type: 'string', pattern: '^\\d{1,2}$' },
          org3: { type: 'string', pattern: '^\\d{1,2}$' }
        }
      }
    }
  }, async (request, reply) => {
    const parsed = ReporteRevisionQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parámetros de consulta inválidos.',
          details: parsed.error.issues
        }
      });
    }

    const organicas = resolverOrganicas((request as any).user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({
        ok: false,
        error: { code: organicas.code, message: organicas.message }
      });
    }

    try {
      const query = request.diScope.resolve<ObtenerReporteRevisionQuery>('obtenerReporteRevisionQuery');
      const reporte = await query.execute({ ...organicas.data, periodo: parsed.data.periodo });
      if (!reporte) {
        return reply.code(404).send({
          ok: false,
          error: {
            code: 'REVISION_NO_ENCONTRADA',
            message: 'No existe un reporte REVISA para la orgánica y el período solicitados.'
          }
        });
      }
      if (reporte.estatusProceso === 'PENDIENTE' || reporte.estatusProceso === 'PROCESANDO') {
        return reply.code(202).send({ ok: true, data: reporte });
      }
      if (reporte.estatusProceso === 'ERROR') {
        return reply.code(409).send({
          ok: false,
          error: {
            code: 'REVISION_PROCESO_ERROR',
            message: 'No fue posible completar el cálculo REVISA.'
          },
          data: reporte
        });
      }
      return reply.send({ ok: true, data: reporte });
    } catch (error) {
      request.log.error({ error }, 'Error consultando reporte REVISA');
      return reply.code(500).send({
        ok: false,
        error: { code: 'REVISION_ERROR', message: 'No fue posible consultar el reporte REVISA.' }
      });
    }
  });
}

function respuestaErrorSchema() {
  return {
    type: 'object',
    required: ['ok', 'error'],
    properties: {
      ok: { type: 'boolean' },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array' }
        }
      }
    }
  };
}

function resolverOrganicas(user: any, input: ReporteRevisionQuery) {
  const org0Token = normalizeClaveOrganica(user?.idOrganica0);
  const org1Token = normalizeClaveOrganica(user?.idOrganica1);
  const org0 = normalizeClaveOrganica(input.org0 ?? org0Token);
  const org1 = normalizeClaveOrganica(input.org1 ?? org1Token);
  const org2Input = normalizeClaveOrganica(input.org2);
  const org3Input = normalizeClaveOrganica(input.org3);
  const org2 = '01';
  const org3 = '01';
  const esAdmin = Array.isArray(user?.roles) && user.roles.includes('admin');

  if ((org2Input && org2Input !== '01') || (org3Input && org3Input !== '01')) {
    return { ok: false as const, code: 'VALIDATION_ERROR', message: 'REVISA solo admite org2 y org3 con valor 01.' };
  }
  if (!org0 || !org1) {
    return { ok: false as const, code: 'MISSING_ORGANICA_KEYS', message: 'org0 y org1 son requeridos en query string o en el token del usuario.' };
  }
  if (!esAdmin && (!org0Token || !org1Token || org0 !== org0Token || org1 !== org1Token)) {
    return { ok: false as const, code: 'MISSING_ORGANICA_KEYS', message: 'Solo usuarios admin pueden consultar una orgánica distinta a la configurada en su token.' };
  }
  return { ok: true as const, data: { org0, org1, org2, org3 } };
}
