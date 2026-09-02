import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
if (execute && !confirmed) throw new Error('CONFIRMACION_DESARROLLO_REQUERIDA');
const expected = new Map([[12, 14], [20, 15]]);
const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const transaction = new sql.Transaction(pool);
let active = false;

try {
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  active = true;
  const cargas = await new sql.Request(transaction).query(`
    SELECT Id,Anio,Quincena,Organica0,Organica1,Organica2,Organica3
    FROM dbo.NominaAplicacionQnalCarga WITH (UPDLOCK,HOLDLOCK) WHERE Id IN (12,20) ORDER BY Id;
    SELECT Id,CargaId,LineaNumero,LineaOriginal
    FROM dbo.NominaAplicacionQnalDetalle WITH (UPDLOCK,HOLDLOCK) WHERE CargaId IN (12,20) ORDER BY CargaId,LineaNumero;`);
  const sets = cargas.recordsets as sql.IRecordSet<Record<string, unknown>>[];
  assert.equal(sets[0].length, 2, 'CARGAS_12_20_INCOMPLETAS');
  for (const row of sets[0]) {
    assert.equal(Number(row.Anio), 2026);
    assert.equal(Number(row.Quincena), expected.get(Number(row.Id)));
    assert.deepEqual([row.Organica0,row.Organica1,row.Organica2,row.Organica3].map(String), ['04','24','01','01']);
  }
  const updated = new Map<number, number>();
  for (const detail of sets[1]) {
    const cargaId = Number(detail.CargaId);
    const parsed = parseNominaAplicacionQnalTxt(Buffer.from(String(detail.LineaOriginal ?? ''), 'latin1'));
    assert.deepEqual(parsed.errores, [], `CARGA_${cargaId}_LINEA_${detail.LineaNumero}_INVALIDA`);
    assert.equal(parsed.registros.length, 1);
    const row = parsed.registros[0];
    const request = bind(new sql.Request(transaction), row)
      .input('DetalleId', sql.BigInt, detail.Id)
      .input('CargaId', sql.BigInt, cargaId)
      .input('LineaNumero', sql.Int, detail.LineaNumero);
    const result = await request.query(`
      UPDATE dbo.NominaAplicacionQnalDetalle SET
        AportacionAfiliadoFondoAhorro=@AAF,AportacionEntidadFondoAhorro=@AEF,
        AportacionAfiliadoEBI=NULL,AportacionEntidadEBI=NULL,
        BaseCotizacionSueldo=@BCS,BaseCotizacionQuinquenios=@BCQ,SueldoMensual=@Sueldo,
        AyudasMensuales=NULL,QuinqueniosMensual=@QuinqMen,
        DescuentoPrestamoCortoPlazo=@PCP,DescuentoPrestamoHipotecario=@HIP,
        FechaMovimiento=@Fecha,CAIR=@CAIR,DiasLaborados=@Dias
      WHERE Id=@DetalleId AND CargaId=@CargaId;
      UPDATE s SET
        AportacionAfiliadoFondoAhorro=@AAF,AportacionEntidadFondoAhorro=@AEF,
        AportacionAfiliadoEBI=NULL,AportacionEntidadEBI=NULL,
        BaseCotizacionSueldo=@BCS,BaseCotizacionQuinquenios=@BCQ,SueldoMensual=@Sueldo,
        AyudasMensuales=NULL,QuinqueniosMensual=@QuinqMen,
        DescuentoPrestamoCortoPlazo=@PCP,DescuentoPrestamoHipotecario=@HIP,
        FechaMovimiento=@Fecha,CAIR=@CAIR,DiasLaborados=@Dias
      FROM dbo.NominaAplicacionQnalStagingDetalle s
      INNER JOIN dbo.NominaAplicacionQnalSincronizacion n ON n.SincronizacionId=s.SincronizacionId
      WHERE n.CargaId=@CargaId AND s.LineaNumero=@LineaNumero;`);
    assert.equal(result.rowsAffected[0], 1, `DETALLE_${detail.Id}_NO_ACTUALIZADO`);
    updated.set(cargaId, (updated.get(cargaId) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(updated), { 12: 169, 20: 167 });
  if (execute) {
    await transaction.commit();
    active = false;
    console.log(JSON.stringify({ environment: 'DESARROLLO', committed: true, updated: Object.fromEntries(updated) }));
  } else {
    await transaction.rollback();
    active = false;
    console.log(JSON.stringify({ environment: 'DESARROLLO', committed: false, updated: Object.fromEntries(updated) }));
  }
} finally {
  if (active) await transaction.rollback().catch(() => undefined);
  await closeDatabaseConnection();
}

function bind(request: sql.Request, row: ReturnType<typeof parseNominaAplicacionQnalTxt>['registros'][number]) {
  return request
    .input('AAF',sql.Decimal(18,2),row.aportacionAfiliadoFondoAhorro)
    .input('AEF',sql.Decimal(18,2),row.aportacionEntidadFondoAhorro)
    .input('BCS',sql.Decimal(18,2),row.baseCotizacionSueldo)
    .input('BCQ',sql.Decimal(18,2),row.baseCotizacionQuinquenios)
    .input('Sueldo',sql.Decimal(18,2),row.sueldoMensual)
    .input('QuinqMen',sql.Decimal(18,2),row.quinqueniosMensual)
    .input('PCP',sql.Decimal(18,2),row.descuentoPrestamoCortoPlazo)
    .input('HIP',sql.Decimal(18,2),row.descuentoPrestamoHipotecario)
    .input('Fecha',sql.Date,row.fechaMovimiento)
    .input('CAIR',sql.Decimal(18,2),row.cair)
    .input('Dias',sql.Decimal(5,2),row.diasLaborados);
}
