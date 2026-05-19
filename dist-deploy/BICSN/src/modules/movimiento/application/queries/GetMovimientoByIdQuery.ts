import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento } from '../../domain/entities/Movimiento.js';
import {
  MovimientoNotFoundError,
  MovimientoInvalidTipoMovimientoError,
  MovimientoError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMovimientoByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMovimientoByIdQuery {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(id: number, userId?: string): Promise<Movimiento> {
    try {
      logger.info({
        operation: 'getMovimientoById',
        movimientoId: id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando movimiento por ID');

      // Validar ID
      this.validateId(id);

      const movimiento = await this.movimientoRepo.findById(id);
      if (!movimiento) {
        throw new MovimientoNotFoundError(id);
      }

      logger.info({
        operation: 'getMovimientoById',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        folio: movimiento.folio,
        userId,
        timestamp: new Date().toISOString()
      }, 'Movimiento encontrado exitosamente');

      return movimiento;
    } catch (error) {
      if (error instanceof MovimientoNotFoundError ||
          error instanceof MovimientoInvalidTipoMovimientoError) {
        throw error;
      }

      logger.error({
        operation: 'getMovimientoById',
        error: (error as Error).message,
        movimientoId: id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar movimiento por ID');

      throw new MovimientoError('Error interno al consultar movimiento', 'MOVIMIENTO_QUERY_ERROR', 500);
    }
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new MovimientoInvalidTipoMovimientoError('el ID debe ser un número entero positivo');
    }
  }
}
