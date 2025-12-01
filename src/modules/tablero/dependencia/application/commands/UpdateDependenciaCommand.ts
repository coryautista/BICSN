import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia, TipoDependencia } from '../../domain/entities/Dependencia.js';
import { DependenciaNotFoundError, InvalidDependenciaNombreError, InvalidDependenciaDescripcionError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'updateDependenciaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateDependenciaInput {
  dependenciaId: number;
  nombre?: string;
  descripcion?: string;
  tipoDependencia?: TipoDependencia;
  claveDependencia?: string;
  idDependenciaPadre?: number;
  responsable?: string;
  telefono?: string;
  email?: string;
  esActiva?: boolean;
  userId?: string;
}

export class UpdateDependenciaCommand {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(input: UpdateDependenciaInput, tx?: sql.Transaction): Promise<Dependencia> {
    const logContext = {
      operation: 'updateDependencia',
      dependenciaId: input.dependenciaId,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando actualización de dependencia');

    // Validación de entrada
    if (!input.dependenciaId || typeof input.dependenciaId !== 'number' || input.dependenciaId <= 0) {
      throw new DependenciaNotFoundError(input.dependenciaId);
    }

    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new InvalidDependenciaNombreError('', 'El nombre debe ser una cadena de texto');
      }
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new InvalidDependenciaNombreError('', 'El nombre no puede estar vacío');
      }
      if (nombreTrimmed.length > 200) {
        throw new InvalidDependenciaNombreError(nombreTrimmed, 'El nombre no puede tener más de 200 caracteres');
      }
    }

    if (input.descripcion !== undefined) {
      if (typeof input.descripcion !== 'string') {
        throw new InvalidDependenciaDescripcionError('', 'La descripción debe ser una cadena de texto');
      }
      const descripcionTrimmed = input.descripcion.trim();
      if (descripcionTrimmed.length === 0) {
        throw new InvalidDependenciaDescripcionError('', 'La descripción no puede estar vacía');
      }
      if (descripcionTrimmed.length > 1000) {
        throw new InvalidDependenciaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 1000 caracteres');
      }
    }

    if (input.tipoDependencia !== undefined && !['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'].includes(input.tipoDependencia)) {
      throw new Error('Tipo de dependencia inválido');
    }

    if (input.claveDependencia !== undefined) {
      if (typeof input.claveDependencia !== 'string' || input.claveDependencia.trim().length === 0 || input.claveDependencia.length > 20) {
        throw new Error('La clave de dependencia debe tener máximo 20 caracteres');
      }
    }

    // Verificar que la dependencia existe
    const existingDependencia = await this.dependenciaRepo.findById(input.dependenciaId);
    if (!existingDependencia) {
      throw new DependenciaNotFoundError(input.dependenciaId);
    }

    // Validar que la dependencia padre existe si se proporciona
    if (input.idDependenciaPadre !== undefined && input.idDependenciaPadre !== null) {
      const dependenciaPadre = await this.dependenciaRepo.findById(input.idDependenciaPadre);
      if (!dependenciaPadre) {
        throw new DependenciaNotFoundError(input.idDependenciaPadre);
      }
    }

    try {
      const result = await this.dependenciaRepo.update(
        input.dependenciaId,
        input.nombre,
        input.descripcion,
        input.tipoDependencia,
        input.claveDependencia,
        input.idDependenciaPadre,
        input.responsable,
        input.telefono,
        input.email,
        input.esActiva,
        input.userId,
        tx
      );
      if (!result) {
        throw new DependenciaNotFoundError(input.dependenciaId);
      }
      logger.info({ ...logContext, dependenciaId: result.id }, 'Dependencia actualizada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar dependencia');

      if (error instanceof DependenciaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

