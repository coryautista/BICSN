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
exports.CodigoPostalQueryError = exports.CodigoPostalDeletionError = exports.CodigoPostalUpdateError = exports.CodigoPostalRegistrationError = exports.CodigoPostalInUseError = exports.DuplicateCodigoPostalError = exports.InvalidCodigoPostalFormatError = exports.InvalidCodigoPostalDataError = exports.CodigoPostalByCodeNotFoundError = exports.CodigoPostalNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio de CodigosPostales
 */
// Errores de validación de datos
var CodigoPostalNotFoundError = /** @class */ (function (_super) {
    __extends(CodigoPostalNotFoundError, _super);
    function CodigoPostalNotFoundError(codigoPostalId, details) {
        var _this = _super.call(this, 'Código postal', codigoPostalId) || this;
        _this.details = details;
        return _this;
    }
    return CodigoPostalNotFoundError;
}(errors_js_1.NotFoundError));
exports.CodigoPostalNotFoundError = CodigoPostalNotFoundError;
var CodigoPostalByCodeNotFoundError = /** @class */ (function (_super) {
    __extends(CodigoPostalByCodeNotFoundError, _super);
    function CodigoPostalByCodeNotFoundError(codigoPostal, details) {
        var _this = _super.call(this, "C\u00F3digo postal ".concat(codigoPostal), undefined) || this;
        _this.details = __assign({ codigoPostal: codigoPostal }, details);
        return _this;
    }
    return CodigoPostalByCodeNotFoundError;
}(errors_js_1.NotFoundError));
exports.CodigoPostalByCodeNotFoundError = CodigoPostalByCodeNotFoundError;
var InvalidCodigoPostalDataError = /** @class */ (function (_super) {
    __extends(InvalidCodigoPostalDataError, _super);
    function InvalidCodigoPostalDataError(field, reason, details) {
        return _super.call(this, "Campo ".concat(field, " inv\u00E1lido: ").concat(reason), __assign({ field: field, reason: reason }, details)) || this;
    }
    return InvalidCodigoPostalDataError;
}(errors_js_1.ValidationError));
exports.InvalidCodigoPostalDataError = InvalidCodigoPostalDataError;
var InvalidCodigoPostalFormatError = /** @class */ (function (_super) {
    __extends(InvalidCodigoPostalFormatError, _super);
    function InvalidCodigoPostalFormatError(codigoPostal, details) {
        return _super.call(this, "Formato de c\u00F3digo postal inv\u00E1lido: ".concat(codigoPostal, ". Debe ser exactamente 5 d\u00EDgitos"), __assign({ codigoPostal: codigoPostal }, details)) || this;
    }
    return InvalidCodigoPostalFormatError;
}(errors_js_1.ValidationError));
exports.InvalidCodigoPostalFormatError = InvalidCodigoPostalFormatError;
var DuplicateCodigoPostalError = /** @class */ (function (_super) {
    __extends(DuplicateCodigoPostalError, _super);
    function DuplicateCodigoPostalError(codigoPostal, details) {
        return _super.call(this, "Ya existe un c\u00F3digo postal ".concat(codigoPostal), __assign({ codigoPostal: codigoPostal }, details)) || this;
    }
    return DuplicateCodigoPostalError;
}(errors_js_1.BusinessRuleViolationError));
exports.DuplicateCodigoPostalError = DuplicateCodigoPostalError;
var CodigoPostalInUseError = /** @class */ (function (_super) {
    __extends(CodigoPostalInUseError, _super);
    function CodigoPostalInUseError(codigoPostalId, details) {
        return _super.call(this, "No se puede eliminar el c\u00F3digo postal ".concat(codigoPostalId, " porque est\u00E1 siendo utilizado"), __assign({ codigoPostalId: codigoPostalId }, details)) || this;
    }
    return CodigoPostalInUseError;
}(errors_js_1.BusinessRuleViolationError));
exports.CodigoPostalInUseError = CodigoPostalInUseError;
// Errores de operaciones
var CodigoPostalRegistrationError = /** @class */ (function (_super) {
    __extends(CodigoPostalRegistrationError, _super);
    function CodigoPostalRegistrationError(message, details) {
        if (message === void 0) { message = 'Error al registrar código postal'; }
        return _super.call(this, message, details) || this;
    }
    return CodigoPostalRegistrationError;
}(errors_js_1.DatabaseError));
exports.CodigoPostalRegistrationError = CodigoPostalRegistrationError;
var CodigoPostalUpdateError = /** @class */ (function (_super) {
    __extends(CodigoPostalUpdateError, _super);
    function CodigoPostalUpdateError(codigoPostalId, details) {
        return _super.call(this, "Error al actualizar c\u00F3digo postal ".concat(codigoPostalId), __assign({ codigoPostalId: codigoPostalId }, details)) || this;
    }
    return CodigoPostalUpdateError;
}(errors_js_1.DatabaseError));
exports.CodigoPostalUpdateError = CodigoPostalUpdateError;
var CodigoPostalDeletionError = /** @class */ (function (_super) {
    __extends(CodigoPostalDeletionError, _super);
    function CodigoPostalDeletionError(codigoPostalId, details) {
        return _super.call(this, "Error al eliminar c\u00F3digo postal ".concat(codigoPostalId), __assign({ codigoPostalId: codigoPostalId }, details)) || this;
    }
    return CodigoPostalDeletionError;
}(errors_js_1.DatabaseError));
exports.CodigoPostalDeletionError = CodigoPostalDeletionError;
var CodigoPostalQueryError = /** @class */ (function (_super) {
    __extends(CodigoPostalQueryError, _super);
    function CodigoPostalQueryError(operation, details) {
        return _super.call(this, "Error en consulta de c\u00F3digos postales: ".concat(operation), __assign({ operation: operation }, details)) || this;
    }
    return CodigoPostalQueryError;
}(errors_js_1.DatabaseError));
exports.CodigoPostalQueryError = CodigoPostalQueryError;
