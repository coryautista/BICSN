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
  QnaAppliedListItem, QnaAppliedListResult, QnaAppliedMetadata, QnaAppliedPeriod, QnaAppliedScope, QnaAppliedSelection,
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
import { calcularSnapshotCalculoV2Hash } from '../../../aportacionesFondos/domain/services/SnapshotCalculoV2Hasher.js';
import type { SnapshotCalculoV2Input } from '../../../aportacionesFondos/domain/entities/SnapshotCalculoV2.js';

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
const V2_HEADER_SELECT=`CONVERT(VARCHAR(30),v.SnapshotId) SnapshotId,v.EntidadId,v.Anio,v.Quincena,v.Organica0,v.Organica1,v.Organica2,v.Organica3,v.Ambiente,v.Fuente,v.Estado,
  CONVERT(VARCHAR(30),v.FormulaCalculoVersionId) FormulaCalculoVersionId,CONVERT(VARCHAR(30),v.NominaCargaId) NominaCargaId,v.PrecisionPolicy,v.VersionEsquema,v.HashContenido,v.Registros,
  CONVERT(VARCHAR(40),CAST(v.CAIR AS DECIMAL(19,2))) CAIR,CONVERT(VARCHAR(40),CAST(v.CAIR_FONDO AS DECIMAL(19,2))) CAIR_FONDO,
  CONVERT(VARCHAR(40),CAST(v.FRA AS DECIMAL(19,2))) FRA,CONVERT(VARCHAR(40),CAST(v.FRE AS DECIMAL(19,2))) FRE,CONVERT(VARCHAR(40),CAST(v.PRESTACIONES AS DECIMAL(19,2))) PRESTACIONES,
  CONVERT(VARCHAR(40),CAST(v.FH AS DECIMAL(19,2))) FH,CONVERT(VARCHAR(40),CAST(v.FV AS DECIMAL(19,2))) FV,CONVERT(VARCHAR(40),CAST(v.VIVIENDA AS DECIMAL(19,2))) VIVIENDA,
  CONVERT(VARCHAR(40),CAST(v.FAA AS DECIMAL(19,2))) FAA,CONVERT(VARCHAR(40),CAST(v.FAE AS DECIMAL(19,2))) FAE,CONVERT(VARCHAR(40),CAST(v.FAT AS DECIMAL(19,2))) FAT,CONVERT(VARCHAR(40),CAST(v.FAI AS DECIMAL(19,2))) FAI`;
const V2_DETAIL_SELECT=`vd.Orden,vd.EmpleadoClaveHash,CONVERT(VARCHAR(20),CAST(vd.DiasLaborados AS DECIMAL(5,2))) DiasLaborados,vd.DiasOrigen,
  CONVERT(VARCHAR(40),CAST(vd.SueldoMensualD6 AS DECIMAL(19,6))) SueldoMensualD6,CONVERT(VARCHAR(40),CAST(vd.OtrasPrestacionesMensualesD6 AS DECIMAL(19,6))) OtrasPrestacionesMensualesD6,
  CONVERT(VARCHAR(40),CAST(vd.QuinqueniosMensualD6 AS DECIMAL(19,6))) QuinqueniosMensualD6,CONVERT(VARCHAR(40),CAST(vd.BaseCotizacionSueldoD6 AS DECIMAL(19,6))) BaseCotizacionSueldoD6,
  CONVERT(VARCHAR(40),CAST(vd.BaseCotizacionQuinqueniosD6 AS DECIMAL(19,6))) BaseCotizacionQuinqueniosD6,CONVERT(VARCHAR(40),CAST(vd.CAIRD6 AS DECIMAL(19,6))) CairD6,
  CONVERT(VARCHAR(40),CAST(vd.CAIRFondoD6 AS DECIMAL(19,6))) CairFondoD6,CONVERT(VARCHAR(40),CAST(vd.FRAD6 AS DECIMAL(19,6))) FraD6,
  CONVERT(VARCHAR(40),CAST(vd.FRED6 AS DECIMAL(19,6))) FreD6,CONVERT(VARCHAR(40),CAST(vd.PrestacionesD6 AS DECIMAL(19,6))) PrestacionesD6,
  CONVERT(VARCHAR(40),CAST(vd.FHD6 AS DECIMAL(19,6))) FhD6,CONVERT(VARCHAR(40),CAST(vd.FVD6 AS DECIMAL(19,6))) FvD6,
  CONVERT(VARCHAR(40),CAST(vd.ViviendaD6 AS DECIMAL(19,6))) ViviendaD6,CONVERT(VARCHAR(40),CAST(vd.FAAD6 AS DECIMAL(19,6))) FaaD6,
  CONVERT(VARCHAR(40),CAST(vd.FAED6 AS DECIMAL(19,6))) FaeD6,CONVERT(VARCHAR(40),CAST(vd.FATD6 AS DECIMAL(19,6))) FatD6,CONVERT(VARCHAR(40),CAST(vd.FAID6 AS DECIMAL(19,6))) FaiD6`;
type DeferredRead<T> = { resolveAfterCommit: () => T };
type AppliedSelectionRecord = { id: string; processId: string; appliedAt: Date; version: 3 | 4 | 5 } | {
  id: null; processId: null; appliedAt: Date; version: 0; scope: QnaAppliedScope & QnaAppliedPeriod;
};

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
    const request = this.appliedRequest(filter, transaction).input('Anio',sql.SmallInt,filter.anio??null).input('Quincena',sql.TinyInt,filter.quincena??null)
      .input('Busqueda',sql.NVarChar(206),searchPattern(filter.buscar)).input('Offset',sql.Int,(filter.page-1)*filter.pageSize).input('Tamanio',sql.Int,filter.pageSize);
    const result = await request.query(`${appliedAllSourcesCte()}
      SELECT TOP(1) COALESCE(a.IntegrityCode,CASE WHEN a.Fuente='HISTORICO_LEGACY' THEN 'QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT' ELSE 'QNA_APLICADA_INTEGRIDAD_INVALIDA' END) IntegrityCode
      FROM Elegibles a WHERE ${this.appliedScopeWhere()} AND (@Anio IS NULL OR a.Anio=@Anio) AND (@Quincena IS NULL OR a.Quincena=@Quincena)
        AND ${appliedAllSourcesSearch()} AND (a.IntegrityCode IS NOT NULL OR (a.Fuente='HISTORICO_LEGACY' AND ${legacyOwnershipConflictSql('a')})
          OR (a.Fuente<>'HISTORICO_LEGACY' AND ${appliedStructuralConflictSql('a')})) ORDER BY a.Anio DESC,a.Quincena DESC,a.OrdenTie DESC;
      ${appliedAllSourcesCte()}
      SELECT COUNT(*) Total FROM Elegibles a WHERE ${this.appliedScopeWhere()} AND (@Anio IS NULL OR a.Anio=@Anio) AND (@Quincena IS NULL OR a.Quincena=@Quincena) AND ${appliedAllSourcesSearch()};
      ${appliedAllSourcesCte()}
      SELECT * FROM Elegibles a WHERE ${this.appliedScopeWhere()} AND (@Anio IS NULL OR a.Anio=@Anio) AND (@Quincena IS NULL OR a.Quincena=@Quincena) AND ${appliedAllSourcesSearch()}
      ORDER BY a.Anio DESC,a.Quincena DESC,a.EntidadId,a.Organica0,a.Organica1,a.Organica2,a.Organica3,a.FechaAplicacion DESC,a.OrdenTie DESC
      OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    const sets=result.recordsets as Array<Array<Record<string,any>>>;
    if(sets[0].length>0){const code=String(sets[0][0].IntegrityCode??'QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT');
      qnaFail(code==='QNA_APLICADA_LEGACY_AMBIGUA'?'La evidencia historica aplicada es ambigua':'La evidencia aplicada no cumple integridad',code,code.includes('AMBIGUA')||code.includes('CONFLICT')?409:500);}
    const mapSelection=(row:Record<string,any>):AppliedSelectionRecord=>row.Fuente==='HISTORICO_LEGACY'
      ? {id:null,processId:null,appliedAt:new Date(row.FechaAplicacion),version:0 as const,scope:{entidadId:Number(row.EntidadId),anio:Number(row.Anio),quincena:Number(row.Quincena),organica0:String(row.Organica0),organica1:String(row.Organica1),organica2:String(row.Organica2),organica3:String(row.Organica3)}}
      : {id:String(row.LiquidacionSnapshotId),processId:String(row.QnaProcesoId),appliedAt:new Date(row.FechaAplicacion),version:Number(row.VersionEsquema) as 3|4|5};
    const selections=sets[2].map(mapSelection);
    const v5=selections.filter(item=>item.version===5) as Array<{id:string;processId:string;appliedAt:Date;version:5}>;
    const reconstructed=selections.filter(item=>item.version===3||item.version===4) as Array<{id:string;processId:string;appliedAt:Date;version:3|4}>;
    const legacy=selections.filter((item):item is Extract<AppliedSelectionRecord,{version:0}>=>item.version===0);
    const v5Items=await this.getAppliedBundles(v5,filter.esAdmin,transaction,true,false);
    const reconstructedItems=await this.getReconstructedListBundles(reconstructed,filter.esAdmin,transaction);
    const legacyItems=await this.getLegacyListBundles(legacy,filter.esAdmin,transaction);
    const keyed=new Map<string,QnaAppliedListItem>();
    const resolvedV5=isDeferredRead(v5Items)?v5Items.resolveAfterCommit():v5Items;
    for(const item of [...resolvedV5,...reconstructedItems,...legacyItems]) keyed.set(appliedItemKey(item),item);
    const items=selections.map(item=>keyed.get(selectionKey(item))!).filter(Boolean);
    const resultMetadata = { page: filter.page, pageSize: filter.pageSize, total: Number(sets[1][0].Total) };
    return { items, ...resultMetadata };
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
    if (selected.version === 0) return this.getLegacySummary(selected, filter.esAdmin, transaction);
    if (selected.version < 5) return this.getReconstructedSummary(selected, filter.esAdmin, transaction);
    const items = await this.getAppliedBundles([selected], filter.esAdmin, transaction, true, deferMapping);
    const totals = await this.getAppliedTotals(selected.id, transaction);
    return isDeferredRead(items)
      ? { resolveAfterCommit: () => ({ ...items.resolveAfterCommit()[0], totales: totals, totalStrategies: persistedTotalStrategies() }) }
      : { ...items[0], totales: totals, totalStrategies: persistedTotalStrategies() };
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
    if (selected.version === 0) return this.getLegacyDetails(selected, filter, transaction);
    if (selected.version < 5) return this.getReconstructedDetails(selected, filter, transaction);
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
      return { ...item, dominio: filter.dominio, totalDominioA2: String(totals[DOMAIN_TOTAL_KEYS[filter.dominio]]), totalStrategy: 'PERSISTED', detalles: details,
        page: filter.page, pageSize: filter.pageSize, total: Number(sets[0][0].Total) };
    };
    return deferMapping ? { resolveAfterCommit: resolve } : resolve();
  }

  private async getReconstructedSummary(
    selected: { id: string; appliedAt: Date; version: number },
    isAdmin: boolean,
    transaction: Transaction
  ): Promise<QnaAppliedSummary> {
    const result = await new sql.Request(transaction).input('Id', sql.BigInt, selected.id).query(`
      SELECT ${APPLIED_HEADER_SELECT},(SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=s.LiquidacionSnapshotId) TotalCount,
        (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2 v WHERE v.SnapshotId=s.SnapshotCalculoV2Id) V2Count,
        (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2 v WHERE v.SnapshotId=s.SnapshotCalculoV2Id AND v.EntidadId=s.EntidadId AND v.Anio=s.Anio AND v.Quincena=s.Quincena
          AND v.Organica0=s.Organica0 AND v.Organica1=s.Organica1 AND v.Organica2=s.Organica2 AND v.Organica3=s.Organica3) V2ScopeCount,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId) LegacyFundDetailCount
      FROM liquidacion.QnaSnapshot s WHERE s.LiquidacionSnapshotId=@Id;
      SELECT f.*,(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio) DetailCount
      FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=@Id ORDER BY f.Dominio;
      SELECT Dominio,Orden,ClaveFilaHash,SourceScale,CONVERT(VARCHAR(40),CAST(ImporteOficialD6 AS DECIMAL(19,6))) ImporteOficialD6,HashFila,PayloadCanonico,
        EmpleadoClave,Rfc,Nombre,PayloadVersion FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio,Orden;
      SELECT t.Registros,${TOTAL_SELECT} FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=@Id;
      SELECT ${V2_HEADER_SELECT} FROM liquidacion.QnaSnapshot s JOIN aportaciones.SnapshotCalculoV2 v ON v.SnapshotId=s.SnapshotCalculoV2Id WHERE s.LiquidacionSnapshotId=@Id;
      SELECT ${V2_DETAIL_SELECT} FROM liquidacion.QnaSnapshot s JOIN aportaciones.SnapshotCalculoV2Detalle vd ON vd.SnapshotId=s.SnapshotCalculoV2Id WHERE s.LiquidacionSnapshotId=@Id ORDER BY vd.Orden;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const header = sets[0][0];
    if (!header || ![3, 4].includes(Number(header.VersionEsquema))) qnaFail('Snapshot reconstruido invalido', 'QNA_APLICADA_INTEGRIDAD_INVALIDA', 500);
    const warnings = this.assertReconstructedIntegrity(header, sets[1], sets[2], sets[3], sets[4], sets[5]);
    const totalRow = sets[3][0];
    const totals = this.mapNullableAppliedTotals(totalRow);
    const strategies = Object.fromEntries(Object.keys(TOTAL_COLUMNS).map(key => [key, totalRow?.[key] != null ? 'PERSISTED' : 'UNAVAILABLE'])) as QnaAppliedSummary['totalStrategies'];
    if(totalRow&&totalRow.cairFondoA2==null&&totalRow.cairA2!=null){(totals as any).cairFondoA2=String(totalRow.cairA2);strategies.cairFondoA2='PERSISTED_CAIR_CONTROL_FALLBACK';
      warnings.push({code:'QNA_RECONSTRUIDA_CAIR_FONDO_DESDE_CONTROL',message:'CAIR_FONDO no existia en el esquema persistido; se expone el control CAIR bajo la estrategia historica nombrada.'});}
    if (!totalRow) warnings.push({ code: 'QNA_RECONSTRUIDA_TOTALES_NO_PERSISTIDOS', message: 'El snapshot no contiene agregados persistidos verificables.' });
    return { ...this.mapReconstructedMetadata(header, selected.appliedAt), fuentes: this.reconstructedSources(sets[1], isAdmin),
      totales: totals, totalStrategies: strategies, advertencias: warnings };
  }

  private async getReconstructedListBundles(
    selections: Array<{id:string;processId:string;appliedAt:Date;version:3|4}>,isAdmin:boolean,transaction:Transaction
  ):Promise<QnaAppliedListItem[]> {
    if(selections.length===0)return [];
    const request=new sql.Request(transaction).input('SelectionJson',sql.NVarChar(sql.MAX),JSON.stringify(selections.map(item=>({id:item.id}))));
    const result=await request.query(`${snapshotSelectionJsonCte()}
      SELECT ${APPLIED_HEADER_SELECT},(SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2 v WHERE v.SnapshotId=s.SnapshotCalculoV2Id) V2Count,
        (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2 v WHERE v.SnapshotId=s.SnapshotCalculoV2Id AND v.EntidadId=s.EntidadId AND v.Anio=s.Anio AND v.Quincena=s.Quincena
          AND v.Organica0=s.Organica0 AND v.Organica1=s.Organica1 AND v.Organica2=s.Organica2 AND v.Organica3=s.Organica3) V2ScopeCount,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId) LegacyFundDetailCount
      FROM X JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=X.LiquidacionSnapshotId;
       ${snapshotSelectionJsonCte()}
      SELECT f.*,(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio) DetailCount
      FROM X JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=X.LiquidacionSnapshotId ORDER BY f.LiquidacionSnapshotId,f.Dominio;
       ${snapshotSelectionJsonCte()}
      SELECT d.LiquidacionSnapshotId,d.Dominio,d.Orden,d.ClaveFilaHash,d.SourceScale,CONVERT(VARCHAR(40),CAST(d.ImporteOficialD6 AS DECIMAL(19,6))) ImporteOficialD6,d.HashFila,d.PayloadCanonico,
        d.EmpleadoClave,d.Rfc,d.Nombre,d.PayloadVersion FROM X JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=X.LiquidacionSnapshotId ORDER BY d.LiquidacionSnapshotId,d.Dominio,d.Orden;
       ${snapshotSelectionJsonCte()}
      SELECT t.LiquidacionSnapshotId,t.Registros,${TOTAL_SELECT} FROM X JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=X.LiquidacionSnapshotId;
       ${snapshotSelectionJsonCte()}
      SELECT s.LiquidacionSnapshotId,${V2_HEADER_SELECT} FROM X JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=X.LiquidacionSnapshotId JOIN aportaciones.SnapshotCalculoV2 v ON v.SnapshotId=s.SnapshotCalculoV2Id;
       ${snapshotSelectionJsonCte()}
      SELECT s.LiquidacionSnapshotId,${V2_DETAIL_SELECT} FROM X JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=X.LiquidacionSnapshotId JOIN aportaciones.SnapshotCalculoV2Detalle vd ON vd.SnapshotId=s.SnapshotCalculoV2Id ORDER BY s.LiquidacionSnapshotId,vd.Orden;`);
    const sets=result.recordsets as Array<Array<Record<string,any>>>;
    const headers=new Map(sets[0].map(row=>[String(row.LiquidacionSnapshotId),row]));
    const grouped=sets.slice(1).map(rows=>groupRows(rows,row=>String(row.LiquidacionSnapshotId)));
    return selections.map(selection=>{
      const header=headers.get(selection.id);
      if(!header)qnaFail('Snapshot reconstruido sin cabecera','QNA_APLICADA_INTEGRIDAD_INVALIDA',500);
      const sources=grouped[0].get(selection.id)??[];const details=grouped[1].get(selection.id)??[];const totals=grouped[2].get(selection.id)??[];
      const v2Headers=grouped[3].get(selection.id)??[];const v2Details=grouped[4].get(selection.id)??[];
      const warnings=this.assertReconstructedIntegrity(header,sources,details,totals,v2Headers,v2Details);
      return {...this.mapReconstructedMetadata(header,selection.appliedAt),fuentes:this.reconstructedSources(sources,isAdmin),advertencias:warnings};
    });
  }

  private async getLegacyListBundles(selections:Array<Extract<AppliedSelectionRecord,{version:0}>>,isAdmin:boolean,transaction:Transaction):Promise<QnaAppliedListItem[]> {
    if(selections.length===0)return [];
    const request=new sql.Request(transaction).input('SelectionJson',sql.NVarChar(sql.MAX),JSON.stringify(selections.map(item=>item.scope)));
    const result=await request.query(`${legacySelectionJsonCte()}
      SELECT x.*,(SELECT COUNT(*) FROM liquidacion.QnaLegacyScopeOwnership o WHERE o.Organica0=x.Organica0 AND o.Organica1=x.Organica1 AND o.Anio=x.Anio AND o.Quincena=x.Quincena) OwnershipCount,
        (SELECT SUM(n) FROM(SELECT COUNT(*) n FROM aportaciones.IndividualesAhorroHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM aportaciones.ResumenHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NOT NULL
          UNION ALL SELECT COUNT(*) FROM conciliacion.RevisionAplicacionHistorico h WHERE h.Organica0=x.Organica0 AND h.Organica1=x.Organica1 AND h.Organica2=x.Organica2 AND h.Organica3=x.Organica3
            AND h.Periodo=RIGHT('0'+CONVERT(VARCHAR(2),x.Quincena),2)+RIGHT(CONVERT(VARCHAR(4),x.Anio),2) AND (h.QnaLiquidacionSnapshotId IS NOT NULL OR h.LiquidacionSnapshotId IS NOT NULL))z) OwnedRows
      FROM X x;
       ${legacySelectionJsonCte()}
      SELECT x.*,d.* FROM X x CROSS APPLY(SELECT * FROM(VALUES
        ('AHORRO',(SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),6),
        ('VIVIENDA',(SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),6),
        ('PRESTACIONES',(SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),6),
        ('CAIR',(SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),6),
        ('GUARDERIAS',(SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2),
        ('TRANSITORIO',(SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2),
        ('AGUINALDO',(SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2),
        ('PCP',(SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2),
        ('PMP',(SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2),
        ('HIP',(SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico h WHERE h.clave_organica_0=x.Organica0 AND h.clave_organica_1=x.Organica1 AND h.anio=x.Anio AND h.quincena=x.Quincena AND h.QnaLiquidacionSnapshotId IS NULL),2)
      )v(Dominio,Registros,SourceScale))d ORDER BY x.Anio,x.Quincena,x.EntidadId,x.Organica0,x.Organica1,x.Organica2,x.Organica3,d.Dominio;`);
    const sets=result.recordsets as Array<Array<Record<string,any>>>;
    if(sets[0].some(row=>Number(row.OwnershipCount)>0||Number(row.OwnedRows)>0))qnaFail('La evidencia historica pertenece a una proyeccion V5','QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT',409);
    const rowsByScope=groupRows(sets[1],legacyRowKey);
    return selections.map(selection=>{const rows=rowsByScope.get(selectionKey(selection))??[];const warnings:QnaAppliedWarning[]=[
      {code:'LEGACY_REDUCED_ROWS_UNLINKED',message:'Las filas historicas solo conservan org0/org1 y no estan enlazadas al evento TERMINADO de alcance completo.'}];
      const fuentes=rows.map(row=>{if(Number(row.Registros)===0)warnings.push({code:'QNA_LEGACY_ABSENT_UNVERIFIED',message:`No existen filas historicas verificables para ${row.Dominio}.`,dominio:row.Dominio});
        return {dominio:row.Dominio,tipoFuente:'SQL_HISTORICO',estado:Number(row.Registros)>0?'COMPLETE':'ABSENT_UNVERIFIED',requerida:true,sourceScale:Number(row.SourceScale),registros:Number(row.Registros),notApplicableAprobado:false,errorCode:null,
          ...(isAdmin?{identificadorFuente:`LEGACY:${row.Dominio}:${selection.scope.anio}:${selection.scope.quincena}:${selection.scope.organica0}:${selection.scope.organica1}`,hashFuente:null,aprobadoPor:null,evidencia:null}:{})} as QnaAppliedSource;});
      return {...this.mapLegacyMetadata(selection),fuentes,advertencias:warnings};});
  }

  private async getReconstructedDetails(
    selected: { id: string; appliedAt: Date; version: number },
    filter: QnaAppliedDetailFilter,
    transaction: Transaction
  ): Promise<QnaAppliedDetailResult> {
    const summary = await this.getReconstructedSummary(selected, filter.esAdmin, transaction);
    const pattern = searchPattern(filter.buscar);
    const request = new sql.Request(transaction).input('Id', sql.BigInt, selected.id).input('Dominio', sql.VarChar(30), filter.dominio)
      .input('Busqueda', sql.NVarChar(206), pattern).input('Offset', sql.Int, (filter.page - 1) * filter.pageSize).input('Tamanio', sql.Int, filter.pageSize);
    let result;
    if (FUND_DOMAINS.has(filter.dominio)) {
      const v2Amount={AHORRO:'FATD6',VIVIENDA:'ViviendaD6',PRESTACIONES:'PrestacionesD6',CAIR:'CAIRFondoD6'}[filter.dominio as 'AHORRO'|'VIVIENDA'|'PRESTACIONES'|'CAIR'];
      const evidence=`SELECT vd.Orden,NULL EmpleadoClave,NULL Rfc,NULL Nombre,CAST(6 AS TINYINT) SourceScale,CONVERT(VARCHAR(40),CAST(vd.${v2Amount} AS DECIMAL(19,6))) ImporteOficialD6,NULL HashFila,NULL PayloadVersion,
          (SELECT CONVERT(VARCHAR(40),CAST(vd.DiasLaborados AS DECIMAL(5,2))) diasLaborados,vd.DiasOrigen diasOrigen,
            CONVERT(VARCHAR(40),CAST(vd.SueldoMensualD6 AS DECIMAL(19,6))) sueldoMensualD6,CONVERT(VARCHAR(40),CAST(vd.OtrasPrestacionesMensualesD6 AS DECIMAL(19,6))) otrasPrestacionesMensualesD6,
            CONVERT(VARCHAR(40),CAST(vd.QuinqueniosMensualD6 AS DECIMAL(19,6))) quinqueniosMensualD6,CONVERT(VARCHAR(40),CAST(vd.BaseCotizacionSueldoD6 AS DECIMAL(19,6))) baseCotizacionSueldoD6,
            CONVERT(VARCHAR(40),CAST(vd.BaseCotizacionQuinqueniosD6 AS DECIMAL(19,6))) baseCotizacionQuinqueniosD6 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES) PayloadCanonico
        FROM liquidacion.QnaSnapshot s JOIN aportaciones.SnapshotCalculoV2Detalle vd ON vd.SnapshotId=s.SnapshotCalculoV2Id WHERE s.LiquidacionSnapshotId=@Id`;
      result = await request.query(`WITH Evidencia AS(${evidence}) SELECT COUNT(*) Total FROM Evidencia WHERE @Busqueda IS NULL OR CONCAT_WS('|',EmpleadoClave,Rfc,Nombre,PayloadCanonico) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~';
        WITH Evidencia AS(${evidence}) SELECT * FROM Evidencia WHERE @Busqueda IS NULL OR CONCAT_WS('|',EmpleadoClave,Rfc,Nombre,PayloadCanonico) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
        ORDER BY Orden OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    } else {
      result = await request.query(`SELECT COUNT(*) Total FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=@Id AND d.Dominio=@Dominio AND
          (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.PayloadCanonico COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~');
        SELECT d.Orden,d.EmpleadoClave,d.Rfc,d.Nombre,d.SourceScale,CONVERT(VARCHAR(40),CAST(d.ImporteOficialD6 AS DECIMAL(19,6))) ImporteOficialD6,
          d.PayloadVersion,d.PayloadCanonico,d.ClaveFilaHash,d.HashFila FROM liquidacion.QnaSnapshotFuenteDetalle d
        WHERE d.LiquidacionSnapshotId=@Id AND d.Dominio=@Dominio AND (@Busqueda IS NULL OR d.EmpleadoClave COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.Rfc COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~' OR d.Nombre COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          OR d.PayloadCanonico COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~') ORDER BY d.Orden OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    }
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const details = sets[1].map(row => ({ orden: Number(row.Orden), empleadoClave: row.EmpleadoClave == null ? null : String(row.EmpleadoClave),
      rfc: row.Rfc == null ? null : String(row.Rfc), nombre: row.Nombre == null ? null : String(row.Nombre), sourceScale: Number(row.SourceScale) as 2 | 6,
      importeOficialD6: row.ImporteOficialD6 == null ? null : String(row.ImporteOficialD6), payloadVersion: row.PayloadVersion === 1 ? 1 as const : null,
      payloadCanonico: row.PayloadCanonico == null ? null : JSON.parse(String(row.PayloadCanonico)),
      ...(filter.esAdmin && row.ClaveFilaHash != null ? { claveFilaHash: String(row.ClaveFilaHash) } : {}),
      ...(filter.esAdmin && row.HashFila != null ? { hashFila: String(row.HashFila) } : {}) }));
    const totalKey = DOMAIN_TOTAL_KEYS[filter.dominio] as Exclude<keyof QnaTotals, 'registros'>;
    return { ...summary, dominio: filter.dominio, totalDominioA2: summary.totales[totalKey] as string | null,
      totalStrategy: summary.totalStrategies[totalKey], detalles: details, page: filter.page, pageSize: filter.pageSize, total: Number(sets[0][0].Total) };
  }

  private assertReconstructedIntegrity(header:Record<string,any>,sourceRows:Array<Record<string,any>>,detailRows:Array<Record<string,any>>,
    totalRows:Array<Record<string,any>>,v2Rows:Array<Record<string,any>>,v2DetailRows:Array<Record<string,any>>):QnaAppliedWarning[]{
    const warnings:QnaAppliedWarning[]=[];
    try{
      if(![3,4].includes(Number(header.VersionEsquema))||totalRows.length!==1||sourceRows.length!==10||new Set(sourceRows.map(row=>row.Dominio)).size!==10)throw new Error('shape');
      if(header.SnapshotCalculoV2Id!=null&&(Number(header.V2Count)!==1||Number(header.V2ScopeCount)!==1||v2Rows.length!==1))throw new Error('links');
      const sources=sourceRows.map(row=>({dominio:row.Dominio,tipoFuente:row.TipoFuente,estado:row.Estado,requerida:Boolean(row.Requerida),identificadorFuente:String(row.IdentificadorFuente),
        hashFuente:row.HashFuente==null?null:String(row.HashFuente),sourceScale:Number(row.SourceScale),registros:Number(row.Registros),notApplicableAprobado:Boolean(row.NotApplicableAprobado),
        aprobadoPor:row.AprobadoPor==null?null:String(row.AprobadoPor),evidencia:row.Evidencia==null?null:String(row.Evidencia),errorCode:row.ErrorCode==null?null:String(row.ErrorCode)})) as QnaSource[];
      const details=detailRows.map(row=>({dominio:row.Dominio,orden:Number(row.Orden),claveFilaHash:String(row.ClaveFilaHash),sourceScale:Number(row.SourceScale),
        importeOficialD6:String(row.ImporteOficialD6),payloadCanonico:JSON.parse(String(row.PayloadCanonico)),hashFila:String(row.HashFila),
        ...(row.PayloadVersion==null?{}:{empleadoClave:row.EmpleadoClave==null?undefined:String(row.EmpleadoClave),rfc:row.Rfc==null?null:String(row.Rfc),nombre:row.Nombre==null?undefined:String(row.Nombre),payloadVersion:1 as const})})) as QnaSourceDetail[];
      const totalRow=totalRows[0];const totals={registros:Number(totalRow.Registros)} as QnaTotals;
      for(const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>){const value=totalRow[key]??(key==='cairFondoA2'?totalRow.cairA2:null);if(value==null)throw new Error(`total:${key}`);totals[key]=String(value);}
      const persisted:CreateQnaCandidateInput={entidadId:Number(header.EntidadId),anio:Number(header.Anio),quincena:Number(header.Quincena),organica0:String(header.Organica0),organica1:String(header.Organica1),
        organica2:String(header.Organica2),organica3:String(header.Organica3),ambiente:header.Ambiente,snapshotCalculoV2Id:header.SnapshotCalculoV2Id==null?null:String(header.SnapshotCalculoV2Id),
        nominaCargaId:header.NominaCargaId==null?null:String(header.NominaCargaId),formulaCalculoVersionId:header.FormulaCalculoVersionId==null?null:String(header.FormulaCalculoVersionId),
        fuentes:sources,totales:totals,detalles:details,usuarioId:header.UsuarioId==null?null:String(header.UsuarioId),versionEsquema:Number(header.VersionEsquema) as 3|4};
      const validated=validateQnaCandidate(persisted,{retentionProvenanceMode:'PERSISTED_HISTORICAL'});
      if(validated.hashContenido!==String(header.HashContenido)||validated.completas!==Number(header.FuentesCompletas)||(validated.completas===10)!==(header.Estado==='COMPLETO'))throw new Error('content');
      if(v2Rows.length===1){const v2=this.mapPersistedV2(v2Rows[0],v2DetailRows);if(calcularSnapshotCalculoV2Hash(v2)!==String(v2Rows[0].HashContenido)||v2.detalles.length!==Number(v2Rows[0].Registros))throw new Error('v2hash');
        const expected:Record<string,string>={cairA2:v2.totalesA2.CAIR,cairFondoA2:v2.totalesA2.CAIR_FONDO,ahorroA2:v2.totalesA2.FAT,fraA2:v2.totalesA2.FRA,freA2:v2.totalesA2.FRE,
          prestacionesA2:v2.totalesA2.PRESTACIONES,fhA2:v2.totalesA2.FH,fvA2:v2.totalesA2.FV,viviendaA2:v2.totalesA2.VIVIENDA,faaA2:v2.totalesA2.FAA,faeA2:v2.totalesA2.FAE,fatA2:v2.totalesA2.FAT,faiA2:v2.totalesA2.FAI};
        if(Object.entries(expected).some(([key,value])=>totals[key as keyof QnaTotals]!==value))throw new Error('v2totals');
        for(const domain of ['AHORRO','VIVIENDA','PRESTACIONES','CAIR'] as const){const source=sources.find(item=>item.dominio===domain)!;if(source.estado==='COMPLETE'&&source.registros!==v2.detalles.length)throw new Error(`fundcount:${domain}`);}
      }else if(sources.some(source=>FUND_DOMAINS.has(source.dominio)&&source.estado==='COMPLETE'))warnings.push({code:'QNA_RECONSTRUIDA_FONDOS_SIN_V2',message:'Los fondos declarados no tienen detalle V2 congelado; no se fabrican identidades ni payload.'});
      if(v2Rows.length===1)warnings.push({code:'QNA_RECONSTRUIDA_FONDOS_DESDE_V2_SIN_IDENTIDAD',message:'Los detalles de fondos se reconstruyen exclusivamente desde SnapshotCalculoV2Detalle; identidad, interno, RFC y nombre no estan disponibles.'});
      if(Number(header.LegacyFundDetailCount)>0)warnings.push({code:'QNA_RECONSTRUIDA_DETALLE_PREV5_IGNORADO',message:'QnaSnapshotDetalle pre-V5 no forma parte de la evidencia validada y fue ignorado.'});
      for(const source of sources)if(!['COMPLETE','NOT_APPLICABLE'].includes(source.estado))warnings.push({code:'QNA_RECONSTRUIDA_FUENTE_PARCIAL',message:`La fuente ${source.dominio} conserva estado ${source.estado}.`,dominio:source.dominio});
    }catch{qnaFail('La evidencia V3/V4 aplicada no cumple integridad','QNA_APLICADA_INTEGRIDAD_INVALIDA',500);}
    for(const [field,code] of [['SnapshotCalculoV2Id','SNAPSHOT_V2'],['NominaCargaId','NOMINA'],['FormulaCalculoVersionId','FORMULA']] as const)
      if(header[field]==null)warnings.push({code:`QNA_RECONSTRUIDA_${code}_NO_PERSISTIDO`,message:`El metadato ${field} no esta disponible en la evidencia persistida.`});
    return warnings;
  }

  private mapPersistedV2(row:Record<string,any>,details:Array<Record<string,any>>):SnapshotCalculoV2Input{
    const nullable=(value:unknown)=>value==null?null:String(value);
    return {entidadId:Number(row.EntidadId),anio:Number(row.Anio),quincena:Number(row.Quincena),organica0:String(row.Organica0),organica1:String(row.Organica1),organica2:String(row.Organica2),organica3:String(row.Organica3),
      ambiente:row.Ambiente,fuente:row.Fuente,estado:row.Estado,formulaCalculoVersionId:nullable(row.FormulaCalculoVersionId),nominaCargaId:nullable(row.NominaCargaId),precisionPolicy:String(row.PrecisionPolicy),versionEsquema:Number(row.VersionEsquema),usuarioId:null,
      totalesA2:{CAIR:String(row.CAIR),CAIR_FONDO:String(row.CAIR_FONDO),FRA:String(row.FRA),FRE:String(row.FRE),PRESTACIONES:String(row.PRESTACIONES),FH:String(row.FH),FV:String(row.FV),VIVIENDA:String(row.VIVIENDA),FAA:String(row.FAA),FAE:String(row.FAE),FAT:String(row.FAT),FAI:String(row.FAI)},
      detalles:details.map(item=>({orden:Number(item.Orden),empleadoClaveHash:String(item.EmpleadoClaveHash),diasLaborados:nullable(item.DiasLaborados),diasOrigen:item.DiasOrigen,
        sueldoMensualD6:nullable(item.SueldoMensualD6),otrasPrestacionesMensualesD6:nullable(item.OtrasPrestacionesMensualesD6),quinqueniosMensualD6:nullable(item.QuinqueniosMensualD6),
        baseCotizacionSueldoD6:nullable(item.BaseCotizacionSueldoD6),baseCotizacionQuinqueniosD6:nullable(item.BaseCotizacionQuinqueniosD6),cairD6:nullable(item.CairD6),cairFondoD6:nullable(item.CairFondoD6),
        fraD6:nullable(item.FraD6),freD6:nullable(item.FreD6),prestacionesD6:nullable(item.PrestacionesD6),fhD6:nullable(item.FhD6),fvD6:nullable(item.FvD6),viviendaD6:nullable(item.ViviendaD6),faaD6:nullable(item.FaaD6),faeD6:nullable(item.FaeD6),fatD6:nullable(item.FatD6),faiD6:nullable(item.FaiD6)}))};
  }

  private reconstructedSources(rows: Array<Record<string, any>>, isAdmin: boolean): QnaAppliedSource[] {
    const byDomain = new Map(rows.map(row => [String(row.Dominio), row]));
    return (['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP'] as QnaDomain[]).map(domain => {
      const row = byDomain.get(domain);
      return row ? this.mapAppliedSource(row, isAdmin) : { dominio: domain, tipoFuente: 'SQL_HISTORICO', estado: 'ABSENT_UNVERIFIED', requerida: true,
        sourceScale: FUND_DOMAINS.has(domain) ? 6 : 2, registros: 0, notApplicableAprobado: false, errorCode: null };
    });
  }

  private mapReconstructedMetadata(row: Record<string, any>, appliedAt: Date): QnaAppliedMetadata {
    return { liquidacionSnapshotId: String(row.LiquidacionSnapshotId), entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena),
      periodo: String(row.Periodo), organica0: String(row.Organica0), organica1: String(row.Organica1), organica2: String(row.Organica2), organica3: String(row.Organica3),
      ambiente: row.Ambiente, revision: Number(row.Revision), snapshotCalculoV2Id: row.SnapshotCalculoV2Id == null ? null : String(row.SnapshotCalculoV2Id),
      nominaCargaId: row.NominaCargaId == null ? null : String(row.NominaCargaId), formulaCalculoVersionId: row.FormulaCalculoVersionId == null ? null : String(row.FormulaCalculoVersionId),
      precisionPolicy: String(row.PrecisionPolicy), hashContenido: String(row.HashContenido), fechaAplicacion: appliedAt.toISOString(),
      fechaCreacion: new Date(row.FechaCreacion).toISOString(), fuente: 'SNAPSHOT_OFICIAL_RECONSTRUIDO', estadoProceso: 'TERMINADO', reconstructionStrategy: 'SNAPSHOT_V3_V4_PERSISTED_V2_FUNDS' };
  }

  private mapNullableAppliedTotals(row?: Record<string, any>): QnaAppliedSummary['totales'] {
    const totals: Record<string, string | number | null> = { registros: row ? Number(row.Registros) : null };
    for (const key of Object.keys(TOTAL_COLUMNS)) totals[key] = row?.[key] == null ? null : String(row[key]);
    return totals as QnaAppliedSummary['totales'];
  }

  private async selectLegacyApplied(filter: QnaAppliedSelection, transaction: Transaction): Promise<AppliedSelectionRecord | null> {
    const result = await this.appliedRequest(filter, transaction).input('Anio', sql.SmallInt, filter.anio).input('Quincena', sql.TinyInt, filter.quincena).query(`
      SELECT TRY_CONVERT(INT,b.EntidadId) EntidadId,b.Anio,b.Quincena,b.Org0 Organica0,b.Org1 Organica1,b.Org2 Organica2,b.Org3 Organica3,
        b.CreatedAt,COUNT(*) OVER(PARTITION BY b.EntidadId,b.Anio,b.Quincena,b.Org0,b.Org1,b.Org2,b.Org3) ExactEvidenceCount,
        (SELECT COUNT(*) FROM (SELECT DISTINCT x.EntidadId,x.Org2,x.Org3 FROM afec.BitacoraAfectacionOrg x
          WHERE x.Entidad='AFILIADOS' AND x.OrgNivel=3 AND x.Accion='TERMINADO' AND x.Resultado='OK' AND x.Anio=b.Anio AND x.Quincena=b.Quincena AND x.Org0=b.Org0 AND x.Org1=b.Org1) scopes) ReducedScopeCount
      FROM afec.BitacoraAfectacionOrg b
      WHERE b.Entidad='AFILIADOS' AND b.OrgNivel=3 AND b.Accion='TERMINADO' AND b.Resultado='OK' AND b.Anio=@Anio AND b.Quincena=@Quincena
        AND TRY_CONVERT(INT,b.EntidadId) IS NOT NULL AND (@EntidadId IS NULL OR TRY_CONVERT(INT,b.EntidadId)=@EntidadId) AND (@Organica0 IS NULL OR b.Org0=@Organica0)
        AND (@Organica1 IS NULL OR b.Org1=@Organica1) AND (@Organica2 IS NULL OR b.Org2=@Organica2) AND (@Organica3 IS NULL OR b.Org3=@Organica3)
      ORDER BY b.CreatedAt DESC,b.AfectacionId DESC;`);
    if (result.recordset.length === 0) return null;
    const scopes = new Set(result.recordset.map(row => `${row.EntidadId}|${row.Anio}|${row.Quincena}|${row.Organica0}|${row.Organica1}|${row.Organica2}|${row.Organica3}`));
    if (scopes.size !== 1 || Number(result.recordset[0].ReducedScopeCount) !== 1 || Number(result.recordset[0].ExactEvidenceCount) !== 1)
      qnaFail('La evidencia historica aplicada es ambigua', 'QNA_APLICADA_LEGACY_AMBIGUA', 409);
    const row = result.recordset[0];
    const scope = { entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena), organica0: String(row.Organica0),
      organica1: String(row.Organica1), organica2: String(row.Organica2), organica3: String(row.Organica3) };
    await this.assertLegacyNotOwned(scope, transaction);
    return { id: null, processId: null, appliedAt: new Date(row.CreatedAt), version: 0, scope };
  }

  private async assertLegacyNotOwned(scope: QnaAppliedScope & QnaAppliedPeriod, transaction: Transaction): Promise<void> {
    const request = this.appliedRequest(scope, transaction).input('Anio', sql.SmallInt, scope.anio).input('Quincena', sql.TinyInt, scope.quincena);
    const result = await request.query(`SELECT
      (SELECT COUNT(*) FROM liquidacion.QnaLegacyScopeOwnership o WHERE o.Organica0=@Organica0 AND o.Organica1=@Organica1 AND o.Anio=@Anio AND o.Quincena=@Quincena) OwnershipCount,
      (SELECT SUM(n) FROM (
        SELECT COUNT(*) n FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM aportaciones.ResumenHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NOT NULL
        UNION ALL SELECT COUNT(*) FROM conciliacion.RevisionAplicacionHistorico WHERE Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
          AND Periodo=RIGHT('0'+CONVERT(VARCHAR(2),@Quincena),2)+RIGHT(CONVERT(VARCHAR(4),@Anio),2) AND (QnaLiquidacionSnapshotId IS NOT NULL OR LiquidacionSnapshotId IS NOT NULL)
      ) x) OwnedRows;`);
    const row = result.recordset[0];
    if (Number(row.OwnershipCount) > 0 || Number(row.OwnedRows) > 0)
      qnaFail('La evidencia historica pertenece a una proyeccion V5', 'QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT', 409);
  }

  private async getLegacySummary(selected: Extract<AppliedSelectionRecord, { version: 0 }>, isAdmin: boolean, transaction: Transaction): Promise<QnaAppliedSummary> {
    const s = selected.scope;
    const result = await this.appliedRequest(s, transaction).input('Anio', sql.SmallInt, s.anio).input('Quincena', sql.TinyInt, s.quincena).query(`
      SELECT TOP(2) IdRevisionAplicacionHistorico,RegistrosOrigen,
        CONVERT(VARCHAR(60),CAST(CAIR AS DECIMAL(38,2))) CAIR,CONVERT(VARCHAR(60),CAST(FRA AS DECIMAL(38,2))) FRA,CONVERT(VARCHAR(60),CAST(FRE AS DECIMAL(38,2))) FRE,
        CONVERT(VARCHAR(60),CAST(FH AS DECIMAL(38,2))) FH,CONVERT(VARCHAR(60),CAST(FV AS DECIMAL(38,2))) FV,CONVERT(VARCHAR(60),CAST(FAA AS DECIMAL(38,2))) FAA,
        CONVERT(VARCHAR(60),CAST(FAE AS DECIMAL(38,2))) FAE,CONVERT(VARCHAR(60),CAST(FAT AS DECIMAL(38,2))) FAT,CONVERT(VARCHAR(60),CAST(FAI AS DECIMAL(38,2))) FAI,FechaAlta
        FROM conciliacion.RevisionAplicacionHistorico WHERE Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
        AND Periodo=RIGHT('0'+CONVERT(VARCHAR(2),@Quincena),2)+RIGHT(CONVERT(VARCHAR(4),@Anio),2) ORDER BY FechaAlta DESC,IdRevisionAplicacionHistorico DESC;
      SELECT tipo_endpoint,total_empleados,CONVERT(VARCHAR(40),CAST(total_contribucion AS DECIMAL(19,2))) total_contribucion
        FROM aportaciones.ResumenHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena
          AND QnaLiquidacionSnapshotId IS NULL ORDER BY tipo_endpoint;
      SELECT * FROM (VALUES
        ('AHORRO',(SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(ROUND(SUM(CAST(total AS DECIMAL(38,6))),2,1) AS DECIMAL(38,2))) FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),6),
        ('VIVIENDA',(SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(ROUND(SUM(CAST(total AS DECIMAL(38,6))),2,1) AS DECIMAL(38,2))) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),6),
        ('PRESTACIONES',(SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(ROUND(SUM(CAST(total AS DECIMAL(38,6))),2,1) AS DECIMAL(38,2))) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),6),
        ('CAIR',(SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(ROUND(SUM(CAST(total AS DECIMAL(38,6))),2,1) AS DECIMAL(38,2))) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),6),
        ('GUARDERIAS',(SELECT COUNT(*) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(recibo_total AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2),
        ('TRANSITORIO',(SELECT COUNT(*) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(transitorio AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2),
        ('AGUINALDO',(SELECT COUNT(*) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(general AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2),
        ('PCP',(SELECT COUNT(*) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(total AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2),
        ('PMP',(SELECT COUNT(*) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(total AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2),
        ('HIP',(SELECT COUNT(*) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),(SELECT CONVERT(VARCHAR(60),CAST(SUM(CAST(cantidad AS DECIMAL(38,2))) AS DECIMAL(38,2))) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL),2)
      ) d(Dominio,Registros,DetailTotal,SourceScale) ORDER BY Dominio;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    if (sets[0].length > 1) qnaFail('Revision historica ambigua', 'QNA_APLICADA_LEGACY_AMBIGUA', 409);
    const revision = sets[0][0];
    if(sets[1].length!==new Set(sets[1].map(row=>String(row.tipo_endpoint))).size)qnaFail('Resumen historico duplicado','QNA_APLICADA_LEGACY_AMBIGUA',409);
    const summaries = new Map(sets[1].map(row => [String(row.tipo_endpoint), row]));
    const domainRows = sets[2];
    const warnings: QnaAppliedWarning[] = [{code:'LEGACY_REDUCED_ROWS_UNLINKED',message:'Las filas historicas solo conservan el alcance reducido org0/org1 y no estan enlazadas al evento TERMINADO de alcance completo.'}];
    const sources = domainRows.map(row => {
      const count = Number(row.Registros);
      if (count === 0) warnings.push({ code: 'QNA_LEGACY_ABSENT_UNVERIFIED', message: `No existen filas historicas verificables para ${row.Dominio}.`, dominio: row.Dominio });
      return { dominio: row.Dominio, tipoFuente: 'SQL_HISTORICO', estado: count > 0 ? 'COMPLETE' : 'ABSENT_UNVERIFIED', requerida: true,
        sourceScale: Number(row.SourceScale), registros: count, notApplicableAprobado: false, errorCode: null,
        ...(isAdmin ? { identificadorFuente: `LEGACY:${row.Dominio}:${s.anio}:${s.quincena}:${s.organica0}:${s.organica1}`, hashFuente: null, aprobadoPor: null, evidencia: null } : {}) } as QnaAppliedSource;
    });
    const endpoint: Record<QnaDomain, string | null> = { AHORRO:'individuales/ahorro',VIVIENDA:'individuales/vivienda',PRESTACIONES:'individuales/prestaciones',CAIR:'individuales/cair',
      GUARDERIAS:'guarderias',TRANSITORIO:'pension-nomina-transitorio',AGUINALDO:'aguinaldo',PCP:null,PMP:null,HIP:null };
    const totalKeyByDomain = Object.fromEntries(Object.entries(DOMAIN_TOTAL_KEYS).map(([domain,key]) => [domain,key])) as Record<QnaDomain, Exclude<keyof QnaTotals,'registros'>>;
    const totals = Object.fromEntries(['registros',...Object.keys(TOTAL_COLUMNS)].map(key => [key,null])) as unknown as QnaAppliedSummary['totales'];
    const strategies = Object.fromEntries(Object.keys(TOTAL_COLUMNS).map(key => [key,'UNAVAILABLE'])) as QnaAppliedSummary['totalStrategies'];
    if (revision) {
      totals.registros = Number(revision.RegistrosOrigen);
      for (const key of ['cairA2','fraA2','freA2','fhA2','fvA2','faaA2','faeA2','fatA2','faiA2'] as const) {
        const column = TOTAL_COLUMNS[key].replace('A2','').toUpperCase(); totals[key] = revision[column]==null?null:String(revision[column]); strategies[key] = totals[key]==null?'UNAVAILABLE':'PERSISTED';
      }
    }
    for (const row of domainRows) {
      const domain = row.Dominio as QnaDomain; const key = totalKeyByDomain[domain]; const persisted = endpoint[domain] ? summaries.get(endpoint[domain]!) : undefined;
      if (persisted) {
        if(persisted.total_empleados!=null&&Number(persisted.total_empleados)!==Number(row.Registros))qnaFail(`Resumen ${domain} contradictorio`,'QNA_APLICADA_LEGACY_RESUMEN_INCONSISTENTE',409);
        totals[key] = persisted.total_contribucion==null?null:String(persisted.total_contribucion); strategies[key] = totals[key]==null?'UNAVAILABLE':'PERSISTED';
      }
      else if (Number(row.Registros) > 0 && row.DetailTotal != null) {
        totals[key] = String(row.DetailTotal); strategies[key] = 'DERIVED_DETAIL';
        warnings.push({ code: 'DERIVED_DETAIL', message: `El total de ${domain} se derivo con LEGACY_SUM_DETAIL_A2_V1.`, dominio: domain });
      }
    }
    this.deriveLegacyCombinedTotals(totals, strategies);
    const metadata = this.mapLegacyMetadata(selected);
    return { ...metadata, fuentes: sources, totales: totals, totalStrategies: strategies, advertencias: warnings };
  }

  private deriveLegacyCombinedTotals(totals: QnaAppliedSummary['totales'], strategies: QnaAppliedSummary['totalStrategies']): void {
    const derive = (target: Exclude<keyof QnaTotals,'registros'>, keys: Array<Exclude<keyof QnaTotals,'registros'>>) => {
      if (keys.every(key => totals[key] != null)) { totals[target] = addA2Exact(keys.map(key=>String(totals[key]))); strategies[target] = 'DERIVED_DETAIL'; }
    };
    derive('totalAportacionesA2',['ahorroA2','viviendaA2','prestacionesA2','cairFondoA2','guarderiasA2','transitorioA2','aguinaldoA2']);
    derive('totalRetencionesA2',['retencionPcpA2','retencionPmpA2','retencionHipA2']);
    derive('totalGeneralA2',['totalAportacionesA2','totalRetencionesA2']);
  }

  private async getLegacyDetails(
    selected: Extract<AppliedSelectionRecord, { version: 0 }>,
    filter: QnaAppliedDetailFilter,
    transaction: Transaction
  ): Promise<QnaAppliedDetailResult> {
    const summary = await this.getLegacySummary(selected, filter.esAdmin, transaction);
    const config: Record<QnaDomain, { table: string; employee: string; rfc: string; name: string; amount: string; scale: 2 | 6; fields: string }> = {
      AHORRO:{table:'aportaciones.IndividualesAhorroHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'NULL',name:'nombre',amount:'total',scale:6,fields:'interno,sueldo,quinquenios,otras_prestaciones,sueldo_base,afae,afaa,total'},
      VIVIENDA:{table:'aportaciones.IndividualesViviendaHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'NULL',name:'nombre',amount:'total',scale:6,fields:'interno,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total'},
      PRESTACIONES:{table:'aportaciones.IndividualesPrestacionesHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'NULL',name:'nombre',amount:'total',scale:6,fields:'interno,sueldo,quinquenios,otras_prestaciones,sueldo_base,afpe,afpa,total'},
      CAIR:{table:'aportaciones.IndividualesCairHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'NULL',name:'nombre',amount:'total',scale:6,fields:'interno,sueldo,quinquenios,otras_prestaciones,sueldo_base,afe,total'},
      GUARDERIAS:{table:'aportaciones.GuarderiasHistorico',employee:'titular_no_empleado',rfc:'titular_rfc',name:'titular_nombre',amount:'recibo_total',scale:2,fields:'titular_monto,entidad_monto,recibo_ajuste,recibo_total,recibo_mes_ano,recibo_fecha_venc,recibo_folio,menor_nombre,menor_nivel,menor_sala,estatus'},
      TRANSITORIO:{table:'aportaciones.PensionNominaTransitorioHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'rfc',name:'nombres',amount:'transitorio',scale:2,fields:'fpension,interno,sueldo,oprestaciones,quinquenios,tpension,transitorio,cconcepto,descripcion,importe,defuncion,total'},
      AGUINALDO:{table:'aportaciones.AguinaldoHistorico',employee:'noempleado',rfc:'rfc',name:'nombres',amount:'general',scale:2,fields:'interno,movimiento,tipomovimiento,fecha,dias_aguinaldo,cuantos,cuantos_ori,sdo,op,q,qna_a,diario,general,porcentaje,proporcion'},
      PCP:{table:'retenciones.PrestamosCortoPlazoHistorico',employee:'CONVERT(NVARCHAR(50),interno)',rfc:'rfc',name:'nombre',amount:'total',scale:2,fields:'interno,prestamo,letra,plazo,periodo_c,fecha_c,capital,interes,monto,moratorios,total,resultado,td'},
      PMP:{table:'retenciones.PrestamosMedianoPlazoHistorico',employee:'COALESCE(noemple,CONVERT(NVARCHAR(50),interno))',rfc:'rfc',name:'nombre',amount:'total',scale:2,fields:'interno,prestamo,letra,plazo,periodo_c,fecha_c,capital,moratorios,interes,seguro,total,resultado,clase,clave_p,folio,anio_prestamo'},
      HIP:{table:'retenciones.PrestamosHipotecariosHistorico',employee:'COALESCE(noempleado,CONVERT(NVARCHAR(50),interno))',rfc:'rfc',name:'nombre',amount:'cantidad',scale:2,fields:'computadora_antigua,interno,cantidad,status,pno_solicitud,pano,pclave_prestamo,periodo_c,descto,fecha_c,plazo,capital_pagar,interes_pagar,interes_diferido_pagar,seguro_pagar,moratorio_pagar'},
    };
    const c = config[filter.dominio];
    const pattern = searchPattern(filter.buscar);
    const result = await this.appliedRequest(selected.scope, transaction).input('Anio', sql.SmallInt, selected.scope.anio)
      .input('Quincena', sql.TinyInt, selected.scope.quincena).input('Busqueda', sql.NVarChar(206), pattern)
      .input('Offset', sql.Int, (filter.page - 1) * filter.pageSize).input('Tamanio', sql.Int, filter.pageSize).query(`
        WITH Evidencia AS (SELECT ROW_NUMBER() OVER(ORDER BY id) Orden,${c.employee} EmpleadoClave,${c.rfc} Rfc,${c.name} Nombre,
          CONVERT(VARCHAR(40),CAST(${c.amount} AS DECIMAL(19,6))) ImporteOficialD6,${c.fields}
          FROM ${c.table} WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL)
        SELECT COUNT(*) Total FROM Evidencia WHERE @Busqueda IS NULL OR CONCAT_WS('|',EmpleadoClave,Rfc,Nombre,${c.fields}) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~';
        WITH Evidencia AS (SELECT ROW_NUMBER() OVER(ORDER BY id) Orden,${c.employee} EmpleadoClave,${c.rfc} Rfc,${c.name} Nombre,
          CONVERT(VARCHAR(40),CAST(${c.amount} AS DECIMAL(19,6))) ImporteOficialD6,${c.fields}
          FROM ${c.table} WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena AND QnaLiquidacionSnapshotId IS NULL)
        SELECT * FROM Evidencia WHERE @Busqueda IS NULL OR CONCAT_WS('|',EmpleadoClave,Rfc,Nombre,${c.fields}) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'
          ORDER BY Orden OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;`);
    const sets = result.recordsets as Array<Array<Record<string, any>>>;
    const common = new Set(['Orden','EmpleadoClave','Rfc','Nombre','ImporteOficialD6']);
    const details: QnaAppliedDetailRow[] = sets[1].map(row => ({ orden:Number(row.Orden), empleadoClave:row.EmpleadoClave == null ? null : String(row.EmpleadoClave),
      rfc:row.Rfc == null ? null : String(row.Rfc), nombre:row.Nombre == null ? null : String(row.Nombre), sourceScale:c.scale,
      importeOficialD6:row.ImporteOficialD6 == null ? null : String(row.ImporteOficialD6), payloadVersion:null,
      payloadCanonico:Object.fromEntries(Object.entries(row).filter(([key]) => !common.has(key)).map(([key,value]) => [key,value instanceof Date ? value.toISOString() : value])) }));
    const key = DOMAIN_TOTAL_KEYS[filter.dominio] as Exclude<keyof QnaTotals,'registros'>;
    return { ...summary, dominio:filter.dominio,totalDominioA2:summary.totales[key] as string|null,totalStrategy:summary.totalStrategies[key],
      detalles:details,page:filter.page,pageSize:filter.pageSize,total:Number(sets[0][0].Total) };
  }

  private mapLegacyMetadata(selected: Extract<AppliedSelectionRecord, { version: 0 }>): QnaAppliedMetadata {
    const s = selected.scope;
    return { ...s, periodo: `${String(s.quincena).padStart(2,'0')}${String(s.anio).slice(-2)}`, liquidacionSnapshotId: null, ambiente: null, revision: null,
      snapshotCalculoV2Id: null, nominaCargaId: null, formulaCalculoVersionId: null, precisionPolicy: null, hashContenido: null,
      fechaAplicacion: selected.appliedAt.toISOString(), fechaCreacion: null, fuente: 'HISTORICO_LEGACY', estadoProceso: 'TERMINADO', reconstructionStrategy: 'LEGACY_EXACT_FULL_SCOPE' };
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

  private async selectApplied(filter: QnaAppliedSelection, transaction: Transaction): Promise<AppliedSelectionRecord | null> {
    const result = await this.appliedRequest(filter, transaction).input('Anio', sql.SmallInt, filter.anio).input('Quincena', sql.TinyInt, filter.quincena).query(`
      WITH Terminadas AS (
        SELECT tr.*,ROW_NUMBER() OVER(PARTITION BY tr.QnaProcesoId ORDER BY tr.FechaCreacion DESC,tr.QnaProcesoTransicionId DESC) rn
        FROM liquidacion.QnaProcesoTransicion tr WHERE tr.EstadoDestino='TERMINADO'
      ), Aplicadas AS (
        SELECT p.QnaProcesoId,p.EntidadId,p.Anio,p.Quincena,p.Organica0,p.Organica1,p.Organica2,p.Organica3,t.LiquidacionSnapshotId,
          t.FechaCreacion FechaAplicacion,t.QnaProcesoTransicionId,s.VersionEsquema,s.LiquidacionSnapshotId SnapshotEncontrado,
          s.EntidadId SnapshotEntidadId,s.Anio SnapshotAnio,s.Quincena SnapshotQuincena,s.Organica0 SnapshotOrganica0,s.Organica1 SnapshotOrganica1,s.Organica2 SnapshotOrganica2,s.Organica3 SnapshotOrganica3
        FROM Terminadas t JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=t.QnaProcesoId
        LEFT JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=t.LiquidacionSnapshotId WHERE t.rn=1
      )
      SELECT CONVERT(VARCHAR(30),a.QnaProcesoId) QnaProcesoId,CONVERT(VARCHAR(30),a.LiquidacionSnapshotId) LiquidacionSnapshotId,
        a.FechaAplicacion,a.VersionEsquema,a.SnapshotEncontrado,a.SnapshotEntidadId,a.SnapshotAnio,a.SnapshotQuincena,a.SnapshotOrganica0,a.SnapshotOrganica1,a.SnapshotOrganica2,a.SnapshotOrganica3,
        a.EntidadId,a.Anio,a.Quincena,a.Organica0,a.Organica1,a.Organica2,a.Organica3
      FROM Aplicadas a WHERE a.Anio=@Anio AND a.Quincena=@Quincena AND ${this.appliedScopeWhere()}
      ORDER BY a.FechaAplicacion DESC,a.QnaProcesoTransicionId DESC;`);
    if (result.recordset.length === 0) return this.selectLegacyApplied(filter, transaction);
    if (result.recordset.length > 1) qnaFail('La liquidacion aplicada es ambigua; especifique el ambito completo', 'QNA_APLICADA_OFICIAL_AMBIGUA', 409);
    const row=result.recordset[0];
    const sameScope=row.SnapshotEncontrado!=null&&Number(row.SnapshotEntidadId)===Number(row.EntidadId)&&Number(row.SnapshotAnio)===Number(row.Anio)
      &&Number(row.SnapshotQuincena)===Number(row.Quincena)&&['0','1','2','3'].every(level=>String(row[`SnapshotOrganica${level}`])===String(row[`Organica${level}`]));
    if(row.LiquidacionSnapshotId==null||row.SnapshotEncontrado==null||![3,4,5].includes(Number(row.VersionEsquema))||!sameScope)
      qnaFail('La ultima evidencia TERMINADO no referencia un snapshot compatible','QNA_APLICADA_TRANSICION_INTEGRIDAD_INVALIDA',500);
    return { id: String(row.LiquidacionSnapshotId), processId: String(row.QnaProcesoId),appliedAt:new Date(row.FechaAplicacion),version:Number(row.VersionEsquema) as 3|4|5 };
  }

  private async getAppliedBundles(
    selections: Array<{ id: string; processId: string; appliedAt: Date; version?: number }>,
    isAdmin: boolean,
    transaction: Transaction,
    exhaustive = true,
    deferMapping = false
  ): Promise<QnaAppliedListItem[] | DeferredRead<QnaAppliedListItem[]>> {
    if (selections.length === 0) return deferMapping ? { resolveAfterCommit: () => [] } : [];
    const request = new sql.Request(transaction).input('SelectionJson',sql.NVarChar(sql.MAX),JSON.stringify(selections.map(selection=>({id:selection.id,processId:selection.processId}))));
    const result = await request.query(`
      ${officialSelectionJsonCte()}
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
      ${officialSelectionJsonCte()}
      SELECT x.QnaProcesoId,f.*,(SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio) DetailCount
      FROM Seleccion x JOIN liquidacion.QnaSnapshotFuente f ON f.LiquidacionSnapshotId=x.LiquidacionSnapshotId ORDER BY x.QnaProcesoId,f.Dominio;
      ${officialSelectionJsonCte()}
      SELECT x.QnaProcesoId,x.LiquidacionSnapshotId,p.Estado,p.Detalle,r.Dominio,r.Estado ReconciliacionEstado,r.Diferencias,r.ErrorDetalle
      FROM Seleccion x JOIN liquidacion.QnaLegacyProjection p ON p.LiquidacionSnapshotId=x.LiquidacionSnapshotId
      LEFT JOIN liquidacion.QnaLegacyReconciliacion r ON r.QnaLegacyProjectionId=p.QnaLegacyProjectionId
       WHERE p.Estado IN('WARNING','ERROR') OR r.Estado IN('WARNING','ERROR') ORDER BY x.QnaProcesoId,r.QnaLegacyReconciliacionId;
       ${exhaustive ? `${officialSelectionJsonCte()}
       SELECT x.QnaProcesoId,t.Registros,${TOTAL_SELECT} FROM Seleccion x JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=x.LiquidacionSnapshotId;
       ${officialSelectionJsonCte()}
      SELECT x.QnaProcesoId,d.LiquidacionSnapshotId,d.Dominio,d.Orden,d.ClaveFilaHash,d.SourceScale,
        CONVERT(VARCHAR(40),CAST(d.ImporteOficialD6 AS DECIMAL(19,6))) ImporteOficialD6,d.PayloadCanonico,d.HashFila,d.EmpleadoClave,d.Rfc,d.Nombre,d.PayloadVersion
      FROM Seleccion x JOIN liquidacion.QnaSnapshotFuenteDetalle d ON d.LiquidacionSnapshotId=x.LiquidacionSnapshotId ORDER BY x.QnaProcesoId,d.Dominio,d.Orden;
       ${officialSelectionJsonCte()}
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

function persistedTotalStrategies() {
  return Object.fromEntries(Object.keys(TOTAL_COLUMNS).map(key => [key, 'PERSISTED'])) as QnaAppliedSummary['totalStrategies'];
}

function addA2Exact(values:string[]):string{
  const cents=values.reduce((sum,value)=>{if(!/^-?(0|[1-9]\d*)\.\d{2}$/.test(value))throw new Error('QNA_A2_INVALIDO');const negative=value.startsWith('-');
    const [whole,fraction]=(negative?value.slice(1):value).split('.');const amount=BigInt(whole)*100n+BigInt(fraction);return sum+(negative?-amount:amount);},0n);
  const negative=cents<0n;const absolute=negative?-cents:cents;return `${negative?'-':''}${absolute/100n}.${String(absolute%100n).padStart(2,'0')}`;
}
function groupRows(rows:Array<Record<string,any>>,keyOf:(row:Record<string,any>)=>string):Map<string,Array<Record<string,any>>>{
  const grouped=new Map<string,Array<Record<string,any>>>();for(const row of rows){const key=keyOf(row);const values=grouped.get(key);if(values)values.push(row);else grouped.set(key,[row]);}return grouped;
}

export function snapshotSelectionJsonCte():string{return `WITH X(LiquidacionSnapshotId) AS(
  SELECT LiquidacionSnapshotId FROM OPENJSON(@SelectionJson) WITH(LiquidacionSnapshotId BIGINT '$.id'))`;}
export function officialSelectionJsonCte():string{return `WITH Seleccion(LiquidacionSnapshotId,QnaProcesoId) AS(
  SELECT LiquidacionSnapshotId,QnaProcesoId FROM OPENJSON(@SelectionJson) WITH(LiquidacionSnapshotId BIGINT '$.id',QnaProcesoId BIGINT '$.processId'))`;}
export function legacySelectionJsonCte():string{return `WITH X(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3) AS(
  SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3 FROM OPENJSON(@SelectionJson) WITH(
    EntidadId INT '$.entidadId',Anio SMALLINT '$.anio',Quincena TINYINT '$.quincena',Organica0 CHAR(2) '$.organica0',Organica1 CHAR(2) '$.organica1',Organica2 CHAR(2) '$.organica2',Organica3 CHAR(2) '$.organica3'))`;}

export function appliedAllSourcesCte():string{return `WITH Terminadas AS(
  SELECT tr.*,ROW_NUMBER() OVER(PARTITION BY tr.QnaProcesoId ORDER BY tr.FechaCreacion DESC,tr.QnaProcesoTransicionId DESC) rn
  FROM liquidacion.QnaProcesoTransicion tr WHERE tr.EstadoDestino='TERMINADO'),
Snapshots AS(SELECT p.QnaProcesoId,p.EntidadId,p.Anio,p.Quincena,p.Organica0,p.Organica1,p.Organica2,p.Organica3,t.LiquidacionSnapshotId,
  t.FechaCreacion FechaAplicacion,t.QnaProcesoTransicionId,s.VersionEsquema,
  CAST(CASE WHEN s.VersionEsquema=5 THEN 'SNAPSHOT_OFICIAL' ELSE 'SNAPSHOT_OFICIAL_RECONSTRUIDO' END AS VARCHAR(40)) Fuente,
  CAST(NULL AS INT) ExactEvidenceCount,CAST(NULL AS INT) ReducedScopeCount,
  CAST(CASE WHEN t.LiquidacionSnapshotId IS NULL OR s.LiquidacionSnapshotId IS NULL OR s.VersionEsquema NOT IN(3,4,5) THEN 'QNA_APLICADA_TRANSICION_INTEGRIDAD_INVALIDA'
    WHEN s.EntidadId<>p.EntidadId OR s.Anio<>p.Anio OR s.Quincena<>p.Quincena OR s.Organica0<>p.Organica0 OR s.Organica1<>p.Organica1 OR s.Organica2<>p.Organica2 OR s.Organica3<>p.Organica3
      THEN 'QNA_APLICADA_TRANSICION_INTEGRIDAD_INVALIDA' END AS VARCHAR(80)) IntegrityCode
  FROM Terminadas t JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=t.QnaProcesoId LEFT JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=t.LiquidacionSnapshotId WHERE t.rn=1),
LegacyGrouped AS(SELECT TRY_CONVERT(INT,b.EntidadId) EntidadId,b.Anio,b.Quincena,b.Org0 Organica0,b.Org1 Organica1,b.Org2 Organica2,b.Org3 Organica3,MAX(b.CreatedAt) FechaAplicacion,
  MAX(b.AfectacionId) OrdenTie,COUNT(*) ExactEvidenceCount FROM afec.BitacoraAfectacionOrg b WHERE b.Entidad='AFILIADOS' AND b.Accion='TERMINADO'
  AND b.OrgNivel=3 AND b.Resultado='OK' AND TRY_CONVERT(INT,b.EntidadId) IS NOT NULL GROUP BY TRY_CONVERT(INT,b.EntidadId),b.Anio,b.Quincena,b.Org0,b.Org1,b.Org2,b.Org3),
Legacy AS(SELECT l.*, (SELECT COUNT(*) FROM LegacyGrouped r WHERE r.Anio=l.Anio AND r.Quincena=l.Quincena AND r.Organica0=l.Organica0 AND r.Organica1=l.Organica1) ReducedScopeCount
  FROM LegacyGrouped l WHERE NOT EXISTS(SELECT 1 FROM Snapshots s WHERE s.EntidadId=l.EntidadId AND s.Anio=l.Anio AND s.Quincena=l.Quincena AND s.Organica0=l.Organica0 AND s.Organica1=l.Organica1 AND s.Organica2=l.Organica2 AND s.Organica3=l.Organica3)),
Elegibles AS(SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,LiquidacionSnapshotId,QnaProcesoId,FechaAplicacion,QnaProcesoTransicionId OrdenTie,VersionEsquema,Fuente,ExactEvidenceCount,ReducedScopeCount,IntegrityCode FROM Snapshots
  UNION ALL SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,NULL,NULL,FechaAplicacion,OrdenTie,0,'HISTORICO_LEGACY',ExactEvidenceCount,ReducedScopeCount,
    CASE WHEN ExactEvidenceCount<>1 OR ReducedScopeCount<>1 THEN 'QNA_APLICADA_LEGACY_AMBIGUA' END FROM Legacy)`;}

export function appliedAllSourcesSearch():string{return `(@Busqueda IS NULL OR (a.Fuente<>'HISTORICO_LEGACY' AND (
  (a.VersionEsquema=5 AND EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=a.LiquidacionSnapshotId AND CONCAT_WS('|',d.EmpleadoClave,d.Rfc,d.Nombre) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'))
  OR (a.VersionEsquema IN(3,4) AND EXISTS(SELECT 1 FROM liquidacion.QnaSnapshot s JOIN aportaciones.SnapshotCalculoV2Detalle d ON d.SnapshotId=s.SnapshotCalculoV2Id
    WHERE s.LiquidacionSnapshotId=a.LiquidacionSnapshotId AND CONCAT_WS('|',d.DiasLaborados,d.DiasOrigen,d.FATD6,d.ViviendaD6,d.PrestacionesD6,d.CAIRFondoD6) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~'))
  OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=a.LiquidacionSnapshotId AND CONCAT_WS('|',d.EmpleadoClave,d.Rfc,d.Nombre,d.PayloadCanonico) COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~')))
  OR (a.Fuente='HISTORICO_LEGACY' AND EXISTS(SELECT 1 FROM(
    SELECT CONVERT(NVARCHAR(MAX),CONCAT_WS('|',interno,nombre,total)) Texto FROM aportaciones.IndividualesAhorroHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,nombre,total) FROM aportaciones.IndividualesViviendaHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,nombre,total) FROM aportaciones.IndividualesPrestacionesHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,nombre,total) FROM aportaciones.IndividualesCairHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',titular_no_empleado,titular_rfc,titular_nombre,recibo_total) FROM aportaciones.GuarderiasHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,rfc,nombres,transitorio) FROM aportaciones.PensionNominaTransitorioHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',noempleado,rfc,nombres,general) FROM aportaciones.AguinaldoHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,rfc,nombre,total) FROM retenciones.PrestamosCortoPlazoHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,rfc,nombre,total) FROM retenciones.PrestamosMedianoPlazoHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
    UNION ALL SELECT CONCAT_WS('|',interno,rfc,nombre,cantidad) FROM retenciones.PrestamosHipotecariosHistorico WHERE clave_organica_0=a.Organica0 AND clave_organica_1=a.Organica1 AND anio=a.Anio AND quincena=a.Quincena AND QnaLiquidacionSnapshotId IS NULL
  )q WHERE q.Texto COLLATE Latin1_General_100_CI_AI LIKE @Busqueda ESCAPE '~')))`;}

export function appliedStructuralConflictSql(alias:string):string{return `(EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId
    GROUP BY f.LiquidacionSnapshotId HAVING COUNT(*)<>10 OR COUNT(DISTINCT f.Dominio)<>10)
  OR NOT EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId)
  OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId AND (f.Dominio NOT IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP')
    OR f.Requerida<>1 OR (f.Estado='COMPLETE' AND (f.Registros<=0 OR f.HashFuente IS NULL)) OR (f.Estado='NOT_APPLICABLE' AND (f.Registros<>0 OR f.NotApplicableAprobado<>1 OR f.AprobadoPor IS NULL OR f.Evidencia IS NULL))
    OR f.Estado NOT IN('COMPLETE','NOT_APPLICABLE')))
  OR (SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId)<>1
  OR (${alias}.VersionEsquema=5 AND (EXISTS(SELECT 1 FROM liquidacion.QnaSnapshot s WHERE s.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId AND
      (s.SnapshotCalculoV2Id IS NULL OR s.NominaCargaId IS NULL OR s.FormulaCalculoVersionId IS NULL OR s.FuentesCompletas<>10 OR s.Estado<>'COMPLETO'))
    OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshot s LEFT JOIN aportaciones.SnapshotCalculoV2 v ON v.SnapshotId=s.SnapshotCalculoV2Id
      WHERE s.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId AND (v.SnapshotId IS NULL OR v.EntidadId<>s.EntidadId OR v.Anio<>s.Anio OR v.Quincena<>s.Quincena OR v.Organica0<>s.Organica0 OR v.Organica1<>s.Organica1 OR v.Organica2<>s.Organica2 OR v.Organica3<>s.Organica3))
    OR EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=${alias}.LiquidacionSnapshotId AND f.Estado='COMPLETE' AND
      f.Registros<>(CASE WHEN f.Dominio IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR') THEN (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId)
        ELSE (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d WHERE d.LiquidacionSnapshotId=f.LiquidacionSnapshotId AND d.Dominio=f.Dominio) END)))))`;}

export function legacyOwnershipConflictSql(alias:string):string{return `(EXISTS(SELECT 1 FROM liquidacion.QnaLegacyScopeOwnership o WHERE o.Organica0=${alias}.Organica0 AND o.Organica1=${alias}.Organica1 AND o.Anio=${alias}.Anio AND o.Quincena=${alias}.Quincena)
  OR EXISTS(SELECT 1 FROM(
    SELECT QnaLiquidacionSnapshotId q FROM aportaciones.IndividualesAhorroHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.IndividualesViviendaHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.IndividualesPrestacionesHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.IndividualesCairHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.GuarderiasHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.PensionNominaTransitorioHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.AguinaldoHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM retenciones.PrestamosCortoPlazoHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM retenciones.PrestamosMedianoPlazoHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM retenciones.PrestamosHipotecariosHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
    UNION ALL SELECT QnaLiquidacionSnapshotId FROM aportaciones.ResumenHistorico h WHERE h.clave_organica_0=${alias}.Organica0 AND h.clave_organica_1=${alias}.Organica1 AND h.anio=${alias}.Anio AND h.quincena=${alias}.Quincena
  ) owned WHERE owned.q IS NOT NULL)
  OR EXISTS(SELECT 1 FROM conciliacion.RevisionAplicacionHistorico h WHERE h.Organica0=${alias}.Organica0 AND h.Organica1=${alias}.Organica1 AND h.Organica2=${alias}.Organica2 AND h.Organica3=${alias}.Organica3
    AND h.Periodo=RIGHT('0'+CONVERT(VARCHAR(2),${alias}.Quincena),2)+RIGHT(CONVERT(VARCHAR(4),${alias}.Anio),2) AND (h.QnaLiquidacionSnapshotId IS NOT NULL OR h.LiquidacionSnapshotId IS NOT NULL)))`;}

function selectionKey(item:AppliedSelectionRecord):string{return item.version===0
  ? `L:${item.scope.entidadId}:${item.scope.anio}:${item.scope.quincena}:${item.scope.organica0}:${item.scope.organica1}:${item.scope.organica2}:${item.scope.organica3}`:`S:${item.id}`;}
function appliedItemKey(item:QnaAppliedListItem):string{return item.fuente==='HISTORICO_LEGACY'
  ? `L:${item.entidadId}:${item.anio}:${item.quincena}:${item.organica0}:${item.organica1}:${item.organica2}:${item.organica3}`:`S:${item.liquidacionSnapshotId}`;}
function legacyRowKey(row:Record<string,any>):string{return `L:${row.EntidadId}:${row.Anio}:${row.Quincena}:${row.Organica0}:${row.Organica1}:${row.Organica2}:${row.Organica3}`;}
