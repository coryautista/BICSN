import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { CreateExpedienteData, Expediente } from '../../domain/entities/Expediente.js';
import {
  ExpedienteNotFoundError,
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteCommandError,
  DuplicateExpedienteError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createExpedienteCommand',
  level: process.env.LOG_LEVEL || 'info'
});

const ESTADOS_VALIDOS = ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'COMPLETADO', 'RECHAZADO'];

export class CreateExpedienteCommand {
  constructor(private expedienteRepo: IExpedienteRepository) {}

  async execute(data: CreateExpedienteData, userId?: string): Promise<Expediente> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createExpediente',
      curp: data.curp,
      estado: data.estado,
      afiliadoId: data.afiliadoId,
      interno: data.interno,
      userId: userId
    };

    logger.info(logContext, 'Creando expediente');

    try {
      const expediente = await this.expedienteRepo.create(data, userId);

      logger.info({
        ...logContext,
        created: true
      }, 'Expediente creado exitosamente');

      return expediente;

    } catch (error: any) {
      if (error instanceof ExpedienteNotFoundError ||
          error instanceof InvalidExpedienteDataError ||
          error instanceof InvalidCURPError ||
          error instanceof DuplicateExpedienteError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear expediente');

      throw new ExpedienteCommandError('creación', {
        originalError: error.message,
        curp: data.curp,
        userId: userId
      });
    }
  }

  private validateInput(data: CreateExpedienteData): void {
    // Validar CURP
    if (!data.curp || typeof data.curp !== 'string') {
      throw new InvalidExpedienteDataError('curp', 'Es requerida y debe ser una cadena de texto');
    }

    // Validar formato de CURP (18 caracteres alfanuméricos)
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(data.curp)) {
      throw new InvalidCURPError(data.curp);
    }

    // Validar estado
    if (!data.estado || typeof data.estado !== 'string') {
      throw new InvalidExpedienteDataError('estado', 'Es requerido y debe ser una cadena de texto');
    }

    if (!ESTADOS_VALIDOS.includes(data.estado)) {
      throw new InvalidExpedienteDataError('estado', `Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    // Validar afiliadoId si se proporciona
    if (data.afiliadoId !== null && data.afiliadoId !== undefined) {
      if (typeof data.afiliadoId !== 'number' || data.afiliadoId <= 0) {
        throw new InvalidExpedienteDataError('afiliadoId', 'Debe ser un número positivo o null');
      }
    }

    // Validar interno si se proporciona
    if (data.interno !== null && data.interno !== undefined) {
      if (typeof data.interno !== 'number' || data.interno <= 0) {
        throw new InvalidExpedienteDataError('interno', 'Debe ser un número positivo o null');
      }
    }

    // Validar notas si se proporciona
    if (data.notas !== null && data.notas !== undefined) {
      if (typeof data.notas !== 'string') {
        throw new InvalidExpedienteDataError('notas', 'Debe ser una cadena de texto o null');
      }
      if (data.notas.length > 1000) {
        throw new InvalidExpedienteDataError('notas', 'No debe exceder 1000 caracteres');
      }
    }
  }
}
