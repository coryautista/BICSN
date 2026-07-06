import { FastifyInstance } from 'fastify';
import { mkdir, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { requireAuth } from '../auth/auth.middleware.js';
import { ok } from '../../utils/http.js';
import { ftpService } from '../../utils/ftp.js';
import { env } from '../../config/env.js';

const MAX_TEXT_LENGTH = 500;
const MAX_BODY_BYTES = 20 * 1024;
const PASOS_PERMITIDOS = new Set([
  'obtenerQuincena',
  'aplicarC',
  'aplicarF',
  'envioLayout',
  'actualizarBitacora',
]);

type EjecucionSeguimiento = {
  exito?: boolean;
  duracionMs?: number;
  error?: unknown;
};

type SeguimientoPayload = {
  quincena?: unknown;
  anio?: unknown;
  resultado?: unknown;
  mensaje?: unknown;
  ejecuciones?: Record<string, EjecucionSeguimiento>;
};

function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeFilePart(value: unknown) {
  const text = sanitizeText(value, 40).replace(/[^a-zA-Z0-9_-]/g, '');
  return text || 'sin_dato';
}

function joinRemotePath(...segments: string[]) {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      const clean = segment.replace(/\/+$/g, '');
      return index === 0 ? clean : clean.replace(/^\/+/, '');
    })
    .join('/');
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildTxt(payload: SeguimientoPayload) {
  const ejecuciones = payload.ejecuciones && typeof payload.ejecuciones === 'object' ? payload.ejecuciones : {};
  const lines = [
    'Seguimiento de Aplicacion de Quincenas',
    `Fecha: ${formatDateTime(new Date())}`,
    `Quincena: ${sanitizeText(payload.quincena, 20)}`,
    `Anio: ${sanitizeText(payload.anio, 20)}`,
    `Resultado: ${sanitizeText(payload.resultado, 80)}`,
    `Mensaje: ${sanitizeText(payload.mensaje)}`,
    '',
    'Ejecuciones:',
  ];

  Object.entries(ejecuciones)
    .filter(([paso]) => PASOS_PERMITIDOS.has(paso))
    .forEach(([paso, ejecucion]) => {
      const estado = ejecucion?.exito ? 'Exito' : 'Error';
      const duracion = Number.isFinite(Number(ejecucion?.duracionMs)) ? Number(ejecucion?.duracionMs) : 0;
      const error = sanitizeText(ejecucion?.error);
      lines.push(`- ${paso}: ${estado} | Duracion: ${duracion} ms | Error: ${error || 'N/A'}`);
    });

  if (lines[lines.length - 1] === 'Ejecuciones:') {
    lines.push('- Sin ejecuciones reportadas');
  }

  return `${lines.join('\n')}\n`;
}

export default async function seguimientoAplicacionRoutes(app: FastifyInstance) {
  app.post('/seguimiento-aplicacion-quincenal', {
    preHandler: [requireAuth],
    schema: {
      description: 'Guarda seguimiento tecnico de aplicacion quincenal en SFTP',
      tags: ['seguimiento-aplicacion'],
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    let localFilePath: string | null = null;

    try {
      const contentLength = Number(req.headers['content-length'] ?? 0);
      if (contentLength > MAX_BODY_BYTES) {
        return reply.send(ok({ guardado: false }));
      }

      const payload = req.body as SeguimientoPayload;
      const safeQuincena = sanitizeFilePart(payload?.quincena);
      const safeAnio = sanitizeFilePart(payload?.anio);
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const fileName = `seguimiento_aplicacion_quincena_${safeQuincena}_${safeAnio}_${timestamp}.txt`;
      const tempDir = path.join(os.tmpdir(), 'seguimiento-aplicacion-quincenal');
      localFilePath = path.join(tempDir, fileName);
      const remoteFilePath = joinRemotePath(
        env.ftp.basePath,
        'seguimiento',
        'aplicacion-quincenal',
        fileName,
      );

      await mkdir(tempDir, { recursive: true });
      await writeFile(localFilePath, buildTxt(payload), { encoding: 'utf8', flag: 'wx' });
      req.log.info(
        { remoteFilePath, quincena: safeQuincena, anio: safeAnio },
        'Guardando seguimiento de aplicacion quincenal en SFTP',
      );
      await ftpService.uploadFile(localFilePath, remoteFilePath);

      return reply.send(ok({ guardado: true }));
    } catch (error) {
      req.log.error({ err: error }, 'No se pudo guardar seguimiento de aplicacion quincenal en SFTP');
      return reply.send(ok({ guardado: false }));
    } finally {
      if (localFilePath) {
        await rm(localFilePath, { force: true }).catch(() => undefined);
      }
    }
  });
}
