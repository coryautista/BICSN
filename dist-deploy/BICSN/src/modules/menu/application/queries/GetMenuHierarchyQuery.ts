import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { MenuHierarchy } from '../../domain/entities/Menu.js';
import { MenuError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getMenuHierarchyQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMenuHierarchyQuery {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(userId?: string): Promise<MenuHierarchy[]> {
    try {
      logger.info({
        operation: 'getMenuHierarchy',
        userId,
        timestamp: new Date().toISOString()
      }, 'Consultando jerarquía de menús');

      const menus = await this.menuRepo.findAll();

      // Crear estructura jerárquica
      const menuMap = new Map<number, MenuHierarchy>();
      const rootMenus: MenuHierarchy[] = [];

      // Primero, indexar todos los menús con children vacío
      menus.forEach(menu => {
        menuMap.set(menu.id, { ...menu, children: [] });
      });

      // Luego, construir la jerarquía
      menus.forEach(menu => {
        const menuWithChildren = menuMap.get(menu.id)!;
        if (menu.parentId) {
          const parent = menuMap.get(menu.parentId);
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(menuWithChildren);
          }
        } else {
          rootMenus.push(menuWithChildren);
        }
      });

      // Ordenar recursivamente por orden y nombre
      const sortMenus = (menus: MenuHierarchy[]): MenuHierarchy[] => {
        return menus.sort((a, b) => {
          if (a.orden !== b.orden) return a.orden - b.orden;
          return a.nombre.localeCompare(b.nombre);
        }).map((menu) => ({
          ...menu,
          children: menu.children ? sortMenus(menu.children) : []
        }));
      };

      const hierarchy = sortMenus(rootMenus);

      logger.info({
        operation: 'getMenuHierarchy',
        totalMenus: menus.length,
        rootMenus: rootMenus.length,
        userId,
        timestamp: new Date().toISOString()
      }, 'Jerarquía de menús obtenida exitosamente');

      return hierarchy;
    } catch (error) {
      logger.error({
        operation: 'getMenuHierarchy',
        error: (error as Error).message,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar jerarquía de menús');

      throw new MenuError('Error interno al consultar jerarquía de menús', 'MENU_HIERARCHY_QUERY_ERROR', 500);
    }
  }
}
