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
exports.UpdateColoniaCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'updateColoniaCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var UpdateColoniaCommand = /** @class */ (function () {
    function UpdateColoniaCommand(coloniaRepo) {
        this.coloniaRepo = coloniaRepo;
    }
    UpdateColoniaCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'updateColonia',
                            coloniaId: data.coloniaId,
                            nombreColonia: data.nombreColonia,
                            tipoAsentamiento: data.tipoAsentamiento,
                            esValido: data.esValido,
                            userId: data.userId
                        };
                        logger.info(logContext, 'Actualizando colonia');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.coloniaRepo.update(data.coloniaId, data.nombreColonia, data.tipoAsentamiento, data.esValido, data.userId)];
                    case 2:
                        result = _a.sent();
                        if (!result) {
                            logger.warn(__assign({}, logContext), 'Colonia no encontrada para actualización');
                            throw new errors_js_1.ColoniaNotFoundError(data.coloniaId);
                        }
                        logger.info(__assign(__assign({}, logContext), { updatedAt: result.updatedAt }), 'Colonia actualizada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        // Manejo específico de errores de base de datos
                        if (error_1.code === '23505') { // Unique constraint violation
                            logger.warn(__assign({}, logContext), 'Conflicto de unicidad al actualizar colonia');
                            throw new errors_js_1.DuplicateColoniaError(data.nombreColonia || 'desconocido', data.coloniaId);
                        }
                        if (error_1 instanceof errors_js_1.ColoniaNotFoundError ||
                            error_1 instanceof errors_js_1.InvalidColoniaDataError ||
                            error_1 instanceof errors_js_1.DuplicateColoniaError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al actualizar colonia');
                        throw new errors_js_1.ColoniaCommandError('actualización', {
                            originalError: error_1.message,
                            data: logContext
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UpdateColoniaCommand.prototype.validateInput = function (data) {
        // Validar coloniaId
        if (!data.coloniaId || typeof data.coloniaId !== 'number' || data.coloniaId <= 0) {
            throw new errors_js_1.InvalidColoniaDataError('coloniaId', 'Es requerido y debe ser un número positivo');
        }
        // Validar nombreColonia (opcional)
        if (data.nombreColonia !== undefined) {
            if (typeof data.nombreColonia !== 'string' || data.nombreColonia.trim().length === 0) {
                throw new errors_js_1.InvalidColoniaDataError('nombreColonia', 'Debe ser una cadena no vacía');
            }
            if (data.nombreColonia.length > 100) {
                throw new errors_js_1.InvalidColoniaDataError('nombreColonia', 'No puede exceder 100 caracteres');
            }
        }
        // Validar tipoAsentamiento (opcional)
        if (data.tipoAsentamiento !== undefined) {
            if (typeof data.tipoAsentamiento !== 'string') {
                throw new errors_js_1.InvalidColoniaDataError('tipoAsentamiento', 'Debe ser una cadena de texto');
            }
            if (data.tipoAsentamiento.length > 50) {
                throw new errors_js_1.InvalidColoniaDataError('tipoAsentamiento', 'No puede exceder 50 caracteres');
            }
        }
        // Validar esValido (opcional)
        if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
            throw new errors_js_1.InvalidColoniaDataError('esValido', 'Debe ser un valor booleano');
        }
    };
    return UpdateColoniaCommand;
}());
exports.UpdateColoniaCommand = UpdateColoniaCommand;
