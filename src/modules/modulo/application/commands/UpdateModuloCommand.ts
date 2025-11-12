import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import { Modulo, UpdateModuloData } from '../../domain/entities/Modulo.js';
import {
  ModuloNotFoundError,
  ModuloAlreadyExistsError,
  ModuloInvalidNameError,
  ModuloInvalidTypeError,
  ModuloInvalidOrderError,
  ModuloError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateModuloCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateModuloInput {
  id: number;
  nombre?: string;
  tipo?: string;
  icono?: string;
  orden?: number;
}

export class UpdateModuloCommand {
  constructor(private moduloRepo: IModuloRepository) {}

  async execute(input: UpdateModuloInput, userId?: string): Promise<Modulo> {
    try {
      logger.info({
        operation: 'updateModulo',
        moduloId: input.id,
        nombre: input.nombre,
        tipo: input.tipo,
        icono: input.icono,
        orden: input.orden,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando actualización de módulo');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar que el módulo existe
      const existing = await this.moduloRepo.findById(input.id);
      if (!existing) {
        throw new ModuloNotFoundError(input.id);
      }

      // Verificar unicidad del nombre si se está cambiando
      if (input.nombre !== undefined && input.nombre !== existing.nombre) {
        const moduloWithSameName = await this.moduloRepo.findByName(input.nombre);
        if (moduloWithSameName && moduloWithSameName.id !== input.id) {
          throw new ModuloAlreadyExistsError(input.nombre);
        }
      }

      const data: UpdateModuloData = {
        nombre: input.nombre,
        tipo: input.tipo,
        icono: input.icono,
        orden: input.orden
      };

      const updated = await this.moduloRepo.update(input.id, data);

      logger.info({
        operation: 'updateModulo',
        moduloId: updated.id,
        nombre: updated.nombre,
        tipo: updated.tipo,
        orden: updated.orden,
        userId,
        timestamp: new Date().toISOString()
      }, 'Módulo actualizado exitosamente');

      return updated;
    } catch (error) {
      if (error instanceof ModuloNotFoundError ||
          error instanceof ModuloAlreadyExistsError ||
          error instanceof ModuloInvalidNameError ||
          error instanceof ModuloInvalidTypeError ||
          error instanceof ModuloInvalidOrderError) {
        throw error;
      }

      logger.error({
        operation: 'updateModulo',
        error: (error as Error).message,
        moduloId: input.id,
        nombre: input.nombre,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al actualizar módulo');

      throw new ModuloError('Error interno al actualizar módulo', 'MODULO_UPDATE_ERROR', 500);
    }
  }

  private validateInput(input: UpdateModuloInput): void {
    // Validar ID
    if (!Number.isInteger(input.id) || input.id <= 0) {
      throw new ModuloNotFoundError(input.id);
    }

    // Validar nombre si se proporciona
    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new ModuloInvalidNameError('debe ser una cadena de texto');
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
    }

    // Validar tipo si se proporciona
    if (input.tipo !== undefined) {
      if (typeof input.tipo !== 'string') {
        throw new ModuloInvalidTypeError('debe ser una cadena de texto');
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
