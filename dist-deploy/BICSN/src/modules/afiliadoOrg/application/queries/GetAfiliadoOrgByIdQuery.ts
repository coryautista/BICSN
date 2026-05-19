import { IAfiliadoOrgRepository } from '../../domain/repositories/IAfiliadoOrgRepository.js';
import { AfiliadoOrg } from '../../domain/entities/AfiliadoOrg.js';
import {
  AfiliadoOrgNotFoundError,
  InvalidAfiliadoOrgDataError,
  AfiliadoOrgQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAfiliadoOrgByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAfiliadoOrgByIdQuery {
  constructor(private afiliadoOrgRepo: IAfiliadoOrgRepository) {}

  async execute(id: number): Promise<AfiliadoOrg> {
    // Validaciones de entrada
    this.validateInput(id);

    const logContext = {
      operation: 'getAfiliadoOrgById',
      id: id
    };

    logger.info(logContext, 'Consultando relación afiliado-org por ID');

    try {
      const result = await this.afiliadoOrgRepo.findById(id);

      if (!result) {
        logger.warn({ ...logContext, afiliadoOrgId: id }, 'Relación afiliado-org no encontrada por ID');
        throw new AfiliadoOrgNotFoundError({ id });
      }

      logger.info({
        ...logContext,
        afiliadoOrgId: result.id,
        afiliadoId: result.afiliadoId,
        claveOrganica0: result.claveOrganica0
      }, 'Consulta de relación afiliado-org por ID completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof AfiliadoOrgNotFoundError ||
          error instanceof InvalidAfiliadoOrgDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar relación afiliado-org por ID');

      throw new AfiliadoOrgQueryError('Error al consultar relación afiliado-org por ID', {
        originalError: error.message,
        id: id
      });
    }
  }

  private validateInput(id: number): void {
    // Validar ID
    if (!id || id <= 0) {
      throw new InvalidAfiliadoOrgDataError('id', 'El ID es requerido y debe ser positivo');
    }
  }
}
