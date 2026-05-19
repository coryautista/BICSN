import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio } from '../../domain/entities/Municipio.js';
import { MunicipioError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllMunicipiosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllMunicipiosQuery {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(userId?: string): Promise<Municipio[]> {
    try {
      logger.info({
        operation: 'getAllMunicipios',
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando todos los municipios');

      const municipios = await this.municipioRepo.findAll();

      logger.info({
        operation: 'getAllMunicipios',
        count: municipios.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de municipios completada exitosamente');

      return municipios;
    } catch (error) {
      logger.error({
        operation: 'getAllMunicipios',
        error: (error as Error).message,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar municipios');

      throw new MunicipioError('Error interno al consultar municipios', 'MUNICIPIO_QUERY_ERROR', 500);
    }
  }
}
