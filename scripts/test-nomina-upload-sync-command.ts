import assert from 'node:assert/strict';
import { CargarNominaAplicacionQnalTxtCommand } from '../src/modules/nomina/application/commands/CargarNominaAplicacionQnalTxtCommand.js';
import { NominaTxtSyncError } from '../src/modules/nomina/domain/errors.js';

const content = Buffer.from(['0126007','2','SYN000001','SYNX000101T01','PERSONA SINTETICA','10.00','20.00','30.00','40.00','1000.00','','2000.00','0.00','0.00','20260415','0.00','50.25','0.00','0.00','0.00'].join('@'), 'latin1');
const input = { entidadId:1,anio:2026,quincena:12,organica0:'04',organica1:'24',organica2:'01',organica3:'01',archivoNombre:'sync.txt',archivoContenido:content,usuarioId:'test' };

async function run(outcome: 'COMMIT_CONFIRMADO' | 'ROLLBACK_CONFIRMADO') {
  const calls: string[] = [];
  const repo = {
    prepararSincronizacion: async () => { calls.push('preparar'); return { sincronizacionId:7,intentoUuid:'00000000-0000-4000-8000-000000000007' }; },
    iniciarSincronizacion: async () => { calls.push('claim'); },
    registrarResultadoFirebird: async () => { calls.push(`outcome:${outcome}`); },
    finalizarSincronizacion: async () => { calls.push('finalizar'); return { cargaId:9,estado:'ACEPTADA',totalRegistros:1,totalErrores:0,errores:[] }; },
    registrarCargaRechazada: async () => { throw new Error('unexpected'); },
  };
  const qna = { getQuincenaFromFirebird: async () => ({ anio:2026,quincena:12 }) };
  const firebird = { sincronizar: async () => ({ outcome, value: outcome === 'COMMIT_CONFIRMADO' ? { periodo:'0726',detallesEsperados:1,detallesP:1,resumenes:1,totales:{} } : undefined }) };
  const command = new CargarNominaAplicacionQnalTxtCommand(repo as never,qna as never,firebird as never);
  if (outcome === 'COMMIT_CONFIRMADO') assert.equal((await command.execute(input)).cargaId,9);
  else await assert.rejects(command.execute(input),(error: unknown) => error instanceof NominaTxtSyncError && error.statusCode === 503);
  return calls;
}

assert.deepEqual(await run('COMMIT_CONFIRMADO'),['preparar','claim','outcome:COMMIT_CONFIRMADO','finalizar']);
assert.deepEqual(await run('ROLLBACK_CONFIRMADO'),['preparar','claim','outcome:ROLLBACK_CONFIRMADO']);
console.log('NOMINA_UPLOAD_SYNC_COMMAND_OK');
