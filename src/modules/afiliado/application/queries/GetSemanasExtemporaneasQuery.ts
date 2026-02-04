import { IFormatoExtemporaneaRepository } from '../../domain/repositories/IFormatoExtemporaneaRepository.js';
import { FormatoExtemporanea } from '../../domain/entities/FormatoExtemporanea.js';
import { InvalidAfiliadoDataError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getSemanasExtemporaneasQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetSemanasExtemporaneasFilters {
  org0: string;
  org1: string;
  periodo: number;
}

export class GetSemanasExtemporaneasQuery {
  constructor(private formatoExtemporaneaRepo: IFormatoExtemporaneaRepository) {}

  async execute(filters: GetSemanasExtemporaneasFilters): Promise<FormatoExtemporanea[]> {
    const logContext = {
      operation: 'getSemanasExtemporaneas',
      org0: filters.org0,
      org1: filters.org1,
      periodo: filters.periodo
    };

    if (!filters.org0 || filters.org0.length !== 2) {
      throw new InvalidAfiliadoDataError('org0', 'Org0 debe tener exactamente 2 caracteres');
    }
    if (!filters.org1 || filters.org1.length !== 2) {
      throw new InvalidAfiliadoDataError('org1', 'Org1 debe tener exactamente 2 caracteres');
    }
    if (filters.periodo == null || filters.periodo < 1) {
      throw new InvalidAfiliadoDataError('periodo', 'Periodo (QnaAplica) debe ser un número positivo');
    }

    logger.info(logContext, 'Consultando semanas extemporáneas por org0, org1 y periodo');

    const registros = await this.formatoExtemporaneaRepo.findByOrg0Org1Periodo(
      filters.org0,
      filters.org1,
      filters.periodo
    );

    logger.info({ ...logContext, total: registros.length }, 'Consulta de semanas extemporáneas completada');
    return registros;
  }
}
