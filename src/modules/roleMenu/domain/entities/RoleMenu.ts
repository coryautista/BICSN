export interface RoleMenu {
  id: number;
  roleId: string;
  menuId: number;
  createdAt: string;
}

export interface RoleMenuWithDetails {
  id: number;
  roleId: string;
  menuId: number;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
  menu: {
    id: number;
    name: string;
    path: string;
    icon: string | null;
    parentId: number | null;
    order: number;
  };
}

export interface CreateRoleMenuData {
  roleId: string;
  menuId: number;
  createdAt?: string;
}

export interface UpdateRoleMenuData {
  id: number;
  roleId?: string;
  menuId?: number;
  createdAt?: string;
}

export interface DeleteRoleMenuData {
  id: number;
}

export interface AssignMenuToRoleData {
  roleId: string;
  menuId: number;
}

export interface UnassignMenuFromRoleData {
  roleId: string;
  menuId: number;
}
