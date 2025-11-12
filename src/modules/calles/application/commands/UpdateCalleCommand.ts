import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { Calle, UpdateCalleData } from '../../domain/entities/Calle.js';
import {
  CalleNotFoundError,
  InvalidCalleDataError,
  CalleNombreTooLongError,
  CalleNombreEmptyError,
  CalleAlreadyExistsError,
  CalleSystemError
} from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class UpdateCalleCommand {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(data: UpdateCalleData): Promise<Calle> {
    try {
      logger.info('Iniciando proceso de actualización de calle', {
        calleId: data.calleId,
        nombreCalle: data.nombreCalle,
        esValido: data.esValido,
        userId: data.userId
      });

      // Validar calleId
      if (!data.calleId || typeof data.calleId !== 'number' || data.calleId <= 0) {
        throw new InvalidCalleDataError('ID de calle inválido');
      }

      // Verificar existencia de la calle
      logger.debug('Verificando existencia de la calle');
      const existing = await this.calleRepo.findById(data.calleId);
      if (!existing) {
        logger.warn('Intento de actualizar calle inexistente', {
          calleId: data.calleId,
          userId: data.userId
        });
        throw new CalleNotFoundError(data.calleId);
      }

      // Validar nombreCalle si se proporciona
      let validatedNombreCalle = existing.nombreCalle;
      if (data.nombreCalle !== undefined) {
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

        validatedNombreCalle = trimmedNombre;
      }

      // Validar esValido si se proporciona
      if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
        throw new InvalidCalleDataError('El campo esValido debe ser un valor booleano');
      }

      // Preparar datos validados
      const validatedData: UpdateCalleData = {
        ...data,
        nombreCalle: validatedNombreCalle
      };

      logger.debug('Datos validados correctamente, procediendo a actualizar calle');

      try {
        const calle = await this.calleRepo.update(validatedData);

        logger.info('Calle actualizada exitosamente', {
          calleId: calle.calleId,
          nombreCalle: calle.nombreCalle,
          esValido: calle.esValido,
          userId: data.userId,
          changes: {
            nombreCalleChanged: data.nombreCalle !== undefined && data.nombreCalle !== existing.nombreCalle,
            esValidoChanged: data.esValido !== undefined && data.esValido !== existing.esValido
          }
        });

        return calle;

      } catch (error: any) {
        // Manejar errores específicos de base de datos
        if (error.message && error.message.includes('Violation of PRIMARY KEY constraint')) {
          logger.warn('Conflicto al actualizar calle (posible duplicado)', {
            calleId: data.calleId,
            nombreCalle: validatedNombreCalle,
            userId: data.userId
          });
          throw new CalleAlreadyExistsError(data.calleId, validatedNombreCalle, existing.coloniaId);
        }

        // Re-lanzar otros errores
        throw error;
      }

    } catch (error) {
      if (error instanceof CalleNotFoundError ||
          error instanceof InvalidCalleDataError ||
          error instanceof CalleNombreTooLongError ||
          error instanceof CalleNombreEmptyError ||
          error instanceof CalleAlreadyExistsError) {
        throw error;
      }

      logger.error('Error durante la actualización de calle', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        calleId: data.calleId,
        nombreCalle: data.nombreCalle,
        userId: data.userId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleSystemError('Error interno durante la actualización de calle');
    }
  }
}
