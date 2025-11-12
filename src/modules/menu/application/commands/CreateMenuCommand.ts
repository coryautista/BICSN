import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { Menu, CreateMenuData } from '../../domain/entities/Menu.js';
import {
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
  name: 'createMenuCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateMenuInput {
  nombre: string;
  orden: number;
  componente?: string;
  parentId?: number;
  icono?: string;
}

export class CreateMenuCommand {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(input: CreateMenuInput, userId?: string): Promise<Menu> {
    try {
      logger.info({
        operation: 'createMenu',
        nombre: input.nombre,
        orden: input.orden,
        componente: input.componente,
        parentId: input.parentId,
        icono: input.icono,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando creación de menú');

      // Validaciones de entrada
      this.validateInput(input);

      // Verificar que no exista un menú con el mismo nombre
      const existingMenu = await this.menuRepo.findByName(input.nombre);
      if (existingMenu) {
        throw new MenuAlreadyExistsError(input.nombre);
      }

      // Validar que el parentId existe si se proporciona
      if (input.parentId) {
        const parent = await this.menuRepo.findById(input.parentId);
        if (!parent) {
          throw new MenuInvalidParentError(input.parentId);
        }

        // Verificar que no se cree un ciclo en la jerarquía
        await this.validateHierarchyCycle(input.parentId, null);
      }

      // Crear datos del menú
      const menuData: CreateMenuData = {
        nombre: input.nombre,
        orden: input.orden,
        componente: input.componente ?? null,
        parentId: input.parentId ?? null,
        icono: input.icono ?? null
      };

      // Crear menú
      const menu = await this.menuRepo.create(menuData);

      logger.info({
        operation: 'createMenu',
        menuId: menu.id,
        nombre: menu.nombre,
        orden: menu.orden,
        parentId: menu.parentId,
        userId,
        timestamp: new Date().toISOString()
      }, 'Menú creado exitosamente');

      return menu;
    } catch (error) {
      if (error instanceof MenuAlreadyExistsError ||
          error instanceof MenuInvalidNameError ||
          error instanceof MenuInvalidComponentError ||
          error instanceof MenuInvalidOrderError ||
          error instanceof MenuInvalidParentError ||
          error instanceof MenuHierarchyCycleError) {
        throw error;
      }

      logger.error({
        operation: 'createMenu',
        error: (error as Error).message,
        nombre: input.nombre,
        orden: input.orden,
        parentId: input.parentId,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al crear menú');

      throw new MenuError('Error interno al crear menú', 'MENU_CREATE_ERROR', 500);
    }
  }

  private validateInput(input: CreateMenuInput): void {
    // Validar nombre
    if (!input.nombre || typeof input.nombre !== 'string') {
      throw new MenuInvalidNameError('es requerido y debe ser una cadena de texto');
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

    // Validar componente si se proporciona
    if (input.componente !== undefined && input.componente !== null) {
      if (typeof input.componente !== 'string') {
        throw new MenuInvalidComponentError('debe ser una cadena de texto');
      }

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

    // Validar orden
    if (!Number.isInteger(input.orden)) {
      throw new MenuInvalidOrderError('debe ser un número entero');
    }

    if (input.orden < 0) {
      throw new MenuInvalidOrderError('no puede ser negativo');
    }

    if (input.orden > 9999) {
      throw new MenuInvalidOrderError('no puede ser mayor a 9999');
    }

    // Validar parentId si se proporciona
    if (input.parentId !== undefined && input.parentId !== null) {
      if (!Number.isInteger(input.parentId) || input.parentId <= 0) {
        throw new MenuInvalidParentError(input.parentId);
      }
    }

    // Validar icono si se proporciona
    if (input.icono !== undefined && input.icono !== null) {
      if (typeof input.icono !== 'string') {
        throw new MenuInvalidComponentError('el icono debe ser una cadena de texto');
      }

      const iconoTrimmed = input.icono.trim();
      if (iconoTrimmed.length > 50) {
        throw new MenuInvalidComponentError('el icono no puede tener más de 50 caracteres');
      }
    }
  }

  private async validateHierarchyCycle(parentId: number, currentMenuId: number | null): Promise<void> {
    // Si estamos creando un menú nuevo, currentMenuId será null
    // Si estamos actualizando, currentMenuId será el ID del menú que se está actualizando

    let currentParentId: number | null = parentId;
    const visitedIds = new Set<number>();

    while (currentParentId !== null) {
      if (visitedIds.has(currentParentId)) {
        throw new MenuHierarchyCycleError(currentMenuId || 0, parentId);
      }

      if (currentMenuId !== null && currentParentId === currentMenuId) {
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
