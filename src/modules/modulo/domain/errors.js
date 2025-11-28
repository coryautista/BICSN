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
exports.ModuloInUseError = exports.ModuloPermissionError = exports.ModuloInvalidOrderError = exports.ModuloInvalidTypeError = exports.ModuloInvalidNameError = exports.ModuloAlreadyExistsError = exports.ModuloNotFoundError = exports.ModuloError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo módulo
 */
var ModuloError = /** @class */ (function (_super) {
    __extends(ModuloError, _super);
    function ModuloError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return ModuloError;
}(errors_js_1.DomainError));
exports.ModuloError = ModuloError;
/**
 * Error cuando un módulo no es encontrado
 */
var ModuloNotFoundError = /** @class */ (function (_super) {
    __extends(ModuloNotFoundError, _super);
    function ModuloNotFoundError(moduloId) {
        return _super.call(this, "M\u00F3dulo con ID ".concat(moduloId, " no encontrado"), 'MODULO_NOT_FOUND', 404) || this;
    }
    return ModuloNotFoundError;
}(ModuloError));
exports.ModuloNotFoundError = ModuloNotFoundError;
/**
 * Error cuando ya existe un módulo con el mismo nombre
 */
var ModuloAlreadyExistsError = /** @class */ (function (_super) {
    __extends(ModuloAlreadyExistsError, _super);
    function ModuloAlreadyExistsError(nombre) {
        return _super.call(this, "Ya existe un m\u00F3dulo con el nombre: ".concat(nombre), 'MODULO_ALREADY_EXISTS', 409) || this;
    }
    return ModuloAlreadyExistsError;
}(ModuloError));
exports.ModuloAlreadyExistsError = ModuloAlreadyExistsError;
/**
 * Error de validación del nombre del módulo
 */
var ModuloInvalidNameError = /** @class */ (function (_super) {
    __extends(ModuloInvalidNameError, _super);
    function ModuloInvalidNameError(details) {
        return _super.call(this, "Nombre del m\u00F3dulo inv\u00E1lido: ".concat(details), 'MODULO_INVALID_NAME', 400) || this;
    }
    return ModuloInvalidNameError;
}(ModuloError));
exports.ModuloInvalidNameError = ModuloInvalidNameError;
/**
 * Error de validación del tipo del módulo
 */
var ModuloInvalidTypeError = /** @class */ (function (_super) {
    __extends(ModuloInvalidTypeError, _super);
    function ModuloInvalidTypeError(details) {
        return _super.call(this, "Tipo del m\u00F3dulo inv\u00E1lido: ".concat(details), 'MODULO_INVALID_TYPE', 400) || this;
    }
    return ModuloInvalidTypeError;
}(ModuloError));
exports.ModuloInvalidTypeError = ModuloInvalidTypeError;
/**
 * Error de validación del orden del módulo
 */
var ModuloInvalidOrderError = /** @class */ (function (_super) {
    __extends(ModuloInvalidOrderError, _super);
    function ModuloInvalidOrderError(details) {
        return _super.call(this, "Orden del m\u00F3dulo inv\u00E1lido: ".concat(details), 'MODULO_INVALID_ORDER', 400) || this;
    }
    return ModuloInvalidOrderError;
}(ModuloError));
exports.ModuloInvalidOrderError = ModuloInvalidOrderError;
/**
 * Error de permisos insuficientes para operaciones de módulo
 */
var ModuloPermissionError = /** @class */ (function (_super) {
    __extends(ModuloPermissionError, _super);
    function ModuloPermissionError(operation) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'MODULO_PERMISSION_DENIED', 403) || this;
    }
    return ModuloPermissionError;
}(ModuloError));
exports.ModuloPermissionError = ModuloPermissionError;
/**
 * Error cuando se intenta eliminar un módulo que está siendo usado
 */
var ModuloInUseError = /** @class */ (function (_super) {
    __extends(ModuloInUseError, _super);
    function ModuloInUseError(moduloId) {
        return _super.call(this, "No se puede eliminar el m\u00F3dulo ".concat(moduloId, " porque est\u00E1 siendo utilizado por otros componentes del sistema"), 'MODULO_IN_USE', 409) || this;
    }
    return ModuloInUseError;
}(ModuloError));
exports.ModuloInUseError = ModuloInUseError;
