import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import { AfiliadoOrg } from '../../domain/entities/AfiliadoOrg.js';
import {
  AfiliadoOrgQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllAfiliadoOrgQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllAfiliadoOrgQuery {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(): Promise<AfiliadoOrg[]> {
    const logContext = {
      operation: 'getAllAfiliadoOrg'
    };

    logger.info(logContext, 'Consultando todas las relaciones afiliado-org');

    try {
      const result = await this.afiliadoOrgRepo.findAll();

      logger.info({
        ...logContext,
        resultCount: result.length
      }, 'Consulta de todas las relaciones afiliado-org completada exitosamente');

      return result;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todas las relaciones afiliado-org');

      throw new AfiliadoOrgQueryError('Error al consultar todas las relaciones afiliado-org', {
        originalError: error.message
      });
    }
  }
}
