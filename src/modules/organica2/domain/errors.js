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
exports.Organica2DeletionError = exports.Organica2PermissionError = exports.Organica2ParentNotFoundError = exports.Organica2InUseError = exports.Organica2InvalidFechaError = exports.Organica2InvalidEstatusError = exports.Organica2InvalidTitularError = exports.Organica2InvalidDescripcionError = exports.Organica2InvalidClaveOrganica2Error = exports.Organica2InvalidClaveOrganica1Error = exports.Organica2InvalidClaveOrganica0Error = exports.Organica2AlreadyExistsError = exports.Organica2NotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error cuando una entidad organica2 no es encontrada
 */
var Organica2NotFoundError = /** @class */ (function (_super) {
    __extends(Organica2NotFoundError, _super);
    function Organica2NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2) {
        return _super.call(this, "Entidad organica2 con clave ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, " no encontrada"), 'ORGANICA2_NOT_FOUND', 404, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2 }) || this;
    }
    return Organica2NotFoundError;
}(errors_js_1.DomainError));
exports.Organica2NotFoundError = Organica2NotFoundError;
/**
 * Error cuando ya existe una entidad organica2 con la misma clave
 */
var Organica2AlreadyExistsError = /** @class */ (function (_super) {
    __extends(Organica2AlreadyExistsError, _super);
    function Organica2AlreadyExistsError(claveOrganica0, claveOrganica1, claveOrganica2) {
        return _super.call(this, "Ya existe una entidad organica2 con la clave: ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2), 'ORGANICA2_ALREADY_EXISTS', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2 }) || this;
    }
    return Organica2AlreadyExistsError;
}(errors_js_1.DomainError));
exports.Organica2AlreadyExistsError = Organica2AlreadyExistsError;
/**
 * Error de validación de la clave organica0
 */
var Organica2InvalidClaveOrganica0Error = /** @class */ (function (_super) {
    __extends(Organica2InvalidClaveOrganica0Error, _super);
    function Organica2InvalidClaveOrganica0Error(details) {
        return _super.call(this, "Clave organica0 inv\u00E1lida: ".concat(details), 'ORGANICA2_INVALID_CLAVE_ORGANICA0', 400, { details: details }) || this;
    }
    return Organica2InvalidClaveOrganica0Error;
}(errors_js_1.DomainError));
exports.Organica2InvalidClaveOrganica0Error = Organica2InvalidClaveOrganica0Error;
/**
 * Error de validación de la clave organica1
 */
var Organica2InvalidClaveOrganica1Error = /** @class */ (function (_super) {
    __extends(Organica2InvalidClaveOrganica1Error, _super);
    function Organica2InvalidClaveOrganica1Error(details) {
        return _super.call(this, "Clave organica1 inv\u00E1lida: ".concat(details), 'ORGANICA2_INVALID_CLAVE_ORGANICA1', 400, { details: details }) || this;
    }
    return Organica2InvalidClaveOrganica1Error;
}(errors_js_1.DomainError));
exports.Organica2InvalidClaveOrganica1Error = Organica2InvalidClaveOrganica1Error;
/**
 * Error de validación de la clave organica2
 */
var Organica2InvalidClaveOrganica2Error = /** @class */ (function (_super) {
    __extends(Organica2InvalidClaveOrganica2Error, _super);
    function Organica2InvalidClaveOrganica2Error(details) {
        return _super.call(this, "Clave organica2 inv\u00E1lida: ".concat(details), 'ORGANICA2_INVALID_CLAVE_ORGANICA2', 400, { details: details }) || this;
    }
    return Organica2InvalidClaveOrganica2Error;
}(errors_js_1.DomainError));
exports.Organica2InvalidClaveOrganica2Error = Organica2InvalidClaveOrganica2Error;
/**
 * Error de validación de la descripción organica2
 */
var Organica2InvalidDescripcionError = /** @class */ (function (_super) {
    __extends(Organica2InvalidDescripcionError, _super);
    function Organica2InvalidDescripcionError(details) {
        return _super.call(this, "Descripci\u00F3n organica2 inv\u00E1lida: ".concat(details), 'ORGANICA2_INVALID_DESCRIPCION', 400, { details: details }) || this;
    }
    return Organica2InvalidDescripcionError;
}(errors_js_1.DomainError));
exports.Organica2InvalidDescripcionError = Organica2InvalidDescripcionError;
/**
 * Error de validación del titular organica2
 */
var Organica2InvalidTitularError = /** @class */ (function (_super) {
    __extends(Organica2InvalidTitularError, _super);
    function Organica2InvalidTitularError(details) {
        return _super.call(this, "Titular organica2 inv\u00E1lido: ".concat(details), 'ORGANICA2_INVALID_TITULAR', 400, { details: details }) || this;
    }
    return Organica2InvalidTitularError;
}(errors_js_1.DomainError));
exports.Organica2InvalidTitularError = Organica2InvalidTitularError;
/**
 * Error de validación del estatus organica2
 */
var Organica2InvalidEstatusError = /** @class */ (function (_super) {
    __extends(Organica2InvalidEstatusError, _super);
    function Organica2InvalidEstatusError(details) {
        return _super.call(this, "Estatus organica2 inv\u00E1lido: ".concat(details), 'ORGANICA2_INVALID_ESTATUS', 400, { details: details }) || this;
    }
    return Organica2InvalidEstatusError;
}(errors_js_1.DomainError));
exports.Organica2InvalidEstatusError = Organica2InvalidEstatusError;
/**
 * Error de validación de fechas organica2
 */
var Organica2InvalidFechaError = /** @class */ (function (_super) {
    __extends(Organica2InvalidFechaError, _super);
    function Organica2InvalidFechaError(details) {
        return _super.call(this, "Fecha organica2 inv\u00E1lida: ".concat(details), 'ORGANICA2_INVALID_FECHA', 400, { details: details }) || this;
    }
    return Organica2InvalidFechaError;
}(errors_js_1.DomainError));
exports.Organica2InvalidFechaError = Organica2InvalidFechaError;
/**
 * Error cuando se intenta eliminar una entidad organica2 que está en uso
 */
var Organica2InUseError = /** @class */ (function (_super) {
    __extends(Organica2InUseError, _super);
    function Organica2InUseError(claveOrganica0, claveOrganica1, claveOrganica2) {
        return _super.call(this, "No se puede eliminar la entidad organica2 ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, " porque est\u00E1 siendo utilizada"), 'ORGANICA2_IN_USE', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2 }) || this;
    }
    return Organica2InUseError;
}(errors_js_1.DomainError));
exports.Organica2InUseError = Organica2InUseError;
/**
 * Error cuando la clave organica1 padre no existe
 */
var Organica2ParentNotFoundError = /** @class */ (function (_super) {
    __extends(Organica2ParentNotFoundError, _super);
    function Organica2ParentNotFoundError(claveOrganica0, claveOrganica1) {
        return _super.call(this, "La clave organica1 padre ".concat(claveOrganica0, "-").concat(claveOrganica1, " no existe"), 'ORGANICA2_PARENT_NOT_FOUND', 400, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1 }) || this;
    }
    return Organica2ParentNotFoundError;
}(errors_js_1.DomainError));
exports.Organica2ParentNotFoundError = Organica2ParentNotFoundError;
/**
 * Error de permisos insuficientes para operaciones de organica2
 */
var Organica2PermissionError = /** @class */ (function (_super) {
    __extends(Organica2PermissionError, _super);
    function Organica2PermissionError(operation, userId) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'ORGANICA2_PERMISSION_DENIED', 403, { operation: operation, userId: userId }) || this;
    }
    return Organica2PermissionError;
}(errors_js_1.DomainError));
exports.Organica2PermissionError = Organica2PermissionError;
/**
 * Error cuando falla la eliminación de una entidad organica2
 */
var Organica2DeletionError = /** @class */ (function (_super) {
    __extends(Organica2DeletionError, _super);
    function Organica2DeletionError(details) {
        return _super.call(this, "Error en la eliminaci\u00F3n de organica2: ".concat(details), 'ORGANICA2_DELETION_ERROR', 500, { details: details }) || this;
    }
    return Organica2DeletionError;
}(errors_js_1.DomainError));
exports.Organica2DeletionError = Organica2DeletionError;
