import { env } from '../../../../../config/env.js';
import { ftpService } from '../../../../../utils/ftp.js';
import { ResultadoConceptoRevision, RevisionTarea } from '../../domain/Revision.types.js';

export interface RevisionLogPayload {
  proceso: 'REVISA';
  resultado: 'OK' | 'ERROR';
  tarea: RevisionTarea;
  conceptos: ResultadoConceptoRevision[];
  timestamps: { inicioUtc: string; finUtc: string };
  tiempoTotalMs: number;
  ambiente: { nodeEnv: string; sqlServerDb: string; firebirdDatabase: string };
  error?: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function timestampForFile(date = new Date()): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function guardarRevisionLogFtp(
  tarea: RevisionTarea,
  conceptos: ResultadoConceptoRevision[],
  inicioUtc: string,
  tiempoTotalMs: number,
  resultado: 'OK' | 'ERROR' = 'OK',
  error?: string
): Promise<string> {
  const fileName = `REVISA_${tarea.idRevisionTarea}_I${tarea.intentos}_${tarea.org0}${tarea.org1}${tarea.org2}${tarea.org3}_${tarea.periodo}_${timestampForFile()}_${Date.now()}_${resultado}.json`;
  const remotePath = `${env.ftp.basePath.replace(/\/+$/, '')}/REVISA/${tarea.periodo}/${fileName}`;
  const payload: RevisionLogPayload = {
    proceso: 'REVISA',
    resultado,
    tarea,
    conceptos,
    timestamps: { inicioUtc, finUtc: new Date().toISOString() },
    tiempoTotalMs,
    ambiente: {
      nodeEnv: env.nodeEnv,
      sqlServerDb: env.sql.database,
      firebirdDatabase: env.firebird.database
    },
    error
  };
  await ftpService.uploadText(`${JSON.stringify(payload, null, 2)}\n`, remotePath);
  return remotePath;
}

export interface RevisionLogFtpOpcionalResultado {
  ruta: string | null;
  advertencia: string | null;
}

export async function guardarRevisionLogFtpOpcional(
  tarea: RevisionTarea,
  conceptos: ResultadoConceptoRevision[],
  inicioUtc: string,
  tiempoTotalMs: number,
  guardar: typeof guardarRevisionLogFtp = guardarRevisionLogFtp
): Promise<RevisionLogFtpOpcionalResultado> {
  try {
    return {
      ruta: await guardar(tarea, conceptos, inicioUtc, tiempoTotalMs),
      advertencia: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ruta: null,
      advertencia: `FTP_OPCIONAL_NO_DISPONIBLE: ${message}`.slice(0, 2000)
    };
  }
}
