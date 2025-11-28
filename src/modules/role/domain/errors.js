"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionError = exports.RoleSystemRoleError = exports.RoleNotAssignedError = exports.RoleAlreadyAssignedError = exports.RoleUserNotFoundError = exports.RoleInvalidIdError = exports.RoleInvalidDescriptionError = exports.RoleInvalidNameError = exports.RoleAlreadyExistsError = exports.RoleNotFoundError = exports.RoleError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo role
 */
var RoleError = /** @class */ (function (_super) {
    __extends(RoleError, _super);
    function RoleError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return RoleError;
}(errors_js_1.DomainError));
exports.RoleError = RoleError;
/**
 * Error cuando un rol no es encontrado
 */
var RoleNotFoundError = /** @class */ (function (_super) {
    __extends(RoleNotFoundError, _super);
    function RoleNotFoundError(identifier) {
        return _super.call(this, "Rol con identificador '".concat(identifier, "' no encontrado"), 'ROLE_NOT_FOUND', 404) || this;
    }
    return RoleNotFoundError;
}(RoleError));
exports.RoleNotFoundError = RoleNotFoundError;
/**
 * Error cuando ya existe un rol con el mismo nombre
 */
var RoleAlreadyExistsError = /** @class */ (function (_super) {
    __extends(RoleAlreadyExistsError, _super);
    function RoleAlreadyExistsError(name) {
        return _super.call(this, "Ya existe un rol con el nombre '".concat(name, "'"), 'ROLE_ALREADY_EXISTS', 409) || this;
    }
    return RoleAlreadyExistsError;
}(RoleError));
exports.RoleAlreadyExistsError = RoleAlreadyExistsError;
/**
 * Error cuando el nombre del rol no es válido
 */
var RoleInvalidNameError = /** @class */ (function (_super) {
    __extends(RoleInvalidNameError, _super);
    function RoleInvalidNameError(name) {
        return _super.call(this, "El nombre del rol '".concat(name, "' no es v\u00E1lido. Debe tener entre 2-50 caracteres alfanum\u00E9ricos y guiones bajos."), 'ROLE_INVALID_NAME', 400) || this;
    }
    return RoleInvalidNameError;
}(RoleError));
exports.RoleInvalidNameError = RoleInvalidNameError;
/**
 * Error cuando la descripción del rol no es válida
 */
var RoleInvalidDescriptionError = /** @class */ (function (_super) {
    __extends(RoleInvalidDescriptionError, _super);
    function RoleInvalidDescriptionError(description) {
        return _super.call(this, "La descripci\u00F3n del rol '".concat(description, "' no es v\u00E1lida. Debe tener m\u00E1ximo 255 caracteres."), 'ROLE_INVALID_DESCRIPTION', 400) || this;
    }
    return RoleInvalidDescriptionError;
}(RoleError));
exports.RoleInvalidDescriptionError = RoleInvalidDescriptionError;
/**
 * Error cuando el ID del rol no es válido
 */
var RoleInvalidIdError = /** @class */ (function (_super) {
    __extends(RoleInvalidIdError, _super);
    function RoleInvalidIdError(id) {
        return _super.call(this, "El ID del rol '".concat(id, "' no es v\u00E1lido. Debe ser un UUID v\u00E1lido."), 'ROLE_INVALID_ID', 400) || this;
    }
    return RoleInvalidIdError;
}(RoleError));
exports.RoleInvalidIdError = RoleInvalidIdError;
/**
 * Error cuando el usuario no es encontrado
 */
var RoleUserNotFoundError = /** @class */ (function (_super) {
    __extends(RoleUserNotFoundError, _super);
    function RoleUserNotFoundError(userId) {
        return _super.call(this, "Usuario con ID '".concat(userId, "' no encontrado"), 'ROLE_USER_NOT_FOUND', 404) || this;
    }
    return RoleUserNotFoundError;
}(RoleError));
exports.RoleUserNotFoundError = RoleUserNotFoundError;
/**
 * Error cuando el usuario ya tiene asignado el rol
 */
var RoleAlreadyAssignedError = /** @class */ (function (_super) {
    __extends(RoleAlreadyAssignedError, _super);
    function RoleAlreadyAssignedError(userId, roleName) {
        return _super.call(this, "El usuario '".concat(userId, "' ya tiene asignado el rol '").concat(roleName, "'"), 'ROLE_ALREADY_ASSIGNED', 409) || this;
    }
    return RoleAlreadyAssignedError;
}(RoleError));
exports.RoleAlreadyAssignedError = RoleAlreadyAssignedError;
/**
 * Error cuando el usuario no tiene asignado el rol
 */
var RoleNotAssignedError = /** @class */ (function (_super) {
    __extends(RoleNotAssignedError, _super);
    function RoleNotAssignedError(userId, roleName) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene asignado el rol '").concat(roleName, "'"), 'ROLE_NOT_ASSIGNED', 404) || this;
    }
    return RoleNotAssignedError;
}(RoleError));
exports.RoleNotAssignedError = RoleNotAssignedError;
/**
 * Error cuando se intenta modificar un rol del sistema
 */
var RoleSystemRoleError = /** @class */ (function (_super) {
    __extends(RoleSystemRoleError, _super);
    function RoleSystemRoleError(roleName) {
        return _super.call(this, "No se puede modificar el rol del sistema '".concat(roleName, "'"), 'ROLE_SYSTEM_ROLE', 403) || this;
    }
    return RoleSystemRoleError;
}(RoleError));
exports.RoleSystemRoleError = RoleSystemRoleError;
/**
 * Error de permisos para gestionar roles
 */
var RolePermissionError = /** @class */ (function (_super) {
    __extends(RolePermissionError, _super);
    function RolePermissionError(userId, action) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene permisos para ").concat(action, " roles."), 'ROLE_PERMISSION_DENIED', 403) || this;
    }
    return RolePermissionError;
}(RoleError));
exports.RolePermissionError = RolePermissionError;
