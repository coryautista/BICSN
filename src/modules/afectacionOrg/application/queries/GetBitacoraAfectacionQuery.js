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
exports.GetBitacoraAfectacionQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'getBitacoraAfectacionQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetBitacoraAfectacionQuery = /** @class */ (function () {
    function GetBitacoraAfectacionQuery(bitacoraAfectacionRepo) {
        this.bitacoraAfectacionRepo = bitacoraAfectacionRepo;
    }
    GetBitacoraAfectacionQuery.prototype.execute = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateFilters(filters);
                        logContext = {
                            operation: 'getBitacoraAfectacion',
                            filters: {
                                entidad: filters.entidad,
                                anio: filters.anio,
                                quincena: filters.quincena,
                                orgNivel: filters.orgNivel,
                                org0: filters.org0,
                                org1: filters.org1,
                                org2: filters.org2,
                                org3: filters.org3,
                                usuario: filters.usuario,
                                accion: filters.accion,
                                resultado: filters.resultado,
                                limit: filters.limit,
                                offset: filters.offset
                            }
                        };
                        logger.info(logContext, 'Consultando bitácora de afectaciones');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.bitacoraAfectacionRepo.findAll(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultCount: result.length }), 'Consulta de bitácora completada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al consultar bitácora de afectaciones');
                        throw new errors_js_1.AfectacionQueryError('getBitacoraAfectacion', {
                            originalError: error_1.message,
                            filters: filters
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GetBitacoraAfectacionQuery.prototype.validateFilters = function (filters) {
        var _a, _b, _c;
        // Validar año si está presente
        if (filters.anio !== undefined && (filters.anio < 2000 || filters.anio > 2100)) {
            throw new errors_js_1.InvalidAnioError(filters.anio);
        }
        // Validar quincena si está presente
        if (filters.quincena !== undefined && (filters.quincena < 1 || filters.quincena > 24)) {
            throw new errors_js_1.InvalidQuincenaError(filters.quincena);
        }
        // Validar nivel organizacional si está presente
        if (filters.orgNivel !== undefined && (filters.orgNivel < 0 || filters.orgNivel > 3)) {
            throw new errors_js_1.InvalidOrgNivelError(filters.orgNivel);
        }
        // Validar límites de paginación
        if (filters.limit !== undefined && filters.limit < 1) {
            throw new errors_js_1.InvalidAfectacionDataError('limit', 'El límite debe ser mayor a 0');
        }
        if (filters.offset !== undefined && filters.offset < 0) {
            throw new errors_js_1.InvalidAfectacionDataError('offset', 'El offset no puede ser negativo');
        }
        // Validar que si se especifica orgNivel, se requieran los códigos correspondientes
        if (filters.orgNivel !== undefined) {
            if (filters.orgNivel >= 1 && !((_a = filters.org1) === null || _a === void 0 ? void 0 : _a.trim())) {
                throw new errors_js_1.InvalidAfectacionDataError('org1', 'El código org1 es requerido cuando orgNivel >= 1');
            }
            if (filters.orgNivel >= 2 && !((_b = filters.org2) === null || _b === void 0 ? void 0 : _b.trim())) {
                throw new errors_js_1.InvalidAfectacionDataError('org2', 'El código org2 es requerido cuando orgNivel >= 2');
            }
            if (filters.orgNivel >= 3 && !((_c = filters.org3) === null || _c === void 0 ? void 0 : _c.trim())) {
                throw new errors_js_1.InvalidAfectacionDataError('org3', 'El código org3 es requerido cuando orgNivel >= 3');
            }
        }
    };
    return GetBitacoraAfectacionQuery;
}());
exports.GetBitacoraAfectacionQuery = GetBitacoraAfectacionQuery;
