import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { randomUUID } from 'node:crypto';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);
const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const transaction = new sql.Transaction(pool);
let active = false;

try {
  const source = await readFile(new URL('../database/migrations/20260827_20_create_nomina_txt_sync_ledger_staging.sql', import.meta.url), 'utf8');
  const verify = await readFile(new URL('../database/migrations/20260827_21_verify_nomina_txt_sync_ledger_staging.sql', import.meta.url), 'utf8');
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  active = true;
  for (const migration of [source, source, verify]) {
    for (const batch of migration.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean)) {
      await new sql.Request(transaction).batch(batch);
    }
  }

  const inserted = await new sql.Request(transaction)
    .input('Uuid', sql.UniqueIdentifier, randomUUID())
    .query(`INSERT dbo.NominaAplicacionQnalSincronizacion
      (IntentoUuid,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,ArchivoNombre,ArchivoHash,LayoutVersion,TotalLineas,TotalDetalles,Estado,Activo,UsuarioRegistro)
      OUTPUT INSERTED.SincronizacionId
      VALUES(@Uuid,999,2097,23,'97','97','97','97','sintetico.txt',REPLICATE('A',64),20,2,1,'PREPARADA',1,'test')`);
  const id = inserted.recordset[0].SincronizacionId;
  await new sql.Request(transaction).input('Id',sql.BigInt,id).query(`
    INSERT dbo.NominaAplicacionQnalStagingCarga(SincronizacionId,LineaEncabezado,Lote) VALUES(@Id,1,'SINTETICO');
    INSERT dbo.NominaAplicacionQnalStagingDetalle(SincronizacionId,LineaNumero,LineaOriginal,Lote,TipoRegistro,ClavePersonal,RFC,NombreAfiliado,CAIR)
      VALUES(@Id,2,'SINTETICO', 'SINTETICO','2','SYN000001','SYNX000101T01','PERSONA SINTETICA',50.25);`);
  const counts = await new sql.Request(transaction).input('Id',sql.BigInt,id).query(`SELECT
    (SELECT COUNT(*) FROM dbo.NominaAplicacionQnalStagingCarga WHERE SincronizacionId=@Id) cargas,
    (SELECT COUNT(*) FROM dbo.NominaAplicacionQnalStagingDetalle WHERE SincronizacionId=@Id) detalles`);
  assert.deepEqual({ cargas:Number(counts.recordset[0].cargas), detalles:Number(counts.recordset[0].detalles) },{cargas:1,detalles:1});
  await transaction.rollback();
  active = false;
  console.log('NOMINA_TXT_SYNC_MIGRATION_INTEGRATION_ROLLBACK_OK');
} finally {
  if (active) await transaction.rollback().catch(() => undefined);
  await closeDatabaseConnection();
}
