import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import { AfiliadoOrg } from '../../domain/entities/AfiliadoOrg.js';
import {
  InvalidAfiliadoOrgDataError,
  AfiliadoOrgQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAfiliadoOrgByAfiliadoIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAfiliadoOrgByAfiliadoIdQuery {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(afiliadoId: number): Promise<AfiliadoOrg[]> {
    // Validaciones de entrada
    this.validateInput(afiliadoId);

    const logContext = {
      operation: 'getAfiliadoOrgByAfiliadoId',
      afiliadoId: afiliadoId
    };

    logger.info(logContext, 'Consultando relaciones afiliado-org por ID de afiliado');

    try {
      const results = await this.afiliadoOrgRepo.findByAfiliadoId(afiliadoId);

      logger.info({
        ...logContext,
        resultsCount: results.length,
        results: results.map(r => ({
          id: r.id,
          claveOrganica0: r.claveOrganica0,
          claveOrganica1: r.claveOrganica1,
          claveOrganica2: r.claveOrganica2,
          claveOrganica3: r.claveOrganica3
        }))
      }, 'Consulta de relaciones afiliado-org por afiliado ID completada exitosamente');

      return results;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar relaciones afiliado-org por afiliado ID');

      throw new AfiliadoOrgQueryError('Error al consultar relaciones afiliado-org por afiliado ID', {
        originalError: error.message,
        afiliadoId: afiliadoId
      });
    }
  }

  private validateInput(afiliadoId: number): void {
    // Validar ID del afiliado
    if (!afiliadoId || afiliadoId <= 0) {
      throw new InvalidAfiliadoOrgDataError('afiliadoId', 'El ID del afiliado es requerido y debe ser positivo');
    }
  }
}
