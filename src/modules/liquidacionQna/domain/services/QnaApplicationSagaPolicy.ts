import type { QnaProcessState } from '../entities/LiquidacionQna.js';
import { qnaFail } from '../errors.js';

export type QnaApplicationAction = 'EJECUTAR_FIREBIRD' | 'REANUDAR_SQL' | 'RESOLUCION_MANUAL' | 'TERMINADA';
export type QnaManualResolution = 'CONFIRMADA' | 'REVERTIDA';
export type QnaApplicationClaimType = 'FIREBIRD' | 'RECUPERACION';

export const MIN_QNA_APPLICATION_LEASE_MS = 15 * 60_000;
export const DEFAULT_QNA_APPLICATION_LEASE_MS = 30 * 60_000;
export const DEFAULT_QNA_APPLICATION_HEARTBEAT_MS = 60_000;

export function qnaApplicationRuntimeConfig(): {leaseMs:number;heartbeatMs:number} {
  const configured = process.env.QNA_APPLICATION_LEASE_MS;
  const leaseMs = configured === undefined ? DEFAULT_QNA_APPLICATION_LEASE_MS : Number(configured);
  if (!Number.isInteger(leaseMs) || leaseMs < MIN_QNA_APPLICATION_LEASE_MS) {
    qnaFail('Configuracion de lease QNA invalida', 'QNA_APLICACION_CONFIG_INVALIDA', 500);
  }
  const heartbeatConfigured = process.env.QNA_APPLICATION_HEARTBEAT_MS;
  const heartbeatMs = heartbeatConfigured === undefined ? DEFAULT_QNA_APPLICATION_HEARTBEAT_MS : Number(heartbeatConfigured);
  if (!Number.isInteger(heartbeatMs) || heartbeatMs < 10_000 || heartbeatMs > Math.floor(leaseMs / 3)) {
    qnaFail('Configuracion de heartbeat QNA invalida', 'QNA_APLICACION_CONFIG_INVALIDA', 500);
  }
  return {leaseMs,heartbeatMs};
}

export function qnaApplicationLeaseMs(): number {return qnaApplicationRuntimeConfig().leaseMs;}
export function qnaApplicationHeartbeatMs(): number {return qnaApplicationRuntimeConfig().heartbeatMs;}

export function decideQnaApplicationAction(state: QnaProcessState): QnaApplicationAction {
  switch (state) {
    case 'OFICIAL':
    case 'FIREBIRD_REVERTIDO':
      return 'EJECUTAR_FIREBIRD';
    case 'APLICANDO_FIREBIRD':
    case 'APLICACION_INCIERTA':
      return 'RESOLUCION_MANUAL';
    case 'FIREBIRD_CONFIRMADO':
    case 'LINEA_CONFIRMADA':
    case 'REVISA_PROGRAMADA':
      return 'REANUDAR_SQL';
    case 'TERMINADO':
      return 'TERMINADA';
  }
}

export function manualResolutionDestination(resolution: QnaManualResolution): Extract<QnaProcessState, 'FIREBIRD_CONFIRMADO' | 'FIREBIRD_REVERTIDO'> {
  return resolution === 'CONFIRMADA' ? 'FIREBIRD_CONFIRMADO' : 'FIREBIRD_REVERTIDO';
}

export function assertManualResolutionAllowed(state: QnaProcessState): void {
  if (state !== 'APLICANDO_FIREBIRD' && state !== 'APLICACION_INCIERTA') {
    qnaFail('El estado actual no admite resolucion manual de Firebird', 'QNA_RESOLUCION_MANUAL_CONFLICTO', 409);
  }
}
