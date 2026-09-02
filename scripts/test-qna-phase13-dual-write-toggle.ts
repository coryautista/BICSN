import assert from 'node:assert/strict';
import {
  assertQnaLegacyDualWriteConfiguration,
  env,
  parseQnaLegacyDualWriteEnabled
} from '../src/config/env.js';
import { LiquidacionQnaRepository } from '../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js';
import { checkQnaLegacyDualWrite } from '../src/utils/health.js';

assert.equal(parseQnaLegacyDualWriteEnabled(undefined), true);
assert.equal(parseQnaLegacyDualWriteEnabled(' true '), true);
assert.equal(parseQnaLegacyDualWriteEnabled('FALSE'), false);
assert.throws(
  () => parseQnaLegacyDualWriteEnabled('0'),
  /QNA_LEGACY_DUAL_WRITE_ENABLED_INVALIDO/
);
assert.doesNotThrow(() => assertQnaLegacyDualWriteConfiguration(false, 'SII-ISSSSPEA-DES', undefined));
assert.doesNotThrow(() => assertQnaLegacyDualWriteConfiguration(true, 'SII-ISSSSPEA-PROD', undefined));
assert.doesNotThrow(() => assertQnaLegacyDualWriteConfiguration(false, 'SII-ISSSSPEA', 'SII-ISSSSPEA'));
assert.throws(
  () => assertQnaLegacyDualWriteConfiguration(false, 'SII-ISSSSPEA-PROD', undefined),
  /QNA_LEGACY_DUAL_WRITE_DISABLE_CONFIRMATION_REQUIRED:SII-ISSSSPEA-PROD/
);

const previous = env.qna.legacyDualWriteEnabled;
env.qna.legacyDualWriteEnabled = false;
try {
  assert.deepEqual(checkQnaLegacyDualWrite().details, {
    enabled: false,
    policy: 'QNA-LEGACY-DUAL-WRITE-V1'
  });
  assert.equal(checkQnaLegacyDualWrite().status, 'degraded');
  const repository = new LiquidacionQnaRepository({} as never) as any;
  assert.deepEqual(
    await repository.projectV5Legacy({}, '1', 5, 'phase13-test'),
    { status: 'DISABLED', details: ['QNA_LEGACY_DUAL_WRITE_DISABLED'] }
  );
  assert.deepEqual(
    await repository.projectV5Legacy({}, '1', 4, 'phase13-test'),
    { status: undefined, details: [] }
  );
} finally {
  env.qna.legacyDualWriteEnabled = previous;
}

console.log('QNA_PHASE13_DUAL_WRITE_TOGGLE_OK');
