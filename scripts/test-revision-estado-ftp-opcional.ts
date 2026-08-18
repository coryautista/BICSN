import assert from 'node:assert/strict';
import { resolverEstatusReporteRevision } from '../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js';

assert.equal(
  resolverEstatusReporteRevision(
    'ERROR',
    'Failed to upload text to FTP: Error: getConnection: connect EHOSTUNREACH 10.20.1.17:22',
    9
  ),
  'COMPLETADA'
);
assert.equal(
  resolverEstatusReporteRevision('ERROR', 'FTP_OPCIONAL_NO_DISPONIBLE: EHOSTUNREACH', 9),
  'COMPLETADA'
);
assert.equal(
  resolverEstatusReporteRevision('ERROR', 'FIREBIRD_QUERY_ERROR', 9),
  'ERROR'
);
assert.equal(
  resolverEstatusReporteRevision('ERROR', 'Failed to upload text to FTP', 0),
  'ERROR'
);
assert.equal(resolverEstatusReporteRevision('COMPLETADA', null, 9), 'COMPLETADA');
assert.equal(resolverEstatusReporteRevision('PENDIENTE', null, 0), 'PENDIENTE');

console.log('REVISION_ESTADO_FTP_OPCIONAL_OK');
