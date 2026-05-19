import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { Calle, CreateCalleData } from '../../domain/entities/Calle.js';
import {
  CalleAlreadyExistsError,
  InvalidCalleDataError,
  CalleNombreRequiredError,
  CalleNombreTooLongError,
  CalleNombreEmptyError,
  InvalidColoniaIdError,
  ColoniaNotFoundError,
  CalleSystemError
} from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class CreateCalleCommand {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(data: CreateCalleData): Promise<Calle> {
    try {
      logger.info('Iniciando proceso de creación de calle', {
        coloniaId: data.coloniaId,
        nombreCalle: data.nombreCalle,
        esValido: data.esValido,
        userId: data.userId
      });

      // Validar coloniaId
      if (!data.coloniaId || typeof data.coloniaId !== 'number' || data.coloniaId <= 0) {
        throw new InvalidColoniaIdError(data.coloniaId);
      }

      // Validar nombreCalle
      if (!data.nombreCalle) {
        throw new CalleNombreRequiredError();
      }

      if (typeof data.nombreCalle !== 'string') {
        throw new InvalidCalleDataError('El nombre de la calle debe ser una cadena de texto');
      }

      const trimmedNombre = data.nombreCalle.trim();
      if (trimmedNombre.length === 0) {
        throw new CalleNombreEmptyError();
      }

      if (trimmedNombre.length > 150) {
        throw new CalleNombreTooLongError(trimmedNombre, 150);
      }

      // Validar esValido
      if (typeof data.esValido !== 'boolean') {
        throw new InvalidCalleDataError('El campo esValido debe ser un valor booleano');
      }

      // Preparar datos validados
      const validatedData: CreateCalleData = {
        ...data,
        nombreCalle: trimmedNombre
      };

      logger.debug('Datos validados correctamente, procediendo a crear calle');

      try {
        const calle = await this.calleRepo.create(validatedData);

        logger.info('Calle creada exitosamente', {
          calleId: calle.calleId,
          coloniaId: calle.coloniaId,
          nombreCalle: calle.nombreCalle,
          userId: data.userId
        });

        return calle;

      } catch (error: any) {
        // Manejar errores específicos de base de datos
        if (error.message && error.message.includes('Violation of PRIMARY KEY constraint')) {
          logger.warn('Intento de crear calle con ID duplicado', {
            coloniaId: data.coloniaId,
            nombreCalle: trimmedNombre,
            userId: data.userId
          });
          throw new CalleAlreadyExistsError(0, trimmedNombre, data.coloniaId);
        }

        if (error.message && error.message.includes('FOREIGN KEY constraint')) {
          logger.warn('Intento de crear calle con colonia inexistente', {
            coloniaId: data.coloniaId,
            nombreCalle: trimmedNombre,
            userId: data.userId
          });
          throw new ColoniaNotFoundError(data.coloniaId);
        }

        // Re-lanzar otros errores
        throw error;
      }

    } catch (error) {
      if (error instanceof CalleAlreadyExistsError ||
          error instanceof InvalidCalleDataError ||
          error instanceof CalleNombreRequiredError ||
          error instanceof CalleNombreTooLongError ||
          error instanceof CalleNombreEmptyError ||
          error instanceof InvalidColoniaIdError ||
          error instanceof ColoniaNotFoundError) {
        throw error;
      }

      logger.error('Error durante la creación de calle', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        coloniaId: data.coloniaId,
        nombreCalle: data.nombreCalle,
        userId: data.userId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleSystemError('Error interno durante la creación de calle');
    }
  }
}
