import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const quality = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2
       WHERE Anio=2026 AND Quincena=15 AND Organica0='04' AND Organica1='24') AS SnapshotsCalculo,
      (SELECT COUNT(*) FROM aportaciones.SnapshotCalculoV2Decision d
       JOIN aportaciones.SnapshotCalculoV2 s ON s.SnapshotId=d.SnapshotId
       WHERE s.Anio=2026 AND s.Quincena=15 AND s.Organica0='04' AND s.Organica1='24'
         AND d.Decision='APROBADO') AS DecisionesCalculo,
      (SELECT COUNT(*) FROM liquidacion.QnaSnapshot
       WHERE Anio=2026 AND Quincena=15 AND Organica0='04' AND Organica1='24' AND Estado='COMPLETO') AS LiquidacionesCompletas,
      (SELECT COUNT(*) FROM liquidacion.QnaSnapshotOficialActual o
       JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=o.QnaProcesoId
       WHERE p.Anio=2026 AND p.Quincena=15 AND p.Organica0='04' AND p.Organica1='24') AS LiquidacionesOficiales,
      (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 r
       JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=r.LiquidacionSnapshotId
       WHERE s.Anio=2026 AND s.Quincena=15 AND s.Organica0='04' AND s.Organica1='24') AS PCPHistorico,
      (SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 r
       JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=r.LiquidacionSnapshotId
       WHERE s.Anio=2026 AND s.Quincena=15 AND s.Organica0='04' AND s.Organica1='24') AS PMPHistorico,
      (SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 r
       JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=r.LiquidacionSnapshotId
       WHERE s.Anio=2026 AND s.Quincena=15 AND s.Organica0='04' AND s.Organica1='24') AS HIPHistorico;

    SELECT s.LiquidacionSnapshotId,s.Estado,s.PrecisionPolicy,
      CONVERT(VARCHAR(40),t.TotalAportacionesA2) AS TotalAportacionesA2,
      CONVERT(VARCHAR(40),t.TotalRetencionesA2) AS TotalRetencionesA2,
      CONVERT(VARCHAR(40),t.TotalGeneralA2) AS TotalGeneralA2,
      d.Decision,d.PoliticaVersion
    FROM liquidacion.QnaSnapshot s
    JOIN liquidacion.QnaSnapshotTotal t ON t.LiquidacionSnapshotId=s.LiquidacionSnapshotId
    OUTER APPLY (
      SELECT TOP 1 Decision,PoliticaVersion
      FROM liquidacion.QnaSnapshotDecision d
      WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId
      ORDER BY d.FechaCreacion DESC,d.QnaSnapshotDecisionId DESC
    ) d
    WHERE s.Anio=2026 AND s.Quincena=15 AND s.Organica0='04' AND s.Organica1='24';
  `);
  console.log(JSON.stringify({ environment: 'CALIDAD', readOnly: true, resumen: result.recordsets[0][0], liquidaciones: result.recordsets[1] }, null, 2));
} finally {
  await closeDatabaseConnection();
}
