import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento } from '../../domain/entities/Movimiento.js';
import { MovimientoInvalidTipoMovimientoError, MovimientoError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMovimientosByTipoMovimientoIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMovimientosByTipoMovimientoIdQuery {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(tipoMovimientoId: number, userId?: string): Promise<Movimiento[]> {
    try {
      logger.info({
        operation: 'getMovimientosByTipoMovimientoId',
        tipoMovimientoId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando movimientos por tipo de movimiento ID');

      // Validar tipoMovimientoId
      this.validateTipoMovimientoId(tipoMovimientoId);

      const movimientos = await this.movimientoRepo.findByTipoMovimientoId(tipoMovimientoId);

      logger.info({
        operation: 'getMovimientosByTipoMovimientoId',
        tipoMovimientoId,
        count: movimientos.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de movimientos por tipo completada exitosamente');

      return movimientos;
    } catch (error) {
      if (error instanceof MovimientoInvalidTipoMovimientoError) {
        throw error;
      }

      logger.error({
        operation: 'getMovimientosByTipoMovimientoId',
        error: (error as Error).message,
        tipoMovimientoId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar movimientos por tipo de movimiento ID');

      throw new MovimientoError('Error interno al consultar movimientos', 'MOVIMIENTO_QUERY_ERROR', 500);
    }
  }

  private validateTipoMovimientoId(tipoMovimientoId: number): void {
    if (!Number.isInteger(tipoMovimientoId) || tipoMovimientoId <= 0) {
      throw new MovimientoInvalidTipoMovimientoError('el ID del tipo de movimiento debe ser un número entero positivo');
    }
  }
}
