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
exports.TipoMovimientoError = exports.TipoMovimientoPermissionError = exports.TipoMovimientoInUseError = exports.TipoMovimientoInvalidNombreError = exports.TipoMovimientoInvalidAbreviaturaError = exports.TipoMovimientoInvalidIdError = exports.TipoMovimientoAlreadyExistsError = exports.TipoMovimientoNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var TipoMovimientoNotFoundError = /** @class */ (function (_super) {
    __extends(TipoMovimientoNotFoundError, _super);
    function TipoMovimientoNotFoundError(identifier) {
        return _super.call(this, "Tipo de movimiento no encontrado: ".concat(identifier), 'TIPO_MOVIMIENTO_NOT_FOUND', 404) || this;
    }
    return TipoMovimientoNotFoundError;
}(errors_js_1.DomainError));
exports.TipoMovimientoNotFoundError = TipoMovimientoNotFoundError;
var TipoMovimientoAlreadyExistsError = /** @class */ (function (_super) {
    __extends(TipoMovimientoAlreadyExistsError, _super);
    function TipoMovimientoAlreadyExistsError(identifier) {
        return _super.call(this, "Ya existe un tipo de movimiento con ID: ".concat(identifier), 'TIPO_MOVIMIENTO_ALREADY_EXISTS', 409) || this;
    }
    return TipoMovimientoAlreadyExistsError;
}(errors_js_1.DomainError));
exports.TipoMovimientoAlreadyExistsError = TipoMovimientoAlreadyExistsError;
var TipoMovimientoInvalidIdError = /** @class */ (function (_super) {
    __extends(TipoMovimientoInvalidIdError, _super);
    function TipoMovimientoInvalidIdError(id) {
        return _super.call(this, "ID de tipo de movimiento inv\u00E1lido: ".concat(id), 'TIPO_MOVIMIENTO_INVALID_ID', 400) || this;
    }
    return TipoMovimientoInvalidIdError;
}(errors_js_1.DomainError));
exports.TipoMovimientoInvalidIdError = TipoMovimientoInvalidIdError;
var TipoMovimientoInvalidAbreviaturaError = /** @class */ (function (_super) {
    __extends(TipoMovimientoInvalidAbreviaturaError, _super);
    function TipoMovimientoInvalidAbreviaturaError(abreviatura) {
        return _super.call(this, "Abreviatura inv\u00E1lida: ".concat(abreviatura, ". Debe tener entre 1-10 caracteres"), 'TIPO_MOVIMIENTO_INVALID_ABREVIATURA', 400) || this;
    }
    return TipoMovimientoInvalidAbreviaturaError;
}(errors_js_1.DomainError));
exports.TipoMovimientoInvalidAbreviaturaError = TipoMovimientoInvalidAbreviaturaError;
var TipoMovimientoInvalidNombreError = /** @class */ (function (_super) {
    __extends(TipoMovimientoInvalidNombreError, _super);
    function TipoMovimientoInvalidNombreError(nombre) {
        return _super.call(this, "Nombre inv\u00E1lido: ".concat(nombre, ". Debe tener entre 1-100 caracteres"), 'TIPO_MOVIMIENTO_INVALID_NOMBRE', 400) || this;
    }
    return TipoMovimientoInvalidNombreError;
}(errors_js_1.DomainError));
exports.TipoMovimientoInvalidNombreError = TipoMovimientoInvalidNombreError;
var TipoMovimientoInUseError = /** @class */ (function (_super) {
    __extends(TipoMovimientoInUseError, _super);
    function TipoMovimientoInUseError(identifier) {
        return _super.call(this, "Tipo de movimiento est\u00E1 en uso y no puede ser eliminado: ".concat(identifier), 'TIPO_MOVIMIENTO_IN_USE', 409) || this;
    }
    return TipoMovimientoInUseError;
}(errors_js_1.DomainError));
exports.TipoMovimientoInUseError = TipoMovimientoInUseError;
var TipoMovimientoPermissionError = /** @class */ (function (_super) {
    __extends(TipoMovimientoPermissionError, _super);
    function TipoMovimientoPermissionError(action) {
        return _super.call(this, "No tienes permisos para ".concat(action, " este tipo de movimiento"), 'TIPO_MOVIMIENTO_PERMISSION_ERROR', 403) || this;
    }
    return TipoMovimientoPermissionError;
}(errors_js_1.DomainError));
exports.TipoMovimientoPermissionError = TipoMovimientoPermissionError;
var TipoMovimientoError = /** @class */ (function (_super) {
    __extends(TipoMovimientoError, _super);
    function TipoMovimientoError(message, code, statusCode) {
        if (code === void 0) { code = 'TIPO_MOVIMIENTO_ERROR'; }
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return TipoMovimientoError;
}(errors_js_1.DomainError));
exports.TipoMovimientoError = TipoMovimientoError;
