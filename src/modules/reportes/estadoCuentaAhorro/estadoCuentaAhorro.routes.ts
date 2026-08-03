import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/auth.middleware.js';
import { normalizeClaveOrganica } from '../../../utils/organica.js';
import { GenerarEstadoCuentaAhorroCommand } from './application/commands/GenerarEstadoCuentaAhorroCommand.js';
import { ObtenerEstadoCuentaAhorroHistoricoQuery } from './application/queries/ObtenerEstadoCuentaAhorroHistoricoQuery.js';
import { ObtenerEstadoCuentaAhorroPorPeriodoQuery } from './application/queries/ObtenerEstadoCuentaAhorroPorPeriodoQuery.js';
import { ObtenerUltimoEstadoCuentaAhorroQuery } from './application/queries/ObtenerUltimoEstadoCuentaAhorroQuery.js';
import { AplicarEstadoCuentaAhorroParamsSchema, EstadoCuentaAhorroHistoricoParamsSchema, EstadoCuentaAhorroOrganicasParamsSchema, EstadoCuentaAhorroParamsSchema } from './EstadoCuentaAhorro.schemas.js';
import { EstadoCuentaAhorroExportador } from './infrastructure/export/EstadoCuentaAhorroExportador.js';

export async function estadoCuentaAhorroRoutes(fastify: FastifyInstance) {
  fastify.post('/aplicar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Valida el periodo contra la QNA vigente de Firebird y genera una nueva version trazable del reporte.',
      summary: 'Aplicar estado de cuenta de ahorro',
      tags: ['reportes', 'estado-cuenta-ahorro'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['periodo'],
        properties: {
          periodo: { type: 'string', pattern: '^\\d{4}$', description: 'Periodo QQAA devuelto por ultima-version.' },
          org0: { type: 'string', pattern: '^\\d{1,2}$' },
          org1: { type: 'string', pattern: '^\\d{1,2}$' },
          org2: { type: 'string', pattern: '^\\d{1,2}$' },
          org3: { type: 'string', pattern: '^\\d{1,2}$' }
        }
      }
    }
  }, async (request, reply) => {
    const parsed = AplicarEstadoCuentaAhorroParamsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de consulta inválidos', details: parsed.error.issues } });
    }

    const organicas = resolverOrganicas((request as any).user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    try {
      const command = request.diScope.resolve<GenerarEstadoCuentaAhorroCommand>('generarEstadoCuentaAhorroCommand');
      const estado = await command.execute(organicas.data, parsed.data.periodo, (request as any).user?.sub);
      return reply.code(201).send({ ok: true, data: estado });
    } catch (error) {
      request.log.error({ error }, 'Error generando estado de cuenta de ahorro');
      if (error instanceof Error && error.message.startsWith('PERIODO_NO_VIGENTE:')) {
        return reply.code(409).send({ ok: false, error: { code: 'PERIODO_NO_VIGENTE', message: error.message } });
      }
      return reply.code(500).send({ ok: false, error: { code: 'ESTADO_CUENTA_AHORRO_ERROR', message: error instanceof Error ? error.message : 'Error generando estado de cuenta de ahorro' } });
    }
  });

  fastify.get('/ultima-version', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene exclusivamente la QNA vigente desde Firebird para la organica.',
      summary: 'Consultar QNA vigente de estado de cuenta de ahorro',
      tags: ['reportes', 'estado-cuenta-ahorro'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          org0: { type: 'string', pattern: '^\\d{1,2}$' },
          org1: { type: 'string', pattern: '^\\d{1,2}$' },
          org2: { type: 'string', pattern: '^\\d{1,2}$' },
          org3: { type: 'string', pattern: '^\\d{1,2}$' }
        }
      }
    }
  }, async (request, reply) => {
    const parsed = EstadoCuentaAhorroOrganicasParamsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de consulta inválidos', details: parsed.error.issues } });
    }

    const organicas = resolverOrganicas((request as any).user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    try {
      const query = request.diScope.resolve<ObtenerUltimoEstadoCuentaAhorroQuery>('obtenerUltimoEstadoCuentaAhorroQuery');
      const qnaVigente = await query.execute(organicas.data);
      return reply.send({ ok: true, data: qnaVigente });
    } catch (error) {
      request.log.error({ error }, 'Error obteniendo ultima version de estado de cuenta de ahorro');
      return reply.code(500).send({ ok: false, error: { code: 'ESTADO_CUENTA_AHORRO_ERROR', message: error instanceof Error ? error.message : 'Error obteniendo ultima version de estado de cuenta de ahorro' } });
    }
  });

  fastify.get('/historico', {
    preHandler: [requireAuth],
    schema: {
      description: 'Consulta una QNA anterior exclusivamente desde el historico SQL Server. Nunca consulta Firebird ni genera una nueva version.',
      summary: 'Consultar historico de estado de cuenta por periodo',
      tags: ['reportes', 'estado-cuenta-ahorro'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['quincena', 'anio'],
        properties: {
          quincena: { type: 'integer', minimum: 1, maximum: 24 },
          anio: { type: 'integer', minimum: 2000, maximum: 2100 },
          org0: { type: 'string', pattern: '^\\d{1,2}$' },
          org1: { type: 'string', pattern: '^\\d{1,2}$' },
          org2: { type: 'string', pattern: '^\\d{1,2}$' },
          org3: { type: 'string', pattern: '^\\d{1,2}$' }
        }
      }
    }
  }, async (request, reply) => {
    const parsed = EstadoCuentaAhorroParamsSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de consulta inválidos', details: parsed.error.issues } });
    }

    const organicas = resolverOrganicas((request as any).user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    try {
      const query = request.diScope.resolve<ObtenerEstadoCuentaAhorroPorPeriodoQuery>('obtenerEstadoCuentaAhorroPorPeriodoQuery');
      const estado = await query.execute({ ...parsed.data, ...organicas.data });
      if (!estado) {
        return reply.code(404).send({
          ok: false,
          error: {
            code: 'HISTORICO_NO_ENCONTRADO',
            message: 'La QNA anterior no tiene histórico disponible y no puede regenerarse desde Firebird.'
          }
        });
      }
      return reply.send({ ok: true, data: estado });
    } catch (error) {
      request.log.error({ error }, 'Error obteniendo historico de estado de cuenta de ahorro por periodo');
      return reply.code(500).send({ ok: false, error: { code: 'ESTADO_CUENTA_AHORRO_ERROR', message: error instanceof Error ? error.message : 'Error obteniendo historico de estado de cuenta de ahorro' } });
    }
  });

  fastify.get('/historico/:idHistorico', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene una versión histórica del estado de cuenta de ahorro.',
      summary: 'Consultar histórico de estado de cuenta de ahorro',
      tags: ['reportes', 'estado-cuenta-ahorro'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['idHistorico'],
        properties: { idHistorico: { type: 'integer', minimum: 1 } }
      }
    }
  }, async (request, reply) => {
    const parsed = EstadoCuentaAhorroHistoricoParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Identificador histórico inválido', details: parsed.error.issues } });
    }

    try {
      const query = request.diScope.resolve<ObtenerEstadoCuentaAhorroHistoricoQuery>('obtenerEstadoCuentaAhorroHistoricoQuery');
      const estado = await query.execute(parsed.data.idHistorico);
      if (!estado) {
        return reply.code(404).send({ ok: false, error: { code: 'HISTORICO_NO_ENCONTRADO', message: 'No existe el histórico solicitado.' } });
      }
      return reply.send({ ok: true, data: estado });
    } catch (error) {
      request.log.error({ error }, 'Error obteniendo histórico de estado de cuenta de ahorro');
      return reply.code(500).send({ ok: false, error: { code: 'ESTADO_CUENTA_AHORRO_ERROR', message: error instanceof Error ? error.message : 'Error obteniendo histórico de estado de cuenta de ahorro' } });
    }
  });

  fastify.get('/historico/:idHistorico/exportar.:formato', {
    preHandler: [requireAuth],
    schema: {
      description: 'Exporta una versión histórica sin recalcular las fuentes originales.',
      summary: 'Exportar estado de cuenta de ahorro',
      tags: ['reportes', 'estado-cuenta-ahorro'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['idHistorico', 'formato'],
        properties: {
          idHistorico: { type: 'integer', minimum: 1 },
          formato: { type: 'string', enum: ['xlsx', 'pdf'] }
        }
      }
    }
  }, async (request, reply) => {
    const parsed = EstadoCuentaAhorroHistoricoParamsSchema.safeParse({ idHistorico: (request.params as any).idHistorico });
    const formato = String((request.params as any).formato || '').toLowerCase();
    if (!parsed.success || (formato !== 'xlsx' && formato !== 'pdf')) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de exportación inválidos.' } });
    }

    try {
      const query = request.diScope.resolve<ObtenerEstadoCuentaAhorroHistoricoQuery>('obtenerEstadoCuentaAhorroHistoricoQuery');
      const estado = await query.execute(parsed.data.idHistorico);
      if (!estado) {
        return reply.code(404).send({ ok: false, error: { code: 'HISTORICO_NO_ENCONTRADO', message: 'No existe el histórico solicitado.' } });
      }

      const exportador = request.diScope.resolve<EstadoCuentaAhorroExportador>('estadoCuentaAhorroExportador');
      const contenido = formato === 'xlsx' ? await exportador.generarExcel(estado) : await exportador.generarPdf(estado);
      const archivo = `estado-cuenta-ahorro-${estado.periodo}-${estado.idHistorico}.${formato}`;
      return reply
        .header('Content-Type', formato === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${archivo}"`)
        .send(contenido);
    } catch (error) {
      request.log.error({ error }, 'Error exportando estado de cuenta de ahorro');
      return reply.code(500).send({ ok: false, error: { code: 'ESTADO_CUENTA_AHORRO_EXPORT_ERROR', message: error instanceof Error ? error.message : 'Error exportando estado de cuenta de ahorro' } });
    }
  });
}

function resolverOrganicas(user: any, input: { org0?: string; org1?: string; org2?: string; org3?: string }) {
  const org0Token = normalizeClaveOrganica(user?.idOrganica0);
  const org1Token = normalizeClaveOrganica(user?.idOrganica1);
  const org2Token = normalizeClaveOrganica(user?.idOrganica2) || '01';
  const org3Token = normalizeClaveOrganica(user?.idOrganica3) || '01';
  const org0 = normalizeClaveOrganica(input.org0 ?? org0Token);
  const org1 = normalizeClaveOrganica(input.org1 ?? org1Token);
  const org2 = normalizeClaveOrganica(input.org2 ?? org2Token) || '01';
  const org3 = normalizeClaveOrganica(input.org3 ?? org3Token) || '01';
  const esAdmin = Array.isArray(user?.roles) && user.roles.includes('admin');

  if (!org0 || !org1) {
    return { ok: false as const, message: 'org0 y org1 son requeridos en query string o en el token del usuario.' };
  }
  if (!esAdmin && (!org0Token || !org1Token || org0 !== org0Token || org1 !== org1Token || org2 !== org2Token || org3 !== org3Token)) {
    return { ok: false as const, message: 'Solo usuarios admin pueden consultar una orgánica distinta a la configurada en su token.' };
  }
  return { ok: true as const, data: { org0, org1, org2, org3 } };
}
