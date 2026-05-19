import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento, UpdateMovimientoData } from '../../domain/entities/Movimiento.js';
import {
  MovimientoNotFoundError,
  MovimientoAlreadyExistsError,
  MovimientoInvalidTipoMovimientoError,
  MovimientoInvalidAfiliadoError,
  MovimientoInvalidFechaError,
  MovimientoInvalidFolioError,
  MovimientoInvalidEstatusError,
  MovimientoInvalidCreadorError,
  MovimientoError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateMovimientoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateMovimientoCommand {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(data: UpdateMovimientoData, userId?: string): Promise<Movimiento> {
    try {
      logger.info({
        operation: 'updateMovimiento',
        movimientoId: data.id,
        tipoMovimientoId: data.tipoMovimientoId,
        afiliadoId: data.afiliadoId,
        folio: data.folio,
        estatus: data.estatus,
        fecha: data.fecha,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando actualización de movimiento');

      // Verificar que el movimiento existe
      const existingMovimiento = await this.movimientoRepo.findById(data.id);
      if (!existingMovimiento) {
        throw new MovimientoNotFoundError(data.id);
      }

      // Validaciones de entrada
      this.validateInput(data);

      // Verificar unicidad del folio si se está cambiando
      if (data.folio && data.folio !== existingMovimiento.folio) {
        const movimientoWithFolio = await this.movimientoRepo.findByFolio(data.folio);
        if (movimientoWithFolio) {
          throw new MovimientoAlreadyExistsError(data.folio);
        }
      }

      // Actualizar movimiento
      const movimiento = await this.movimientoRepo.update(data);

      logger.info({
        operation: 'updateMovimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        folio: movimiento.folio,
        estatus: movimiento.estatus,
        userId,
        timestamp: new Date().toISOString()
      }, 'Movimiento actualizado exitosamente');

      return movimiento;
    } catch (error) {
      if (error instanceof MovimientoNotFoundError ||
          error instanceof MovimientoAlreadyExistsError ||
          error instanceof MovimientoInvalidTipoMovimientoError ||
          error instanceof MovimientoInvalidAfiliadoError ||
          error instanceof MovimientoInvalidFechaError ||
          error instanceof MovimientoInvalidFolioError ||
          error instanceof MovimientoInvalidEstatusError ||
          error instanceof MovimientoInvalidCreadorError) {
        throw error;
      }

      logger.error({
        operation: 'updateMovimiento',
        error: (error as Error).message,
        movimientoId: data.id,
        tipoMovimientoId: data.tipoMovimientoId,
        afiliadoId: data.afiliadoId,
        folio: data.folio,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al actualizar movimiento');

      throw new MovimientoError('Error interno al actualizar movimiento', 'MOVIMIENTO_UPDATE_ERROR', 500);
    }
  }

  private validateInput(data: UpdateMovimientoData): void {
    // Validar tipoMovimientoId si se proporciona
    if (data.tipoMovimientoId !== undefined) {
      if (!Number.isInteger(data.tipoMovimientoId) || data.tipoMovimientoId <= 0) {
        throw new MovimientoInvalidTipoMovimientoError('debe ser un número entero positivo');
      }
    }

    // Validar afiliadoId si se proporciona
    if (data.afiliadoId !== undefined) {
      if (!Number.isInteger(data.afiliadoId) || data.afiliadoId <= 0) {
        throw new MovimientoInvalidAfiliadoError('debe ser un número entero positivo');
      }
    }

    // Validar fecha si se proporciona
    if (data.fecha !== undefined) {
      if (typeof data.fecha !== 'string') {
        throw new MovimientoInvalidFechaError('debe ser una cadena de texto');
      }

      const fechaDate = new Date(data.fecha);
      if (isNaN(fechaDate.getTime())) {
        throw new MovimientoInvalidFechaError('tiene un formato inválido');
      }

      // Verificar que no sea una fecha futura
      const now = new Date();
      if (fechaDate > now) {
        throw new MovimientoInvalidFechaError('no puede ser una fecha futura');
      }
    }

    // Validar folio si se proporciona
    if (data.folio !== undefined) {
      if (typeof data.folio !== 'string') {
        throw new MovimientoInvalidFolioError('debe ser una cadena de texto');
      }

      const folioTrimmed = data.folio.trim();
      if (folioTrimmed.length === 0) {
        throw new MovimientoInvalidFolioError('no puede estar vacío');
      }

      if (folioTrimmed.length > 50) {
        throw new MovimientoInvalidFolioError('no puede tener más de 50 caracteres');
      }

      // Solo permitir letras, números y algunos caracteres especiales
      const folioRegex = /^[a-zA-Z0-9\-_\/]+$/;
      if (!folioRegex.test(folioTrimmed)) {
        throw new MovimientoInvalidFolioError('solo puede contener letras, números, guiones y barras');
      }
    }

    // Validar estatus si se proporciona
    if (data.estatus !== undefined) {
      if (typeof data.estatus !== 'string') {
        throw new MovimientoInvalidEstatusError('debe ser una cadena de texto');
      }

      const estatusTrimmed = data.estatus.trim();
      if (estatusTrimmed.length > 20) {
        throw new MovimientoInvalidEstatusError('no puede tener más de 20 caracteres');
      }

      // Estatus permitidos
      const estatusPermitidos = ['activo', 'inactivo', 'pendiente', 'procesado', 'cancelado'];
      if (estatusTrimmed.length > 0 && !estatusPermitidos.includes(estatusTrimmed.toLowerCase())) {
        throw new MovimientoInvalidEstatusError(`debe ser uno de: ${estatusPermitidos.join(', ')}`);
      }
    }

    // Validar creadoPor si se proporciona
    if (data.creadoPor !== undefined) {
      if (data.creadoPor === null || !Number.isInteger(data.creadoPor) || data.creadoPor <= 0) {
        throw new MovimientoInvalidCreadorError('debe ser un número entero positivo');
      }
    }

    // Validar creadoPorUid si se proporciona
    if (data.creadoPorUid !== undefined) {
      if (typeof data.creadoPorUid !== 'string') {
        throw new MovimientoInvalidCreadorError('el UID debe ser una cadena de texto');
      }

      const uidTrimmed = data.creadoPorUid.trim();
      if (uidTrimmed.length > 50) {
        throw new MovimientoInvalidCreadorError('el UID no puede tener más de 50 caracteres');
      }
    }

    // Validar observaciones si se proporciona
    if (data.observaciones !== undefined) {
      if (typeof data.observaciones !== 'string') {
        throw new MovimientoInvalidTipoMovimientoError('las observaciones deben ser una cadena de texto');
      }

      if (data.observaciones.length > 500) {
        throw new MovimientoInvalidTipoMovimientoError('las observaciones no pueden tener más de 500 caracteres');
      }
    }
  }
}
