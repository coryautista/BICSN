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
import crypto from 'crypto';
import * as mime from 'mime-types';

// DocumentType services
export async function getAllDocumentTypes() {
  return await listDocumentTypes();
}

export async function getDocumentTypeById(documentTypeId: number) {
  const documentType = await findDocumentTypeById(documentTypeId);
  if (!documentType) {
    throw new Error('DOCUMENT_TYPE_NOT_FOUND');
  }
  return documentType;
}

export async function getDocumentTypeByCode(code: string) {
  const documentType = await findDocumentTypeByCode(code);
  if (!documentType) {
    throw new Error('DOCUMENT_TYPE_NOT_FOUND');
  }
  return documentType;
}

export async function createDocumentTypeItem(code: string, name: string, required: boolean, validityDays: number | null, active: boolean, userId?: string, tx?: any) {
  try {
    return await createDocumentType(code, name, required, validityDays, active, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
      throw new Error('DOCUMENT_TYPE_CODE_EXISTS');
    }
    throw error;
  }
}

export async function updateDocumentTypeItem(documentTypeId: number, code?: string, name?: string, required?: boolean, validityDays?: number | null, active?: boolean, userId?: string, tx?: any) {
  const documentType = await updateDocumentType(documentTypeId, code, name, required, validityDays, active, userId, tx);
  if (!documentType) {
    throw new Error('DOCUMENT_TYPE_NOT_FOUND');
  }
  return documentType;
}

export async function deleteDocumentTypeItem(documentTypeId: number, tx?: any) {
  const deletedId = await deleteDocumentType(documentTypeId, tx);
  if (!deletedId) {
    throw new Error('DOCUMENT_TYPE_NOT_FOUND');
  }
  return deletedId;
}

// Expediente services
export async function getAllExpedientes() {
  return await listExpedientes();
}

export async function getExpedienteByCurp(curp: string) {
  const expediente = await findExpedienteByCurp(curp);
  if (!expediente) {
    throw new Error('EXPEDIENTE_NOT_FOUND');
  }
  return expediente;
}

export async function createExpedienteItem(curp: string, afiliadoId: number | null, interno: number | null, estado: string, notas: string | null, userId?: string, tx?: any) {
  try {
    return await createExpediente(curp, afiliadoId, interno, estado, notas, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('EXPEDIENTE_EXISTS');
    }
    throw error;
  }
}

export async function updateExpedienteItem(curp: string, afiliadoId?: number | null, interno?: number | null, estado?: string, notas?: string | null, userId?: string, tx?: any) {
  const expediente = await updateExpediente(curp, afiliadoId, interno, estado, notas, userId, tx);
  if (!expediente) {
    throw new Error('EXPEDIENTE_NOT_FOUND');
  }
  return expediente;
}

export async function deleteExpedienteItem(curp: string, tx?: any) {
  const deletedCurp = await deleteExpediente(curp, tx);
  if (!deletedCurp) {
    throw new Error('EXPEDIENTE_NOT_FOUND');
  }
  return deletedCurp;
}

// ExpedienteArchivo services
export async function getExpedienteArchivoById(archivoId: number) {
  const archivo = await findExpedienteArchivoById(archivoId);
  if (!archivo) {
    throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
  }
  return archivo;
}

export async function getExpedienteArchivosByCurp(curp: string) {
  // Verify expediente exists
  await getExpedienteByCurp(curp);
  return await listExpedienteArchivosByCurp(curp);
}

export async function createExpedienteArchivoItem(curp: string, tipoCodigo: string | null, titulo: string, fileName: string, mimeType: string, byteSize: number, sha256Hex: string, storageProvider: string, storagePath: string, observaciones: string | null, documentTypeId: number | null, userId?: string, tx?: any) {
  // Verify expediente exists
  await getExpedienteByCurp(curp);

  // If documentTypeId is provided, verify it exists
  if (documentTypeId) {
    await getDocumentTypeById(documentTypeId);
  }

  try {
    return await createExpedienteArchivo(curp, tipoCodigo, titulo, fileName, mimeType, byteSize, sha256Hex, storageProvider, storagePath, observaciones, documentTypeId, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of UNIQUE KEY constraint') && error.message.includes('UX_doc_Archivo_Hash')) {
      throw new Error('EXPEDIENTE_ARCHIVO_HASH_EXISTS');
    }
    throw error;
  }
}

export async function updateExpedienteArchivoItem(archivoId: number, tipoCodigo?: string | null, titulo?: string, fileName?: string, mimeType?: string, byteSize?: number, sha256Hex?: string, storageProvider?: string, storagePath?: string, observaciones?: string | null, documentTypeId?: number | null, userId?: string, tx?: any) {
  // If documentTypeId is provided, verify it exists
  if (documentTypeId) {
    await getDocumentTypeById(documentTypeId);
  }

  const archivo = await updateExpedienteArchivo(archivoId, tipoCodigo, titulo, fileName, mimeType, byteSize, sha256Hex, storageProvider, storagePath, observaciones, documentTypeId, userId, tx);
  if (!archivo) {
    throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
  }
  return archivo;
}

export async function deleteExpedienteArchivoItem(archivoId: number, tx?: any) {
  // Get archivo info before deletion to clean up FTP file
  const archivo = await getExpedienteArchivoById(archivoId);

  const deletedId = await deleteExpedienteArchivo(archivoId, tx);
  if (!deletedId) {
    throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
  }

  // Try to delete file from FTP (don't fail if FTP operation fails)
  try {
    if (archivo.storageProvider === 'FTP') {
      await ftpService.deleteFile(archivo.storagePath);
    }
  } catch (ftpError) {
    console.warn('Failed to delete file from FTP:', ftpError);
    // Don't throw error here as the database record is already deleted
  }

  return deletedId;
}

// Additional FTP-related services
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

// Calculate SHA256 hash of file
async function calculateSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
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
  console.log('🚀 Starting uploadDocumentToExpediente for CURP:', curp);

  try {
    console.log('📋 Step 1: Checking if expediente exists for CURP:', curp);

    // 1. Check if expediente exists, if not create it
    let expediente;
    let expedienteCreated = false;
    try {
      expediente = await getExpedienteByCurp(curp);
      console.log('✅ Expediente exists:', expediente.curp);
    } catch (error: any) {
      if (error.message === 'EXPEDIENTE_NOT_FOUND') {
        console.log('📝 Expediente not found, creating new one...');
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
        console.log('✅ Expediente created:', expediente.curp);
      } else {
        console.error('❌ Error checking expediente:', error);
        throw error;
      }
    }

    console.log('📁 Step 2: Creating temp file');

    // 2. Create temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${fileData.filename}`);
    console.log('📄 Temp file path:', tempFilePath);

    const buffer = await fileData.toBuffer();
    console.log('📊 File buffer size:', buffer.length, 'bytes');

    fs.writeFileSync(tempFilePath, buffer);
    console.log('✅ Temp file created successfully');

    console.log('📤 Step 3: Uploading to FTP');

    // 3. Upload to FTP using the same path generation as other endpoints
    const ftpPath = ftpService.generateExpedientePath(curp, fileData.filename);
    console.log('🌐 FTP path:', ftpPath);

    await ftpService.uploadFile(tempFilePath, ftpPath);
    console.log('✅ File uploaded to FTP successfully');

    console.log('💾 Step 4: Creating expediente archivo record');

    console.log('📝 Creating expediente archivo record...');

    // 4. Create expediente archivo record without SHA256 hash
    const archivo = await createExpedienteArchivoItem(
      curp,
      tipoCodigo || null,
      titulo,
      fileData.filename,
      fileData.mimetype,
      buffer.length,
      '',
      'FTP',
      ftpPath,
      observaciones || null,
      documentTypeId || null,
      userId,
      tx
    );

    console.log('✅ Expediente archivo created with ID:', archivo.archivoId);

    console.log('🧹 Step 5: Cleanup temp file');

    // 5. Cleanup temp file
    try {
      fs.unlinkSync(tempFilePath);
      console.log('✅ Temp file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
    }

    const result = {
      archivoId: archivo.archivoId,
      success: true,
      message: 'Documento subido exitosamente',
      expedienteCreated
    };

    console.log('🎉 Upload completed successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in uploadDocumentToExpediente:', error);
    throw error;
  }
}