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
exports.UpdateCalleCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
// Logger básico para comandos
var logger = {
    info: function (message, data) { return console.log("[INFO] ".concat(message), data ? JSON.stringify(data) : ''); },
    warn: function (message, data) { return console.warn("[WARN] ".concat(message), data ? JSON.stringify(data) : ''); },
    error: function (message, data) { return console.error("[ERROR] ".concat(message), data ? JSON.stringify(data) : ''); },
    debug: function (message, data) { return console.debug("[DEBUG] ".concat(message), data ? JSON.stringify(data) : ''); }
};
var UpdateCalleCommand = /** @class */ (function () {
    function UpdateCalleCommand(calleRepo) {
        this.calleRepo = calleRepo;
    }
    UpdateCalleCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, validatedNombreCalle, trimmedNombre, validatedData, calle, error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        logger.info('Iniciando proceso de actualización de calle', {
                            calleId: data.calleId,
                            nombreCalle: data.nombreCalle,
                            esValido: data.esValido,
                            userId: data.userId
                        });
                        // Validar calleId
                        if (!data.calleId || typeof data.calleId !== 'number' || data.calleId <= 0) {
                            throw new errors_js_1.InvalidCalleDataError('ID de calle inválido');
                        }
                        // Verificar existencia de la calle
                        logger.debug('Verificando existencia de la calle');
                        return [4 /*yield*/, this.calleRepo.findById(data.calleId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            logger.warn('Intento de actualizar calle inexistente', {
                                calleId: data.calleId,
                                userId: data.userId
                            });
                            throw new errors_js_1.CalleNotFoundError(data.calleId);
                        }
                        validatedNombreCalle = existing.nombreCalle;
                        if (data.nombreCalle !== undefined) {
                            if (typeof data.nombreCalle !== 'string') {
                                throw new errors_js_1.InvalidCalleDataError('El nombre de la calle debe ser una cadena de texto');
                            }
                            trimmedNombre = data.nombreCalle.trim();
                            if (trimmedNombre.length === 0) {
                                throw new errors_js_1.CalleNombreEmptyError();
                            }
                            if (trimmedNombre.length > 150) {
                                throw new errors_js_1.CalleNombreTooLongError(trimmedNombre, 150);
                            }
                            validatedNombreCalle = trimmedNombre;
                        }
                        // Validar esValido si se proporciona
                        if (data.esValido !== undefined && typeof data.esValido !== 'boolean') {
                            throw new errors_js_1.InvalidCalleDataError('El campo esValido debe ser un valor booleano');
                        }
                        validatedData = __assign(__assign({}, data), { nombreCalle: validatedNombreCalle });
                        logger.debug('Datos validados correctamente, procediendo a actualizar calle');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.calleRepo.update(validatedData)];
                    case 3:
                        calle = _a.sent();
                        logger.info('Calle actualizada exitosamente', {
                            calleId: calle.calleId,
                            nombreCalle: calle.nombreCalle,
                            esValido: calle.esValido,
                            userId: data.userId,
                            changes: {
                                nombreCalleChanged: data.nombreCalle !== undefined && data.nombreCalle !== existing.nombreCalle,
                                esValidoChanged: data.esValido !== undefined && data.esValido !== existing.esValido
                            }
                        });
                        return [2 /*return*/, calle];
                    case 4:
                        error_1 = _a.sent();
                        // Manejar errores específicos de base de datos
                        if (error_1.message && error_1.message.includes('Violation of PRIMARY KEY constraint')) {
                            logger.warn('Conflicto al actualizar calle (posible duplicado)', {
                                calleId: data.calleId,
                                nombreCalle: validatedNombreCalle,
                                userId: data.userId
                            });
                            throw new errors_js_1.CalleAlreadyExistsError(data.calleId, validatedNombreCalle, existing.coloniaId);
                        }
                        // Re-lanzar otros errores
                        throw error_1;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        if (error_2 instanceof errors_js_1.CalleNotFoundError ||
                            error_2 instanceof errors_js_1.InvalidCalleDataError ||
                            error_2 instanceof errors_js_1.CalleNombreTooLongError ||
                            error_2 instanceof errors_js_1.CalleNombreEmptyError ||
                            error_2 instanceof errors_js_1.CalleAlreadyExistsError) {
                            throw error_2;
                        }
                        logger.error('Error durante la actualización de calle', {
                            error: error_2 instanceof Error ? error_2.message : 'Error desconocido',
                            calleId: data.calleId,
                            nombreCalle: data.nombreCalle,
                            userId: data.userId,
                            stack: error_2 instanceof Error ? error_2.stack : undefined
                        });
                        throw new errors_js_1.CalleSystemError('Error interno durante la actualización de calle');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return UpdateCalleCommand;
}());
exports.UpdateCalleCommand = UpdateCalleCommand;
