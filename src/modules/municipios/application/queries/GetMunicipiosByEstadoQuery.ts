import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio } from '../../domain/entities/Municipio.js';
import { MunicipioInvalidEstadoError, MunicipioError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMunicipiosByEstadoQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetMunicipiosByEstadoInput {
  estadoId: string;
}

export class GetMunicipiosByEstadoQuery {
  constructor(private municipioRepo: IMunicipioRepository) {}

  async execute(input: GetMunicipiosByEstadoInput, userId?: string): Promise<Municipio[]> {
    try {
      logger.info({
        operation: 'getMunicipiosByEstado',
        estadoId: input.estadoId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando municipios por estado');

      // Validar estadoId
      this.validateEstadoId(input.estadoId);

      const municipios = await this.municipioRepo.findByEstado(input.estadoId);

      logger.info({
        operation: 'getMunicipiosByEstado',
        estadoId: input.estadoId,
        count: municipios.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de municipios por estado completada exitosamente');

      return municipios;
    } catch (error) {
      if (error instanceof MunicipioInvalidEstadoError) {
        throw error;
      }

      logger.error({
        operation: 'getMunicipiosByEstado',
        error: (error as Error).message,
        estadoId: input.estadoId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar municipios por estado');

      throw new MunicipioError('Error interno al consultar municipios', 'MUNICIPIO_QUERY_ERROR', 500);
    }
  }

  private validateEstadoId(estadoId: string): void {
    if (!estadoId || typeof estadoId !== 'string') {
      throw new MunicipioInvalidEstadoError('debe ser una cadena de texto');
    }

    const estadoIdTrimmed = estadoId.trim();
    if (estadoIdTrimmed.length === 0) {
      throw new MunicipioInvalidEstadoError('no puede estar vacío');
    }

    if (estadoIdTrimmed.length !== 2) {
      throw new MunicipioInvalidEstadoError('debe tener exactamente 2 caracteres');
    }

    // Solo permitir letras mayúsculas para códigos de estado
    const estadoRegex = /^[A-Z]{2}$/;
    if (!estadoRegex.test(estadoIdTrimmed)) {
      throw new MunicipioInvalidEstadoError('debe contener solo letras mayúsculas');
    }
  }
}
