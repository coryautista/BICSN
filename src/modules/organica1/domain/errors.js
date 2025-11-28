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
exports.Organica1PermissionError = exports.Organica1ParentNotFoundError = exports.Organica1InUseError = exports.Organica1InvalidFechaError = exports.Organica1InvalidEstatusError = exports.Organica1InvalidInfonavitError = exports.Organica1InvalidImssError = exports.Organica1InvalidRfcError = exports.Organica1InvalidTitularError = exports.Organica1InvalidDescripcionError = exports.Organica1InvalidClaveOrganica1Error = exports.Organica1InvalidClaveOrganica0Error = exports.Organica1AlreadyExistsError = exports.Organica1NotFoundError = exports.Organica1Error = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo organica1
 */
var Organica1Error = /** @class */ (function (_super) {
    __extends(Organica1Error, _super);
    function Organica1Error(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return Organica1Error;
}(errors_js_1.DomainError));
exports.Organica1Error = Organica1Error;
/**
 * Error cuando una entidad organica1 no es encontrada
 */
var Organica1NotFoundError = /** @class */ (function (_super) {
    __extends(Organica1NotFoundError, _super);
    function Organica1NotFoundError(claveOrganica0, claveOrganica1) {
        return _super.call(this, "Entidad organica1 con clave ".concat(claveOrganica0, "-").concat(claveOrganica1, " no encontrada"), 'ORGANICA1_NOT_FOUND', 404, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1 }) || this;
    }
    return Organica1NotFoundError;
}(errors_js_1.DomainError));
exports.Organica1NotFoundError = Organica1NotFoundError;
/**
 * Error cuando ya existe una entidad organica1 con la misma clave
 */
var Organica1AlreadyExistsError = /** @class */ (function (_super) {
    __extends(Organica1AlreadyExistsError, _super);
    function Organica1AlreadyExistsError(claveOrganica0, claveOrganica1) {
        return _super.call(this, "Ya existe una entidad organica1 con la clave: ".concat(claveOrganica0, "-").concat(claveOrganica1), 'ORGANICA1_ALREADY_EXISTS', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1 }) || this;
    }
    return Organica1AlreadyExistsError;
}(errors_js_1.DomainError));
exports.Organica1AlreadyExistsError = Organica1AlreadyExistsError;
/**
 * Error de validación de la clave organica0
 */
var Organica1InvalidClaveOrganica0Error = /** @class */ (function (_super) {
    __extends(Organica1InvalidClaveOrganica0Error, _super);
    function Organica1InvalidClaveOrganica0Error(details) {
        return _super.call(this, "Clave organica0 inv\u00E1lida: ".concat(details), 'ORGANICA1_INVALID_CLAVE_ORGANICA0', 400, { details: details }) || this;
    }
    return Organica1InvalidClaveOrganica0Error;
}(errors_js_1.DomainError));
exports.Organica1InvalidClaveOrganica0Error = Organica1InvalidClaveOrganica0Error;
/**
 * Error de validación de la clave organica1
 */
var Organica1InvalidClaveOrganica1Error = /** @class */ (function (_super) {
    __extends(Organica1InvalidClaveOrganica1Error, _super);
    function Organica1InvalidClaveOrganica1Error(details) {
        return _super.call(this, "Clave organica1 inv\u00E1lida: ".concat(details), 'ORGANICA1_INVALID_CLAVE_ORGANICA1', 400, { details: details }) || this;
    }
    return Organica1InvalidClaveOrganica1Error;
}(errors_js_1.DomainError));
exports.Organica1InvalidClaveOrganica1Error = Organica1InvalidClaveOrganica1Error;
/**
 * Error de validación de la descripción organica1
 */
var Organica1InvalidDescripcionError = /** @class */ (function (_super) {
    __extends(Organica1InvalidDescripcionError, _super);
    function Organica1InvalidDescripcionError(details) {
        return _super.call(this, "Descripci\u00F3n organica1 inv\u00E1lida: ".concat(details), 'ORGANICA1_INVALID_DESCRIPCION', 400, { details: details }) || this;
    }
    return Organica1InvalidDescripcionError;
}(errors_js_1.DomainError));
exports.Organica1InvalidDescripcionError = Organica1InvalidDescripcionError;
/**
 * Error de validación del titular organica1
 */
var Organica1InvalidTitularError = /** @class */ (function (_super) {
    __extends(Organica1InvalidTitularError, _super);
    function Organica1InvalidTitularError(details) {
        return _super.call(this, "Titular organica1 inv\u00E1lido: ".concat(details), 'ORGANICA1_INVALID_TITULAR', 400, { details: details }) || this;
    }
    return Organica1InvalidTitularError;
}(errors_js_1.DomainError));
exports.Organica1InvalidTitularError = Organica1InvalidTitularError;
/**
 * Error de validación del RFC organica1
 */
var Organica1InvalidRfcError = /** @class */ (function (_super) {
    __extends(Organica1InvalidRfcError, _super);
    function Organica1InvalidRfcError(details) {
        return _super.call(this, "RFC organica1 inv\u00E1lido: ".concat(details), 'ORGANICA1_INVALID_RFC', 400, { details: details }) || this;
    }
    return Organica1InvalidRfcError;
}(errors_js_1.DomainError));
exports.Organica1InvalidRfcError = Organica1InvalidRfcError;
/**
 * Error de validación del IMSS organica1
 */
var Organica1InvalidImssError = /** @class */ (function (_super) {
    __extends(Organica1InvalidImssError, _super);
    function Organica1InvalidImssError(details) {
        return _super.call(this, "IMSS organica1 inv\u00E1lido: ".concat(details), 'ORGANICA1_INVALID_IMSS', 400, { details: details }) || this;
    }
    return Organica1InvalidImssError;
}(errors_js_1.DomainError));
exports.Organica1InvalidImssError = Organica1InvalidImssError;
/**
 * Error de validación del INFONAVIT organica1
 */
var Organica1InvalidInfonavitError = /** @class */ (function (_super) {
    __extends(Organica1InvalidInfonavitError, _super);
    function Organica1InvalidInfonavitError(details) {
        return _super.call(this, "INFONAVIT organica1 inv\u00E1lido: ".concat(details), 'ORGANICA1_INVALID_INFONAVIT', 400, { details: details }) || this;
    }
    return Organica1InvalidInfonavitError;
}(errors_js_1.DomainError));
exports.Organica1InvalidInfonavitError = Organica1InvalidInfonavitError;
/**
 * Error de validación del estatus organica1
 */
var Organica1InvalidEstatusError = /** @class */ (function (_super) {
    __extends(Organica1InvalidEstatusError, _super);
    function Organica1InvalidEstatusError(details) {
        return _super.call(this, "Estatus organica1 inv\u00E1lido: ".concat(details), 'ORGANICA1_INVALID_ESTATUS', 400, { details: details }) || this;
    }
    return Organica1InvalidEstatusError;
}(errors_js_1.DomainError));
exports.Organica1InvalidEstatusError = Organica1InvalidEstatusError;
/**
 * Error de validación de fechas organica1
 */
var Organica1InvalidFechaError = /** @class */ (function (_super) {
    __extends(Organica1InvalidFechaError, _super);
    function Organica1InvalidFechaError(details) {
        return _super.call(this, "Fecha organica1 inv\u00E1lida: ".concat(details), 'ORGANICA1_INVALID_FECHA', 400, { details: details }) || this;
    }
    return Organica1InvalidFechaError;
}(errors_js_1.DomainError));
exports.Organica1InvalidFechaError = Organica1InvalidFechaError;
/**
 * Error cuando se intenta eliminar una entidad organica1 que está en uso
 */
var Organica1InUseError = /** @class */ (function (_super) {
    __extends(Organica1InUseError, _super);
    function Organica1InUseError(claveOrganica0, claveOrganica1) {
        return _super.call(this, "No se puede eliminar la entidad organica1 ".concat(claveOrganica0, "-").concat(claveOrganica1, " porque est\u00E1 siendo utilizada"), 'ORGANICA1_IN_USE', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1 }) || this;
    }
    return Organica1InUseError;
}(errors_js_1.DomainError));
exports.Organica1InUseError = Organica1InUseError;
/**
 * Error cuando la clave organica0 padre no existe
 */
var Organica1ParentNotFoundError = /** @class */ (function (_super) {
    __extends(Organica1ParentNotFoundError, _super);
    function Organica1ParentNotFoundError(claveOrganica0) {
        return _super.call(this, "La clave organica0 padre ".concat(claveOrganica0, " no existe"), 'ORGANICA1_PARENT_NOT_FOUND', 400, { claveOrganica0: claveOrganica0 }) || this;
    }
    return Organica1ParentNotFoundError;
}(errors_js_1.DomainError));
exports.Organica1ParentNotFoundError = Organica1ParentNotFoundError;
/**
 * Error de permisos insuficientes para operaciones de organica1
 */
var Organica1PermissionError = /** @class */ (function (_super) {
    __extends(Organica1PermissionError, _super);
    function Organica1PermissionError(operation, userId) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'ORGANICA1_PERMISSION_DENIED', 403, { operation: operation, userId: userId }) || this;
    }
    return Organica1PermissionError;
}(errors_js_1.DomainError));
exports.Organica1PermissionError = Organica1PermissionError;
