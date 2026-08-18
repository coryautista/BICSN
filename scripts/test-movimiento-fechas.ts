import assert from 'node:assert/strict';
import {
  calcularDiasLaboradosMovimiento,
  MOVIMIENTO_TIPO,
  resolverFechaEfectivaMovimiento,
  validarFechaMovimientoPeriodo
} from '../src/modules/afiliado/domain/services/MovimientoFechaPolicy.js';
import {
  CreateAfiliadoAfiliadoOrgMovimientoSchema,
  CreateBajaTerminaSuspensionYBajaSchema
} from '../src/modules/afiliado/afiliado.schemas.js';
import { NominaDiasLaboradosResolver } from '../src/modules/aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';
import { syncMovimientoNominaDiasLaborados } from '../src/modules/afiliado/infrastructure/services/MovimientoNominaDiasLaboradosService.js';

const ANIO = 2026;
const QUINCENA = 14; // 16 al 31 de julio

validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.ALTA, '2026-07-16', ANIO, QUINCENA);
validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.SUSPENSION, '2026-07-20', ANIO, QUINCENA);
validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.TERMINA_SUSPENSION, '2026-07-31', ANIO, QUINCENA);
validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.CAMBIO_SUELDO, '2026-07-25', ANIO, QUINCENA);
assert.throws(
  () => validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.ALTA, '2026-07-15', ANIO, QUINCENA),
  /MOVIMIENTO_FECHA_FUERA_QUINCENA/
);
assert.throws(
  () => validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.CAMBIO_SUELDO, '2026-08-01', ANIO, QUINCENA),
  /MOVIMIENTO_FECHA_FUERA_QUINCENA/
);

validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.BAJA_PERMANENTE, '2026-06-30', ANIO, QUINCENA);
validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.TERMINA_SUSPENSION_Y_BAJA, '2026-07-20', ANIO, QUINCENA);
assert.throws(
  () => validarFechaMovimientoPeriodo(MOVIMIENTO_TIPO.BAJA_PERMANENTE, '2026-08-01', ANIO, QUINCENA),
  /MOVIMIENTO_FECHA_BAJA_POSTERIOR_QUINCENA/
);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.ALTA, '2026-07-16', ANIO, QUINCENA), 15);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.ALTA, '2026-07-31', ANIO, QUINCENA), 1);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.BAJA_PERMANENTE, '2026-06-30', ANIO, QUINCENA), 0);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.BAJA_PERMANENTE, '2026-07-20', ANIO, QUINCENA), 5);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.TERMINA_SUSPENSION_Y_BAJA, '2026-07-31', ANIO, QUINCENA), 15);
assert.equal(calcularDiasLaboradosMovimiento(MOVIMIENTO_TIPO.CAMBIO_SUELDO, '2026-07-20', ANIO, QUINCENA), null);

assert.deepEqual(
  resolverFechaEfectivaMovimiento({ fechaMovimiento: '2026-07-20', fecha: '2026-07-21', createdAt: '2026-07-22T10:00:00Z' }),
  { valor: '2026-07-20', fuente: 'fechaMovimiento' }
);
assert.deepEqual(
  resolverFechaEfectivaMovimiento({ fecha: '2026-07-21', createdAt: '2026-07-22T10:00:00Z' }),
  { valor: '2026-07-21', fuente: 'fecha' }
);
assert.deepEqual(
  resolverFechaEfectivaMovimiento({ createdAt: '2026-07-22T10:00:00Z' }),
  { valor: '2026-07-22T10:00:00Z', fuente: 'createdAt' }
);

assert.equal(CreateAfiliadoAfiliadoOrgMovimientoSchema.safeParse({}).success, false);
assert.equal(CreateAfiliadoAfiliadoOrgMovimientoSchema.safeParse({ fechaMovimiento: '2026-07-20' }).success, true);
assert.equal(CreateBajaTerminaSuspensionYBajaSchema.safeParse({ interno: 1 }).success, false);
assert.equal(CreateBajaTerminaSuspensionYBajaSchema.safeParse({ interno: 1, fechaMovimiento: '2026-06-30' }).success, true);

const resolver = new NominaDiasLaboradosResolver();
const detalle13 = new Map([['RFC1', { dias: 13, baseCotizacionQuinquenios: null }]]);
assert.equal(resolver.resolve('RFC1', { tieneArchivo: true, fuente: 'txt', registros: detalle13 }, true).dias, 13);
assert.equal(resolver.resolve('RFC2', { tieneArchivo: true, fuente: 'txt', registros: detalle13 }, true).dias, 0);
assert.deepEqual(
  resolver.resolve('RFC1', { tieneArchivo: false, fuente: 'movimiento', registros: detalle13 }, true),
  { dias: 13, origen: 'movimiento', baseCotizacionQuinquenios: null }
);
assert.equal(resolver.resolve('RFC2', { tieneArchivo: false, fuente: 'movimiento', registros: detalle13 }, true).dias, 15);
assert.equal(resolver.resolve('RFC1', { tieneArchivo: false, fuente: 'default', registros: new Map() }, true).dias, 15);

const executorConflicto = {
  request() {
    return {
      input() { return this; },
      async query() { return { recordset: [{ Id: 10, CargaId: 20, Movimiento: 'AL' }] }; }
    };
  }
};
await assert.rejects(
  syncMovimientoNominaDiasLaborados({
    executor: executorConflicto as any,
    tipoMovimientoId: MOVIMIENTO_TIPO.BAJA_PERMANENTE,
    quincenaId: '2026-14',
    fechaMovimiento: '2026-07-20',
    afiliado: {
      id: 1,
      rfc: 'RFC1',
      nombre: 'PRUEBA',
      apellidoPaterno: null,
      apellidoMaterno: null,
      noEmpleado: null,
      interno: 1,
      quincenaAplicacion: QUINCENA,
      anioAplicacion: ANIO
    },
    afiliadoOrg: {
      claveOrganica0: '04',
      claveOrganica1: '24',
      claveOrganica2: '01',
      claveOrganica3: '01',
      sueldo: 10000,
      quinquenios: 0
    }
  }),
  /MOVIMIENTO_NOMINA_CONFLICTO_ALTA_BAJA/
);

console.log('MOVIMIENTO_FECHAS_OK');
