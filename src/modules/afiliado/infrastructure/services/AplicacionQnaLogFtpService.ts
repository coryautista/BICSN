import { env } from '../../../../config/env.js';
import { ftpService } from '../../../../utils/ftp.js';

export interface AplicacionQnaLogPayload {
  proceso: 'APLIQNA';
  accion: 'APLICAR';
  resultado: 'OK' | 'ERROR' | 'PARCIAL';
  ambiente: {
    nodeEnv: string;
    sqlServerDb: string;
    firebirdDatabase: string;
    ftpBasePath: string;
  };
  solicitud: {
    org0: string;
    org1: string;
    periodo: string;
    idPeriodoFirebird?: number | null;
    quincenaNumero: number;
    anio: number;
    usuarioId: string;
  };
  ejecuciones: Record<string, unknown>;
  firebirdTransaction: 'NO_INICIADA' | 'COMMIT' | 'ROLLBACK';
  pasoFallido?: string | null;
  timestamps: {
    inicioUtc: string;
    finUtc: string;
  };
  mensaje: string;
  tiempoTotalMs: number;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function timestampForFile(date = new Date()): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function joinRemotePath(...segments: string[]): string {
  return segments
    .filter((segment) => segment.length > 0)
    .map((segment, index) => {
      const withoutTrailingSlash = segment.replace(/\/+$/g, '');
      return index === 0 ? withoutTrailingSlash : withoutTrailingSlash.replace(/^\/+/, '');
    })
    .join('/');
}

export function crearAplicacionQnaLogPayload(params: Omit<AplicacionQnaLogPayload, 'proceso' | 'accion' | 'ambiente'>): AplicacionQnaLogPayload {
  return {
    proceso: 'APLIQNA',
    accion: 'APLICAR',
    ambiente: {
      nodeEnv: env.nodeEnv,
      sqlServerDb: env.sql.database,
      firebirdDatabase: env.firebird.database,
      ftpBasePath: env.ftp.basePath
    },
    ...params
  };
}

export async function guardarAplicacionQnaLogFtp(payload: AplicacionQnaLogPayload): Promise<string> {
  const fileName = `APLIQNA_${payload.solicitud.org0}${payload.solicitud.org1}_${payload.solicitud.periodo}_${timestampForFile()}_${payload.resultado}.json`;
  const remotePath = joinRemotePath(env.ftp.basePath, 'APLIQNA', payload.solicitud.periodo, fileName);
  await ftpService.uploadText(`${JSON.stringify(payload, null, 2)}\n`, remotePath);
  return remotePath;
}
