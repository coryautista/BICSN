import type { FirebirdTransactionExecution } from '../../../../db/firebird.js';
import type { NominaAplicacionQnalRegistroParsed } from '../entities/NominaAplicacionQnalTxt.js';

export interface NominaLayout20FirebirdScope {
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
}

export interface NominaLayout20FirebirdSyncInput {
  scope: NominaLayout20FirebirdScope;
  registros: NominaAplicacionQnalRegistroParsed[];
}

export interface NominaLayout20FirebirdSyncEvidence {
  periodo: string;
  detallesEsperados: number;
  detallesP: number;
  resumenes: 1;
  totales: Record<string, number>;
}

export type NominaLayout20FirebirdSyncExecution = FirebirdTransactionExecution<NominaLayout20FirebirdSyncEvidence>;

export class NominaLayout20FirebirdSyncError extends Error {
  constructor(public readonly code: string, message = code) {
    super(message);
    this.name = 'NominaLayout20FirebirdSyncError';
  }
}
