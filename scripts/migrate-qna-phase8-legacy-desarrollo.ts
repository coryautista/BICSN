import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;
if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const batches = (source: string) => source.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean);
async function run(pool: any, file: string, applicationPrincipal?: string): Promise<any[]> {
  const source = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8');
  const rows: any[] = [];
  for (const [index, batch] of batches(source).entries()) {
    try {
      const request = pool.request();
      if (applicationPrincipal) request.input('ApplicationPrincipal', applicationPrincipal);
      rows.push(...((await request.batch(batch)).recordsets ?? []).flat());
    } catch (error) {
      const detail = error as { message?: string; lineNumber?: number; procName?: string };
      throw new Error(`${file}:BATCH_${index + 1}:LINE_${detail.lineNumber ?? 'UNKNOWN'}:PROC_${detail.procName ?? 'ADHOC'}:${detail.message ?? String(error)}`);
    }
  }
  return rows;
}
async function enrollApplicationPrincipal(pool: any): Promise<{ principal: string; enrollment: string }> {
  const result = await pool.request().input('LoginName', process.env.SQLSERVER_USER).query(`
    DECLARE @Principal SYSNAME=(SELECT name FROM sys.database_principals WHERE sid=SUSER_SID(@LoginName) AND type IN('S','U','G'));
    IF @Principal IS NULL THROW 51770,'QNA_APPLICATION_DATABASE_PRINCIPAL_NOT_FOUND',1;
    DECLARE @Enrollment VARCHAR(30)='ROLE_MEMBER';
    IF @Principal=N'dbo' OR IS_ROLEMEMBER(N'db_owner',@Principal)=1 SET @Enrollment='DB_OWNER_EXCEPTION';
    ELSE IF IS_ROLEMEMBER(N'qna_legacy_projector_executor',@Principal)<>1
    BEGIN
      DECLARE @RoleSql NVARCHAR(1000)=N'ALTER ROLE qna_legacy_projector_executor ADD MEMBER '+QUOTENAME(@Principal);
      EXEC sys.sp_executesql @RoleSql;
    END;
    SELECT @Principal Principal,@Enrollment Enrollment;`);
  return { principal: String(result.recordset[0].Principal), enrollment: String(result.recordset[0].Enrollment) };
}
async function counts(pool: any): Promise<Record<string, string>> {
  const result = await pool.request().query(`SELECT DB_NAME() BaseDatos,
    (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesAhorroHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesViviendaHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesPrestacionesHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesCairHistorico) Fondos,
    (SELECT COUNT_BIG(*) FROM aportaciones.PensionNominaTransitorioHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.GuarderiasHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.AguinaldoHistorico) Auxiliares,
    (SELECT COUNT_BIG(*) FROM retenciones.PrestamosCortoPlazoHistorico)+(SELECT COUNT_BIG(*) FROM retenciones.PrestamosMedianoPlazoHistorico)+(SELECT COUNT_BIG(*) FROM retenciones.PrestamosHipotecariosHistorico) Retenciones,
    (SELECT COUNT_BIG(*) FROM aportaciones.ResumenHistorico) Resumen,(SELECT COUNT_BIG(*) FROM conciliacion.RevisionAplicacionHistorico) Revision;`);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([key, value]) => [key, String(value)]));
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const before = await counts(pool);
    if (before.BaseDatos !== development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${before.BaseDatos}`);
    if (!execute) {
      console.log(JSON.stringify({ environment: 'DESARROLLO', execute: false, before }, null, 2));
      console.log('QNA_PHASE8_LEGACY_DESARROLLO_DRY_RUN_OK');
      return;
    }
    await run(pool, '20260826_13_add_qna_phase8_legacy_dual_write.sql');
    const application = await enrollApplicationPrincipal(pool);
    const evidence = await run(pool, '20260826_14_verify_qna_phase8_legacy_dual_write.sql', application.principal);
    const after = await counts(pool);
    for (const key of ['Fondos', 'Auxiliares', 'Retenciones', 'Resumen', 'Revision']) {
      if (before[key] !== after[key]) throw new Error(`MIGRACION_MODIFICO_FILAS_EXISTENTES:${key}`);
    }
    if (!evidence.some((row) => row.Resultado === 'QNA_PHASE8_LEGACY_DUAL_WRITE_SCHEMA_OK')) throw new Error('VERIFICACION_SIN_MARCADOR_OK');
    console.log(JSON.stringify({ environment: 'DESARROLLO', execute: true, application,
      deploymentRisk: application.enrollment === 'DB_OWNER_EXCEPTION' ? 'DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE' : 'NONE', before, after }, null, 2));
    console.log('QNA_PHASE8_LEGACY_DESARROLLO_MIGRATION_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
