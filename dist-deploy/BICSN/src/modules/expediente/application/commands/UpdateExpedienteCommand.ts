import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { UpdateExpedienteData, Expediente } from '../../domain/entities/Expediente.js';
import {
  ExpedienteNotFoundError,
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateExpedienteCommand',
  level: process.env.LOG_LEVEL || 'info'
});

const ESTADOS_VALIDOS = ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'COMPLETADO', 'RECHAZADO'];

export class UpdateExpedienteCommand {
  constructor(private expedienteRepo: IExpedienteRepository) {}

  async execute(data: UpdateExpedienteData, userId?: string): Promise<Expediente> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateExpediente',
      curp: data.curp,
      estado: data.estado,
      afiliadoId: data.afiliadoId,
      interno: data.interno,
      userId: userId
    };

    logger.info(logContext, 'Actualizando expediente');

    try {
      const expediente = await this.expedienteRepo.update(data, userId);

      logger.info({
        ...logContext,
        updated: true
      }, 'Expediente actualizado exitosamente');

      return expediente;

    } catch (error: any) {
      if (error instanceof ExpedienteNotFoundError ||
          error instanceof InvalidExpedienteDataError ||
          error instanceof InvalidCURPError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar expediente');

      throw new ExpedienteCommandError('actualización', {
        originalError: error.message,
        curp: data.curp,
        userId: userId
      });
    }
  }

  private validateInput(data: UpdateExpedienteData): void {
    // Validar CURP
    if (!data.curp || typeof data.curp !== 'string') {
      throw new InvalidExpedienteDataError('curp', 'Es requerida y debe ser una cadena de texto');
    }

    // Validar formato de CURP (18 caracteres alfanuméricos)
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(data.curp)) {
      throw new InvalidCURPError(data.curp);
    }

    // Validar estado si se proporciona
    if (data.estado !== undefined) {
      if (typeof data.estado !== 'string') {
        throw new InvalidExpedienteDataError('estado', 'Debe ser una cadena de texto');
      }
      if (!ESTADOS_VALIDOS.includes(data.estado)) {
        throw new InvalidExpedienteDataError('estado', `Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
      }
    }

    // Validar afiliadoId si se proporciona
    if (data.afiliadoId !== undefined) {
      if (data.afiliadoId !== null && (typeof data.afiliadoId !== 'number' || data.afiliadoId <= 0)) {
        throw new InvalidExpedienteDataError('afiliadoId', 'Debe ser un número positivo o null');
      }
    }

    // Validar interno si se proporciona
    if (data.interno !== undefined) {
      if (data.interno !== null && (typeof data.interno !== 'number' || data.interno <= 0)) {
        throw new InvalidExpedienteDataError('interno', 'Debe ser un número positivo o null');
      }
    }

    // Validar notas si se proporciona
    if (data.notas !== undefined) {
      if (data.notas !== null && typeof data.notas !== 'string') {
        throw new InvalidExpedienteDataError('notas', 'Debe ser una cadena de texto o null');
      }
      if (data.notas && data.notas.length > 1000) {
        throw new InvalidExpedienteDataError('notas', 'No debe exceder 1000 caracteres');
      }
    }
  }
}
