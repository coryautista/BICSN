import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo role
 */
export class RoleError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un rol no es encontrado
 */
export class RoleNotFoundError extends RoleError {
  constructor(identifier: string) {
    super(
      `Rol con identificador '${identifier}' no encontrado`,
      'ROLE_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un rol con el mismo nombre
 */
export class RoleAlreadyExistsError extends RoleError {
  constructor(name: string) {
    super(
      `Ya existe un rol con el nombre '${name}'`,
      'ROLE_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error cuando el nombre del rol no es válido
 */
export class RoleInvalidNameError extends RoleError {
  constructor(name: string) {
    super(
      `El nombre del rol '${name}' no es válido. Debe tener entre 2-50 caracteres alfanuméricos y guiones bajos.`,
      'ROLE_INVALID_NAME',
      400
    );
  }
}

/**
 * Error cuando la descripción del rol no es válida
 */
export class RoleInvalidDescriptionError extends RoleError {
  constructor(description: string) {
    super(
      `La descripción del rol '${description}' no es válida. Debe tener máximo 255 caracteres.`,
      'ROLE_INVALID_DESCRIPTION',
      400
    );
  }
}

/**
 * Error cuando el ID del rol no es válido
 */
export class RoleInvalidIdError extends RoleError {
  constructor(id: string) {
    super(
      `El ID del rol '${id}' no es válido. Debe ser un UUID válido.`,
      'ROLE_INVALID_ID',
      400
    );
  }
}

/**
 * Error cuando el usuario no es encontrado
 */
export class RoleUserNotFoundError extends RoleError {
  constructor(userId: string) {
    super(
      `Usuario con ID '${userId}' no encontrado`,
      'ROLE_USER_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando el usuario ya tiene asignado el rol
 */
export class RoleAlreadyAssignedError extends RoleError {
  constructor(userId: string, roleName: string) {
    super(
      `El usuario '${userId}' ya tiene asignado el rol '${roleName}'`,
      'ROLE_ALREADY_ASSIGNED',
      409
    );
  }
}

/**
 * Error cuando el usuario no tiene asignado el rol
 */
export class RoleNotAssignedError extends RoleError {
  constructor(userId: string, roleName: string) {
    super(
      `El usuario '${userId}' no tiene asignado el rol '${roleName}'`,
      'ROLE_NOT_ASSIGNED',
      404
    );
  }
}

/**
 * Error cuando se intenta modificar un rol del sistema
 */
export class RoleSystemRoleError extends RoleError {
  constructor(roleName: string) {
    super(
      `No se puede modificar el rol del sistema '${roleName}'`,
      'ROLE_SYSTEM_ROLE',
      403
    );
  }
}

/**
 * Error de permisos para gestionar roles
 */
export class RolePermissionError extends RoleError {
  constructor(userId: string, action: string) {
    super(
      `El usuario '${userId}' no tiene permisos para ${action} roles.`,
      'ROLE_PERMISSION_DENIED',
      403
    );
  }
}