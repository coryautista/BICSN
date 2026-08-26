import assert from 'node:assert/strict';
import { AportacionFondoRepository } from '../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js';

const repository = new AportacionFondoRepository({} as any);
const internal = repository as any;
const calls = { personal: 0, formula: 0, nomina: 0 };
const formula = {
  formulaCalculoVersionId: '30',
  claveFormula: 'APORTACIONES-NOMINA',
  anioVigencia: 2026,
  numeroVersion: 3,
  quincenaDesde: 1,
  quincenaHasta: 24,
  precisionPolicy: 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3',
  estado: 'ACTIVA',
  parametros: {
    DIAS_MES: '30', DIAS_DEFAULT_SIN_TXT: '15', DIAS_MIN: '0', DIAS_MAX: '15',
    CAIR_SUELDO: '0.01', FRA_SUELDO: '0.02', FRA_OTRAS: '0', FRA_QUINQUENIOS: '0',
    FRE_SUELDO: '0.03', FRE_OTRAS: '0.03', FRE_QUINQUENIOS: '0.03',
    FH_SUELDO: '0.004', FV_SUELDO: '0.016', FAA_SUELDO: '0.05', FAE_SUELDO: '0.025'
  },
  detalleParametros: []
};

internal.obtenerOrgPersonalConNombre = async (_org0: string, _org1: string, scope: unknown) => {
  calls.personal += 1;
  assert.deepEqual(scope, { entidadId: 1, organica2: '01', organica3: '01' });
  return [{
    interno: 1,
    rfc: 'RFC1',
    numero_empleado: 'E1',
    nombre: 'Nombre Uno',
    sueldo_decimal: '1000',
    otras_prestaciones_decimal: '20',
    quinquenios_decimal: '100'
  }];
};
internal.obtenerFormulaPeriodo = async () => {
  calls.formula += 1;
  return formula;
};
internal.obtenerDiasLaboradosNominaMap = async () => {
  calls.nomina += 1;
  return {
    tieneArchivo: true,
    fuente: 'txt',
    cargaId: '20',
    registros: new Map([['RFC1', {
      dias: 15,
      baseCotizacionSueldo: '500.00',
      baseCotizacionQuinquenios: '50.00'
    }]])
  };
};

const result = await repository.obtenerAportacionesCompletas(
  '04', '24', '1526', { entidadId: 1, organica2: '01', organica3: '01' }
);

assert.deepEqual(calls, { personal: 1, formula: 1, nomina: 1 });
assert.equal(result.nomina_carga_id, '20');
assert.equal(result.formula_version_id, '30');
assert.deepEqual(result.resumen_general.fondos_incluidos, ['ahorro', 'vivienda', 'prestaciones', 'cair']);
for (const fund of [result.ahorro, result.vivienda, result.prestaciones, result.cair]) {
  assert.equal(fund?.datos.length, 1);
  assert.equal(fund?.datos[0].rfc, 'RFC1');
  assert.equal(fund?.datos[0].numero_empleado, 'E1');
  assert.equal(fund?.datos[0].base_cotizacion_sueldo_d6, '500.000000');
}

console.log('APORTACIONES_SINGLE_FUND_SOURCE_TESTS_OK');
