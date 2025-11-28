"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAuditLogsByDateRangeQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'getAuditLogsByDateRangeQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetAuditLogsByDateRangeQuery = /** @class */ (function () {
    function GetAuditLogsByDateRangeQuery(auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }
    GetAuditLogsByDateRangeQuery.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, results, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'getAuditLogsByDateRange',
                            fechaInicio: data.fechaInicio,
                            fechaFin: data.fechaFin
                        };
                        logger.info(logContext, 'Consultando logs de auditoría por rango de fechas');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.auditLogRepo.findByDateRange(data.fechaInicio, data.fechaFin)];
                    case 2:
                        results = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultsCount: results.length, results: results.map(function (r) { return ({
                                id: r.id,
                                entidad: r.entidad,
                                entidadId: r.entidadId,
                                accion: r.accion,
                                fecha: r.fecha,
                                userId: r.userId,
                                appName: r.appName
                            }); }) }), 'Consulta de logs de auditoría por rango de fechas completada exitosamente');
                        return [2 /*return*/, results];
                    case 3:
                        error_1 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al consultar logs de auditoría por rango de fechas');
                        throw new errors_js_1.AuditLogQueryFailedError('consulta por rango de fechas', {
                            originalError: error_1.message,
                            fechaInicio: data.fechaInicio,
                            fechaFin: data.fechaFin
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GetAuditLogsByDateRangeQuery.prototype.validateInput = function (data) {
        // Validar que las fechas estén presentes
        if (!data.fechaInicio || !data.fechaFin) {
            throw new errors_js_1.AuditLogInvalidDateRangeError(data.fechaInicio || 'null', data.fechaFin || 'null');
        }
        // Validar formato de fechas (YYYY-MM-DD)
        var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.fechaInicio)) {
            throw new errors_js_1.AuditLogInvalidDateFormatError(data.fechaInicio);
        }
        if (!dateRegex.test(data.fechaFin)) {
            throw new errors_js_1.AuditLogInvalidDateFormatError(data.fechaFin);
        }
        // Validar que las fechas sean válidas
        var fechaInicio = new Date(data.fechaInicio + 'T00:00:00.000Z');
        var fechaFin = new Date(data.fechaFin + 'T23:59:59.999Z');
        if (isNaN(fechaInicio.getTime())) {
            throw new errors_js_1.AuditLogInvalidDateFormatError(data.fechaInicio);
        }
        if (isNaN(fechaFin.getTime())) {
            throw new errors_js_1.AuditLogInvalidDateFormatError(data.fechaFin);
        }
        // Validar que fechaInicio no sea posterior a fechaFin
        if (fechaInicio > fechaFin) {
            throw new errors_js_1.AuditLogInvalidDateRangeError(data.fechaInicio, data.fechaFin);
        }
        // Validar que no se consulten fechas futuras
        var now = new Date();
        if (fechaFin > now) {
            throw new errors_js_1.AuditLogFutureDateError(data.fechaFin);
        }
        // Validar rango máximo de 90 días
        var maxDays = 90;
        var diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxDays) {
            throw new errors_js_1.AuditLogDateRangeTooLargeError(data.fechaInicio, data.fechaFin, maxDays, diffDays);
        }
    };
    return GetAuditLogsByDateRangeQuery;
}());
exports.GetAuditLogsByDateRangeQuery = GetAuditLogsByDateRangeQuery;
