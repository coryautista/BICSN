import { AsyncLocalStorage } from 'node:async_hooks';
import type { RolContexto } from './firebirdCatalog.js';

const firebirdRolContextoStorage = new AsyncLocalStorage<{ rolContexto: RolContexto }>();

export function firebirdRolContextoActual(): RolContexto | null {
  return firebirdRolContextoStorage.getStore()?.rolContexto ?? null;
}

export function runWithFirebirdRolContexto<T>(rolContexto: RolContexto, callback: () => T): T {
  return firebirdRolContextoStorage.run({ rolContexto }, callback);
}

export function resolveRolContextoUsuario(user: { entidades?: boolean[] } | null | undefined): RolContexto {
  return (user?.entidades ?? []).some(Boolean) ? 'ENTIDAD' : 'OPERATIVO';
}
