import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { fail, ok } from '../../utils/http.js';
import type { CreateQnaCandidateInput } from './domain/entities/LiquidacionQna.js';
import type { CreateQnaCandidateCommand } from './application/commands/CreateQnaCandidateCommand.js';
import type { AppendQnaDecisionCommand } from './application/commands/AppendQnaDecisionCommand.js';
import type { PromoteQnaSnapshotCommand } from './application/commands/PromoteQnaSnapshotCommand.js';
import type { GetQnaSnapshotQuery } from './application/queries/GetQnaSnapshotQuery.js';
import type { ListQnaSnapshotsQuery } from './application/queries/ListQnaSnapshotsQuery.js';
import type { ResolveOfficialQnaSnapshotQuery } from './application/queries/ResolveOfficialQnaSnapshotQuery.js';
import type { CreateAndPromoteQnaCandidateCommand } from './application/commands/CreateAndPromoteQnaCandidateCommand.js';
import type { ListAppliedQnaQuery } from './application/queries/ListAppliedQnaQuery.js';
import type { GetAppliedQnaSummaryQuery } from './application/queries/GetAppliedQnaSummaryQuery.js';
import type { GetAppliedQnaDetailsQuery } from './application/queries/GetAppliedQnaDetailsQuery.js';
import { handleLiquidacionQnaError } from './infrastructure/errorHandler.js';
import { resolveOrganicaScope } from '../auth/domain/policies/OrganicaScopePolicy.js';
import {
  CreateQnaCandidateSchema, QnaAppliedDetailSchema, QnaAppliedDomainParamsSchema, QnaAppliedListSchema,
  QnaAppliedSelectionSchema, QnaDecisionSchema, QnaIdParamsSchema, QnaListSchema, QnaPromoteSchema,
} from './liquidacionQna.schemas.js';
import { qnaAppliedDetailResponses, qnaAppliedListResponses, qnaAppliedSummaryResponses } from './liquidacionQna.applied.openapi.js';

const idParams = { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string', pattern: '^[1-9]\\d*$' } } };
const security = [{ bearerAuth: [] }];
const appliedScopeProperties = {
  entidadId: { type: 'string', pattern: '^[1-9]\\d*$' }, organica0: { type: 'string', pattern: '^\\d{2}$' },
  organica1: { type: 'string', pattern: '^\\d{2}$' }, organica2: { type: 'string', pattern: '^\\d{2}$' }, organica3: { type: 'string', pattern: '^\\d{2}$' },
};
const appliedPeriodProperties = {
  anio: { type: 'string', pattern: '^\\d{4}$' }, quincena: { type: 'string', pattern: '^(?:[1-9]|1\\d|2[0-4])$' },
};
const appliedPaginationProperties = {
  page: { type: 'string', pattern: '^[1-9]\\d*$', default: '1' }, pageSize: { type: 'string', pattern: '^[1-9]\\d*$', default: '100' },
  buscar: { type: 'string', minLength: 1, maxLength: 200 },
};
const rejectLegacySearch = async (request: any, reply: any) => {
  if (new URL(request.raw.url,'http://localhost').searchParams.has('search')) {
    return reply.code(400).send(fail('El parametro search no esta permitido; use buscar', 'QNA_PARAMETRO_INVALIDO'));
  }
};
const moneyA2 = { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' };
const hash = { type: 'string', pattern: '^[0-9A-F]{64}$' };
const totalNames = [
  'cairA2', 'fraA2', 'freA2', 'fhA2', 'fvA2', 'faaA2', 'faeA2', 'fatA2', 'faiA2',
  'ahorroA2', 'viviendaA2', 'prestacionesA2', 'cairFondoA2', 'guarderiasA2', 'transitorioA2', 'aguinaldoA2',
  'retencionPcpA2', 'retencionPmpA2', 'retencionHipA2', 'totalAportacionesA2', 'totalRetencionesA2', 'totalGeneralA2',
];
const candidateBody = {
  type: 'object', additionalProperties: false,
  required: ['entidadId', 'anio', 'quincena', 'organica0', 'organica1', 'organica2', 'organica3', 'ambiente', 'fuentes', 'totales', 'detalles'],
  properties: {
    entidadId: { type: 'integer', minimum: 1 }, anio: { type: 'integer', minimum: 2000, maximum: 9999 },
    quincena: { type: 'integer', minimum: 1, maximum: 24 },
    organica0: { type: 'string', pattern: '^\\d{2}$' }, organica1: { type: 'string', pattern: '^\\d{2}$' },
    organica2: { type: 'string', pattern: '^\\d{2}$' }, organica3: { type: 'string', pattern: '^\\d{2}$' },
    ambiente: { type: 'string', enum: ['DESARROLLO', 'CALIDAD', 'PRODUCCION'] },
    snapshotCalculoV2Id: { type: ['string', 'null'], pattern: '^[1-9]\\d*$' },
    nominaCargaId: { type: ['string', 'null'], pattern: '^[1-9]\\d*$' },
    formulaCalculoVersionId: { type: ['string', 'null'], pattern: '^[1-9]\\d*$' },
    fuentes: {
      type: 'array', minItems: 10, maxItems: 10, items: {
        type: 'object', additionalProperties: false,
        required: ['dominio', 'tipoFuente', 'estado', 'requerida', 'identificadorFuente', 'hashFuente', 'sourceScale', 'registros', 'notApplicableAprobado', 'aprobadoPor', 'evidencia', 'errorCode'],
        properties: {
          dominio: { type: 'string', enum: ['AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR', 'GUARDERIAS', 'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP'] },
          tipoFuente: { type: 'string', enum: ['TXT_NOMINA', 'FIREBIRD', 'SQL_HISTORICO', 'MOVIMIENTO'] },
          estado: { type: 'string', enum: ['COMPLETE', 'EMPTY', 'NOT_APPLICABLE', 'ERROR'] }, requerida: { type: 'boolean' },
          identificadorFuente: { type: 'string', minLength: 1, maxLength: 300 }, hashFuente: { type: ['string', 'null'], pattern: '^[0-9A-F]{64}$' },
          sourceScale: { type: 'integer', enum: [2, 6] }, registros: { type: 'integer', minimum: 0 }, notApplicableAprobado: { type: 'boolean' },
          aprobadoPor: { type: ['string', 'null'], maxLength: 100 }, evidencia: { type: ['string', 'null'], maxLength: 500 }, errorCode: { type: ['string', 'null'], maxLength: 100 },
        },
      },
    },
    totales: { type: 'object', additionalProperties: false, required: ['registros', ...totalNames],
      properties: { registros: { type: 'integer', minimum: 0 }, ...Object.fromEntries(totalNames.map(name => [name, moneyA2])) } },
    detalles: { type: 'array', maxItems: 100000, items: {
      type: 'object', additionalProperties: false, required: ['dominio', 'orden', 'claveFilaHash', 'sourceScale', 'importeOficialD6', 'payloadCanonico', 'hashFila'],
      properties: { dominio: { type: 'string', enum: ['GUARDERIAS', 'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP'] },
        orden: { type: 'integer', minimum: 1 }, claveFilaHash: hash, sourceScale: { type: 'integer', enum: [2, 6] },
        importeOficialD6: { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' }, payloadCanonico: { type: 'object', additionalProperties: true }, hashFila: hash },
    } },
  },
};

export async function registerLiquidacionQnaRoutes(app: FastifyInstance, appliedReadAuth = requireAuth) {
  app.get('/liquidaciones-qna/aplicadas', {
    onRequest: [rejectLegacySearch],
    preHandler: [appliedReadAuth],
    schema: { description: '[SQL SERVER] Lista paginada de liquidaciones QNA V5 cuya evidencia aplicada es la ultima transicion TERMINADO. El administrador obtiene una lista global si omite el ambito.',
      tags: ['liquidacionQna', 'sql-server'], security, querystring: { type: 'object', additionalProperties: false,
        properties: { ...appliedPeriodProperties, ...appliedScopeProperties, ...appliedPaginationProperties } }, response: qnaAppliedListResponses },
  }, async (request, reply) => {
    try {
      const parsed = QnaAppliedListSchema.safeParse(request.query);
      if (!parsed.success) return reply.code(400).send(fail('Filtros de liquidaciones aplicadas invalidos', 'QNA_PARAMETRO_INVALIDO'));
      const esAdmin = request.user!.roles.some(role => role.toLowerCase() === 'admin');
      const scope = resolveAppliedReadScope(request.user!, parsed.data, esAdmin);
      const query = request.diScope.resolve<ListAppliedQnaQuery>('listAppliedQnaQuery');
      return reply.send(ok(await query.execute({ ...parsed.data, ...scope, esAdmin })));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.get('/liquidaciones-qna/aplicada/resumen', {
    onRequest: [rejectLegacySearch],
    preHandler: [appliedReadAuth],
    schema: { description: '[SQL SERVER] Resumen y totales persistidos del Snapshot oficial V5 aplicado. Un administrador debe indicar ambito si el periodo es ambiguo.',
      tags: ['liquidacionQna', 'sql-server'], security, querystring: { type: 'object', additionalProperties: false, required: ['anio', 'quincena'],
        properties: { ...appliedPeriodProperties, ...appliedScopeProperties } }, response: qnaAppliedSummaryResponses },
  }, async (request, reply) => {
    try {
      const parsed = QnaAppliedSelectionSchema.safeParse(request.query);
      if (!parsed.success) return reply.code(400).send(fail('Seleccion de liquidacion aplicada invalida', 'QNA_PARAMETRO_INVALIDO'));
      const esAdmin = request.user!.roles.some(role => role.toLowerCase() === 'admin');
      const scope = resolveAppliedReadScope(request.user!, parsed.data, esAdmin);
      const query = request.diScope.resolve<GetAppliedQnaSummaryQuery>('getAppliedQnaSummaryQuery');
      const result = await query.execute({ ...parsed.data, ...scope, esAdmin });
      if (!result) return reply.code(404).send(fail('Liquidacion QNA oficial aplicada no encontrada', 'QNA_APLICADA_OFICIAL_NO_ENCONTRADA'));
      return reply.send(ok(result));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.get('/liquidaciones-qna/aplicada/detalles/:dominio', {
    onRequest: [rejectLegacySearch],
    preHandler: [appliedReadAuth],
    schema: { description: '[SQL SERVER] Detalle canonico paginado de uno de los diez dominios del Snapshot oficial V5 aplicado. No recalcula importes.',
      tags: ['liquidacionQna', 'sql-server'], security,
      params: { type: 'object', additionalProperties: false, required: ['dominio'], properties: { dominio: { type: 'string', pattern: '^[A-Za-z]+$' } } },
      querystring: { type: 'object', additionalProperties: false, required: ['anio', 'quincena'],
        properties: { ...appliedPeriodProperties, ...appliedScopeProperties, ...appliedPaginationProperties } }, response: qnaAppliedDetailResponses },
  }, async (request, reply) => {
    try {
      const params = QnaAppliedDomainParamsSchema.safeParse(request.params);
      const parsed = QnaAppliedDetailSchema.safeParse(request.query);
      if (!params.success || !parsed.success) return reply.code(400).send(fail('Detalle de liquidacion aplicada invalido', 'QNA_PARAMETRO_INVALIDO'));
      const esAdmin = request.user!.roles.some(role => role.toLowerCase() === 'admin');
      const scope = resolveAppliedReadScope(request.user!, parsed.data, esAdmin);
      const query = request.diScope.resolve<GetAppliedQnaDetailsQuery>('getAppliedQnaDetailsQuery');
      const result = await query.execute({ ...parsed.data, ...scope, dominio: params.data.dominio, esAdmin });
      if (!result) return reply.code(404).send(fail('Liquidacion QNA oficial aplicada no encontrada', 'QNA_APLICADA_OFICIAL_NO_ENCONTRADA'));
      return reply.send(ok(result));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.post('/liquidaciones-qna/orquestar', {
    preHandler: [requireAuth],
    schema: { description: '[SQL SERVER + FIREBIRD] Crea, aprueba y promueve automáticamente una liquidación QNA con el usuario autenticado cuando las diez fuentes son válidas.', tags: ['liquidacionQna'], security,
      body: { type: 'object', additionalProperties: false, required: ['anio', 'quincena'], properties: {
        entidadId: { type: 'integer', minimum: 1, default: 1 }, anio: { type: 'integer', minimum: 2000, maximum: 9999 }, quincena: { type: 'integer', minimum: 1, maximum: 24 },
        organica0: { type: 'string', pattern: '^\\d{1,2}$' }, organica1: { type: 'string', pattern: '^\\d{1,2}$' },
        organica2: { type: 'string', pattern: '^\\d{1,2}$' }, organica3: { type: 'string', pattern: '^\\d{1,2}$' },
        notApplicableApprovals: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false,
          required: ['dominio', 'motivo', 'evidencia'], properties: {
            dominio: { type: 'string', enum: ['GUARDERIAS', 'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP'] },
            motivo: { type: 'string', minLength: 1, maxLength: 200 }, evidencia: { type: 'string', minLength: 1, maxLength: 250 }
          } } },
      } } },
  }, async (request, reply) => {
    try {
      const body = request.body as Partial<Omit<Parameters<CreateAndPromoteQnaCandidateCommand['execute']>[0], 'usuarioId'>> & { anio: number; quincena: number };
      const scope = resolveOrganicaScope(request.user!, {
        entidadId: body.entidadId,
        organica0: body.organica0,
        organica1: body.organica1,
        organica2: body.organica2,
        organica3: body.organica3,
      });
      const command = request.diScope.resolve<CreateAndPromoteQnaCandidateCommand>('createAndPromoteQnaCandidateCommand');
      return reply.send(ok(await command.execute({
        entidadId: scope.entidadId, anio: body.anio, quincena: body.quincena,
        organica0: scope.organica0, organica1: scope.organica1, organica2: scope.organica2!, organica3: scope.organica3!,
         usuarioId: String(request.user!.sub),
        roles: request.user!.roles,
        notApplicableApprovals: body.notApplicableApprovals,
      })));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.get('/liquidaciones-qna/oficial-actual', {
    preHandler: [requireAuth],
    schema: { description: '[SQL SERVER] Resuelve el snapshot oficial del ámbito exacto para el usuario autenticado.', tags: ['liquidacionQna'], security,
      querystring: { type: 'object', additionalProperties: false, required: ['anio', 'quincena'], properties: {
        entidadId: { type: 'string', pattern: '^[1-9]\\d*$' }, anio: { type: 'string', pattern: '^\\d{4}$' }, quincena: { type: 'string', pattern: '^(?:[1-9]|1\\d|2[0-4])$' },
        organica0: { type: 'string', pattern: '^\\d{1,2}$' }, organica1: { type: 'string', pattern: '^\\d{1,2}$' }, organica2: { type: 'string', pattern: '^\\d{1,2}$' }, organica3: { type: 'string', pattern: '^\\d{1,2}$' },
      } } },
  }, async (request, reply) => {
    try {
      const query = request.query as Record<string, string>;
      const scope = resolveOrganicaScope(request.user!, {
        entidadId: query.entidadId,
        organica0: query.organica0,
        organica1: query.organica1,
        organica2: query.organica2,
        organica3: query.organica3,
      });
      const resolver = request.diScope.resolve<ResolveOfficialQnaSnapshotQuery>('resolveOfficialQnaSnapshotQuery');
      const snapshot = await resolver.executeByScope({ entidadId: scope.entidadId, anio: Number(query.anio), quincena: Number(query.quincena),
        organica0: scope.organica0, organica1: scope.organica1, organica2: scope.organica2!, organica3: scope.organica3! });
      if (!snapshot) return reply.code(404).send(fail('Snapshot oficial no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO'));
      return reply.send(ok({ liquidacionSnapshotId: snapshot.liquidacionSnapshotId }));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.post('/liquidaciones-qna/snapshots', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: { description: '[SQL SERVER] Crea idempotentemente un candidato inmutable de liquidacion QNA.', tags: ['liquidacionQna', 'sql-server', 'admin'], security, body: candidateBody },
  }, async (request, reply) => {
    try {
      const parsed = CreateQnaCandidateSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send(fail('Candidato QNA invalido', 'QNA_PARAMETRO_INVALIDO'));
      const command = request.diScope.resolve<CreateQnaCandidateCommand>('createQnaCandidateCommand');
      const input: CreateQnaCandidateInput = { ...parsed.data, usuarioId: String(request.user!.sub) };
      const result = await command.execute(input);
      return reply.code(result.idempotente ? 200 : 201).send(ok(result));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.post('/liquidaciones-qna/:id/decision', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: { description: '[SQL SERVER] Agrega una decision inmutable al candidato QNA.', tags: ['liquidacionQna', 'sql-server', 'admin'], security, params: idParams,
      body: { type: 'object', additionalProperties: false, required: ['decision'], properties: {
        decision: { type: 'string', enum: ['APROBADO', 'OBSERVADO'] }, comentario: { type: ['string', 'null'], minLength: 1, maxLength: 1000 },
      } } },
  }, async (request, reply) => {
    try {
      const params = QnaIdParamsSchema.safeParse(request.params);
      const body = QnaDecisionSchema.safeParse(request.body);
      if (!params.success || !body.success) return reply.code(400).send(fail('Decision QNA invalida', 'QNA_PARAMETRO_INVALIDO'));
      const command = request.diScope.resolve<AppendQnaDecisionCommand>('appendQnaDecisionCommand');
      return reply.code(201).send(ok(await command.execute(params.data.id, body.data.decision, body.data.comentario, String(request.user!.sub))));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.post('/liquidaciones-qna/:id/promover', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: { description: '[SQL SERVER] Promueve un candidato completo cuya ultima decision sea APROBADO.', tags: ['liquidacionQna', 'sql-server', 'admin'], security, params: idParams,
      body: { type: 'object', additionalProperties: false, properties: { motivo: { type: ['string', 'null'], minLength: 1, maxLength: 500 } } } },
  }, async (request, reply) => {
    try {
      const params = QnaIdParamsSchema.safeParse(request.params);
      const body = QnaPromoteSchema.safeParse(request.body ?? {});
      if (!params.success || !body.success) return reply.code(400).send(fail('Promocion QNA invalida', 'QNA_PARAMETRO_INVALIDO'));
      const command = request.diScope.resolve<PromoteQnaSnapshotCommand>('promoteQnaSnapshotCommand');
      return reply.send(ok(await command.execute(params.data.id, body.data.motivo, String(request.user!.sub))));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.get('/liquidaciones-qna', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: { description: '[SQL SERVER] Lista candidatos de liquidacion QNA.', tags: ['liquidacionQna', 'sql-server', 'admin'], security,
      querystring: { type: 'object', additionalProperties: false, properties: {
        pagina: { type: 'string', pattern: '^[1-9]\\d*$' }, tamanio: { type: 'string', pattern: '^[1-9]\\d*$' },
        entidadId: { type: 'string', pattern: '^[1-9]\\d*$' }, anio: { type: 'string', pattern: '^\\d{4}$' },
        quincena: { type: 'string', pattern: '^(?:[1-9]|1\\d|2[0-4])$' }, estado: { type: 'string', enum: ['COMPLETO', 'INCOMPLETO'] },
      } } },
  }, async (request, reply) => {
    try {
      const parsed = QnaListSchema.safeParse(request.query);
      if (!parsed.success) return reply.code(400).send(fail('Filtros QNA invalidos', 'QNA_PARAMETRO_INVALIDO'));
      const query = request.diScope.resolve<ListQnaSnapshotsQuery>('listQnaSnapshotsQuery');
      return reply.send(ok(await query.execute(parsed.data)));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });

  app.get('/liquidaciones-qna/:id', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: { description: '[SQL SERVER] Obtiene candidato, fuentes, totales, ultima decision y marca oficial.', tags: ['liquidacionQna', 'sql-server', 'admin'], security, params: idParams },
  }, async (request, reply) => {
    try {
      const parsed = QnaIdParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send(fail('ID QNA invalido', 'QNA_PARAMETRO_INVALIDO'));
      const query = request.diScope.resolve<GetQnaSnapshotQuery>('getQnaSnapshotQuery');
      const result = await query.execute(parsed.data.id);
      if (!result) return reply.code(404).send(fail('Snapshot QNA no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO'));
      return reply.send(ok(result));
    } catch (error) { return handleLiquidacionQnaError(error, request, reply); }
  });
}

export default async function liquidacionQnaRoutes(app: FastifyInstance) {
  return registerLiquidacionQnaRoutes(app, requireAuth);
}

function resolveAppliedReadScope(
  user: NonNullable<Parameters<typeof resolveOrganicaScope>[0]>,
  requested: { entidadId?: number; organica0?: string; organica1?: string; organica2?: string; organica3?: string },
  isAdmin: boolean
) {
  if (isAdmin && requested.entidadId === undefined) return {};
  return resolveOrganicaScope(user, requested);
}
