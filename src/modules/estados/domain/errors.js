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
exports.EstadosNotFoundError = exports.EstadoCommandError = exports.EstadoQueryError = exports.InvalidEstadoDataError = exports.DuplicateEstadoError = exports.EstadoNotFoundError = exports.EstadoError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var EstadoError = /** @class */ (function (_super) {
    __extends(EstadoError, _super);
    function EstadoError(message, operation, details) {
        return _super.call(this, message, "ESTADO_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return EstadoError;
}(errors_js_1.DomainError));
exports.EstadoError = EstadoError;
var EstadoNotFoundError = /** @class */ (function (_super) {
    __extends(EstadoNotFoundError, _super);
    function EstadoNotFoundError(estadoId) {
        return _super.call(this, "Estado con ID ".concat(estadoId, " no encontrado"), 'findById', { estadoId: estadoId }) || this;
    }
    return EstadoNotFoundError;
}(EstadoError));
exports.EstadoNotFoundError = EstadoNotFoundError;
var DuplicateEstadoError = /** @class */ (function (_super) {
    __extends(DuplicateEstadoError, _super);
    function DuplicateEstadoError(estadoId) {
        return _super.call(this, "Ya existe un estado con ID '".concat(estadoId, "'"), 'create', { estadoId: estadoId }) || this;
    }
    return DuplicateEstadoError;
}(EstadoError));
exports.DuplicateEstadoError = DuplicateEstadoError;
var InvalidEstadoDataError = /** @class */ (function (_super) {
    __extends(InvalidEstadoDataError, _super);
    function InvalidEstadoDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidEstadoDataError;
}(EstadoError));
exports.InvalidEstadoDataError = InvalidEstadoDataError;
var EstadoQueryError = /** @class */ (function (_super) {
    __extends(EstadoQueryError, _super);
    function EstadoQueryError(operation, details) {
        return _super.call(this, "Error en consulta de estados: ".concat(operation), 'query', details) || this;
    }
    return EstadoQueryError;
}(EstadoError));
exports.EstadoQueryError = EstadoQueryError;
var EstadoCommandError = /** @class */ (function (_super) {
    __extends(EstadoCommandError, _super);
    function EstadoCommandError(operation, details) {
        return _super.call(this, "Error en comando de estados: ".concat(operation), 'command', details) || this;
    }
    return EstadoCommandError;
}(EstadoError));
exports.EstadoCommandError = EstadoCommandError;
var EstadosNotFoundError = /** @class */ (function (_super) {
    __extends(EstadosNotFoundError, _super);
    function EstadosNotFoundError() {
        return _super.call(this, 'No se encontraron estados en el sistema', 'findAll', {}) || this;
    }
    return EstadosNotFoundError;
}(EstadoError));
exports.EstadosNotFoundError = EstadosNotFoundError;
