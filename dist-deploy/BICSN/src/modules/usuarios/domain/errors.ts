import { DomainError } from '../../../utils/errors.js';

export class UsuarioNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Usuario no encontrado: ${identifier}`, 'USUARIO_NOT_FOUND', 404);
  }
}

export class UsuarioAlreadyExistsError extends DomainError {
  constructor(field: string, value: string) {
    super(`Ya existe un usuario con ${field}: ${value}`, 'USUARIO_ALREADY_EXISTS', 409);
  }
}

export class UsuarioInvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Email inválido: ${email}`, 'USUARIO_INVALID_EMAIL', 400);
  }
}

export class UsuarioInvalidUsernameError extends DomainError {
  constructor(username: string) {
    super(`Username inválido: ${username}. Debe tener entre 3-50 caracteres, solo letras, números y guiones bajos`, 'USUARIO_INVALID_USERNAME', 400);
  }
}

export class UsuarioInvalidPasswordError extends DomainError {
  constructor() {
    super('Contraseña inválida. Debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos', 'USUARIO_INVALID_PASSWORD', 400);
  }
}

export class UsuarioInvalidNameError extends DomainError {
  constructor(field: string, value: string) {
    super(`${field} inválido: ${value}. Debe tener entre 2-100 caracteres`, 'USUARIO_INVALID_NAME', 400);
  }
}

export class UsuarioInvalidIdError extends DomainError {
  constructor(id: string) {
    super(`ID de usuario inválido: ${id}`, 'USUARIO_INVALID_ID', 400);
  }
}

export class UsuarioInvalidStatusError extends DomainError {
  constructor(status: string) {
    super(`Estado de usuario inválido: ${status}`, 'USUARIO_INVALID_STATUS', 400);
  }
}

export class UsuarioInUseError extends DomainError {
  constructor(identifier: string) {
    super(`Usuario está en uso y no puede ser eliminado: ${identifier}`, 'USUARIO_IN_USE', 409);
  }
}

export class UsuarioPermissionError extends DomainError {
  constructor(action: string) {
    super(`No tienes permisos para ${action} este usuario`, 'USUARIO_PERMISSION_ERROR', 403);
  }
}

export class UsuarioInvalidRoleError extends DomainError {
  constructor(roleId: string) {
    super(`Rol inválido: ${roleId}`, 'USUARIO_INVALID_ROLE', 400);
  }
}

export class UsuarioError extends DomainError {
  constructor(message: string, code: string = 'USUARIO_ERROR', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}