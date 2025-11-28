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
exports.OrganicaCascadePermissionError = exports.OrganicaCascadeOrganica2NotFoundError = exports.OrganicaCascadeOrganica1NotFoundError = exports.OrganicaCascadeOrganica0NotFoundError = exports.OrganicaCascadeInvalidClaveOrganica2Error = exports.OrganicaCascadeInvalidClaveOrganica1Error = exports.OrganicaCascadeInvalidClaveOrganica0Error = exports.OrganicaCascadeError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo organicaCascade
 */
var OrganicaCascadeError = /** @class */ (function (_super) {
    __extends(OrganicaCascadeError, _super);
    function OrganicaCascadeError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return OrganicaCascadeError;
}(errors_js_1.DomainError));
exports.OrganicaCascadeError = OrganicaCascadeError;
/**
 * Error cuando una clave orgánica 0 no es válida
 */
var OrganicaCascadeInvalidClaveOrganica0Error = /** @class */ (function (_super) {
    __extends(OrganicaCascadeInvalidClaveOrganica0Error, _super);
    function OrganicaCascadeInvalidClaveOrganica0Error(claveOrganica0) {
        return _super.call(this, "La clave org\u00E1nica 0 '".concat(claveOrganica0, "' no es v\u00E1lida. Debe ser una cadena de 1-2 caracteres alfanum\u00E9ricos."), 'ORGANICA_CASCADE_INVALID_CLAVE_0', 400) || this;
    }
    return OrganicaCascadeInvalidClaveOrganica0Error;
}(OrganicaCascadeError));
exports.OrganicaCascadeInvalidClaveOrganica0Error = OrganicaCascadeInvalidClaveOrganica0Error;
/**
 * Error cuando una clave orgánica 1 no es válida
 */
var OrganicaCascadeInvalidClaveOrganica1Error = /** @class */ (function (_super) {
    __extends(OrganicaCascadeInvalidClaveOrganica1Error, _super);
    function OrganicaCascadeInvalidClaveOrganica1Error(claveOrganica1) {
        return _super.call(this, "La clave org\u00E1nica 1 '".concat(claveOrganica1, "' no es v\u00E1lida. Debe ser una cadena de 1-2 caracteres alfanum\u00E9ricos."), 'ORGANICA_CASCADE_INVALID_CLAVE_1', 400) || this;
    }
    return OrganicaCascadeInvalidClaveOrganica1Error;
}(OrganicaCascadeError));
exports.OrganicaCascadeInvalidClaveOrganica1Error = OrganicaCascadeInvalidClaveOrganica1Error;
/**
 * Error cuando una clave orgánica 2 no es válida
 */
var OrganicaCascadeInvalidClaveOrganica2Error = /** @class */ (function (_super) {
    __extends(OrganicaCascadeInvalidClaveOrganica2Error, _super);
    function OrganicaCascadeInvalidClaveOrganica2Error(claveOrganica2) {
        return _super.call(this, "La clave org\u00E1nica 2 '".concat(claveOrganica2, "' no es v\u00E1lida. Debe ser una cadena de 1-2 caracteres alfanum\u00E9ricos."), 'ORGANICA_CASCADE_INVALID_CLAVE_2', 400) || this;
    }
    return OrganicaCascadeInvalidClaveOrganica2Error;
}(OrganicaCascadeError));
exports.OrganicaCascadeInvalidClaveOrganica2Error = OrganicaCascadeInvalidClaveOrganica2Error;
/**
 * Error cuando no se encuentra la estructura orgánica 0
 */
var OrganicaCascadeOrganica0NotFoundError = /** @class */ (function (_super) {
    __extends(OrganicaCascadeOrganica0NotFoundError, _super);
    function OrganicaCascadeOrganica0NotFoundError(claveOrganica0) {
        return _super.call(this, "No se encontr\u00F3 la estructura org\u00E1nica 0 con clave '".concat(claveOrganica0, "'."), 'ORGANICA_CASCADE_ORGANICA0_NOT_FOUND', 404) || this;
    }
    return OrganicaCascadeOrganica0NotFoundError;
}(OrganicaCascadeError));
exports.OrganicaCascadeOrganica0NotFoundError = OrganicaCascadeOrganica0NotFoundError;
/**
 * Error cuando no se encuentra la estructura orgánica 1
 */
var OrganicaCascadeOrganica1NotFoundError = /** @class */ (function (_super) {
    __extends(OrganicaCascadeOrganica1NotFoundError, _super);
    function OrganicaCascadeOrganica1NotFoundError(claveOrganica0, claveOrganica1) {
        return _super.call(this, "No se encontr\u00F3 la estructura org\u00E1nica 1 con claves '".concat(claveOrganica0, "-").concat(claveOrganica1, "'."), 'ORGANICA_CASCADE_ORGANICA1_NOT_FOUND', 404) || this;
    }
    return OrganicaCascadeOrganica1NotFoundError;
}(OrganicaCascadeError));
exports.OrganicaCascadeOrganica1NotFoundError = OrganicaCascadeOrganica1NotFoundError;
/**
 * Error cuando no se encuentra la estructura orgánica 2
 */
var OrganicaCascadeOrganica2NotFoundError = /** @class */ (function (_super) {
    __extends(OrganicaCascadeOrganica2NotFoundError, _super);
    function OrganicaCascadeOrganica2NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2) {
        return _super.call(this, "No se encontr\u00F3 la estructura org\u00E1nica 2 con claves '".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, "'."), 'ORGANICA_CASCADE_ORGANICA2_NOT_FOUND', 404) || this;
    }
    return OrganicaCascadeOrganica2NotFoundError;
}(OrganicaCascadeError));
exports.OrganicaCascadeOrganica2NotFoundError = OrganicaCascadeOrganica2NotFoundError;
/**
 * Error de permisos para acceder a información orgánica
 */
var OrganicaCascadePermissionError = /** @class */ (function (_super) {
    __extends(OrganicaCascadePermissionError, _super);
    function OrganicaCascadePermissionError(userId) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene permisos para acceder a esta informaci\u00F3n org\u00E1nica."), 'ORGANICA_CASCADE_PERMISSION_DENIED', 403) || this;
    }
    return OrganicaCascadePermissionError;
}(OrganicaCascadeError));
exports.OrganicaCascadePermissionError = OrganicaCascadePermissionError;
