import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.QNA_HIP_LEGACY_PERIODS = 'NONE';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const { LiquidacionQnaRepository } = await import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js');
const { LiquidacionQnaError } = await import('../src/modules/liquidacionQna/domain/errors.js');
const { calculateCanonicalHash, calculateQnaEmployeeDetailHash, calculateQnaHash } = await import('../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js');
const { fundProjection } = await import('../src/modules/liquidacionQna/domain/services/QnaOfficialSnapshotV5Factory.js');
const { validateAppliedQnaCandidate } = await import('../src/modules/liquidacionQna/domain/services/QnaAppliedIntegrity.js');
const { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } = await import('../src/modules/liquidacionQna/domain/services/QnaAuxiliaryPayloadV1.js');
const pool = await connectDatabase();
const fixtureUser = '00000000-0000-0000-0000-000000000009';
const transaction = new sql.Transaction(pool);
let active = false;

try {
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  active = true;
  const repository = new LiquidacionQnaRepository(pool);
  const links = await new sql.Request(transaction).query(`SELECT
    (SELECT TOP(1) FormulaCalculoVersionId FROM aportaciones.FormulaCalculoVersion ORDER BY FormulaCalculoVersionId) FormulaCalculoVersionId,
    (SELECT TOP(1) Id FROM dbo.NominaAplicacionQnalCarga ORDER BY Id) NominaCargaId;`);
  assert(links.recordset[0].FormulaCalculoVersionId && links.recordset[0].NominaCargaId, 'Desarrollo requiere links de formula y nomina para fixture V5');
  const formulaCalculoVersionId = String(links.recordset[0].FormulaCalculoVersionId);
  const nominaCargaId = String(links.recordset[0].NominaCargaId);
  const scope = { entidadId: 1, anio: 2098, quincena: 24, organica0: '97', organica1: '97', organica2: '97', organica3: '97' };
  const employee: Record<string, any> = { orden: 1, empleadoClave: '900001', empleadoClaveHash: 'A'.repeat(64), interno: 900001,
    rfc: 'PHASE9900001', nombre: 'Árbol Phase Nine', sourceScale: 6, sueldoD6: '0.000000', otrasPrestacionesD6: '0.000000',
    quinqueniosD6: '0.000000', diasLaborados: '15.00', diasOrigen: 'default', sueldoMensualD6: '0.000000', baseCotizacionSueldoD6: '0.000000',
    quinqueniosMensualD6: '0.000000', baseCotizacionQuinqueniosD6: '0.000000', cairD6: '0.000000', cairFondoD6: '0.000000',
    fraD6: '0.000000', freD6: '0.000000', prestacionesD6: '0.000000', fhD6: '0.000000', fvD6: '0.000000', viviendaD6: '0.000000',
    faaD6: '0.000000', faeD6: '0.000000', fatD6: '0.000000', faiD6: '0.000000', guarderiasD6: '0.000000', transitorioD6: '0.000000',
    aguinaldoD6: '0.000000', retencionPcpD6: '0.000000', retencionPmpD6: '0.000000', retencionHipD6: '0.000000', hashFila: '' };
  employee.hashFila = calculateQnaEmployeeDetailHash(employee as any);
  const zeroTotals = { registros: 1, cairA2: '0.00', fraA2: '0.00', freA2: '0.00', fhA2: '0.00', fvA2: '0.00', faaA2: '0.00', faeA2: '0.00',
    fatA2: '0.00', faiA2: '0.00', ahorroA2: '0.00', viviendaA2: '0.00', prestacionesA2: '0.00', cairFondoA2: '0.00', guarderiasA2: '0.00',
    transitorioA2: '0.00', aguinaldoA2: '0.00', retencionPcpA2: '0.00', retencionPmpA2: '0.00', retencionHipA2: '0.00',
    totalAportacionesA2: '0.00', totalRetencionesA2: '0.00', totalGeneralA2: '0.00' };
  const official = (variant: string) => ({
    snapshotV2: { ...scope, ambiente: 'DESARROLLO' as const, fuente: 'LIQUIDACION_V2' as const, estado: 'COMPLETO' as const,
      formulaCalculoVersionId, nominaCargaId, precisionPolicy: 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3', versionEsquema: 5, usuarioId: fixtureUser,
      totalesA2: { CAIR: '0.00', CAIR_FONDO: '0.00', FRA: '0.00', FRE: '0.00', PRESTACIONES: '0.00', FH: '0.00', FV: '0.00', VIVIENDA: '0.00', FAA: '0.00', FAE: '0.00', FAT: '0.00', FAI: '0.00' },
      detalles: [{ orden: 1, empleadoClaveHash: employee.empleadoClaveHash, diasLaborados: '15.00', diasOrigen: 'default' as const,
        sueldoMensualD6: '0.000000', otrasPrestacionesMensualesD6: '0.000000', quinqueniosMensualD6: '0.000000', baseCotizacionSueldoD6: '0.000000',
        baseCotizacionQuinqueniosD6: '0.000000', cairD6: '0.000000', cairFondoD6: '0.000000', fraD6: '0.000000', freD6: '0.000000',
        prestacionesD6: '0.000000', fhD6: '0.000000', fvD6: '0.000000', viviendaD6: '0.000000', faaD6: '0.000000', faeD6: '0.000000', fatD6: '0.000000', faiD6: '0.000000' }] },
    candidate: { ...scope, ambiente: 'DESARROLLO' as const, nominaCargaId, formulaCalculoVersionId, usuarioId: fixtureUser, versionEsquema: 5 as const,
      fuentes: ['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP'].map(dominio => {
        const fund = ['AHORRO','VIVIENDA','PRESTACIONES','CAIR'].includes(dominio);
        const procedure = dominio === 'PCP' ? 'AP_S_PCP' : dominio === 'PMP' ? 'AP_S_VIV' : dominio === 'HIP' ? 'AP_S_HIP_QNA' : dominio;
        const fundHash = fund ? calculateCanonicalHash([[employee.empleadoClaveHash, calculateCanonicalHash(fundProjection(dominio as any, employee as any))]]) : null;
        return { dominio, tipoFuente: 'FIREBIRD', estado: fund ? 'COMPLETE' : 'NOT_APPLICABLE', requerida: true,
          identificadorFuente: fund ? `FIXTURE:${dominio}:${variant}` : `FIREBIRD:${procedure}:DESARROLLO:2498:97:97`, hashFuente: fundHash,
          sourceScale: fund ? 6 : 2, registros: fund ? 1 : 0, notApplicableAprobado: !fund, aprobadoPor: fund ? null : fixtureUser,
          evidencia: fund ? null : 'Fixture rollback-only phase 9', errorCode: null };
      }), totales: zeroTotals, detalles: [], detallesEmpleado: [employee] }
  });
  const firstCreated = await repository.createOfficialV5EnTransaccion(transaction, official('FIRST') as any);
  const secondCreated = await repository.createOfficialV5EnTransaccion(transaction, official('SECOND') as any);
  const persistedCandidate: any={...official('FIRST').candidate,snapshotCalculoV2Id:(await new sql.Request(transaction).input('Id',sql.BigInt,firstCreated.liquidacionSnapshotId)
    .query('SELECT SnapshotCalculoV2Id FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id')).recordset[0].SnapshotCalculoV2Id.toString()};
  validateAppliedQnaCandidate(persistedCandidate,firstCreated.hashContenido);
  const expectIntegrityFailure=(candidate:any,expectedHash=calculateQnaHash(candidate))=>assert.throws(()=>validateAppliedQnaCandidate(candidate,expectedHash),
    (error:unknown)=>error instanceof LiquidacionQnaError&&error.code==='QNA_APLICADA_INTEGRIDAD_INVALIDA');
  const badEmployeeHash=structuredClone(persistedCandidate); badEmployeeHash.detallesEmpleado[0].hashFila='C'.repeat(64); expectIntegrityFailure(badEmployeeHash);
  const badFundSource=structuredClone(persistedCandidate); badFundSource.fuentes.find((source:any)=>source.dominio==='AHORRO').hashFuente='C'.repeat(64); expectIntegrityFailure(badFundSource);
  const badTotals=structuredClone(persistedCandidate); badTotals.totales.ahorroA2='1.00'; expectIntegrityFailure(badTotals);
  expectIntegrityFailure(persistedCandidate,'C'.repeat(64));
  const historicalHip=structuredClone(persistedCandidate);
  historicalHip.fuentes.find((source:any)=>source.dominio==='HIP').identificadorFuente='FIREBIRD:AP_S_COMP_QNA:DESARROLLO:2498:97:97';
  validateAppliedQnaCandidate(historicalHip,calculateQnaHash(historicalHip));
  const emptyFunds=structuredClone(persistedCandidate);
  emptyFunds.detallesEmpleado=[];
  emptyFunds.totales.registros=0;
  for(const source of emptyFunds.fuentes.filter((item:any)=>['AHORRO','VIVIENDA','PRESTACIONES','CAIR'].includes(item.dominio))) {
    Object.assign(source,{estado:'NOT_APPLICABLE',registros:0,hashFuente:null,notApplicableAprobado:true,aprobadoPor:fixtureUser,evidencia:'Sin filas'});
  }
  validateAppliedQnaCandidate(emptyFunds,calculateQnaHash(emptyFunds));
  const invalidEmptyFundHash=structuredClone(emptyFunds);
  invalidEmptyFundHash.fuentes.find((source:any)=>source.dominio==='AHORRO').hashFuente=calculateCanonicalHash([]);
  expectIntegrityFailure(invalidEmptyFundHash,calculateQnaHash(invalidEmptyFundHash));
  const auxiliary=structuredClone(persistedCandidate);
  const payload=Object.fromEntries(QNA_AUXILIARY_PAYLOAD_V1_FIELDS.GUARDERIAS.map(field=>[field,null]));
  const detailHash=calculateCanonicalHash(payload); const rowKey='D'.repeat(64);
  auxiliary.detalles.push({dominio:'GUARDERIAS',orden:1,claveFilaHash:rowKey,sourceScale:2,importeOficialD6:'0.000000',payloadCanonico:payload,hashFila:detailHash,
    empleadoClave:'900001',rfc:'PHASE9900001',nombre:'Árbol Phase Nine',payloadVersion:1});
  Object.assign(auxiliary.fuentes.find((source:any)=>source.dominio==='GUARDERIAS'),{estado:'COMPLETE',registros:1,hashFuente:calculateCanonicalHash([[rowKey,detailHash]]),notApplicableAprobado:false,aprobadoPor:null,evidencia:null});
  const auxiliaryHash=calculateQnaHash(auxiliary); validateAppliedQnaCandidate(auxiliary,auxiliaryHash);
  auxiliary.detalles[0].payloadCanonico.titular_nombre='alterado'; expectIntegrityFailure(auxiliary,auxiliaryHash);
  const process = await new sql.Request(transaction).query(`INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
    OUTPUT INSERTED.QnaProcesoId VALUES(1,2098,24,'97','97','97','97','phase9-fixture')`);
  const first = { LiquidacionSnapshotId: firstCreated.liquidacionSnapshotId, QnaProcesoId: process.recordset[0].QnaProcesoId };
  const second = { LiquidacionSnapshotId: secondCreated.liquidacionSnapshotId, QnaProcesoId: process.recordset[0].QnaProcesoId };

  const nonTerminated = await new sql.Request(transaction).query(`INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
    OUTPUT INSERTED.QnaProcesoId VALUES(1,2099,24,'99','99','99','99','phase9-fixture')`);
  await new sql.Request(transaction).input('Proceso', sql.BigInt, nonTerminated.recordset[0].QnaProcesoId).input('Snapshot', sql.BigInt, first.LiquidacionSnapshotId)
    .query(`INSERT liquidacion.QnaProcesoTransicion(QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
      VALUES(@Proceso,@Snapshot,NULL,'OFICIAL','phase9 promoted non-terminated','phase9-fixture')`);
  const invisible = await repository.listApplied({ page: 1, pageSize: 100, anio: 2099, esAdmin: true }, transaction);
  assert.equal(invisible.total, 0, 'Promovido sin TERMINADO debe ser invisible');

  const transition = async (snapshotId: unknown) => new sql.Request(transaction).input('Proceso', sql.BigInt, first.QnaProcesoId).input('Snapshot', sql.BigInt, snapshotId)
    .query(`INSERT liquidacion.QnaProcesoTransicion(QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
      VALUES(@Proceso,@Snapshot,NULL,'TERMINADO','phase9 fixture','phase9-fixture')`);
  await transition(first.LiquidacionSnapshotId);
  await transition(second.LiquidacionSnapshotId);
  await transition(second.LiquidacionSnapshotId);

  const pointerEvent = await new sql.Request(transaction).input('Proceso', sql.BigInt, first.QnaProcesoId).input('Snapshot', sql.BigInt, first.LiquidacionSnapshotId).query(`
    INSERT liquidacion.QnaSnapshotSeleccionEvento(QnaProcesoId,LiquidacionSnapshotId,TipoEvento,Motivo,UsuarioId)
    OUTPUT INSERTED.QnaSnapshotSeleccionEventoId VALUES(@Proceso,@Snapshot,'SELECCIONADO','phase9 stale pointer','phase9-fixture')`);
  await new sql.Request(transaction).input('Proceso', sql.BigInt, first.QnaProcesoId).input('Snapshot', sql.BigInt, first.LiquidacionSnapshotId)
    .input('Evento', sql.BigInt, pointerEvent.recordset[0].QnaSnapshotSeleccionEventoId).query(`INSERT liquidacion.QnaSnapshotOficialActual
      (QnaProcesoId,LiquidacionSnapshotId,QnaSnapshotSeleccionEventoId) VALUES(@Proceso,@Snapshot,@Evento)`);
  const summary = await repository.getAppliedSummary({ ...scope, esAdmin: true }, transaction);
  assert(summary);
  assert.equal(summary.liquidacionSnapshotId, String(second.LiquidacionSnapshotId), 'La ultima TERMINADO debe ganar');
  assert.equal(summary.fuente, 'SNAPSHOT_OFICIAL');
  assert.equal(summary.estadoProceso, 'TERMINADO');
  assert.equal(summary.reconstructionStrategy, null);
  for (const key of ['liquidacionSnapshotId','snapshotCalculoV2Id','nominaCargaId','formulaCalculoVersionId'] as const) assert.match(summary[key], /^\d+$/);
  for (const value of Object.entries(summary.totales).filter(([key]) => key !== 'registros').map(([,value]) => value)) assert.match(String(value), /^-?\d+\.\d{2}$/);
  const ordinary = await repository.getAppliedSummary({ ...scope, esAdmin: false }, transaction);
  assert(ordinary);
  assert.equal('hashFuente' in ordinary.fuentes[0], false);
  assert.equal('identificadorFuente' in ordinary.fuentes[0], false);

  const global = await repository.listApplied({ page: 1, pageSize: 1, anio: scope.anio, quincena: scope.quincena, esAdmin: true }, transaction);
  assert(global.total >= 1);
  assert.equal(global.items.length, 1);
  assert.equal(new Set(global.items.map(item => item.liquidacionSnapshotId)).size, global.items.length, 'La lista no duplica snapshots');
  const isolated = await repository.listApplied({ page: 1, pageSize: 100, ...scope, esAdmin: false }, transaction);
  assert(isolated.items.every(item => item.organica0 === scope.organica0 && item.organica3 === scope.organica3));
  const beyond = await repository.listApplied({ page: 999, pageSize: 1, ...scope, esAdmin: false }, transaction);
  assert.equal(beyond.items.length, 0);

  const employeeResult = await new sql.Request(transaction).input('Id', sql.BigInt, second.LiquidacionSnapshotId)
    .query('SELECT TOP(1) EmpleadoClave FROM liquidacion.QnaSnapshotDetalle WHERE LiquidacionSnapshotId=@Id ORDER BY Orden');
  if (employeeResult.recordset[0]) {
    const buscar = String(employeeResult.recordset[0].EmpleadoClave);
    const details = await repository.getAppliedDetails({ ...scope, dominio: 'AHORRO', page: 1, pageSize: 1, buscar, esAdmin: false }, transaction);
    assert(details);
    assert(details.total >= 1);
    assert.equal(details.totalDominioA2, summary.totales.ahorroA2, 'El total oficial no cambia por filtro/paginacion');
    assert.equal('hashFila' in details.detalles[0], false);
    assert.match(details.detalles[0].importeOficialD6, /^-?\d+\.\d{6}$/);
    const searched = await repository.listApplied({ page: 1, pageSize: 100, ...scope, buscar, esAdmin: false }, transaction);
    assert(searched.items.some(item => item.liquidacionSnapshotId === String(second.LiquidacionSnapshotId)));
  }
  const accentInsensitive = await repository.listApplied({ page: 1, pageSize: 100, ...scope, buscar: 'arbol', esAdmin: false }, transaction);
  assert.equal(accentInsensitive.total, 1);
  const caseInsensitive = await repository.listApplied({ page: 1, pageSize: 100, ...scope, buscar: 'PHASE NINE', esAdmin: false }, transaction);
  assert.equal(caseInsensitive.total, 1);
  for (const buscar of ['%','_','[','~',"%' OR 1=1--"]) {
    const literal = await repository.listApplied({ page: 1, pageSize: 100, ...scope, buscar, esAdmin: false }, transaction);
    assert.equal(literal.total, 0, `Busqueda literal insegura: ${buscar}`);
  }
  assert.equal(await repository.getAppliedSummary({ ...scope, anio: 2097, esAdmin: true }, transaction), null);

  const mismatchProcess = await new sql.Request(transaction).input('Anio', sql.SmallInt, scope.anio).input('Quincena', sql.TinyInt, scope.quincena).query(`
    INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
    OUTPUT INSERTED.QnaProcesoId VALUES(1,@Anio,@Quincena,'98','98','98','98','phase9-fixture')`);
  await new sql.Request(transaction).input('Proceso', sql.BigInt, mismatchProcess.recordset[0].QnaProcesoId).input('Snapshot', sql.BigInt, second.LiquidacionSnapshotId).query(`
    INSERT liquidacion.QnaProcesoTransicion(QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
    VALUES(@Proceso,@Snapshot,NULL,'TERMINADO','phase9 mismatch','phase9-fixture')`);
  await assert.rejects(repository.getAppliedSummary({ entidadId: 1, anio: scope.anio, quincena: scope.quincena,
    organica0: '98', organica1: '98', organica2: '98', organica3: '98', esAdmin: true }, transaction),
  (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_APLICADA_INTEGRIDAD_INVALIDA');
  await assert.rejects(repository.getAppliedSummary({ anio: scope.anio, quincena: scope.quincena, esAdmin: true }, transaction),
    (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_APLICADA_OFICIAL_AMBIGUA');

  const incompleteOfficial: any = official('INCOMPLETE');
  Object.assign(incompleteOfficial.snapshotV2, { organica0: '96', organica1: '96', organica2: '96', organica3: '96' });
  Object.assign(incompleteOfficial.candidate, { organica0: '96', organica1: '96', organica2: '96', organica3: '96' });
  for (const source of incompleteOfficial.candidate.fuentes) source.identificadorFuente = source.identificadorFuente.replace(':97:97', ':96:96');
  Object.assign(incompleteOfficial.candidate.fuentes[0], { estado: 'ERROR', errorCode: 'PHASE9_FIXTURE_ERROR' });
  const incomplete = await repository.createOfficialV5EnTransaccion(transaction, incompleteOfficial);
  const incompleteProcess = await new sql.Request(transaction).query(`INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
    OUTPUT INSERTED.QnaProcesoId VALUES(1,2098,24,'96','96','96','96','phase9-fixture')`);
  await new sql.Request(transaction).input('Proceso', sql.BigInt, incompleteProcess.recordset[0].QnaProcesoId).input('Snapshot', sql.BigInt, incomplete.liquidacionSnapshotId).query(`
    INSERT liquidacion.QnaProcesoTransicion(QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)
    VALUES(@Proceso,@Snapshot,NULL,'TERMINADO','phase9 incomplete','phase9-fixture')`);
  await assert.rejects(repository.getAppliedSummary({ entidadId: 1, anio: 2098, quincena: 24, organica0: '96', organica1: '96', organica2: '96', organica3: '96', esAdmin: true }, transaction),
    (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_APLICADA_INTEGRIDAD_INVALIDA');
  await assert.rejects(repository.listApplied({ page: 1, pageSize: 100, entidadId: 1, anio: 2098, quincena: 24,
    organica0: '96', organica1: '96', organica2: '96', organica3: '96', esAdmin: true }, transaction),
    (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_APLICADA_INTEGRIDAD_INVALIDA');

  const firstHeader = await new sql.Request(transaction).input('Id',sql.BigInt,first.LiquidacionSnapshotId)
    .query('SELECT SnapshotCalculoV2Id FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id');
  const v4: any = official('V4').candidate;
  Object.assign(v4,{ organica0:'94',organica1:'94',organica2:'94',organica3:'94',versionEsquema:4,snapshotCalculoV2Id:String(firstHeader.recordset[0].SnapshotCalculoV2Id) });
  delete v4.detallesEmpleado;
  for (const source of v4.fuentes) source.identificadorFuente=source.identificadorFuente.replace(':97:97',':94:94');
  const v4Created=await (repository as any).insertCandidate(transaction,v4);
  const v4Process=await new sql.Request(transaction).query(`INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
    OUTPUT INSERTED.QnaProcesoId VALUES(1,2098,24,'94','94','94','94','phase9-fixture')`);
  await new sql.Request(transaction).input('Proceso',sql.BigInt,v4Process.recordset[0].QnaProcesoId).input('Snapshot',sql.BigInt,v4Created.liquidacionSnapshotId).query(`INSERT liquidacion.QnaProcesoTransicion
    (QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId) VALUES(@Proceso,@Snapshot,NULL,'TERMINADO','phase9 v4','phase9-fixture')`);
  const v4Excluded=await repository.listApplied({ page:1,pageSize:100,entidadId:1,anio:2098,quincena:24,organica0:'94',organica1:'94',organica2:'94',organica3:'94',esAdmin:true },transaction);
  assert.equal(v4Excluded.total,0,'V4 TERMINADO debe quedar fuera de fase 9');
  await new sql.Request(transaction).input('Proceso',sql.BigInt,first.QnaProcesoId).input('Snapshot',sql.BigInt,v4Created.liquidacionSnapshotId).query(`INSERT liquidacion.QnaProcesoTransicion
    (QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId) VALUES(@Proceso,@Snapshot,NULL,'TERMINADO','phase9 v4 posterior','phase9-fixture')`);
  const latestV5=await repository.getAppliedSummary({ ...scope, esAdmin:true },transaction);
  assert.equal(latestV5?.liquidacionSnapshotId,String(second.LiquidacionSnapshotId),'La ultima TERMINADO V5 debe ignorar una V4 posterior');

  await transaction.rollback();
  active = false;
  console.log('QNA_PHASE9_APPLIED_INTEGRATION_DESARROLLO_ROLLBACK_OK');
} finally {
  if (active) await transaction.rollback().catch(() => undefined);
  await closeDatabaseConnection();
}
