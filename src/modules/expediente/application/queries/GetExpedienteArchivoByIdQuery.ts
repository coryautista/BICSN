import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { ExpedienteArchivo } from '../../domain/entities/Expediente.js';
import {
  ExpedienteArchivoNotFoundError,
  InvalidExpedienteArchivoDataError,
  ExpedienteArchivoQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getExpedienteArchivoByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetExpedienteArchivoByIdQuery {
  constructor(private expedienteArchivoRepo: IExpedienteArchivoRepository) {}

  async execute(archivoId: number): Promise<ExpedienteArchivo> {
    // Validaciones de entrada
    this.validateInput(archivoId);

    const logContext = {
      operation: 'getExpedienteArchivoById',
      archivoId: archivoId
    };

    logger.info(logContext, 'Consultando archivo de expediente por ID');

    try {
      const archivo = await this.expedienteArchivoRepo.findById(archivoId);

      if (!archivo) {
        logger.warn(logContext, 'Archivo de expediente no encontrado');
        throw new ExpedienteArchivoNotFoundError(archivoId);
      }

      logger.info({
        ...logContext,
        found: true,
        curp: archivo.curp,
        fileName: archivo.fileName,
        mimeType: archivo.mimeType,
        byteSize: archivo.byteSize
      }, 'Archivo de expediente encontrado exitosamente');

      return archivo;

    } catch (error: any) {
      if (error instanceof ExpedienteArchivoNotFoundError ||
          error instanceof InvalidExpedienteArchivoDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar archivo de expediente por ID');

      throw new ExpedienteArchivoQueryError('consulta por ID', {
        originalError: error.message,
        archivoId: archivoId
      });
    }
  }

  private validateInput(archivoId: number): void {
    // Validar archivoId
    if (!archivoId || typeof archivoId !== 'number' || archivoId <= 0) {
      throw new InvalidExpedienteArchivoDataError('archivoId', 'Es requerido y debe ser un número positivo');
    }
  }
}
