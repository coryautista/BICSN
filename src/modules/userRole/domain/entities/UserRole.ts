export interface UserRole {
  usuarioId: string;
  roleId: string;
}

export interface CreateUserRoleData {
  usuarioId: string;
  roleId: string;
  esActivo?: boolean;
}

export interface DeleteUserRoleData {
  usuarioId: string;
  roleId: string;
}
