import assert from 'node:assert/strict';

process.env.SQLSERVER_DB = 'SII-ISSSSPEA-DES';
process.env.FIREBIRD_DATABASE = '/db/db/dbRestaura.fdb';
process.env.QNA_HIP_LEGACY_PERIODS = '1526';

const { CaptureQnaTenDomainsQuery } = await import('../src/modules/liquidacionQna/application/queries/CaptureQnaTenDomainsQuery.js');
const { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } = await import('../src/modules/liquidacionQna/domain/services/QnaAuxiliaryPayloadV1.js');
const { QnaOfficialSnapshotV5Factory } = await import('../src/modules/liquidacionQna/domain/services/QnaOfficialSnapshotV5Factory.js');
const { calculateQnaEmployeeDetailHash, calculateQnaHash, validateQnaCandidate } = await import('../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js');
const { calcularSnapshotCalculoV2Hash } = await import('../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Hasher.js');
const { LiquidacionQnaError } = await import('../src/modules/liquidacionQna/domain/errors.js');
const { parseQnaHipLegacyPeriods } = await import('../src/config/env.js');

assert.equal(parseQnaHipLegacyPeriods(undefined), null);
assert.deepEqual(parseQnaHipLegacyPeriods('NONE'), []);
assert.deepEqual(parseQnaHipLegacyPeriods('1526,0127,1526'), ['1526', '0127']);
assert.throws(() => parseQnaHipLegacyPeriods('9926'), /QNA_HIP_LEGACY_PERIODS_INVALIDO/);

function fundRow(tipo: string, totalD6: string) {
  return {
    interno: 1,
    rfc: 'RFC1',
    numero_empleado: 'E1',
    nombre: '  María  López  ',
    sueldo: 1000,
    quinquenios: 100,
    otras_prestaciones: 20,
    sueldo_proporcional: 500,
    sueldo_base: 560,
    total: Number(totalD6),
    tipo,
    dias_laborados: 15,
    dias_laborados_origen: 'nomina',
    base_cotizacion_quinquenios: 50,
    quinquenios_aplicado: tipo === 'prestaciones' ? 50 : null,
    base_cotizacion_quinquenios_d6: '50.000000',
    base_cotizacion_sueldo_d6: '500.000000',
    quinquenios_aplicado_d6: tipo === 'prestaciones' ? '50.000000' : null,
    sueldo_d6: '1000.000000',
    quinquenios_d6: '100.000000',
    otras_prestaciones_d6: '20.000000',
    sueldo_proporcional_d6: '500.000000',
    sueldo_base_d6: '560.000000',
    total_d6: totalD6
  };
}

function fund(tipo: 'ahorro' | 'vivienda' | 'prestaciones' | 'cair', total: string, components: Record<string, string>) {
  return {
    tipo,
    clave_organica_0: '04',
    clave_organica_1: '24',
    datos: [{ ...fundRow(tipo, `${total}0000`), ...Object.fromEntries(Object.keys(components).map((key) => [`${key}_d6`, `${components[key]}0000`])) }],
    resumen: {
      total_empleados: 1,
      total_contribucion: Number(total),
      total_sueldo_base: 560,
      total_contribucion_a2: total,
      total_sueldo_base_a2: '560.00',
      componentes_a2: components
    },
    precision_policy: 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3',
    formula_version_id: '30',
    fuente_datos: 'CALCULO_VIVO'
  };
}

const fondos = {
  clave_organica_0: '04',
  clave_organica_1: '24',
  ahorro: fund('ahorro', '13.00', { afaa: '6.00', afae: '7.00' }),
  vivienda: fund('vivienda', '9.01', { afe: '9.01' }),
  prestaciones: fund('prestaciones', '5.00', { afpa: '2.00', afpe: '3.00' }),
  cair: fund('cair', '1.01', { afe: '1.01' }),
  resumen_general: {
    total_empleados: 1,
    total_contribucion_general: 28.03,
    total_sueldo_base_general: 2240,
    total_contribucion_general_a2: '28.03',
    total_sueldo_base_general_a2: '2240.00',
    fondos_incluidos: ['ahorro', 'vivienda', 'prestaciones', 'cair']
  },
  precision_policy: 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3',
  formula_version_id: '30',
  nomina_carga_id: '20',
  fuente_datos: 'CALCULO_VIVO'
};
(fondos.vivienda.datos[0] as any).fh_d6 = '1.802000';
(fondos.vivienda.datos[0] as any).fv_d6 = '7.208000';

const guarderia = {
  titular_interno: 1, titular_nombre: '  María  López  ', titular_no_empleado: 'E1', titular_rfc: 'RFC1',
  recibo_total_d6: '1.111111', recibo_folio: 'F1', menor_id: 9,
  recibo_fecha_venc: new Date('2026-08-15T00:00:00.000Z')
};
const transitorio = { interno: 1, nombres: 'María  López', rfc: 'RFC1', cconcepto: 'C1', total_d6: '2.222222' };
const aguinaldo = { interno: 1, nombres: 'María  López', rfc: 'RFC1', movimiento: 'A', general_d6: '3.333333' };
const pcp = { interno: 1, nombre: 'María  López', rfc: 'RFC1', prestamo: 1, letra: 1, total_d6: '4.444444' };
const pmp = { interno: 1, nombre: 'María  López', rfc: 'RFC1', prestamo: 2, letra: 1, folio: 2, total_d6: '5.555555' };
const hip = { interno: 1, nombre: 'María  López', rfc: 'RFC1', pno_solicitud: 3, pano: 2026, cantidad_d6: '6.666666' };

const calls = new Map<string, number>();
const once = <T>(name: string, value: T) => async (..._args: unknown[]): Promise<T> => {
  calls.set(name, (calls.get(name) ?? 0) + 1);
  return value;
};
const repo = {
  obtenerAportacionesCompletas: once('fondos', fondos),
  obtenerFondosFai: once('fai', [{ interno: 1, rfc: 'RFC1', faiD6: '8.000000' }]),
  obtenerAportacionGuarderias: once('guarderias', [guarderia]),
  obtenerPensionNominaTransitorio: once('transitorio', [transitorio]),
  obtenerAguinaldo: once('aguinaldo', [aguinaldo]),
  obtenerPrestamos: once('pcp', [pcp, { ...pcp }]),
  obtenerPrestamosMedianoPlazo: once('pmp', [pmp]),
  obtenerPrestamosHipotecarios: async (...args: unknown[]) => {
    calls.set('hip', (calls.get('hip') ?? 0) + 1);
    assert.equal(args[3], true);
    return [hip];
  }
};

const capture = await new CaptureQnaTenDomainsQuery(repo as any).execute({
  entidadId: 1, anio: 2026, quincena: 15,
  organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  ambiente: 'DESARROLLO', usuarioId: '99'
});

for (const name of ['fondos','fai','guarderias','transitorio','aguinaldo','pcp','pmp','hip']) {
  assert.equal(calls.get(name), 1, `${name} debe consultarse una vez`);
}
assert.equal(capture.hipProcedure, 'AP_S_COMP_QNA');
assert.equal(capture.nominaCargaId, '20');
assert.equal(capture.auxiliares.GUARDERIAS.details[0].empleadoClave, '1');
assert.equal(capture.auxiliares.GUARDERIAS.details[0].nombre, 'María  López');
assert.equal(capture.auxiliares.GUARDERIAS.details[0].payloadCanonico.titular_nombre, 'María  López');
assert.equal(capture.fondos.AHORRO.rows[0].nombre, 'María  López');
assert.equal(capture.fondos.AHORRO.rows[0].faiD6, '8.000000');
assert.equal(capture.auxiliares.GUARDERIAS.details[0].payloadCanonico.recibo_fecha_venc, '2026-08-15T00:00:00.000Z');
assert.deepEqual(
  Object.keys(capture.auxiliares.GUARDERIAS.details[0].payloadCanonico),
  [...QNA_AUXILIARY_PAYLOAD_V1_FIELDS.GUARDERIAS]
);
assert.equal(capture.auxiliares.PCP.details.length, 2);
assert.equal(capture.auxiliares.PCP.details[0].claveFilaHash, capture.auxiliares.PCP.details[1].claveFilaHash);
assert.equal(capture.auxiliares.PCP.details[0].hashFila, capture.auxiliares.PCP.details[1].hashFila);
assert.notEqual(capture.auxiliares.PCP.details[0].orden, capture.auxiliares.PCP.details[1].orden);
assert.ok(Object.isFrozen(capture));
assert.ok(Object.isFrozen(capture.fondos.AHORRO.rows));
assert.ok(Object.isFrozen(capture.auxiliares.PCP.details[0]));

const officialV5 = new QnaOfficialSnapshotV5Factory().create(capture);
const employee = officialV5.candidate.detallesEmpleado![0];
assert.equal(officialV5.snapshotV2.versionEsquema, 5);
assert.equal(officialV5.candidate.versionEsquema, 5);
assert.equal(officialV5.snapshotV2.detalles[0].faiD6, '8.000000');
assert.equal(employee.nombre, 'María  López');
assert.equal(employee.guarderiasD6, '1.111111');
assert.equal(employee.retencionPcpD6, '8.888888');
assert.equal(employee.hashFila, calculateQnaEmployeeDetailHash(employee));
assert.notEqual(
  calculateQnaEmployeeDetailHash({ ...employee, nombre: 'Nombre alterado' }),
  employee.hashFila,
  'HashFila debe cubrir toda proyeccion de negocio V5'
);
const fundHashes = officialV5.candidate.fuentes.slice(0, 4).map((source) => source.hashFuente);
assert.equal(new Set(fundHashes).size, 4, 'cada fondo debe tener hash independiente');
assert.equal(officialV5.candidate.detalles[0].empleadoClave, '1');
assert.equal(officialV5.candidate.detalles[0].payloadVersion, 1);
validateQnaCandidate({ ...officialV5.candidate, snapshotCalculoV2Id: '10' });
const equivalentCapture = { ...capture, captureId: 'capture-semanticamente-equivalente', capturedAt: '2099-01-01T00:00:00.000Z' };
const equivalentV5 = new QnaOfficialSnapshotV5Factory().create(equivalentCapture);
assert.equal(calcularSnapshotCalculoV2Hash(officialV5.snapshotV2), calcularSnapshotCalculoV2Hash(equivalentV5.snapshotV2));
assert.equal(
  calculateQnaHash({ ...officialV5.candidate, snapshotCalculoV2Id: '10' }),
  calculateQnaHash({ ...equivalentV5.candidate, snapshotCalculoV2Id: '10' })
);
assert.deepEqual(
  officialV5.candidate.fuentes.map((source) => [source.dominio, source.identificadorFuente, source.hashFuente]),
  equivalentV5.candidate.fuentes.map((source) => [source.dominio, source.identificadorFuente, source.hashFuente])
);
const tamperedEmployee = { ...employee, guarderiasD6: '9.999999', hashFila: '' };
tamperedEmployee.hashFila = calculateQnaEmployeeDetailHash(tamperedEmployee);
assert.throws(
  () => validateQnaCandidate({ ...officialV5.candidate, snapshotCalculoV2Id: '10', detallesEmpleado: [tamperedEmployee] }),
  (error: unknown) => error instanceof LiquidacionQnaError && error.code === 'QNA_DETALLE_AUXILIAR_EMPLEADO_INCONSISTENTE'
);

for (const key of Object.keys(repo) as Array<keyof typeof repo>) {
  (repo as any)[key] = async () => { throw new Error('SOURCE_REREAD_FORBIDDEN'); };
}
assert.equal(capture.auxiliares.PCP.totalA2, '8.88');

const emptyRepo = { ...repo, obtenerPrestamosMedianoPlazo: async () => [] };
for (const key of Object.keys(emptyRepo) as Array<keyof typeof emptyRepo>) {
  if (key !== 'obtenerPrestamosMedianoPlazo') (emptyRepo as any)[key] = async (..._args: unknown[]) => (repoFixtures as any)[key];
}
const repoFixtures = {
  obtenerAportacionesCompletas: fondos,
  obtenerFondosFai: [{ interno: 1, rfc: 'RFC1', faiD6: '8.000000' }],
  obtenerAportacionGuarderias: [guarderia],
  obtenerPensionNominaTransitorio: [transitorio],
  obtenerAguinaldo: [aguinaldo],
  obtenerPrestamos: [pcp],
  obtenerPrestamosMedianoPlazo: [pmp],
  obtenerPrestamosHipotecarios: [hip]
};
const emptyCapture = await new CaptureQnaTenDomainsQuery(emptyRepo as any).execute({
  entidadId: 1, anio: 2026, quincena: 15,
  organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  ambiente: 'DESARROLLO', usuarioId: '99'
});
assert.equal(emptyCapture.auxiliares.PMP.source.estado, 'EMPTY');
assert.equal(emptyCapture.auxiliares.PMP.source.notApplicableAprobado, false);
const approvedEmpty = new QnaOfficialSnapshotV5Factory().create(emptyCapture, [{
  dominio: 'PMP', motivo: 'No aplica al periodo', evidencia: 'Acta administrativa 2026-15'
}]);
const approvedPmp = approvedEmpty.candidate.fuentes.find((source) => source.dominio === 'PMP')!;
assert.equal(approvedPmp.estado, 'NOT_APPLICABLE');
assert.equal(approvedPmp.aprobadoPor, '99');
assert.match(approvedPmp.evidencia!, /MOTIVO: No aplica al periodo/);
assert.throws(() => new QnaOfficialSnapshotV5Factory().create(capture, [{
  dominio: 'PMP', motivo: 'No aplica', evidencia: 'Acta'
}]), /QNA_NOT_APPLICABLE_FUENTE_NO_VACIA/);

const fixtureRepository = (fai: Array<{ interno: number; rfc: string; faiD6: string }>, pmpRows = [pmp]) => ({
  obtenerAportacionesCompletas: async () => fondos,
  obtenerFondosFai: async () => fai,
  obtenerAportacionGuarderias: async () => [guarderia],
  obtenerPensionNominaTransitorio: async () => [transitorio],
  obtenerAguinaldo: async () => [aguinaldo],
  obtenerPrestamos: async () => [pcp],
  obtenerPrestamosMedianoPlazo: async () => pmpRows,
  obtenerPrestamosHipotecarios: async () => [hip]
});
const captureInput = { entidadId: 1, anio: 2026, quincena: 15, organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  ambiente: 'DESARROLLO' as const, usuarioId: '99' };
await assert.rejects(
  new CaptureQnaTenDomainsQuery(fixtureRepository([
    { interno: 1, rfc: 'RFC1', faiD6: '8.000000' }, { interno: 1, rfc: 'OTRO', faiD6: '8.000000' }
  ]) as any).execute(captureInput),
  /QNA_CAPTURE_FAI_DUPLICADO/
);
await assert.rejects(
  new CaptureQnaTenDomainsQuery(fixtureRepository([]) as any).execute(captureInput),
  /QNA_CAPTURE_FAI_FALTANTE/
);
await assert.rejects(
  new CaptureQnaTenDomainsQuery(fixtureRepository([
    { interno: 1, rfc: 'RFC1', faiD6: '8.000000' }, { interno: 2, rfc: 'RFC2', faiD6: '1.000000' }
  ]) as any).execute(captureInput),
  /QNA_CAPTURE_FAI_EMPLEADOS_DIFERENTES/
);
const outsideFundCapture = await new CaptureQnaTenDomainsQuery(fixtureRepository(
  [{ interno: 1, rfc: 'RFC1', faiD6: '8.000000' }],
  [pmp, { ...pmp, interno: 2, rfc: 'RFC2', nombre: 'Persona fuera de fondos', prestamo: 22, total_d6: '1.000000' }]
) as any).execute(captureInput);
const outsideFundV5 = new QnaOfficialSnapshotV5Factory().create(outsideFundCapture);
assert.equal(outsideFundV5.candidate.detallesEmpleado!.length, 1);
assert.ok(outsideFundV5.candidate.detalles.some((detail) => detail.dominio === 'PMP' && detail.empleadoClave === '2'));
validateQnaCandidate({ ...outsideFundV5.candidate, snapshotCalculoV2Id: '10' });

console.log('LIQUIDACION_QNA_SINGLE_CAPTURE_TESTS_OK');
