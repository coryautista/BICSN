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
exports.MovimientoPermissionError = exports.MovimientoCannotDeleteError = exports.MovimientoInvalidCreadorError = exports.MovimientoInvalidEstatusError = exports.MovimientoInvalidFolioError = exports.MovimientoInvalidFechaError = exports.MovimientoInvalidAfiliadoError = exports.MovimientoInvalidTipoMovimientoError = exports.MovimientoAlreadyExistsError = exports.MovimientoNotFoundError = exports.MovimientoError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo movimiento
 */
var MovimientoError = /** @class */ (function (_super) {
    __extends(MovimientoError, _super);
    function MovimientoError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return MovimientoError;
}(errors_js_1.DomainError));
exports.MovimientoError = MovimientoError;
/**
 * Error cuando un movimiento no es encontrado
 */
var MovimientoNotFoundError = /** @class */ (function (_super) {
    __extends(MovimientoNotFoundError, _super);
    function MovimientoNotFoundError(movimientoId) {
        return _super.call(this, "Movimiento con ID ".concat(movimientoId, " no encontrado"), 'MOVIMIENTO_NOT_FOUND', 404) || this;
    }
    return MovimientoNotFoundError;
}(MovimientoError));
exports.MovimientoNotFoundError = MovimientoNotFoundError;
/**
 * Error cuando ya existe un movimiento con el mismo folio
 */
var MovimientoAlreadyExistsError = /** @class */ (function (_super) {
    __extends(MovimientoAlreadyExistsError, _super);
    function MovimientoAlreadyExistsError(folio) {
        return _super.call(this, "Ya existe un movimiento con el folio: ".concat(folio), 'MOVIMIENTO_ALREADY_EXISTS', 409) || this;
    }
    return MovimientoAlreadyExistsError;
}(MovimientoError));
exports.MovimientoAlreadyExistsError = MovimientoAlreadyExistsError;
/**
 * Error de validación del tipo de movimiento
 */
var MovimientoInvalidTipoMovimientoError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidTipoMovimientoError, _super);
    function MovimientoInvalidTipoMovimientoError(details) {
        return _super.call(this, "Tipo de movimiento inv\u00E1lido: ".concat(details), 'MOVIMIENTO_INVALID_TIPO_MOVIMIENTO', 400) || this;
    }
    return MovimientoInvalidTipoMovimientoError;
}(MovimientoError));
exports.MovimientoInvalidTipoMovimientoError = MovimientoInvalidTipoMovimientoError;
/**
 * Error de validación del afiliado
 */
var MovimientoInvalidAfiliadoError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidAfiliadoError, _super);
    function MovimientoInvalidAfiliadoError(details) {
        return _super.call(this, "Afiliado inv\u00E1lido: ".concat(details), 'MOVIMIENTO_INVALID_AFILIADO', 400) || this;
    }
    return MovimientoInvalidAfiliadoError;
}(MovimientoError));
exports.MovimientoInvalidAfiliadoError = MovimientoInvalidAfiliadoError;
/**
 * Error de validación de la fecha
 */
var MovimientoInvalidFechaError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidFechaError, _super);
    function MovimientoInvalidFechaError(details) {
        return _super.call(this, "Fecha del movimiento inv\u00E1lida: ".concat(details), 'MOVIMIENTO_INVALID_FECHA', 400) || this;
    }
    return MovimientoInvalidFechaError;
}(MovimientoError));
exports.MovimientoInvalidFechaError = MovimientoInvalidFechaError;
/**
 * Error de validación del folio
 */
var MovimientoInvalidFolioError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidFolioError, _super);
    function MovimientoInvalidFolioError(details) {
        return _super.call(this, "Folio del movimiento inv\u00E1lido: ".concat(details), 'MOVIMIENTO_INVALID_FOLIO', 400) || this;
    }
    return MovimientoInvalidFolioError;
}(MovimientoError));
exports.MovimientoInvalidFolioError = MovimientoInvalidFolioError;
/**
 * Error de validación del estatus
 */
var MovimientoInvalidEstatusError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidEstatusError, _super);
    function MovimientoInvalidEstatusError(details) {
        return _super.call(this, "Estatus del movimiento inv\u00E1lido: ".concat(details), 'MOVIMIENTO_INVALID_ESTATUS', 400) || this;
    }
    return MovimientoInvalidEstatusError;
}(MovimientoError));
exports.MovimientoInvalidEstatusError = MovimientoInvalidEstatusError;
/**
 * Error de validación del usuario creador
 */
var MovimientoInvalidCreadorError = /** @class */ (function (_super) {
    __extends(MovimientoInvalidCreadorError, _super);
    function MovimientoInvalidCreadorError(details) {
        return _super.call(this, "Usuario creador inv\u00E1lido: ".concat(details), 'MOVIMIENTO_INVALID_CREADOR', 400) || this;
    }
    return MovimientoInvalidCreadorError;
}(MovimientoError));
exports.MovimientoInvalidCreadorError = MovimientoInvalidCreadorError;
/**
 * Error cuando se intenta eliminar un movimiento que ya está procesado
 */
var MovimientoCannotDeleteError = /** @class */ (function (_super) {
    __extends(MovimientoCannotDeleteError, _super);
    function MovimientoCannotDeleteError(movimientoId, estatus) {
        return _super.call(this, "No se puede eliminar el movimiento ".concat(movimientoId, " porque tiene estatus: ").concat(estatus), 'MOVIMIENTO_CANNOT_DELETE', 409) || this;
    }
    return MovimientoCannotDeleteError;
}(MovimientoError));
exports.MovimientoCannotDeleteError = MovimientoCannotDeleteError;
/**
 * Error de permisos insuficientes para operaciones de movimiento
 */
var MovimientoPermissionError = /** @class */ (function (_super) {
    __extends(MovimientoPermissionError, _super);
    function MovimientoPermissionError(operation) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'MOVIMIENTO_PERMISSION_DENIED', 403) || this;
    }
    return MovimientoPermissionError;
}(MovimientoError));
exports.MovimientoPermissionError = MovimientoPermissionError;
