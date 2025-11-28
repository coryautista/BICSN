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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalleTimeoutError = exports.CalleConnectionError = exports.CalleSystemError = exports.PaginationLimitExceededError = exports.InvalidPaginationError = exports.InvalidCodigoPostalError = exports.InvalidMunicipioIdError = exports.InvalidEstadoIdError = exports.InvalidSearchFiltersError = exports.CalleSearchError = exports.CalleQueryError = exports.CalleInUseError = exports.CalleDeletionError = exports.CalleAccessDeniedError = exports.CallePermissionError = exports.InvalidColoniaIdError = exports.ColoniaNotFoundError = exports.CalleNombreEmptyError = exports.CalleNombreTooLongError = exports.CalleNombreRequiredError = exports.InvalidCalleDataError = exports.CalleNotFoundError = exports.CalleAlreadyExistsError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
// Errores de creación y actualización de calles
var CalleAlreadyExistsError = /** @class */ (function (_super) {
    __extends(CalleAlreadyExistsError, _super);
    function CalleAlreadyExistsError(calleId, nombreCalle, coloniaId, details) {
        return _super.call(this, 'CALLE_ALREADY_EXISTS', "Ya existe una calle con ID ".concat(calleId, " o nombre \"").concat(nombreCalle, "\" en la colonia ").concat(coloniaId), __assign({ calleId: calleId, nombreCalle: nombreCalle, coloniaId: coloniaId }, details)) || this;
    }
    return CalleAlreadyExistsError;
}(errors_js_1.DomainError));
exports.CalleAlreadyExistsError = CalleAlreadyExistsError;
var CalleNotFoundError = /** @class */ (function (_super) {
    __extends(CalleNotFoundError, _super);
    function CalleNotFoundError(calleId, details) {
        return _super.call(this, 'CALLE_NOT_FOUND', "Calle con ID ".concat(calleId, " no encontrada"), __assign({ calleId: calleId }, details)) || this;
    }
    return CalleNotFoundError;
}(errors_js_1.DomainError));
exports.CalleNotFoundError = CalleNotFoundError;
var InvalidCalleDataError = /** @class */ (function (_super) {
    __extends(InvalidCalleDataError, _super);
    function InvalidCalleDataError(message, details) {
        if (message === void 0) { message = 'Datos de calle inválidos'; }
        return _super.call(this, 'INVALID_CALLE_DATA', message, details) || this;
    }
    return InvalidCalleDataError;
}(errors_js_1.DomainError));
exports.InvalidCalleDataError = InvalidCalleDataError;
var CalleNombreRequiredError = /** @class */ (function (_super) {
    __extends(CalleNombreRequiredError, _super);
    function CalleNombreRequiredError(details) {
        return _super.call(this, 'CALLE_NOMBRE_REQUIRED', 'El nombre de la calle es requerido', details) || this;
    }
    return CalleNombreRequiredError;
}(errors_js_1.DomainError));
exports.CalleNombreRequiredError = CalleNombreRequiredError;
var CalleNombreTooLongError = /** @class */ (function (_super) {
    __extends(CalleNombreTooLongError, _super);
    function CalleNombreTooLongError(nombreCalle, maxLength, details) {
        if (maxLength === void 0) { maxLength = 150; }
        return _super.call(this, 'CALLE_NOMBRE_TOO_LONG', "El nombre de la calle \"".concat(nombreCalle, "\" excede la longitud m\u00E1xima de ").concat(maxLength, " caracteres"), __assign({ nombreCalle: nombreCalle, maxLength: maxLength, actualLength: nombreCalle.length }, details)) || this;
    }
    return CalleNombreTooLongError;
}(errors_js_1.DomainError));
exports.CalleNombreTooLongError = CalleNombreTooLongError;
var CalleNombreEmptyError = /** @class */ (function (_super) {
    __extends(CalleNombreEmptyError, _super);
    function CalleNombreEmptyError(details) {
        return _super.call(this, 'CALLE_NOMBRE_EMPTY', 'El nombre de la calle no puede estar vacío', details) || this;
    }
    return CalleNombreEmptyError;
}(errors_js_1.DomainError));
exports.CalleNombreEmptyError = CalleNombreEmptyError;
// Errores relacionados con colonia
var ColoniaNotFoundError = /** @class */ (function (_super) {
    __extends(ColoniaNotFoundError, _super);
    function ColoniaNotFoundError(coloniaId, details) {
        return _super.call(this, 'COLONIA_NOT_FOUND', "Colonia con ID ".concat(coloniaId, " no encontrada"), __assign({ coloniaId: coloniaId }, details)) || this;
    }
    return ColoniaNotFoundError;
}(errors_js_1.DomainError));
exports.ColoniaNotFoundError = ColoniaNotFoundError;
var InvalidColoniaIdError = /** @class */ (function (_super) {
    __extends(InvalidColoniaIdError, _super);
    function InvalidColoniaIdError(coloniaId, details) {
        return _super.call(this, 'INVALID_COLONIA_ID', "ID de colonia inv\u00E1lido: ".concat(coloniaId), __assign({ coloniaId: coloniaId }, details)) || this;
    }
    return InvalidColoniaIdError;
}(errors_js_1.DomainError));
exports.InvalidColoniaIdError = InvalidColoniaIdError;
// Errores de permisos y autorización
var CallePermissionError = /** @class */ (function (_super) {
    __extends(CallePermissionError, _super);
    function CallePermissionError(action, userId, details) {
        return _super.call(this, 'CALLE_PERMISSION_DENIED', "Permisos insuficientes para ".concat(action, " calle"), __assign({ action: action, userId: userId }, details)) || this;
    }
    return CallePermissionError;
}(errors_js_1.DomainError));
exports.CallePermissionError = CallePermissionError;
var CalleAccessDeniedError = /** @class */ (function (_super) {
    __extends(CalleAccessDeniedError, _super);
    function CalleAccessDeniedError(resource, details) {
        return _super.call(this, 'CALLE_ACCESS_DENIED', "Acceso denegado al recurso de calles: ".concat(resource), __assign({ resource: resource }, details)) || this;
    }
    return CalleAccessDeniedError;
}(errors_js_1.DomainError));
exports.CalleAccessDeniedError = CalleAccessDeniedError;
// Errores de eliminación
var CalleDeletionError = /** @class */ (function (_super) {
    __extends(CalleDeletionError, _super);
    function CalleDeletionError(calleId, reason, details) {
        return _super.call(this, 'CALLE_DELETION_ERROR', "Error al eliminar calle ".concat(calleId, ": ").concat(reason), __assign({ calleId: calleId, reason: reason }, details)) || this;
    }
    return CalleDeletionError;
}(errors_js_1.DomainError));
exports.CalleDeletionError = CalleDeletionError;
var CalleInUseError = /** @class */ (function (_super) {
    __extends(CalleInUseError, _super);
    function CalleInUseError(calleId, references, details) {
        return _super.call(this, 'CALLE_IN_USE', "No se puede eliminar la calle ".concat(calleId, " porque est\u00E1 siendo utilizada"), __assign({ calleId: calleId, references: references }, details)) || this;
    }
    return CalleInUseError;
}(errors_js_1.DomainError));
exports.CalleInUseError = CalleInUseError;
// Errores de consulta y búsqueda
var CalleQueryError = /** @class */ (function (_super) {
    __extends(CalleQueryError, _super);
    function CalleQueryError(operation, reason, details) {
        return _super.call(this, 'CALLE_QUERY_ERROR', "Error en consulta de calles (".concat(operation, "): ").concat(reason), __assign({ operation: operation, reason: reason }, details)) || this;
    }
    return CalleQueryError;
}(errors_js_1.DomainError));
exports.CalleQueryError = CalleQueryError;
var CalleSearchError = /** @class */ (function (_super) {
    __extends(CalleSearchError, _super);
    function CalleSearchError(filters, reason, details) {
        return _super.call(this, 'CALLE_SEARCH_ERROR', "Error en b\u00FAsqueda de calles: ".concat(reason), __assign({ filters: filters, reason: reason }, details)) || this;
    }
    return CalleSearchError;
}(errors_js_1.DomainError));
exports.CalleSearchError = CalleSearchError;
var InvalidSearchFiltersError = /** @class */ (function (_super) {
    __extends(InvalidSearchFiltersError, _super);
    function InvalidSearchFiltersError(invalidFilters, details) {
        return _super.call(this, 'INVALID_SEARCH_FILTERS', "Filtros de b\u00FAsqueda inv\u00E1lidos: ".concat(invalidFilters.join(', ')), __assign({ invalidFilters: invalidFilters }, details)) || this;
    }
    return InvalidSearchFiltersError;
}(errors_js_1.DomainError));
exports.InvalidSearchFiltersError = InvalidSearchFiltersError;
// Errores de validación de filtros
var InvalidEstadoIdError = /** @class */ (function (_super) {
    __extends(InvalidEstadoIdError, _super);
    function InvalidEstadoIdError(estadoId, details) {
        return _super.call(this, 'INVALID_ESTADO_ID', "ID de estado inv\u00E1lido: ".concat(estadoId, " (debe ser 2 caracteres)"), __assign({ estadoId: estadoId }, details)) || this;
    }
    return InvalidEstadoIdError;
}(errors_js_1.DomainError));
exports.InvalidEstadoIdError = InvalidEstadoIdError;
var InvalidMunicipioIdError = /** @class */ (function (_super) {
    __extends(InvalidMunicipioIdError, _super);
    function InvalidMunicipioIdError(municipioId, details) {
        return _super.call(this, 'INVALID_MUNICIPIO_ID', "ID de municipio inv\u00E1lido: ".concat(municipioId, " (debe ser num\u00E9rico)"), __assign({ municipioId: municipioId }, details)) || this;
    }
    return InvalidMunicipioIdError;
}(errors_js_1.DomainError));
exports.InvalidMunicipioIdError = InvalidMunicipioIdError;
var InvalidCodigoPostalError = /** @class */ (function (_super) {
    __extends(InvalidCodigoPostalError, _super);
    function InvalidCodigoPostalError(codigoPostal, details) {
        return _super.call(this, 'INVALID_CODIGO_POSTAL', "C\u00F3digo postal inv\u00E1lido: ".concat(codigoPostal, " (debe ser 5 d\u00EDgitos)"), __assign({ codigoPostal: codigoPostal }, details)) || this;
    }
    return InvalidCodigoPostalError;
}(errors_js_1.DomainError));
exports.InvalidCodigoPostalError = InvalidCodigoPostalError;
// Errores de paginación
var InvalidPaginationError = /** @class */ (function (_super) {
    __extends(InvalidPaginationError, _super);
    function InvalidPaginationError(param, value, details) {
        return _super.call(this, 'INVALID_PAGINATION', "Par\u00E1metro de paginaci\u00F3n inv\u00E1lido ".concat(param, ": ").concat(value), __assign({ param: param, value: value }, details)) || this;
    }
    return InvalidPaginationError;
}(errors_js_1.DomainError));
exports.InvalidPaginationError = InvalidPaginationError;
var PaginationLimitExceededError = /** @class */ (function (_super) {
    __extends(PaginationLimitExceededError, _super);
    function PaginationLimitExceededError(limit, maxLimit, details) {
        return _super.call(this, 'PAGINATION_LIMIT_EXCEEDED', "L\u00EDmite de paginaci\u00F3n ".concat(limit, " excede el m\u00E1ximo permitido ").concat(maxLimit), __assign({ limit: limit, maxLimit: maxLimit }, details)) || this;
    }
    return PaginationLimitExceededError;
}(errors_js_1.DomainError));
exports.PaginationLimitExceededError = PaginationLimitExceededError;
// Errores del sistema
var CalleSystemError = /** @class */ (function (_super) {
    __extends(CalleSystemError, _super);
    function CalleSystemError(message, details) {
        if (message === void 0) { message = 'Error interno del sistema de calles'; }
        return _super.call(this, 'CALLE_SYSTEM_ERROR', message, details) || this;
    }
    return CalleSystemError;
}(errors_js_1.DomainError));
exports.CalleSystemError = CalleSystemError;
var CalleConnectionError = /** @class */ (function (_super) {
    __extends(CalleConnectionError, _super);
    function CalleConnectionError(message, details) {
        if (message === void 0) { message = 'Error de conexión con el sistema de calles'; }
        return _super.call(this, 'CALLE_CONNECTION_ERROR', message, details) || this;
    }
    return CalleConnectionError;
}(errors_js_1.DomainError));
exports.CalleConnectionError = CalleConnectionError;
var CalleTimeoutError = /** @class */ (function (_super) {
    __extends(CalleTimeoutError, _super);
    function CalleTimeoutError(operation, timeoutMs, details) {
        return _super.call(this, 'CALLE_TIMEOUT', "Timeout en operaci\u00F3n de calles ".concat(operation, " despu\u00E9s de ").concat(timeoutMs, "ms"), __assign({ operation: operation, timeoutMs: timeoutMs }, details)) || this;
    }
    return CalleTimeoutError;
}(errors_js_1.DomainError));
exports.CalleTimeoutError = CalleTimeoutError;
