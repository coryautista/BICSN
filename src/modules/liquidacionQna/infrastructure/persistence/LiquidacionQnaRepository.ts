import sql, { ConnectionPool, Request, Transaction } from 'mssql';
import type { ILiquidacionQnaRepository } from '../../domain/repositories/ILiquidacionQnaRepository.js';
import {
  PRECISION_POLICY,
  QNA_DOMAINS,
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
  type QnaTotals,
  type QnaProcessState,
  type QnaScope,
} from '../../domain/entities/LiquidacionQna.js';
import { qnaFail } from '../../domain/errors.js';
import { validateQnaCandidate } from '../../domain/services/LiquidacionQnaContracts.js';

const TOTAL_COLUMNS: Record<Exclude<keyof QnaTotals, 'registros'>, string> = {
  cairA2: 'CAIRA2', fraA2: 'FRAA2', freA2: 'FREA2', fhA2: 'FHA2', fvA2: 'FVA2',
  faaA2: 'FAAA2', faeA2: 'FAEA2', fatA2: 'FATA2', faiA2: 'FAIA2',
  ahorroA2: 'AhorroA2', viviendaA2: 'ViviendaA2', prestacionesA2: 'PrestacionesA2',
  cairFondoA2: 'CAIRFondoA2',
  guarderiasA2: 'GuarderiasA2', transitorioA2: 'TransitorioA2', aguinaldoA2: 'AguinaldoA2',
  retencionPcpA2: 'RetencionPCPA2', retencionPmpA2: 'RetencionPMPA2', retencionHipA2: 'RetencionHIPA2',
  totalAportacionesA2: 'TotalAportacionesA2', totalRetencionesA2: 'TotalRetencionesA2', totalGeneralA2: 'TotalGeneralA2',
};
const TOTAL_SELECT = Object.entries(TOTAL_COLUMNS).map(([key, column]) => `CONVERT(VARCHAR(40),t.${column}) AS ${key}`).join(',');

export class LiquidacionQnaRepository implements ILiquidacionQnaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async createCandidate(input: CreateQnaCandidateInput): Promise<CreateQnaCandidateResult> {
    const validated = validateQnaCandidate(input);
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const existing = await this.scope(new sql.Request(transaction), input)
        .input('HashContenido', sql.Char(64), validated.hashContenido)
        .query(`SELECT LiquidacionSnapshotId,Revision,Estado FROM liquidacion.QnaSnapshot WITH (UPDLOCK,HOLDLOCK)
          WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0
            AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3 AND HashContenido=@HashContenido`);
      if (existing.recordset.length === 1) {
        await transaction.commit();
        const row = existing.recordset[0];
        return {
          liquidacionSnapshotId: String(row.LiquidacionSnapshotId), revision: Number(row.Revision),
          hashContenido: validated.hashContenido, estado: row.Estado, idempotente: true,
        };
      }

      const revisionResult = await this.scope(new sql.Request(transaction), input).query(`
        SELECT ISNULL(MAX(Revision),0)+1 AS Revision FROM liquidacion.QnaSnapshot WITH (UPDLOCK,HOLDLOCK)
        WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0
          AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3`);
      const revision = Number(revisionResult.recordset[0].Revision);
      const estado = validated.completas === 10 ? 'COMPLETO' : 'INCOMPLETO';
      const header = await this.scope(new sql.Request(transaction), input)
        .input('Periodo', sql.Char(4), `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`)
        .input('Ambiente', sql.VarChar(20), input.ambiente)
        .input('Estado', sql.VarChar(20), estado)
        .input('Revision', sql.Int, revision)
        .input('HashContenido', sql.Char(64), validated.hashContenido)
        .input('SnapshotCalculoV2Id', sql.BigInt, input.snapshotCalculoV2Id)
        .input('NominaCargaId', sql.BigInt, input.nominaCargaId)
        .input('FormulaCalculoVersionId', sql.BigInt, input.formulaCalculoVersionId)
        .input('FuentesCompletas', sql.TinyInt, validated.completas)
        .input('UsuarioId', sql.NVarChar(100), input.usuarioId)
        .query(`INSERT INTO liquidacion.QnaSnapshot
          (EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,Ambiente,Estado,Revision,
           PrecisionPolicy,VersionEsquema,HashContenido,SnapshotCalculoV2Id,NominaCargaId,FormulaCalculoVersionId,
           FuentesEsperadas,FuentesCompletas,UsuarioId)
          OUTPUT INSERTED.LiquidacionSnapshotId
          VALUES (@EntidadId,@Anio,@Quincena,@Periodo,@Organica0,@Organica1,@Organica2,@Organica3,@Ambiente,@Estado,@Revision,
            '${PRECISION_POLICY}',4,@HashContenido,@SnapshotCalculoV2Id,@NominaCargaId,@FormulaCalculoVersionId,10,@FuentesCompletas,@UsuarioId)`);
      const id = String(header.recordset[0].LiquidacionSnapshotId);
      for (const source of input.fuentes) await this.insertSource(transaction, id, source);
      await this.insertTotals(transaction, id, input.totales);
      for (const detail of input.detalles) await this.insertDetail(transaction, id, detail);
      const verification = await new sql.Request(transaction).input('Id', sql.BigInt, id).query(`
        SELECT (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente WHERE LiquidacionSnapshotId=@Id) AS Fuentes,
          (SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@Id) AS Totales,
          (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id) AS Detalles`);
      const verified = verification.recordset[0];
      if (Number(verified.Fuentes) !== 10 || Number(verified.Totales) !== 1 || Number(verified.Detalles) !== input.detalles.length) {
        qnaFail('Persistencia parcial del snapshot', 'QNA_PERSISTENCIA_INCOMPLETA', 500);
      }
      await transaction.commit();
      return { liquidacionSnapshotId: id, revision, hashContenido: validated.hashContenido, estado, idempotente: false };
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
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
        PayloadCanonico,HashFila FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio,Orden;
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

  async appendDecision(id: string, decision: QnaDecision, comentario: string | null, usuarioId: string): Promise<QnaDecisionRecord> {
    if (decision === 'OBSERVADO' && !comentario) qnaFail('OBSERVADO requiere comentario', 'QNA_DECISION_INVALIDA', 400);
    const result = await new sql.Request(this.mssqlPool)
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

  async promote(id: string, motivo: string | null, usuarioId: string): Promise<PromoteQnaResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
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
        await transaction.commit();
        return { liquidacionSnapshotId: id, qnaProcesoId: processId,
          qnaSnapshotSeleccionEventoId: String(current.QnaSnapshotSeleccionEventoId), tipoEvento: current.TipoEvento, idempotente: true };
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
      await transaction.commit();
      return { liquidacionSnapshotId: id, qnaProcesoId: processId, qnaSnapshotSeleccionEventoId: eventId, tipoEvento: type, idempotente: false };
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
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
    await new sql.Request(transaction).input('Id', sql.BigInt, id).input('Dominio', sql.VarChar(30), detail.dominio)
      .input('Orden', sql.Int, detail.orden).input('ClaveFilaHash', sql.Char(64), detail.claveFilaHash)
      .input('SourceScale', sql.TinyInt, detail.sourceScale).input('Importe', sql.Decimal(19, 6), detail.importeOficialD6)
      .input('Payload', sql.NVarChar(sql.MAX), JSON.stringify(detail.payloadCanonico)).input('HashFila', sql.Char(64), detail.hashFila)
      .query(`INSERT INTO liquidacion.QnaSnapshotFuenteDetalle (LiquidacionSnapshotId,Dominio,Orden,ClaveFilaHash,SourceScale,ImporteOficialD6,PayloadCanonico,HashFila)
        VALUES (@Id,@Dominio,@Orden,@ClaveFilaHash,@SourceScale,@Importe,@Payload,@HashFila)`);
  }

  private async insertTransition(transaction: Transaction, processId: string, snapshotId: string, origin: string | null, destination: string, motivo: string | null, usuarioId: string): Promise<void> {
    await new sql.Request(transaction).input('ProcesoId', sql.BigInt, processId).input('Id', sql.BigInt, snapshotId)
      .input('Origen', sql.VarChar(30), origin).input('Destino', sql.VarChar(30), destination)
      .input('Motivo', sql.NVarChar(500), motivo).input('UsuarioId', sql.NVarChar(100), usuarioId)
      .query(`INSERT INTO liquidacion.QnaProcesoTransicion (QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
        VALUES (@ProcesoId,@Id,@Origen,@Destino,@Motivo,@UsuarioId)`);
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
      hashFila: String(detail.HashFila) })) as QnaSourceDetail[];
    const totals = { registros: Number(row.totalRegistros) } as QnaTotals;
    for (const key of Object.keys(TOTAL_COLUMNS) as Array<keyof typeof TOTAL_COLUMNS>) {
      const value = row[key] ?? (key === 'cairFondoA2' ? row.cairA2 : null);
      totals[key] = String(value);
    }
    return {
      liquidacionSnapshotId: String(row.LiquidacionSnapshotId), entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena),
      periodo: String(row.Periodo), organica0: String(row.Organica0), organica1: String(row.Organica1), organica2: String(row.Organica2), organica3: String(row.Organica3),
       ambiente: row.Ambiente, estado: row.Estado, revision: Number(row.Revision), precisionPolicy: row.PrecisionPolicy, versionEsquema: Number(row.VersionEsquema) as 3 | 4,
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
