import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo menú
 */
export class MenuError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un menú no es encontrado
 */
export class MenuNotFoundError extends MenuError {
  constructor(menuId: number) {
    super(
      `Menú con ID ${menuId} no encontrado`,
      'MENU_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un menú con el mismo nombre
 */
export class MenuAlreadyExistsError extends MenuError {
  constructor(nombre: string) {
    super(
      `Ya existe un menú con el nombre: ${nombre}`,
      'MENU_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación del nombre del menú
 */
export class MenuInvalidNameError extends MenuError {
  constructor(details: string) {
    super(
      `Nombre del menú inválido: ${details}`,
      'MENU_INVALID_NAME',
      400
    );
  }
}

/**
 * Error de validación del componente del menú
 */
export class MenuInvalidComponentError extends MenuError {
  constructor(details: string) {
    super(
      `Componente del menú inválido: ${details}`,
      'MENU_INVALID_COMPONENT',
      400
    );
  }
}

/**
 * Error de validación del orden del menú
 */
export class MenuInvalidOrderError extends MenuError {
  constructor(details: string) {
    super(
      `Orden del menú inválido: ${details}`,
      'MENU_INVALID_ORDER',
      400
    );
  }
}

/**
 * Error cuando se intenta crear un menú con parentId inválido
 */
export class MenuInvalidParentError extends MenuError {
  constructor(parentId: number) {
    super(
      `El menú padre con ID ${parentId} no existe`,
      'MENU_INVALID_PARENT',
      400
    );
  }
}

/**
 * Error cuando se intenta crear un ciclo en la jerarquía de menús
 */
export class MenuHierarchyCycleError extends MenuError {
  constructor(menuId: number, parentId: number) {
    super(
      `No se puede asignar el menú ${parentId} como padre del menú ${menuId} porque crearía un ciclo en la jerarquía`,
      'MENU_HIERARCHY_CYCLE',
      400
    );
  }
}

/**
 * Error cuando se intenta eliminar un menú que tiene hijos
 */
export class MenuHasChildrenError extends MenuError {
  constructor(menuId: number) {
    super(
      `No se puede eliminar el menú ${menuId} porque tiene menús hijos`,
      'MENU_HAS_CHILDREN',
      409
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de menú
 */
export class MenuPermissionError extends MenuError {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'MENU_PERMISSION_DENIED',
      403
    );
  }
}