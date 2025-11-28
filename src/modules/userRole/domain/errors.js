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
exports.UserRolePermissionError = exports.UserRoleInUseError = exports.UserRoleRoleNotFoundError = exports.UserRoleUsuarioNotFoundError = exports.UserRoleInvalidRoleIdError = exports.UserRoleInvalidUsuarioIdError = exports.UserRoleAlreadyExistsError = exports.UserRoleNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var UserRoleNotFoundError = /** @class */ (function (_super) {
    __extends(UserRoleNotFoundError, _super);
    function UserRoleNotFoundError(usuarioId, roleId) {
        return _super.call(this, "Asignaci\u00F3n de rol ".concat(roleId, " al usuario ").concat(usuarioId, " no encontrada"), 'USER_ROLE_NOT_FOUND', 404) || this;
    }
    return UserRoleNotFoundError;
}(errors_js_1.DomainError));
exports.UserRoleNotFoundError = UserRoleNotFoundError;
var UserRoleAlreadyExistsError = /** @class */ (function (_super) {
    __extends(UserRoleAlreadyExistsError, _super);
    function UserRoleAlreadyExistsError(usuarioId, roleId) {
        return _super.call(this, "El usuario ".concat(usuarioId, " ya tiene asignado el rol ").concat(roleId), 'USER_ROLE_ALREADY_EXISTS', 409) || this;
    }
    return UserRoleAlreadyExistsError;
}(errors_js_1.DomainError));
exports.UserRoleAlreadyExistsError = UserRoleAlreadyExistsError;
var UserRoleInvalidUsuarioIdError = /** @class */ (function (_super) {
    __extends(UserRoleInvalidUsuarioIdError, _super);
    function UserRoleInvalidUsuarioIdError(usuarioId) {
        return _super.call(this, "ID de usuario inv\u00E1lido: ".concat(usuarioId), 'USER_ROLE_INVALID_USUARIO_ID', 400) || this;
    }
    return UserRoleInvalidUsuarioIdError;
}(errors_js_1.DomainError));
exports.UserRoleInvalidUsuarioIdError = UserRoleInvalidUsuarioIdError;
var UserRoleInvalidRoleIdError = /** @class */ (function (_super) {
    __extends(UserRoleInvalidRoleIdError, _super);
    function UserRoleInvalidRoleIdError(roleId) {
        return _super.call(this, "ID de rol inv\u00E1lido: ".concat(roleId), 'USER_ROLE_INVALID_ROLE_ID', 400) || this;
    }
    return UserRoleInvalidRoleIdError;
}(errors_js_1.DomainError));
exports.UserRoleInvalidRoleIdError = UserRoleInvalidRoleIdError;
var UserRoleUsuarioNotFoundError = /** @class */ (function (_super) {
    __extends(UserRoleUsuarioNotFoundError, _super);
    function UserRoleUsuarioNotFoundError(usuarioId) {
        return _super.call(this, "Usuario con ID ".concat(usuarioId, " no encontrado"), 'USER_ROLE_USUARIO_NOT_FOUND', 404) || this;
    }
    return UserRoleUsuarioNotFoundError;
}(errors_js_1.DomainError));
exports.UserRoleUsuarioNotFoundError = UserRoleUsuarioNotFoundError;
var UserRoleRoleNotFoundError = /** @class */ (function (_super) {
    __extends(UserRoleRoleNotFoundError, _super);
    function UserRoleRoleNotFoundError(roleId) {
        return _super.call(this, "Rol con ID ".concat(roleId, " no encontrado"), 'USER_ROLE_ROLE_NOT_FOUND', 404) || this;
    }
    return UserRoleRoleNotFoundError;
}(errors_js_1.DomainError));
exports.UserRoleRoleNotFoundError = UserRoleRoleNotFoundError;
var UserRoleInUseError = /** @class */ (function (_super) {
    __extends(UserRoleInUseError, _super);
    function UserRoleInUseError(usuarioId, roleId, reason) {
        return _super.call(this, "Asignaci\u00F3n de rol ".concat(roleId, " al usuario ").concat(usuarioId, " no puede eliminarse: ").concat(reason), 'USER_ROLE_IN_USE', 409) || this;
    }
    return UserRoleInUseError;
}(errors_js_1.DomainError));
exports.UserRoleInUseError = UserRoleInUseError;
var UserRolePermissionError = /** @class */ (function (_super) {
    __extends(UserRolePermissionError, _super);
    function UserRolePermissionError(action) {
        return _super.call(this, "No tiene permisos para ".concat(action, " asignaciones usuario-rol"), 'USER_ROLE_PERMISSION_ERROR', 403) || this;
    }
    return UserRolePermissionError;
}(errors_js_1.DomainError));
exports.UserRolePermissionError = UserRolePermissionError;
