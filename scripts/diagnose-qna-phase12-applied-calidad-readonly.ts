import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import Ajv from 'ajv';
import { qnaAppliedDetailResponses } from '../src/modules/liquidacionQna/liquidacionQna.applied.openapi.js';

const quality = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const [{ connectDatabase, closeDatabaseConnection }, repository] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js'),
]);
const pool = await connectDatabase();

try {
  const cte = repository.appliedAllSourcesCte();
  const result = await pool.request().query(`
    SELECT DB_NAME() AS BaseDatos;

    ${cte}
    SELECT QnaProcesoId,LiquidacionSnapshotId,EntidadId,Anio,Quincena,
      Organica0,Organica1,Organica2,Organica3,VersionEsquema,IntegrityCode
    FROM Evidencias
    WHERE ProcessRank=1 AND IntegrityCode IS NOT NULL
    ORDER BY Anio DESC,Quincena DESC,OrdenTie DESC;

    ${cte}
    SELECT a.QnaProcesoId,a.LiquidacionSnapshotId,a.EntidadId,a.Anio,a.Quincena,
      a.Organica0,a.Organica1,a.Organica2,a.Organica3,a.VersionEsquema,a.Fuente,
      (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=a.LiquidacionSnapshotId) AS Fuentes,
      (SELECT COUNT(DISTINCT f.Dominio) FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=a.LiquidacionSnapshotId) AS Dominios,
      (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f WHERE f.LiquidacionSnapshotId=a.LiquidacionSnapshotId AND
        (f.Dominio NOT IN('AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP')
          OR f.Requerida<>1 OR (f.Estado='COMPLETE' AND (f.Registros<=0 OR f.HashFuente IS NULL))
          OR (f.Estado='NOT_APPLICABLE' AND (f.Registros<>0 OR f.NotApplicableAprobado<>1 OR f.AprobadoPor IS NULL OR f.Evidencia IS NULL))
          OR f.Estado NOT IN('COMPLETE','NOT_APPLICABLE'))) AS FuentesInvalidas,
      (SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal t WHERE t.LiquidacionSnapshotId=a.LiquidacionSnapshotId) AS Totales,
      CONVERT(BIT,CASE WHEN ${repository.appliedStructuralConflictSql('a')} THEN 1 ELSE 0 END) AS ConflictoEstructural
    FROM Elegibles a
    WHERE a.Fuente<>'HISTORICO_LEGACY' AND ${repository.appliedStructuralConflictSql('a')}
    ORDER BY a.Anio DESC,a.Quincena DESC,a.OrdenTie DESC;

    ${cte}
    SELECT a.EntidadId,a.Anio,a.Quincena,a.Organica0,a.Organica1,a.Organica2,a.Organica3,
      a.ExactEvidenceCount,a.ReducedScopeCount,
      CONVERT(BIT,CASE WHEN ${repository.legacyOwnershipConflictSql('a')} THEN 1 ELSE 0 END) AS ConflictoOwnership
    FROM Elegibles a
    WHERE a.Fuente='HISTORICO_LEGACY' AND ${repository.legacyOwnershipConflictSql('a')}
    ORDER BY a.Anio DESC,a.Quincena DESC,a.OrdenTie DESC;

    ${cte}
    SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,Fuente,VersionEsquema
    FROM Elegibles
    ORDER BY Anio DESC,Quincena DESC,EntidadId,Organica0,Organica1,Organica2,Organica3;

    ${cte}
    SELECT a.EntidadId,a.Anio,a.Quincena,a.Organica0,a.Organica1,a.Organica2,a.Organica3,
      s.VersionEsquema,s.PrecisionPolicy,
      IIF(t.CAIRFondoA2 IS NULL,1,0) AS CairFondoMissing,
      IIF(s.SnapshotCalculoV2Id IS NULL,1,0) AS SnapshotV2Missing,
      IIF(v.SnapshotId IS NULL,1,0) AS SnapshotV2BrokenLink,
      IIF(t.CAIRFondoA2=v.CAIR_FONDO,1,0) AS CairFondoMatchesV2,
      (SELECT MIN(vd.Orden) FROM aportaciones.SnapshotCalculoV2Detalle vd WHERE vd.SnapshotId=s.SnapshotCalculoV2Id) AS MinV2DetailOrder,
      (SELECT MAX(vd.Orden) FROM aportaciones.SnapshotCalculoV2Detalle vd WHERE vd.SnapshotId=s.SnapshotCalculoV2Id) AS MaxV2DetailOrder
    FROM Elegibles a
    JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=a.LiquidacionSnapshotId
    LEFT JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=s.LiquidacionSnapshotId
    LEFT JOIN aportaciones.SnapshotCalculoV2 v ON v.SnapshotId=s.SnapshotCalculoV2Id
    WHERE a.Fuente='SNAPSHOT_OFICIAL_RECONSTRUIDO';
  `);

  if (String(result.recordsets[0][0]?.BaseDatos) !== quality.sqlDatabase) {
    throw new Error('QNA_PHASE12_DIAGNOSE_DESTINATION_INVALID');
  }
  const evidence = {
    environment: 'CALIDAD',
    readOnly: true,
    transitionConflicts: result.recordsets[1],
    snapshotConflicts: result.recordsets[2],
    legacyOwnershipConflicts: result.recordsets[3],
    repositoryRead: await diagnoseRepositoryRead(),
    scopedReads: await diagnoseScopedReads(result.recordsets[4]),
    reconstructedMetadata: result.recordsets[5],
  };
  console.log(JSON.stringify(evidence, null, 2));
  const conflicts = result.recordsets[1].length+result.recordsets[2].length+result.recordsets[3].length;
  if (conflicts > 0) throw new Error(`QNA_PHASE12_APPLIED_INTEGRITY_CONFLICTS:${conflicts}`);
  if (!evidence.repositoryRead.ok) throw new Error(`QNA_PHASE12_APPLIED_REPOSITORY_READ_FAILED:${evidence.repositoryRead.code}`);
  if (evidence.scopedReads.some(read => !read.ok || read.detailSchemaValid === false)) throw new Error('QNA_PHASE12_APPLIED_SCOPED_READ_FAILED');
  console.log('QNA_PHASE12_APPLIED_INTEGRITY_READONLY_OK');

  async function diagnoseRepositoryRead(): Promise<{ ok: boolean; code: string | null; message: string | null; cause?: string }> {
    try {
      const appliedRepository = new repository.LiquidacionQnaRepository(pool);
      await appliedRepository.listApplied({ page: 1, pageSize: 1, esAdmin: true });
      return { ok: true, code: null, message: null };
    } catch (error) {
      const detail = error as { code?: string; message?: string; cause?: unknown };
      const cause = detail.cause instanceof Error ? detail.cause.message : detail.cause == null ? undefined : String(detail.cause);
      return { ok: false, code: detail.code ?? 'UNCLASSIFIED', message: detail.message ?? String(error), ...(cause ? { cause } : {}) };
    }
  }

  async function diagnoseScopedReads(rows: Array<Record<string, any>>): Promise<Array<Record<string, unknown>>> {
    const appliedRepository = new repository.LiquidacionQnaRepository(pool);
    const diagnostics: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const scope = {
        entidadId: Number(row.EntidadId), anio: Number(row.Anio), quincena: Number(row.Quincena),
        organica0: String(row.Organica0), organica1: String(row.Organica1),
        organica2: String(row.Organica2), organica3: String(row.Organica3),
      };
      try {
        const read = await appliedRepository.listApplied({ ...scope, page: 1, pageSize: 1, esAdmin: true });
        const detail = await appliedRepository.getAppliedDetails({ ...scope, dominio: 'AHORRO', page: 1, pageSize: 1, esAdmin: true });
        const ajv = new Ajv({ strict: false, allErrors: true, formats: { 'date-time': true } });
        const validate = ajv.compile(qnaAppliedDetailResponses[200] as object);
        const detailSchemaValid = validate({ ok: true, data: detail });
        diagnostics.push({ ...scope, source: row.Fuente, ok: true, items: read.items.length, detailSchemaValid,
          ...(!detailSchemaValid ? { detailSchemaErrors: validate.errors?.map(item => ({ path: item.instancePath, keyword: item.keyword, params: item.params })) } : {}) });
      } catch (error) {
        const detail = error as { code?: string; cause?: unknown };
        const cause = detail.cause instanceof Error ? detail.cause.message : detail.cause == null ? undefined : String(detail.cause);
        diagnostics.push({ ...scope, source: row.Fuente, ok: false, code: detail.code ?? 'UNCLASSIFIED', ...(cause ? { cause } : {}) });
      }
    }
    return diagnostics;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
