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
exports.GetColoniasByMunicipioQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'getColoniasByMunicipioQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetColoniasByMunicipioQuery = /** @class */ (function () {
    function GetColoniasByMunicipioQuery(coloniaRepo) {
        this.coloniaRepo = coloniaRepo;
    }
    GetColoniasByMunicipioQuery.prototype.execute = function (municipioId) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(municipioId);
                        logContext = {
                            operation: 'getColoniasByMunicipio',
                            municipioId: municipioId
                        };
                        logger.info(logContext, 'Consultando colonias por municipio');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.coloniaRepo.findByMunicipio(municipioId)];
                    case 2:
                        result = _a.sent();
                        if (!result || result.length === 0) {
                            logger.warn(__assign({}, logContext), 'No se encontraron colonias para el municipio');
                            throw new errors_js_1.ColoniaByMunicipioNotFoundError(municipioId);
                        }
                        logger.info(__assign(__assign({}, logContext), { coloniasCount: result.length, coloniasIds: result.map(function (c) { return c.coloniaId; }) }), 'Consulta de colonias por municipio completada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.ColoniaByMunicipioNotFoundError ||
                            error_1 instanceof errors_js_1.InvalidColoniaDataError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al consultar colonias por municipio');
                        throw new errors_js_1.ColoniaQueryError('consulta por municipio', {
                            originalError: error_1.message,
                            municipioId: municipioId
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GetColoniasByMunicipioQuery.prototype.validateInput = function (municipioId) {
        // Validar municipioId
        if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
            throw new errors_js_1.InvalidColoniaDataError('municipioId', 'Es requerido y debe ser un número positivo');
        }
    };
    return GetColoniasByMunicipioQuery;
}());
exports.GetColoniasByMunicipioQuery = GetColoniasByMunicipioQuery;
