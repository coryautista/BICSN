import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { env } from '../src/config/env.js';

const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;
const EXECUTE = process.argv.includes('--execute');
const CONFIRMATION = argument('confirm-development');
const ID_REVISION = '7';
const ID_HISTORICO_FUENTE = '3';
const PERIODO = '1526';
const ORG0 = '04';
const ORG1 = '24';
const ORG2 = '01';
const ORG3 = '01';
const SNAPSHOT_QNA = '120482';
const TASK_ID = '1';
const USER = 'CORRECCION_REVISA_QNA_1526';
const FUNDS = ['CAIR', 'FRA', 'FRE', 'PRESTACIONES', 'FH', 'FV', 'VIVIENDA', 'FAA', 'FAE', 'FAT', 'FAI'] as const;
const EXPECTED_CURRENT = {
  CAIR: 83.69, FRA: 188.31, FRE: 931.09, PRESTACIONES: 0, FH: 14.65, FV: 58.59,
  VIVIENDA: 0, FAA: 209.23, FAE: 104.62, FAT: 313.85, FAI: 0
};

assertDatabaseEnvironment('DESARROLLO', env.sql.database, env.firebird.database);
if (EXECUTE && CONFIRMATION !== DEVELOPMENT.sqlDatabase) {
  throw new Error(`CONFIRMACION_DESARROLLO_REQUERIDA: --confirm-development=${DEVELOPMENT.sqlDatabase}`);
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection, getPool, sql } = await import('../src/db/mssql.js');
  await connectDatabase();
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const database = await new sql.Request(transaction).query('SELECT DB_NAME() AS Nombre;');
    assert.equal(String(database.recordset[0]?.Nombre), DEVELOPMENT.sqlDatabase, 'DESTINO_SQL_NO_PERMITIDO');

    const lock = await new sql.Request(transaction)
      .input('Resource', sql.NVarChar(255), 'BICSN:REVISION:1:2026:15:04:24:01:01')
      .query(`DECLARE @Result INT; EXEC @Result=sys.sp_getapplock @Resource=@Resource,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; SELECT @Result AS Resultado;`);
    assert.ok(Number(lock.recordset[0]?.Resultado) >= 0, 'REVISION_SCOPE_LOCK_NO_ADQUIRIDO');

    const activeTask = await new sql.Request(transaction).query(`
      SELECT IdRevisionTarea,Estatus FROM conciliacion.RevisionTarea WITH (UPDLOCK,HOLDLOCK)
      WHERE Organica0='04' AND Organica1='24' AND Organica2='01' AND Organica3='01' AND Periodo='1526'
        AND Estatus IN ('PENDIENTE','PROCESANDO');
    `);
    assert.equal(activeTask.recordset.length, 0, 'REVISION_1526_TIENE_TAREA_ACTIVA');

    const task = await new sql.Request(transaction).input('TaskId', sql.BigInt, TASK_ID).query(`
      SELECT IdRevisionTarea,Estatus,LiquidacionSnapshotId FROM conciliacion.RevisionTarea WHERE IdRevisionTarea=@TaskId;
    `);
    assert.equal(String(task.recordset[0]?.Estatus), 'COMPLETADA', 'REVISION_TAREA_1_NO_COMPLETADA');
    assert.equal(String(task.recordset[0]?.LiquidacionSnapshotId), SNAPSHOT_QNA, 'REVISION_TAREA_1_SNAPSHOT_INESPERADO');

    const state = await new sql.Request(transaction)
      .input('IdRevision', sql.BigInt, ID_REVISION)
      .input('IdHistorico', sql.BigInt, ID_HISTORICO_FUENTE)
      .query(`
        SELECT r.*,c.numeroConcepto FROM conciliacion.Revision r WITH (UPDLOCK,HOLDLOCK)
        INNER JOIN reportes.catalogoRevision c ON c.idcatalogoRevision=r.IdCatalogoRevision
        WHERE r.IdRevision=@IdRevision;
        SELECT h.* FROM conciliacion.RevisionHistorico h WHERE h.IdRevisionHistorico=@IdHistorico AND h.IdRevision=@IdRevision;
      `);
    const current = state.recordsets[0][0];
    const source = state.recordsets[1][0];
    assert.ok(current, 'REVISION_7_NO_ENCONTRADA');
    assert.ok(source, 'REVISION_HISTORICO_3_NO_ENCONTRADO');
    assert.equal(Number(current.numeroConcepto), 3, 'REVISION_7_NO_ES_CONCEPTO_3');
    for (const row of [current, source]) {
      assert.equal(String(row.Organica0).trim(), ORG0);
      assert.equal(String(row.Organica1).trim(), ORG1);
      assert.equal(String(row.Organica2).trim(), ORG2);
      assert.equal(String(row.Organica3).trim(), ORG3);
      assert.equal(String(row.Periodo).trim(), PERIODO);
    }
    assert.ok(FUNDS.every((fund) => Number(source[fund]) === 0), 'HISTORICO_3_IMPORTES_INESPERADOS');
    assert.equal(source.LiquidacionSnapshotId, null, 'HISTORICO_3_SNAPSHOT_INESPERADO');

    const restored = FUNDS.every((fund) => Number(current[fund]) === 0) && current.LiquidacionSnapshotId === null;
    const expectedCurrent = FUNDS.every((fund) => Number(current[fund]) === EXPECTED_CURRENT[fund]);
    if (!restored) {
      assert.ok(expectedCurrent, 'REVISION_7_IMPORTES_ACTUALES_INESPERADOS');
      assert.equal(String(current.LiquidacionSnapshotId), SNAPSHOT_QNA, 'REVISION_7_SNAPSHOT_ACTUAL_INESPERADO');
    }

    let createdHistoryId: string | null = null;
    if (EXECUTE && !restored) {
      const result = await new sql.Request(transaction)
        .input('IdRevision', sql.BigInt, ID_REVISION)
        .input('IdHistorico', sql.BigInt, ID_HISTORICO_FUENTE)
        .input('UsuarioOperacion', sql.NVarChar(100), USER)
        .query(`
          INSERT INTO conciliacion.RevisionHistorico (
            IdRevision,Organica0,Organica1,Organica2,Organica3,Periodo,IdCatalogoRevision,
            CAIR,FRA,FRE,PRESTACIONES,FH,FV,VIVIENDA,FAA,FAE,FAT,FAI,Estatus,Usuario,
            FechaAlta,FechaActualizacion,LiquidacionSnapshotId,TipoOperacion,UsuarioOperacion
          ) OUTPUT INSERTED.IdRevisionHistorico
          SELECT IdRevision,Organica0,Organica1,Organica2,Organica3,Periodo,IdCatalogoRevision,
            CAIR,FRA,FRE,PRESTACIONES,FH,FV,VIVIENDA,FAA,FAE,FAT,FAI,Estatus,Usuario,
            FechaAlta,FechaActualizacion,LiquidacionSnapshotId,'RESTAURACION',@UsuarioOperacion
          FROM conciliacion.Revision WHERE IdRevision=@IdRevision;

          UPDATE r SET
            CAIR=h.CAIR,FRA=h.FRA,FRE=h.FRE,PRESTACIONES=h.PRESTACIONES,FH=h.FH,FV=h.FV,
            VIVIENDA=h.VIVIENDA,FAA=h.FAA,FAE=h.FAE,FAT=h.FAT,FAI=h.FAI,
            Usuario=h.Usuario,LiquidacionSnapshotId=h.LiquidacionSnapshotId,FechaActualizacion=SYSDATETIME()
          FROM conciliacion.Revision r
          INNER JOIN conciliacion.RevisionHistorico h ON h.IdRevisionHistorico=@IdHistorico
          WHERE r.IdRevision=@IdRevision;
          SELECT @@ROWCOUNT AS Actualizados;
        `);
      createdHistoryId = String(result.recordsets[0][0].IdRevisionHistorico);
      assert.equal(Number(result.recordsets[1][0].Actualizados), 1, 'REVISION_7_NO_ACTUALIZADA_EXACTAMENTE');
    }

    const output = {
      mode: EXECUTE ? 'EXECUTE' : 'PREVIEW', database: DEVELOPMENT.sqlDatabase, periodo: PERIODO,
      organica: `${ORG0}/${ORG1}/${ORG2}/${ORG3}`, concepto: 3, idRevision: ID_REVISION,
      sourceHistoryId: ID_HISTORICO_FUENTE, operation: restored ? 'SIN_CAMBIOS' : 'UPDATE',
      currentAmounts: Object.fromEntries(FUNDS.map((fund) => [fund, Number(current[fund])])),
      restoredAmounts: Object.fromEntries(FUNDS.map((fund) => [fund, Number(source[fund])])),
      currentSnapshotId: current.LiquidacionSnapshotId === null ? null : String(current.LiquidacionSnapshotId),
      restoredSnapshotId: null, createdHistoryId
    };
    if (EXECUTE) await transaction.commit(); else await transaction.rollback();
    console.log(JSON.stringify(output, null, 2));
    console.log(`REVISION_CONCEPTO3_1526_${EXECUTE ? 'RESTORED' : 'PREVIEW'}_OK`);
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
