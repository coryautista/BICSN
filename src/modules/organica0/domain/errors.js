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
exports.Organica0PermissionError = exports.Organica0InUseError = exports.Organica0InvalidFechaError = exports.Organica0InvalidEstatusError = exports.Organica0InvalidNombreError = exports.Organica0InvalidClaveError = exports.Organica0AlreadyExistsError = exports.Organica0NotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error cuando una entidad organica0 no es encontrada
 */
var Organica0NotFoundError = /** @class */ (function (_super) {
    __extends(Organica0NotFoundError, _super);
    function Organica0NotFoundError(claveOrganica) {
        return _super.call(this, "Entidad organica0 con clave ".concat(claveOrganica, " no encontrada"), 'ORGANICA0_NOT_FOUND', 404, { claveOrganica: claveOrganica }) || this;
    }
    return Organica0NotFoundError;
}(errors_js_1.DomainError));
exports.Organica0NotFoundError = Organica0NotFoundError;
/**
 * Error cuando ya existe una entidad organica0 con la misma clave
 */
var Organica0AlreadyExistsError = /** @class */ (function (_super) {
    __extends(Organica0AlreadyExistsError, _super);
    function Organica0AlreadyExistsError(claveOrganica) {
        return _super.call(this, "Ya existe una entidad organica0 con la clave: ".concat(claveOrganica), 'ORGANICA0_ALREADY_EXISTS', 409, { claveOrganica: claveOrganica }) || this;
    }
    return Organica0AlreadyExistsError;
}(errors_js_1.DomainError));
exports.Organica0AlreadyExistsError = Organica0AlreadyExistsError;
/**
 * Error de validación de la clave organica0
 */
var Organica0InvalidClaveError = /** @class */ (function (_super) {
    __extends(Organica0InvalidClaveError, _super);
    function Organica0InvalidClaveError(details) {
        return _super.call(this, "Clave organica0 inv\u00E1lida: ".concat(details), 'ORGANICA0_INVALID_CLAVE', 400, { details: details }) || this;
    }
    return Organica0InvalidClaveError;
}(errors_js_1.DomainError));
exports.Organica0InvalidClaveError = Organica0InvalidClaveError;
/**
 * Error de validación del nombre organica0
 */
var Organica0InvalidNombreError = /** @class */ (function (_super) {
    __extends(Organica0InvalidNombreError, _super);
    function Organica0InvalidNombreError(details) {
        return _super.call(this, "Nombre organica0 inv\u00E1lido: ".concat(details), 'ORGANICA0_INVALID_NOMBRE', 400, { details: details }) || this;
    }
    return Organica0InvalidNombreError;
}(errors_js_1.DomainError));
exports.Organica0InvalidNombreError = Organica0InvalidNombreError;
/**
 * Error de validación del estatus organica0
 */
var Organica0InvalidEstatusError = /** @class */ (function (_super) {
    __extends(Organica0InvalidEstatusError, _super);
    function Organica0InvalidEstatusError(details) {
        return _super.call(this, "Estatus organica0 inv\u00E1lido: ".concat(details), 'ORGANICA0_INVALID_ESTATUS', 400, { details: details }) || this;
    }
    return Organica0InvalidEstatusError;
}(errors_js_1.DomainError));
exports.Organica0InvalidEstatusError = Organica0InvalidEstatusError;
/**
 * Error de validación de fechas organica0
 */
var Organica0InvalidFechaError = /** @class */ (function (_super) {
    __extends(Organica0InvalidFechaError, _super);
    function Organica0InvalidFechaError(details) {
        return _super.call(this, "Fecha organica0 inv\u00E1lida: ".concat(details), 'ORGANICA0_INVALID_FECHA', 400, { details: details }) || this;
    }
    return Organica0InvalidFechaError;
}(errors_js_1.DomainError));
exports.Organica0InvalidFechaError = Organica0InvalidFechaError;
/**
 * Error cuando se intenta eliminar una entidad organica0 que está en uso
 */
var Organica0InUseError = /** @class */ (function (_super) {
    __extends(Organica0InUseError, _super);
    function Organica0InUseError(claveOrganica) {
        return _super.call(this, "No se puede eliminar la entidad organica0 ".concat(claveOrganica, " porque est\u00E1 siendo utilizada"), 'ORGANICA0_IN_USE', 409, { claveOrganica: claveOrganica }) || this;
    }
    return Organica0InUseError;
}(errors_js_1.DomainError));
exports.Organica0InUseError = Organica0InUseError;
/**
 * Error de permisos insuficientes para operaciones de organica0
 */
var Organica0PermissionError = /** @class */ (function (_super) {
    __extends(Organica0PermissionError, _super);
    function Organica0PermissionError(operation, userId) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'ORGANICA0_PERMISSION_DENIED', 403, { operation: operation, userId: userId }) || this;
    }
    return Organica0PermissionError;
}(errors_js_1.DomainError));
exports.Organica0PermissionError = Organica0PermissionError;
