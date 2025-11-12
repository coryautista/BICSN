import {
  registerAfectacionOrg,
  getEstadosAfectacion,
  getProgresoUsuario,
  getBitacoraAfectacion,
  getTableroAfectaciones,
  getUltimaAfectacion,
  getQuincenaAltaAfectacion
} from './afectacionOrg.repo.js';
import { createExpedienteArchivoItem } from '../expediente/expediente.service.js';
import { withDbContext } from '../../db/context.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  AfectacionRegistrationError,
  AfectacionQueryError,
  InvalidQuincenaError,
  InvalidAnioError,
  InvalidOrgNivelError,
  InvalidDateForQuincenaError,
  OrgHierarchyValidationError
} from './domain/errors.js';
import { DatabaseError } from '../../utils/errors.js';
import pino from 'pino';

// Logger específico del módulo
const logger = pino({ 
  name: 'afectacionOrg-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function registerAfectacionOrgItem(data: {
  entidad: string;
  anio: number;
  quincena: number;
  orgNivel: number;
  org0: string;
  org1?: string;
  org2?: string;
  org3?: string;
  accion: string;
  resultado: string;
  mensaje?: string;
  usuario: string;
  appName: string;
  ip: string;
}) {
  const logContext = {
    operation: 'registerAfectacionOrg',
    entidad: data.entidad,
    anio: data.anio,
    quincena: data.quincena,
    orgNivel: data.orgNivel,
    usuario: data.usuario
  };

  logger.info(logContext, 'Registrando afectación');

  try {
    // Validaciones de negocio
    if (data.quincena < 1 || data.quincena > 24) {
      logger.warn({ ...logContext, quincena: data.quincena }, 'Valor de quincena inválido');
      throw new InvalidQuincenaError(data.quincena);
    }

    if (data.anio < 2000 || data.anio > 2100) {
      logger.warn({ ...logContext, anio: data.anio }, 'Valor de año inválido');
      throw new InvalidAnioError(data.anio);
    }

    if (data.orgNivel < 0 || data.orgNivel > 3) {
      logger.warn({ ...logContext, orgNivel: data.orgNivel }, 'Valor de orgNivel inválido');
      throw new InvalidOrgNivelError(data.orgNivel);
    }

    // Validación de jerarquía organizacional
    validateOrgHierarchy(data.orgNivel, data.org0, data.org1, data.org2, data.org3);

    const result = await registerAfectacionOrg(data);
    
    logger.info({ ...logContext, success: true }, 'Afectación registrada exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ 
      ...logContext, 
      error: error.message,
      stack: error.stack 
    }, 'Failed to register afectación');

    // Re-throw domain errors as-is
    if (error instanceof InvalidQuincenaError || 
        error instanceof InvalidAnioError || 
        error instanceof InvalidOrgNivelError ||
        error instanceof OrgHierarchyValidationError) {
      throw error;
    }

    // Wrap database/unknown errors
    throw new AfectacionRegistrationError(error.message, { originalError: error.message });
  }
}

// Helper function to validate org hierarchy
function validateOrgHierarchy(
  orgNivel: number,
  org0: string,
  org1?: string,
  org2?: string,
  org3?: string
): void {
  // org0 is always required
  if (!org0 || org0.length !== 2) {
    throw new OrgHierarchyValidationError('org0 is required and must be 2 characters', { org0 });
  }

  // If orgNivel >= 1, org1 is required
  if (orgNivel >= 1 && (!org1 || org1.length !== 2)) {
    throw new OrgHierarchyValidationError('org1 is required when orgNivel >= 1', { orgNivel, org1 });
  }

  // If orgNivel >= 2, org2 is required
  if (orgNivel >= 2 && (!org2 || org2.length !== 2)) {
    throw new OrgHierarchyValidationError('org2 is required when orgNivel >= 2', { orgNivel, org2 });
  }

  // If orgNivel >= 3, org3 is required
  if (orgNivel >= 3 && (!org3 || org3.length !== 2)) {
    throw new OrgHierarchyValidationError('org3 is required when orgNivel >= 3', { orgNivel, org3 });
  }
}

export async function getEstadosAfectacionFiltered(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const logContext = { operation: 'getEstadosAfectacion', filters };
  logger.info(logContext, 'Consultando estados de afectación');

  try {
    const result = await getEstadosAfectacion(filters);
    logger.info({ ...logContext, resultCount: result?.length || 0 }, 'Estados obtenidos exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener estados');
    throw new AfectacionQueryError('getEstadosAfectacion', { filters, error: error.message });
  }
}

export async function getProgresoUsuarioFiltered(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}) {
  const logContext = { operation: 'getProgresoUsuario', filters };
  logger.info(logContext, 'Consultando progreso de usuario');

  try {
    const result = await getProgresoUsuario(filters);
    logger.info({ ...logContext, resultCount: result?.length || 0 }, 'Progreso obtenido exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener progreso de usuario');
    throw new AfectacionQueryError('getProgresoUsuario', { filters, error: error.message });
  }
}

export async function getBitacoraAfectacionFiltered(filters: {
  entidad?: string;
  anio?: number;
  quincena?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
  accion?: string;
  resultado?: string;
  limit?: number;
  offset?: number;
}) {
  const logContext = { operation: 'getBitacoraAfectacion', filters };
  logger.info(logContext, 'Consultando bitácora de afectación');

  try {
    const result = await getBitacoraAfectacion(filters);
    logger.info({ ...logContext, resultCount: result?.length || 0 }, 'Bitácora obtenida exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener bitácora');
    throw new AfectacionQueryError('getBitacoraAfectacion', { filters, error: error.message });
  }
}

export async function getTableroAfectacionesFiltered(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const logContext = { operation: 'getTableroAfectaciones', filters };
  logger.info(logContext, 'Consultando tablero de afectaciones');

  try {
    const result = await getTableroAfectaciones(filters);
    logger.info({ ...logContext, resultCount: result?.length || 0 }, 'Tablero obtenido exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener tablero');
    throw new AfectacionQueryError('getTableroAfectaciones', { filters, error: error.message });
  }
}

export async function getUltimaAfectacionFiltered(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}) {
  const logContext = { operation: 'getUltimaAfectacion', filters };
  logger.info(logContext, 'Consultando última afectación');

  try {
    const result = await getUltimaAfectacion(filters);
    logger.info({ ...logContext, found: !!result }, 'Última afectación obtenida exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener última afectación');
    throw new AfectacionQueryError('getUltimaAfectacion', { filters, error: error.message });
  }
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
  documentTypeId?: number
) {
  const logContext = {
    operation: 'uploadDocumentToExpediente',
    curp,
    titulo,
    userId,
    filename: fileData.filename,
    mimetype: fileData.mimetype
  };

  logger.info(logContext, 'Subiendo documento al expediente');

  // Create a mock request object for withDbContext
  const mockReq = {
    user: { sub: userId },
    ip: '127.0.0.1'
  } as any;

  return await withDbContext(mockReq, async (tx) => {
    let tempFilePath: string | null = null;
    
    try {
      // 1. Create temp file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `upload_${Date.now()}_${fileData.filename}`);
      const buffer = await fileData.toBuffer();
      fs.writeFileSync(tempFilePath, buffer);

      logger.debug({ ...logContext, tempFilePath, size: buffer.length }, 'Archivo temporal creado');

      // 2. Calculate SHA256
      const sha256Hex = await calculateSha256(tempFilePath);
      logger.debug({ ...logContext, sha256: sha256Hex }, 'SHA256 calculado');

      // 3. Upload document to expediente
      const archivo = await createExpedienteArchivoItem(
        curp,
        tipoCodigo || null,
        titulo,
        fileData.filename,
        fileData.mimetype,
        buffer.length,
        sha256Hex,
        'local',
        tempFilePath,
        observaciones || null,
        documentTypeId || null,
        userId,
        tx
      );

      logger.info({ 
        ...logContext, 
        archivoId: archivo.archivoId 
      }, 'Documento subido exitosamente');

      // 4. Cleanup temp file
      if (tempFilePath) {
        try {
          fs.unlinkSync(tempFilePath);
          logger.debug({ ...logContext, tempFilePath }, 'Archivo temporal limpiado');
        } catch (cleanupError: any) {
          logger.warn({ 
            ...logContext, 
            tempFilePath, 
            error: cleanupError.message 
          }, 'Error al limpiar archivo temporal');
        }
      }

      return {
        archivoId: archivo.archivoId,
        success: true,
        message: 'Documento subido exitosamente'
      };

    } catch (error: any) {
      logger.error({ 
        ...logContext, 
        error: error.message,
        stack: error.stack 
      }, 'Error al subir documento');

      // Cleanup temp file on error
      if (tempFilePath) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.warn({ tempFilePath }, 'Error al limpiar archivo temporal después del error');
        }
      }

      throw new DatabaseError('Error al subir documento al expediente', {
        curp,
        originalError: error.message
      });
    }
  });
}

// Calculate quincena number from date
export async function calculateQuincenaFromDate(fecha: string) {
  const logContext = { operation: 'calculateQuincenaFromDate', fecha };
  logger.info(logContext, 'Calculando quincena desde fecha');

  try {
    const date = new Date(fecha);
    
    // Validar fecha válida
    if (isNaN(date.getTime())) {
      logger.warn({ ...logContext }, 'Formato de fecha inválido');
      throw new InvalidDateForQuincenaError(fecha);
    }

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const day = date.getDate();

    // Calculate quincena: 1-14 = first quincena, 15+ = second quincena
    const quincenaInMonth = day <= 14 ? 1 : 2;

    // Calculate overall quincena number for the year
    // January = months 1-2, February = 3-4, etc.
    const monthQuincenaStart = (month * 2) + 1;
    const quincena = monthQuincenaStart + (quincenaInMonth - 1);

    const result = {
      fecha: fecha,
      anio: year,
      mes: month + 1,
      dia: day,
      quincena: quincena,
      quincenaEnMes: quincenaInMonth,
      descripcion: `Quincena ${quincena} del año ${year} (${day <= 14 ? '1-14' : '15+'} de ${date.toLocaleString('es-MX', { month: 'long' })})`
    };

    logger.info({ ...logContext, result }, 'Quincena calculada exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al calcular quincena');
    
    if (error instanceof InvalidDateForQuincenaError) {
      throw error;
    }
    
    throw new InvalidDateForQuincenaError(fecha);
  }
}

export async function getQuincenaAltaAfectacionService(filters?: {
  entidad?: string;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const logContext = { operation: 'getQuincenaAltaAfectacion', filters };
  logger.info(logContext, 'Consultando quincena alta de afectación');

  try {
    const result = await getQuincenaAltaAfectacion(filters);
    logger.info({ ...logContext, found: !!result }, 'Quincena alta obtenida exitosamente');
    return result;
  } catch (error: any) {
    logger.error({ ...logContext, error: error.message }, 'Error al obtener quincena alta');
    throw new AfectacionQueryError('getQuincenaAltaAfectacion', { filters, error: error.message });
  }
}