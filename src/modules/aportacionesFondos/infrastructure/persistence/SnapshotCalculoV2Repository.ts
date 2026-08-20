import sql, { ConnectionPool } from 'mssql';
import type {
  SnapshotCalculoV2Detalle,
  SnapshotCalculoV2Fuente,
  SnapshotCalculoV2Input,
  SnapshotCalculoV2Resultado
} from '../../domain/entities/SnapshotCalculoV2.js';
import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import { calcularSnapshotCalculoV2Hash } from '../../domain/services/SnapshotCalculoV2Hasher.js';
import type {
  SnapshotCalculoV2ConsultaDetalle,
  SnapshotCalculoV2ConsultaFiltro,
  SnapshotCalculoV2ConsultaRaw
} from '../../domain/entities/SnapshotCalculoV2Consulta.js';
import type { SnapshotTotalesA2 } from '../../domain/entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from '../../domain/services/AportacionesMonetaryKernel.js';
import type {
  SnapshotCalculoV2BandejaFiltro,
  SnapshotCalculoV2BandejaReferencia,
  SnapshotDecisionInput,
  SnapshotDecision,
  SnapshotDecisionRegistro
} from '../../domain/entities/SnapshotCalculoV2Bandeja.js';
import type {
  SnapshotHistoricoAgregado,
  SnapshotLecturaOficialFiltro
} from '../../domain/entities/SnapshotCalculoV2Official.js';
import { FORMULA_PRECISION_POLICY, FORMULA_PRECISION_POLICY_LEGACY } from '../../domain/entities/FormulaCalculo.js';

const HASH_PATTERN = /^[0-9A-F]{64}$/;
const MONEY_D6_PATTERN = /^-?(0|[1-9]\d*)\.\d{6}$/;
const MONEY_A2_PATTERN = /^-?(0|[1-9]\d*)\.\d{2}$/;
const DAYS_D2_PATTERN = /^(?:0|[1-9]\d*)\.\d{2}$/;

export class SnapshotCalculoV2Repository implements ISnapshotCalculoV2Repository {
  private readonly kernel = new AportacionesMonetaryKernel();

  constructor(private mssqlPool: ConnectionPool) {}

  async guardar(input: SnapshotCalculoV2Input): Promise<SnapshotCalculoV2Resultado> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const result = await this.guardarEnTransaccion(transaction, input);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  }

  async guardarEnTransaccion(transaction: sql.Transaction, input: SnapshotCalculoV2Input): Promise<SnapshotCalculoV2Resultado> {
    this.validate(input);
    const hashContenido = calcularSnapshotCalculoV2Hash(input);
    const scopeRequest = this.applyScope(new sql.Request(transaction), input)
      .input('Fuente', sql.VarChar(30), input.fuente)
      .input('HashContenido', sql.Char(64), hashContenido);
    const existing = await scopeRequest.query(`
      SELECT SnapshotId, Revision, Registros
      FROM aportaciones.SnapshotCalculoV2 WITH (UPDLOCK, HOLDLOCK)
      WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena
        AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
        AND Fuente=@Fuente AND HashContenido=@HashContenido
    `);
    if (existing.recordset.length > 0) {
      const row = existing.recordset[0];
      return {
        snapshotId: String(row.SnapshotId),
        revision: Number(row.Revision),
        hashContenido,
        idempotente: true,
        registros: Number(row.Registros)
      };
    }

    const revisionResult = await this.applyScope(new sql.Request(transaction), input)
      .input('Fuente', sql.VarChar(30), input.fuente)
      .query(`
        SELECT ISNULL(MAX(Revision), 0) + 1 AS SiguienteRevision
        FROM aportaciones.SnapshotCalculoV2 WITH (UPDLOCK, HOLDLOCK)
        WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena
          AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
          AND Fuente=@Fuente
      `);
    const revision = Number(revisionResult.recordset[0].SiguienteRevision);
    const insertRequest = this.applyScope(new sql.Request(transaction), input)
      .input('Ambiente', sql.VarChar(20), input.ambiente)
      .input('Fuente', sql.VarChar(30), input.fuente)
      .input('Estado', sql.VarChar(30), input.estado)
      .input('FormulaCalculoVersionId', sql.BigInt, input.formulaCalculoVersionId)
      .input('NominaCargaId', sql.BigInt, input.nominaCargaId)
      .input('PrecisionPolicy', sql.VarChar(80), input.precisionPolicy)
      .input('VersionEsquema', sql.SmallInt, input.versionEsquema)
      .input('Revision', sql.Int, revision)
      .input('HashContenido', sql.Char(64), hashContenido)
      .input('Registros', sql.Int, input.detalles.length)
      .input('UsuarioId', sql.NVarChar(100), input.usuarioId);
    for (const [fondo, value] of Object.entries(input.totalesA2)) {
      insertRequest.input(fondo, sql.Decimal(19, 2), value);
    }
    const inserted = await insertRequest.query(`
      INSERT INTO aportaciones.SnapshotCalculoV2 (
        EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,
        Ambiente,Fuente,Estado,FormulaCalculoVersionId,NominaCargaId,PrecisionPolicy,
        VersionEsquema,Revision,HashContenido,Registros,CAIR,CAIR_FONDO,FRA,FRE,PRESTACIONES,FH,FV,VIVIENDA,FAA,FAE,FAT,FAI,
        EsCerrado,UsuarioId
      )
      OUTPUT INSERTED.SnapshotId
      VALUES (
        @EntidadId,@Anio,@Quincena,@Periodo,@Organica0,@Organica1,@Organica2,@Organica3,
        @Ambiente,@Fuente,@Estado,@FormulaCalculoVersionId,@NominaCargaId,@PrecisionPolicy,
        @VersionEsquema,@Revision,@HashContenido,@Registros,@CAIR,@CAIR_FONDO,@FRA,@FRE,@PRESTACIONES,@FH,@FV,@VIVIENDA,@FAA,@FAE,@FAT,@FAI,
        1,@UsuarioId
      )
    `);
    const snapshotId = String(inserted.recordset[0].SnapshotId);

    for (const detalle of [...input.detalles].sort((left, right) => left.orden - right.orden)) {
      await this.insertDetalle(transaction, snapshotId, detalle);
    }

    const countResult = await new sql.Request(transaction)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .query('SELECT COUNT(*) AS Registros FROM aportaciones.SnapshotCalculoV2Detalle WHERE SnapshotId=@SnapshotId');
    if (Number(countResult.recordset[0].Registros) !== input.detalles.length) {
      throw new Error('SNAPSHOT_V2_DETALLE_INCOMPLETO');
    }

    return { snapshotId, revision, hashContenido, idempotente: false, registros: input.detalles.length };
  }

  async consultar(filtro: SnapshotCalculoV2ConsultaFiltro): Promise<SnapshotCalculoV2ConsultaRaw | null> {
    const request = new sql.Request(this.mssqlPool)
      .input('EntidadId', sql.Int, filtro.entidadId)
      .input('Anio', sql.SmallInt, filtro.anio)
      .input('Quincena', sql.TinyInt, filtro.quincena)
      .input('Organica0', sql.Char(2), filtro.organica0)
      .input('Organica1', sql.Char(2), filtro.organica1)
      .input('Organica2', sql.Char(2), filtro.organica2)
      .input('Organica3', sql.Char(2), filtro.organica3)
      .input('Fuente', sql.VarChar(30), filtro.fuente)
      .input('Revision', sql.Int, filtro.revision ?? null);
    const headerResult = await request.query(`
      SELECT TOP (1)
        SnapshotId,EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,
        Ambiente,Fuente,Estado,FormulaCalculoVersionId,NominaCargaId,PrecisionPolicy,
        VersionEsquema,Revision,HashContenido,Registros,EsCerrado,FechaCreacion,
        CONVERT(VARCHAR(40),CAIR) AS CAIR,CONVERT(VARCHAR(40),FRA) AS FRA,
        CONVERT(VARCHAR(40),FRE) AS FRE,CONVERT(VARCHAR(40),FH) AS FH,
        CONVERT(VARCHAR(40),FV) AS FV,CONVERT(VARCHAR(40),FAA) AS FAA,
        CONVERT(VARCHAR(40),FAE) AS FAE,CONVERT(VARCHAR(40),FAT) AS FAT,
        CONVERT(VARCHAR(40),FAI) AS FAI
      FROM aportaciones.SnapshotCalculoV2
      WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena
        AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
        AND Fuente=@Fuente AND (@Revision IS NULL OR Revision=@Revision)
      ORDER BY Revision DESC,SnapshotId DESC;
    `);
    if (headerResult.recordset.length === 0) return null;
    const row = headerResult.recordset[0];
    const snapshotId = String(row.SnapshotId);

    const baselineResult = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .input('Organica0', sql.Char(2), filtro.organica0)
      .input('Organica1', sql.Char(2), filtro.organica1)
      .input('Anio', sql.SmallInt, filtro.anio)
      .input('Quincena', sql.TinyInt, filtro.quincena)
      .input('Periodo', sql.Char(4), `${String(filtro.quincena).padStart(2, '0')}${String(filtro.anio).slice(-2)}`)
      .query(`
        SELECT TOP (1)
          CONVERT(VARCHAR(40),CAIR) AS CAIR,CONVERT(VARCHAR(40),FRA) AS FRA,
          CONVERT(VARCHAR(40),FRE) AS FRE,CONVERT(VARCHAR(40),FH) AS FH,
          CONVERT(VARCHAR(40),FV) AS FV,CONVERT(VARCHAR(40),FAA) AS FAA,
          CONVERT(VARCHAR(40),FAE) AS FAE,CONVERT(VARCHAR(40),FAT) AS FAT,
          CONVERT(VARCHAR(40),FAI) AS FAI
        FROM conciliacion.RevisionAplicacionHistorico
        WHERE Organica0=@Organica0 AND Organica1=@Organica1 AND Periodo=@Periodo
        ORDER BY IdRevisionAplicacionHistorico DESC;

        SELECT
          (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosAhorro,
          (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosCair,
          (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosPrestaciones,
          (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosVivienda,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afe),0) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS CAIR,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afpa),0) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FRA,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afpe),0) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FRE,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(CAST(ROUND(afe*CAST(0.2 AS DECIMAL(19,9)),6,1) AS DECIMAL(19,6))),0)
            FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FH,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(CAST(ROUND(afe*CAST(0.8 AS DECIMAL(19,9)),6,1) AS DECIMAL(19,6))),0)
            FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FV,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afaa),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAA,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afae),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAE,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(total),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAT;

        SELECT TOP (1) Estatus,CONVERT(VARCHAR(40),Importe) AS Importe
        FROM pagos.LineaCapturaPeriodo
        WHERE Org0=@Organica0 AND Org1=@Organica1 AND Periodo=@Periodo
        ORDER BY CreatedAt DESC,LineaCapturaPeriodoId DESC;
      `);
    const sets = baselineResult.recordsets as Array<Array<Record<string, unknown>>>;
    const revisa = sets[0][0] ? this.mapTotales(sets[0][0]) : null;
    const historicoRow = sets[1][0];
    const historico = {
      CAIR: this.a2(historicoRow.CAIR),
      CAIR_FONDO: this.a2(historicoRow.CAIR),
      FRA: this.a2(historicoRow.FRA),
      FRE: this.a2(historicoRow.FRE),
      PRESTACIONES: this.kernel.sumarA2([this.a2(historicoRow.FRA), this.a2(historicoRow.FRE)]),
      FH: this.a2(historicoRow.FH),
      FV: this.a2(historicoRow.FV),
      VIVIENDA: this.kernel.sumarA2([this.a2(historicoRow.FH), this.a2(historicoRow.FV)]),
      FAA: this.a2(historicoRow.FAA),
      FAE: this.a2(historicoRow.FAE),
      FAT: this.a2(historicoRow.FAT),
      FAI: null
    };
    const lineaRow = sets[2][0];
    const detalles = filtro.incluirDetalles ? await this.consultarDetalles(snapshotId) : undefined;

    return {
      snapshot: {
        snapshotId,
        entidadId: Number(row.EntidadId),
        anio: Number(row.Anio),
        quincena: Number(row.Quincena),
        periodo: String(row.Periodo),
        organica0: String(row.Organica0),
        organica1: String(row.Organica1),
        organica2: String(row.Organica2),
        organica3: String(row.Organica3),
        ambiente: String(row.Ambiente),
        fuente: row.Fuente as SnapshotCalculoV2Fuente,
        estado: row.Estado,
        formulaCalculoVersionId: row.FormulaCalculoVersionId === null ? null : String(row.FormulaCalculoVersionId),
        nominaCargaId: row.NominaCargaId === null ? null : String(row.NominaCargaId),
        precisionPolicy: String(row.PrecisionPolicy),
        versionEsquema: Number(row.VersionEsquema),
        revision: Number(row.Revision),
        hashContenido: String(row.HashContenido),
        registros: Number(row.Registros),
        esCerrado: Boolean(row.EsCerrado),
        fechaCreacion: new Date(row.FechaCreacion).toISOString(),
        totalesA2: this.mapTotales(row),
        ...(detalles ? { detalles } : {})
      },
      revisa,
      historico,
      linea: lineaRow ? { estatus: String(lineaRow.Estatus), importe: this.a2(lineaRow.Importe) } : null
    };
  }

  async listarReferencias(filtro: SnapshotCalculoV2BandejaFiltro): Promise<{
    total: number;
    datos: Array<SnapshotCalculoV2BandejaReferencia & { ultimaDecision: SnapshotDecisionRegistro | null }>;
  }> {
    const request = new sql.Request(this.mssqlPool)
      .input('Offset', sql.Int, (filtro.pagina - 1) * filtro.tamanio)
      .input('Tamanio', sql.Int, filtro.tamanio)
      .input('Anio', sql.SmallInt, filtro.anio ?? null)
      .input('Quincena', sql.TinyInt, filtro.quincena ?? null)
      .input('EntidadId', sql.Int, filtro.entidadId ?? null)
      .input('Organica0', sql.Char(2), filtro.organica0 ?? null)
      .input('Organica1', sql.Char(2), filtro.organica1 ?? null)
      .input('Fuente', sql.VarChar(30), filtro.fuente ?? null)
      .input('Estado', sql.VarChar(30), filtro.estado ?? null);
    const result = await request.query(`
      SELECT COUNT(*) AS Total
      FROM aportaciones.SnapshotCalculoV2 s
      WHERE (@Anio IS NULL OR s.Anio=@Anio) AND (@Quincena IS NULL OR s.Quincena=@Quincena)
        AND (@EntidadId IS NULL OR s.EntidadId=@EntidadId)
        AND (@Organica0 IS NULL OR s.Organica0=@Organica0) AND (@Organica1 IS NULL OR s.Organica1=@Organica1)
        AND (@Fuente IS NULL OR s.Fuente=@Fuente) AND (@Estado IS NULL OR s.Estado=@Estado);

      SELECT s.EntidadId,s.Anio,s.Quincena,s.Organica0,s.Organica1,s.Organica2,s.Organica3,s.Fuente,s.Revision,
        d.DecisionId,d.Decision,d.PoliticaVersion,d.Comentario,d.UsuarioId,d.FechaCreacion AS DecisionFechaCreacion
      FROM aportaciones.SnapshotCalculoV2 s
      OUTER APPLY (
        SELECT TOP (1) DecisionId,Decision,PoliticaVersion,Comentario,UsuarioId,FechaCreacion
        FROM aportaciones.SnapshotCalculoV2Decision x
        WHERE x.SnapshotId=s.SnapshotId
        ORDER BY x.FechaCreacion DESC,x.DecisionId DESC
      ) d
      WHERE (@Anio IS NULL OR s.Anio=@Anio) AND (@Quincena IS NULL OR s.Quincena=@Quincena)
        AND (@EntidadId IS NULL OR s.EntidadId=@EntidadId)
        AND (@Organica0 IS NULL OR s.Organica0=@Organica0) AND (@Organica1 IS NULL OR s.Organica1=@Organica1)
        AND (@Fuente IS NULL OR s.Fuente=@Fuente) AND (@Estado IS NULL OR s.Estado=@Estado)
      ORDER BY s.Anio DESC,s.Quincena DESC,s.EntidadId,s.Organica0,s.Organica1,s.Organica2,s.Organica3,s.Fuente,s.Revision DESC
      OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;
    `);
    const sets = result.recordsets as Array<Array<Record<string, unknown>>>;
    return {
      total: Number(sets[0][0]?.Total ?? 0),
      datos: sets[1].map((row) => ({
        entidadId: Number(row.EntidadId),
        anio: Number(row.Anio),
        quincena: Number(row.Quincena),
        organica0: String(row.Organica0),
        organica1: String(row.Organica1),
        organica2: String(row.Organica2),
        organica3: String(row.Organica3),
        fuente: row.Fuente as SnapshotCalculoV2Fuente,
        revision: Number(row.Revision),
        ultimaDecision: row.DecisionId === null ? null : this.mapDecision(row)
      }))
    };
  }

  async guardarDecision(input: SnapshotDecisionInput): Promise<SnapshotDecisionRegistro | null> {
    const result = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, input.snapshotId)
      .input('Decision', sql.VarChar(20), input.decision)
      .input('PoliticaVersion', sql.VarChar(50), 'MXN-A2-DIFF-0.20-v1')
      .input('Comentario', sql.NVarChar(500), input.comentario)
      .input('UsuarioId', sql.UniqueIdentifier, input.usuarioId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM aportaciones.SnapshotCalculoV2 WHERE SnapshotId=@SnapshotId)
          SELECT CAST(NULL AS BIGINT) AS DecisionId;
        ELSE
          INSERT INTO aportaciones.SnapshotCalculoV2Decision (SnapshotId,Decision,PoliticaVersion,Comentario,UsuarioId)
          OUTPUT INSERTED.DecisionId,INSERTED.Decision,INSERTED.PoliticaVersion,INSERTED.Comentario,INSERTED.UsuarioId,INSERTED.FechaCreacion
          VALUES (@SnapshotId,@Decision,@PoliticaVersion,@Comentario,@UsuarioId);
      `);
    const row = result.recordset[0];
    return !row?.DecisionId ? null : this.mapDecision(row);
  }

  async consultarUltimaDecision(snapshotId: string): Promise<SnapshotDecisionRegistro | null> {
    const result = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .query(`
        SELECT TOP (1) DecisionId,Decision,PoliticaVersion,Comentario,UsuarioId,FechaCreacion
        FROM aportaciones.SnapshotCalculoV2Decision
        WHERE SnapshotId=@SnapshotId
        ORDER BY FechaCreacion DESC,DecisionId DESC;
      `);
    const row = result.recordset[0];
    return row ? this.mapDecision(row) : null;
  }

  async listarDecisiones(snapshotId: string): Promise<SnapshotDecisionRegistro[] | null> {
    const result = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .query(`
        SELECT COUNT(*) AS Existe
        FROM aportaciones.SnapshotCalculoV2
        WHERE SnapshotId=@SnapshotId;

        SELECT DecisionId,Decision,PoliticaVersion,Comentario,UsuarioId,FechaCreacion
        FROM aportaciones.SnapshotCalculoV2Decision
        WHERE SnapshotId=@SnapshotId
        ORDER BY FechaCreacion DESC,DecisionId DESC;
      `);
    const sets = result.recordsets as Array<Array<Record<string, unknown>>>;
    if (Number(sets[0][0]?.Existe ?? 0) === 0) return null;
    return sets[1].map((row) => this.mapDecision(row));
  }

  async consultarElegibilidadDecision(snapshotId: string): Promise<'NO_ENCONTRADO' | 'NO_DECIDIBLE' | 'DECIDIBLE'> {
    const result = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .query(`
        SELECT Estado,EsCerrado
        FROM aportaciones.SnapshotCalculoV2
        WHERE SnapshotId=@SnapshotId;
      `);
    const row = result.recordset[0];
    if (!row) return 'NO_ENCONTRADO';
    return row.Estado === 'COMPLETO' && Boolean(row.EsCerrado) ? 'DECIDIBLE' : 'NO_DECIDIBLE';
  }

  async consultarTotalesHistoricos(filtro: SnapshotLecturaOficialFiltro): Promise<SnapshotHistoricoAgregado | null> {
    const result = await new sql.Request(this.mssqlPool)
      .input('Organica0', sql.Char(2), filtro.organica0)
      .input('Organica1', sql.Char(2), filtro.organica1)
      .input('Anio', sql.SmallInt, filtro.anio)
      .input('Quincena', sql.TinyInt, filtro.quincena)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosAhorro,
          (SELECT COUNT(*) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosCair,
          (SELECT COUNT(*) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosPrestaciones,
          (SELECT COUNT(*) FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena) AS RegistrosVivienda,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afe),0) FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS CAIR,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afpa),0) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FRA,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afpe),0) FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FRE,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(CAST(ROUND(afe*CAST(0.2 AS DECIMAL(19,9)),6,1) AS DECIMAL(19,6))),0)
            FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FH,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(CAST(ROUND(afe*CAST(0.8 AS DECIMAL(19,9)),6,1) AS DECIMAL(19,6))),0)
            FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FV,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afaa),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAA,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(afae),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAE,
          CONVERT(VARCHAR(40),(SELECT COALESCE(SUM(total),0) FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0=@Organica0 AND clave_organica_1=@Organica1 AND anio=@Anio AND quincena=@Quincena)) AS FAT;
      `);
    const row = result.recordset[0];
    const registros = Math.max(
      Number(row?.RegistrosAhorro ?? 0),
      Number(row?.RegistrosCair ?? 0),
      Number(row?.RegistrosPrestaciones ?? 0),
      Number(row?.RegistrosVivienda ?? 0)
    );
    if (registros === 0) return null;
    return {
      registros,
      totalesA2: {
        CAIR: this.a2(row.CAIR),
        CAIR_FONDO: this.a2(row.CAIR),
        FRA: this.a2(row.FRA),
        FRE: this.a2(row.FRE),
        PRESTACIONES: this.kernel.sumarA2([this.a2(row.FRA), this.a2(row.FRE)]),
        FH: this.a2(row.FH),
        FV: this.a2(row.FV),
        VIVIENDA: this.kernel.sumarA2([this.a2(row.FH), this.a2(row.FV)]),
        FAA: this.a2(row.FAA),
        FAE: this.a2(row.FAE),
        FAT: this.a2(row.FAT),
        FAI: null
      }
    };
  }

  private mapDecision(row: Record<string, unknown>): SnapshotDecisionRegistro {
    return {
      decisionId: String(row.DecisionId),
      decision: row.Decision as SnapshotDecision,
      politicaVersion: String(row.PoliticaVersion),
      comentario: row.Comentario === null || row.Comentario === undefined ? null : String(row.Comentario),
      usuarioId: String(row.UsuarioId),
      fechaCreacion: new Date(String(row.DecisionFechaCreacion ?? row.FechaCreacion)).toISOString()
    };
  }

  private async consultarDetalles(snapshotId: string): Promise<SnapshotCalculoV2ConsultaDetalle[]> {
    const result = await new sql.Request(this.mssqlPool)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .query(`
        SELECT Orden,EmpleadoClaveHash,CONVERT(VARCHAR(40),DiasLaborados) AS DiasLaborados,DiasOrigen,
          CONVERT(VARCHAR(40),SueldoMensualD6) AS SueldoMensualD6,
          CONVERT(VARCHAR(40),OtrasPrestacionesMensualesD6) AS OtrasPrestacionesMensualesD6,
          CONVERT(VARCHAR(40),QuinqueniosMensualD6) AS QuinqueniosMensualD6,
          CONVERT(VARCHAR(40),BaseCotizacionSueldoD6) AS BaseCotizacionSueldoD6,
          CONVERT(VARCHAR(40),BaseCotizacionQuinqueniosD6) AS BaseCotizacionQuinqueniosD6,
          CONVERT(VARCHAR(40),CAIRD6) AS CAIRD6,CONVERT(VARCHAR(40),CAIRFONDOD6) AS CAIRFONDOD6,
          CONVERT(VARCHAR(40),FRAD6) AS FRAD6,
          CONVERT(VARCHAR(40),FRED6) AS FRED6,CONVERT(VARCHAR(40),FHD6) AS FHD6,
          CONVERT(VARCHAR(40),PRESTACIONESD6) AS PRESTACIONESD6,
          CONVERT(VARCHAR(40),FVD6) AS FVD6,CONVERT(VARCHAR(40),FAAD6) AS FAAD6,
          CONVERT(VARCHAR(40),VIVIENDAD6) AS VIVIENDAD6,
          CONVERT(VARCHAR(40),FAED6) AS FAED6,CONVERT(VARCHAR(40),FATD6) AS FATD6,
          CONVERT(VARCHAR(40),FAID6) AS FAID6
        FROM aportaciones.SnapshotCalculoV2Detalle
        WHERE SnapshotId=@SnapshotId
        ORDER BY Orden;
      `);
    return result.recordset.map((row) => ({
      orden: Number(row.Orden),
      empleadoClaveHash: String(row.EmpleadoClaveHash),
      diasLaborados: row.DiasLaborados === null ? null : String(row.DiasLaborados),
      diasOrigen: String(row.DiasOrigen),
      sueldoMensualD6: this.nullableString(row.SueldoMensualD6),
      otrasPrestacionesMensualesD6: this.nullableString(row.OtrasPrestacionesMensualesD6),
      quinqueniosMensualD6: this.nullableString(row.QuinqueniosMensualD6),
      baseCotizacionSueldoD6: this.nullableString(row.BaseCotizacionSueldoD6),
      baseCotizacionQuinqueniosD6: this.nullableString(row.BaseCotizacionQuinqueniosD6),
      cairD6: this.nullableString(row.CAIRD6),
      cairFondoD6: this.nullableString(row.CAIRFONDOD6 ?? row.CAIRD6),
      fraD6: this.nullableString(row.FRAD6),
      freD6: this.nullableString(row.FRED6),
      prestacionesD6: this.nullableString(row.PRESTACIONESD6),
      fhD6: this.nullableString(row.FHD6),
      fvD6: this.nullableString(row.FVD6),
      viviendaD6: this.nullableString(row.VIVIENDAD6),
      faaD6: this.nullableString(row.FAAD6),
      faeD6: this.nullableString(row.FAED6),
      fatD6: this.nullableString(row.FATD6),
      faiD6: this.nullableString(row.FAID6)
    }));
  }

  private mapTotales(row: Record<string, unknown>): SnapshotTotalesA2 {
    return {
      CAIR: this.a2(row.CAIR),
      CAIR_FONDO: this.a2(row.CAIR_FONDO ?? row.CAIR),
      FRA: this.a2(row.FRA),
      FRE: this.a2(row.FRE),
      PRESTACIONES: this.a2(row.PRESTACIONES ?? this.kernel.sumarA2([this.a2(row.FRA), this.a2(row.FRE)])),
      FH: this.a2(row.FH),
      FV: this.a2(row.FV),
      VIVIENDA: this.a2(row.VIVIENDA ?? this.kernel.sumarA2([this.a2(row.FH), this.a2(row.FV)])),
      FAA: this.a2(row.FAA),
      FAE: this.a2(row.FAE),
      FAT: this.a2(row.FAT),
      FAI: this.a2(row.FAI)
    };
  }

  private a2(value: unknown): string {
    return this.kernel.redondearA2(String(value ?? '0'));
  }

  private nullableString(value: unknown): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  private applyScope(request: sql.Request, input: SnapshotCalculoV2Input): sql.Request {
    return request
      .input('EntidadId', sql.Int, input.entidadId)
      .input('Anio', sql.SmallInt, input.anio)
      .input('Quincena', sql.TinyInt, input.quincena)
      .input('Periodo', sql.Char(4), `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`)
      .input('Organica0', sql.Char(2), input.organica0)
      .input('Organica1', sql.Char(2), input.organica1)
      .input('Organica2', sql.Char(2), input.organica2)
      .input('Organica3', sql.Char(2), input.organica3);
  }

  private async insertDetalle(transaction: sql.Transaction, snapshotId: string, detalle: SnapshotCalculoV2Detalle): Promise<void> {
    const request = new sql.Request(transaction)
      .input('SnapshotId', sql.BigInt, snapshotId)
      .input('Orden', sql.Int, detalle.orden)
      .input('EmpleadoClaveHash', sql.Char(64), detalle.empleadoClaveHash)
      .input('DiasLaborados', sql.Decimal(5, 2), detalle.diasLaborados)
      .input('DiasOrigen', sql.VarChar(40), detalle.diasOrigen);
    const values: Array<[string, string | null]> = [
      ['SueldoMensualD6', detalle.sueldoMensualD6],
      ['OtrasPrestacionesMensualesD6', detalle.otrasPrestacionesMensualesD6],
      ['QuinqueniosMensualD6', detalle.quinqueniosMensualD6],
      ['BaseCotizacionSueldoD6', detalle.baseCotizacionSueldoD6],
      ['BaseCotizacionQuinqueniosD6', detalle.baseCotizacionQuinqueniosD6],
      ['CAIRD6', detalle.cairD6],
      ['CAIRFONDOD6', detalle.cairFondoD6],
      ['FRAD6', detalle.fraD6],
      ['FRED6', detalle.freD6],
      ['PRESTACIONESD6', detalle.prestacionesD6],
      ['FHD6', detalle.fhD6],
      ['FVD6', detalle.fvD6],
      ['VIVIENDAD6', detalle.viviendaD6],
      ['FAAD6', detalle.faaD6],
      ['FAED6', detalle.faeD6],
      ['FATD6', detalle.fatD6],
      ['FAID6', detalle.faiD6]
    ];
    for (const [name, value] of values) request.input(name, sql.Decimal(19, 6), value);
    await request.query(`
      INSERT INTO aportaciones.SnapshotCalculoV2Detalle (
        SnapshotId,Orden,EmpleadoClaveHash,DiasLaborados,DiasOrigen,
        SueldoMensualD6,OtrasPrestacionesMensualesD6,QuinqueniosMensualD6,BaseCotizacionSueldoD6,BaseCotizacionQuinqueniosD6,
        CAIRD6,CAIRFONDOD6,FRAD6,FRED6,PRESTACIONESD6,FHD6,FVD6,VIVIENDAD6,FAAD6,FAED6,FATD6,FAID6
      ) VALUES (
        @SnapshotId,@Orden,@EmpleadoClaveHash,@DiasLaborados,@DiasOrigen,
        @SueldoMensualD6,@OtrasPrestacionesMensualesD6,@QuinqueniosMensualD6,@BaseCotizacionSueldoD6,@BaseCotizacionQuinqueniosD6,
        @CAIRD6,@CAIRFONDOD6,@FRAD6,@FRED6,@PRESTACIONESD6,@FHD6,@FVD6,@VIVIENDAD6,@FAAD6,@FAED6,@FATD6,@FAID6
      )
    `);
  }

  private validate(input: SnapshotCalculoV2Input): void {
    if (input.detalles.length === 0) throw new Error('SNAPSHOT_V2_SIN_DETALLE');
    const validPolicy = input.versionEsquema === 1
      ? input.precisionPolicy === FORMULA_PRECISION_POLICY_LEGACY
      : input.precisionPolicy === FORMULA_PRECISION_POLICY;
    if (!validPolicy) {
      throw new Error(`SNAPSHOT_V2_POLITICA_INVALIDA:${input.precisionPolicy}`);
    }
    const orders = new Set<number>();
    const employees = new Set<string>();
    for (const detalle of input.detalles) {
      if (!Number.isInteger(detalle.orden) || detalle.orden <= 0 || orders.has(detalle.orden)) {
        throw new Error('SNAPSHOT_V2_ORDEN_INVALIDO');
      }
      if (!HASH_PATTERN.test(detalle.empleadoClaveHash) || employees.has(detalle.empleadoClaveHash)) {
        throw new Error('SNAPSHOT_V2_EMPLEADO_INVALIDO');
      }
      if (detalle.diasLaborados !== null && !DAYS_D2_PATTERN.test(detalle.diasLaborados)) {
        throw new Error(`SNAPSHOT_V2_DIAS_INVALIDOS:${detalle.diasLaborados}`);
      }
      const moneyValues = [
        detalle.sueldoMensualD6,
        detalle.otrasPrestacionesMensualesD6,
        detalle.quinqueniosMensualD6,
        detalle.baseCotizacionSueldoD6,
        detalle.baseCotizacionQuinqueniosD6,
        detalle.cairD6,
        detalle.cairFondoD6,
        detalle.fraD6,
        detalle.freD6,
        detalle.prestacionesD6,
        detalle.fhD6,
        detalle.fvD6,
        detalle.viviendaD6,
        detalle.faaD6,
        detalle.faeD6,
        detalle.fatD6,
        detalle.faiD6
      ];
      for (const value of moneyValues) {
        if (value !== null && (!MONEY_D6_PATTERN.test(value) || value === '-0.000000')) {
          throw new Error(`SNAPSHOT_V2_DETALLE_INVALIDO:${value}`);
        }
      }
      if (detalle.faaD6 !== null && detalle.faeD6 !== null && detalle.fatD6 !== null
          && this.kernel.sumarD6([detalle.faaD6, detalle.faeD6]) !== detalle.fatD6) {
        throw new Error('SNAPSHOT_V2_FAT_INCONSISTENTE');
      }
      orders.add(detalle.orden);
      employees.add(detalle.empleadoClaveHash);
    }
    for (const value of Object.values(input.totalesA2)) {
      if (!MONEY_A2_PATTERN.test(value) || value === '-0.00') throw new Error(`SNAPSHOT_V2_TOTAL_INVALIDO:${value}`);
    }
    if (input.versionEsquema === 1) {
      if (this.kernel.sumarA2([input.totalesA2.FAA, input.totalesA2.FAE]) !== input.totalesA2.FAT) {
        throw new Error('SNAPSHOT_V2_TOTAL_FAT_INCONSISTENTE');
      }
      return;
    }
    const componentChecks: Array<[keyof SnapshotTotalesA2, keyof SnapshotCalculoV2Detalle]> = [
      ['CAIR', 'cairD6'], ['FRA', 'fraD6'], ['FRE', 'freD6'], ['FH', 'fhD6'], ['FV', 'fvD6'],
      ['FAA', 'faaD6'], ['FAE', 'faeD6'], ['FAI', 'faiD6']
    ];
    for (const [total, detail] of componentChecks) {
      const calculated = this.kernel.agregarComponenteA2(input.detalles.map((row) => String(row[detail] ?? '0')));
      if (calculated !== input.totalesA2[total]) throw new Error(`SNAPSHOT_V2_TOTAL_${total}_INCONSISTENTE`);
    }
    const fundChecks: Array<[keyof SnapshotTotalesA2, keyof SnapshotCalculoV2Detalle]> = [
      ['CAIR_FONDO', 'cairFondoD6'], ['PRESTACIONES', 'prestacionesD6'],
      ['VIVIENDA', 'viviendaD6'], ['FAT', 'fatD6']
    ];
    for (const [total, detail] of fundChecks) {
      const calculated = this.kernel.agregarA2(input.detalles.map((row) => String(row[detail] ?? '0')));
      if (calculated !== input.totalesA2[total]) throw new Error(`SNAPSHOT_V2_TOTAL_${total}_INCONSISTENTE`);
    }
    if (input.versionEsquema >= 3) {
      const parentChecks: Array<[keyof SnapshotTotalesA2, Array<keyof SnapshotTotalesA2>]> = [
        ['CAIR_FONDO', ['CAIR']],
        ['PRESTACIONES', ['FRA', 'FRE']],
        ['VIVIENDA', ['FH', 'FV']],
        ['FAT', ['FAA', 'FAE']]
      ];
      for (const [parent, children] of parentChecks) {
        const calculated = this.kernel.sumarA2(children.map((child) => input.totalesA2[child]));
        if (calculated !== input.totalesA2[parent]) {
          throw new Error(`SNAPSHOT_V2_TOTAL_${parent}_HOJAS_INCONSISTENTE`);
        }
      }
    }
  }
}
