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
exports.Organica3DeletionError = exports.Organica3PermissionError = exports.Organica3ParentNotFoundError = exports.Organica3InUseError = exports.Organica3InvalidFechaError = exports.Organica3InvalidEstatusError = exports.Organica3InvalidEstadoError = exports.Organica3InvalidMunicipioError = exports.Organica3InvalidLocalidadError = exports.Organica3InvalidFaxError = exports.Organica3InvalidTelefonoError = exports.Organica3InvalidCodigoPostalError = exports.Organica3InvalidFraccionamientoError = exports.Organica3InvalidCalleNumError = exports.Organica3InvalidTitularError = exports.Organica3InvalidDescripcionError = exports.Organica3InvalidClaveOrganica3Error = exports.Organica3InvalidClaveOrganica2Error = exports.Organica3InvalidClaveOrganica1Error = exports.Organica3InvalidClaveOrganica0Error = exports.Organica3AlreadyExistsError = exports.Organica3NotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error cuando una entidad organica3 no es encontrada
 */
var Organica3NotFoundError = /** @class */ (function (_super) {
    __extends(Organica3NotFoundError, _super);
    function Organica3NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return _super.call(this, "Entidad organica3 con clave ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, "-").concat(claveOrganica3, " no encontrada"), 'ORGANICA3_NOT_FOUND', 404, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2, claveOrganica3: claveOrganica3 }) || this;
    }
    return Organica3NotFoundError;
}(errors_js_1.DomainError));
exports.Organica3NotFoundError = Organica3NotFoundError;
/**
 * Error cuando ya existe una entidad organica3 con la misma clave
 */
var Organica3AlreadyExistsError = /** @class */ (function (_super) {
    __extends(Organica3AlreadyExistsError, _super);
    function Organica3AlreadyExistsError(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return _super.call(this, "Ya existe una entidad organica3 con la clave: ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, "-").concat(claveOrganica3), 'ORGANICA3_ALREADY_EXISTS', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2, claveOrganica3: claveOrganica3 }) || this;
    }
    return Organica3AlreadyExistsError;
}(errors_js_1.DomainError));
exports.Organica3AlreadyExistsError = Organica3AlreadyExistsError;
/**
 * Error de validación de la clave organica0
 */
var Organica3InvalidClaveOrganica0Error = /** @class */ (function (_super) {
    __extends(Organica3InvalidClaveOrganica0Error, _super);
    function Organica3InvalidClaveOrganica0Error(details) {
        return _super.call(this, "Clave organica0 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_CLAVE_ORGANICA0', 400, { details: details }) || this;
    }
    return Organica3InvalidClaveOrganica0Error;
}(errors_js_1.DomainError));
exports.Organica3InvalidClaveOrganica0Error = Organica3InvalidClaveOrganica0Error;
/**
 * Error de validación de la clave organica1
 */
var Organica3InvalidClaveOrganica1Error = /** @class */ (function (_super) {
    __extends(Organica3InvalidClaveOrganica1Error, _super);
    function Organica3InvalidClaveOrganica1Error(details) {
        return _super.call(this, "Clave organica1 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_CLAVE_ORGANICA1', 400, { details: details }) || this;
    }
    return Organica3InvalidClaveOrganica1Error;
}(errors_js_1.DomainError));
exports.Organica3InvalidClaveOrganica1Error = Organica3InvalidClaveOrganica1Error;
/**
 * Error de validación de la clave organica2
 */
var Organica3InvalidClaveOrganica2Error = /** @class */ (function (_super) {
    __extends(Organica3InvalidClaveOrganica2Error, _super);
    function Organica3InvalidClaveOrganica2Error(details) {
        return _super.call(this, "Clave organica2 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_CLAVE_ORGANICA2', 400, { details: details }) || this;
    }
    return Organica3InvalidClaveOrganica2Error;
}(errors_js_1.DomainError));
exports.Organica3InvalidClaveOrganica2Error = Organica3InvalidClaveOrganica2Error;
/**
 * Error de validación de la clave organica3
 */
var Organica3InvalidClaveOrganica3Error = /** @class */ (function (_super) {
    __extends(Organica3InvalidClaveOrganica3Error, _super);
    function Organica3InvalidClaveOrganica3Error(details) {
        return _super.call(this, "Clave organica3 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_CLAVE_ORGANICA3', 400, { details: details }) || this;
    }
    return Organica3InvalidClaveOrganica3Error;
}(errors_js_1.DomainError));
exports.Organica3InvalidClaveOrganica3Error = Organica3InvalidClaveOrganica3Error;
/**
 * Error de validación de la descripción organica3
 */
var Organica3InvalidDescripcionError = /** @class */ (function (_super) {
    __extends(Organica3InvalidDescripcionError, _super);
    function Organica3InvalidDescripcionError(details) {
        return _super.call(this, "Descripci\u00F3n organica3 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_DESCRIPCION', 400, { details: details }) || this;
    }
    return Organica3InvalidDescripcionError;
}(errors_js_1.DomainError));
exports.Organica3InvalidDescripcionError = Organica3InvalidDescripcionError;
/**
 * Error de validación del titular organica3
 */
var Organica3InvalidTitularError = /** @class */ (function (_super) {
    __extends(Organica3InvalidTitularError, _super);
    function Organica3InvalidTitularError(details) {
        return _super.call(this, "Titular organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_TITULAR', 400, { details: details }) || this;
    }
    return Organica3InvalidTitularError;
}(errors_js_1.DomainError));
exports.Organica3InvalidTitularError = Organica3InvalidTitularError;
/**
 * Error de validación de la calle y número organica3
 */
var Organica3InvalidCalleNumError = /** @class */ (function (_super) {
    __extends(Organica3InvalidCalleNumError, _super);
    function Organica3InvalidCalleNumError(details) {
        return _super.call(this, "Calle y n\u00FAmero organica3 inv\u00E1lidos: ".concat(details), 'ORGANICA3_INVALID_CALLE_NUM', 400, { details: details }) || this;
    }
    return Organica3InvalidCalleNumError;
}(errors_js_1.DomainError));
exports.Organica3InvalidCalleNumError = Organica3InvalidCalleNumError;
/**
 * Error de validación del fraccionamiento organica3
 */
var Organica3InvalidFraccionamientoError = /** @class */ (function (_super) {
    __extends(Organica3InvalidFraccionamientoError, _super);
    function Organica3InvalidFraccionamientoError(details) {
        return _super.call(this, "Fraccionamiento organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_FRACCIONAMIENTO', 400, { details: details }) || this;
    }
    return Organica3InvalidFraccionamientoError;
}(errors_js_1.DomainError));
exports.Organica3InvalidFraccionamientoError = Organica3InvalidFraccionamientoError;
/**
 * Error de validación del código postal organica3
 */
var Organica3InvalidCodigoPostalError = /** @class */ (function (_super) {
    __extends(Organica3InvalidCodigoPostalError, _super);
    function Organica3InvalidCodigoPostalError(details) {
        return _super.call(this, "C\u00F3digo postal organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_CODIGO_POSTAL', 400, { details: details }) || this;
    }
    return Organica3InvalidCodigoPostalError;
}(errors_js_1.DomainError));
exports.Organica3InvalidCodigoPostalError = Organica3InvalidCodigoPostalError;
/**
 * Error de validación del teléfono organica3
 */
var Organica3InvalidTelefonoError = /** @class */ (function (_super) {
    __extends(Organica3InvalidTelefonoError, _super);
    function Organica3InvalidTelefonoError(details) {
        return _super.call(this, "Tel\u00E9fono organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_TELEFONO', 400, { details: details }) || this;
    }
    return Organica3InvalidTelefonoError;
}(errors_js_1.DomainError));
exports.Organica3InvalidTelefonoError = Organica3InvalidTelefonoError;
/**
 * Error de validación del fax organica3
 */
var Organica3InvalidFaxError = /** @class */ (function (_super) {
    __extends(Organica3InvalidFaxError, _super);
    function Organica3InvalidFaxError(details) {
        return _super.call(this, "Fax organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_FAX', 400, { details: details }) || this;
    }
    return Organica3InvalidFaxError;
}(errors_js_1.DomainError));
exports.Organica3InvalidFaxError = Organica3InvalidFaxError;
/**
 * Error de validación de la localidad organica3
 */
var Organica3InvalidLocalidadError = /** @class */ (function (_super) {
    __extends(Organica3InvalidLocalidadError, _super);
    function Organica3InvalidLocalidadError(details) {
        return _super.call(this, "Localidad organica3 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_LOCALIDAD', 400, { details: details }) || this;
    }
    return Organica3InvalidLocalidadError;
}(errors_js_1.DomainError));
exports.Organica3InvalidLocalidadError = Organica3InvalidLocalidadError;
/**
 * Error de validación del municipio organica3
 */
var Organica3InvalidMunicipioError = /** @class */ (function (_super) {
    __extends(Organica3InvalidMunicipioError, _super);
    function Organica3InvalidMunicipioError(details) {
        return _super.call(this, "Municipio organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_MUNICIPIO', 400, { details: details }) || this;
    }
    return Organica3InvalidMunicipioError;
}(errors_js_1.DomainError));
exports.Organica3InvalidMunicipioError = Organica3InvalidMunicipioError;
/**
 * Error de validación del estado organica3
 */
var Organica3InvalidEstadoError = /** @class */ (function (_super) {
    __extends(Organica3InvalidEstadoError, _super);
    function Organica3InvalidEstadoError(details) {
        return _super.call(this, "Estado organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_ESTADO', 400, { details: details }) || this;
    }
    return Organica3InvalidEstadoError;
}(errors_js_1.DomainError));
exports.Organica3InvalidEstadoError = Organica3InvalidEstadoError;
/**
 * Error de validación del estatus organica3
 */
var Organica3InvalidEstatusError = /** @class */ (function (_super) {
    __extends(Organica3InvalidEstatusError, _super);
    function Organica3InvalidEstatusError(details) {
        return _super.call(this, "Estatus organica3 inv\u00E1lido: ".concat(details), 'ORGANICA3_INVALID_ESTATUS', 400, { details: details }) || this;
    }
    return Organica3InvalidEstatusError;
}(errors_js_1.DomainError));
exports.Organica3InvalidEstatusError = Organica3InvalidEstatusError;
/**
 * Error de validación de fechas organica3
 */
var Organica3InvalidFechaError = /** @class */ (function (_super) {
    __extends(Organica3InvalidFechaError, _super);
    function Organica3InvalidFechaError(details) {
        return _super.call(this, "Fecha organica3 inv\u00E1lida: ".concat(details), 'ORGANICA3_INVALID_FECHA', 400, { details: details }) || this;
    }
    return Organica3InvalidFechaError;
}(errors_js_1.DomainError));
exports.Organica3InvalidFechaError = Organica3InvalidFechaError;
/**
 * Error cuando se intenta eliminar una entidad organica3 que está en uso
 */
var Organica3InUseError = /** @class */ (function (_super) {
    __extends(Organica3InUseError, _super);
    function Organica3InUseError(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return _super.call(this, "No se puede eliminar la entidad organica3 ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, "-").concat(claveOrganica3, " porque est\u00E1 siendo utilizada"), 'ORGANICA3_IN_USE', 409, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2, claveOrganica3: claveOrganica3 }) || this;
    }
    return Organica3InUseError;
}(errors_js_1.DomainError));
exports.Organica3InUseError = Organica3InUseError;
/**
 * Error cuando la clave organica2 padre no existe
 */
var Organica3ParentNotFoundError = /** @class */ (function (_super) {
    __extends(Organica3ParentNotFoundError, _super);
    function Organica3ParentNotFoundError(claveOrganica0, claveOrganica1, claveOrganica2) {
        return _super.call(this, "La clave organica2 padre ".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2, " no existe"), 'ORGANICA3_PARENT_NOT_FOUND', 400, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2 }) || this;
    }
    return Organica3ParentNotFoundError;
}(errors_js_1.DomainError));
exports.Organica3ParentNotFoundError = Organica3ParentNotFoundError;
/**
 * Error de permisos insuficientes para operaciones de organica3
 */
var Organica3PermissionError = /** @class */ (function (_super) {
    __extends(Organica3PermissionError, _super);
    function Organica3PermissionError(operation, userId) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'ORGANICA3_PERMISSION_DENIED', 403, { operation: operation, userId: userId }) || this;
    }
    return Organica3PermissionError;
}(errors_js_1.DomainError));
exports.Organica3PermissionError = Organica3PermissionError;
/**
 * Error cuando falla la eliminación de una entidad organica3
 */
var Organica3DeletionError = /** @class */ (function (_super) {
    __extends(Organica3DeletionError, _super);
    function Organica3DeletionError(details) {
        return _super.call(this, "Error en la eliminaci\u00F3n de organica3: ".concat(details), 'ORGANICA3_DELETION_ERROR', 500, { details: details }) || this;
    }
    return Organica3DeletionError;
}(errors_js_1.DomainError));
exports.Organica3DeletionError = Organica3DeletionError;
