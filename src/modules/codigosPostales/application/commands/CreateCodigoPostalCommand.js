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
exports.CreateCodigoPostalCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createCodigoPostalCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateCodigoPostalCommand = /** @class */ (function () {
    function CreateCodigoPostalCommand(codigoPostalRepo) {
        this.codigoPostalRepo = codigoPostalRepo;
    }
    CreateCodigoPostalCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'createCodigoPostal',
                            codigoPostal: data.codigoPostal,
                            esValido: data.esValido,
                            userId: data.userId
                        };
                        logger.info(logContext, 'Creando nuevo código postal');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Verificar duplicados antes de crear
                        return [4 /*yield*/, this.checkForDuplicates(data)];
                    case 2:
                        // Verificar duplicados antes de crear
                        _a.sent();
                        return [4 /*yield*/, this.codigoPostalRepo.create(data.codigoPostal, data.esValido, data.userId)];
                    case 3:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { codigoPostalId: result.codigoPostalId }), 'Código postal creado exitosamente');
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.DuplicateCodigoPostalError ||
                            error_1 instanceof errors_js_1.InvalidCodigoPostalDataError ||
                            error_1 instanceof errors_js_1.InvalidCodigoPostalFormatError) {
                            throw error_1;
                        }
                        // Verificar si es un error de duplicado de base de datos
                        if (error_1.message && error_1.message.includes('Violation of PRIMARY KEY constraint')) {
                            logger.warn(__assign({}, logContext), 'Intento de crear código postal duplicado');
                            throw new errors_js_1.DuplicateCodigoPostalError(data.codigoPostal);
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al crear código postal');
                        throw new errors_js_1.CodigoPostalRegistrationError('Error al crear código postal', {
                            originalError: error_1.message,
                            data: data
                        });
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CreateCodigoPostalCommand.prototype.validateInput = function (data) {
        // Validar codigoPostal
        if (!data.codigoPostal || typeof data.codigoPostal !== 'string') {
            throw new errors_js_1.InvalidCodigoPostalDataError('codigoPostal', 'Es requerido y debe ser una cadena');
        }
        // Validar formato del código postal (exactamente 5 dígitos)
        if (!/^\d{5}$/.test(data.codigoPostal)) {
            throw new errors_js_1.InvalidCodigoPostalFormatError(data.codigoPostal);
        }
        // Validar esValido
        if (typeof data.esValido !== 'boolean') {
            throw new errors_js_1.InvalidCodigoPostalDataError('esValido', 'Es requerido y debe ser un valor booleano');
        }
    };
    CreateCodigoPostalCommand.prototype.checkForDuplicates = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.codigoPostalRepo.findByCode(data.codigoPostal)];
                    case 1:
                        existing = _a.sent();
                        if (existing) {
                            throw new errors_js_1.DuplicateCodigoPostalError(data.codigoPostal);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        if (error_2 instanceof errors_js_1.DuplicateCodigoPostalError) {
                            throw error_2;
                        }
                        // Si hay error de conexión o similar, continuar (mejor fallar en la creación que prevenirla)
                        logger.warn({
                            operation: 'checkForDuplicates',
                            codigoPostal: data.codigoPostal,
                            error: error_2.message
                        }, 'No se pudo verificar duplicados, continuando con la creación');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CreateCodigoPostalCommand;
}());
exports.CreateCodigoPostalCommand = CreateCodigoPostalCommand;
