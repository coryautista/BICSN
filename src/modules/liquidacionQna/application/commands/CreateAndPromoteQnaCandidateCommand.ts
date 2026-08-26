import { env } from '../../../../config/env.js';
import { resolveDatabaseEnvironment } from '../../../../config/databaseEnvironments.js';
import type { GetSnapshotCalculoV2Query } from '../../../aportacionesFondos/application/queries/GetSnapshotCalculoV2Query.js';
import type { GetSnapshotCalculoV2OfficialQuery } from '../../../aportacionesFondos/application/queries/GetSnapshotCalculoV2OfficialQuery.js';
import type { CreateSnapshotCalculoV2DecisionCommand } from '../../../aportacionesFondos/application/commands/CreateSnapshotCalculoV2DecisionCommand.js';
import type {
  CreateQnaCandidateInput,
  QnaDomain,
  QnaSource,
  QnaSourceDetail,
} from '../../domain/entities/LiquidacionQna.js';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import type { CreateQnaCandidateCommand } from './CreateQnaCandidateCommand.js';
import type { AppendQnaDecisionCommand } from './AppendQnaDecisionCommand.js';
import type { PromoteQnaSnapshotCommand } from './PromoteQnaSnapshotCommand.js';
import type { CaptureQnaTenDomainsQuery } from '../queries/CaptureQnaTenDomainsQuery.js';

export interface CreateAndPromoteQnaCandidateInput {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  usuarioId: string;
}

export interface CreateAndPromoteQnaCandidateResult {
  liquidacionSnapshotId: string;
  revision: number;
  hashContenido: string;
  idempotente: boolean;
  promovido: boolean;
}

export class CreateAndPromoteQnaCandidateCommand {
  constructor(
    private captureQnaTenDomainsQuery: CaptureQnaTenDomainsQuery,
    private getSnapshotCalculoV2Query: GetSnapshotCalculoV2Query,
    private getSnapshotCalculoV2OfficialQuery: GetSnapshotCalculoV2OfficialQuery,
    private createSnapshotCalculoV2DecisionCommand: CreateSnapshotCalculoV2DecisionCommand,
    private createQnaCandidateCommand: CreateQnaCandidateCommand,
    private appendQnaDecisionCommand: AppendQnaDecisionCommand,
    private promoteQnaSnapshotCommand: PromoteQnaSnapshotCommand,
    private liquidacionQnaRepo: ILiquidacionQnaRepository,
  ) {}

  async execute(input: CreateAndPromoteQnaCandidateInput): Promise<CreateAndPromoteQnaCandidateResult> {
    const ambiente = resolveDatabaseEnvironment(env.sql.database, env.firebird.database);
    if (!ambiente) throw new Error('DATABASE_ENVIRONMENT_MISMATCH');
    const scope = {
      entidadId: input.entidadId,
      anio: input.anio,
      quincena: input.quincena,
      organica0: normalizeOrganica(input.organica0),
      organica1: normalizeOrganica(input.organica1),
      organica2: normalizeOrganica(input.organica2),
      organica3: normalizeOrganica(input.organica3),
    };
    const latest = await this.getSnapshotCalculoV2Query.execute({
      ...scope,
      fuente: 'LIQUIDACION_V2',
      incluirDetalles: false,
    });
    if (!latest) throw new Error('SNAPSHOT_V2_NO_ENCONTRADO');
    const officialFilter = {
      ...scope,
      fuente: 'LIQUIDACION_V2' as const,
      revision: latest.snapshot.revision,
    };
    let official = await this.getSnapshotCalculoV2OfficialQuery.execute(officialFilter);
    if (!official || official.origen !== 'SNAPSHOT_V2' || !official.snapshot) {
      await this.createSnapshotCalculoV2DecisionCommand.execute(
        latest.snapshot.snapshotId,
        'APROBADO',
        'Aprobación del usuario al confirmar Aplicar quincena',
        input.usuarioId,
      );
      official = await this.getSnapshotCalculoV2OfficialQuery.execute(officialFilter);
    }
    if (!official || official.origen !== 'SNAPSHOT_V2' || !official.snapshot) {
      throw new Error(`SNAPSHOT_V2_NO_APROBADO:${official?.fallback.motivo ?? 'NO_ENCONTRADO'}`);
    }
    if (official.snapshot.snapshotId !== latest.snapshot.snapshotId
      || official.snapshot.hashContenido !== latest.snapshot.hashContenido) {
      throw new Error('SNAPSHOT_V2_CAMBIO_DURANTE_LECTURA');
    }

    const capture = await this.captureQnaTenDomainsQuery.execute({ ...scope, ambiente, usuarioId: input.usuarioId });
    if (capture.formulaCalculoVersionId !== latest.snapshot.formulaCalculoVersionId
        || capture.nominaCargaId !== latest.snapshot.nominaCargaId) {
      throw new Error('QNA_CAPTURA_CARGA_O_FORMULA_DIFIERE_SNAPSHOT_V2');
    }
    const sourceInputs = [
      capture.auxiliares.GUARDERIAS,
      capture.auxiliares.TRANSITORIO,
      capture.auxiliares.AGUINALDO,
      capture.auxiliares.PCP,
      capture.auxiliares.PMP,
      capture.auxiliares.HIP
    ];

    const snapshotSource = (dominio: QnaDomain): QnaSource => ({
      dominio,
      tipoFuente: 'SQL_HISTORICO',
      estado: 'COMPLETE',
      requerida: true,
      identificadorFuente: `aportaciones.SnapshotCalculoV2:${official.snapshot!.snapshotId}:${dominio}`,
      hashFuente: official.snapshot!.hashContenido,
      sourceScale: 6,
      registros: official.snapshot!.registros,
      notApplicableAprobado: false,
      aprobadoPor: null,
      evidencia: null,
      errorCode: null,
    });
    const t = official.totalesA2;
    if (t.FAI === null) throw new Error('SNAPSHOT_V2_FAI_REQUERIDO');
    if (capture.fondos.AHORRO.totalA2 !== t.FAT
        || capture.fondos.VIVIENDA.totalA2 !== t.VIVIENDA
        || capture.fondos.PRESTACIONES.totalA2 !== t.PRESTACIONES
        || capture.fondos.CAIR.totalA2 !== t.CAIR_FONDO
        || capture.fondos.AHORRO.rows.length !== official.snapshot.registros) {
      throw new Error('QNA_CAPTURA_FONDOS_DIFIERE_SNAPSHOT_V2');
    }
    const guarderiasA2 = sourceInputs[0].totalA2;
    const transitorioA2 = sourceInputs[1].totalA2;
    const aguinaldoA2 = sourceInputs[2].totalA2;
    const retencionPcpA2 = sourceInputs[3].totalA2;
    const retencionPmpA2 = sourceInputs[4].totalA2;
    const retencionHipA2 = sourceInputs[5].totalA2;
    const ahorroA2 = t.FAT;
    const viviendaA2 = t.VIVIENDA;
    const prestacionesA2 = t.PRESTACIONES;
    const cairFondoA2 = t.CAIR_FONDO;
    const totalAportacionesA2 = addA2(ahorroA2, viviendaA2, prestacionesA2, cairFondoA2, guarderiasA2, transitorioA2, aguinaldoA2);
    const totalRetencionesA2 = addA2(retencionPcpA2, retencionPmpA2, retencionHipA2);

    const candidateInput: CreateQnaCandidateInput = {
      ...scope,
      ambiente,
      snapshotCalculoV2Id: official.snapshot.snapshotId,
      nominaCargaId: latest.snapshot.nominaCargaId,
      formulaCalculoVersionId: latest.snapshot.formulaCalculoVersionId,
      fuentes: [
        snapshotSource('AHORRO'), snapshotSource('VIVIENDA'), snapshotSource('PRESTACIONES'), snapshotSource('CAIR'),
        ...sourceInputs.map(source => ({ ...source.source })),
      ],
      totales: {
        registros: official.snapshot.registros,
        cairA2: t.CAIR, fraA2: t.FRA, freA2: t.FRE, fhA2: t.FH, fvA2: t.FV,
        faaA2: t.FAA, faeA2: t.FAE, fatA2: t.FAT, faiA2: t.FAI,
        ahorroA2, viviendaA2, prestacionesA2, cairFondoA2, guarderiasA2, transitorioA2, aguinaldoA2,
        retencionPcpA2, retencionPmpA2, retencionHipA2,
        totalAportacionesA2, totalRetencionesA2,
        totalGeneralA2: addA2(totalAportacionesA2, totalRetencionesA2),
      },
      detalles: sourceInputs.flatMap(source => source.details.map(toQnaSourceDetail)),
      usuarioId: input.usuarioId,
    };
    const candidate = await this.createQnaCandidateCommand.execute(candidateInput);
    const persisted = await this.liquidacionQnaRepo.getById(candidate.liquidacionSnapshotId);
    if (!persisted || persisted.estado !== 'COMPLETO' || persisted.fuentesCompletas !== 10) {
      throw new Error('QNA_CANDIDATO_AUTOMATICO_INCOMPLETO');
    }
    if (!persisted.esOficial) {
      if (persisted.ultimaDecision?.decision !== 'APROBADO') {
        await this.appendQnaDecisionCommand.execute(candidate.liquidacionSnapshotId, 'APROBADO', 'Aprobación automática: diez fuentes e invariantes válidos', input.usuarioId);
      }
      await this.promoteQnaSnapshotCommand.execute(candidate.liquidacionSnapshotId, 'Promoción automática validada', input.usuarioId);
    }
    const verified = await this.liquidacionQnaRepo.resolveOfficialById(candidate.liquidacionSnapshotId);
    if (!verified) throw new Error('QNA_PROMOCION_AUTOMATICA_NO_CONFIRMADA');
    return { ...candidate, promovido: true };
  }
}

function toQnaSourceDetail(detail: QnaSourceDetail): QnaSourceDetail {
  return {
    dominio: detail.dominio,
    orden: detail.orden,
    claveFilaHash: detail.claveFilaHash,
    sourceScale: detail.sourceScale,
    importeOficialD6: detail.importeOficialD6,
    payloadCanonico: detail.payloadCanonico,
    hashFila: detail.hashFila
  };
}

function normalizeOrganica(value: string): string {
  const normalized = String(value).trim().padStart(2, '0');
  if (!/^\d{2}$/.test(normalized)) throw new Error('QNA_ORGANICA_INVALIDA');
  return normalized;
}

function addA2(...values: string[]): string {
  const total = values.reduce((sum, value) => {
    if (!/^-?(0|[1-9]\d*)\.\d{2}$/.test(value)) throw new Error('QNA_A2_INVALIDO');
    const negative = value.startsWith('-');
    const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
    const units = BigInt(whole) * 100n + BigInt(fraction);
    return sum + (negative ? -units : units);
  }, 0n);
  const negative = total < 0n;
  const absolute = negative ? -total : total;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
