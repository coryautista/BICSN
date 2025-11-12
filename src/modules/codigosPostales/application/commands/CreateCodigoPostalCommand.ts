import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal, CreateCodigoPostalData } from '../../domain/entities/CodigoPostal.js';
import {
  InvalidCodigoPostalDataError,
  InvalidCodigoPostalFormatError,
  DuplicateCodigoPostalError,
  CodigoPostalRegistrationError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createCodigoPostalCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateCodigoPostalCommand {
  constructor(private codigoPostalRepo: ICodigoPostalRepository) {}

  async execute(data: CreateCodigoPostalData): Promise<CodigoPostal> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createCodigoPostal',
      codigoPostal: data.codigoPostal,
      esValido: data.esValido,
      userId: data.userId
    };

    logger.info(logContext, 'Creando nuevo código postal');

    try {
      // Verificar duplicados antes de crear
      await this.checkForDuplicates(data);

      const result = await this.codigoPostalRepo.create(data.codigoPostal, data.esValido, data.userId);

      logger.info({
        ...logContext,
        codigoPostalId: result.codigoPostalId
      }, 'Código postal creado exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof DuplicateCodigoPostalError ||
          error instanceof InvalidCodigoPostalDataError ||
          error instanceof InvalidCodigoPostalFormatError) {
        throw error;
      }

      // Verificar si es un error de duplicado de base de datos
      if (error.message && error.message.includes('Violation of PRIMARY KEY constraint')) {
        logger.warn({ ...logContext }, 'Intento de crear código postal duplicado');
        throw new DuplicateCodigoPostalError(data.codigoPostal);
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear código postal');

      throw new CodigoPostalRegistrationError('Error al crear código postal', {
        originalError: error.message,
        data: data
      });
    }
  }

  private validateInput(data: CreateCodigoPostalData): void {
    // Validar codigoPostal
    if (!data.codigoPostal || typeof data.codigoPostal !== 'string') {
      throw new InvalidCodigoPostalDataError('codigoPostal', 'Es requerido y debe ser una cadena');
    }

    // Validar formato del código postal (exactamente 5 dígitos)
    if (!/^\d{5}$/.test(data.codigoPostal)) {
      throw new InvalidCodigoPostalFormatError(data.codigoPostal);
    }

    // Validar esValido
    if (typeof data.esValido !== 'boolean') {
      throw new InvalidCodigoPostalDataError('esValido', 'Es requerido y debe ser un valor booleano');
    }
  }

  private async checkForDuplicates(data: CreateCodigoPostalData): Promise<void> {
    // Verificar si ya existe un código postal con el mismo código
    try {
      const existing = await this.codigoPostalRepo.findByCode(data.codigoPostal);

      if (existing) {
        throw new DuplicateCodigoPostalError(data.codigoPostal);
      }
    } catch (error: any) {
      if (error instanceof DuplicateCodigoPostalError) {
        throw error;
      }
      // Si hay error de conexión o similar, continuar (mejor fallar en la creación que prevenirla)
      logger.warn({
        operation: 'checkForDuplicates',
        codigoPostal: data.codigoPostal,
        error: error.message
      }, 'No se pudo verificar duplicados, continuando con la creación');
    }
  }
}
