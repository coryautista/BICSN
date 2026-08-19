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
import { handleLiquidacionQnaError } from './infrastructure/errorHandler.js';
import {
  CreateQnaCandidateSchema, QnaDecisionSchema, QnaIdParamsSchema, QnaListSchema, QnaPromoteSchema,
} from './liquidacionQna.schemas.js';

const idParams = { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string', pattern: '^[1-9]\\d*$' } } };
const security = [{ bearerAuth: [] }];
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

export default async function liquidacionQnaRoutes(app: FastifyInstance) {
  app.post('/liquidaciones-qna/orquestar', {
    preHandler: [requireAuth],
    schema: { description: '[SQL SERVER + FIREBIRD] Crea, aprueba y promueve automáticamente una liquidación QNA con el usuario autenticado cuando las diez fuentes son válidas.', tags: ['liquidacionQna'], security,
      body: { type: 'object', additionalProperties: false, required: ['anio', 'quincena'], properties: {
        entidadId: { type: 'integer', minimum: 1, default: 1 }, anio: { type: 'integer', minimum: 2000, maximum: 9999 }, quincena: { type: 'integer', minimum: 1, maximum: 24 },
        organica0: { type: 'string', pattern: '^\\d{1,2}$' }, organica1: { type: 'string', pattern: '^\\d{1,2}$' },
        organica2: { type: 'string', pattern: '^\\d{1,2}$' }, organica3: { type: 'string', pattern: '^\\d{1,2}$' },
        computadoraAntiguaHip: { type: 'boolean', default: false },
      } } },
  }, async (request, reply) => {
    try {
      const body = request.body as Partial<Omit<Parameters<CreateAndPromoteQnaCandidateCommand['execute']>[0], 'usuarioId'>> & { anio: number; quincena: number };
      const isEntidad = request.user?.entidades?.[0] === true;
      const organica0 = isEntidad ? request.user?.idOrganica0 : body.organica0 ?? request.user?.idOrganica0;
      const organica1 = isEntidad ? request.user?.idOrganica1 : body.organica1 ?? request.user?.idOrganica1;
      const organica2 = isEntidad ? request.user?.idOrganica2 ?? '01' : body.organica2 ?? request.user?.idOrganica2 ?? '01';
      const organica3 = isEntidad ? request.user?.idOrganica3 ?? '01' : body.organica3 ?? request.user?.idOrganica3 ?? '01';
      if (!organica0 || !organica1) return reply.code(400).send(fail('Orgánicas no disponibles', 'QNA_ORGANICA_REQUERIDA'));
      const command = request.diScope.resolve<CreateAndPromoteQnaCandidateCommand>('createAndPromoteQnaCandidateCommand');
      return reply.send(ok(await command.execute({
        entidadId: isEntidad ? 1 : body.entidadId ?? 1, anio: body.anio, quincena: body.quincena,
        organica0: String(organica0), organica1: String(organica1), organica2: String(organica2), organica3: String(organica3),
        computadoraAntiguaHip: body.computadoraAntiguaHip, usuarioId: String(request.user!.sub),
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
      const isEntidad = request.user?.entidades?.[0] === true;
      const organica0 = isEntidad ? request.user?.idOrganica0 : query.organica0 ?? request.user?.idOrganica0;
      const organica1 = isEntidad ? request.user?.idOrganica1 : query.organica1 ?? request.user?.idOrganica1;
      const organica2 = isEntidad ? request.user?.idOrganica2 ?? '01' : query.organica2 ?? request.user?.idOrganica2 ?? '01';
      const organica3 = isEntidad ? request.user?.idOrganica3 ?? '01' : query.organica3 ?? request.user?.idOrganica3 ?? '01';
      if (!organica0 || !organica1) return reply.code(400).send(fail('Orgánicas no disponibles', 'QNA_ORGANICA_REQUERIDA'));
      const resolver = request.diScope.resolve<ResolveOfficialQnaSnapshotQuery>('resolveOfficialQnaSnapshotQuery');
      const snapshot = await resolver.executeByScope({ entidadId: isEntidad ? 1 : Number(query.entidadId ?? 1), anio: Number(query.anio), quincena: Number(query.quincena),
        organica0: String(organica0).padStart(2, '0'), organica1: String(organica1).padStart(2, '0'), organica2: String(organica2).padStart(2, '0'), organica3: String(organica3).padStart(2, '0') });
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
