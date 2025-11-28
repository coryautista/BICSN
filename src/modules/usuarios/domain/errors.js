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
exports.UsuarioError = exports.UsuarioInvalidRoleError = exports.UsuarioPermissionError = exports.UsuarioInUseError = exports.UsuarioInvalidStatusError = exports.UsuarioInvalidIdError = exports.UsuarioInvalidNameError = exports.UsuarioInvalidPasswordError = exports.UsuarioInvalidUsernameError = exports.UsuarioInvalidEmailError = exports.UsuarioAlreadyExistsError = exports.UsuarioNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var UsuarioNotFoundError = /** @class */ (function (_super) {
    __extends(UsuarioNotFoundError, _super);
    function UsuarioNotFoundError(identifier) {
        return _super.call(this, "Usuario no encontrado: ".concat(identifier), 'USUARIO_NOT_FOUND', 404) || this;
    }
    return UsuarioNotFoundError;
}(errors_js_1.DomainError));
exports.UsuarioNotFoundError = UsuarioNotFoundError;
var UsuarioAlreadyExistsError = /** @class */ (function (_super) {
    __extends(UsuarioAlreadyExistsError, _super);
    function UsuarioAlreadyExistsError(field, value) {
        return _super.call(this, "Ya existe un usuario con ".concat(field, ": ").concat(value), 'USUARIO_ALREADY_EXISTS', 409) || this;
    }
    return UsuarioAlreadyExistsError;
}(errors_js_1.DomainError));
exports.UsuarioAlreadyExistsError = UsuarioAlreadyExistsError;
var UsuarioInvalidEmailError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidEmailError, _super);
    function UsuarioInvalidEmailError(email) {
        return _super.call(this, "Email inv\u00E1lido: ".concat(email), 'USUARIO_INVALID_EMAIL', 400) || this;
    }
    return UsuarioInvalidEmailError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidEmailError = UsuarioInvalidEmailError;
var UsuarioInvalidUsernameError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidUsernameError, _super);
    function UsuarioInvalidUsernameError(username) {
        return _super.call(this, "Username inv\u00E1lido: ".concat(username, ". Debe tener entre 3-50 caracteres, solo letras, n\u00FAmeros y guiones bajos"), 'USUARIO_INVALID_USERNAME', 400) || this;
    }
    return UsuarioInvalidUsernameError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidUsernameError = UsuarioInvalidUsernameError;
var UsuarioInvalidPasswordError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidPasswordError, _super);
    function UsuarioInvalidPasswordError() {
        return _super.call(this, 'Contraseña inválida. Debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos', 'USUARIO_INVALID_PASSWORD', 400) || this;
    }
    return UsuarioInvalidPasswordError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidPasswordError = UsuarioInvalidPasswordError;
var UsuarioInvalidNameError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidNameError, _super);
    function UsuarioInvalidNameError(field, value) {
        return _super.call(this, "".concat(field, " inv\u00E1lido: ").concat(value, ". Debe tener entre 2-100 caracteres"), 'USUARIO_INVALID_NAME', 400) || this;
    }
    return UsuarioInvalidNameError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidNameError = UsuarioInvalidNameError;
var UsuarioInvalidIdError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidIdError, _super);
    function UsuarioInvalidIdError(id) {
        return _super.call(this, "ID de usuario inv\u00E1lido: ".concat(id), 'USUARIO_INVALID_ID', 400) || this;
    }
    return UsuarioInvalidIdError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidIdError = UsuarioInvalidIdError;
var UsuarioInvalidStatusError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidStatusError, _super);
    function UsuarioInvalidStatusError(status) {
        return _super.call(this, "Estado de usuario inv\u00E1lido: ".concat(status), 'USUARIO_INVALID_STATUS', 400) || this;
    }
    return UsuarioInvalidStatusError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidStatusError = UsuarioInvalidStatusError;
var UsuarioInUseError = /** @class */ (function (_super) {
    __extends(UsuarioInUseError, _super);
    function UsuarioInUseError(identifier) {
        return _super.call(this, "Usuario est\u00E1 en uso y no puede ser eliminado: ".concat(identifier), 'USUARIO_IN_USE', 409) || this;
    }
    return UsuarioInUseError;
}(errors_js_1.DomainError));
exports.UsuarioInUseError = UsuarioInUseError;
var UsuarioPermissionError = /** @class */ (function (_super) {
    __extends(UsuarioPermissionError, _super);
    function UsuarioPermissionError(action) {
        return _super.call(this, "No tienes permisos para ".concat(action, " este usuario"), 'USUARIO_PERMISSION_ERROR', 403) || this;
    }
    return UsuarioPermissionError;
}(errors_js_1.DomainError));
exports.UsuarioPermissionError = UsuarioPermissionError;
var UsuarioInvalidRoleError = /** @class */ (function (_super) {
    __extends(UsuarioInvalidRoleError, _super);
    function UsuarioInvalidRoleError(roleId) {
        return _super.call(this, "Rol inv\u00E1lido: ".concat(roleId), 'USUARIO_INVALID_ROLE', 400) || this;
    }
    return UsuarioInvalidRoleError;
}(errors_js_1.DomainError));
exports.UsuarioInvalidRoleError = UsuarioInvalidRoleError;
var UsuarioError = /** @class */ (function (_super) {
    __extends(UsuarioError, _super);
    function UsuarioError(message, code, statusCode) {
        if (code === void 0) { code = 'USUARIO_ERROR'; }
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return UsuarioError;
}(errors_js_1.DomainError));
exports.UsuarioError = UsuarioError;
