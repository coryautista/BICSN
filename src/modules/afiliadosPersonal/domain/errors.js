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
exports.AfiliadosPersonalTimeoutError = exports.AfiliadosPersonalSystemError = exports.AfiliadosPersonalDataNotFoundError = exports.AfiliadosPersonalConnectionError = exports.AfiliadosPersonalQueryFailedError = exports.AfiliadosPersonalInvalidClaveOrganicaError = exports.AfiliadosPersonalInvalidSearchTermError = exports.AfiliadosPersonalInvalidCredentialsError = exports.AfiliadosPersonalAccessDeniedError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
// Errores de permisos y acceso
var AfiliadosPersonalAccessDeniedError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalAccessDeniedError, _super);
    function AfiliadosPersonalAccessDeniedError(message, details) {
        if (message === void 0) { message = 'Usuario no tiene permisos para acceder a información de personal'; }
        return _super.call(this, 'AFILIADOS_PERSONAL_ACCESS_DENIED', message, details) || this;
    }
    return AfiliadosPersonalAccessDeniedError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalAccessDeniedError = AfiliadosPersonalAccessDeniedError;
var AfiliadosPersonalInvalidCredentialsError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalInvalidCredentialsError, _super);
    function AfiliadosPersonalInvalidCredentialsError(message, details) {
        if (message === void 0) { message = 'Credenciales de usuario inválidas para consulta de personal'; }
        return _super.call(this, 'AFILIADOS_PERSONAL_INVALID_CREDENTIALS', message, details) || this;
    }
    return AfiliadosPersonalInvalidCredentialsError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalInvalidCredentialsError = AfiliadosPersonalInvalidCredentialsError;
// Errores de validación de datos
var AfiliadosPersonalInvalidSearchTermError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalInvalidSearchTermError, _super);
    function AfiliadosPersonalInvalidSearchTermError(searchTerm, details) {
        return _super.call(this, 'AFILIADOS_PERSONAL_INVALID_SEARCH_TERM', "T\u00E9rmino de b\u00FAsqueda inv\u00E1lido: ".concat(searchTerm), __assign({ searchTerm: searchTerm }, details)) || this;
    }
    return AfiliadosPersonalInvalidSearchTermError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalInvalidSearchTermError = AfiliadosPersonalInvalidSearchTermError;
var AfiliadosPersonalInvalidClaveOrganicaError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalInvalidClaveOrganicaError, _super);
    function AfiliadosPersonalInvalidClaveOrganicaError(claveOrganica, level, details) {
        return _super.call(this, 'AFILIADOS_PERSONAL_INVALID_CLAVE_ORGANICA', "Clave org\u00E1nica ".concat(level, " inv\u00E1lida: ").concat(claveOrganica), __assign({ claveOrganica: claveOrganica, level: level }, details)) || this;
    }
    return AfiliadosPersonalInvalidClaveOrganicaError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalInvalidClaveOrganicaError = AfiliadosPersonalInvalidClaveOrganicaError;
// Errores de consulta y base de datos
var AfiliadosPersonalQueryFailedError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalQueryFailedError, _super);
    function AfiliadosPersonalQueryFailedError(operation, details) {
        return _super.call(this, 'AFILIADOS_PERSONAL_QUERY_FAILED', "Error al ejecutar consulta de ".concat(operation), __assign({ operation: operation }, details)) || this;
    }
    return AfiliadosPersonalQueryFailedError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalQueryFailedError = AfiliadosPersonalQueryFailedError;
var AfiliadosPersonalConnectionError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalConnectionError, _super);
    function AfiliadosPersonalConnectionError(message, details) {
        if (message === void 0) { message = 'Error de conexión con base de datos de personal'; }
        return _super.call(this, 'AFILIADOS_PERSONAL_CONNECTION_ERROR', message, details) || this;
    }
    return AfiliadosPersonalConnectionError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalConnectionError = AfiliadosPersonalConnectionError;
var AfiliadosPersonalDataNotFoundError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalDataNotFoundError, _super);
    function AfiliadosPersonalDataNotFoundError(searchCriteria, details) {
        return _super.call(this, 'AFILIADOS_PERSONAL_DATA_NOT_FOUND', 'No se encontraron datos de personal con los criterios especificados', __assign({ searchCriteria: searchCriteria }, details)) || this;
    }
    return AfiliadosPersonalDataNotFoundError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalDataNotFoundError = AfiliadosPersonalDataNotFoundError;
// Errores de sistema y operaciones
var AfiliadosPersonalSystemError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalSystemError, _super);
    function AfiliadosPersonalSystemError(message, details) {
        if (message === void 0) { message = 'Error interno del sistema de personal'; }
        return _super.call(this, 'AFILIADOS_PERSONAL_SYSTEM_ERROR', message, details) || this;
    }
    return AfiliadosPersonalSystemError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalSystemError = AfiliadosPersonalSystemError;
var AfiliadosPersonalTimeoutError = /** @class */ (function (_super) {
    __extends(AfiliadosPersonalTimeoutError, _super);
    function AfiliadosPersonalTimeoutError(operation, timeoutMs, details) {
        return _super.call(this, 'AFILIADOS_PERSONAL_TIMEOUT', "Timeout en operaci\u00F3n ".concat(operation, " despu\u00E9s de ").concat(timeoutMs, "ms"), __assign({ operation: operation, timeoutMs: timeoutMs }, details)) || this;
    }
    return AfiliadosPersonalTimeoutError;
}(errors_js_1.DomainError));
exports.AfiliadosPersonalTimeoutError = AfiliadosPersonalTimeoutError;
