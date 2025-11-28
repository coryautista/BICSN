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
exports.ProcesoPermissionError = exports.ProcesoInUseError = exports.ProcesoInvalidTipoError = exports.ProcesoInvalidOrdenError = exports.ProcesoInvalidIdModuloError = exports.ProcesoInvalidComponenteError = exports.ProcesoInvalidNombreError = exports.ProcesoInvalidIdError = exports.ProcesoAlreadyExistsError = exports.ProcesoNotFoundError = exports.ProcesoError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo proceso
 */
var ProcesoError = /** @class */ (function (_super) {
    __extends(ProcesoError, _super);
    function ProcesoError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return ProcesoError;
}(errors_js_1.DomainError));
exports.ProcesoError = ProcesoError;
/**
 * Error cuando un proceso no es encontrado
 */
var ProcesoNotFoundError = /** @class */ (function (_super) {
    __extends(ProcesoNotFoundError, _super);
    function ProcesoNotFoundError(identifier) {
        return _super.call(this, "Proceso con identificador '".concat(identifier, "' no encontrado"), 'PROCESO_NOT_FOUND', 404) || this;
    }
    return ProcesoNotFoundError;
}(ProcesoError));
exports.ProcesoNotFoundError = ProcesoNotFoundError;
/**
 * Error cuando ya existe un proceso con el mismo nombre
 */
var ProcesoAlreadyExistsError = /** @class */ (function (_super) {
    __extends(ProcesoAlreadyExistsError, _super);
    function ProcesoAlreadyExistsError(name) {
        return _super.call(this, "Ya existe un proceso con el nombre '".concat(name, "'"), 'PROCESO_ALREADY_EXISTS', 409) || this;
    }
    return ProcesoAlreadyExistsError;
}(ProcesoError));
exports.ProcesoAlreadyExistsError = ProcesoAlreadyExistsError;
/**
 * Error cuando el ID del proceso no es válido
 */
var ProcesoInvalidIdError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidIdError, _super);
    function ProcesoInvalidIdError(id) {
        return _super.call(this, "El ID del proceso '".concat(id, "' no es v\u00E1lido. Debe ser un n\u00FAmero entero positivo."), 'PROCESO_INVALID_ID', 400) || this;
    }
    return ProcesoInvalidIdError;
}(ProcesoError));
exports.ProcesoInvalidIdError = ProcesoInvalidIdError;
/**
 * Error cuando el nombre del proceso no es válido
 */
var ProcesoInvalidNombreError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidNombreError, _super);
    function ProcesoInvalidNombreError(nombre) {
        return _super.call(this, "El nombre del proceso '".concat(nombre, "' no es v\u00E1lido. Debe tener entre 2-100 caracteres."), 'PROCESO_INVALID_NOMBRE', 400) || this;
    }
    return ProcesoInvalidNombreError;
}(ProcesoError));
exports.ProcesoInvalidNombreError = ProcesoInvalidNombreError;
/**
 * Error cuando el componente del proceso no es válido
 */
var ProcesoInvalidComponenteError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidComponenteError, _super);
    function ProcesoInvalidComponenteError(componente) {
        return _super.call(this, "El componente del proceso '".concat(componente, "' no es v\u00E1lido. Debe tener m\u00E1ximo 100 caracteres."), 'PROCESO_INVALID_COMPONENTE', 400) || this;
    }
    return ProcesoInvalidComponenteError;
}(ProcesoError));
exports.ProcesoInvalidComponenteError = ProcesoInvalidComponenteError;
/**
 * Error cuando el ID del módulo no es válido
 */
var ProcesoInvalidIdModuloError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidIdModuloError, _super);
    function ProcesoInvalidIdModuloError(idModulo) {
        return _super.call(this, "El ID del m\u00F3dulo '".concat(idModulo, "' no es v\u00E1lido. Debe ser un n\u00FAmero entero positivo."), 'PROCESO_INVALID_ID_MODULO', 400) || this;
    }
    return ProcesoInvalidIdModuloError;
}(ProcesoError));
exports.ProcesoInvalidIdModuloError = ProcesoInvalidIdModuloError;
/**
 * Error cuando el orden del proceso no es válido
 */
var ProcesoInvalidOrdenError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidOrdenError, _super);
    function ProcesoInvalidOrdenError(orden) {
        return _super.call(this, "El orden del proceso '".concat(orden, "' no es v\u00E1lido. Debe ser un n\u00FAmero entero positivo."), 'PROCESO_INVALID_ORDEN', 400) || this;
    }
    return ProcesoInvalidOrdenError;
}(ProcesoError));
exports.ProcesoInvalidOrdenError = ProcesoInvalidOrdenError;
/**
 * Error cuando el tipo del proceso no es válido
 */
var ProcesoInvalidTipoError = /** @class */ (function (_super) {
    __extends(ProcesoInvalidTipoError, _super);
    function ProcesoInvalidTipoError(tipo) {
        return _super.call(this, "El tipo del proceso '".concat(tipo, "' no es v\u00E1lido. Debe ser uno de los valores permitidos."), 'PROCESO_INVALID_TIPO', 400) || this;
    }
    return ProcesoInvalidTipoError;
}(ProcesoError));
exports.ProcesoInvalidTipoError = ProcesoInvalidTipoError;
/**
 * Error cuando el proceso está en uso y no puede ser eliminado
 */
var ProcesoInUseError = /** @class */ (function (_super) {
    __extends(ProcesoInUseError, _super);
    function ProcesoInUseError(id) {
        return _super.call(this, "El proceso con ID ".concat(id, " est\u00E1 en uso y no puede ser eliminado"), 'PROCESO_IN_USE', 409) || this;
    }
    return ProcesoInUseError;
}(ProcesoError));
exports.ProcesoInUseError = ProcesoInUseError;
/**
 * Error de permisos para gestionar procesos
 */
var ProcesoPermissionError = /** @class */ (function (_super) {
    __extends(ProcesoPermissionError, _super);
    function ProcesoPermissionError(userId, action) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene permisos para ").concat(action, " procesos."), 'PROCESO_PERMISSION_DENIED', 403) || this;
    }
    return ProcesoPermissionError;
}(ProcesoError));
exports.ProcesoPermissionError = ProcesoPermissionError;
