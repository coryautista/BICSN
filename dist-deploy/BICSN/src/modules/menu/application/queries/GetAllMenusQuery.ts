import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { Menu } from '../../domain/entities/Menu.js';
import { MenuError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllMenusQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllMenusQuery {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(userId?: string): Promise<Menu[]> {
    try {
      logger.info({
        operation: 'getAllMenus',
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando todos los menús');

      const menus = await this.menuRepo.findAll();

      logger.info({
        operation: 'getAllMenus',
        menuCount: menus.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Menús obtenidos exitosamente');

      return menus;
    } catch (error) {
      logger.error({
        operation: 'getAllMenus',
        error: (error as Error).message,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar menús');

      throw new MenuError('Error interno al consultar menús', 'MENU_QUERY_ERROR', 500);
    }
  }
}
