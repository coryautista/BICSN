import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { NominaAplicacionQnalTxtRepository } from '../src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.js';
import type { NominaAplicacionQnalRegistroParsed, NominaAplicacionQnalUploadInput } from '../src/modules/nomina/domain/entities/NominaAplicacionQnalTxt.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);
const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const repo = new NominaAplicacionQnalTxtRepository(pool);
const uuid = randomUUID();
const claim = randomUUID();
const marker = uuid.slice(0, 8).toUpperCase();
const input: NominaAplicacionQnalUploadInput = { entidadId: 1, anio: 2098, quincena: 23, organica0: '98', organica1: '97', organica2: '96', organica3: '95', archivoNombre: `synthetic-${marker}.txt`, archivoContenido: Buffer.from(marker), usuarioId: `sql-sync-${marker}` };
const rows: NominaAplicacionQnalRegistroParsed[] = [1, 2].map((numeroLinea) => ({ numeroLinea, lote: '2398001', tipoRegistro: '2', clavePersonal: `SYN${marker}${numeroLinea}`, rfc: `SYN${marker.slice(0, 5)}${numeroLinea}T0`, nombreAfiliado: `SINTETICO ${numeroLinea}`, aportacionAfiliadoFondoAhorro: 10 + numeroLinea, aportacionEntidadFondoAhorro: 20 + numeroLinea, aportacionAfiliadoEBI: 30 + numeroLinea, aportacionEntidadEBI: 40 + numeroLinea, baseCotizacionSueldo: 1000 + numeroLinea, baseCotizacionQuinquenios: 0, sueldoMensual: 2000 + numeroLinea, descuentoPrestamoCortoPlazo: 0, descuentoPrestamoHipotecario: 0, fechaMovimiento: new Date('2098-12-01T00:00:00Z'), descuentoPrestamoMedianoPlazo: null, descuentosOtros: null, cair: 50 + numeroLinea, cairVoluntario: null, fechaRegistro: new Date(), diasLaborados: 15, layoutVersion: '20', lineaOriginal: `SYNTHETIC-${marker}-${numeroLinea}` }));
const hash = createHash('sha256').update(input.archivoContenido).digest('hex').toUpperCase();
let syncId: number | undefined;
let cargaId: number | undefined;

try {
  const occupied = await pool.request().input('Entidad',sql.Int,input.entidadId).input('Anio',sql.SmallInt,input.anio).input('Qna',sql.TinyInt,input.quincena).input('O0',sql.Char(2),input.organica0).input('O1',sql.Char(2),input.organica1).input('O2',sql.Char(2),input.organica2).input('O3',sql.Char(2),input.organica3).query(`SELECT (SELECT COUNT(*) FROM dbo.NominaAplicacionQnalCarga WHERE EntidadId=@Entidad AND Anio=@Anio AND Quincena=@Qna AND Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3) Cargas,(SELECT COUNT(*) FROM liquidacion.QnaSnapshot WHERE EntidadId=@Entidad AND Anio=@Anio AND Quincena=@Qna AND Organica0=@O0 AND Organica1=@O1 AND Organica2=@O2 AND Organica3=@O3) Snapshots`);
  assert.deepEqual({ cargas:Number(occupied.recordset[0].Cargas), snapshots:Number(occupied.recordset[0].Snapshots) },{ cargas:0,snapshots:0 },'El scope sintético futuro no está vacío');
  const prepared = await repo.prepararSincronizacion(input, rows, hash, uuid); syncId = prepared.sincronizacionId;
  await repo.iniciarSincronizacion(syncId, prepared.intentoUuid, claim);
  await repo.registrarResultadoFirebird(syncId, prepared.intentoUuid, claim, 'COMMIT_CONFIRMADO', { periodo:'2398',detallesEsperados:2,detallesP:2,resumenes:1,totales:{ AAF:23 } });
  const applied = await repo.finalizarSincronizacion(syncId, prepared.intentoUuid); cargaId = Number(applied.cargaId);
  const ledger = await pool.request().input('Id',sql.BigInt,syncId).query('SELECT Estado,Activo,CargaId,ResultadoFirebird,ConteoFirebirdP,ConteoResumen FROM dbo.NominaAplicacionQnalSincronizacion WHERE SincronizacionId=@Id');
  assert.deepEqual({ estado:ledger.recordset[0].Estado,activo:Boolean(ledger.recordset[0].Activo),cargaId:Number(ledger.recordset[0].CargaId),outcome:ledger.recordset[0].ResultadoFirebird,p:Number(ledger.recordset[0].ConteoFirebirdP),resumen:Number(ledger.recordset[0].ConteoResumen) },{ estado:'TERMINADO',activo:false,cargaId,outcome:'COMMIT_CONFIRMADO',p:2,resumen:1 });
  const details = await pool.request().input('Carga',sql.BigInt,cargaId).query('SELECT LineaNumero,LineaOriginal,RFC,ClavePersonal,CAIR,DiasLaborados FROM dbo.NominaAplicacionQnalDetalle WHERE CargaId=@Carga ORDER BY LineaNumero');
  assert.deepEqual(details.recordset.map(r=>({ linea:Number(r.LineaNumero),original:r.LineaOriginal,rfc:r.RFC,clave:r.ClavePersonal,cair:Number(r.CAIR),dias:Number(r.DiasLaborados) })),rows.map(r=>({ linea:r.numeroLinea,original:r.lineaOriginal,rfc:r.rfc,clave:r.clavePersonal,cair:r.cair,dias:r.diasLaborados })));
  const replayPrepared = await repo.prepararSincronizacion(input, rows, hash, randomUUID());
  assert.equal(replayPrepared.alreadyTerminated?.cargaId,cargaId);
  assert.equal(Number((await repo.finalizarSincronizacion(syncId, prepared.intentoUuid)).cargaId),cargaId);
  assert.equal(Number((await pool.request().input('Carga',sql.BigInt,cargaId).query('SELECT COUNT(*) Total FROM dbo.NominaAplicacionQnalDetalle WHERE CargaId=@Carga')).recordset[0].Total),2);
  console.log('NOMINA_SQL_SYNC_INTEGRATION_DESARROLLO_OK');
} finally {
  if (syncId !== undefined || cargaId !== undefined) {
    const cleanup = new sql.Transaction(pool); await cleanup.begin();
    try {
      if (cargaId !== undefined) {
        await new sql.Request(cleanup).input('Carga',sql.BigInt,cargaId).query('DELETE FROM dbo.NominaAplicacionQnalDetalleHistorial WHERE CargaId=@Carga OR CargaReemplazoId=@Carga; DELETE FROM dbo.NominaAplicacionQnalDetalle WHERE CargaId=@Carga');
      }
      if (syncId !== undefined) await new sql.Request(cleanup).input('Sync',sql.BigInt,syncId).query('DELETE FROM dbo.NominaAplicacionQnalStagingDetalle WHERE SincronizacionId=@Sync; DELETE FROM dbo.NominaAplicacionQnalStagingCarga WHERE SincronizacionId=@Sync; DELETE FROM dbo.NominaAplicacionQnalSincronizacion WHERE SincronizacionId=@Sync');
      if (cargaId !== undefined) await new sql.Request(cleanup).input('Carga',sql.BigInt,cargaId).query('DELETE FROM dbo.NominaAplicacionQnalCargaError WHERE CargaId=@Carga; DELETE FROM dbo.NominaAplicacionQnalCarga WHERE Id=@Carga');
      await cleanup.commit();
    } catch (error) { await cleanup.rollback().catch(()=>undefined); throw error; }
  }
  await closeDatabaseConnection();
}
