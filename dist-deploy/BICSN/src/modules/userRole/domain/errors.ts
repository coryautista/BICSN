import { DomainError } from '../../../utils/errors.js';

export class UserRoleNotFoundError extends DomainError {
  constructor(usuarioId: string, roleId: string) {
    super(`Asignación de rol ${roleId} al usuario ${usuarioId} no encontrada`, 'USER_ROLE_NOT_FOUND', 404);
  }
}

export class UserRoleAlreadyExistsError extends DomainError {
  constructor(usuarioId: string, roleId: string) {
    super(`El usuario ${usuarioId} ya tiene asignado el rol ${roleId}`, 'USER_ROLE_ALREADY_EXISTS', 409);
  }
}

export class UserRoleInvalidUsuarioIdError extends DomainError {
  constructor(usuarioId: any) {
    super(`ID de usuario inválido: ${usuarioId}`, 'USER_ROLE_INVALID_USUARIO_ID', 400);
  }
}

export class UserRoleInvalidRoleIdError extends DomainError {
  constructor(roleId: any) {
    super(`ID de rol inválido: ${roleId}`, 'USER_ROLE_INVALID_ROLE_ID', 400);
  }
}

export class UserRoleUsuarioNotFoundError extends DomainError {
  constructor(usuarioId: string) {
    super(`Usuario con ID ${usuarioId} no encontrado`, 'USER_ROLE_USUARIO_NOT_FOUND', 404);
  }
}

export class UserRoleRoleNotFoundError extends DomainError {
  constructor(roleId: string) {
    super(`Rol con ID ${roleId} no encontrado`, 'USER_ROLE_ROLE_NOT_FOUND', 404);
  }
}

export class UserRoleInUseError extends DomainError {
  constructor(usuarioId: string, roleId: string, reason: string) {
    super(`Asignación de rol ${roleId} al usuario ${usuarioId} no puede eliminarse: ${reason}`, 'USER_ROLE_IN_USE', 409);
  }
}

export class UserRolePermissionError extends DomainError {
  constructor(action: string) {
    super(`No tiene permisos para ${action} asignaciones usuario-rol`, 'USER_ROLE_PERMISSION_ERROR', 403);
  }
}