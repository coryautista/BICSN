import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { Estado, CreateEstadoData } from '../../domain/entities/Estado.js';
import {
  DuplicateEstadoError,
  InvalidEstadoDataError,
  EstadoCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createEstadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateEstadoCommand {
  constructor(private estadoRepo: IEstadoRepository) {}

  async execute(data: CreateEstadoData): Promise<Estado> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createEstado',
      estadoId: data.estadoId,
      nombreEstado: data.nombreEstado,
      esValido: data.esValido,
      userId: data.userId
    };

    logger.info(logContext, 'Creando nuevo estado');

    try {
      const result = await this.estadoRepo.create(
        data.estadoId,
        data.nombreEstado,
        data.esValido,
        data.userId
      );

      logger.info({
        ...logContext,
        createdAt: result.createdAt
      }, 'Estado creado exitosamente');

      return result;

    } catch (error: any) {
      // Manejo específico de errores de base de datos
      if (error.code === '23505') { // Unique constraint violation
        logger.warn({ ...logContext }, 'Intento de crear estado duplicado');
        throw new DuplicateEstadoError(data.estadoId);
      }

      if (error instanceof DuplicateEstadoError ||
          error instanceof InvalidEstadoDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear estado');

      throw new EstadoCommandError('creación', {
        originalError: error.message,
        data: logContext
      });
    }
  }

  private validateInput(data: CreateEstadoData): void {
    // Validar estadoId
    if (!data.estadoId || typeof data.estadoId !== 'string' || data.estadoId.trim().length === 0) {
      throw new InvalidEstadoDataError('estadoId', 'Es requerido y debe ser una cadena no vacía');
    }

    if (data.estadoId.length > 10) {
      throw new InvalidEstadoDataError('estadoId', 'No puede exceder 10 caracteres');
    }

    // Validar nombreEstado
    if (!data.nombreEstado || typeof data.nombreEstado !== 'string' || data.nombreEstado.trim().length === 0) {
      throw new InvalidEstadoDataError('nombreEstado', 'Es requerido y no puede estar vacío');
    }

    if (data.nombreEstado.length > 100) {
      throw new InvalidEstadoDataError('nombreEstado', 'No puede exceder 100 caracteres');
    }

    // Validar esValido
    if (typeof data.esValido !== 'boolean') {
      throw new InvalidEstadoDataError('esValido', 'Es requerido y debe ser un valor booleano');
    }
  }
}
