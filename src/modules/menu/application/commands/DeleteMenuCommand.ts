import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import {
  MenuNotFoundError,
  MenuHasChildrenError,
  MenuError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteMenuCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteMenuInput {
  id: number;
}

export class DeleteMenuCommand {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(input: DeleteMenuInput, userId?: string): Promise<boolean> {
    try {
      logger.info({
        operation: 'deleteMenu',
        menuId: input.id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando eliminación de menú');

      // Validar entrada
      this.validateInput(input);

      // Verificar que el menú existe
      const existing = await this.menuRepo.findById(input.id);
      if (!existing) {
        throw new MenuNotFoundError(input.id);
      }

      // Verificar que no tenga hijos
      const hasChildren = await this.menuRepo.hasChildren(input.id);
      if (hasChildren) {
        throw new MenuHasChildrenError(input.id);
      }

      // Eliminar menú
      const deleted = await this.menuRepo.delete(input.id);

      if (deleted) {
        logger.info({
          operation: 'deleteMenu',
          menuId: input.id,
          nombre: existing.nombre,
          userId,
          timestamp: new Date().toISOString()
        }, 'Menú eliminado exitosamente');
      } else {
        logger.warn({
          operation: 'deleteMenu',
          menuId: input.id,
          userId,
          timestamp: new Date().toISOString()
        }, 'No se pudo eliminar el menú');
      }

      return deleted;
    } catch (error) {
      if (error instanceof MenuNotFoundError ||
          error instanceof MenuHasChildrenError) {
        throw error;
      }

      logger.error({
        operation: 'deleteMenu',
        error: (error as Error).message,
        menuId: input.id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al eliminar menú');

      throw new MenuError('Error interno al eliminar menú', 'MENU_DELETE_ERROR', 500);
    }
  }

  private validateInput(input: DeleteMenuInput): void {
    if (!Number.isInteger(input.id) || input.id <= 0) {
      throw new MenuNotFoundError(input.id);
    }
  }
}
