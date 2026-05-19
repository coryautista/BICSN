import { DomainError } from '../../../utils/errors.js';

export class RoleMenuNotFoundError extends DomainError {
  constructor(id: number) {
    super(`RoleMenu con ID ${id} no encontrado`, 'ROLE_MENU_NOT_FOUND', 404);
  }
}

export class RoleMenuAlreadyExistsError extends DomainError {
  constructor(roleId: string, menuId: number) {
    super(`El menú ${menuId} ya está asignado al rol ${roleId}`, 'ROLE_MENU_ALREADY_EXISTS', 409);
  }
}

export class RoleMenuInvalidIdError extends DomainError {
  constructor(id: any) {
    super(`ID de RoleMenu inválido: ${id}`, 'ROLE_MENU_INVALID_ID', 400);
  }
}

export class RoleMenuInvalidRoleIdError extends DomainError {
  constructor(roleId: any) {
    super(`ID de rol inválido: ${roleId}`, 'ROLE_MENU_INVALID_ROLE_ID', 400);
  }
}

export class RoleMenuInvalidMenuIdError extends DomainError {
  constructor(menuId: any) {
    super(`ID de menú inválido: ${menuId}`, 'ROLE_MENU_INVALID_MENU_ID', 400);
  }
}

export class RoleMenuRoleNotFoundError extends DomainError {
  constructor(roleId: string) {
    super(`Rol con ID ${roleId} no encontrado`, 'ROLE_MENU_ROLE_NOT_FOUND', 404);
  }
}

export class RoleMenuMenuNotFoundError extends DomainError {
  constructor(menuId: number) {
    super(`Menú con ID ${menuId} no encontrado`, 'ROLE_MENU_MENU_NOT_FOUND', 404);
  }
}

export class RoleMenuInUseError extends DomainError {
  constructor(id: number, reason: string) {
    super(`RoleMenu ${id} no puede eliminarse: ${reason}`, 'ROLE_MENU_IN_USE', 409);
  }
}

export class RoleMenuPermissionError extends DomainError {
  constructor(action: string) {
    super(`No tiene permisos para ${action} roleMenus`, 'ROLE_MENU_PERMISSION_ERROR', 403);
  }
}