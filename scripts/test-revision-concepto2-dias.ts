import assert from 'node:assert/strict';
import { RevisionAplicacionDiasFactory } from '../src/modules/aplicacionQuincenal/domain/services/RevisionAplicacionDiasFactory.js';

const factory = new RevisionAplicacionDiasFactory();
const row = {
  RFC: 'AURB031025SMA',
  SARE: 96.57,
  FRA: 217.28,
  FRE: 1074.34,
  FHE: 16.90,
  FVE: 67.60,
  FAA: 241.42,
  FAE: 120.71,
  FAI: 26
};

const sinTxt = factory.crear([row], { tieneArchivo: false, registros: new Map() });
assert.deepEqual(sinTxt, {
  registros: 1,
  registrosNomina: 0,
  registrosMovimiento: 0,
  registrosDefault: 1,
  CAIR: 96.57,
  FRA: 217.28,
  FRE: 1074.34,
  FH: 16.90,
  FV: 67.60,
  FAA: 241.42,
  FAE: 120.71,
  FAT: 362.13,
  FAI: 26
});

const conTxt = factory.crear([row], {
  tieneArchivo: true,
  registros: new Map([['AURB031025SMA', { dias: 13, baseCotizacionQuinquenios: null }]])
});
assert.deepEqual(conTxt, {
  registros: 1,
  registrosNomina: 1,
  registrosMovimiento: 0,
  registrosDefault: 0,
  CAIR: 83.69,
  FRA: 188.31,
  FRE: 931.09,
  FH: 14.65,
  FV: 58.59,
  FAA: 209.23,
  FAE: 104.62,
  FAT: 313.85,
  FAI: 26
});
assert.equal(conTxt.FAT, conTxt.FAA + conTxt.FAE);

const conMovimiento = factory.crear([row], {
  tieneArchivo: false,
  fuente: 'movimiento',
  registros: new Map([['AURB031025SMA', { dias: 13, baseCotizacionQuinquenios: null }]])
});
assert.equal(conMovimiento.registrosMovimiento, 1);
assert.equal(conMovimiento.registrosDefault, 0);
assert.equal(conMovimiento.FAT, 313.85);

const movimientoSinCoincidencia = factory.crear([row], {
  tieneArchivo: false,
  fuente: 'movimiento',
  registros: new Map()
});
assert.equal(movimientoSinCoincidencia.registrosDefault, 1);
assert.equal(movimientoSinCoincidencia.FAT, 362.13);

assert.throws(
  () => factory.crear([row], { tieneArchivo: true, registros: new Map() }),
  /REVISION_APLICACION_TXT_RFC_SIN_COINCIDENCIA/
);
assert.throws(
  () => factory.crear([row], {
    tieneArchivo: true,
    registros: new Map([['AURB031025SMA', { dias: null, baseCotizacionQuinquenios: null }]])
  }),
  /REVISION_APLICACION_TXT_DIAS_NULOS/
);
assert.throws(
  () => factory.crear([row], {
    tieneArchivo: true,
    registros: new Map([['AURB031025SMA', { dias: 16, baseCotizacionQuinquenios: null }]])
  }),
  /DiasLaborados fuera de rango/
);

console.log('REVISION_CONCEPTO2_DIAS_OK');
