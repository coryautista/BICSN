import {
  findDocumentTypeById,
  findDocumentTypeByCode,
  listDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  findExpedienteByCurp,
  listExpedientes,
  createExpediente,
  updateExpediente,
  deleteExpediente,
  findExpedienteArchivoById,
  findExpedienteArchivoByCurpAndSha256,
  listExpedienteArchivosByCurp,
  createExpedienteArchivo,
  updateExpedienteArchivo,
  deleteExpedienteArchivo
} from './expediente.repo.js';
import { ftpService } from '../../utils/ftp.js';
import fs from 'fs';
import path from 'path';
import * as mime from 'mime-types';
import pino from 'pino';

const logger = pino({
  name: 'expediente-service',
  level: process.env.LOG_LEVEL || 'info'
});

// Legacy service functions have been migrated to use DI pattern
// Routes now use Commands and Queries directly via app.diContainer.resolve()
// This file can be removed in the future if no legacy code depends on it

// Additional FTP-related services (kept for utility functions)
export async function uploadExpedienteFile(curp: string, localFilePath: string, originalFileName: string, titulo: string, tipoCodigo?: string | null, observaciones?: string | null, documentTypeId?: number | null, userId?: string, tx?: any) {
  // Verify expediente exists
  await getExpedienteByCurp(curp);

  // If documentTypeId is provided, verify it exists
  if (documentTypeId) {
    await getDocumentTypeById(documentTypeId);
  }

  // Generate hash
  const sha256Hex = await ftpService.generateFileHash(localFilePath);

  // Check if file with same hash already exists for this CURP (without creating temporary record)
  const existingFile = await findExpedienteArchivoByCurpAndSha256(curp, sha256Hex);
  if (existingFile) {
    throw new Error('EXPEDIENTE_ARCHIVO_HASH_EXISTS');
  }

  // Get file stats
  const stats = fs.statSync(localFilePath);
  const mimeType = mime.lookup(originalFileName) || 'application/octet-stream';

  // Generate storage path
  const storagePath = ftpService.generateExpedientePath(curp, originalFileName);

  // Upload to FTP
  await ftpService.uploadFile(localFilePath, storagePath);

  // Create database record
  return await createExpedienteArchivo(
    curp,
    tipoCodigo || null,
    titulo,
    originalFileName,
    mimeType,
    stats.size,
    sha256Hex,
    'FTP',
    storagePath,
    observaciones || null,
    documentTypeId || null,
    userId,
    tx
  );
}

export async function downloadExpedienteFile(archivoId: number, localDownloadPath: string) {
  const archivo = await getExpedienteArchivoById(archivoId);

  if (archivo.storageProvider !== 'FTP') {
    throw new Error('UNSUPPORTED_STORAGE_PROVIDER');
  }

  await ftpService.downloadFile(archivo.storagePath, localDownloadPath);
  return archivo;
}

// Upload document to expediente (only document upload, no affectation)
export async function uploadDocumentToExpediente(
  curp: string,
  fileData: any,
  titulo: string,
  userId: string | undefined,
  tipoCodigo?: string,
  observaciones?: string,
  documentTypeId?: number,
  tx?: any
) {
  const logContext = {
    curp,
    fileName: fileData.filename,
    userId,
    tipoCodigo,
    documentTypeId
  };

  logger.info(logContext, 'Iniciando carga de documento a expediente');

  try {
    logger.debug(logContext, 'Verificando existencia de expediente');

    // 1. Check if expediente exists, if not create it
    // Use transaction-aware query to avoid deadlocks
    let expediente;
    let expedienteCreated = false;
    try {
      // Query within transaction to avoid deadlocks
      const { sql: sqlType } = await import('../../db/context.js');
      const { sql, getPool } = await import('../../db/mssql.js');
      const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
      const r = await req
        .input('curp', sql.Char(18), curp)
        .query(`
          SELECT CURP, AfiliadoId, Interno, Estado, Notas, CreatedAt, UpdatedAt
          FROM doc.Expediente
          WHERE CURP = @curp
        `);
      const row = r.recordset[0];
      if (!row) {
        throw new Error('EXPEDIENTE_NOT_FOUND');
      }
      expediente = {
        curp: row.CURP,
        afiliadoId: row.AfiliadoId,
        interno: row.Interno,
        estado: row.Estado,
        notas: row.Notas,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt
      };
      logger.debug({ ...logContext, expedienteCurp: expediente.curp }, 'Expediente encontrado');
    } catch (error: any) {
      if (error.message === 'EXPEDIENTE_NOT_FOUND') {
        logger.info(logContext, 'Expediente no encontrado, creando nuevo expediente');
        expediente = await createExpedienteItem(
          curp,
          null, // afiliadoId
          null, // interno
          'ABIERTO', // estado
          null, // notas
          userId,
          tx
        );
        expedienteCreated = true;
        logger.info({ ...logContext, expedienteCurp: expediente.curp }, 'Expediente creado exitosamente');
      } else {
        logger.error({ ...logContext, error: error.message }, 'Error al verificar expediente');
        throw error;
      }
    }

    logger.debug(logContext, 'Creando archivo temporal');

    // 2. Create temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${fileData.filename}`);
    logger.debug({ ...logContext, tempFilePath }, 'Ruta de archivo temporal generada');

    const buffer = await fileData.toBuffer();
    logger.debug({ ...logContext, fileSize: buffer.length }, 'Buffer de archivo creado');

    fs.writeFileSync(tempFilePath, buffer);
    logger.debug({ ...logContext, tempFilePath }, 'Archivo temporal creado exitosamente');

    logger.debug(logContext, 'Subiendo archivo a FTP');

    // 3. Upload to FTP using the same path generation as other endpoints
    const ftpPath = ftpService.generateExpedientePath(curp, fileData.filename);
    logger.debug({ ...logContext, ftpPath }, 'Ruta FTP generada');

    await ftpService.uploadFile(tempFilePath, ftpPath);
    logger.info({ ...logContext, ftpPath }, 'Archivo subido a FTP exitosamente');

    logger.debug(logContext, 'Creando registro de expediente archivo');

    // 4. Create expediente archivo record without SHA256 hash
    const archivo = await createExpedienteArchivoItem(
      curp,
      tipoCodigo || null,
      titulo,
      fileData.filename,
      fileData.mimetype,
      buffer.length,
      null,
      'FTP',
      ftpPath,
      observaciones || null,
      documentTypeId || null,
      userId,
      tx
    );

    logger.info({ ...logContext, archivoId: archivo.archivoId }, 'Registro de expediente archivo creado exitosamente');

    logger.debug(logContext, 'Limpiando archivo temporal');

    // 5. Cleanup temp file
    try {
      fs.unlinkSync(tempFilePath);
      logger.debug({ ...logContext, tempFilePath }, 'Archivo temporal eliminado exitosamente');
    } catch (cleanupError: any) {
      logger.warn({ ...logContext, tempFilePath, error: cleanupError.message }, 'Error al eliminar archivo temporal');
    }

    const result = {
      archivoId: archivo.archivoId,
      success: true,
      message: 'Documento subido exitosamente',
      expedienteCreated,
      fileName: fileData.filename
    };

    logger.info({ ...logContext, archivoId: archivo.archivoId, expedienteCreated }, 'Carga de documento completada exitosamente');
    return result;

  } catch (error: any) {
    logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error al cargar documento a expediente');
    throw error;
  }
}

// Helper functions needed by utility functions above
async function getExpedienteByCurp(curp: string) {
  const expediente = await findExpedienteByCurp(curp);
  if (!expediente) {
    throw new Error('EXPEDIENTE_NOT_FOUND');
  }
  return expediente;
}

async function getDocumentTypeById(documentTypeId: number) {
  const documentType = await findDocumentTypeById(documentTypeId);
  if (!documentType) {
    throw new Error('DOCUMENT_TYPE_NOT_FOUND');
  }
  return documentType;
}

async function getExpedienteArchivoById(archivoId: number) {
  const archivo = await findExpedienteArchivoById(archivoId);
  if (!archivo) {
    throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
  }
  return archivo;
}

async function createExpedienteItem(curp: string, afiliadoId: number | null, interno: number | null, estado: string, notas: string | null, userId?: string, tx?: any) {
  try {
    return await createExpediente(curp, afiliadoId, interno, estado, notas, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('EXPEDIENTE_EXISTS');
    }
    throw error;
  }
}

async function createExpedienteArchivoItem(curp: string, tipoCodigo: string | null, titulo: string, fileName: string, mimeType: string, byteSize: number, sha256Hex: string | null, storageProvider: string, storagePath: string, observaciones: string | null, documentTypeId: number | null, userId?: string, tx?: any) {
  // Note: Expediente existence is already verified in uploadDocumentToExpediente before calling this function
  // Re-verifying here with a separate connection outside the transaction can cause deadlocks/timeouts
  // DocumentTypeId validation is also skipped - the INSERT will fail with a foreign key error if invalid
  
  try {
    return await createExpedienteArchivo(curp, tipoCodigo, titulo, fileName, mimeType, byteSize, sha256Hex, storageProvider, storagePath, observaciones, documentTypeId, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of UNIQUE KEY constraint') && error.message.includes('UX_doc_Archivo_Hash')) {
      throw new Error('EXPEDIENTE_ARCHIVO_HASH_EXISTS');
    }
    throw error;
  }
}