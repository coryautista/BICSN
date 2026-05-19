import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { Menu } from '../../domain/entities/Menu.js';
import { MenuNotFoundError, MenuInvalidParentError, MenuError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMenuByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMenuByIdQuery {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(id: number, userId?: string): Promise<Menu> {
    try {
      logger.info({
        operation: 'getMenuById',
        menuId: id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando menú por ID');

      // Validar entrada
      this.validateInput(id);

      const menu = await this.menuRepo.findById(id);
      if (!menu) {
        throw new MenuNotFoundError(id);
      }

      logger.info({
        operation: 'getMenuById',
        menuId: menu.id,
        nombre: menu.nombre,
        userId,
        timestamp: new Date().toISOString()
      }, 'Menú encontrado exitosamente');

      return menu;
    } catch (error) {
      if (error instanceof MenuNotFoundError) {
        throw error;
      }

      logger.error({
        operation: 'getMenuById',
        error: (error as Error).message,
        menuId: id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar menú por ID');

      throw new MenuError('Error interno al consultar menú', 'MENU_QUERY_ERROR', 500);
    }
  }

  private validateInput(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new MenuInvalidParentError(id);
    }
  }
}
