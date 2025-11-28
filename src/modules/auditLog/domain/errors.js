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
exports.AuditLogRateLimitExceededError = exports.AuditLogTimeoutError = exports.AuditLogSystemError = exports.AuditLogDataNotFoundError = exports.AuditLogConnectionError = exports.AuditLogQueryFailedError = exports.AuditLogFutureDateError = exports.AuditLogDateRangeTooLargeError = exports.AuditLogInvalidDateFormatError = exports.AuditLogInvalidDateRangeError = exports.AuditLogInsufficientPermissionsError = exports.AuditLogAccessDeniedError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
// Errores de permisos y acceso
var AuditLogAccessDeniedError = /** @class */ (function (_super) {
    __extends(AuditLogAccessDeniedError, _super);
    function AuditLogAccessDeniedError(message, details) {
        if (message === void 0) { message = 'Acceso denegado a logs de auditoría. Se requiere rol de administrador'; }
        return _super.call(this, 'AUDIT_LOG_ACCESS_DENIED', message, details) || this;
    }
    return AuditLogAccessDeniedError;
}(errors_js_1.DomainError));
exports.AuditLogAccessDeniedError = AuditLogAccessDeniedError;
var AuditLogInsufficientPermissionsError = /** @class */ (function (_super) {
    __extends(AuditLogInsufficientPermissionsError, _super);
    function AuditLogInsufficientPermissionsError(userRole, details) {
        return _super.call(this, 'AUDIT_LOG_INSUFFICIENT_PERMISSIONS', "Permisos insuficientes para acceder a logs de auditor\u00EDa. Rol actual: ".concat(userRole || 'desconocido'), __assign({ userRole: userRole }, details)) || this;
    }
    return AuditLogInsufficientPermissionsError;
}(errors_js_1.DomainError));
exports.AuditLogInsufficientPermissionsError = AuditLogInsufficientPermissionsError;
// Errores de validación de fechas
var AuditLogInvalidDateRangeError = /** @class */ (function (_super) {
    __extends(AuditLogInvalidDateRangeError, _super);
    function AuditLogInvalidDateRangeError(fechaInicio, fechaFin, details) {
        return _super.call(this, 'AUDIT_LOG_INVALID_DATE_RANGE', "Rango de fechas inv\u00E1lido: ".concat(fechaInicio, " - ").concat(fechaFin), __assign({ fechaInicio: fechaInicio, fechaFin: fechaFin }, details)) || this;
    }
    return AuditLogInvalidDateRangeError;
}(errors_js_1.DomainError));
exports.AuditLogInvalidDateRangeError = AuditLogInvalidDateRangeError;
var AuditLogInvalidDateFormatError = /** @class */ (function (_super) {
    __extends(AuditLogInvalidDateFormatError, _super);
    function AuditLogInvalidDateFormatError(dateString, details) {
        return _super.call(this, 'AUDIT_LOG_INVALID_DATE_FORMAT', "Formato de fecha inv\u00E1lido: ".concat(dateString), __assign({ dateString: dateString }, details)) || this;
    }
    return AuditLogInvalidDateFormatError;
}(errors_js_1.DomainError));
exports.AuditLogInvalidDateFormatError = AuditLogInvalidDateFormatError;
var AuditLogDateRangeTooLargeError = /** @class */ (function (_super) {
    __extends(AuditLogDateRangeTooLargeError, _super);
    function AuditLogDateRangeTooLargeError(fechaInicio, fechaFin, maxDays, actualDays, details) {
        return _super.call(this, 'AUDIT_LOG_DATE_RANGE_TOO_LARGE', "Rango de fechas demasiado grande. M\u00E1ximo ".concat(maxDays, " d\u00EDas, solicitado ").concat(actualDays, " d\u00EDas"), __assign({ fechaInicio: fechaInicio, fechaFin: fechaFin, maxDays: maxDays, actualDays: actualDays }, details)) || this;
    }
    return AuditLogDateRangeTooLargeError;
}(errors_js_1.DomainError));
exports.AuditLogDateRangeTooLargeError = AuditLogDateRangeTooLargeError;
var AuditLogFutureDateError = /** @class */ (function (_super) {
    __extends(AuditLogFutureDateError, _super);
    function AuditLogFutureDateError(dateString, details) {
        return _super.call(this, 'AUDIT_LOG_FUTURE_DATE', "No se pueden consultar logs de fechas futuras: ".concat(dateString), __assign({ dateString: dateString }, details)) || this;
    }
    return AuditLogFutureDateError;
}(errors_js_1.DomainError));
exports.AuditLogFutureDateError = AuditLogFutureDateError;
// Errores de consulta y base de datos
var AuditLogQueryFailedError = /** @class */ (function (_super) {
    __extends(AuditLogQueryFailedError, _super);
    function AuditLogQueryFailedError(operation, details) {
        return _super.call(this, 'AUDIT_LOG_QUERY_FAILED', "Error al ejecutar consulta de logs de auditor\u00EDa: ".concat(operation), __assign({ operation: operation }, details)) || this;
    }
    return AuditLogQueryFailedError;
}(errors_js_1.DomainError));
exports.AuditLogQueryFailedError = AuditLogQueryFailedError;
var AuditLogConnectionError = /** @class */ (function (_super) {
    __extends(AuditLogConnectionError, _super);
    function AuditLogConnectionError(message, details) {
        if (message === void 0) { message = 'Error de conexión con base de datos de auditoría'; }
        return _super.call(this, 'AUDIT_LOG_CONNECTION_ERROR', message, details) || this;
    }
    return AuditLogConnectionError;
}(errors_js_1.DomainError));
exports.AuditLogConnectionError = AuditLogConnectionError;
var AuditLogDataNotFoundError = /** @class */ (function (_super) {
    __extends(AuditLogDataNotFoundError, _super);
    function AuditLogDataNotFoundError(searchCriteria, details) {
        return _super.call(this, 'AUDIT_LOG_DATA_NOT_FOUND', 'No se encontraron logs de auditoría para los criterios especificados', __assign({ searchCriteria: searchCriteria }, details)) || this;
    }
    return AuditLogDataNotFoundError;
}(errors_js_1.DomainError));
exports.AuditLogDataNotFoundError = AuditLogDataNotFoundError;
// Errores de sistema y operaciones
var AuditLogSystemError = /** @class */ (function (_super) {
    __extends(AuditLogSystemError, _super);
    function AuditLogSystemError(message, details) {
        if (message === void 0) { message = 'Error interno del sistema de auditoría'; }
        return _super.call(this, 'AUDIT_LOG_SYSTEM_ERROR', message, details) || this;
    }
    return AuditLogSystemError;
}(errors_js_1.DomainError));
exports.AuditLogSystemError = AuditLogSystemError;
var AuditLogTimeoutError = /** @class */ (function (_super) {
    __extends(AuditLogTimeoutError, _super);
    function AuditLogTimeoutError(operation, timeoutMs, details) {
        return _super.call(this, 'AUDIT_LOG_TIMEOUT', "Timeout en operaci\u00F3n de auditor\u00EDa ".concat(operation, " despu\u00E9s de ").concat(timeoutMs, "ms"), __assign({ operation: operation, timeoutMs: timeoutMs }, details)) || this;
    }
    return AuditLogTimeoutError;
}(errors_js_1.DomainError));
exports.AuditLogTimeoutError = AuditLogTimeoutError;
var AuditLogRateLimitExceededError = /** @class */ (function (_super) {
    __extends(AuditLogRateLimitExceededError, _super);
    function AuditLogRateLimitExceededError(userId, limit, windowMs, details) {
        return _super.call(this, 'AUDIT_LOG_RATE_LIMIT_EXCEEDED', "L\u00EDmite de consultas excedido para usuario ".concat(userId, ". M\u00E1ximo ").concat(limit, " consultas por ").concat(windowMs, "ms"), __assign({ userId: userId, limit: limit, windowMs: windowMs }, details)) || this;
    }
    return AuditLogRateLimitExceededError;
}(errors_js_1.DomainError));
exports.AuditLogRateLimitExceededError = AuditLogRateLimitExceededError;
