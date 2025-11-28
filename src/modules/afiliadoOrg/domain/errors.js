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
exports.AfiliadoOrgValidationError = exports.InvalidOrgClaveError = exports.DuplicateAfiliadoOrgError = exports.AfiliadoOrgQueryError = exports.AfiliadoOrgDeletionError = exports.AfiliadoOrgUpdateError = exports.AfiliadoOrgRegistrationError = exports.AfiliadoOrgPermissionError = exports.AfiliadoNotFoundForOrgError = exports.InvalidFechaMovAltError = exports.InvalidSueldoError = exports.InvalidOrgLevelError = exports.InvalidOrgHierarchyError = exports.InvalidAfiliadoOrgDataError = exports.AfiliadoOrgAlreadyExistsError = exports.AfiliadoOrgNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio de AfiliadoOrg
 */
var AfiliadoOrgNotFoundError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgNotFoundError, _super);
    function AfiliadoOrgNotFoundError(filters) {
        return _super.call(this, 'AfiliadoOrg', JSON.stringify(filters)) || this;
    }
    return AfiliadoOrgNotFoundError;
}(errors_js_1.NotFoundError));
exports.AfiliadoOrgNotFoundError = AfiliadoOrgNotFoundError;
var AfiliadoOrgAlreadyExistsError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgAlreadyExistsError, _super);
    function AfiliadoOrgAlreadyExistsError(details) {
        return _super.call(this, 'La relación afiliado-organización ya está registrada', details) || this;
    }
    return AfiliadoOrgAlreadyExistsError;
}(errors_js_1.BusinessRuleViolationError));
exports.AfiliadoOrgAlreadyExistsError = AfiliadoOrgAlreadyExistsError;
var InvalidAfiliadoOrgDataError = /** @class */ (function (_super) {
    __extends(InvalidAfiliadoOrgDataError, _super);
    function InvalidAfiliadoOrgDataError(field, reason) {
        return _super.call(this, "Datos de afiliado-org inv\u00E1lidos: ".concat(field, " - ").concat(reason), { field: field, reason: reason }) || this;
    }
    return InvalidAfiliadoOrgDataError;
}(errors_js_1.ValidationError));
exports.InvalidAfiliadoOrgDataError = InvalidAfiliadoOrgDataError;
var InvalidOrgHierarchyError = /** @class */ (function (_super) {
    __extends(InvalidOrgHierarchyError, _super);
    function InvalidOrgHierarchyError(message, details) {
        return _super.call(this, "Jerarqu\u00EDa organizacional inv\u00E1lida: ".concat(message), details) || this;
    }
    return InvalidOrgHierarchyError;
}(errors_js_1.ValidationError));
exports.InvalidOrgHierarchyError = InvalidOrgHierarchyError;
var InvalidOrgLevelError = /** @class */ (function (_super) {
    __extends(InvalidOrgLevelError, _super);
    function InvalidOrgLevelError(level) {
        return _super.call(this, "El nivel organizacional debe estar entre 0 y 3, se recibi\u00F3 ".concat(level), { level: level }) || this;
    }
    return InvalidOrgLevelError;
}(errors_js_1.ValidationError));
exports.InvalidOrgLevelError = InvalidOrgLevelError;
var InvalidSueldoError = /** @class */ (function (_super) {
    __extends(InvalidSueldoError, _super);
    function InvalidSueldoError(sueldo) {
        return _super.call(this, "El sueldo debe ser un valor positivo, se recibi\u00F3 ".concat(sueldo), { sueldo: sueldo }) || this;
    }
    return InvalidSueldoError;
}(errors_js_1.ValidationError));
exports.InvalidSueldoError = InvalidSueldoError;
var InvalidFechaMovAltError = /** @class */ (function (_super) {
    __extends(InvalidFechaMovAltError, _super);
    function InvalidFechaMovAltError(fecha) {
        return _super.call(this, "La fecha de movimiento/alta '".concat(fecha, "' no es v\u00E1lida"), { fecha: fecha }) || this;
    }
    return InvalidFechaMovAltError;
}(errors_js_1.ValidationError));
exports.InvalidFechaMovAltError = InvalidFechaMovAltError;
var AfiliadoNotFoundForOrgError = /** @class */ (function (_super) {
    __extends(AfiliadoNotFoundForOrgError, _super);
    function AfiliadoNotFoundForOrgError(afiliadoId) {
        return _super.call(this, "El afiliado con ID ".concat(afiliadoId, " no existe"), { afiliadoId: afiliadoId }) || this;
    }
    return AfiliadoNotFoundForOrgError;
}(errors_js_1.ValidationError));
exports.AfiliadoNotFoundForOrgError = AfiliadoNotFoundForOrgError;
var AfiliadoOrgPermissionError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgPermissionError, _super);
    function AfiliadoOrgPermissionError(operation, reason) {
        return _super.call(this, "No tiene permisos para realizar la operaci\u00F3n '".concat(operation, "' en afiliado-org: ").concat(reason), { operation: operation, reason: reason }) || this;
    }
    return AfiliadoOrgPermissionError;
}(errors_js_1.BusinessRuleViolationError));
exports.AfiliadoOrgPermissionError = AfiliadoOrgPermissionError;
var AfiliadoOrgRegistrationError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgRegistrationError, _super);
    function AfiliadoOrgRegistrationError(message, details) {
        return _super.call(this, "Error al registrar relaci\u00F3n afiliado-organizaci\u00F3n: ".concat(message), details) || this;
    }
    return AfiliadoOrgRegistrationError;
}(errors_js_1.DatabaseError));
exports.AfiliadoOrgRegistrationError = AfiliadoOrgRegistrationError;
var AfiliadoOrgUpdateError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgUpdateError, _super);
    function AfiliadoOrgUpdateError(message, details) {
        return _super.call(this, "Error al actualizar relaci\u00F3n afiliado-organizaci\u00F3n: ".concat(message), details) || this;
    }
    return AfiliadoOrgUpdateError;
}(errors_js_1.DatabaseError));
exports.AfiliadoOrgUpdateError = AfiliadoOrgUpdateError;
var AfiliadoOrgDeletionError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgDeletionError, _super);
    function AfiliadoOrgDeletionError(message, details) {
        return _super.call(this, "Error al eliminar relaci\u00F3n afiliado-organizaci\u00F3n: ".concat(message), details) || this;
    }
    return AfiliadoOrgDeletionError;
}(errors_js_1.DatabaseError));
exports.AfiliadoOrgDeletionError = AfiliadoOrgDeletionError;
var AfiliadoOrgQueryError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgQueryError, _super);
    function AfiliadoOrgQueryError(message, details) {
        return _super.call(this, "Error al consultar relaci\u00F3n afiliado-organizaci\u00F3n: ".concat(message), details) || this;
    }
    return AfiliadoOrgQueryError;
}(errors_js_1.DatabaseError));
exports.AfiliadoOrgQueryError = AfiliadoOrgQueryError;
var DuplicateAfiliadoOrgError = /** @class */ (function (_super) {
    __extends(DuplicateAfiliadoOrgError, _super);
    function DuplicateAfiliadoOrgError(afiliadoId, claveOrganica) {
        return _super.call(this, "Ya existe una relaci\u00F3n para el afiliado ".concat(afiliadoId, " con la clave org\u00E1nica ").concat(claveOrganica), { afiliadoId: afiliadoId, claveOrganica: claveOrganica }) || this;
    }
    return DuplicateAfiliadoOrgError;
}(errors_js_1.BusinessRuleViolationError));
exports.DuplicateAfiliadoOrgError = DuplicateAfiliadoOrgError;
var InvalidOrgClaveError = /** @class */ (function (_super) {
    __extends(InvalidOrgClaveError, _super);
    function InvalidOrgClaveError(clave, level) {
        return _super.call(this, "La clave org\u00E1nica '".concat(clave, "' para el nivel ").concat(level, " no es v\u00E1lida"), { clave: clave, level: level }) || this;
    }
    return InvalidOrgClaveError;
}(errors_js_1.ValidationError));
exports.InvalidOrgClaveError = InvalidOrgClaveError;
var AfiliadoOrgValidationError = /** @class */ (function (_super) {
    __extends(AfiliadoOrgValidationError, _super);
    function AfiliadoOrgValidationError(message, details) {
        return _super.call(this, "Error de validaci\u00F3n de afiliado-org: ".concat(message), details) || this;
    }
    return AfiliadoOrgValidationError;
}(errors_js_1.ValidationError));
exports.AfiliadoOrgValidationError = AfiliadoOrgValidationError;
