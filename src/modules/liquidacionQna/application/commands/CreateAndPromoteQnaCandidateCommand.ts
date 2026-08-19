import { createHash } from 'node:crypto';
import { env } from '../../../../config/env.js';
import { resolveDatabaseEnvironment } from '../../../../config/databaseEnvironments.js';
import type { IAportacionFondoRepository } from '../../../aportacionesFondos/domain/repositories/IAportacionFondoRepository.js';
import type { GetSnapshotCalculoV2Query } from '../../../aportacionesFondos/application/queries/GetSnapshotCalculoV2Query.js';
import type { GetSnapshotCalculoV2OfficialQuery } from '../../../aportacionesFondos/application/queries/GetSnapshotCalculoV2OfficialQuery.js';
import type { CreateSnapshotCalculoV2DecisionCommand } from '../../../aportacionesFondos/application/commands/CreateSnapshotCalculoV2DecisionCommand.js';
import { sumD6ToA2 } from '../../../aportacionesFondos/domain/entities/PrestamoMoney.js';
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

export interface CreateAndPromoteQnaCandidateInput {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  usuarioId: string;
  computadoraAntiguaHip?: boolean;
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
    private aportacionFondoRepo: IAportacionFondoRepository,
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

    const periodo = `${String(scope.quincena).padStart(2, '0')}${String(scope.anio).slice(-2)}`;
    const [guarderias, transitorio, aguinaldo, pcp, pmp, hip] = await Promise.all([
      this.aportacionFondoRepo.obtenerAportacionGuarderias(scope.organica0, scope.organica1, periodo),
      this.aportacionFondoRepo.obtenerPensionNominaTransitorio('04', '60', scope.organica0, scope.organica1, periodo),
      this.aportacionFondoRepo.obtenerAguinaldo(scope.organica0, scope.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamos(scope.organica0, scope.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamosMedianoPlazo(scope.organica0, scope.organica1, periodo),
      this.aportacionFondoRepo.obtenerPrestamosHipotecarios(scope.organica0, scope.organica1, periodo, input.computadoraAntiguaHip ?? false),
    ]);

    const sourceContext = `${periodo}:${scope.organica0}:${scope.organica1}`;
    const sourceInputs = [
      detailSource('GUARDERIAS', 'EBI2_RECIBOS_IMPRIMIR', guarderias.map(row => ({
        key: [row.titular_no_empleado, row.titular_rfc, row.recibo_folio, row.menor_id],
        amountD6: row.recibo_total_d6,
        payload: { titularNoEmpleado: row.titular_no_empleado, rfc: row.titular_rfc, reciboFolio: row.recibo_folio, menorId: row.menor_id, reciboTotalD6: row.recibo_total_d6 },
      })), ambiente, sourceContext, input.usuarioId, 6),
      detailSource('TRANSITORIO', 'PENSION_NOMINA_QNAL_TRANSITORIO', transitorio.map(row => ({
        key: [row.interno, row.rfc, row.cconcepto], amountD6: row.total_d6,
        payload: { interno: row.interno, rfc: row.rfc, concepto: row.cconcepto, totalD6: row.total_d6 },
      })), ambiente, `04:60:${scope.organica0}:${scope.organica1}:${periodo}`, input.usuarioId, 6),
      detailSource('AGUINALDO', 'AGUINALDO_ORGANICAS', aguinaldo.map(row => ({
        key: [row.interno, row.rfc, row.movimiento], amountD6: row.general_d6,
        payload: { interno: row.interno, rfc: row.rfc, movimiento: row.movimiento, generalD6: row.general_d6 },
      })), ambiente, sourceContext, input.usuarioId, 6),
      detailSource('PCP', 'AP_S_PCP', pcp.map(row => ({
        key: [row.interno, row.prestamo, row.letra], amountD6: requiredD6(row.total_d6, 'PCP'),
        payload: { interno: row.interno, rfc: row.rfc, prestamo: row.prestamo, letra: row.letra, plazo: row.plazo, totalD6: requiredD6(row.total_d6, 'PCP') },
      })), ambiente, sourceContext, input.usuarioId, 2),
      detailSource('PMP', 'AP_S_VIV', pmp.map(row => ({
        key: [row.interno, row.prestamo, row.letra, row.folio], amountD6: requiredD6(row.total_d6, 'PMP'),
        payload: { interno: row.interno, rfc: row.rfc, prestamo: row.prestamo, letra: row.letra, folio: row.folio, totalD6: requiredD6(row.total_d6, 'PMP') },
      })), ambiente, sourceContext, input.usuarioId, 2),
      detailSource('HIP', input.computadoraAntiguaHip ? 'AP_S_COMP_QNA' : 'AP_S_HIP_QNA', hip.map(row => ({
        key: [row.interno, row.pno_solicitud, row.pano], amountD6: requiredD6(row.cantidad_d6, 'HIP'),
        payload: { interno: row.interno, rfc: row.rfc, solicitud: row.pno_solicitud, anio: row.pano, cantidadD6: requiredD6(row.cantidad_d6, 'HIP') },
      })), ambiente, sourceContext, input.usuarioId, 2),
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
        ...sourceInputs.map(source => source.source),
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
      detalles: sourceInputs.flatMap(source => source.details),
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

type CanonicalRow = { key: unknown[]; amountD6: string; payload: Record<string, unknown> };

function detailSource(domain: QnaSourceDetail['dominio'], name: string, rows: CanonicalRow[], environment: string, sourceContext: string, usuarioId: string, sourceScale: 2 | 6) {
  const sorted = rows.map(row => ({ ...row, keyHash: hash(row.key), rowHash: hash(row.payload) }))
    .sort((left, right) => left.keyHash.localeCompare(right.keyHash) || left.rowHash.localeCompare(right.rowHash));
  const details: QnaSourceDetail[] = sorted.map((row, index) => ({
    dominio: domain,
    orden: index + 1,
    claveFilaHash: row.keyHash,
    sourceScale,
    importeOficialD6: requiredD6(row.amountD6, domain),
    payloadCanonico: row.payload,
    hashFila: row.rowHash,
  }));
  const source: QnaSource = rows.length > 0 ? {
    dominio: domain, tipoFuente: 'FIREBIRD', estado: 'COMPLETE', requerida: true,
    identificadorFuente: `FIREBIRD:${name}:${environment}:${sourceContext}`,
    hashFuente: hash(details.map(row => [row.claveFilaHash, row.hashFila])), sourceScale,
    registros: rows.length, notApplicableAprobado: false, aprobadoPor: null, evidencia: null, errorCode: null,
  } : {
    dominio: domain, tipoFuente: 'FIREBIRD', estado: 'NOT_APPLICABLE', requerida: true,
    identificadorFuente: `FIREBIRD:${name}:${environment}:${sourceContext}`,
    hashFuente: null, sourceScale, registros: 0, notApplicableAprobado: true,
    aprobadoPor: 'AUTOMATICO', evidencia: `Consulta ${name} sin filas para ${sourceContext}`, errorCode: null,
  };
  return { source, details, totalA2: sumD6ToA2(rows.map(row => requiredD6(row.amountD6, domain))) };
}

function requiredD6(value: string | null | undefined, domain: string): string {
  if (!/^-?(0|[1-9]\d*)\.\d{6}$/.test(value ?? '')) throw new Error(`QNA_${domain}_D6_INVALIDO`);
  return value!;
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

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value)), 'utf8').digest('hex').toUpperCase();
}

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort()
      .map(key => [key, canonicalize((value as Record<string, unknown>)[key])])) as Record<string, unknown>;
  }
  return value ?? null;
}
