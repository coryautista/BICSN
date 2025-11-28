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
exports.RegistrarAfectacionCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'registrarAfectacionCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var RegistrarAfectacionCommand = /** @class */ (function () {
    function RegistrarAfectacionCommand(afectacionRepo) {
        this.afectacionRepo = afectacionRepo;
    }
    RegistrarAfectacionCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'registrarAfectacion',
                            entidad: data.entidad,
                            anio: data.anio,
                            quincena: data.quincena,
                            orgNivel: data.orgNivel,
                            org0: data.org0,
                            usuario: data.usuario,
                            appName: data.appName,
                            ip: data.ip
                        };
                        logger.info(logContext, 'Iniciando registro de afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionRepo.registrar(data)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { afectacionId: result.afectacionId, success: result.success }), 'Afectación registrada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.InvalidAfectacionDataError ||
                            error_1 instanceof errors_js_1.InvalidQuincenaError ||
                            error_1 instanceof errors_js_1.InvalidAnioError ||
                            error_1 instanceof errors_js_1.InvalidOrgNivelError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al registrar afectación');
                        throw new errors_js_1.AfectacionRegistrationError('Error interno al registrar afectación', {
                            originalError: error_1.message,
                            entidad: data.entidad,
                            anio: data.anio,
                            quincena: data.quincena
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RegistrarAfectacionCommand.prototype.validateInput = function (data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        // Validar quincena
        if (data.quincena < 1 || data.quincena > 24) {
            throw new errors_js_1.InvalidQuincenaError(data.quincena);
        }
        // Validar año
        if (data.anio < 2000 || data.anio > 2100) {
            throw new errors_js_1.InvalidAnioError(data.anio);
        }
        // Validar nivel organizacional
        if (data.orgNivel < 0 || data.orgNivel > 3) {
            throw new errors_js_1.InvalidOrgNivelError(data.orgNivel);
        }
        // Validar campos requeridos
        if (!((_a = data.entidad) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('entidad', 'La entidad es requerida');
        }
        if (!((_b = data.org0) === null || _b === void 0 ? void 0 : _b.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('org0', 'El código org0 es requerido');
        }
        if (!((_c = data.accion) === null || _c === void 0 ? void 0 : _c.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('accion', 'La acción es requerida');
        }
        if (!((_d = data.resultado) === null || _d === void 0 ? void 0 : _d.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('resultado', 'El resultado es requerido');
        }
        if (!((_e = data.usuario) === null || _e === void 0 ? void 0 : _e.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('usuario', 'El usuario es requerido');
        }
        if (!((_f = data.appName) === null || _f === void 0 ? void 0 : _f.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('appName', 'El nombre de la aplicación es requerido');
        }
        if (!((_g = data.ip) === null || _g === void 0 ? void 0 : _g.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('ip', 'La dirección IP es requerida');
        }
        // Validar códigos organizacionales según el nivel
        if (data.orgNivel >= 1 && !((_h = data.org1) === null || _h === void 0 ? void 0 : _h.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('org1', 'El código org1 es requerido para nivel >= 1');
        }
        if (data.orgNivel >= 2 && !((_j = data.org2) === null || _j === void 0 ? void 0 : _j.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('org2', 'El código org2 es requerido para nivel >= 2');
        }
        if (data.orgNivel >= 3 && !((_k = data.org3) === null || _k === void 0 ? void 0 : _k.trim())) {
            throw new errors_js_1.InvalidAfectacionDataError('org3', 'El código org3 es requerido para nivel >= 3');
        }
    };
    return RegistrarAfectacionCommand;
}());
exports.RegistrarAfectacionCommand = RegistrarAfectacionCommand;
