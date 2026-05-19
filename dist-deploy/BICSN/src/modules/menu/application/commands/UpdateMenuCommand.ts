import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { Menu, UpdateMenuData } from '../../domain/entities/Menu.js';
import {
  MenuNotFoundError,
  MenuAlreadyExistsError,
  MenuInvalidNameError,
  MenuInvalidComponentError,
  MenuInvalidOrderError,
  MenuInvalidParentError,
  MenuHierarchyCycleError,
  MenuError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateMenuCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface UpdateMenuInput {
  id: number;
  nombre?: string;
  componente?: string;
  parentId?: number;
  icono?: string;
  orden?: number;
}

export class UpdateMenuCommand {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(input: UpdateMenuInput, userId?: string): Promise<Menu> {
    try {
      logger.info({
        operation: 'updateMenu',
        menuId: input.id,
        nombre: input.nombre,
        componente: input.componente,
        parentId: input.parentId,
        icono: input.icono,
        orden: input.orden,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando actualización de menú');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar que el menú existe
      const existing = await this.menuRepo.findById(input.id);
      if (!existing) {
        throw new MenuNotFoundError(input.id);
      }

      // Verificar unicidad del nombre si se está cambiando
      if (input.nombre !== undefined && input.nombre !== existing.nombre) {
        const menuWithSameName = await this.menuRepo.findByName(input.nombre);
        if (menuWithSameName && menuWithSameName.id !== input.id) {
          throw new MenuAlreadyExistsError(input.nombre);
        }
      }

      // Validar parentId si se proporciona
      if (input.parentId !== undefined) {
        if (input.parentId !== null) {
          const parent = await this.menuRepo.findById(input.parentId);
          if (!parent) {
            throw new MenuInvalidParentError(input.parentId);
          }

          // Verificar que no se cree un ciclo en la jerarquía
          await this.validateHierarchyCycle(input.parentId, input.id);
        }
      }

      // Preparar datos de actualización
      const updateData: UpdateMenuData = {
        nombre: input.nombre,
        componente: input.componente,
        parentId: input.parentId,
        icono: input.icono,
        orden: input.orden
      };

      // Actualizar menú
      const updated = await this.menuRepo.update(input.id, updateData);
      if (!updated) {
        throw new MenuError('Error interno al actualizar menú', 'MENU_UPDATE_ERROR', 500);
      }

      logger.info({
        operation: 'updateMenu',
        menuId: updated.id,
        nombre: updated.nombre,
        orden: updated.orden,
        parentId: updated.parentId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Menú actualizado exitosamente');

      return updated;
    } catch (error) {
      if (error instanceof MenuNotFoundError ||
          error instanceof MenuAlreadyExistsError ||
          error instanceof MenuInvalidNameError ||
          error instanceof MenuInvalidComponentError ||
          error instanceof MenuInvalidOrderError ||
          error instanceof MenuInvalidParentError ||
          error instanceof MenuHierarchyCycleError) {
        throw error;
      }

      logger.error({
        operation: 'updateMenu',
        error: (error as Error).message,
        menuId: input.id,
        nombre: input.nombre,
        parentId: input.parentId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al actualizar menú');

      throw new MenuError('Error interno al actualizar menú', 'MENU_UPDATE_ERROR', 500);
    }
  }

  private validateInput(input: UpdateMenuInput): void {
    // Validar ID
    if (!Number.isInteger(input.id) || input.id <= 0) {
      throw new MenuInvalidParentError(input.id);
    }

    // Validar nombre si se proporciona
    if (input.nombre !== undefined) {
      if (typeof input.nombre !== 'string') {
        throw new MenuInvalidNameError('debe ser una cadena de texto');
      }

      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new MenuInvalidNameError('no puede estar vacío');
      }

      if (nombreTrimmed.length > 100) {
        throw new MenuInvalidNameError('no puede tener más de 100 caracteres');
      }

      // Solo permitir letras, números, espacios y algunos caracteres especiales
      const nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
      if (!nombreRegex.test(nombreTrimmed)) {
        throw new MenuInvalidNameError('solo puede contener letras, números, espacios, guiones y guiones bajos');
      }
    }

    // Validar componente si se proporciona
    if (input.componente !== undefined) {
      if (input.componente !== null && typeof input.componente !== 'string') {
        throw new MenuInvalidComponentError('debe ser una cadena de texto o null');
      }

      if (input.componente !== null) {
        const componenteTrimmed = input.componente.trim();
        if (componenteTrimmed.length > 200) {
          throw new MenuInvalidComponentError('no puede tener más de 200 caracteres');
        }

        // Validar formato de componente (debe ser un path válido)
        const componenteRegex = /^[a-zA-Z0-9\-_\/\.]+$/;
        if (componenteTrimmed.length > 0 && !componenteRegex.test(componenteTrimmed)) {
          throw new MenuInvalidComponentError('tiene un formato inválido');
        }
      }
    }

    // Validar orden si se proporciona
    if (input.orden !== undefined) {
      if (!Number.isInteger(input.orden)) {
        throw new MenuInvalidOrderError('debe ser un número entero');
      }

      if (input.orden < 0) {
        throw new MenuInvalidOrderError('no puede ser negativo');
      }

      if (input.orden > 9999) {
        throw new MenuInvalidOrderError('no puede ser mayor a 9999');
      }
    }

    // Validar parentId si se proporciona
    if (input.parentId !== undefined) {
      if (input.parentId !== null) {
        if (!Number.isInteger(input.parentId) || input.parentId <= 0) {
          throw new MenuInvalidParentError(input.parentId);
        }
      }
    }

    // Validar icono si se proporciona
    if (input.icono !== undefined) {
      if (input.icono !== null && typeof input.icono !== 'string') {
        throw new MenuInvalidComponentError('el icono debe ser una cadena de texto o null');
      }

      if (input.icono !== null) {
        const iconoTrimmed = input.icono.trim();
        if (iconoTrimmed.length > 50) {
          throw new MenuInvalidComponentError('el icono no puede tener más de 50 caracteres');
        }
      }
    }
  }

  private async validateHierarchyCycle(parentId: number, currentMenuId: number): Promise<void> {
    let currentParentId: number | null = parentId;
    const visitedIds = new Set<number>();

    while (currentParentId !== null) {
      if (visitedIds.has(currentParentId)) {
        throw new MenuHierarchyCycleError(currentMenuId, parentId);
      }

      if (currentParentId === currentMenuId) {
        throw new MenuHierarchyCycleError(currentMenuId, parentId);
      }

      visitedIds.add(currentParentId);

      const parentMenu = await this.menuRepo.findById(currentParentId);
      if (!parentMenu) {
        break; // El padre no existe, pero esto ya se valida antes
      }

      currentParentId = parentMenu.parentId;
    }
  }
}