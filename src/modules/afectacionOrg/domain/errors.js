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
exports.AfectacionPermissionError = exports.OrgHierarchyValidationError = exports.InvalidDateForQuincenaError = exports.AfectacionQueryError = exports.AfectacionRegistrationError = exports.AfectacionAlreadyExistsError = exports.InvalidOrgNivelError = exports.InvalidAnioError = exports.InvalidQuincenaError = exports.InvalidAfectacionDataError = exports.AfectacionNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio de Afectación Organizacional
 */
var AfectacionNotFoundError = /** @class */ (function (_super) {
    __extends(AfectacionNotFoundError, _super);
    function AfectacionNotFoundError(filters) {
        return _super.call(this, 'Afectación', JSON.stringify(filters)) || this;
    }
    return AfectacionNotFoundError;
}(errors_js_1.NotFoundError));
exports.AfectacionNotFoundError = AfectacionNotFoundError;
var InvalidAfectacionDataError = /** @class */ (function (_super) {
    __extends(InvalidAfectacionDataError, _super);
    function InvalidAfectacionDataError(field, reason) {
        return _super.call(this, "Datos de afectaci\u00F3n inv\u00E1lidos: ".concat(field, " - ").concat(reason), { field: field, reason: reason }) || this;
    }
    return InvalidAfectacionDataError;
}(errors_js_1.ValidationError));
exports.InvalidAfectacionDataError = InvalidAfectacionDataError;
var InvalidQuincenaError = /** @class */ (function (_super) {
    __extends(InvalidQuincenaError, _super);
    function InvalidQuincenaError(quincena) {
        return _super.call(this, "La quincena debe estar entre 1 y 24, se recibi\u00F3 ".concat(quincena), { quincena: quincena }) || this;
    }
    return InvalidQuincenaError;
}(errors_js_1.ValidationError));
exports.InvalidQuincenaError = InvalidQuincenaError;
var InvalidAnioError = /** @class */ (function (_super) {
    __extends(InvalidAnioError, _super);
    function InvalidAnioError(anio) {
        return _super.call(this, "El a\u00F1o debe estar entre 2000 y 2100, se recibi\u00F3 ".concat(anio), { anio: anio }) || this;
    }
    return InvalidAnioError;
}(errors_js_1.ValidationError));
exports.InvalidAnioError = InvalidAnioError;
var InvalidOrgNivelError = /** @class */ (function (_super) {
    __extends(InvalidOrgNivelError, _super);
    function InvalidOrgNivelError(orgNivel) {
        return _super.call(this, "El nivel organizacional debe estar entre 0 y 3, se recibi\u00F3 ".concat(orgNivel), { orgNivel: orgNivel }) || this;
    }
    return InvalidOrgNivelError;
}(errors_js_1.ValidationError));
exports.InvalidOrgNivelError = InvalidOrgNivelError;
var AfectacionAlreadyExistsError = /** @class */ (function (_super) {
    __extends(AfectacionAlreadyExistsError, _super);
    function AfectacionAlreadyExistsError(details) {
        return _super.call(this, 'La afectación ya está registrada para esta unidad organizacional y período', details) || this;
    }
    return AfectacionAlreadyExistsError;
}(errors_js_1.BusinessRuleViolationError));
exports.AfectacionAlreadyExistsError = AfectacionAlreadyExistsError;
var AfectacionRegistrationError = /** @class */ (function (_super) {
    __extends(AfectacionRegistrationError, _super);
    function AfectacionRegistrationError(message, details) {
        return _super.call(this, "Error al registrar afectaci\u00F3n: ".concat(message), details) || this;
    }
    return AfectacionRegistrationError;
}(errors_js_1.DatabaseError));
exports.AfectacionRegistrationError = AfectacionRegistrationError;
var AfectacionQueryError = /** @class */ (function (_super) {
    __extends(AfectacionQueryError, _super);
    function AfectacionQueryError(operation, details) {
        return _super.call(this, "Error al consultar afectaciones: ".concat(operation), details) || this;
    }
    return AfectacionQueryError;
}(errors_js_1.DatabaseError));
exports.AfectacionQueryError = AfectacionQueryError;
var InvalidDateForQuincenaError = /** @class */ (function (_super) {
    __extends(InvalidDateForQuincenaError, _super);
    function InvalidDateForQuincenaError(date) {
        return _super.call(this, "Formato de fecha inv\u00E1lido para c\u00E1lculo de quincena: ".concat(date), { date: date }) || this;
    }
    return InvalidDateForQuincenaError;
}(errors_js_1.ValidationError));
exports.InvalidDateForQuincenaError = InvalidDateForQuincenaError;
var OrgHierarchyValidationError = /** @class */ (function (_super) {
    __extends(OrgHierarchyValidationError, _super);
    function OrgHierarchyValidationError(message, details) {
        return _super.call(this, "Validaci\u00F3n de jerarqu\u00EDa organizacional fallida: ".concat(message), details) || this;
    }
    return OrgHierarchyValidationError;
}(errors_js_1.ValidationError));
exports.OrgHierarchyValidationError = OrgHierarchyValidationError;
var AfectacionPermissionError = /** @class */ (function (_super) {
    __extends(AfectacionPermissionError, _super);
    function AfectacionPermissionError(usuario, operation) {
        return _super.call(this, "El usuario ".concat(usuario, " no tiene permisos para ").concat(operation), 'AFECTACION_PERMISSION_ERROR', 403, { usuario: usuario, operation: operation }) || this;
    }
    return AfectacionPermissionError;
}(errors_js_1.DomainError));
exports.AfectacionPermissionError = AfectacionPermissionError;
