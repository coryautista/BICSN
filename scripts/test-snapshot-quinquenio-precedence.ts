import assert from 'node:assert/strict';
import {
  SnapshotCalculoV2Factory,
  type SnapshotCalculoV2FactoryInput
} from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Factory.js';

const factory = new SnapshotCalculoV2Factory();

function crearInput(options: {
  quinqueniosAplicadoD6?: string | null;
  quinqueniosD6?: string;
  baseCotizacionQuinquenios?: string | null;
  cargaCongelada?: boolean;
}): SnapshotCalculoV2FactoryInput {
  const cargaCongelada = options.cargaCongelada ?? true;
  return {
    entidadId: 1,
    anio: 2026,
    quincena: 14,
    organica0: '04',
    organica1: '24',
    organica2: '01',
    organica3: '01',
    ambiente: 'DESARROLLO',
    formulaCalculoVersionId: '1',
    diasPolicy: { default: 15, min: 0, max: 15 },
    nominaCargaId: cargaCongelada ? '20' : null,
    usuarioId: 'quinquenio-precedence-test',
    ahorro: [{ interno: 1, sueldo: 1000, quinquenios: 10, afae: 25, afaa: 50, total: 75 }],
    vivienda: [{ interno: 1, sueldo: 1000, quinquenios: 10, afe: 20 }],
    prestaciones: [{
      interno: 1,
      sueldo: 1000,
      quinquenios: 10,
      quinquenios_d6: options.quinqueniosD6,
      quinquenios_aplicado_d6: options.quinqueniosAplicadoD6,
      afpe: 100,
      afpa: 20
    }],
    cair: [{ interno: 1, sueldo: 1000, quinquenios: 10, afe: 15 }],
    identidadesFai: [{ interno: 1, rfc: 'RFCUNO010101', faiD6: '10.000000' }],
    nomina: cargaCongelada
      ? {
          tieneArchivo: true,
          fuente: 'txt',
          registros: new Map([['RFCUNO010101', {
            dias: 15,
            baseCotizacionSueldo: '500.00',
            baseCotizacionQuinquenios: options.baseCotizacionQuinquenios ?? null
          }]])
        }
      : { tieneArchivo: false, fuente: 'default', registros: new Map() }
  };
}

const detalle = (input: SnapshotCalculoV2FactoryInput) => factory.crear(input).detalles[0];

assert.equal(detalle(crearInput({
  quinqueniosAplicadoD6: '7.125555',
  quinqueniosD6: '10.111111',
  baseCotizacionQuinquenios: '8.25'
})).baseCotizacionQuinqueniosD6, '7.125555');

assert.equal(detalle(crearInput({
  quinqueniosD6: '10.111111',
  baseCotizacionQuinquenios: '8.25'
})).baseCotizacionQuinqueniosD6, '5.055556');

assert.equal(detalle(crearInput({
  baseCotizacionQuinquenios: '8.255'
})).baseCotizacionQuinqueniosD6, '8.255000');

assert.equal(detalle(crearInput({
  baseCotizacionQuinquenios: '8.25',
  cargaCongelada: false
})).baseCotizacionQuinqueniosD6, null);

assert.equal(detalle(crearInput({
  quinqueniosAplicadoD6: '0.000000',
  quinqueniosD6: '10.000000',
  baseCotizacionQuinquenios: '8.25'
})).baseCotizacionQuinqueniosD6, '0.000000');

console.log('SNAPSHOT_QUINQUENIO_PRECEDENCE_TESTS_OK');
