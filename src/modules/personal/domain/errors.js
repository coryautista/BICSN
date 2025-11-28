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
exports.PersonalPermissionError = exports.PersonalInUseError = exports.PersonalInvalidClaveOrganicaError = exports.PersonalInvalidExpedienteError = exports.PersonalInvalidCelularError = exports.PersonalInvalidFechaAltaError = exports.PersonalInvalidEmailError = exports.PersonalInvalidEstadoCivilError = exports.PersonalInvalidSexoError = exports.PersonalInvalidTelefonoError = exports.PersonalInvalidCodigoPostalError = exports.PersonalInvalidSeguroSocialError = exports.PersonalInvalidFechaNacimientoError = exports.PersonalInvalidApellidoMaternoError = exports.PersonalInvalidApellidoPaternoError = exports.PersonalInvalidNombreError = exports.PersonalInvalidNoEmpleadoError = exports.PersonalInvalidRfcError = exports.PersonalInvalidCurpError = exports.PersonalInvalidInternoError = exports.PersonalAlreadyExistsError = exports.PersonalNotFoundError = exports.PersonalError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo personal
 */
var PersonalError = /** @class */ (function (_super) {
    __extends(PersonalError, _super);
    function PersonalError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return PersonalError;
}(errors_js_1.DomainError));
exports.PersonalError = PersonalError;
/**
 * Error cuando un registro personal no es encontrado
 */
var PersonalNotFoundError = /** @class */ (function (_super) {
    __extends(PersonalNotFoundError, _super);
    function PersonalNotFoundError(interno) {
        return _super.call(this, "Registro personal con interno ".concat(interno, " no encontrado"), 'PERSONAL_NOT_FOUND', 404) || this;
    }
    return PersonalNotFoundError;
}(PersonalError));
exports.PersonalNotFoundError = PersonalNotFoundError;
/**
 * Error cuando ya existe un registro personal con el mismo interno
 */
var PersonalAlreadyExistsError = /** @class */ (function (_super) {
    __extends(PersonalAlreadyExistsError, _super);
    function PersonalAlreadyExistsError(interno) {
        return _super.call(this, "Ya existe un registro personal con interno ".concat(interno), 'PERSONAL_ALREADY_EXISTS', 409) || this;
    }
    return PersonalAlreadyExistsError;
}(PersonalError));
exports.PersonalAlreadyExistsError = PersonalAlreadyExistsError;
/**
 * Error cuando el interno no es válido
 */
var PersonalInvalidInternoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidInternoError, _super);
    function PersonalInvalidInternoError(interno) {
        return _super.call(this, "El interno '".concat(interno, "' no es v\u00E1lido. Debe ser un n\u00FAmero entero positivo."), 'PERSONAL_INVALID_INTERNO', 400) || this;
    }
    return PersonalInvalidInternoError;
}(PersonalError));
exports.PersonalInvalidInternoError = PersonalInvalidInternoError;
/**
 * Error cuando la CURP no es válida
 */
var PersonalInvalidCurpError = /** @class */ (function (_super) {
    __extends(PersonalInvalidCurpError, _super);
    function PersonalInvalidCurpError(curp) {
        return _super.call(this, "La CURP '".concat(curp, "' no es v\u00E1lida. Debe tener 18 caracteres alfanum\u00E9ricos."), 'PERSONAL_INVALID_CURP', 400) || this;
    }
    return PersonalInvalidCurpError;
}(PersonalError));
exports.PersonalInvalidCurpError = PersonalInvalidCurpError;
/**
 * Error cuando el RFC no es válido
 */
var PersonalInvalidRfcError = /** @class */ (function (_super) {
    __extends(PersonalInvalidRfcError, _super);
    function PersonalInvalidRfcError(rfc) {
        return _super.call(this, "El RFC '".concat(rfc, "' no es v\u00E1lido. Debe tener entre 12-13 caracteres alfanum\u00E9ricos."), 'PERSONAL_INVALID_RFC', 400) || this;
    }
    return PersonalInvalidRfcError;
}(PersonalError));
exports.PersonalInvalidRfcError = PersonalInvalidRfcError;
/**
 * Error cuando el número de empleado no es válido
 */
var PersonalInvalidNoEmpleadoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidNoEmpleadoError, _super);
    function PersonalInvalidNoEmpleadoError(noempleado) {
        return _super.call(this, "El n\u00FAmero de empleado '".concat(noempleado, "' no es v\u00E1lido. Debe tener m\u00E1ximo 20 caracteres alfanum\u00E9ricos."), 'PERSONAL_INVALID_NO_EMPLEADO', 400) || this;
    }
    return PersonalInvalidNoEmpleadoError;
}(PersonalError));
exports.PersonalInvalidNoEmpleadoError = PersonalInvalidNoEmpleadoError;
/**
 * Error cuando el nombre no es válido
 */
var PersonalInvalidNombreError = /** @class */ (function (_super) {
    __extends(PersonalInvalidNombreError, _super);
    function PersonalInvalidNombreError(nombre) {
        return _super.call(this, "El nombre '".concat(nombre, "' no es v\u00E1lido. Debe tener m\u00E1ximo 50 caracteres y solo letras."), 'PERSONAL_INVALID_NOMBRE', 400) || this;
    }
    return PersonalInvalidNombreError;
}(PersonalError));
exports.PersonalInvalidNombreError = PersonalInvalidNombreError;
/**
 * Error cuando el apellido paterno no es válido
 */
var PersonalInvalidApellidoPaternoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidApellidoPaternoError, _super);
    function PersonalInvalidApellidoPaternoError(apellido) {
        return _super.call(this, "El apellido paterno '".concat(apellido, "' no es v\u00E1lido. Debe tener m\u00E1ximo 50 caracteres y solo letras."), 'PERSONAL_INVALID_APELLIDO_PATERNO', 400) || this;
    }
    return PersonalInvalidApellidoPaternoError;
}(PersonalError));
exports.PersonalInvalidApellidoPaternoError = PersonalInvalidApellidoPaternoError;
/**
 * Error cuando el apellido materno no es válido
 */
var PersonalInvalidApellidoMaternoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidApellidoMaternoError, _super);
    function PersonalInvalidApellidoMaternoError(apellido) {
        return _super.call(this, "El apellido materno '".concat(apellido, "' no es v\u00E1lido. Debe tener m\u00E1ximo 50 caracteres y solo letras."), 'PERSONAL_INVALID_APELLIDO_MATERNO', 400) || this;
    }
    return PersonalInvalidApellidoMaternoError;
}(PersonalError));
exports.PersonalInvalidApellidoMaternoError = PersonalInvalidApellidoMaternoError;
/**
 * Error cuando la fecha de nacimiento no es válida
 */
var PersonalInvalidFechaNacimientoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidFechaNacimientoError, _super);
    function PersonalInvalidFechaNacimientoError(fecha) {
        return _super.call(this, "La fecha de nacimiento '".concat(fecha, "' no es v\u00E1lida. Debe ser una fecha ISO v\u00E1lida."), 'PERSONAL_INVALID_FECHA_NACIMIENTO', 400) || this;
    }
    return PersonalInvalidFechaNacimientoError;
}(PersonalError));
exports.PersonalInvalidFechaNacimientoError = PersonalInvalidFechaNacimientoError;
/**
 * Error cuando el seguro social no es válido
 */
var PersonalInvalidSeguroSocialError = /** @class */ (function (_super) {
    __extends(PersonalInvalidSeguroSocialError, _super);
    function PersonalInvalidSeguroSocialError(seguro) {
        return _super.call(this, "El seguro social '".concat(seguro, "' no es v\u00E1lido. Debe tener 11 d\u00EDgitos."), 'PERSONAL_INVALID_SEGURO_SOCIAL', 400) || this;
    }
    return PersonalInvalidSeguroSocialError;
}(PersonalError));
exports.PersonalInvalidSeguroSocialError = PersonalInvalidSeguroSocialError;
/**
 * Error cuando el código postal no es válido
 */
var PersonalInvalidCodigoPostalError = /** @class */ (function (_super) {
    __extends(PersonalInvalidCodigoPostalError, _super);
    function PersonalInvalidCodigoPostalError(codigo) {
        return _super.call(this, "El c\u00F3digo postal '".concat(codigo, "' no es v\u00E1lido. Debe tener 5 d\u00EDgitos."), 'PERSONAL_INVALID_CODIGO_POSTAL', 400) || this;
    }
    return PersonalInvalidCodigoPostalError;
}(PersonalError));
exports.PersonalInvalidCodigoPostalError = PersonalInvalidCodigoPostalError;
/**
 * Error cuando el teléfono no es válido
 */
var PersonalInvalidTelefonoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidTelefonoError, _super);
    function PersonalInvalidTelefonoError(telefono) {
        return _super.call(this, "El tel\u00E9fono '".concat(telefono, "' no es v\u00E1lido. Debe tener m\u00E1ximo 15 caracteres num\u00E9ricos."), 'PERSONAL_INVALID_TELEFONO', 400) || this;
    }
    return PersonalInvalidTelefonoError;
}(PersonalError));
exports.PersonalInvalidTelefonoError = PersonalInvalidTelefonoError;
/**
 * Error cuando el sexo no es válido
 */
var PersonalInvalidSexoError = /** @class */ (function (_super) {
    __extends(PersonalInvalidSexoError, _super);
    function PersonalInvalidSexoError(sexo) {
        return _super.call(this, "El sexo '".concat(sexo, "' no es v\u00E1lido. Debe ser 'M', 'F' o null."), 'PERSONAL_INVALID_SEXO', 400) || this;
    }
    return PersonalInvalidSexoError;
}(PersonalError));
exports.PersonalInvalidSexoError = PersonalInvalidSexoError;
/**
 * Error cuando el estado civil no es válido
 */
var PersonalInvalidEstadoCivilError = /** @class */ (function (_super) {
    __extends(PersonalInvalidEstadoCivilError, _super);
    function PersonalInvalidEstadoCivilError(estado) {
        return _super.call(this, "El estado civil '".concat(estado, "' no es v\u00E1lido. Debe ser uno de los valores permitidos."), 'PERSONAL_INVALID_ESTADO_CIVIL', 400) || this;
    }
    return PersonalInvalidEstadoCivilError;
}(PersonalError));
exports.PersonalInvalidEstadoCivilError = PersonalInvalidEstadoCivilError;
/**
 * Error cuando el email no es válido
 */
var PersonalInvalidEmailError = /** @class */ (function (_super) {
    __extends(PersonalInvalidEmailError, _super);
    function PersonalInvalidEmailError(email) {
        return _super.call(this, "El email '".concat(email, "' no es v\u00E1lido. Debe tener un formato de email correcto."), 'PERSONAL_INVALID_EMAIL', 400) || this;
    }
    return PersonalInvalidEmailError;
}(PersonalError));
exports.PersonalInvalidEmailError = PersonalInvalidEmailError;
/**
 * Error cuando la fecha de alta no es válida
 */
var PersonalInvalidFechaAltaError = /** @class */ (function (_super) {
    __extends(PersonalInvalidFechaAltaError, _super);
    function PersonalInvalidFechaAltaError(fecha) {
        return _super.call(this, "La fecha de alta '".concat(fecha, "' no es v\u00E1lida. Debe ser una fecha ISO v\u00E1lida."), 'PERSONAL_INVALID_FECHA_ALTA', 400) || this;
    }
    return PersonalInvalidFechaAltaError;
}(PersonalError));
exports.PersonalInvalidFechaAltaError = PersonalInvalidFechaAltaError;
/**
 * Error cuando el celular no es válido
 */
var PersonalInvalidCelularError = /** @class */ (function (_super) {
    __extends(PersonalInvalidCelularError, _super);
    function PersonalInvalidCelularError(celular) {
        return _super.call(this, "El celular '".concat(celular, "' no es v\u00E1lido. Debe tener m\u00E1ximo 15 caracteres num\u00E9ricos."), 'PERSONAL_INVALID_CELULAR', 400) || this;
    }
    return PersonalInvalidCelularError;
}(PersonalError));
exports.PersonalInvalidCelularError = PersonalInvalidCelularError;
/**
 * Error cuando el expediente no es válido
 */
var PersonalInvalidExpedienteError = /** @class */ (function (_super) {
    __extends(PersonalInvalidExpedienteError, _super);
    function PersonalInvalidExpedienteError(expediente) {
        return _super.call(this, "El expediente '".concat(expediente, "' no es v\u00E1lido. Debe tener m\u00E1ximo 50 caracteres alfanum\u00E9ricos."), 'PERSONAL_INVALID_EXPEDIENTE', 400) || this;
    }
    return PersonalInvalidExpedienteError;
}(PersonalError));
exports.PersonalInvalidExpedienteError = PersonalInvalidExpedienteError;
/**
 * Error cuando la clave orgánica no es válida
 */
var PersonalInvalidClaveOrganicaError = /** @class */ (function (_super) {
    __extends(PersonalInvalidClaveOrganicaError, _super);
    function PersonalInvalidClaveOrganicaError(clave, nivel) {
        return _super.call(this, "La clave org\u00E1nica ".concat(nivel, " '").concat(clave, "' no es v\u00E1lida. Debe ser una cadena de 1-2 caracteres alfanum\u00E9ricos."), 'PERSONAL_INVALID_CLAVE_ORGANICA', 400) || this;
    }
    return PersonalInvalidClaveOrganicaError;
}(PersonalError));
exports.PersonalInvalidClaveOrganicaError = PersonalInvalidClaveOrganicaError;
/**
 * Error cuando el registro está en uso y no puede ser eliminado
 */
var PersonalInUseError = /** @class */ (function (_super) {
    __extends(PersonalInUseError, _super);
    function PersonalInUseError(interno) {
        return _super.call(this, "El registro personal con interno ".concat(interno, " est\u00E1 en uso y no puede ser eliminado"), 'PERSONAL_IN_USE', 409) || this;
    }
    return PersonalInUseError;
}(PersonalError));
exports.PersonalInUseError = PersonalInUseError;
/**
 * Error de permisos para acceder a información personal
 */
var PersonalPermissionError = /** @class */ (function (_super) {
    __extends(PersonalPermissionError, _super);
    function PersonalPermissionError(userId) {
        return _super.call(this, "El usuario '".concat(userId, "' no tiene permisos para acceder a esta informaci\u00F3n personal."), 'PERSONAL_PERMISSION_DENIED', 403) || this;
    }
    return PersonalPermissionError;
}(PersonalError));
exports.PersonalPermissionError = PersonalPermissionError;
