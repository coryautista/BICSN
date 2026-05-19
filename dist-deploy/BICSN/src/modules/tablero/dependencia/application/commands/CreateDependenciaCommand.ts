import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia, TipoDependencia } from '../../domain/entities/Dependencia.js';
import { DependenciaAlreadyExistsError, InvalidDependenciaNombreError, InvalidDependenciaDescripcionError, DependenciaNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'createDependenciaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateDependenciaInput {
  nombre: string;
  descripcion: string;
  tipoDependencia: TipoDependencia;
  claveDependencia: string;
  idDependenciaPadre?: number;
  responsable?: string;
  telefono?: string;
  email?: string;
  esActiva?: boolean;
  userId?: string;
}

export class CreateDependenciaCommand {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(input: CreateDependenciaInput, tx?: sql.Transaction): Promise<Dependencia> {
    const logContext = {
      operation: 'createDependencia',
      nombre: input.nombre,
      tipoDependencia: input.tipoDependencia,
      userId: input.userId
    };

    logger.info(logContext, 'Iniciando creación de dependencia');

    // Validación de entrada
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new InvalidDependenciaNombreError('', 'El nombre es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new InvalidDependenciaNombreError('', 'El nombre no puede estar vacío');
    }

    if (nombreTrimmed.length > 200) {
      throw new InvalidDependenciaNombreError(nombreTrimmed, 'El nombre no puede tener más de 200 caracteres');
    }

    if (!input.descripcion || typeof input.descripcion !== 'string') {
      throw new InvalidDependenciaDescripcionError('', 'La descripción es requerida y debe ser una cadena de texto');
    }

    const descripcionTrimmed = input.descripcion.trim();
    if (descripcionTrimmed.length === 0) {
      throw new InvalidDependenciaDescripcionError('', 'La descripción no puede estar vacía');
    }

    if (descripcionTrimmed.length > 1000) {
      throw new InvalidDependenciaDescripcionError(descripcionTrimmed, 'La descripción no puede tener más de 1000 caracteres');
    }

    if (!input.tipoDependencia || !['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'].includes(input.tipoDependencia)) {
      throw new Error('Tipo de dependencia inválido');
    }

    if (!input.claveDependencia || typeof input.claveDependencia !== 'string' || input.claveDependencia.trim().length === 0 || input.claveDependencia.length > 20) {
      throw new Error('La clave de dependencia es requerida y debe tener máximo 20 caracteres');
    }

    // Validar que la dependencia padre existe si se proporciona
    if (input.idDependenciaPadre !== undefined && input.idDependenciaPadre !== null) {
      const dependenciaPadre = await this.dependenciaRepo.findById(input.idDependenciaPadre);
      if (!dependenciaPadre) {
        throw new DependenciaNotFoundError(input.idDependenciaPadre);
      }
    }

    try {
      const result = await this.dependenciaRepo.create(
        nombreTrimmed,
        descripcionTrimmed,
        input.tipoDependencia,
        input.claveDependencia.trim(),
        input.idDependenciaPadre,
        input.responsable?.trim(),
        input.telefono?.trim(),
        input.email?.trim(),
        input.esActiva ?? true,
        input.userId,
        tx
      );
      logger.info({ ...logContext, dependenciaId: result.id }, 'Dependencia creada exitosamente');
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear dependencia');

      if (errorMessage.includes('FOREIGN KEY constraint') && errorMessage.includes('idDependenciaPadre')) {
        throw new DependenciaNotFoundError(input.idDependenciaPadre!);
      }

      if (errorMessage.includes('Violation of PRIMARY KEY constraint') || 
          errorMessage.includes('duplicate key')) {
        throw new DependenciaAlreadyExistsError(nombreTrimmed);
      }
      throw error;
    }
  }
}

