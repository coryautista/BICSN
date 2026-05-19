import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { ColoniaDetailed } from '../../domain/entities/Colonia.js';
import {
  ColoniaNotFoundError,
  InvalidColoniaDataError,
  ColoniaQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getColoniaByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetColoniaByIdQuery {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(coloniaId: number): Promise<ColoniaDetailed> {
    // Validaciones de entrada
    this.validateInput(coloniaId);

    const logContext = {
      operation: 'getColoniaById',
      coloniaId: coloniaId
    };

    logger.info(logContext, 'Consultando colonia por ID');

    try {
      const result = await this.coloniaRepo.findById(coloniaId);

      if (!result) {
        logger.warn({ ...logContext }, 'Colonia no encontrada por ID');
        throw new ColoniaNotFoundError(coloniaId);
      }

      logger.info({
        ...logContext,
        nombreColonia: result.nombreColonia,
        municipioId: result.municipio.municipioId,
        estadoId: result.estado.estadoId,
        esValido: result.esValido
      }, 'Consulta de colonia por ID completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof ColoniaNotFoundError ||
          error instanceof InvalidColoniaDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar colonia por ID');

      throw new ColoniaQueryError('consulta por ID', {
        originalError: error.message,
        coloniaId: coloniaId
      });
    }
  }

  private validateInput(coloniaId: number): void {
    // Validar coloniaId
    if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
      throw new InvalidColoniaDataError('coloniaId', 'Es requerido y debe ser un número positivo');
    }
  }
}
