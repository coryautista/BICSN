import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import type { NominaAplicacionQnalRegistroParsed, NominaAplicacionQnalUploadInput } from '../src/modules/nomina/domain/entities/NominaAplicacionQnalTxt.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const RFC = 'TORN71052064A';
process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [{ connectDatabase, closeDatabaseConnection }, repositoryModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.js'),
  ]);
  const pool = await connectDatabase();
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  try {
    assert.equal(String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0]?.BaseDatos), QUALITY.sqlDatabase);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;
    const movement = await new sql.Request(transaction).input('RFC', sql.NVarChar(20), RFC).query(`
      SELECT TOP (1) d.Id,d.RFC,d.ClavePersonal,d.NombreAfiliado
      FROM dbo.NominaAplicacionQnalDetalle d
      JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId
      WHERE d.EntidadId=1 AND d.Anio=2026 AND d.Quincena=15
        AND d.Organica0='04' AND d.Organica1='24' AND d.Organica2='01' AND d.Organica3='01'
        AND d.RfcNormalizado=UPPER(LTRIM(RTRIM(@RFC))) AND c.TipoCarga='MOVIMIENTO'`);
    assert.equal(movement.recordset.length, 1, `No se encontró el MOVIMIENTO esperado para ${RFC}`);
    const row = movement.recordset[0];
    const carga = await new sql.Request(transaction).query(`
      INSERT dbo.NominaAplicacionQnalCarga
        (EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,ArchivoNombre,TotalLineas,TotalDetalles,Estatus,TipoCarga,EsVigente,UsuarioRegistro)
      OUTPUT INSERTED.Id
      VALUES (1,2026,15,'04','24','01','01','PRUEBA_ROLLBACK.txt',1,1,'APLICADA','TXT',0,'PRUEBA_ROLLBACK')`);
    const cargaId = Number(carga.recordset[0].Id);
    const input: NominaAplicacionQnalUploadInput = {
      entidadId: 1, anio: 2026, quincena: 15, organica0: '04', organica1: '24', organica2: '01', organica3: '01',
      archivoNombre: 'PRUEBA_ROLLBACK.txt', archivoContenido: Buffer.alloc(0), usuarioId: 'PRUEBA_ROLLBACK',
    };
    const registro: NominaAplicacionQnalRegistroParsed = {
      numeroLinea: 1, lote: '1526', tipoRegistro: '2', clavePersonal: String(row.ClavePersonal ?? ''), rfc: RFC,
      nombreAfiliado: String(row.NombreAfiliado ?? 'PRUEBA'), aportacionAfiliadoFondoAhorro: 1,
      aportacionEntidadFondoAhorro: 2, aportacionAfiliadoEBI: 3, aportacionEntidadEBI: 4,
      baseCotizacionSueldo: 5, baseCotizacionQuinquenios: 6, sueldoMensual: 7,
      descuentoPrestamoCortoPlazo: 8, descuentoPrestamoHipotecario: 9, fechaMovimiento: null,
      descuentoPrestamoMedianoPlazo: 10, descuentosOtros: 11, cair: 12, cairVoluntario: 13,
      fechaRegistro: new Date(), diasLaborados: 15, layoutVersion: '20', lineaOriginal: 'PRUEBA_ROLLBACK',
    };
    const repository = new repositoryModule.NominaAplicacionQnalTxtRepository(pool) as unknown as {
      upsertDetalleTxt(tx: sql.Transaction, cargaId: number, input: NominaAplicacionQnalUploadInput, registro: NominaAplicacionQnalRegistroParsed): Promise<void>;
    };
    await repository.upsertDetalleTxt(transaction, cargaId, input, registro);
    const verification = await new sql.Request(transaction).input('Id', sql.BigInt, row.Id).input('CargaId', sql.BigInt, cargaId).query(`
      SELECT d.CargaId,d.Movimiento,d.RFC FROM dbo.NominaAplicacionQnalDetalle d WHERE d.Id=@Id;
      SELECT COUNT(*) AS Total FROM dbo.NominaAplicacionQnalDetalleHistorial WHERE DetalleIdOriginal=@Id AND CargaReemplazoId=@CargaId;`);
    const sets = verification.recordsets as sql.IRecordSet<any>[];
    assert.equal(String(sets[0][0]?.CargaId), String(cargaId));
    assert.equal(sets[0][0]?.Movimiento, null);
    assert.equal(Number(sets[1][0]?.Total), 1);
    console.log(JSON.stringify({ environment: 'CALIDAD', rfc: RFC, movimientoArchivado: true, detalleConvertidoATxt: true, rollback: true }));
  } finally {
    if (transactionStarted) await transaction.rollback().catch(() => undefined);
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
