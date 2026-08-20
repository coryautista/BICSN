import assert from 'node:assert/strict';
import {
  SnapshotCalculoV2Factory,
  seleccionarCargaTxtSnapshotV2
} from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Factory.js';
import { calcularSnapshotCalculoV2Hash } from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Hasher.js';

const factory = new SnapshotCalculoV2Factory();
const base = {
  entidadId: 1,
  anio: 2026,
  quincena: 14,
  organica0: '04',
  organica1: '24',
  organica2: '01',
  organica3: '01',
  ambiente: 'CALIDAD' as const,
  formulaCalculoVersionId: '1',
  diasPolicy: { default: 15, min: 0, max: 15 },
  nominaCargaId: '20',
  usuarioId: 'phase4-test',
  ahorro: [
    { interno: 1, sueldo: 1000, quinquenios: 10, otras_prestaciones: 20, afae: 25.123456, afaa: 50.123456, total: 75.246912 },
    { interno: 2, sueldo: 2000, quinquenios: 0, otras_prestaciones: null, afae: 50.000009, afaa: 100.000009, total: 150.000018 }
  ],
  vivienda: [
    { interno: 1, sueldo: 1000, quinquenios: 10, otras_prestaciones: 20, afe: 17.555559 },
    { interno: 2, sueldo: 2000, quinquenios: 0, otras_prestaciones: null, afe: 35.111119 }
  ],
  prestaciones: [
    { interno: 1, sueldo: 1000, quinquenios: 10, otras_prestaciones: 20, afpe: 222.123456, afpa: 45.123456 },
    { interno: 2, sueldo: 2000, quinquenios: 0, otras_prestaciones: null, afpe: 444.000009, afpa: 90.000009 }
  ],
  cair: [
    { interno: 1, sueldo: 1000, quinquenios: 10, otras_prestaciones: 20, afe: 20.123456 },
    { interno: 2, sueldo: 2000, quinquenios: 0, otras_prestaciones: null, afe: 40.000009 }
  ],
  identidadesFai: [
    { interno: 1, rfc: 'RFCUNO010101', faiD6: '10.123456' },
    { interno: 2, rfc: 'RFCDOS020202', faiD6: '20.000009' }
  ],
  nomina: {
    tieneArchivo: true,
    registros: new Map([
      ['RFCUNO010101', { dias: 13, baseCotizacionSueldo: 433.33, baseCotizacionQuinquenios: 8.25 }]
    ])
  }
};

const snapshot = factory.crear(base);
assert.equal(snapshot.estado, 'COMPLETO');
assert.equal(snapshot.fuente, 'LIQUIDACION_V2');
assert.equal(snapshot.detalles.length, 2);
assert.equal(snapshot.detalles[0].diasLaborados, '13.00');
assert.equal(snapshot.detalles[0].diasOrigen, 'nomina');
assert.equal(snapshot.detalles[0].baseCotizacionSueldoD6, '433.330000');
assert.equal(snapshot.detalles[1].baseCotizacionSueldoD6, null);
assert.equal(snapshot.versionEsquema, 4);
assert.notEqual(
  calcularSnapshotCalculoV2Hash(snapshot),
  calcularSnapshotCalculoV2Hash({
    ...snapshot,
    detalles: snapshot.detalles.map((row, index) => index === 0
      ? { ...row, baseCotizacionSueldoD6: '433.340000' }
      : row)
  })
);
assert.equal(snapshot.detalles[0].fhD6, '3.511112');
assert.equal(snapshot.detalles[0].fvD6, '14.044447');
assert.equal(snapshot.detalles[1].diasLaborados, '0.00');
assert.equal(snapshot.detalles[1].diasOrigen, 'nomina_sin_coincidencia');
assert.equal(snapshot.totalesA2.FAT, '225.24');
assert.equal(snapshot.totalesA2.FAI, '30.12');
assert.match(snapshot.detalles[0].empleadoClaveHash, /^[0-9A-F]{64}$/);
assert.notEqual(snapshot.detalles[0].empleadoClaveHash, snapshot.detalles[1].empleadoClaveHash);

const snapshotExacto = factory.crear({
  ...base,
  ahorro: base.ahorro.map((row, index) => index === 0 ? {
    ...row,
    sueldo_d6: '1000.000001',
    afae_d6: '25.123455',
    afaa_d6: '50.123455',
    total_d6: '75.246910'
  } : row),
  vivienda: base.vivienda.map((row, index) => index === 0 ? {
    ...row,
    afe_d6: '17.555558',
    fh_d6: '3.511110',
    fv_d6: '14.044448'
  } : row),
  prestaciones: base.prestaciones.map((row, index) => index === 0 ? {
    ...row,
    afpe_d6: '222.123455',
    afpa_d6: '45.123455'
  } : row),
  cair: base.cair.map((row, index) => index === 0 ? { ...row, afe_d6: '20.123455' } : row)
});
assert.equal(snapshotExacto.detalles[0].sueldoMensualD6, '1000.000001');
assert.equal(snapshotExacto.detalles[0].fhD6, '3.511110');
assert.equal(snapshotExacto.detalles[0].fvD6, '14.044448');
assert.equal(snapshotExacto.detalles[0].freD6, '222.123455');
assert.equal(snapshotExacto.detalles[0].fraD6, '45.123455');
assert.equal(snapshotExacto.detalles[0].cairD6, '20.123455');
assert.equal(snapshotExacto.detalles[0].fatD6, '75.246910');

const snapshotFatPadre = factory.crear({
  ...base,
  ahorro: base.ahorro.map((row, index) => ({
    ...row,
    afaa_d6: index === 0 ? '0.009999' : '0.009999',
    afae_d6: index === 0 ? '0.009999' : '0.009999',
    total_d6: index === 0 ? '0.019998' : '0.019998'
  }))
});
assert.equal(snapshotFatPadre.totalesA2.FAA, '0.02');
assert.equal(snapshotFatPadre.totalesA2.FAE, '0.02');
assert.equal(snapshotFatPadre.totalesA2.FAT, '0.04');

const snapshotMovimiento = factory.crear({
  ...base,
  nominaCargaId: null,
  nomina: {
    tieneArchivo: false,
    fuente: 'movimiento',
    registros: new Map([['RFCUNO010101', { dias: 7, baseCotizacionQuinquenios: 3.5 }]])
  }
});
assert.equal(snapshotMovimiento.nominaCargaId, null);
assert.equal(snapshotMovimiento.detalles[0].diasLaborados, '7.00');
assert.equal(snapshotMovimiento.detalles[0].diasOrigen, 'movimiento');
assert.equal(snapshotMovimiento.detalles[1].diasLaborados, '15.00');
assert.equal(snapshotMovimiento.detalles[1].diasOrigen, 'default');

const snapshotDiasFormula = factory.crear({
  ...base,
  diasPolicy: { default: 14, min: 0, max: 15 },
  nominaCargaId: null,
  nomina: { tieneArchivo: false, fuente: 'default', registros: new Map() }
});
assert.ok(snapshotDiasFormula.detalles.every((row) => row.diasLaborados === '14.00'));

assert.throws(
  () => factory.crear({ ...base, vivienda: base.vivienda.slice(0, 1) }),
  /SNAPSHOT_V2_VIVIENDA_INCOMPLETO/
);
assert.throws(
  () => factory.crear({ ...base, cair: [...base.cair, base.cair[0]] }),
  /SNAPSHOT_V2_CAIR_INTERNO_INVALIDO/
);
assert.throws(
  () => factory.crear({
    ...base,
    nomina: {
      tieneArchivo: true,
      registros: new Map([['RFCUNO010101', { dias: 15.01, baseCotizacionSueldo: 500, baseCotizacionQuinquenios: null }]])
    }
  }),
  /DiasLaborados fuera de rango/
);

assert.deepEqual(seleccionarCargaTxtSnapshotV2([]), { carga: null, reason: 'SIN_TXT_VIGENTE' });
assert.deepEqual(seleccionarCargaTxtSnapshotV2([
  { CargaId: 1, EntidadId: 1, Organica2: '01', Organica3: '01' },
  { CargaId: 2, EntidadId: 1, Organica2: '02', Organica3: '01' }
]), { carga: null, reason: 'TXT_VIGENTE_AMBIGUO' });
assert.equal(seleccionarCargaTxtSnapshotV2([
  { CargaId: 20, EntidadId: 1, Organica2: '01', Organica3: '01' }
]).carga?.CargaId, 20);

console.log('APORTACIONES_PHASE4_TESTS_OK');
