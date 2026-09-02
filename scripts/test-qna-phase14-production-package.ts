import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [packager, deployTemplate] = await Promise.all([
  readFile(new URL('./package-production-deploy.ts', import.meta.url), 'utf8'),
  readFile(new URL('../deploy_bicsn.template.sh', import.meta.url), 'utf8')
]);

for (let migration = 9; migration <= 17; migration += 1) {
  assert.match(
    packager,
    new RegExp(`database/migrations/[^']+_${String(migration).padStart(2, '0')}_`),
    `El paquete de Produccion debe incluir la migracion ${migration}`
  );
}
assert.match(packager, /RELEASE-MANIFEST\.json/);
assert.match(packager, /qnaLegacyDualWriteEnabled:\s*true/);
assert.match(packager, /git', \['show', 'HEAD:Dockerfile'\]/);

const forcedEnabled = deployTemplate.match(/set_env_value QNA_LEGACY_DUAL_WRITE_ENABLED true/g) ?? [];
assert.equal(forcedEnabled.length, 2, 'Calidad y Produccion deben desplegar dual-write activo');
assert.doesNotMatch(deployTemplate, /set_env_value QNA_LEGACY_DUAL_WRITE_ENABLED false/);

console.log('QNA_PHASE14_PRODUCTION_PACKAGE_CONTRACTS_OK');
