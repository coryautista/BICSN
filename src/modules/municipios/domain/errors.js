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
exports.MunicipioPermissionError = exports.MunicipioInUseError = exports.MunicipioInvalidIdError = exports.MunicipioInvalidNombreError = exports.MunicipioInvalidClaveError = exports.MunicipioInvalidEstadoError = exports.MunicipioAlreadyExistsError = exports.MunicipioNotFoundError = exports.MunicipioError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo municipios
 */
var MunicipioError = /** @class */ (function (_super) {
    __extends(MunicipioError, _super);
    function MunicipioError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return MunicipioError;
}(errors_js_1.DomainError));
exports.MunicipioError = MunicipioError;
/**
 * Error cuando un municipio no es encontrado
 */
var MunicipioNotFoundError = /** @class */ (function (_super) {
    __extends(MunicipioNotFoundError, _super);
    function MunicipioNotFoundError(municipioId) {
        return _super.call(this, "Municipio con ID ".concat(municipioId, " no encontrado"), 'MUNICIPIO_NOT_FOUND', 404) || this;
    }
    return MunicipioNotFoundError;
}(MunicipioError));
exports.MunicipioNotFoundError = MunicipioNotFoundError;
/**
 * Error cuando ya existe un municipio con la misma clave
 */
var MunicipioAlreadyExistsError = /** @class */ (function (_super) {
    __extends(MunicipioAlreadyExistsError, _super);
    function MunicipioAlreadyExistsError(claveMunicipio) {
        return _super.call(this, "Ya existe un municipio con la clave: ".concat(claveMunicipio), 'MUNICIPIO_ALREADY_EXISTS', 409) || this;
    }
    return MunicipioAlreadyExistsError;
}(MunicipioError));
exports.MunicipioAlreadyExistsError = MunicipioAlreadyExistsError;
/**
 * Error de validación del estado
 */
var MunicipioInvalidEstadoError = /** @class */ (function (_super) {
    __extends(MunicipioInvalidEstadoError, _super);
    function MunicipioInvalidEstadoError(details) {
        return _super.call(this, "Estado inv\u00E1lido: ".concat(details), 'MUNICIPIO_INVALID_ESTADO', 400) || this;
    }
    return MunicipioInvalidEstadoError;
}(MunicipioError));
exports.MunicipioInvalidEstadoError = MunicipioInvalidEstadoError;
/**
 * Error de validación de la clave del municipio
 */
var MunicipioInvalidClaveError = /** @class */ (function (_super) {
    __extends(MunicipioInvalidClaveError, _super);
    function MunicipioInvalidClaveError(details) {
        return _super.call(this, "Clave del municipio inv\u00E1lida: ".concat(details), 'MUNICIPIO_INVALID_CLAVE', 400) || this;
    }
    return MunicipioInvalidClaveError;
}(MunicipioError));
exports.MunicipioInvalidClaveError = MunicipioInvalidClaveError;
/**
 * Error de validación del nombre del municipio
 */
var MunicipioInvalidNombreError = /** @class */ (function (_super) {
    __extends(MunicipioInvalidNombreError, _super);
    function MunicipioInvalidNombreError(details) {
        return _super.call(this, "Nombre del municipio inv\u00E1lido: ".concat(details), 'MUNICIPIO_INVALID_NOMBRE', 400) || this;
    }
    return MunicipioInvalidNombreError;
}(MunicipioError));
exports.MunicipioInvalidNombreError = MunicipioInvalidNombreError;
/**
 * Error de validación del ID del municipio
 */
var MunicipioInvalidIdError = /** @class */ (function (_super) {
    __extends(MunicipioInvalidIdError, _super);
    function MunicipioInvalidIdError(details) {
        return _super.call(this, "ID del municipio inv\u00E1lido: ".concat(details), 'MUNICIPIO_INVALID_ID', 400) || this;
    }
    return MunicipioInvalidIdError;
}(MunicipioError));
exports.MunicipioInvalidIdError = MunicipioInvalidIdError;
/**
 * Error cuando se intenta eliminar un municipio que está en uso
 */
var MunicipioInUseError = /** @class */ (function (_super) {
    __extends(MunicipioInUseError, _super);
    function MunicipioInUseError(municipioId) {
        return _super.call(this, "No se puede eliminar el municipio ".concat(municipioId, " porque est\u00E1 siendo utilizado"), 'MUNICIPIO_IN_USE', 409) || this;
    }
    return MunicipioInUseError;
}(MunicipioError));
exports.MunicipioInUseError = MunicipioInUseError;
/**
 * Error de permisos insuficientes para operaciones de municipio
 */
var MunicipioPermissionError = /** @class */ (function (_super) {
    __extends(MunicipioPermissionError, _super);
    function MunicipioPermissionError(operation) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'MUNICIPIO_PERMISSION_DENIED', 403) || this;
    }
    return MunicipioPermissionError;
}(MunicipioError));
exports.MunicipioPermissionError = MunicipioPermissionError;
