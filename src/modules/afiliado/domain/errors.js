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
exports.AfiliadoValidationError = exports.MovimientosQuincenalesQueryError = exports.TerminarSuspensionError = exports.BajaSuspensionError = exports.BajaPermanenteError = exports.CambioSueldoError = exports.AfiliadoQueryError = exports.AfiliadoDeletionError = exports.AfiliadoUpdateError = exports.AfiliadoRegistrationError = exports.AfiliadoPermissionError = exports.InternoNotFoundInFirebirdError = exports.InvalidInternoError = exports.InvalidFechaNacimientoError = exports.InvalidNumeroSeguroSocialError = exports.InvalidRfcError = exports.InvalidCurpError = exports.InvalidAfiliadoDataError = exports.AfiliadoAlreadyExistsError = exports.AfiliadoNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio de Afiliado
 */
var AfiliadoNotFoundError = /** @class */ (function (_super) {
    __extends(AfiliadoNotFoundError, _super);
    function AfiliadoNotFoundError(filters) {
        return _super.call(this, 'Afiliado', JSON.stringify(filters)) || this;
    }
    return AfiliadoNotFoundError;
}(errors_js_1.NotFoundError));
exports.AfiliadoNotFoundError = AfiliadoNotFoundError;
var AfiliadoAlreadyExistsError = /** @class */ (function (_super) {
    __extends(AfiliadoAlreadyExistsError, _super);
    function AfiliadoAlreadyExistsError(details) {
        return _super.call(this, 'El afiliado ya está registrado con estos datos', details) || this;
    }
    return AfiliadoAlreadyExistsError;
}(errors_js_1.BusinessRuleViolationError));
exports.AfiliadoAlreadyExistsError = AfiliadoAlreadyExistsError;
var InvalidAfiliadoDataError = /** @class */ (function (_super) {
    __extends(InvalidAfiliadoDataError, _super);
    function InvalidAfiliadoDataError(field, reason) {
        return _super.call(this, "Datos de afiliado inv\u00E1lidos: ".concat(field, " - ").concat(reason), { field: field, reason: reason }) || this;
    }
    return InvalidAfiliadoDataError;
}(errors_js_1.ValidationError));
exports.InvalidAfiliadoDataError = InvalidAfiliadoDataError;
var InvalidCurpError = /** @class */ (function (_super) {
    __extends(InvalidCurpError, _super);
    function InvalidCurpError(curp) {
        return _super.call(this, "La CURP '".concat(curp, "' no tiene un formato v\u00E1lido"), { curp: curp }) || this;
    }
    return InvalidCurpError;
}(errors_js_1.ValidationError));
exports.InvalidCurpError = InvalidCurpError;
var InvalidRfcError = /** @class */ (function (_super) {
    __extends(InvalidRfcError, _super);
    function InvalidRfcError(rfc) {
        return _super.call(this, "El RFC '".concat(rfc, "' no tiene un formato v\u00E1lido"), { rfc: rfc }) || this;
    }
    return InvalidRfcError;
}(errors_js_1.ValidationError));
exports.InvalidRfcError = InvalidRfcError;
var InvalidNumeroSeguroSocialError = /** @class */ (function (_super) {
    __extends(InvalidNumeroSeguroSocialError, _super);
    function InvalidNumeroSeguroSocialError(nss) {
        return _super.call(this, "El n\u00FAmero de seguro social '".concat(nss, "' no tiene un formato v\u00E1lido"), { nss: nss }) || this;
    }
    return InvalidNumeroSeguroSocialError;
}(errors_js_1.ValidationError));
exports.InvalidNumeroSeguroSocialError = InvalidNumeroSeguroSocialError;
var InvalidFechaNacimientoError = /** @class */ (function (_super) {
    __extends(InvalidFechaNacimientoError, _super);
    function InvalidFechaNacimientoError(fecha) {
        return _super.call(this, "La fecha de nacimiento '".concat(fecha, "' no es v\u00E1lida"), { fecha: fecha }) || this;
    }
    return InvalidFechaNacimientoError;
}(errors_js_1.ValidationError));
exports.InvalidFechaNacimientoError = InvalidFechaNacimientoError;
var InvalidInternoError = /** @class */ (function (_super) {
    __extends(InvalidInternoError, _super);
    function InvalidInternoError(interno) {
        return _super.call(this, "El n\u00FAmero interno '".concat(interno, "' no es v\u00E1lido o no existe en el sistema"), { interno: interno }) || this;
    }
    return InvalidInternoError;
}(errors_js_1.ValidationError));
exports.InvalidInternoError = InvalidInternoError;
var InternoNotFoundInFirebirdError = /** @class */ (function (_super) {
    __extends(InternoNotFoundInFirebirdError, _super);
    function InternoNotFoundInFirebirdError(interno) {
        return _super.call(this, "El interno '".concat(interno, "' no existe en las tablas PERSONAL u ORG_PERSONAL de Firebird"), { interno: interno }) || this;
    }
    return InternoNotFoundInFirebirdError;
}(errors_js_1.ValidationError));
exports.InternoNotFoundInFirebirdError = InternoNotFoundInFirebirdError;
var AfiliadoPermissionError = /** @class */ (function (_super) {
    __extends(AfiliadoPermissionError, _super);
    function AfiliadoPermissionError(operation, reason) {
        return _super.call(this, "No tiene permisos para realizar la operaci\u00F3n '".concat(operation, "': ").concat(reason), { operation: operation, reason: reason }) || this;
    }
    return AfiliadoPermissionError;
}(errors_js_1.BusinessRuleViolationError));
exports.AfiliadoPermissionError = AfiliadoPermissionError;
var AfiliadoRegistrationError = /** @class */ (function (_super) {
    __extends(AfiliadoRegistrationError, _super);
    function AfiliadoRegistrationError(message, details) {
        return _super.call(this, "Error al registrar afiliado: ".concat(message), details) || this;
    }
    return AfiliadoRegistrationError;
}(errors_js_1.DatabaseError));
exports.AfiliadoRegistrationError = AfiliadoRegistrationError;
var AfiliadoUpdateError = /** @class */ (function (_super) {
    __extends(AfiliadoUpdateError, _super);
    function AfiliadoUpdateError(message, details) {
        return _super.call(this, "Error al actualizar afiliado: ".concat(message), details) || this;
    }
    return AfiliadoUpdateError;
}(errors_js_1.DatabaseError));
exports.AfiliadoUpdateError = AfiliadoUpdateError;
var AfiliadoDeletionError = /** @class */ (function (_super) {
    __extends(AfiliadoDeletionError, _super);
    function AfiliadoDeletionError(message, details) {
        return _super.call(this, "Error al eliminar afiliado: ".concat(message), details) || this;
    }
    return AfiliadoDeletionError;
}(errors_js_1.DatabaseError));
exports.AfiliadoDeletionError = AfiliadoDeletionError;
var AfiliadoQueryError = /** @class */ (function (_super) {
    __extends(AfiliadoQueryError, _super);
    function AfiliadoQueryError(message, details) {
        return _super.call(this, "Error al consultar afiliado: ".concat(message), details) || this;
    }
    return AfiliadoQueryError;
}(errors_js_1.DatabaseError));
exports.AfiliadoQueryError = AfiliadoQueryError;
var CambioSueldoError = /** @class */ (function (_super) {
    __extends(CambioSueldoError, _super);
    function CambioSueldoError(reason, details) {
        return _super.call(this, "Error en cambio de sueldo: ".concat(reason), details) || this;
    }
    return CambioSueldoError;
}(errors_js_1.BusinessRuleViolationError));
exports.CambioSueldoError = CambioSueldoError;
var BajaPermanenteError = /** @class */ (function (_super) {
    __extends(BajaPermanenteError, _super);
    function BajaPermanenteError(reason, details) {
        return _super.call(this, "Error en baja permanente: ".concat(reason), details) || this;
    }
    return BajaPermanenteError;
}(errors_js_1.BusinessRuleViolationError));
exports.BajaPermanenteError = BajaPermanenteError;
var BajaSuspensionError = /** @class */ (function (_super) {
    __extends(BajaSuspensionError, _super);
    function BajaSuspensionError(reason, details) {
        return _super.call(this, "Error en suspensi\u00F3n: ".concat(reason), details) || this;
    }
    return BajaSuspensionError;
}(errors_js_1.BusinessRuleViolationError));
exports.BajaSuspensionError = BajaSuspensionError;
var TerminarSuspensionError = /** @class */ (function (_super) {
    __extends(TerminarSuspensionError, _super);
    function TerminarSuspensionError(reason, details) {
        return _super.call(this, "Error al terminar suspensi\u00F3n: ".concat(reason), details) || this;
    }
    return TerminarSuspensionError;
}(errors_js_1.BusinessRuleViolationError));
exports.TerminarSuspensionError = TerminarSuspensionError;
var MovimientosQuincenalesQueryError = /** @class */ (function (_super) {
    __extends(MovimientosQuincenalesQueryError, _super);
    function MovimientosQuincenalesQueryError(message, details) {
        return _super.call(this, "Error al obtener movimientos quincenales: ".concat(message), details) || this;
    }
    return MovimientosQuincenalesQueryError;
}(errors_js_1.DatabaseError));
exports.MovimientosQuincenalesQueryError = MovimientosQuincenalesQueryError;
var AfiliadoValidationError = /** @class */ (function (_super) {
    __extends(AfiliadoValidationError, _super);
    function AfiliadoValidationError(message, details) {
        return _super.call(this, "Error de validaci\u00F3n de afiliado: ".concat(message), details) || this;
    }
    return AfiliadoValidationError;
}(errors_js_1.ValidationError));
exports.AfiliadoValidationError = AfiliadoValidationError;
