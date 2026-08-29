import assert from 'node:assert/strict';
import { CargarNominaAplicacionQnalTxtCommand } from '../src/modules/nomina/application/commands/CargarNominaAplicacionQnalTxtCommand.js';

const input = {
  entidadId: 1, anio: 2026, quincena: 12,
  organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  archivoNombre: 'sintetico.txt', usuarioId: 'test', archivoContenido: Buffer.alloc(0),
};
const line = (rfc: string, money = '10.00') => [
  '0126007', '2', 'SYN000001', rfc, 'PERSONA SINTETICA', money, '20.00', '30.00', '40.00',
  '1000.00', '', '2000.00', '0.00', '0.00', '20260415', '0.00', '50.25', '0.00', '0.00', '0.00'
].join('@');

async function execute(content: string) {
  let firebirdCalls = 0;
  let acceptedCalls = 0;
  let rejectedCalls = 0;
  const repository = {
    registrarCargaRechazada: async (_input: unknown, errores: unknown[], totalRegistros: number) => {
      rejectedCalls++;
      return { cargaId: 1, estado: 'RECHAZADA', totalRegistros, totalErrores: errores.length, errores };
    },
    reemplazarVigentes: async (_input: unknown, registros: unknown[]) => {
      acceptedCalls++;
      return { cargaId: 2, estado: 'ACEPTADA', totalRegistros: registros.length, totalErrores: 0, errores: [] };
    },
    prepararSincronizacion: async () => ({ sincronizacionId: 1, intentoUuid: '00000000-0000-4000-8000-000000000001' }),
    iniciarSincronizacion: async () => undefined,
    registrarResultadoFirebird: async () => undefined,
    finalizarSincronizacion: async () => {
      acceptedCalls++;
      return { cargaId: 2, estado: 'ACEPTADA', totalRegistros: 1, totalErrores: 0, errores: [] };
    },
  };
  const firebird = { getQuincenaFromFirebird: async () => { firebirdCalls++; return { anio: 2026, quincena: 12 }; } };
  const sync = { sincronizar: async () => ({ outcome: 'COMMIT_CONFIRMADO', value: { periodo: '0726', detallesEsperados: 1, detallesP: 1, resumenes: 1, totales: {} } }) };
  const command = new CargarNominaAplicacionQnalTxtCommand(repository as never, firebird as never, sync as never);
  const result = await command.execute({ ...input, archivoContenido: Buffer.from(content, 'latin1') });
  return { result, firebirdCalls, acceptedCalls, rejectedCalls };
}

let execution = await execute(line('SYNX000101T01', 'INVALIDO'));
assert.equal(execution.result.estado, 'RECHAZADA');
assert.equal(execution.firebirdCalls, 0);
assert.equal(execution.rejectedCalls, 1);

execution = await execute(`${line('SYNX000101T01')}\n${line(' synx000101t01 ')}`);
assert.equal(execution.result.estado, 'RECHAZADA');
assert.equal(execution.firebirdCalls, 0);

execution = await execute(line('SYNX000101T01'));
assert.equal(execution.result.estado, 'ACEPTADA');
assert.equal(execution.firebirdCalls, 1);
assert.equal(execution.acceptedCalls, 1);

console.log('NOMINA_UPLOAD_VALIDATION_OK');
