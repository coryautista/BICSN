export interface Menu {
  id: number;
  nombre: string;
  componente: string | null;
  parentId: number | null;
  icono: string | null;
  orden: number;
}

export interface CreateMenuData {
  nombre: string;
  componente?: string | null;
  parentId?: number | null;
  icono?: string | null;
  orden: number;
}

export interface UpdateMenuData {
  nombre?: string;
  componente?: string | null;
  parentId?: number | null;
  icono?: string | null;
  orden?: number;
}

export interface MenuHierarchy extends Menu {
  children?: MenuHierarchy[];
}
