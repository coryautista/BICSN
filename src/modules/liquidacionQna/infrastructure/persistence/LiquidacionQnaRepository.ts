import sql, { ConnectionPool, Request, Transaction } from 'mssql';
import type { CreateQnaOfficialV5Input, ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import {
  PRECISION_POLICY,
  type CreateQnaCandidateInput,
  type CreateQnaCandidateResult,
  type PromoteQnaResult,
  type QnaDecision,
  type QnaDecisionRecord,
  type QnaListFilter,
  type QnaListResult,
  type QnaSnapshot,
  type QnaSource,
  type QnaSourceDetail,
  type QnaEmployeeDetail,
  type QnaTotals,
  type QnaProcessState,
  type QnaScope,
  type QnaDomain,
} from '../../domain/entities/LiquidacionQna.js';
import type {
  QnaAppliedDetailFilter, QnaAppliedDetailResult, QnaAppliedDetailRow, QnaAppliedListFilter,
  QnaAppliedListItem, QnaAppliedListResult, QnaAppliedMetadata, QnaAppliedSelection,
  QnaAppliedSource, QnaAppliedSummary, QnaAppliedWarning,
} from '../../domain/entities/QnaAppliedRead.js';
import { qnaFail } from '../../domain/errors.js';
import { calculateCanonicalHash, validateQnaCandidate } from '../../domain/services/LiquidacionQnaContracts.js';
import { validateQnaPromotion } from '../../domain/services/QnaPromotionPolicy.js';
import { fundProjection } from '../../domain/services/QnaOfficialSnapshotV5Factory.js';
import { acquireQnaScopeLock } from '../../../../db/qnaScopeLock.js';
import { SnapshotCalculoV2Repository } from '../../../aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js';
import { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } from '../../domain/services/QnaAuxiliaryPayloadV1.js';
import { validateAppliedQnaCandidate } from '../../domain/services/QnaAppliedIntegrity.js';

const TOTAL_COLUMNS: Record<Exclude<keyof QnaTotals, 'registros'>, string> = {
  cairA2: 'CAIRA2', fraA2: 'FRAA2', freA2: 'FREA2', fhA2: 'FHA2', fvA2: 'FVA2',
  faaA2: 'FAAA2', faeA2: 'FAEA2', fatA2: 'FATA2', faiA2: 'FAIA2',
  ahorroA2: 'AhorroA2', viviendaA2: 'ViviendaA2', prestacionesA2: 'PrestacionesA2',
  cairFondoA2: 'CAIRFondoA2',
  guarderiasA2: 'GuarderiasA2', transitorioA2: 'TransitorioA2', aguinaldoA2: 'AguinaldoA2',
  retencionPcpA2: 'RetencionPCPA2', retencionPmpA2: 'RetencionPMPA2', retencionHipA2: 'RetencionHIPA2',
  totalAportacionesA2: 'TotalAportacionesA2', totalRetencionesA2: 'TotalRetencionesA2', totalGeneralA2: 'TotalGeneralA2',
};
const TOTAL_SELECT = Object.entries(TOTAL_COLUMNS).map(([key, column]) => `CONVERT(VARCHAR(40),CAST(t.${column} AS DECIMAL(19,2))) AS ${key}`).join(',');
const APPLIED_CTE = `
  WITH Terminadas AS (
    SELECT tr.QnaProcesoId,tr.LiquidacionSnapshotId,tr.FechaCreacion AS FechaAplicacion,tr.QnaProcesoTransicionId,
      ROW_NUMBER() OVER(PARTITION BY tr.QnaProcesoId ORDER BY tr.FechaCreacion DESC,tr.QnaProcesoTransicionId DESC) AS rn
    FROM liquidacion.QnaProcesoTransicion tr
    JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=tr.LiquidacionSnapshotId AND s.VersionEsquema=5
    WHERE tr.EstadoDestino='TERMINADO' AND tr.LiquidacionSnapshotId IS NOT NULL
  ), Aplicadas AS (
    SELECT p.QnaProcesoId,p.EntidadId,p.Anio,p.Quincena,p.Organica0,p.Organica1,p.Organica2,p.Organica3,
      t.LiquidacionSnapshotId,t.FechaAplicacion,t.QnaProcesoTransicionId
    FROM Terminadas t JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=t.QnaProcesoId
    WHERE t.rn=1
  )`;
const FUND_DOMAINS = new Set<QnaDomain>(['AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR']);
const FUND_AMOUNT_COLUMNS: Record<'AHORRO' | 'VIVIENDA' | 'PRESTACIONES' | 'CAIR', string> = {
  AHORRO: 'FATD6', VIVIENDA: 'ViviendaD6', PRESTACIONES: 'PrestacionesD6', CAIR: 'CAIRFondoD6',
};
const DOMAIN_TOTAL_KEYS: Record<QnaDomain, keyof QnaTotals> = {
  AHORRO: 'ahorroA2', VIVIENDA: 'viviendaA2', PRESTACIONES: 'prestacionesA2', CAIR: 'cairFondoA2',
  GUARDERIAS: 'guarderiasA2', TRANSITORIO: 'transitorioA2', AGUINALDO: 'aguinaldoA2',
  PCP: 'retencionPcpA2', PMP: 'retencionPmpA2', HIP: 'retencionHipA2',
};
const FUND_BUSINESS_SEARCH = `CONCAT_WS('|',d.Interno,d.DiasLaborados,d.DiasOrigen,d.SueldoD6,d.OtrasPrestacionesD6,d.QuinqueniosD6,
  d.SueldoMensualD6,d.BaseCotizacionSueldoD6,d.QuinqueniosMensualD6,d.BaseCotizacionQuinqueniosD6,d.CAIRD6,d.CAIRFondoD6,
  d.FRAD6,d.FRED6,d.PrestacionesD6,d.FHD6,d.FVD6,d.ViviendaD6,d.FAAD6,d.FAED6,d.FATD6,d.FAID6) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'`;
const FUND_DETAIL_SELECT = `d.Orden,d.EmpleadoClave,d.EmpleadoClaveHash,d.Interno,d.Rfc,d.Nombre,d.SourceScale,d.DiasOrigen,d.HashFila,
  CONVERT(VARCHAR(40),CAST(d.DiasLaborados AS DECIMAL(5,2))) DiasLaborados,
  CONVERT(VARCHAR(40),CAST(d.SueldoD6 AS DECIMAL(19,6))) SueldoD6,CONVERT(VARCHAR(40),CAST(d.OtrasPrestacionesD6 AS DECIMAL(19,6))) OtrasPrestacionesD6,
  CONVERT(VARCHAR(40),CAST(d.QuinqueniosD6 AS DECIMAL(19,6))) QuinqueniosD6,CONVERT(VARCHAR(40),CAST(d.SueldoMensualD6 AS DECIMAL(19,6))) SueldoMensualD6,
  CONVERT(VARCHAR(40),CAST(d.BaseCotizacionSueldoD6 AS DECIMAL(19,6))) BaseCotizacionSueldoD6,
  CONVERT(VARCHAR(40),CAST(d.QuinqueniosMensualD6 AS DECIMAL(19,6))) QuinqueniosMensualD6,
  CONVERT(VARCHAR(40),CAST(d.BaseCotizacionQuinqueniosD6 AS DECIMAL(19,6))) BaseCotizacionQuinqueniosD6,
  CONVERT(VARCHAR(40),CAST(d.CAIRD6 AS DECIMAL(19,6))) CairD6,CONVERT(VARCHAR(40),CAST(d.CAIRFondoD6 AS DECIMAL(19,6))) CairFondoD6,
  CONVERT(VARCHAR(40),CAST(d.FRAD6 AS DECIMAL(19,6))) FraD6,CONVERT(VARCHAR(40),CAST(d.FRED6 AS DECIMAL(19,6))) FreD6,
  CONVERT(VARCHAR(40),CAST(d.PrestacionesD6 AS DECIMAL(19,6))) PrestacionesD6,CONVERT(VARCHAR(40),CAST(d.FHD6 AS DECIMAL(19,6))) FhD6,
  CONVERT(VARCHAR(40),CAST(d.FVD6 AS DECIMAL(19,6))) FvD6,CONVERT(VARCHAR(40),CAST(d.ViviendaD6 AS DECIMAL(19,6))) ViviendaD6,
  CONVERT(VARCHAR(40),CAST(d.FAAD6 AS DECIMAL(19,6))) FaaD6,CONVERT(VARCHAR(40),CAST(d.FAED6 AS DECIMAL(19,6))) FaeD6,
  CONVERT(VARCHAR(40),CAST(d.FATD6 AS DECIMAL(19,6))) FatD6,CONVERT(VARCHAR(40),CAST(d.FAID6 AS DECIMAL(19,6))) FaiD6,
  CONVERT(VARCHAR(40),CAST(d.GuarderiasD6 AS DECIMAL(19,6))) GuarderiasD6,CONVERT(VARCHAR(40),CAST(d.TransitorioD6 AS DECIMAL(19,6))) TransitorioD6,
  CONVERT(VARCHAR(40),CAST(d.AguinaldoD6 AS DECIMAL(19,6))) AguinaldoD6,CONVERT(VARCHAR(40),CAST(d.RetencionPCPD6 AS DECIMAL(19,6))) RetencionPcpD6,
  CONVERT(VARCHAR(40),CAST(d.RetencionPMPD6 AS DECIMAL(19,6))) RetencionPmpD6,CONVERT(VARCHAR(40),CAST(d.RetencionHIPD6 AS DECIMAL(19,6))) RetencionHipD6`;
const APPLIED_HEADER_SELECT = `CONVERT(VARCHAR(30),s.LiquidacionSnapshotId) LiquidacionSnapshotId,s.EntidadId,s.Anio,s.Quincena,s.Periodo,
  s.Organica0,s.Organica1,s.Organica2,s.Organica3,s.Ambiente,s.Estado,s.Revision,s.PrecisionPolicy,s.VersionEsquema,s.HashContenido,
  CONVERT(VARCHAR(30),s.SnapshotCalculoV2Id) SnapshotCalculoV2Id,CONVERT(VARCHAR(30),s.NominaCargaId) NominaCargaId,
  CONVERT(VARCHAR(30),s.FormulaCalculoVersionId) FormulaCalculoVersionId,s.FuentesEsperadas,s.FuentesCompletas,s.UsuarioId,s.FechaCreacion`;
type DeferredRead<T> = { resolveAfterCommit: () => T };

function isDeferredRead<T>(value: T | DeferredRead<T>): value is DeferredRead<T> {
  return typeof value === 'object' && value !== null && 'resolveAfterCommit' in value;
}

export class LiquidacionQnaRepository implements ILiquidacionQnaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async createCandidate(input: CreateQnaCandidateInput): Promise<CreateQnaCandidateResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const result = await this.insertCandidate(transaction, input);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async createOfficialV5(input: CreateQnaOfficialV5Input): Promise<CreateQnaCandidateResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const result = await this.createOfficialV5EnTransaccion(transaction, input);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async createOfficialV5FromCapture(
    scope: QnaScope,
    capture: () => Promise<CreateQnaOfficialV5Input>
  ): Promise<CreateQnaCandidateResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      await acquireQnaScopeLock(transaction, scope);
      const input = await capture();
      if (!sameScope(scope, input.snapshotV2)) qnaFail('La captura no pertenece al ambito bloqueado', 'QNA_CAPTURE_AMBITO_INVALIDO', 500);
      const result = await this.createOfficialV5EnTransaccion(transaction, input);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async createOfficialV5EnTransaccion(transaction: Transaction, input: CreateQnaOfficialV5Input): Promise<CreateQnaCandidateResult> {
    await acquireQnaScopeLock(transaction, input.snapshotV2);
    const snapshotRepository = new SnapshotCalculoV2Repository(this.mssqlPool);
    const snapshotV2 = await snapshotRepository.guardarEnTransaccion(transaction, input.snapshotV2);
    if (!input.snapshotV2.usuarioId) qnaFail('Snapshot V5 sin usuario autenticado', 'QNA_USUARIO_REQUERIDO', 500);
    await snapshotRepository.guardarDecisionAprobadaEnTransaccion(transaction, snapshotV2.snapshotId, input.snapshotV2.usuarioId);
    const candidate: CreateQnaCandidateInput = { ...input.candidate, snapshotCalculoV2Id: snapshotV2.snapshotId };
    return this.insertCandidate(transaction, candidate);
  }

  async getById(id: string): Promise<QnaSnapshot | null> {
    const result = await new sql.Request(this.mssqlPool).input('Id', sql.BigInt, id).query(`
      SELECT s.*,${TOTAL_SELECT},t.Registros AS totalRegistros,
        CASE WHEN o.LiquidacionSnapshotId IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS EsOficial
      FROM liquidacion.QnaSnapshot s
      LEFT JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=s.LiquidacionSnapshotId
      LEFT JOIN liquidacion.QnaSnapshotOficialActual o ON o.LiquidacionSnapshotId=s.LiquidacionSnapshotId
      WHERE s.LiquidacionSnapshotId=@Id;
      SELECT * FROM liquidacion.QnaSnapshotFuente WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio;
      SELECT Dominio,Orden,ClaveFilaHash,SourceScale,CONVERT(VARCHAR(40),ImporteOficialD6) AS ImporteOficialD6,
        PayloadCanonico,HashFila,EmpleadoClave,Rfc,Nombre,PayloadVersion
        FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio,Orden;
      SELECT TOP (1) QnaSnapshotDecisionId,Decision,PoliticaVersion,Comentario,UsuarioId,FechaCreacion
        FROM liquidacion.QnaSnapshotDecision WHERE LiquidacionSnapshotId=@Id ORDER BY FechaCreacion DESC,QnaSnapshotDecisionId DESC;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    if (!sets[0][0]) return null;
    if (sets[0][0].totalRegistros === null) qnaFail('Snapshot sin total', 'QNA_INTEGRIDAD_INVALIDA', 500);
    return this.mapSnapshot(sets[0][0], sets[1], sets[2], sets[3][0] ?? null);
  }

  async list(filter: QnaListFilter): Promise<QnaListResult> {
    const request = new sql.Request(this.mssqlPool)
      .input('EntidadId', sql.Int, filter.entidadId ?? null).input('Anio', sql.SmallInt, filter.anio ?? null)
      .input('Quincena', sql.TinyInt, filter.quincena ?? null).input('Estado', sql.VarChar(20), filter.estado ?? null)
      .input('Offset', sql.Int, (filter.pagina - 1) * filter.tamanio).input('Tamanio', sql.Int, filter.tamanio);
    const result = await request.query(`
      SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshot
       WHERE (@EntidadId IS NULL OR EntidadId=@EntidadId) AND (@Anio IS NULL OR Anio=@Anio)
         AND (@Quincena IS NULL OR Quincena=@Quincena) AND (@Estado IS NULL OR Estado=@Estado);
      SELECT LiquidacionSnapshotId FROM liquidacion.QnaSnapshot
       WHERE (@EntidadId IS NULL OR EntidadId=@EntidadId) AND (@Anio IS NULL OR Anio=@Anio)
         AND (@Quincena IS NULL OR Quincena=@Quincena) AND (@Estado IS NULL OR Estado=@Estado)
       ORDER BY FechaCreacion DESC,LiquidacionSnapshotId DESC OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const items = await Promise.all(sets[1].map(row => this.getById(String(row.LiquidacionSnapshotId))));
    if (items.some(item => item === null)) qnaFail('Bandeja inconsistente', 'QNA_INTEGRIDAD_INVALIDA', 500);
    return { items: items as QnaSnapshot[], pagina: filter.pagina, tamanio: filter.tamanio, total: Number(sets[0][0].Total) };
  }

  async listApplied(filter: QnaAppliedListFilter, existingTransaction?: Transaction): Promise<QnaAppliedListResult> {
    if (existingTransaction) return this.listAppliedInTransaction(filter, existingTransaction, false) as Promise<QnaAppliedListResult>;
    return this.withAppliedReadTransaction(transaction => this.listAppliedInTransaction(filter, transaction, true));
  }

  private async listAppliedInTransaction(
    filter: QnaAppliedListFilter,
    transaction: Transaction,
    deferMapping: boolean
  ): Promise<QnaAppliedListResult | DeferredRead<QnaAppliedListResult>> {
    const request = this.appliedRequest(filter, transaction)
      .input('Anio', sql.SmallInt, filter.anio ?? null).input('Quincena', sql.TinyInt, filter.quincena ?? null)
      .input('Busqueda', sql.NVarChar(206), searchPattern(filter.buscar))
      .input('Offset', sql.Int, (filter.page - 1) * filter.pageSize).input('Tamanio', sql.Int, filter.pageSize);
    const where = `${this.appliedScopeWhere()} AND (@Anio IS NULL OR a.Anio=@Anio) AND (@Quincena IS NULL OR a.Quincena=@Quincena)
      AND (@Busqueda IS NULL OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=a.LiquidacionSnapshotId
        AND (d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR ${FUND_BUSINESS_SEARCH}))
      OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=a.LiquidacionSnapshotId
        AND (d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.PayloadCanonico COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'))) `;
    const result = await request.query(`${APPLIED_CTE}
      SELECT COUNT(*) AS Total FROM Aplicadas a JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=a.LiquidacionSnapshotId WHERE ${where};
      ${APPLIED_CTE}
      SELECT CONVERT(VARCHAR(30),a.QnaProcesoId) QnaProcesoId,CONVERT(VARCHAR(30),a.LiquidacionSnapshotId) LiquidacionSnapshotId,a.FechaAplicacion FROM Aplicadas a JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=a.LiquidacionSnapshotId
      WHERE ${where} ORDER BY a.Anio DESC,a.Quincena DESC,a.EntidadId,a.Organica0,a.Organica1,a.Organica2,a.Organica3,a.FechaAplicacion DESC,a.QnaProcesoTransicionId DESC
      OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const items = await this.getAppliedBundles(sets[1].map(row => ({ id: String(row.LiquidacionSnapshotId), processId: String(row.QnaProcesoId),
      appliedAt: new Date(row.FechaAplicacion) })), filter.esAdmin, transaction, false, deferMapping);
    const resultMetadata = { page: filter.page, pageSize: filter.pageSize, total: Number(sets[0][0].Total) };
    return isDeferredRead(items)
      ? { resolveAfterCommit: () => ({ items: items.resolveAfterCommit(), ...resultMetadata }) }
      : { items, ...resultMetadata };
  }

  async getAppliedSummary(filter: QnaAppliedSelection, existingTransaction?: Transaction): Promise<QnaAppliedSummary | null> {
    if (existingTransaction) return this.getAppliedSummaryInTransaction(filter, existingTransaction, false) as Promise<QnaAppliedSummary | null>;
    return this.withAppliedReadTransaction(transaction => this.getAppliedSummaryInTransaction(filter, transaction, true));
  }

  private async getAppliedSummaryInTransaction(
    filter: QnaAppliedSelection,
    transaction: Transaction,
    deferMapping: boolean
  ): Promise<QnaAppliedSummary | null | DeferredRead<QnaAppliedSummary>> {
    const selected = await this.selectApplied(filter, transaction);
    if (!selected) return null;
    const items = await this.getAppliedBundles([selected], filter.esAdmin, transaction, true, deferMapping);
    const totals = await this.getAppliedTotals(selected.id, transaction);
    return isDeferredRead(items)
      ? { resolveAfterCommit: () => ({ ...items.resolveAfterCommit()[0], totales: totals }) }
      : { ...items[0], totales: totals };
  }

  async getAppliedDetails(filter: QnaAppliedDetailFilter, existingTransaction?: Transaction): Promise<QnaAppliedDetailResult | null> {
    if (existingTransaction) return this.getAppliedDetailsInTransaction(filter, existingTransaction, false) as Promise<QnaAppliedDetailResult | null>;
    return this.withAppliedReadTransaction(transaction => this.getAppliedDetailsInTransaction(filter, transaction, true));
  }

  private async getAppliedDetailsInTransaction(
    filter: QnaAppliedDetailFilter,
    transaction: Transaction,
    deferMapping: boolean
  ): Promise<QnaAppliedDetailResult | null | DeferredRead<QnaAppliedDetailResult>> {
    const selected = await this.selectApplied(filter, transaction);
    if (!selected) return null;
    const items = await this.getAppliedBundles([selected], filter.esAdmin, transaction, true, deferMapping);
    const totals = await this.getAppliedTotals(selected.id, transaction);
    const pattern = searchPattern(filter.buscar);
    const request = new sql.Request(transaction).input('Id', sql.BigInt, selected.id)
      .input('Dominio', sql.VarChar(30), filter.dominio).input('Busqueda', sql.NVarChar(206), pattern)
      .input('Offset', sql.Int, (filter.page - 1) * filter.pageSize).input('Tamanio', sql.Int, filter.pageSize);
    let result;
    if (FUND_DOMAINS.has(filter.dominio)) {
      const amount = FUND_AMOUNT_COLUMNS[filter.dominio as keyof typeof FUND_AMOUNT_COLUMNS];
      result = await request.query(`
        SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=@Id AND
          (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
            OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR ${FUND_BUSINESS_SEARCH});
        SELECT ${FUND_DETAIL_SELECT},CONVERT(VARCHAR(40),CAST(d.${amount} AS DECIMAL(19,6))) AS ImporteOficialD6 FROM liquidacion.QnaSnapshotDetalle d
        WHERE d.LiquidacionSnapshotId=@Id AND (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR ${FUND_BUSINESS_SEARCH}) ORDER BY d.Orden OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    } else {
      result = await request.query(`
        SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@Id AND d.Dominio=@Dominio AND
          (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
            OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.PayloadCanonico COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~');
        SELECT d.Orden,d.EmpleadoClave,d.Rfc,d.Nombre,d.SourceScale,CONVERT(VARCHAR(40),CAST(d.ImporteOficialD6 AS DECIMAL(19,6))) AS ImporteOficialD6,
          d.PayloadVersion,d.PayloadCanonico,d.ClaveFilaHash,d.HashFila FROM liquidacion.QnaSnapshotFuenteDetalle d
        WHERE d.LiquidacionSnapshotId=@Id AND d.Dominio=@Dominio AND (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.PayloadCanonico COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~')
        ORDER BY d.Orden OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    }
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const resolve = (): QnaAppliedDetailResult => {
      const item = isDeferredRead(items) ? items.resolveAfterCommit()[0] : items[0];
      const details = sets[1].map(row => this.mapAppliedDetail(filter.dominio, row, filter.esAdmin));
      return { ...item, dominio: filter.dominio, totalDominioA2: String(totals[DOMAIN_TOTAL_KEYS[filter.dominio]]), detalles: details,
        page: filter.page, pageSize: filter.pageSize, total: Number(sets[0][0].Total) };
    };
    return deferMapping ? { resolveAfterCommit: resolve } : resolve();
  }

  private async withAppliedReadTransaction<T>(operation: (transaction: Transaction) => Promise<T | DeferredRead<T>>): Promise<T> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const result = await operation(transaction);
      await transaction.commit();
      return isDeferredRead(result) ? result.resolveAfterCommit() : result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  private appliedRequest(scope: Partial<QnaAppliedSelection>, transaction: Transaction): Request {
    return new sql.Request(transaction).input('EntidadId', sql.Int, scope.entidadId ?? null)
      .input('Organica0', sql.Char(2), scope.organica0 ?? null).input('Organica1', sql.Char(2), scope.organica1 ?? null)
      .input('Organica2', sql.Char(2), scope.organica2 ?? null).input('Organica3', sql.Char(2), scope.organica3 ?? null);
  }

  private appliedScopeWhere(): string {
    return `(@EntidadId IS NULL OR a.EntidadId=@EntidadId) AND (@Organica0 IS NULL OR a.Organica0=@Organica0)
      AND (@Organica1 IS NULL OR a.Organica1=@Organica1) AND (@Organica2 IS NULL OR a.Organica2=@Organica2) AND (@Organica3 IS NULL OR a.Organica3=@Organica3)`;
  }

  private async selectApplied(filter: QnaAppliedSelection, transaction: Transaction): Promise<{ id: string; processId: string; appliedAt: Date } | null> {
    const result = await this.appliedRequest(filter, transaction).input('Anio', sql.SmallInt, filter.anio).input('Quincena', sql.TinyInt, filter.quincena).query(`${APPLIED_CTE}
      SELECT CONVERT(VARCHAR(30),a.QnaProcesoId) QnaProcesoId,CONVERT(VARCHAR(30),a.LiquidacionSnapshotId) LiquidacionSnapshotId,a.FechaAplicacion FROM Aplicadas a WHERE a.Anio=@Anio AND a.Quincena=@Quincena AND ${this.appliedScopeWhere()}
      ORDER BY a.FechaAplicacion DESC,a.QnaProcesoTransicionId DESC;`);
    if (result.recordset.length === 0) {
      return null;
    }
    if (result.recordset.length > 1) qnaFail('La liquidacion aplicada es ambigua; especifique el ambito completo', 'QNA_APLICADA_OFICIAL_AMBIGUA', 409);
    return { id: String(result.recordset[0].LiquidacionSnapshotId), processId: String(result.recordset[0].QnaProcesoId), appliedAt: new Date(result.recordset[0].FechaAplicacion) };
  }

  private async getAppliedBundles(
    selections: Array<{ id: string; processId: string; appliedAt: Date }>,
    isAdmin: boolean,
    transaction: Transaction,
    exhaustive = true,
    deferMapping = false
  ): Promise<QnaAppliedListItem[] | DeferredRead<QnaAppliedListItem[]>> {
    if (selections.length === 0) return deferMapping ? { resolveAfterCommit: () => [] } : [];
    const request = new sql.Request(transaction);
    const values = selections.map((selection, index) => {
      request.input(`Id${index}`, sql.BigInt, selection.id).input(`Proceso${index}`, sql.BigInt, selection.processId);
      return `(@Id${index},@Proceso${index})`;
    }).join(',');
    const result = await request.query(`
      WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
      SELECT CONVERT(VARCHAR(30),x.QnaProcesoId) QnaProcesoId,${APPLIED_HEADER_SELECT},(SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=s.LiquidacionSnapshotId) TotalCount,
        (SELECT MAX(t.Registros) FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=s.LiquidacionSnapshotId) TotalRegistros,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId) SourceCount,
        (SELECT COUNT(DISTINCT f.Dominio) FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId) DomainCount,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId) EmployeeCount,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d JOIN aportaciones.SnapshotCalculoV2Detalle vd ON vd.SnapshotDetalleId=d.SnapshotCalculoV2DetalleId
          WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND vd.SnapshotId=s.SnapshotCalculoV2Id) EmployeeLinkCount,
         ${exhaustive ? `(SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d JOIN aportaciones.SnapshotCalculoV2Detalle vd ON vd.SnapshotDetalleId=d.SnapshotCalculoV2DetalleId
          WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND (vd.SnapshotId<>s.SnapshotCalculoV2Id OR EXISTS(
             SELECT d.Orden,d.EmpleadoClaveHash,d.DiasLaborados,d.DiasOrigen,d.SueldoMensualD6,d.OtrasPrestacionesD6,d.QuinqueniosMensualD6,
               d.BaseCotizacionSueldoD6,d.BaseCotizacionQuinqueniosD6,d.CAIRD6,d.FRAD6,d.FRED6,d.FHD6,d.FVD6,d.FAAD6,d.FAED6,d.FATD6,d.FAID6
             EXCEPT SELECT vd.Orden,vd.EmpleadoClaveHash,vd.DiasLaborados,vd.DiasOrigen,vd.SueldoMensualD6,vd.OtrasPrestacionesMensualesD6,vd.QuinqueniosMensualD6,
               vd.BaseCotizacionSueldoD6,vd.BaseCotizacionQuinqueniosD6,vd.CAIRD6,vd.FRAD6,vd.FRED6,vd.FHD6,vd.FVD6,vd.FAAD6,vd.FAED6,vd.FATD6,vd.FAID6)))` : 'CAST(0 AS INT)'} EmployeeSemanticMismatch,
        v.EntidadId V2EntidadId,v.Anio V2Anio,v.Quincena V2Quincena,v.Organica0 V2Organica0,v.Organica1 V2Organica1,v.Organica2 V2Organica2,v.Organica3 V2Organica3,
        v.VersionEsquema V2VersionEsquema,v.Estado V2Estado,v.PrecisionPolicy V2PrecisionPolicy,v.Ambiente V2Ambiente,
        CONVERT(VARCHAR(30),v.NominaCargaId) V2NominaCargaId,CONVERT(VARCHAR(30),v.FormulaCalculoVersionId) V2FormulaCalculoVersionId,
        p.EntidadId ProcessEntidadId,p.Anio ProcessAnio,p.Quincena ProcessQuincena,
        p.Organica0 ProcessOrganica0,p.Organica1 ProcessOrganica1,p.Organica2 ProcessOrganica2,p.Organica3 ProcessOrganica3
      FROM Seleccion x JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=x.LiquidacionSnapshotId
      JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=x.QnaProcesoId JOIN aportaciones.SnapshotCalculoV2 v ON v.SnapshotId=s.SnapshotCalculoV2Id;
      WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
      SELECT x.QnaProcesoId,f.*,(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio) DetailCount
      FROM Seleccion x JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=x.LiquidacionSnapshotId ORDER BY x.QnaProcesoId,f.Dominio;
      WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
      SELECT x.QnaProcesoId,x.LiquidacionSnapshotId,p.Estado,p.Detalle,r.Dominio,r.Estado ReconciliacionEstado,r.Diferencias,r.ErrorDetalle
      FROM Seleccion x JOIN liquidacion.QnaLegacyProjection p ON p.LiquidacionSnapshotId=x.LiquidacionSnapshotId
      LEFT JOIN liquidacion.QnaLegacyReconciliacion r ON r.QnaLegacyProjectionId=p.QnaLegacyProjectionId
       WHERE p.Estado IN('WARNING','ERROR') OR r.Estado IN('WARNING','ERROR') ORDER BY x.QnaProcesoId,r.QnaLegacyReconciliacionId;
       ${exhaustive ? `WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
       SELECT x.QnaProcesoId,t.Registros,${TOTAL_SELECT} FROM Seleccion x JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=x.LiquidacionSnapshotId;
       WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
      SELECT x.QnaProcesoId,d.LiquidacionSnapshotId,d.Dominio,d.Orden,d.ClaveFilaHash,d.SourceScale,
        CONVERT(VARCHAR(40),CAST(d.ImporteOficialD6 AS DECIMAL(19,6))) ImporteOficialD6,d.PayloadCanonico,d.HashFila,d.EmpleadoClave,d.Rfc,d.Nombre,d.PayloadVersion
      FROM Seleccion x JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=x.LiquidacionSnapshotId ORDER BY x.QnaProcesoId,d.Dominio,d.Orden;
      WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS (SELECT * FROM (VALUES ${values}) v(LiquidacionSnapshotId,QnaProcesoId))
      SELECT x.QnaProcesoId,d.LiquidacionSnapshotId,d.Orden,d.EmpleadoClave,d.EmpleadoClaveHash,d.Interno,d.Rfc,d.Nombre,d.SourceScale,d.DiasOrigen,d.HashFila,
        CONVERT(VARCHAR(40),CAST(d.DiasLaborados AS DECIMAL(5,2))) DiasLaborados,
        CONVERT(VARCHAR(40),CAST(d.SueldoD6 AS DECIMAL(19,6))) SueldoD6,CONVERT(VARCHAR(40),CAST(d.OtrasPrestacionesD6 AS DECIMAL(19,6))) OtrasPrestacionesD6,
        CONVERT(VARCHAR(40),CAST(d.QuinqueniosD6 AS DECIMAL(19,6))) QuinqueniosD6,CONVERT(VARCHAR(40),CAST(d.SueldoMensualD6 AS DECIMAL(19,6))) SueldoMensualD6,
        CONVERT(VARCHAR(40),CAST(d.BaseCotizacionSueldoD6 AS DECIMAL(19,6))) BaseCotizacionSueldoD6,
        CONVERT(VARCHAR(40),CAST(d.QuinqueniosMensualD6 AS DECIMAL(19,6))) QuinqueniosMensualD6,
        CONVERT(VARCHAR(40),CAST(d.BaseCotizacionQuinqueniosD6 AS DECIMAL(19,6))) BaseCotizacionQuinqueniosD6,
        CONVERT(VARCHAR(40),CAST(d.CAIRD6 AS DECIMAL(19,6))) CairD6,CONVERT(VARCHAR(40),CAST(d.CAIRFondoD6 AS DECIMAL(19,6))) CairFondoD6,
        CONVERT(VARCHAR(40),CAST(d.FRAD6 AS DECIMAL(19,6))) FraD6,CONVERT(VARCHAR(40),CAST(d.FRED6 AS DECIMAL(19,6))) FreD6,
        CONVERT(VARCHAR(40),CAST(d.PrestacionesD6 AS DECIMAL(19,6))) PrestacionesD6,CONVERT(VARCHAR(40),CAST(d.FHD6 AS DECIMAL(19,6))) FhD6,
        CONVERT(VARCHAR(40),CAST(d.FVD6 AS DECIMAL(19,6))) FvD6,CONVERT(VARCHAR(40),CAST(d.ViviendaD6 AS DECIMAL(19,6))) ViviendaD6,
        CONVERT(VARCHAR(40),CAST(d.FAAD6 AS DECIMAL(19,6))) FaaD6,CONVERT(VARCHAR(40),CAST(d.FAED6 AS DECIMAL(19,6))) FaeD6,
        CONVERT(VARCHAR(40),CAST(d.FATD6 AS DECIMAL(19,6))) FatD6,CONVERT(VARCHAR(40),CAST(d.FAID6 AS DECIMAL(19,6))) FaiD6,
        CONVERT(VARCHAR(40),CAST(d.GuarderiasD6 AS DECIMAL(19,6))) GuarderiasD6,CONVERT(VARCHAR(40),CAST(d.TransitorioD6 AS DECIMAL(19,6))) TransitorioD6,
        CONVERT(VARCHAR(40),CAST(d.AguinaldoD6 AS DECIMAL(19,6))) AguinaldoD6,CONVERT(VARCHAR(40),CAST(d.RetencionPCPD6 AS DECIMAL(19,6))) RetencionPcpD6,
         CONVERT(VARCHAR(40),CAST(d.RetencionPMPD6 AS DECIMAL(19,6))) RetencionPmpD6,CONVERT(VARCHAR(40),CAST(d.RetencionHIPD6 AS DECIMAL(19,6))) RetencionHipD6
       FROM Seleccion x JOIN liquidacion.QnaSnapshotDetalle d ON d.LiquidacionSnapshotId=x.LiquidacionSnapshotId ORDER BY x.QnaProcesoId,d.Orden;` : ''}`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const headers = new Map(sets[0].map(row => [`${row.LiquidacionSnapshotId}:${row.QnaProcesoId}`, row]));
    const sourcesBySelection = new Map<string, Array<Record<string, any>>>();
    const projectionsBySelection = new Map<string, Array<Record<string, any>>>();
    const totalsByProcess = new Map<string, Array<Record<string, any>>>();
    const auxiliaryBySelection = new Map<string, Array<Record<string, any>>>();
    const employeesBySelection = new Map<string, Array<Record<string, any>>>();
    for (const [rows, target, keyOf] of [
      [sets[1], sourcesBySelection, (row: Record<string, any>) => `${row.LiquidacionSnapshotId}:${row.QnaProcesoId}`],
      [sets[2], projectionsBySelection, (row: Record<string, any>) => `${row.LiquidacionSnapshotId}:${row.QnaProcesoId}`],
      [sets[3] ?? [], totalsByProcess, (row: Record<string, any>) => String(row.QnaProcesoId)],
      [sets[4] ?? [], auxiliaryBySelection, (row: Record<string, any>) => `${row.LiquidacionSnapshotId}:${row.QnaProcesoId}`],
      [sets[5] ?? [], employeesBySelection, (row: Record<string, any>) => `${row.LiquidacionSnapshotId}:${row.QnaProcesoId}`],
    ] as const) {
      for (const row of rows) {
        const key = keyOf(row);
        const grouped = target.get(key) ?? [];
        grouped.push(row);
        target.set(key, grouped);
      }
    }
    const resolve = (): QnaAppliedListItem[] => selections.map(selection => {
      const key = `${selection.id}:${selection.processId}`;
      const header = headers.get(key);
      if (!header) qnaFail('Evidencia TERMINADO sin snapshot', 'QNA_APLICADA_INTEGRIDAD_INVALIDA', 500);
      const sources = sourcesBySelection.get(key) ?? [];
      const projections = projectionsBySelection.get(key) ?? [];
      this.assertAppliedIntegrity(header, sources, exhaustive);
      if (exhaustive) this.assertAppliedSemanticIntegrity(header, sources, totalsByProcess.get(selection.processId) ?? [],
        auxiliaryBySelection.get(key) ?? [], employeesBySelection.get(key) ?? []);
      return { ...this.mapAppliedMetadata(header, selection.appliedAt), fuentes: sources.map(row => this.mapAppliedSource(row, isAdmin)),
        advertencias: this.mapWarnings(sources, projections) };
    });
    return deferMapping ? { resolveAfterCommit: resolve } : resolve();
  }

  private assertAppliedIntegrity(header: Record<string, any>, sources: Array<Record<string, any>>, exhaustive: boolean): void {
    const sameScope = Number(header.EntidadId) === Number(header.ProcessEntidadId) && Number(header.Anio) === Number(header.ProcessAnio)
      && Number(header.Quincena) === Number(header.ProcessQuincena) && ['0', '1', '2', '3'].every(level => String(header[`Organica${level}`]) === String(header[`ProcessOrganica${level}`]));
    const sameV2Scope = Number(header.EntidadId) === Number(header.V2EntidadId) && Number(header.Anio) === Number(header.V2Anio)
      && Number(header.Quincena) === Number(header.V2Quincena) && ['0', '1', '2', '3'].every(level => String(header[`Organica${level}`]) === String(header[`V2Organica${level}`]));
    const expectedDomains = new Set(['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP']);
    const sourceCountsValid = sources.every(source => {
      const complete = Boolean(source.Requerida) && source.Estado === 'COMPLETE' && Number(source.Registros) > 0 && source.HashFuente != null;
      const notApplicable = Boolean(source.Requerida) && source.Estado === 'NOT_APPLICABLE' && Number(source.Registros) === 0
        && Boolean(source.NotApplicableAprobado) && source.AprobadoPor != null && source.Evidencia != null;
      return expectedDomains.delete(String(source.Dominio)) && (complete || notApplicable)
        && Number(source.Registros) === (FUND_DOMAINS.has(source.Dominio) ? Number(header.EmployeeCount) : Number(source.DetailCount));
    });
    if (Number(header.VersionEsquema) !== 5 || header.Estado !== 'COMPLETO' || header.SnapshotCalculoV2Id == null || !sameScope || !sameV2Scope
      || header.NominaCargaId == null || header.FormulaCalculoVersionId == null || header.PrecisionPolicy !== PRECISION_POLICY
      || Number(header.V2VersionEsquema) !== 5 || header.V2Estado !== 'COMPLETO' || header.V2PrecisionPolicy !== PRECISION_POLICY
      || header.V2Ambiente !== header.Ambiente || String(header.V2NominaCargaId) !== String(header.NominaCargaId)
      || String(header.V2FormulaCalculoVersionId) !== String(header.FormulaCalculoVersionId)
      || Number(header.TotalCount) !== 1 || Number(header.SourceCount) !== 10 || Number(header.DomainCount) !== 10 || expectedDomains.size !== 0
      || Number(header.FuentesEsperadas) !== 10 || Number(header.FuentesCompletas) !== 10 || Number(header.EmployeeCount) !== Number(header.TotalRegistros)
       || Number(header.EmployeeLinkCount) !== Number(header.EmployeeCount) || (exhaustive && Number(header.EmployeeSemanticMismatch) !== 0) || !sourceCountsValid) {
      qnaFail('La evidencia oficial V5 aplicada no cumple integridad', 'QNA_APLICADA_INTEGRIDAD_INVALIDA', 500);
    }
  }

  private assertAppliedSemanticIntegrity(
    header: Record<string, any>, sourceRows: Array<Record<string, any>>, totalRows: Array<Record<string, any>>,
    auxiliaryRows: Array<Record<string, any>>, employeeRows: Array<Record<string, any>>
  ): void {
    try {
      if (totalRows.length !== 1 || header.NominaCargaId == null || header.FormulaCalculoVersionId == null || header.SnapshotCalculoV2Id == null) throw new Error('links');
      const sources = sourceRows.map(row => ({
        dominio: row.Dominio, tipoFuente: row.TipoFuente, estado: row.Estado, requerida: Boolean(row.Requerida),
        identificadorFuente: String(row.IdentificadorFuente), hashFuente: row.HashFuente === null ? null : String(row.HashFuente), sourceScale: Number(row.SourceScale),
        registros: Number(row.Registros), notApplicableAprobado: Boolean(row.NotApplicableAprobado), aprobadoPor: row.AprobadoPor === null ? null : String(row.AprobadoPor),
        evidencia: row.Evidencia === null ? null : String(row.Evidencia), errorCode: row.ErrorCode === null ? null : String(row.ErrorCode),
      })) as QnaSource[];
      const details = auxiliaryRows.map(row => ({ dominio: row.Dominio, orden: Number(row.Orden), claveFilaHash: String(row.ClaveFilaHash),
        sourceScale: Number(row.SourceScale), importeOficialD6: String(row.ImporteOficialD6), payloadCanonico: JSON.parse(String(row.PayloadCanonico)),
        hashFila: String(row.HashFila), empleadoClave: String(row.EmpleadoClave), rfc: row.Rfc === null ? null : String(row.Rfc), nombre: String(row.Nombre), payloadVersion: 1 as const,
      })) as QnaSourceDetail[];
      const totalRow = totalRows[0];
      const totals = { registros: Number(totalRow.Registros) } as QnaTotals;
      for (const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>) totals[key] = String(totalRow[key]);
      const employeeDetails = employeeRows.map(row => this.mapEmployeeDetail(row));
      const persisted: CreateQnaCandidateInput = {
        entidadId: Number(header.EntidadId), anio: Number(header.Anio), quincena: Number(header.Quincena), organica0: String(header.Organica0),
        organica1: String(header.Organica1), organica2: String(header.Organica2), organica3: String(header.Organica3), ambiente: header.Ambiente,
        snapshotCalculoV2Id: String(header.SnapshotCalculoV2Id), nominaCargaId: String(header.NominaCargaId), formulaCalculoVersionId: String(header.FormulaCalculoVersionId),
        fuentes: sources, totales: totals, detalles: details, usuarioId: header.UsuarioId === null ? null : String(header.UsuarioId), versionEsquema: 5, detallesEmpleado: employeeDetails,
      };
      validateAppliedQnaCandidate(persisted,String(header.HashContenido));
    } catch {
      qnaFail('La evidencia oficial V5 aplicada no cumple integridad', 'QNA_APLICADA_INTEGRIDAD_INVALIDA', 500);
    }
  }

  private mapAppliedMetadata(row: Record<string, any>, appliedAt: Date): QnaAppliedMetadata {
    return { liquidacionSnapshotId: String(row.LiquidacionSnapshotId), entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena),
      periodo: String(row.Periodo), organica0: String(row.Organica0), organica1: String(row.Organica1), organica2: String(row.Organica2), organica3: String(row.Organica3),
      ambiente: row.Ambiente, revision: Number(row.Revision), snapshotCalculoV2Id: String(row.SnapshotCalculoV2Id), nominaCargaId: String(row.NominaCargaId),
      formulaCalculoVersionId: String(row.FormulaCalculoVersionId), precisionPolicy: String(row.PrecisionPolicy), hashContenido: String(row.HashContenido),
      fechaAplicacion: appliedAt.toISOString(), fechaCreacion: new Date(row.FechaCreacion).toISOString(),
      fuente: 'SNAPSHOT_OFICIAL', estadoProceso: 'TERMINADO', reconstructionStrategy: null };
  }

  private mapAppliedSource(row: Record<string, any>, isAdmin: boolean): QnaAppliedSource {
    return { dominio: row.Dominio, tipoFuente: row.TipoFuente, estado: row.Estado, requerida: Boolean(row.Requerida), sourceScale: Number(row.SourceScale) as 2 | 6,
      registros: Number(row.Registros), notApplicableAprobado: Boolean(row.NotApplicableAprobado), errorCode: row.ErrorCode === null ? null : String(row.ErrorCode),
      ...(isAdmin ? { identificadorFuente: String(row.IdentificadorFuente), hashFuente: row.HashFuente === null ? null : String(row.HashFuente),
        aprobadoPor: row.AprobadoPor === null ? null : String(row.AprobadoPor), evidencia: row.Evidencia === null ? null : String(row.Evidencia) } : {}) };
  }

  private mapWarnings(sourceRows: Array<Record<string, any>>, projectionRows: Array<Record<string, any>>): QnaAppliedWarning[] {
    const warnings: QnaAppliedWarning[] = sourceRows.filter(row => row.Estado === 'ERROR' || row.ErrorCode).map(row => ({
      code: String(row.ErrorCode ?? 'QNA_FUENTE_ERROR'), message: `La fuente ${row.Dominio} fue persistida con estado ${row.Estado}.`, dominio: row.Dominio,
    }));
    const projectionState = projectionRows.map(row => String(row.Estado)).find(state => state === 'ERROR')
      ?? projectionRows.map(row => String(row.Estado)).find(state => state === 'WARNING');
    if (projectionState) warnings.push({ code: `QNA_PHASE8_${projectionState}`, message: `La proyeccion de compatibilidad registro estado ${projectionState}.` });
    for (const row of projectionRows.filter(item => ['WARNING', 'ERROR'].includes(String(item.ReconciliacionEstado)))) {
      warnings.push({ code: `QNA_PHASE8_DOMINIO_${row.ReconciliacionEstado}`, message: `La conciliacion del dominio ${row.Dominio} registro estado ${row.ReconciliacionEstado}.`, dominio: row.Dominio });
    }
    return [...new Map(warnings.sort((left, right) => (left.dominio ?? '').localeCompare(right.dominio ?? '') || left.code.localeCompare(right.code))
      .map(warning => [`${warning.code}:${warning.dominio ?? ''}`, warning])).values()];
  }

  private async getAppliedTotals(id: string, transaction: Transaction): Promise<QnaTotals> {
    const result = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`SELECT t.Registros,${TOTAL_SELECT} FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=@Id`);
    if (result.recordset.length !== 1) qnaFail('El snapshot aplicado no tiene un total unico', 'QNA_APLICADA_INTEGRIDAD_INVALIDA', 500);
    const row = result.recordset[0];
    const totals = { registros: Number(row.Registros) } as QnaTotals;
    for (const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>) totals[key] = String(row[key]);
    return totals;
  }

  private mapAppliedDetail(domain: QnaDomain, row: Record<string, any>, isAdmin: boolean): QnaAppliedDetailRow {
    if (FUND_DOMAINS.has(domain)) {
      const projection = fundProjection(domain as 'AHORRO' | 'VIVIENDA' | 'PRESTACIONES' | 'CAIR', this.mapEmployeeDetail(row));
      const { empleadoClaveHash: _redacted, ...publicProjection } = projection;
      const payloadCanonico = { ...publicProjection, interno: String(row.Interno) };
      return { orden: Number(row.Orden), empleadoClave: String(row.EmpleadoClave), rfc: row.Rfc === null ? null : String(row.Rfc), nombre: String(row.Nombre),
        sourceScale: Number(row.SourceScale) as 2 | 6, importeOficialD6: String(row.ImporteOficialD6), payloadVersion: 1, payloadCanonico,
        ...(isAdmin ? { hashFila: String(row.HashFila) } : {}) };
    }
    const parsed = JSON.parse(String(row.PayloadCanonico)) as Record<string, unknown>;
    const fields = QNA_AUXILIARY_PAYLOAD_V1_FIELDS[domain as keyof typeof QNA_AUXILIARY_PAYLOAD_V1_FIELDS];
    const payloadCanonico = Object.fromEntries(fields.map(field => [field, parsed[field] ?? null]));
    return { orden: Number(row.Orden), empleadoClave: String(row.EmpleadoClave), rfc: row.Rfc === null ? null : String(row.Rfc), nombre: String(row.Nombre),
      sourceScale: Number(row.SourceScale) as 2 | 6, importeOficialD6: String(row.ImporteOficialD6), payloadVersion: 1, payloadCanonico,
      ...(isAdmin ? { claveFilaHash: String(row.ClaveFilaHash), hashFila: String(row.HashFila) } : {}) };
  }

  async appendDecision(id: string, decision: QnaDecision, comentario: string | null, usuarioId: string): Promise<QnaDecisionRecord> {
    if (decision === 'OBSERVADO' && !comentario) qnaFail('OBSERVADO requiere comentario', 'QNA_DECISION_INVALIDA', 400);
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const result = await this.appendDecisionEnTransaccion(transaction, id, decision, comentario, usuarioId);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async appendDecisionEnTransaccion(
    transaction: Transaction,
    id: string,
    decision: QnaDecision,
    comentario: string | null,
    usuarioId: string
  ): Promise<QnaDecisionRecord> {
    if (decision === 'OBSERVADO' && !comentario) qnaFail('OBSERVADO requiere comentario', 'QNA_DECISION_INVALIDA', 400);
    const latest = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
      SELECT s.LiquidacionSnapshotId,d.QnaSnapshotDecisionId,d.Decision,d.PoliticaVersion,d.Comentario,d.UsuarioId,d.FechaCreacion
      FROM liquidacion.QnaSnapshot s WITH (UPDLOCK,HOLDLOCK)
      OUTER APPLY (SELECT TOP (1) * FROM liquidacion.QnaSnapshotDecision x WITH (UPDLOCK,HOLDLOCK)
        WHERE x.LiquidacionSnapshotId=s.LiquidacionSnapshotId ORDER BY x.FechaCreacion DESC,x.QnaSnapshotDecisionId DESC) d
      WHERE s.LiquidacionSnapshotId=@Id;`);
    const current = latest.recordset[0];
    if (!current) qnaFail('Snapshot no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO', 404);
    if (current.QnaSnapshotDecisionId && current.Decision === decision && current.PoliticaVersion === PRECISION_POLICY
        && String(current.UsuarioId) === usuarioId && (current.Comentario ?? null) === comentario) {
      return this.mapDecision(current);
    }
    const result = await new sql.Request(transaction)
      .input('Id', sql.BigInt, id).input('Decision', sql.VarChar(20), decision)
      .input('Comentario', sql.NVarChar(1000), comentario).input('UsuarioId', sql.NVarChar(100), usuarioId)
      .query(`INSERT INTO liquidacion.QnaSnapshotDecision
        (LiquidacionSnapshotId,Decision,PoliticaVersion,Comentario,UsuarioId)
        OUTPUT INSERTED.QnaSnapshotDecisionId,INSERTED.Decision,INSERTED.PoliticaVersion,INSERTED.Comentario,INSERTED.UsuarioId,INSERTED.FechaCreacion
        SELECT LiquidacionSnapshotId,@Decision,'${PRECISION_POLICY}',@Comentario,@UsuarioId
        FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id`);
    if (!result.recordset[0]) qnaFail('Snapshot no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO', 404);
    return this.mapDecision(result.recordset[0]);
  }

  async promote(id: string, motivo: string | null, usuarioId: string, ambientTransaction?: Transaction): Promise<PromoteQnaResult> {
    const transaction = ambientTransaction ?? new sql.Transaction(this.mssqlPool);
    const ownsTransaction = ambientTransaction === undefined;
    if (ownsTransaction) await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const lockScopeResult = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
        SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3
        FROM liquidacion.QnaSnapshot
        WHERE LiquidacionSnapshotId=@Id;
      `);
      const lockScope = lockScopeResult.recordset[0];
      if (!lockScope) qnaFail('Snapshot no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO', 404);
      await acquireQnaScopeLock(transaction, {
        entidadId: Number(lockScope.EntidadId),
        anio: Number(lockScope.Anio),
        quincena: Number(lockScope.Quincena),
        organica0: String(lockScope.Organica0),
        organica1: String(lockScope.Organica1),
        organica2: String(lockScope.Organica2),
        organica3: String(lockScope.Organica3),
      });

      const eligibility = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
        SELECT s.*,d.Decision,
          (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f WITH (UPDLOCK,HOLDLOCK)
            WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId) AS FuenteCount,
          (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f WITH (UPDLOCK,HOLDLOCK)
            WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND f.Requerida=1 AND
              ((f.Estado='COMPLETE' AND f.Registros>0 AND f.HashFuente IS NOT NULL) OR
               (f.Estado='NOT_APPLICABLE' AND f.Registros=0 AND f.NotApplicableAprobado=1 AND f.AprobadoPor IS NOT NULL AND f.Evidencia IS NOT NULL))) AS EligibleCount
        FROM liquidacion.QnaSnapshot s WITH (UPDLOCK,HOLDLOCK)
        OUTER APPLY (SELECT TOP (1) Decision FROM liquidacion.QnaSnapshotDecision WITH (UPDLOCK,HOLDLOCK)
          WHERE LiquidacionSnapshotId=s.LiquidacionSnapshotId ORDER BY FechaCreacion DESC,QnaSnapshotDecisionId DESC) d
        WHERE s.LiquidacionSnapshotId=@Id`);
      const snapshot = eligibility.recordset[0];
      if (!snapshot) qnaFail('Snapshot no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO', 404);
      if (snapshot.Estado !== 'COMPLETO' || Number(snapshot.FuenteCount) !== 10 || Number(snapshot.EligibleCount) !== 10) {
        qnaFail('Snapshot incompleto', 'QNA_SNAPSHOT_INCOMPLETO');
      }
      if (snapshot.Decision !== 'APROBADO') qnaFail('La ultima decision no es APROBADO', 'QNA_SNAPSHOT_NO_APROBADO');

      const validationResult = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
        SELECT
          CASE WHEN c.Id = s.NominaCargaId AND c.TipoCarga = 'TXT' AND c.Estatus = 'APLICADA' AND c.EsVigente = 1
            AND c.Id = (
              SELECT TOP (1) cv.Id FROM dbo.NominaAplicacionQnalCarga cv WITH (UPDLOCK,HOLDLOCK)
              WHERE cv.EntidadId=s.EntidadId AND cv.Anio=s.Anio AND cv.Quincena=s.Quincena
                AND cv.Organica0=s.Organica0 AND cv.Organica1=s.Organica1 AND cv.Organica2=s.Organica2 AND cv.Organica3=s.Organica3
                AND cv.TipoCarga='TXT' AND cv.Estatus='APLICADA' AND cv.EsVigente=1
              ORDER BY cv.Id DESC
            ) THEN 1 ELSE 0 END AS CargaVigente,
          CASE WHEN v.EntidadId=s.EntidadId AND v.Anio=s.Anio AND v.Quincena=s.Quincena AND v.Periodo=s.Periodo
            AND v.Organica0=s.Organica0 AND v.Organica1=s.Organica1 AND v.Organica2=s.Organica2 AND v.Organica3=s.Organica3
            AND v.Ambiente=s.Ambiente THEN 1 ELSE 0 END AS MismoAmbito,
          CASE WHEN s.SnapshotCalculoV2Id IS NOT NULL AND s.NominaCargaId IS NOT NULL AND s.FormulaCalculoVersionId IS NOT NULL
            AND v.NominaCargaId=s.NominaCargaId AND v.FormulaCalculoVersionId=s.FormulaCalculoVersionId
            AND formula.FormulaCalculoVersionId=s.FormulaCalculoVersionId
            AND formula.PrecisionPolicy=s.PrecisionPolicy AND formula.AnioVigencia=s.Anio
            AND s.Quincena BETWEEN formula.QuincenaDesde AND formula.QuincenaHasta THEN 1 ELSE 0 END AS MismosEnlaces,
          CASE WHEN v.Fuente='LIQUIDACION_V2' AND v.Estado='COMPLETO' AND v.EsCerrado=1
            AND v.PrecisionPolicy=s.PrecisionPolicy
            AND (SELECT TOP (1) CASE WHEN vd.Decision='APROBADO' AND vd.PoliticaVersion='MXN-A2-DIFF-0.20-v1' THEN 1 ELSE 0 END
              FROM aportaciones.SnapshotCalculoV2Decision vd WITH (UPDLOCK,HOLDLOCK)
              WHERE vd.SnapshotId=v.SnapshotId ORDER BY vd.FechaCreacion DESC,vd.DecisionId DESC)=1
            THEN 1 ELSE 0 END AS SnapshotV2Valido,
          CASE WHEN v.Registros=(SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2Detalle vd WITH (UPDLOCK,HOLDLOCK) WHERE vd.SnapshotId=v.SnapshotId)
            AND c.TotalDetalles=(SELECT COUNT(*) FROM dbo.NominaAplicacionQnalDetalle nd WITH (UPDLOCK,HOLDLOCK) WHERE nd.CargaId=c.Id)
            AND t.Registros=v.Registros
            AND (s.VersionEsquema<5 OR ((SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle ed WITH (UPDLOCK,HOLDLOCK)
                  WHERE ed.LiquidacionSnapshotId=s.LiquidacionSnapshotId)=v.Registros
                AND NOT EXISTS (SELECT 1 FROM liquidacion.QnaSnapshotDetalle ed WITH (UPDLOCK,HOLDLOCK)
                  LEFT JOIN aportaciones.SnapshotCalculoV2Detalle vd WITH (UPDLOCK,HOLDLOCK)
                    ON vd.SnapshotDetalleId=ed.SnapshotCalculoV2DetalleId AND vd.SnapshotId=v.SnapshotId
                  WHERE ed.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND (vd.SnapshotDetalleId IS NULL
                    OR ed.EmpleadoClaveHash<>vd.EmpleadoClaveHash OR ed.DiasLaborados<>vd.DiasLaborados OR ed.DiasOrigen<>vd.DiasOrigen
                    OR ed.SueldoMensualD6<>vd.SueldoMensualD6 OR ed.QuinqueniosMensualD6<>vd.QuinqueniosMensualD6
                    OR ISNULL(ed.BaseCotizacionSueldoD6,-1)<>ISNULL(vd.BaseCotizacionSueldoD6,-1)
                    OR ISNULL(ed.BaseCotizacionQuinqueniosD6,-1)<>ISNULL(vd.BaseCotizacionQuinqueniosD6,-1)
                    OR ed.CAIRD6<>vd.CAIRD6 OR ed.CAIRFondoD6<>vd.CAIRFONDOD6 OR ed.FRAD6<>vd.FRAD6 OR ed.FRED6<>vd.FRED6
                    OR ed.PrestacionesD6<>vd.PRESTACIONESD6 OR ed.FHD6<>vd.FHD6 OR ed.FVD6<>vd.FVD6 OR ed.ViviendaD6<>vd.VIVIENDAD6
                    OR ed.FAAD6<>vd.FAAD6 OR ed.FAED6<>vd.FAED6 OR ed.FATD6<>vd.FATD6 OR ed.FAID6<>vd.FAID6))))
            AND NOT EXISTS (
              SELECT 1 FROM liquidacion.QnaSnapshotFuente f WITH (UPDLOCK,HOLDLOCK)
              WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND f.Dominio IN ('GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP')
                AND f.Registros<>(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle fd WITH (UPDLOCK,HOLDLOCK)
                  WHERE fd.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND fd.Dominio=f.Dominio)
            ) THEN 1 ELSE 0 END AS ConteosValidos,
          CASE WHEN NOT EXISTS (
              SELECT 1 FROM liquidacion.QnaSnapshotFuente f WITH (UPDLOCK,HOLDLOCK)
               WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId AND f.Dominio IN ('AHORRO','VIVIENDA','PRESTACIONES','CAIR')
                 AND (f.Estado<>'COMPLETE' OR f.SourceScale<>6 OR f.Registros<>v.Registros OR f.HashFuente IS NULL
                   OR (s.VersionEsquema<5 AND (f.TipoFuente<>'SQL_HISTORICO' OR f.HashFuente<>v.HashContenido
                     OR f.IdentificadorFuente<>CONCAT('aportaciones.SnapshotCalculoV2:',v.SnapshotId,':',f.Dominio)))
                   OR (s.VersionEsquema>=5 AND (f.TipoFuente<>'FIREBIRD'
                     OR f.IdentificadorFuente NOT LIKE 'FIREBIRD:APORTACIONES_FONDOS:%:'+f.Dominio)))
             ) THEN 1 ELSE 0 END AS FuentesValidas,
          CASE WHEN t.CAIRA2=v.CAIR AND t.FRAA2=v.FRA AND t.FREA2=v.FRE AND t.FHA2=v.FH AND t.FVA2=v.FV
            AND t.FAAA2=v.FAA AND t.FAEA2=v.FAE AND t.FATA2=v.FAT AND t.FAIA2=v.FAI
            AND t.AhorroA2=v.FAT AND t.ViviendaA2=COALESCE(v.VIVIENDA,v.FH+v.FV)
            AND t.PrestacionesA2=COALESCE(v.PRESTACIONES,v.FRA+v.FRE)
            AND COALESCE(t.CAIRFondoA2,t.CAIRA2)=COALESCE(v.CAIR_FONDO,v.CAIR) THEN 1 ELSE 0 END AS TotalesValidos
        FROM liquidacion.QnaSnapshot s WITH (UPDLOCK,HOLDLOCK)
        LEFT JOIN aportaciones.SnapshotCalculoV2 v WITH (UPDLOCK,HOLDLOCK) ON v.SnapshotId=s.SnapshotCalculoV2Id
        LEFT JOIN dbo.NominaAplicacionQnalCarga c WITH (UPDLOCK,HOLDLOCK) ON c.Id=s.NominaCargaId
        LEFT JOIN aportaciones.FormulaCalculoVersion formula WITH (UPDLOCK,HOLDLOCK)
          ON formula.FormulaCalculoVersionId=s.FormulaCalculoVersionId
        LEFT JOIN liquidacion.QnaSnapshotTotal t WITH (UPDLOCK,HOLDLOCK) ON t.LiquidacionSnapshotId=s.LiquidacionSnapshotId
        WHERE s.LiquidacionSnapshotId=@Id;
      `);
      const validation = validationResult.recordset[0];
      if (!validation) qnaFail('Snapshot no encontrado', 'QNA_SNAPSHOT_NO_ENCONTRADO', 404);
      validateQnaPromotion({
        cargaVigente: Number(validation.CargaVigente) === 1,
        mismoAmbito: Number(validation.MismoAmbito) === 1,
        mismosEnlaces: Number(validation.MismosEnlaces) === 1,
        snapshotV2Valido: Number(validation.SnapshotV2Valido) === 1,
        conteosValidos: Number(validation.ConteosValidos) === 1,
        fuentesValidas: Number(validation.FuentesValidas) === 1,
        totalesValidos: Number(validation.TotalesValidos) === 1,
      });
      await this.validatePersistedCandidate(transaction, snapshot);

      let processResult = await this.scope(new sql.Request(transaction), snapshot).query(`SELECT QnaProcesoId FROM liquidacion.QnaProceso WITH (UPDLOCK,HOLDLOCK)
        WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0
          AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3`);
      let processId: string;
      if (processResult.recordset[0]) processId = String(processResult.recordset[0].QnaProcesoId);
      else {
        processResult = await this.scope(new sql.Request(transaction), snapshot).input('UsuarioId', sql.NVarChar(100), usuarioId).query(`
          INSERT INTO liquidacion.QnaProceso (EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
          OUTPUT INSERTED.QnaProcesoId VALUES (@EntidadId,@Anio,@Quincena,@Organica0,@Organica1,@Organica2,@Organica3,@UsuarioId)`);
        processId = String(processResult.recordset[0].QnaProcesoId);
      }
      const currentResult = await new sql.Request(transaction).input('ProcesoId', sql.BigInt, processId).query(`
        SELECT o.LiquidacionSnapshotId,o.QnaSnapshotSeleccionEventoId,e.TipoEvento FROM liquidacion.QnaSnapshotOficialActual o WITH (UPDLOCK,HOLDLOCK)
        JOIN liquidacion.QnaSnapshotSeleccionEvento e ON e.QnaSnapshotSeleccionEventoId=o.QnaSnapshotSeleccionEventoId
        WHERE o.QnaProcesoId=@ProcesoId;
        SELECT TOP (1) EstadoDestino FROM liquidacion.QnaProcesoTransicion WITH (UPDLOCK,HOLDLOCK)
        WHERE QnaProcesoId=@ProcesoId ORDER BY FechaCreacion DESC,QnaProcesoTransicionId DESC;`);
      const sets = currentResult.recordsets as Array<Array<Record<string, any>>>;
      const current = sets[0][0];
      const priorState = sets[1][0]?.EstadoDestino as string | undefined;
      if (current && String(current.LiquidacionSnapshotId) === id) {
        await this.projectV5Retentions(transaction, id, Number(snapshot.VersionEsquema), usuarioId);
        const legacyProjection = await this.projectV5Legacy(transaction, id, Number(snapshot.VersionEsquema), usuarioId);
        if (ownsTransaction) await transaction.commit();
        return { liquidacionSnapshotId: id, promoted: true, qnaProcesoId: processId,
          qnaSnapshotSeleccionEventoId: String(current.QnaSnapshotSeleccionEventoId), tipoEvento: current.TipoEvento, idempotente: true,
          legacyProjectionStatus: legacyProjection.status, legacyProjectionDetails: legacyProjection.details };
      }
      if (current && priorState !== 'OFICIAL') {
        qnaFail('No se puede reemplazar una liquidacion cuyo procesamiento ya inicio', 'QNA_OFICIAL_PROCESAMIENTO_INICIADO', 409);
      }
      const type = current ? 'REEMPLAZADO' : 'SELECCIONADO';
      const eventResult = await new sql.Request(transaction).input('ProcesoId', sql.BigInt, processId).input('Id', sql.BigInt, id)
        .input('Tipo', sql.VarChar(20), type).input('Motivo', sql.NVarChar(500), motivo).input('UsuarioId', sql.NVarChar(100), usuarioId)
        .query(`INSERT INTO liquidacion.QnaSnapshotSeleccionEvento (QnaProcesoId,LiquidacionSnapshotId,TipoEvento,Motivo,UsuarioId)
          OUTPUT INSERTED.QnaSnapshotSeleccionEventoId VALUES (@ProcesoId,@Id,@Tipo,@Motivo,@UsuarioId)`);
      const eventId = String(eventResult.recordset[0].QnaSnapshotSeleccionEventoId);
      const pointer = new sql.Request(transaction).input('ProcesoId', sql.BigInt, processId).input('Id', sql.BigInt, id).input('EventoId', sql.BigInt, eventId);
      if (current) await pointer.query(`UPDATE liquidacion.QnaSnapshotOficialActual SET LiquidacionSnapshotId=@Id,QnaSnapshotSeleccionEventoId=@EventoId,FechaActualizacion=SYSDATETIME() WHERE QnaProcesoId=@ProcesoId`);
      else await pointer.query(`INSERT INTO liquidacion.QnaSnapshotOficialActual (QnaProcesoId,LiquidacionSnapshotId,QnaSnapshotSeleccionEventoId) VALUES (@ProcesoId,@Id,@EventoId)`);

      if (priorState === 'OFICIAL') {
        await this.insertTransition(transaction, processId, id, 'OFICIAL', 'APROBADO', motivo ?? 'Reemplazo de snapshot oficial', usuarioId);
        await this.insertTransition(transaction, processId, id, 'APROBADO', 'OFICIAL', motivo, usuarioId);
      } else {
        await this.insertTransition(transaction, processId, id, priorState ?? null, 'OFICIAL', motivo, usuarioId);
      }
      await this.projectV5Retentions(transaction, id, Number(snapshot.VersionEsquema), usuarioId);
      const legacyProjection = await this.projectV5Legacy(transaction, id, Number(snapshot.VersionEsquema), usuarioId);
      if (ownsTransaction) await transaction.commit();
      return { liquidacionSnapshotId: id, promoted: true, qnaProcesoId: processId, qnaSnapshotSeleccionEventoId: eventId, tipoEvento: type, idempotente: false,
        legacyProjectionStatus: legacyProjection.status, legacyProjectionDetails: legacyProjection.details };
    } catch (error) {
      if (ownsTransaction) await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async resolveOfficialById(id: string): Promise<QnaSnapshot | null> {
    const result = await new sql.Request(this.mssqlPool).input('Id', sql.BigInt, id).query(`
      SELECT o.LiquidacionSnapshotId FROM liquidacion.QnaSnapshotOficialActual o
      JOIN liquidacion.QnaSnapshotSeleccionEvento e ON e.QnaSnapshotSeleccionEventoId=o.QnaSnapshotSeleccionEventoId
        AND e.QnaProcesoId=o.QnaProcesoId AND e.LiquidacionSnapshotId=o.LiquidacionSnapshotId
      WHERE o.LiquidacionSnapshotId=@Id`);
    if (result.recordset.length !== 1) return null;
    const snapshot = await this.getById(id);
    if (!snapshot || !snapshot.esOficial || snapshot.estado !== 'COMPLETO' || snapshot.fuentes.length !== 10
      || snapshot.ultimaDecision?.decision !== 'APROBADO') return null;
    const complete = snapshot.fuentes.every(source => source.requerida && (source.estado === 'COMPLETE'
      || (source.estado === 'NOT_APPLICABLE' && source.notApplicableAprobado && !!source.aprobadoPor && !!source.evidencia)));
    return complete ? snapshot : null;
  }

  async resolveOfficialByScope(scope: QnaScope): Promise<QnaSnapshot | null> {
    const result = await this.scope(this.mssqlPool.request(), scope).query(`
      SELECT o.LiquidacionSnapshotId
      FROM liquidacion.QnaProceso p
      JOIN liquidacion.QnaSnapshotOficialActual o ON o.QnaProcesoId=p.QnaProcesoId
      WHERE p.EntidadId=@EntidadId AND p.Anio=@Anio AND p.Quincena=@Quincena
        AND p.Organica0=@Organica0 AND p.Organica1=@Organica1 AND p.Organica2=@Organica2 AND p.Organica3=@Organica3`);
    const id = result.recordset[0]?.LiquidacionSnapshotId;
    return id ? this.resolveOfficialById(String(id)) : null;
  }

  async appendProcessTransition(id: string, destination: QnaProcessState, motivo: string | null, usuarioId: string, allowSame = true): Promise<void> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const result = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
        SELECT o.QnaProcesoId,
          (SELECT TOP (1) EstadoDestino FROM liquidacion.QnaProcesoTransicion WITH (UPDLOCK,HOLDLOCK)
           WHERE QnaProcesoId=o.QnaProcesoId ORDER BY FechaCreacion DESC,QnaProcesoTransicionId DESC) AS EstadoActual
        FROM liquidacion.QnaSnapshotOficialActual o WITH (UPDLOCK,HOLDLOCK)
        WHERE o.LiquidacionSnapshotId=@Id`);
      const row = result.recordset[0];
      if (!row) qnaFail('Snapshot no oficial', 'QNA_SNAPSHOT_NO_OFICIAL', 409);
      const origin = String(row.EstadoActual ?? 'OFICIAL');
      const allowed: Record<string, QnaProcessState[]> = {
        OFICIAL: ['APLICANDO_FIREBIRD'],
        FIREBIRD_REVERTIDO: ['APLICANDO_FIREBIRD'],
        APLICANDO_FIREBIRD: ['FIREBIRD_CONFIRMADO', 'FIREBIRD_REVERTIDO', 'APLICACION_INCIERTA'],
        FIREBIRD_CONFIRMADO: ['LINEA_CONFIRMADA'],
        LINEA_CONFIRMADA: ['REVISA_PROGRAMADA'],
        REVISA_PROGRAMADA: ['TERMINADO'],
      };
      if (!allowed[origin]?.includes(destination)) {
        const operationalOrder: QnaProcessState[] = ['FIREBIRD_CONFIRMADO', 'LINEA_CONFIRMADA', 'REVISA_PROGRAMADA', 'TERMINADO'];
        const originOrder = operationalOrder.indexOf(origin as QnaProcessState);
        const destinationOrder = operationalOrder.indexOf(destination);
        if (allowSame && (origin === destination || (originOrder >= 0 && destinationOrder >= 0 && originOrder > destinationOrder))) {
          await transaction.commit();
          return;
        }
        qnaFail(`Transicion ${origin} -> ${destination} no permitida`, 'QNA_TRANSICION_INVALIDA', 409);
      }
      await this.insertTransition(transaction, String(row.QnaProcesoId), id, origin, destination, motivo, usuarioId);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  private async validatePersistedCandidate(transaction: Transaction, header: Record<string, any>): Promise<void> {
    if (Number(header.VersionEsquema) < 5) return;
    const id = String(header.LiquidacionSnapshotId);
    const result = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
      SELECT * FROM liquidacion.QnaSnapshotFuente WITH (UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio;
      SELECT Dominio,Orden,ClaveFilaHash,SourceScale,CONVERT(VARCHAR(40),ImporteOficialD6) AS ImporteOficialD6,
        PayloadCanonico,HashFila,EmpleadoClave,Rfc,Nombre,PayloadVersion
      FROM liquidacion.QnaSnapshotFuenteDetalle WITH (UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio,Orden;
      SELECT t.Registros,${TOTAL_SELECT} FROM liquidacion.QnaSnapshotTotal t WITH (UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@Id;
      SELECT Orden,EmpleadoClave,EmpleadoClaveHash,Interno,Rfc,Nombre,SourceScale,DiasOrigen,HashFila,
        CONVERT(VARCHAR(40),DiasLaborados) AS DiasLaborados,
        CONVERT(VARCHAR(40),SueldoD6) AS SueldoD6,CONVERT(VARCHAR(40),OtrasPrestacionesD6) AS OtrasPrestacionesD6,
        CONVERT(VARCHAR(40),QuinqueniosD6) AS QuinqueniosD6,CONVERT(VARCHAR(40),SueldoMensualD6) AS SueldoMensualD6,
        CONVERT(VARCHAR(40),BaseCotizacionSueldoD6) AS BaseCotizacionSueldoD6,
        CONVERT(VARCHAR(40),QuinqueniosMensualD6) AS QuinqueniosMensualD6,
        CONVERT(VARCHAR(40),BaseCotizacionQuinqueniosD6) AS BaseCotizacionQuinqueniosD6,
        CONVERT(VARCHAR(40),CAIRD6) AS CairD6,CONVERT(VARCHAR(40),CAIRFondoD6) AS CairFondoD6,
        CONVERT(VARCHAR(40),FRAD6) AS FraD6,CONVERT(VARCHAR(40),FRED6) AS FreD6,
        CONVERT(VARCHAR(40),PrestacionesD6) AS PrestacionesD6,CONVERT(VARCHAR(40),FHD6) AS FhD6,
        CONVERT(VARCHAR(40),FVD6) AS FvD6,CONVERT(VARCHAR(40),ViviendaD6) AS ViviendaD6,
        CONVERT(VARCHAR(40),FAAD6) AS FaaD6,CONVERT(VARCHAR(40),FAED6) AS FaeD6,
        CONVERT(VARCHAR(40),FATD6) AS FatD6,CONVERT(VARCHAR(40),FAID6) AS FaiD6,
        CONVERT(VARCHAR(40),GuarderiasD6) AS GuarderiasD6,CONVERT(VARCHAR(40),TransitorioD6) AS TransitorioD6,
        CONVERT(VARCHAR(40),AguinaldoD6) AS AguinaldoD6,CONVERT(VARCHAR(40),RetencionPCPD6) AS RetencionPcpD6,
        CONVERT(VARCHAR(40),RetencionPMPD6) AS RetencionPmpD6,CONVERT(VARCHAR(40),RetencionHIPD6) AS RetencionHipD6
      FROM liquidacion.QnaSnapshotDetalle WITH (UPDLOCK,HOLDLOCK) WHERE LiquidacionSnapshotId=@Id ORDER BY Orden;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const sources = sets[0].map((row) => ({
      dominio: row.Dominio, tipoFuente: row.TipoFuente, estado: row.Estado, requerida: Boolean(row.Requerida),
      identificadorFuente: String(row.IdentificadorFuente), hashFuente: row.HashFuente === null ? null : String(row.HashFuente),
      sourceScale: Number(row.SourceScale), registros: Number(row.Registros), notApplicableAprobado: Boolean(row.NotApplicableAprobado),
      aprobadoPor: row.AprobadoPor === null ? null : String(row.AprobadoPor), evidencia: row.Evidencia === null ? null : String(row.Evidencia),
      errorCode: row.ErrorCode === null ? null : String(row.ErrorCode)
    })) as QnaSource[];
    const details = sets[1].map((row) => ({
      dominio: row.Dominio, orden: Number(row.Orden), claveFilaHash: String(row.ClaveFilaHash), sourceScale: Number(row.SourceScale),
      importeOficialD6: String(row.ImporteOficialD6), payloadCanonico: JSON.parse(String(row.PayloadCanonico)), hashFila: String(row.HashFila),
      empleadoClave: String(row.EmpleadoClave), rfc: row.Rfc === null ? null : String(row.Rfc), nombre: String(row.Nombre), payloadVersion: 1 as const
    })) as QnaSourceDetail[];
    const totalRow = sets[2][0];
    if (!totalRow) qnaFail('Snapshot V5 sin totales', 'QNA_PROMOCION_INTEGRIDAD_INVALIDA', 409);
    const totals = { registros: Number(totalRow.Registros) } as QnaTotals;
    for (const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>) totals[key] = String(totalRow[key]);
    const employeeDetails = sets[3].map((row) => this.mapEmployeeDetail(row));
    const persisted: CreateQnaCandidateInput = {
      entidadId: Number(header.EntidadId), anio: Number(header.Anio), quincena: Number(header.Quincena),
      organica0: String(header.Organica0), organica1: String(header.Organica1), organica2: String(header.Organica2), organica3: String(header.Organica3),
      ambiente: header.Ambiente, snapshotCalculoV2Id: String(header.SnapshotCalculoV2Id),
      nominaCargaId: String(header.NominaCargaId), formulaCalculoVersionId: String(header.FormulaCalculoVersionId),
      fuentes: sources, totales: totals, detalles: details, usuarioId: header.UsuarioId === null ? null : String(header.UsuarioId),
      versionEsquema: 5, detallesEmpleado: employeeDetails
    };
    const validated = validateQnaCandidate(persisted);
    if (validated.hashContenido !== String(header.HashContenido)) qnaFail('Hash de contenido V5 persistido inconsistente', 'QNA_PROMOCION_INTEGRIDAD_INVALIDA', 409);
    for (const domain of ['AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR'] as const) {
      const expected = calculateCanonicalHash(employeeDetails.map((detail) => [detail.empleadoClaveHash, calculateCanonicalHash(fundProjection(domain, detail))]));
      if (sources.find((source) => source.dominio === domain)?.hashFuente !== expected) {
        qnaFail(`Hash persistido del fondo ${domain} inconsistente`, 'QNA_PROMOCION_INTEGRIDAD_INVALIDA', 409);
      }
    }
  }

  private mapEmployeeDetail(row: Record<string, any>): QnaEmployeeDetail {
    const nullable = (value: unknown) => value === null || value === undefined ? null : String(value);
    return {
      orden: Number(row.Orden), empleadoClave: String(row.EmpleadoClave), empleadoClaveHash: String(row.EmpleadoClaveHash),
      interno: Number(row.Interno), rfc: nullable(row.Rfc), nombre: String(row.Nombre), sourceScale: 6,
      sueldoD6: String(row.SueldoD6), otrasPrestacionesD6: String(row.OtrasPrestacionesD6), quinqueniosD6: String(row.QuinqueniosD6),
      diasLaborados: String(row.DiasLaborados), diasOrigen: String(row.DiasOrigen), sueldoMensualD6: String(row.SueldoMensualD6),
      baseCotizacionSueldoD6: nullable(row.BaseCotizacionSueldoD6), quinqueniosMensualD6: String(row.QuinqueniosMensualD6),
      baseCotizacionQuinqueniosD6: nullable(row.BaseCotizacionQuinqueniosD6), cairD6: String(row.CairD6), cairFondoD6: String(row.CairFondoD6),
      fraD6: String(row.FraD6), freD6: String(row.FreD6), prestacionesD6: String(row.PrestacionesD6), fhD6: String(row.FhD6),
      fvD6: String(row.FvD6), viviendaD6: String(row.ViviendaD6), faaD6: String(row.FaaD6), faeD6: String(row.FaeD6),
      fatD6: String(row.FatD6), faiD6: String(row.FaiD6), guarderiasD6: String(row.GuarderiasD6), transitorioD6: String(row.TransitorioD6),
      aguinaldoD6: String(row.AguinaldoD6), retencionPcpD6: String(row.RetencionPcpD6), retencionPmpD6: String(row.RetencionPmpD6),
      retencionHipD6: String(row.RetencionHipD6), hashFila: String(row.HashFila)
    };
  }

  private async insertCandidate(transaction: Transaction, input: CreateQnaCandidateInput): Promise<CreateQnaCandidateResult> {
    for (const source of input.fuentes) {
      if (source.estado === 'NOT_APPLICABLE' && source.aprobadoPor !== input.usuarioId) {
        qnaFail('La aprobacion NOT_APPLICABLE debe pertenecer al usuario autenticado', 'QNA_NOT_APPLICABLE_USUARIO_INVALIDO', 400);
      }
    }
    const validated = validateQnaCandidate(input);
    const existing = await this.scope(new sql.Request(transaction), input)
      .input('HashContenido', sql.Char(64), validated.hashContenido)
      .query(`SELECT LiquidacionSnapshotId,Revision,Estado FROM liquidacion.QnaSnapshot WITH (UPDLOCK,HOLDLOCK)
        WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0
          AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3 AND HashContenido=@HashContenido`);
    if (existing.recordset.length === 1) {
      const row = existing.recordset[0];
      return { liquidacionSnapshotId: String(row.LiquidacionSnapshotId), revision: Number(row.Revision),
        hashContenido: validated.hashContenido, estado: row.Estado, idempotente: true };
    }
    const revisionResult = await this.scope(new sql.Request(transaction), input).query(`
      SELECT ISNULL(MAX(Revision),0)+1 AS Revision FROM liquidacion.QnaSnapshot WITH (UPDLOCK,HOLDLOCK)
      WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0
        AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3`);
    const revision = Number(revisionResult.recordset[0].Revision);
    const estado = validated.completas === 10 ? 'COMPLETO' : 'INCOMPLETO';
    const version = input.versionEsquema ?? 4;
    const header = await this.scope(new sql.Request(transaction), input)
      .input('Periodo', sql.Char(4), `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`)
      .input('Ambiente', sql.VarChar(20), input.ambiente).input('Estado', sql.VarChar(20), estado)
      .input('Revision', sql.Int, revision).input('HashContenido', sql.Char(64), validated.hashContenido)
      .input('SnapshotCalculoV2Id', sql.BigInt, input.snapshotCalculoV2Id).input('NominaCargaId', sql.BigInt, input.nominaCargaId)
      .input('FormulaCalculoVersionId', sql.BigInt, input.formulaCalculoVersionId).input('FuentesCompletas', sql.TinyInt, validated.completas)
      .input('UsuarioId', sql.NVarChar(100), input.usuarioId).input('VersionEsquema', sql.SmallInt, version)
      .query(`INSERT INTO liquidacion.QnaSnapshot
        (EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,Ambiente,Estado,Revision,
         PrecisionPolicy,VersionEsquema,HashContenido,SnapshotCalculoV2Id,NominaCargaId,FormulaCalculoVersionId,
         FuentesEsperadas,FuentesCompletas,UsuarioId)
        OUTPUT INSERTED.LiquidacionSnapshotId
        VALUES (@EntidadId,@Anio,@Quincena,@Periodo,@Organica0,@Organica1,@Organica2,@Organica3,@Ambiente,@Estado,@Revision,
          '${PRECISION_POLICY}',@VersionEsquema,@HashContenido,@SnapshotCalculoV2Id,@NominaCargaId,@FormulaCalculoVersionId,10,@FuentesCompletas,@UsuarioId)`);
    const id = String(header.recordset[0].LiquidacionSnapshotId);
    for (const source of input.fuentes) await this.insertSource(transaction, id, source);
    await this.insertTotals(transaction, id, input.totales);
    for (const detail of input.detalles) await this.insertDetail(transaction, id, detail);
    for (const detail of input.detallesEmpleado ?? []) await this.insertEmployeeDetail(transaction, id, input.snapshotCalculoV2Id!, detail);
    const verification = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
      SELECT (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente WHERE LiquidacionSnapshotId=@Id) AS Fuentes,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@Id) AS Totales,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id) AS Detalles,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@Id) AS DetallesEmpleado`);
    const verified = verification.recordset[0];
    if (Number(verified.Fuentes) !== 10 || Number(verified.Totales) !== 1
        || Number(verified.Detalles) !== input.detalles.length
        || Number(verified.DetallesEmpleado) !== (input.detallesEmpleado?.length ?? 0)) {
      qnaFail('Persistencia parcial del snapshot', 'QNA_PERSISTENCIA_INCOMPLETA', 500);
    }
    return { liquidacionSnapshotId: id, revision, hashContenido: validated.hashContenido, estado, idempotente: false };
  }

  private scope<T extends { entidadId?: unknown; EntidadId?: unknown; anio?: unknown; Anio?: unknown; quincena?: unknown; Quincena?: unknown;
    organica0?: unknown; Organica0?: unknown; organica1?: unknown; Organica1?: unknown; organica2?: unknown; Organica2?: unknown; organica3?: unknown; Organica3?: unknown }>(request: Request, scope: T): Request {
    const value = (camel: keyof T, pascal: keyof T) => scope[camel] ?? scope[pascal];
    return request.input('EntidadId', sql.Int, value('entidadId', 'EntidadId')).input('Anio', sql.SmallInt, value('anio', 'Anio'))
      .input('Quincena', sql.TinyInt, value('quincena', 'Quincena')).input('Organica0', sql.Char(2), value('organica0', 'Organica0'))
      .input('Organica1', sql.Char(2), value('organica1', 'Organica1')).input('Organica2', sql.Char(2), value('organica2', 'Organica2'))
      .input('Organica3', sql.Char(2), value('organica3', 'Organica3'));
  }

  private async insertSource(transaction: Transaction, id: string, source: QnaSource): Promise<void> {
    await new sql.Request(transaction).input('Id', sql.BigInt, id).input('Dominio', sql.VarChar(30), source.dominio)
      .input('TipoFuente', sql.VarChar(30), source.tipoFuente).input('Estado', sql.VarChar(20), source.estado)
      .input('Requerida', sql.Bit, source.requerida).input('IdentificadorFuente', sql.NVarChar(300), source.identificadorFuente)
      .input('HashFuente', sql.Char(64), source.hashFuente).input('SourceScale', sql.TinyInt, source.sourceScale)
      .input('Registros', sql.Int, source.registros).input('NotApplicableAprobado', sql.Bit, source.notApplicableAprobado)
      .input('AprobadoPor', sql.NVarChar(100), source.aprobadoPor).input('Evidencia', sql.NVarChar(500), source.evidencia)
      .input('ErrorCode', sql.VarChar(100), source.errorCode).query(`INSERT INTO liquidacion.QnaSnapshotFuente
        (LiquidacionSnapshotId,Dominio,TipoFuente,Estado,Requerida,IdentificadorFuente,HashFuente,SourceScale,Registros,NotApplicableAprobado,AprobadoPor,Evidencia,ErrorCode)
        VALUES (@Id,@Dominio,@TipoFuente,@Estado,@Requerida,@IdentificadorFuente,@HashFuente,@SourceScale,@Registros,@NotApplicableAprobado,@AprobadoPor,@Evidencia,@ErrorCode)`);
  }

  private async insertTotals(transaction: Transaction, id: string, totals: QnaTotals): Promise<void> {
    const request = new sql.Request(transaction).input('Id', sql.BigInt, id).input('Registros', sql.Int, totals.registros);
    for (const [key, column] of Object.entries(TOTAL_COLUMNS)) {
      request.input(column, sql.Decimal(19, 2), totals[key as keyof Omit<QnaTotals, 'registros'>]);
    }
    const columns = Object.values(TOTAL_COLUMNS);
    await request.query(`INSERT INTO liquidacion.QnaSnapshotTotal (LiquidacionSnapshotId,Registros,${columns.join(',')}) VALUES (@Id,@Registros,${columns.map(column => `@${column}`).join(',')})`);
  }

  private async insertDetail(transaction: Transaction, id: string, detail: QnaSourceDetail): Promise<void> {
    const request = new sql.Request(transaction).input('Id', sql.BigInt, id).input('Dominio', sql.VarChar(30), detail.dominio)
      .input('Orden', sql.Int, detail.orden).input('ClaveFilaHash', sql.Char(64), detail.claveFilaHash)
      .input('SourceScale', sql.TinyInt, detail.sourceScale).input('Importe', sql.Decimal(19, 6), detail.importeOficialD6)
      .input('Payload', sql.NVarChar(sql.MAX), JSON.stringify(detail.payloadCanonico)).input('HashFila', sql.Char(64), detail.hashFila);
    if (detail.payloadVersion === undefined) {
      await request.query(`INSERT INTO liquidacion.QnaSnapshotFuenteDetalle
        (LiquidacionSnapshotId,Dominio,Orden,ClaveFilaHash,SourceScale,ImporteOficialD6,PayloadCanonico,HashFila)
        VALUES (@Id,@Dominio,@Orden,@ClaveFilaHash,@SourceScale,@Importe,@Payload,@HashFila)`);
      return;
    }
    await request
      .input('EmpleadoClave', sql.NVarChar(50), detail.empleadoClave ?? null).input('Rfc', sql.NVarChar(20), detail.rfc ?? null)
      .input('Nombre', sql.NVarChar(255), detail.nombre ?? null).input('PayloadVersion', sql.SmallInt, detail.payloadVersion ?? null)
      .query(`INSERT INTO liquidacion.QnaSnapshotFuenteDetalle
        (LiquidacionSnapshotId,Dominio,Orden,ClaveFilaHash,SourceScale,ImporteOficialD6,PayloadCanonico,HashFila,EmpleadoClave,Rfc,Nombre,PayloadVersion)
        VALUES (@Id,@Dominio,@Orden,@ClaveFilaHash,@SourceScale,@Importe,@Payload,@HashFila,@EmpleadoClave,@Rfc,@Nombre,@PayloadVersion)`);
  }

  private async insertEmployeeDetail(transaction: Transaction, id: string, snapshotV2Id: string, detail: QnaEmployeeDetail): Promise<void> {
    const request = new sql.Request(transaction)
      .input('Id', sql.BigInt, id).input('SnapshotV2Id', sql.BigInt, snapshotV2Id).input('Orden', sql.Int, detail.orden)
      .input('EmpleadoClave', sql.NVarChar(50), detail.empleadoClave).input('EmpleadoClaveHash', sql.Char(64), detail.empleadoClaveHash)
      .input('Interno', sql.Int, detail.interno).input('Rfc', sql.NVarChar(20), detail.rfc).input('Nombre', sql.NVarChar(255), detail.nombre)
      .input('SourceScale', sql.TinyInt, detail.sourceScale).input('DiasLaborados', sql.Decimal(5, 2), detail.diasLaborados)
      .input('DiasOrigen', sql.VarChar(40), detail.diasOrigen).input('HashFila', sql.Char(64), detail.hashFila);
    const money: Array<[string, string | null]> = [
      ['SueldoD6', detail.sueldoD6], ['OtrasPrestacionesD6', detail.otrasPrestacionesD6], ['QuinqueniosD6', detail.quinqueniosD6],
      ['SueldoMensualD6', detail.sueldoMensualD6], ['BaseCotizacionSueldoD6', detail.baseCotizacionSueldoD6],
      ['QuinqueniosMensualD6', detail.quinqueniosMensualD6], ['BaseCotizacionQuinqueniosD6', detail.baseCotizacionQuinqueniosD6],
      ['CAIRD6', detail.cairD6], ['CAIRFondoD6', detail.cairFondoD6], ['FRAD6', detail.fraD6], ['FRED6', detail.freD6],
      ['PrestacionesD6', detail.prestacionesD6], ['FHD6', detail.fhD6], ['FVD6', detail.fvD6], ['ViviendaD6', detail.viviendaD6],
      ['FAAD6', detail.faaD6], ['FAED6', detail.faeD6], ['FATD6', detail.fatD6], ['FAID6', detail.faiD6],
      ['GuarderiasD6', detail.guarderiasD6], ['TransitorioD6', detail.transitorioD6], ['AguinaldoD6', detail.aguinaldoD6],
      ['RetencionPCPD6', detail.retencionPcpD6], ['RetencionPMPD6', detail.retencionPmpD6], ['RetencionHIPD6', detail.retencionHipD6]
    ];
    for (const [name, value] of money) request.input(name, sql.Decimal(19, 6), value);
    const inserted = await request.query(`INSERT INTO liquidacion.QnaSnapshotDetalle
      (LiquidacionSnapshotId,SnapshotCalculoV2DetalleId,Orden,EmpleadoClave,EmpleadoClaveHash,Interno,Rfc,Nombre,SourceScale,
       SueldoD6,OtrasPrestacionesD6,QuinqueniosD6,DiasLaborados,DiasOrigen,SueldoMensualD6,BaseCotizacionSueldoD6,
       QuinqueniosMensualD6,BaseCotizacionQuinqueniosD6,CAIRD6,CAIRFondoD6,FRAD6,FRED6,PrestacionesD6,FHD6,FVD6,ViviendaD6,
       FAAD6,FAED6,FATD6,FAID6,GuarderiasD6,TransitorioD6,AguinaldoD6,RetencionPCPD6,RetencionPMPD6,RetencionHIPD6,HashFila)
      SELECT @Id,v.SnapshotDetalleId,@Orden,@EmpleadoClave,@EmpleadoClaveHash,@Interno,@Rfc,@Nombre,@SourceScale,
       @SueldoD6,@OtrasPrestacionesD6,@QuinqueniosD6,@DiasLaborados,@DiasOrigen,@SueldoMensualD6,@BaseCotizacionSueldoD6,
       @QuinqueniosMensualD6,@BaseCotizacionQuinqueniosD6,@CAIRD6,@CAIRFondoD6,@FRAD6,@FRED6,@PrestacionesD6,@FHD6,@FVD6,@ViviendaD6,
       @FAAD6,@FAED6,@FATD6,@FAID6,@GuarderiasD6,@TransitorioD6,@AguinaldoD6,@RetencionPCPD6,@RetencionPMPD6,@RetencionHIPD6,@HashFila
      FROM aportaciones.SnapshotCalculoV2Detalle v
      WHERE v.SnapshotId=@SnapshotV2Id AND v.EmpleadoClaveHash=@EmpleadoClaveHash`);
    if (inserted.rowsAffected[0] !== 1) qnaFail('No se encontro el detalle V2 enlazado', 'QNA_DETALLE_V2_NO_ENCONTRADO', 500);
  }

  private async insertTransition(transaction: Transaction, processId: string, snapshotId: string, origin: string | null, destination: string, motivo: string | null, usuarioId: string): Promise<void> {
    await new sql.Request(transaction).input('ProcesoId', sql.BigInt, processId).input('Id', sql.BigInt, snapshotId)
      .input('Origen', sql.VarChar(30), origin).input('Destino', sql.VarChar(30), destination)
      .input('Motivo', sql.NVarChar(500), motivo).input('UsuarioId', sql.NVarChar(100), usuarioId)
      .query(`INSERT INTO liquidacion.QnaProcesoTransicion (QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
        VALUES (@ProcesoId,@Id,@Origen,@Destino,@Motivo,@UsuarioId)`);
  }

  private async projectV5Retentions(transaction: Transaction, snapshotId: string, version: number, usuarioId: string): Promise<void> {
    if (version < 5) return;
    await new sql.Request(transaction)
      .input('LiquidacionSnapshotId', sql.BigInt, snapshotId)
      .input('UsuarioId', sql.NVarChar(100), usuarioId)
      .execute('retenciones.spProyectarRetencionesV3DesdeSnapshotV5');
  }

  private async projectV5Legacy(transaction: Transaction, snapshotId: string, version: number, usuarioId: string): Promise<{
    status: 'COMPLETE' | 'WARNING' | 'ERROR' | undefined;
    details: string[];
  }> {
    if (version < 5) return { status: undefined, details: [] };
    const result = await new sql.Request(transaction)
      .input('LiquidacionSnapshotId', sql.BigInt, snapshotId)
      .input('UsuarioId', sql.NVarChar(100), usuarioId)
      .execute('liquidacion.spProyectarLegacyDesdeSnapshotV5');
    const status = String(result.recordset?.[0]?.Estado ?? 'ERROR');
    if (!['COMPLETE', 'WARNING', 'ERROR'].includes(status)) qnaFail('Resultado de proyeccion legacy invalido', 'QNA_LEGACY_RESULTADO_INVALIDO', 500);
    const details = (result.recordset ?? [])
      .map((row: Record<string, unknown>) => [row.Codigo, row.Detalle].filter(Boolean).join(': '))
      .filter((detail: string) => detail.length > 0);
    return { status: status as 'COMPLETE' | 'WARNING' | 'ERROR', details };
  }

  private mapSnapshot(row: Record<string, any>, sourceRows: Array<Record<string, any>>, detailRows: Array<Record<string, any>>, decision: Record<string, any> | null): QnaSnapshot {
    const sources = sourceRows.map(source => ({
      dominio: source.Dominio, tipoFuente: source.TipoFuente, estado: source.Estado, requerida: Boolean(source.Requerida),
      identificadorFuente: String(source.IdentificadorFuente), hashFuente: source.HashFuente === null ? null : String(source.HashFuente),
      sourceScale: Number(source.SourceScale), registros: Number(source.Registros), notApplicableAprobado: Boolean(source.NotApplicableAprobado),
      aprobadoPor: source.AprobadoPor === null ? null : String(source.AprobadoPor), evidencia: source.Evidencia === null ? null : String(source.Evidencia),
      errorCode: source.ErrorCode === null ? null : String(source.ErrorCode),
    })) as QnaSource[];
    const details = detailRows.map(detail => ({ dominio: detail.Dominio, orden: Number(detail.Orden), claveFilaHash: String(detail.ClaveFilaHash),
      sourceScale: Number(detail.SourceScale), importeOficialD6: String(detail.ImporteOficialD6), payloadCanonico: JSON.parse(String(detail.PayloadCanonico)),
      hashFila: String(detail.HashFila),
      ...(detail.PayloadVersion === null || detail.PayloadVersion === undefined ? {} : {
        empleadoClave: String(detail.EmpleadoClave), rfc: detail.Rfc === null ? null : String(detail.Rfc),
        nombre: String(detail.Nombre), payloadVersion: Number(detail.PayloadVersion) as 1
      }) })) as QnaSourceDetail[];
    const totals = { registros: Number(row.totalRegistros) } as QnaTotals;
    for (const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>) {
      const value = row[key] ?? (key === 'cairFondoA2' ? row.cairA2 : null);
      totals[key] = String(value);
    }
    return {
      liquidacionSnapshotId: String(row.LiquidacionSnapshotId), entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena),
      periodo: String(row.Periodo), organica0: String(row.Organica0), organica1: String(row.Organica1), organica2: String(row.Organica2), organica3: String(row.Organica3),
       ambiente: row.Ambiente, estado: row.Estado, revision: Number(row.Revision), precisionPolicy: row.PrecisionPolicy, versionEsquema: Number(row.VersionEsquema) as 3 | 4 | 5,
      hashContenido: String(row.HashContenido), snapshotCalculoV2Id: row.SnapshotCalculoV2Id === null ? null : String(row.SnapshotCalculoV2Id),
      nominaCargaId: row.NominaCargaId === null ? null : String(row.NominaCargaId), formulaCalculoVersionId: row.FormulaCalculoVersionId === null ? null : String(row.FormulaCalculoVersionId),
      fuentesEsperadas: 10, fuentesCompletas: Number(row.FuentesCompletas), usuarioId: row.UsuarioId === null ? null : String(row.UsuarioId),
      fechaCreacion: new Date(row.FechaCreacion).toISOString(), fuentes: sources, totales: totals, detalles: details,
      ultimaDecision: decision ? this.mapDecision(decision) : null, esOficial: Boolean(row.EsOficial),
    };
  }

  private mapDecision(row: Record<string, any>): QnaDecisionRecord {
    return { qnaSnapshotDecisionId: String(row.QnaSnapshotDecisionId), decision: row.Decision, politicaVersion: PRECISION_POLICY,
      comentario: row.Comentario === null ? null : String(row.Comentario), usuarioId: String(row.UsuarioId), fechaCreacion: new Date(row.FechaCreacion).toISOString() };
  }
}

function sameScope(left: QnaScope, right: QnaScope): boolean {
  return left.entidadId === right.entidadId && left.anio === right.anio && left.quincena === right.quincena
    && left.organica0 === right.organica0 && left.organica1 === right.organica1
    && left.organica2 === right.organica2 && left.organica3 === right.organica3;
}

function searchPattern(value?: string): string | null {
  if (!value) return null;
  return `%${value.replace(/~/g, '~~').replace(/%/g, '~%').replace(/_/g, '~_').replace(/\[/g, '~[')}%`;
}
