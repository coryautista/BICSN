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
exports.OrgPersonalPermissionError = exports.OrgPersonalInUseError = exports.OrgPersonalInvalidPorcentajeError = exports.OrgPersonalInvalidFechaError = exports.OrgPersonalInvalidActivoError = exports.OrgPersonalInvalidQuinqueniosError = exports.OrgPersonalInvalidOtrasPrestacionesError = exports.OrgPersonalInvalidSueldoError = exports.OrgPersonalInvalidClaveOrganicaError = exports.OrgPersonalInvalidInternoError = exports.OrgPersonalAlreadyExistsError = exports.OrgPersonalSearchNotFoundError = exports.OrgPersonalNotFoundError = exports.OrgPersonalError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo orgPersonal
 */
var OrgPersonalError = /** @class */ (function (_super) {
    __extends(OrgPersonalError, _super);
    function OrgPersonalError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return OrgPersonalError;
}(errors_js_1.DomainError));
exports.OrgPersonalError = OrgPersonalError;
/**
 * Error cuando un registro orgPersonal no es encontrado por interno
 */
var OrgPersonalNotFoundError = /** @class */ (function (_super) {
    __extends(OrgPersonalNotFoundError, _super);
    function OrgPersonalNotFoundError(interno) {
        return _super.call(this, "Registro orgPersonal con interno ".concat(interno, " no encontrado"), 'ORG_PERSONAL_NOT_FOUND', 404) || this;
    }
    return OrgPersonalNotFoundError;
}(OrgPersonalError));
exports.OrgPersonalNotFoundError = OrgPersonalNotFoundError;
/**
 * Error cuando no se encuentra un registro por CURP/RFC/Nombre
 */
var OrgPersonalSearchNotFoundError = /** @class */ (function (_super) {
    __extends(OrgPersonalSearchNotFoundError, _super);
    function OrgPersonalSearchNotFoundError(searchTerm, searchType) {
        if (searchType === void 0) { searchType = 'CURP'; }
        var typeLabel = searchType === 'CURP' ? 'CURP' : searchType === 'RFC' ? 'RFC' : 'nombre';
        return _super.call(this, "No se encontr\u00F3 ning\u00FAn registro con ".concat(typeLabel, ": ").concat(searchTerm), 'ORG_PERSONAL_SEARCH_NOT_FOUND', 404) || this;
    }
    return OrgPersonalSearchNotFoundError;
}(OrgPersonalError));
exports.OrgPersonalSearchNotFoundError = OrgPersonalSearchNotFoundError;
/**
 * Error cuando ya existe un registro orgPersonal con el mismo interno
 */
var OrgPersonalAlreadyExistsError = /** @class */ (function (_super) {
    __extends(OrgPersonalAlreadyExistsError, _super);
    function OrgPersonalAlreadyExistsError(interno) {
        return _super.call(this, "Ya existe un registro orgPersonal con interno ".concat(interno), 'ORG_PERSONAL_ALREADY_EXISTS', 409) || this;
    }
    return OrgPersonalAlreadyExistsError;
}(OrgPersonalError));
exports.OrgPersonalAlreadyExistsError = OrgPersonalAlreadyExistsError;
/**
 * Error cuando el interno no es válido
 */
var OrgPersonalInvalidInternoError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidInternoError, _super);
    function OrgPersonalInvalidInternoError(interno) {
        return _super.call(this, "El interno '".concat(interno, "' no es v\u00E1lido. Debe ser un n\u00FAmero entero positivo."), 'ORG_PERSONAL_INVALID_INTERNO', 400) || this;
    }
    return OrgPersonalInvalidInternoError;
}(OrgPersonalError));
exports.OrgPersonalInvalidInternoError = OrgPersonalInvalidInternoError;
/**
 * Error cuando una clave orgánica no es válida
 */
var OrgPersonalInvalidClaveOrganicaError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidClaveOrganicaError, _super);
    function OrgPersonalInvalidClaveOrganicaError(clave, nivel) {
        return _super.call(this, "La clave org\u00E1nica ".concat(nivel, " '").concat(clave, "' no es v\u00E1lida. Debe ser una cadena de 1-2 caracteres alfanum\u00E9ricos o null."), 'ORG_PERSONAL_INVALID_CLAVE_ORGANICA', 400) || this;
    }
    return OrgPersonalInvalidClaveOrganicaError;
}(OrgPersonalError));
exports.OrgPersonalInvalidClaveOrganicaError = OrgPersonalInvalidClaveOrganicaError;
/**
 * Error cuando el sueldo no es válido
 */
var OrgPersonalInvalidSueldoError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidSueldoError, _super);
    function OrgPersonalInvalidSueldoError(sueldo) {
        return _super.call(this, "El sueldo '".concat(sueldo, "' no es v\u00E1lido. Debe ser un n\u00FAmero positivo o null."), 'ORG_PERSONAL_INVALID_SUELDO', 400) || this;
    }
    return OrgPersonalInvalidSueldoError;
}(OrgPersonalError));
exports.OrgPersonalInvalidSueldoError = OrgPersonalInvalidSueldoError;
/**
 * Error cuando otras prestaciones no es válido
 */
var OrgPersonalInvalidOtrasPrestacionesError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidOtrasPrestacionesError, _super);
    function OrgPersonalInvalidOtrasPrestacionesError(otrasPrestaciones) {
        return _super.call(this, "Otras prestaciones '".concat(otrasPrestaciones, "' no es v\u00E1lido. Debe ser un n\u00FAmero positivo o null."), 'ORG_PERSONAL_INVALID_OTRAS_PRESTACIONES', 400) || this;
    }
    return OrgPersonalInvalidOtrasPrestacionesError;
}(OrgPersonalError));
exports.OrgPersonalInvalidOtrasPrestacionesError = OrgPersonalInvalidOtrasPrestacionesError;
/**
 * Error cuando quinquenios no es válido
 */
var OrgPersonalInvalidQuinqueniosError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidQuinqueniosError, _super);
    function OrgPersonalInvalidQuinqueniosError(quinquenios) {
        return _super.call(this, "Quinquenios '".concat(quinquenios, "' no es v\u00E1lido. Debe ser un n\u00FAmero positivo o null."), 'ORG_PERSONAL_INVALID_QUINQUENIOS', 400) || this;
    }
    return OrgPersonalInvalidQuinqueniosError;
}(OrgPersonalError));
exports.OrgPersonalInvalidQuinqueniosError = OrgPersonalInvalidQuinqueniosError;
/**
 * Error cuando el estado activo no es válido
 */
var OrgPersonalInvalidActivoError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidActivoError, _super);
    function OrgPersonalInvalidActivoError(activo) {
        return _super.call(this, "El estado activo '".concat(activo, "' no es v\u00E1lido. Debe ser 'S', 'N' o null."), 'ORG_PERSONAL_INVALID_ACTIVO', 400) || this;
    }
    return OrgPersonalInvalidActivoError;
}(OrgPersonalError));
exports.OrgPersonalInvalidActivoError = OrgPersonalInvalidActivoError;
/**
 * Error cuando la fecha de movimiento no es válida
 */
var OrgPersonalInvalidFechaError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidFechaError, _super);
    function OrgPersonalInvalidFechaError(fecha) {
        return _super.call(this, "La fecha de movimiento '".concat(fecha, "' no es v\u00E1lida. Debe ser una fecha ISO v\u00E1lida o null."), 'ORG_PERSONAL_INVALID_FECHA', 400) || this;
    }
    return OrgPersonalInvalidFechaError;
}(OrgPersonalError));
exports.OrgPersonalInvalidFechaError = OrgPersonalInvalidFechaError;
/**
 * Error cuando el porcentaje no es válido
 */
var OrgPersonalInvalidPorcentajeError = /** @class */ (function (_super) {
    __extends(OrgPersonalInvalidPorcentajeError, _super);
    function OrgPersonalInvalidPorcentajeError(porcentaje) {
        return _super.call(this, "El porcentaje '".concat(porcentaje, "' no es v\u00E1lido. Debe ser un n\u00FAmero entre 0 y 100 o null."), 'ORG_PERSONAL_INVALID_PORCENTAJE', 400) || this;
    }
    return OrgPersonalInvalidPorcentajeError;
}(OrgPersonalError));
exports.OrgPersonalInvalidPorcentajeError = OrgPersonalInvalidPorcentajeError;
/**
 * Error cuando el registro está en uso y no puede ser eliminado
 */
var OrgPersonalInUseError = /** @class */ (function (_super) {
    __extends(OrgPersonalInUseError, _super);
    function OrgPersonalInUseError(interno) {
        return _super.call(this, "El registro orgPersonal con interno ".concat(interno, " est\u00E1 en uso y no puede ser eliminado"), 'ORG_PERSONAL_IN_USE', 409) || this;
    }
    return OrgPersonalInUseError;
}(OrgPersonalError));
exports.OrgPersonalInUseError = OrgPersonalInUseError;
/**
 * Error de permisos para acceder a información orgPersonal
 */
var OrgPersonalPermissionError = /** @class */ (function (_super) {
    __extends(OrgPersonalPermissionError, _super);
    function OrgPersonalPermissionError(userId) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene permisos para acceder a esta informaci\u00F3n orgPersonal."), 'ORG_PERSONAL_PERMISSION_DENIED', 403) || this;
    }
    return OrgPersonalPermissionError;
}(OrgPersonalError));
exports.OrgPersonalPermissionError = OrgPersonalPermissionError;
