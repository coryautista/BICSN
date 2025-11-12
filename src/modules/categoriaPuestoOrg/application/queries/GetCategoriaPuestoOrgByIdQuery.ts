import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { CategoriaPuestoOrg } from '../../domain/entities/CategoriaPuestoOrg.js';
import {
  CategoriaPuestoOrgNotFoundError,
  InvalidCategoriaPuestoOrgDataError,
  CategoriaPuestoOrgQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getCategoriaPuestoOrgByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetCategoriaPuestoOrgByIdQuery {
  constructor(private categoriaPuestoOrgRepo: ICategoriaPuestoOrgRepository) {}

  async execute(categoriaPuestoOrgId: number): Promise<CategoriaPuestoOrg> {
    // Validaciones de entrada
    this.validateInput(categoriaPuestoOrgId);

    const logContext = {
      operation: 'getCategoriaPuestoOrgById',
      categoriaPuestoOrgId: categoriaPuestoOrgId
    };

    logger.info(logContext, 'Consultando categoría de puesto orgánico por ID');

    try {
      const result = await this.categoriaPuestoOrgRepo.findById(categoriaPuestoOrgId);

      if (!result) {
        logger.warn({ ...logContext }, 'Categoría de puesto orgánico no encontrada por ID');
        throw new CategoriaPuestoOrgNotFoundError(categoriaPuestoOrgId);
      }

      logger.info({
        ...logContext,
        categoriaPuestoOrgId: result.categoriaPuestoOrgId,
        nivel: result.nivel,
        org0: result.org0,
        org1: result.org1,
        categoria: result.categoria,
        nombreCategoria: result.nombreCategoria
      }, 'Consulta de categoría de puesto orgánico por ID completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof CategoriaPuestoOrgNotFoundError ||
          error instanceof InvalidCategoriaPuestoOrgDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar categoría de puesto orgánico por ID');

      throw new CategoriaPuestoOrgQueryError('consulta por ID', {
        originalError: error.message,
        categoriaPuestoOrgId: categoriaPuestoOrgId
      });
    }
  }

  private validateInput(categoriaPuestoOrgId: number): void {
    // Validar ID
    if (!categoriaPuestoOrgId || typeof categoriaPuestoOrgId !== 'number' || categoriaPuestoOrgId <= 0) {
      throw new InvalidCategoriaPuestoOrgDataError('categoriaPuestoOrgId', 'Debe ser un número positivo');
    }
  }
}
