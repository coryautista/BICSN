export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isEntidad: boolean;
  createdAt: Date;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  isSystem?: boolean;
  isEntidad?: boolean;
}

export interface AssignRoleData {
  userId: string;
  roleName: string;
}

export interface UnassignRoleData {
  userId: string;
  roleName: string;
}
