import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { Movimiento, CreateMovimientoData } from '../../domain/entities/Movimiento.js';
import {
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
  name: 'createMovimientoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateMovimientoCommand {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(data: CreateMovimientoData, userId?: string): Promise<Movimiento> {
    try {
      logger.info({
        operation: 'createMovimiento',
        tipoMovimientoId: data.tipoMovimientoId,
        afiliadoId: data.afiliadoId,
        folio: data.folio,
        estatus: data.estatus,
        fecha: data.fecha,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando creación de movimiento');

      // Validaciones de entrada
      this.validateInput(data);

      // Verificar unicidad del folio si se proporciona
      if (data.folio) {
        const existingMovimiento = await this.movimientoRepo.findByFolio(data.folio);
        if (existingMovimiento) {
          throw new MovimientoAlreadyExistsError(data.folio);
        }
      }

      // Crear movimiento
      const movimiento = await this.movimientoRepo.create(data);

      logger.info({
        operation: 'createMovimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        folio: movimiento.folio,
        estatus: movimiento.estatus,
        userId,
        timestamp: new Date().toISOString()
      }, 'Movimiento creado exitosamente');

      return movimiento;
    } catch (error) {
      if (error instanceof MovimientoAlreadyExistsError ||
          error instanceof MovimientoInvalidTipoMovimientoError ||
          error instanceof MovimientoInvalidAfiliadoError ||
          error instanceof MovimientoInvalidFechaError ||
          error instanceof MovimientoInvalidFolioError ||
          error instanceof MovimientoInvalidEstatusError ||
          error instanceof MovimientoInvalidCreadorError) {
        throw error;
      }

      logger.error({
        operation: 'createMovimiento',
        error: (error as Error).message,
        tipoMovimientoId: data.tipoMovimientoId,
        afiliadoId: data.afiliadoId,
        folio: data.folio,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al crear movimiento');

      throw new MovimientoError('Error interno al crear movimiento', 'MOVIMIENTO_CREATE_ERROR', 500);
    }
  }

  private validateInput(data: CreateMovimientoData): void {
    // Validar tipoMovimientoId
    if (!Number.isInteger(data.tipoMovimientoId) || data.tipoMovimientoId <= 0) {
      throw new MovimientoInvalidTipoMovimientoError('debe ser un número entero positivo');
    }

    // Validar afiliadoId
    if (!Number.isInteger(data.afiliadoId) || data.afiliadoId <= 0) {
      throw new MovimientoInvalidAfiliadoError('debe ser un número entero positivo');
    }

    // Validar fecha si se proporciona
    if (data.fecha !== undefined && data.fecha !== null) {
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
    if (data.folio !== undefined && data.folio !== null) {
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
    if (data.estatus !== undefined && data.estatus !== null) {
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
    if (data.creadoPor !== undefined && data.creadoPor !== null) {
      if (!Number.isInteger(data.creadoPor) || data.creadoPor <= 0) {
        throw new MovimientoInvalidCreadorError('debe ser un número entero positivo');
      }
    }

    // Validar creadoPorUid si se proporciona
    if (data.creadoPorUid !== undefined && data.creadoPorUid !== null) {
      if (typeof data.creadoPorUid !== 'string') {
        throw new MovimientoInvalidCreadorError('el UID debe ser una cadena de texto');
      }

      const uidTrimmed = data.creadoPorUid.trim();
      if (uidTrimmed.length > 50) {
        throw new MovimientoInvalidCreadorError('el UID no puede tener más de 50 caracteres');
      }
    }

    // Validar observaciones si se proporciona
    if (data.observaciones !== undefined && data.observaciones !== null) {
      if (typeof data.observaciones !== 'string') {
        throw new MovimientoInvalidTipoMovimientoError('las observaciones deben ser una cadena de texto');
      }

      if (data.observaciones.length > 500) {
        throw new MovimientoInvalidTipoMovimientoError('las observaciones no pueden tener más de 500 caracteres');
      }
    }
  }
}
