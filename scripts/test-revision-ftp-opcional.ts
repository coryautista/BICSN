import assert from 'node:assert/strict';
import { guardarRevisionLogFtpOpcional } from '../src/modules/reportes/revision/infrastructure/services/RevisionLogFtpService.js';

const tarea = {
  idRevisionTarea: 2,
  org0: '04',
  org1: '24',
  org2: '01',
  org3: '01',
  periodo: '1426',
  usuarioId: 'test',
  intentos: 1,
  claimToken: 'test'
};

const disponible = await guardarRevisionLogFtpOpcional(
  tarea,
  [],
  new Date().toISOString(),
  1,
  async () => '/Autodeterminacion/Calidad/REVISA/1426/reporte.json'
);
assert.deepEqual(disponible, {
  ruta: '/Autodeterminacion/Calidad/REVISA/1426/reporte.json',
  advertencia: null
});

const noDisponible = await guardarRevisionLogFtpOpcional(
  tarea,
  [],
  new Date().toISOString(),
  1,
  async () => { throw new Error('EHOSTUNREACH 10.20.1.17:22'); }
);
assert.equal(noDisponible.ruta, null);
assert.equal(noDisponible.advertencia, 'FTP_OPCIONAL_NO_DISPONIBLE: EHOSTUNREACH 10.20.1.17:22');

console.log('REVISION_FTP_OPCIONAL_OK');
