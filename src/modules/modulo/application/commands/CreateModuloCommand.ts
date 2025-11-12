import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import { Modulo, CreateModuloData } from '../../domain/entities/Modulo.js';
import {
  ModuloAlreadyExistsError,
  ModuloInvalidNameError,
  ModuloInvalidTypeError,
  ModuloInvalidOrderError,
  ModuloError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createModuloCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateModuloInput {
  nombre: string;
  tipo: string;
  icono?: string;
  orden?: number;
}

export class CreateModuloCommand {
  constructor(private moduloRepo: IModuloRepository) {}

  async execute(input: CreateModuloInput, userId?: string): Promise<Modulo> {
    try {
      logger.info({
        operation: 'createModulo',
        nombre: input.nombre,
        tipo: input.tipo,
        icono: input.icono,
        orden: input.orden,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando creación de módulo');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar que no exista un módulo con el mismo nombre
      const existingModulo = await this.moduloRepo.findByName(input.nombre);
      if (existingModulo) {
        throw new ModuloAlreadyExistsError(input.nombre);
      }

      // Crear datos del módulo
      const data: CreateModuloData = {
        nombre: input.nombre,
        tipo: input.tipo,
        icono: input.icono ?? null,
        orden: input.orden ?? 0
      };

      // Crear módulo
      const modulo = await this.moduloRepo.create(data);

      logger.info({
        operation: 'createModulo',
        moduloId: modulo.id,
        nombre: modulo.nombre,
        tipo: modulo.tipo,
        orden: modulo.orden,
        userId,
        timestamp: new Date().toISOString()
      }, 'Módulo creado exitosamente');

      return modulo;
    } catch (error) {
      if (error instanceof ModuloAlreadyExistsError ||
          error instanceof ModuloInvalidNameError ||
          error instanceof ModuloInvalidTypeError ||
          error instanceof ModuloInvalidOrderError) {
        throw error;
      }

      logger.error({
        operation: 'createModulo',
        error: (error as Error).message,
        nombre: input.nombre,
        tipo: input.tipo,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al crear módulo');

      throw new ModuloError('Error interno al crear módulo', 'MODULO_CREATE_ERROR', 500);
    }
  }

  private validateInput(input: CreateModuloInput): void {
    // Validar nombre
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new ModuloInvalidNameError('es requerido y debe ser una cadena de texto');
    }

    const nombreTrimmed = input.nombre.trim();
    if (nombreTrimmed.length === 0) {
      throw new ModuloInvalidNameError('no puede estar vacío');
    }

    if (nombreTrimmed.length > 100) {
      throw new ModuloInvalidNameError('no puede tener más de 100 caracteres');
    }

    // Solo permitir letras, números, espacios y algunos caracteres especiales
    const nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
    if (!nombreRegex.test(nombreTrimmed)) {
      throw new ModuloInvalidNameError('solo puede contener letras, números, espacios, guiones y guiones bajos');
    }

    // Validar tipo
    if (!input.tipo || typeof input.tipo !== 'string') {
      throw new ModuloInvalidTypeError('es requerido y debe ser una cadena de texto');
    }

    const tipoTrimmed = input.tipo.trim();
    if (tipoTrimmed.length === 0) {
      throw new ModuloInvalidTypeError('no puede estar vacío');
    }

    if (tipoTrimmed.length > 50) {
      throw new ModuloInvalidTypeError('no puede tener más de 50 caracteres');
    }

    // Tipos permitidos
    const tiposPermitidos = ['sistema', 'usuario', 'admin', 'reporte', 'configuracion'];
    if (!tiposPermitidos.includes(tipoTrimmed.toLowerCase())) {
      throw new ModuloInvalidTypeError(`debe ser uno de: ${tiposPermitidos.join(', ')}`);
    }

    // Validar orden si se proporciona
    if (input.orden !== undefined) {
      if (!Number.isInteger(input.orden)) {
        throw new ModuloInvalidOrderError('debe ser un número entero');
      }

      if (input.orden < 0) {
        throw new ModuloInvalidOrderError('no puede ser negativo');
      }

      if (input.orden > 9999) {
        throw new ModuloInvalidOrderError('no puede ser mayor a 9999');
      }
    }

    // Validar icono si se proporciona
    if (input.icono !== undefined) {
      if (typeof input.icono !== 'string') {
        throw new ModuloInvalidTypeError('el icono debe ser una cadena de texto');
      }

      const iconoTrimmed = input.icono.trim();
      if (iconoTrimmed.length > 50) {
        throw new ModuloInvalidTypeError('el icono no puede tener más de 50 caracteres');
      }
    }
  }
}
