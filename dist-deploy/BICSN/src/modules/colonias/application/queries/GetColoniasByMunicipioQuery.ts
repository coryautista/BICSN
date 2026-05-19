import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { Colonia } from '../../domain/entities/Colonia.js';
import {
  InvalidColoniaDataError,
  ColoniaByMunicipioNotFoundError,
  ColoniaQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getColoniasByMunicipioQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetColoniasByMunicipioQuery {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(municipioId: number): Promise<Colonia[]> {
    // Validaciones de entrada
    this.validateInput(municipioId);

    const logContext = {
      operation: 'getColoniasByMunicipio',
      municipioId: municipioId
    };

    logger.info(logContext, 'Consultando colonias por municipio');

    try {
      const result = await this.coloniaRepo.findByMunicipio(municipioId);

      if (!result || result.length === 0) {
        logger.warn({ ...logContext }, 'No se encontraron colonias para el municipio');
        throw new ColoniaByMunicipioNotFoundError(municipioId);
      }

      logger.info({
        ...logContext,
        coloniasCount: result.length,
        coloniasIds: result.map(c => c.coloniaId)
      }, 'Consulta de colonias por municipio completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof ColoniaByMunicipioNotFoundError ||
          error instanceof InvalidColoniaDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar colonias por municipio');

      throw new ColoniaQueryError('consulta por municipio', {
        originalError: error.message,
        municipioId: municipioId
      });
    }
  }

  private validateInput(municipioId: number): void {
    // Validar municipioId
    if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
      throw new InvalidColoniaDataError('municipioId', 'Es requerido y debe ser un número positivo');
    }
  }
}
