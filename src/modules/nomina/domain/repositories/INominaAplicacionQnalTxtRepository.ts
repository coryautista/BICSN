import {
  NominaAplicacionQnalQueryFilters,
  NominaAplicacionQnalQueryResult,
  NominaAplicacionQnalCargaVigente,
  NominaAplicacionQnalRegistroParsed,
  NominaAplicacionQnalScope,
  NominaAplicacionQnalUploadInput,
  NominaAplicacionQnalUploadResult,
  NominaAplicacionQnalSyncPrepared
} from '../entities/NominaAplicacionQnalTxt.js';
import type { FirebirdTransactionOutcome } from '../../../../db/firebird.js';
import type { NominaLayout20FirebirdSyncEvidence } from '../services/NominaLayout20FirebirdSync.js';

export interface INominaAplicacionQnalTxtRepository {
  registrarCargaRechazada(
    input: NominaAplicacionQnalUploadInput,
    errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>,
    totalRegistros: number
  ): Promise<NominaAplicacionQnalUploadResult>;

  reemplazarVigentes(
    input: NominaAplicacionQnalUploadInput,
    registros: NominaAplicacionQnalRegistroParsed[]
  ): Promise<NominaAplicacionQnalUploadResult>;

  prepararSincronizacion(input: NominaAplicacionQnalUploadInput, registros: NominaAplicacionQnalRegistroParsed[], archivoHash: string, intentoUuid: string): Promise<NominaAplicacionQnalSyncPrepared>;
  iniciarSincronizacion(sincronizacionId: number, intentoUuid: string, claimToken: string): Promise<void>;
  registrarResultadoFirebird(sincronizacionId: number, intentoUuid: string, claimToken: string, outcome: FirebirdTransactionOutcome, evidence?: NominaLayout20FirebirdSyncEvidence, error?: unknown): Promise<void>;
  finalizarSincronizacion(sincronizacionId: number, intentoUuid: string): Promise<NominaAplicacionQnalUploadResult>;

  consultarRegistros(filters: NominaAplicacionQnalQueryFilters): Promise<NominaAplicacionQnalQueryResult>;
  consultarCargaVigente(scope: NominaAplicacionQnalScope): Promise<NominaAplicacionQnalCargaVigente | null>;
}
