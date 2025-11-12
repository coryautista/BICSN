import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { ColoniaDetailed, CreateColoniaData } from '../../domain/entities/Colonia.js';
import {
  DuplicateColoniaError,
  InvalidColoniaDataError,
  MunicipioNotFoundError,
  CodigoPostalNotFoundError,
  ColoniaCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createColoniaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateColoniaCommand {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(data: CreateColoniaData): Promise<ColoniaDetailed> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createColonia',
      municipioId: data.municipioId,
      codigoPostalId: data.codigoPostalId,
      nombreColonia: data.nombreColonia,
      tipoAsentamiento: data.tipoAsentamiento,
      esValido: data.esValido,
      userId: data.userId
    };

    logger.info(logContext, 'Creando nueva colonia');

    try {
      const result = await this.coloniaRepo.create(
        data.municipioId,
        data.codigoPostalId,
        data.nombreColonia,
        data.tipoAsentamiento,
        data.esValido,
        data.userId
      );

      logger.info({
        ...logContext,
        coloniaId: result.coloniaId,
        createdAt: result.createdAt
      }, 'Colonia creada exitosamente');

      return result;

    } catch (error: any) {
      // Manejo específico de errores de base de datos
      if (error.code === '23505') { // Unique constraint violation
        logger.warn({ ...logContext }, 'Intento de crear colonia duplicada');
        throw new DuplicateColoniaError(data.nombreColonia, data.municipioId);
      }

      if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('MunicipioID')) {
          logger.warn({ ...logContext }, 'Municipio no encontrado para colonia');
          throw new MunicipioNotFoundError(data.municipioId);
        }
        if (error.message.includes('CodigoPostalID')) {
          logger.warn({ ...logContext }, 'Código postal no encontrado para colonia');
          throw new CodigoPostalNotFoundError(data.codigoPostalId);
        }
      }

      if (error instanceof DuplicateColoniaError ||
          error instanceof InvalidColoniaDataError ||
          error instanceof MunicipioNotFoundError ||
          error instanceof CodigoPostalNotFoundError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear colonia');

      throw new ColoniaCommandError('creación', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: CreateColoniaData): void {
    // Validar municipioId
    if (!data.municipioId || typeof data.municipioId !== 'number' || data.municipioId <= 0) {
      throw new InvalidColoniaDataError('municipioId', 'Es requerido y debe ser un número positivo');
    }

    // Validar codigoPostalId
    if (!data.codigoPostalId || typeof data.codigoPostalId !== 'number' || data.codigoPostalId <= 0) {
      throw new InvalidColoniaDataError('codigoPostalId', 'Es requerido y debe ser un número positivo');
    }

    // Validar nombreColonia
    if (!data.nombreColonia || typeof data.nombreColonia !== 'string' || data.nombreColonia.trim().length === 0) {
      throw new InvalidColoniaDataError('nombreColonia', 'Es requerido y no puede estar vacío');
    }

    if (data.nombreColonia.length > 100) {
      throw new InvalidColoniaDataError('nombreColonia', 'No puede exceder 100 caracteres');
    }

    // Validar tipoAsentamiento (opcional)
    if (data.tipoAsentamiento && typeof data.tipoAsentamiento !== 'string') {
      throw new InvalidColoniaDataError('tipoAsentamiento', 'Debe ser una cadena de texto');
    }

    if (data.tipoAsentamiento && data.tipoAsentamiento.length > 50) {
      throw new InvalidColoniaDataError('tipoAsentamiento', 'No puede exceder 50 caracteres');
    }

    // Validar esValido
    if (typeof data.esValido !== 'boolean') {
      throw new InvalidColoniaDataError('esValido', 'Es requerido y debe ser un valor booleano');
    }
  }
}
