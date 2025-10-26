import { findMenuById, listMenus, createMenu, updateMenu, deleteMenu } from './menu.repo.js';

export async function getAllMenus() {
  return listMenus();
}

export async function getMenuById(id: number) {
  const menu = await findMenuById(id);
  if (!menu) throw new Error('MENU_NOT_FOUND');
  return menu;
}

export async function createMenuItem(nombre: string, orden: number, componente?: string, parentId?: number, icono?: string, tx?: any) {
  // Validar que el parentId existe si se proporciona
  if (parentId) {
    const parent = await findMenuById(parentId);
    if (!parent) throw new Error('PARENT_MENU_NOT_FOUND');
  }

  return createMenu(nombre, orden, componente, parentId, icono, tx);
}

export async function updateMenuItem(id: number, nombre: string, componente?: string, parentId?: number, icono?: string, orden?: number, tx?: any) {
  // Verificar que el menú existe
  const existing = await findMenuById(id);
  if (!existing) throw new Error('MENU_NOT_FOUND');

  // Validar que el parentId existe si se proporciona
  if (parentId) {
    const parent = await findMenuById(parentId);
    if (!parent) throw new Error('PARENT_MENU_NOT_FOUND');

    // Evitar referencias circulares
    if (parentId === id) throw new Error('MENU_CANNOT_BE_PARENT_OF_ITSELF');
  }

  return updateMenu(id, nombre, componente, parentId, icono, orden, tx);
}

export async function deleteMenuItem(id: number, tx?: any) {
  // Verificar que el menú existe
  const existing = await findMenuById(id);
  if (!existing) throw new Error('MENU_NOT_FOUND');

  // Verificar que no tenga hijos
  const allMenus = await listMenus();
  const hasChildren = allMenus.some(menu => menu.parentId === id);
  if (hasChildren) throw new Error('CANNOT_DELETE_MENU_WITH_CHILDREN');

  return deleteMenu(id, tx);
}

export async function getMenuHierarchy() {
  const menus = await listMenus();

  // Crear estructura jerárquica
  const menuMap = new Map();
  const rootMenus: any[] = [];

  // Primero, indexar todos los menús
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  // Luego, construir la jerarquía
  menus.forEach(menu => {
    const menuWithChildren = menuMap.get(menu.id);
    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children.push(menuWithChildren);
      }
    } else {
      rootMenus.push(menuWithChildren);
    }
  });

  // Ordenar por orden y nombre
  const sortMenus = (menus: any[]): any[] => {
    return menus.sort((a, b) => {
      if (a.orden !== b.orden) return a.orden - b.orden;
      return a.nombre.localeCompare(b.nombre);
    }).map((menu: any) => ({
      ...menu,
      children: sortMenus(menu.children)
    }));
  };

  return sortMenus(rootMenus);
}