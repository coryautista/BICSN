import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.ts', import.meta.url), 'utf8');
const replacement = source.slice(source.indexOf('async reemplazarVigentes'), source.indexOf('async prepararSincronizacion'));
assert.match(replacement, /TipoCarga IN \('TXT','MOVIMIENTO'\)/);
assert.equal((replacement.match(/TipoCarga IN \('TXT','MOVIMIENTO'\)/g) ?? []).length, 2);
assert(replacement.indexOf('INSERT INTO dbo.NominaAplicacionQnalDetalleHistorial') < replacement.indexOf('DELETE d'));
assert(replacement.indexOf('DELETE d') < replacement.indexOf('this.upsertDetalleTxt'));
console.log('NOMINA_TXT_REPLACEMENT_CONTRACTS_OK');
