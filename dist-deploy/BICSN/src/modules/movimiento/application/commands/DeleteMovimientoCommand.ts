import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import {
  MovimientoNotFoundError,
  MovimientoInvalidTipoMovimientoError,
  MovimientoCannotDeleteError,
  MovimientoError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteMovimientoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteMovimientoCommand {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(id: number, userId?: string): Promise<void> {
    try {
      logger.info({
        operation: 'deleteMovimiento',
        movimientoId: id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando eliminación de movimiento');

      // Validar ID
      this.validateId(id);

      // Verificar que el movimiento existe
      const movimiento = await this.movimientoRepo.findById(id);
      if (!movimiento) {
        throw new MovimientoNotFoundError(id);
      }

      // Validar que se puede eliminar (por ejemplo, verificar estatus)
      this.validateCanDelete(movimiento);

      // Eliminar movimiento
      await this.movimientoRepo.delete(id);

      logger.info({
        operation: 'deleteMovimiento',
        movimientoId: id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        folio: movimiento.folio,
        userId,
        timestamp: new Date().toISOString()
      }, 'Movimiento eliminado exitosamente');
    } catch (error) {
      if (error instanceof MovimientoNotFoundError ||
          error instanceof MovimientoInvalidTipoMovimientoError ||
          error instanceof MovimientoCannotDeleteError) {
        throw error;
      }

      logger.error({
        operation: 'deleteMovimiento',
        error: (error as Error).message,
        movimientoId: id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al eliminar movimiento');

      throw new MovimientoError('Error interno al eliminar movimiento', 'MOVIMIENTO_DELETE_ERROR', 500);
    }
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new MovimientoInvalidTipoMovimientoError('el ID debe ser un número entero positivo');
    }
  }

  private validateCanDelete(movimiento: any): void {
    // Por ejemplo, no permitir eliminar movimientos con estatus 'procesado'
    if (movimiento.estatus?.toLowerCase() === 'procesado') {
      throw new MovimientoCannotDeleteError(movimiento.id, movimiento.estatus);
    }
  }
}
