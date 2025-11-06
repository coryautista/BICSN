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
  try {
    return await registerAfectacionOrg(data);
  } catch (error: any) {
    console.error('Error registering affectation:', error);
    throw new Error('FAILED_TO_REGISTER_AFFECTATION');
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
  try {
    return await getEstadosAfectacion(filters);
  } catch (error: any) {
    console.error('Error getting affectation states:', error);
    throw new Error('FAILED_TO_GET_ESTADOS');
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
  try {
    return await getProgresoUsuario(filters);
  } catch (error: any) {
    console.error('Error getting user progress:', error);
    throw new Error('FAILED_TO_GET_PROGRESO');
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
  try {
    return await getBitacoraAfectacion(filters);
  } catch (error: any) {
    console.error('Error getting affectation logs:', error);
    throw new Error('FAILED_TO_GET_BITACORA');
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
  try {
    return await getTableroAfectaciones(filters);
  } catch (error: any) {
    console.error('Error getting dashboard data:', error);
    throw new Error('FAILED_TO_GET_TABLERO');
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
  try {
    return await getUltimaAfectacion(filters);
  } catch (error: any) {
    console.error('Error getting last affectations:', error);
    throw new Error('FAILED_TO_GET_ULTIMA');
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
  // Create a mock request object for withDbContext
  const mockReq = {
    user: { sub: userId },
    ip: '127.0.0.1'
  } as any;

  return await withDbContext(mockReq, async (tx) => {
    try {
      // 1. Create temp file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${fileData.filename}`);
      const buffer = await fileData.toBuffer();
      fs.writeFileSync(tempFilePath, buffer);

      // 2. Calculate SHA256
      const sha256Hex = await calculateSha256(tempFilePath);

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

      // 4. Cleanup temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      return {
        archivoId: archivo.archivoId,
        success: true,
        message: 'Documento subido exitosamente'
      };

    } catch (error) {
      console.error('Error in uploadDocumentToExpediente:', error);
      throw error;
    }
  });
}

// Calculate quincena number from date
export async function calculateQuincenaFromDate(fecha: string) {
  try {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const day = date.getDate();

    // Calculate quincena: 1-14 = first quincena, 15+ = second quincena
    const quincenaInMonth = day <= 14 ? 1 : 2;

    // Calculate overall quincena number for the year
    // January = months 1-2, February = 3-4, etc.
    const monthQuincenaStart = (month * 2) + 1;
    const quincena = monthQuincenaStart + (quincenaInMonth - 1);

    return {
      fecha: fecha,
      anio: year,
      mes: month + 1,
      dia: day,
      quincena: quincena,
      quincenaEnMes: quincenaInMonth,
      descripcion: `Quincena ${quincena} del año ${year} (${day <= 14 ? '1-14' : '15+'} de ${date.toLocaleString('es-MX', { month: 'long' })})`
    };
  } catch (error: any) {
    console.error('Error calculating quincena from date:', error);
    throw new Error('FAILED_TO_CALCULATE_QUINCENA');
  }
}

export async function getQuincenaAltaAfectacionService(filters?: {
  entidad?: string;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  try {
    return await getQuincenaAltaAfectacion(filters);
  } catch (error: any) {
    console.error('Error getting quincena alta afectacion:', error);
    throw new Error('FAILED_TO_GET_QUINCENA_ALTA_AFECTACION');
  }
}