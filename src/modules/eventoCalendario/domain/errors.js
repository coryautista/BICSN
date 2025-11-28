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
exports.EventoCalendariosNotFoundError = exports.EventoCalendarioCommandError = exports.EventoCalendarioQueryError = exports.InvalidEventoCalendarioAnioError = exports.InvalidEventoCalendarioFechaError = exports.InvalidEventoCalendarioTipoError = exports.InvalidEventoCalendarioDataError = exports.DuplicateEventoCalendarioError = exports.EventoCalendarioByDateRangeNotFoundError = exports.EventoCalendarioByAnioNotFoundError = exports.EventoCalendarioNotFoundError = exports.EventoCalendarioError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var EventoCalendarioError = /** @class */ (function (_super) {
    __extends(EventoCalendarioError, _super);
    function EventoCalendarioError(message, operation, details) {
        return _super.call(this, message, "EVENTO_CALENDARIO_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return EventoCalendarioError;
}(errors_js_1.DomainError));
exports.EventoCalendarioError = EventoCalendarioError;
var EventoCalendarioNotFoundError = /** @class */ (function (_super) {
    __extends(EventoCalendarioNotFoundError, _super);
    function EventoCalendarioNotFoundError(id) {
        return _super.call(this, "Evento de calendario con ID ".concat(id, " no encontrado"), 'findById', { id: id }) || this;
    }
    return EventoCalendarioNotFoundError;
}(EventoCalendarioError));
exports.EventoCalendarioNotFoundError = EventoCalendarioNotFoundError;
var EventoCalendarioByAnioNotFoundError = /** @class */ (function (_super) {
    __extends(EventoCalendarioByAnioNotFoundError, _super);
    function EventoCalendarioByAnioNotFoundError(anio) {
        return _super.call(this, "No se encontraron eventos de calendario para el a\u00F1o ".concat(anio), 'findByAnio', { anio: anio }) || this;
    }
    return EventoCalendarioByAnioNotFoundError;
}(EventoCalendarioError));
exports.EventoCalendarioByAnioNotFoundError = EventoCalendarioByAnioNotFoundError;
var EventoCalendarioByDateRangeNotFoundError = /** @class */ (function (_super) {
    __extends(EventoCalendarioByDateRangeNotFoundError, _super);
    function EventoCalendarioByDateRangeNotFoundError(fechaInicio, fechaFin) {
        return _super.call(this, "No se encontraron eventos de calendario en el rango ".concat(fechaInicio, " - ").concat(fechaFin), 'findByDateRange', { fechaInicio: fechaInicio, fechaFin: fechaFin }) || this;
    }
    return EventoCalendarioByDateRangeNotFoundError;
}(EventoCalendarioError));
exports.EventoCalendarioByDateRangeNotFoundError = EventoCalendarioByDateRangeNotFoundError;
var DuplicateEventoCalendarioError = /** @class */ (function (_super) {
    __extends(DuplicateEventoCalendarioError, _super);
    function DuplicateEventoCalendarioError(fecha, tipo) {
        return _super.call(this, "Ya existe un evento de calendario para la fecha '".concat(fecha, "' con tipo '").concat(tipo, "'"), 'create', { fecha: fecha, tipo: tipo }) || this;
    }
    return DuplicateEventoCalendarioError;
}(EventoCalendarioError));
exports.DuplicateEventoCalendarioError = DuplicateEventoCalendarioError;
var InvalidEventoCalendarioDataError = /** @class */ (function (_super) {
    __extends(InvalidEventoCalendarioDataError, _super);
    function InvalidEventoCalendarioDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidEventoCalendarioDataError;
}(EventoCalendarioError));
exports.InvalidEventoCalendarioDataError = InvalidEventoCalendarioDataError;
var InvalidEventoCalendarioTipoError = /** @class */ (function (_super) {
    __extends(InvalidEventoCalendarioTipoError, _super);
    function InvalidEventoCalendarioTipoError(tipo) {
        return _super.call(this, "Tipo de evento '".concat(tipo, "' no v\u00E1lido. Los tipos v\u00E1lidos son: FERIADO, VACACIONES, EVENTO_ESPECIAL, DIA_NO_LABORABLE"), 'tipoValidation', { tipo: tipo }) || this;
    }
    return InvalidEventoCalendarioTipoError;
}(EventoCalendarioError));
exports.InvalidEventoCalendarioTipoError = InvalidEventoCalendarioTipoError;
var InvalidEventoCalendarioFechaError = /** @class */ (function (_super) {
    __extends(InvalidEventoCalendarioFechaError, _super);
    function InvalidEventoCalendarioFechaError(fecha) {
        return _super.call(this, "Fecha '".concat(fecha, "' inv\u00E1lida. Debe estar en formato YYYY-MM-DD"), 'fechaValidation', { fecha: fecha }) || this;
    }
    return InvalidEventoCalendarioFechaError;
}(EventoCalendarioError));
exports.InvalidEventoCalendarioFechaError = InvalidEventoCalendarioFechaError;
var InvalidEventoCalendarioAnioError = /** @class */ (function (_super) {
    __extends(InvalidEventoCalendarioAnioError, _super);
    function InvalidEventoCalendarioAnioError(anio) {
        return _super.call(this, "A\u00F1o ".concat(anio, " inv\u00E1lido. Debe estar entre 1900 y 2100"), 'anioValidation', { anio: anio }) || this;
    }
    return InvalidEventoCalendarioAnioError;
}(EventoCalendarioError));
exports.InvalidEventoCalendarioAnioError = InvalidEventoCalendarioAnioError;
var EventoCalendarioQueryError = /** @class */ (function (_super) {
    __extends(EventoCalendarioQueryError, _super);
    function EventoCalendarioQueryError(operation, details) {
        return _super.call(this, "Error en consulta de eventos de calendario: ".concat(operation), 'query', details) || this;
    }
    return EventoCalendarioQueryError;
}(EventoCalendarioError));
exports.EventoCalendarioQueryError = EventoCalendarioQueryError;
var EventoCalendarioCommandError = /** @class */ (function (_super) {
    __extends(EventoCalendarioCommandError, _super);
    function EventoCalendarioCommandError(operation, details) {
        return _super.call(this, "Error en comando de eventos de calendario: ".concat(operation), 'command', details) || this;
    }
    return EventoCalendarioCommandError;
}(EventoCalendarioError));
exports.EventoCalendarioCommandError = EventoCalendarioCommandError;
var EventoCalendariosNotFoundError = /** @class */ (function (_super) {
    __extends(EventoCalendariosNotFoundError, _super);
    function EventoCalendariosNotFoundError() {
        return _super.call(this, 'No se encontraron eventos de calendario en el sistema', 'findAll', {}) || this;
    }
    return EventoCalendariosNotFoundError;
}(EventoCalendarioError));
exports.EventoCalendariosNotFoundError = EventoCalendariosNotFoundError;
