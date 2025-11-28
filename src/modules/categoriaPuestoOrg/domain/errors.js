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
exports.CategoriaPuestoOrgQueryError = exports.CategoriaPuestoOrgDeletionError = exports.CategoriaPuestoOrgUpdateError = exports.CategoriaPuestoOrgRegistrationError = exports.CategoriaPuestoOrgInUseError = exports.DuplicateCategoriaPuestoOrgError = exports.InvalidVigenciaDatesError = exports.InvalidIngresoBrutoError = exports.InvalidNivelError = exports.InvalidOrgHierarchyError = exports.InvalidCategoriaPuestoOrgDataError = exports.CategoriaPuestoOrgNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio de CategoriaPuestoOrg
 */
// Errores de validación de datos
var CategoriaPuestoOrgNotFoundError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgNotFoundError, _super);
    function CategoriaPuestoOrgNotFoundError(categoriaPuestoOrgId, details) {
        var _this = _super.call(this, 'Categoría de puesto orgánico', categoriaPuestoOrgId) || this;
        _this.details = details;
        return _this;
    }
    return CategoriaPuestoOrgNotFoundError;
}(errors_js_1.NotFoundError));
exports.CategoriaPuestoOrgNotFoundError = CategoriaPuestoOrgNotFoundError;
var InvalidCategoriaPuestoOrgDataError = /** @class */ (function (_super) {
    __extends(InvalidCategoriaPuestoOrgDataError, _super);
    function InvalidCategoriaPuestoOrgDataError(field, reason, details) {
        return _super.call(this, "Campo ".concat(field, " inv\u00E1lido: ").concat(reason), __assign({ field: field, reason: reason }, details)) || this;
    }
    return InvalidCategoriaPuestoOrgDataError;
}(errors_js_1.ValidationError));
exports.InvalidCategoriaPuestoOrgDataError = InvalidCategoriaPuestoOrgDataError;
var InvalidOrgHierarchyError = /** @class */ (function (_super) {
    __extends(InvalidOrgHierarchyError, _super);
    function InvalidOrgHierarchyError(message, details) {
        if (message === void 0) { message = 'Jerarquía orgánica inválida'; }
        return _super.call(this, message, details) || this;
    }
    return InvalidOrgHierarchyError;
}(errors_js_1.ValidationError));
exports.InvalidOrgHierarchyError = InvalidOrgHierarchyError;
var InvalidNivelError = /** @class */ (function (_super) {
    __extends(InvalidNivelError, _super);
    function InvalidNivelError(nivel, details) {
        return _super.call(this, "Nivel ".concat(nivel, " inv\u00E1lido. Debe estar entre 0 y 3"), __assign({ nivel: nivel }, details)) || this;
    }
    return InvalidNivelError;
}(errors_js_1.ValidationError));
exports.InvalidNivelError = InvalidNivelError;
var InvalidIngresoBrutoError = /** @class */ (function (_super) {
    __extends(InvalidIngresoBrutoError, _super);
    function InvalidIngresoBrutoError(ingreso, details) {
        return _super.call(this, "Ingreso bruto ".concat(ingreso, " inv\u00E1lido. Debe ser mayor a 0"), __assign({ ingreso: ingreso }, details)) || this;
    }
    return InvalidIngresoBrutoError;
}(errors_js_1.ValidationError));
exports.InvalidIngresoBrutoError = InvalidIngresoBrutoError;
var InvalidVigenciaDatesError = /** @class */ (function (_super) {
    __extends(InvalidVigenciaDatesError, _super);
    function InvalidVigenciaDatesError(vigenciaInicio, vigenciaFin, details) {
        return _super.call(this, "Fechas de vigencia inv\u00E1lidas: ".concat(vigenciaInicio, " - ").concat(vigenciaFin || 'indefinida'), __assign({ vigenciaInicio: vigenciaInicio, vigenciaFin: vigenciaFin }, details)) || this;
    }
    return InvalidVigenciaDatesError;
}(errors_js_1.ValidationError));
exports.InvalidVigenciaDatesError = InvalidVigenciaDatesError;
var DuplicateCategoriaPuestoOrgError = /** @class */ (function (_super) {
    __extends(DuplicateCategoriaPuestoOrgError, _super);
    function DuplicateCategoriaPuestoOrgError(categoria, org0, org1, details) {
        return _super.call(this, "Ya existe una categor\u00EDa ".concat(categoria, " para la organizaci\u00F3n ").concat(org0, "-").concat(org1), __assign({ categoria: categoria, org0: org0, org1: org1 }, details)) || this;
    }
    return DuplicateCategoriaPuestoOrgError;
}(errors_js_1.BusinessRuleViolationError));
exports.DuplicateCategoriaPuestoOrgError = DuplicateCategoriaPuestoOrgError;
var CategoriaPuestoOrgInUseError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgInUseError, _super);
    function CategoriaPuestoOrgInUseError(categoriaPuestoOrgId, details) {
        return _super.call(this, "No se puede eliminar la categor\u00EDa de puesto org\u00E1nico ".concat(categoriaPuestoOrgId, " porque est\u00E1 siendo utilizada"), __assign({ categoriaPuestoOrgId: categoriaPuestoOrgId }, details)) || this;
    }
    return CategoriaPuestoOrgInUseError;
}(errors_js_1.BusinessRuleViolationError));
exports.CategoriaPuestoOrgInUseError = CategoriaPuestoOrgInUseError;
// Errores de operaciones
var CategoriaPuestoOrgRegistrationError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgRegistrationError, _super);
    function CategoriaPuestoOrgRegistrationError(message, details) {
        if (message === void 0) { message = 'Error al registrar categoría de puesto orgánico'; }
        return _super.call(this, message, details) || this;
    }
    return CategoriaPuestoOrgRegistrationError;
}(errors_js_1.DatabaseError));
exports.CategoriaPuestoOrgRegistrationError = CategoriaPuestoOrgRegistrationError;
var CategoriaPuestoOrgUpdateError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgUpdateError, _super);
    function CategoriaPuestoOrgUpdateError(categoriaPuestoOrgId, details) {
        return _super.call(this, "Error al actualizar categor\u00EDa de puesto org\u00E1nico ".concat(categoriaPuestoOrgId), __assign({ categoriaPuestoOrgId: categoriaPuestoOrgId }, details)) || this;
    }
    return CategoriaPuestoOrgUpdateError;
}(errors_js_1.DatabaseError));
exports.CategoriaPuestoOrgUpdateError = CategoriaPuestoOrgUpdateError;
var CategoriaPuestoOrgDeletionError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgDeletionError, _super);
    function CategoriaPuestoOrgDeletionError(categoriaPuestoOrgId, details) {
        return _super.call(this, "Error al eliminar categor\u00EDa de puesto org\u00E1nico ".concat(categoriaPuestoOrgId), __assign({ categoriaPuestoOrgId: categoriaPuestoOrgId }, details)) || this;
    }
    return CategoriaPuestoOrgDeletionError;
}(errors_js_1.DatabaseError));
exports.CategoriaPuestoOrgDeletionError = CategoriaPuestoOrgDeletionError;
var CategoriaPuestoOrgQueryError = /** @class */ (function (_super) {
    __extends(CategoriaPuestoOrgQueryError, _super);
    function CategoriaPuestoOrgQueryError(operation, details) {
        return _super.call(this, "Error en consulta de categor\u00EDas de puesto org\u00E1nico: ".concat(operation), __assign({ operation: operation }, details)) || this;
    }
    return CategoriaPuestoOrgQueryError;
}(errors_js_1.DatabaseError));
exports.CategoriaPuestoOrgQueryError = CategoriaPuestoOrgQueryError;
