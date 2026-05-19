import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { normalizeClaveOrganica } from '../../utils/organica.js';
import { GetHistoricoQuincenalPorTipoQuery } from './application/queries/GetHistoricoQuincenalPorTipoQuery.js';
import { HistoricoGrupoParamSchema, HistoricoQuerySchema } from './historicosQuincenales.schemas.js';

export default async function historicosQuincenalesRoutes(app: FastifyInstance) {
  app.get('/historicos-quincenales/:grupo/:tipo', {
    preHandler: [requireAuth],
    schema: {
      description: '[SQL SERVER] Consulta históricos quincenales por tipo desde tablas aportaciones.*Historico y retenciones.*Historico.',
      summary: 'Históricos quincenales por tipo',
      tags: ['historicos-quincenales', 'sql-server'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['grupo', 'tipo'],
        properties: {
          grupo: { type: 'string', enum: ['aportaciones', 'retenciones'] },
          tipo: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['periodo'],
        properties: {
          periodo: { type: 'string', pattern: '^\\d{4}$', description: 'Periodo QQAA, ejemplo 0626' },
          org0: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' },
          org1: { type: 'string', pattern: '^[A-Za-z0-9]{1,2}$' },
          buscar: { type: 'string', maxLength: 200 },
          page: { type: 'integer', minimum: 1, default: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 500, default: 100 }
        }
      }
    }
  }, async (request, reply) => {
    const params = HistoricoGrupoParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de ruta inválidos', details: params.error.issues } });
    }

    const parsedQuery = HistoricoQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros de consulta inválidos', details: parsedQuery.error.issues } });
    }

    const organicas = resolveOrganicas((request as any).user, parsedQuery.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    try {
      const query = request.diScope.resolve<GetHistoricoQuincenalPorTipoQuery>('getHistoricoQuincenalPorTipoQuery');
      const result = await query.execute({
        grupo: params.data.grupo,
        tipo: params.data.tipo,
        org0: organicas.data.org0,
        org1: organicas.data.org1,
        periodo: parsedQuery.data.periodo,
        page: parsedQuery.data.page,
        pageSize: parsedQuery.data.pageSize,
        buscar: parsedQuery.data.buscar
      });

      return reply.send({ ok: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      if (error.message === 'TIPO_HISTORICO_INVALIDO') {
        return reply.code(404).send({ ok: false, error: { code: 'TIPO_HISTORICO_INVALIDO', message: 'El grupo/tipo solicitado no está soportado.' } });
      }

      if (error.message === 'PERIODO_INVALIDO') {
        return reply.code(400).send({ ok: false, error: { code: 'PERIODO_INVALIDO', message: 'periodo debe tener formato QQAA y quincena válida de 01 a 24.' } });
      }

      request.log.error({ error }, 'Error consultando históricos quincenales');
      return reply.code(500).send({ ok: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Error al consultar históricos quincenales' } });
    }
  });
}

function resolveOrganicas(user: any, input: Partial<{ org0: string; org1: string }>) {
  const org0 = normalizeClaveOrganica(input.org0 ?? user?.idOrganica0);
  const org1 = normalizeClaveOrganica(input.org1 ?? user?.idOrganica1);

  if (!org0 || !org1) {
    return {
      ok: false as const,
      message: 'org0 y org1 son requeridos en query string o en el token del usuario.'
    };
  }

  return { ok: true as const, data: { org0, org1 } };
}
