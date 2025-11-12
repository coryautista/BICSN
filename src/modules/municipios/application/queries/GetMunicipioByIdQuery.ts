import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio } from '../../domain/entities/Municipio.js';
import {
  MunicipioNotFoundError,
  MunicipioInvalidIdError,
  MunicipioError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMunicipioByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetMunicipioByIdInput {
  municipioId: number;
}

export class GetMunicipioByIdQuery {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(input: GetMunicipioByIdInput, userId?: string): Promise<Municipio> {
    try {
      logger.info({
        operation: 'getMunicipioById',
        municipioId: input.municipioId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando municipio por ID');

      // Validar ID
      this.validateId(input.municipioId);

      const municipio = await this.municipioRepo.findById(input.municipioId);
      if (!municipio) {
        throw new MunicipioNotFoundError(input.municipioId);
      }

      logger.info({
        operation: 'getMunicipioById',
        municipioId: municipio.municipioId,
        estadoId: municipio.estadoId,
        claveMunicipio: municipio.claveMunicipio,
        nombreMunicipio: municipio.nombreMunicipio,
        userId,
        timestamp: new Date().toISOString()
      }, 'Municipio encontrado exitosamente');

      return municipio;
    } catch (error) {
      if (error instanceof MunicipioNotFoundError ||
          error instanceof MunicipioInvalidIdError) {
        throw error;
      }

      logger.error({
        operation: 'getMunicipioById',
        error: (error as Error).message,
        municipioId: input.municipioId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar municipio por ID');

      throw new MunicipioError('Error interno al consultar municipio', 'MUNICIPIO_QUERY_ERROR', 500);
    }
  }

  private validateId(municipioId: number): void {
    if (!Number.isInteger(municipioId) || municipioId <= 0) {
      throw new MunicipioInvalidIdError('debe ser un número entero positivo');
    }
  }
}
