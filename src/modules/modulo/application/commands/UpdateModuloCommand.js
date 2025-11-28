"use strict";
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
exports.UpdateModuloCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'updateModuloCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var UpdateModuloCommand = /** @class */ (function () {
    function UpdateModuloCommand(moduloRepo) {
        this.moduloRepo = moduloRepo;
    }
    UpdateModuloCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, moduloWithSameName, data, updated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        logger.info({
                            operation: 'updateModulo',
                            moduloId: input.id,
                            nombre: input.nombre,
                            tipo: input.tipo,
                            icono: input.icono,
                            orden: input.orden,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando actualización de módulo');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.moduloRepo.findById(input.id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.ModuloNotFoundError(input.id);
                        }
                        if (!(input.nombre !== undefined && input.nombre !== existing.nombre)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.moduloRepo.findByName(input.nombre)];
                    case 2:
                        moduloWithSameName = _a.sent();
                        if (moduloWithSameName && moduloWithSameName.id !== input.id) {
                            throw new errors_js_1.ModuloAlreadyExistsError(input.nombre);
                        }
                        _a.label = 3;
                    case 3:
                        data = {
                            nombre: input.nombre,
                            tipo: input.tipo,
                            icono: input.icono,
                            orden: input.orden
                        };
                        return [4 /*yield*/, this.moduloRepo.update(input.id, data)];
                    case 4:
                        updated = _a.sent();
                        logger.info({
                            operation: 'updateModulo',
                            moduloId: updated.id,
                            nombre: updated.nombre,
                            tipo: updated.tipo,
                            orden: updated.orden,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Módulo actualizado exitosamente');
                        return [2 /*return*/, updated];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.ModuloNotFoundError ||
                            error_1 instanceof errors_js_1.ModuloAlreadyExistsError ||
                            error_1 instanceof errors_js_1.ModuloInvalidNameError ||
                            error_1 instanceof errors_js_1.ModuloInvalidTypeError ||
                            error_1 instanceof errors_js_1.ModuloInvalidOrderError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'updateModulo',
                            error: error_1.message,
                            moduloId: input.id,
                            nombre: input.nombre,
                            userId: userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al actualizar módulo');
                        throw new errors_js_1.ModuloError('Error interno al actualizar módulo', 'MODULO_UPDATE_ERROR', 500);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UpdateModuloCommand.prototype.validateInput = function (input) {
        // Validar ID
        if (!Number.isInteger(input.id) || input.id <= 0) {
            throw new errors_js_1.ModuloNotFoundError(input.id);
        }
        // Validar nombre si se proporciona
        if (input.nombre !== undefined) {
            if (typeof input.nombre !== 'string') {
                throw new errors_js_1.ModuloInvalidNameError('debe ser una cadena de texto');
            }
            var nombreTrimmed = input.nombre.trim();
            if (nombreTrimmed.length === 0) {
                throw new errors_js_1.ModuloInvalidNameError('no puede estar vacío');
            }
            if (nombreTrimmed.length > 100) {
                throw new errors_js_1.ModuloInvalidNameError('no puede tener más de 100 caracteres');
            }
            // Solo permitir letras, números, espacios y algunos caracteres especiales
            var nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
            if (!nombreRegex.test(nombreTrimmed)) {
                throw new errors_js_1.ModuloInvalidNameError('solo puede contener letras, números, espacios, guiones y guiones bajos');
            }
        }
        // Validar tipo si se proporciona
        if (input.tipo !== undefined) {
            if (typeof input.tipo !== 'string') {
                throw new errors_js_1.ModuloInvalidTypeError('debe ser una cadena de texto');
            }
            var tipoTrimmed = input.tipo.trim();
            if (tipoTrimmed.length === 0) {
                throw new errors_js_1.ModuloInvalidTypeError('no puede estar vacío');
            }
            if (tipoTrimmed.length > 50) {
                throw new errors_js_1.ModuloInvalidTypeError('no puede tener más de 50 caracteres');
            }
            // Tipos permitidos
            var tiposPermitidos = ['sistema', 'usuario', 'admin', 'reporte', 'configuracion'];
            if (!tiposPermitidos.includes(tipoTrimmed.toLowerCase())) {
                throw new errors_js_1.ModuloInvalidTypeError("debe ser uno de: ".concat(tiposPermitidos.join(', ')));
            }
        }
        // Validar orden si se proporciona
        if (input.orden !== undefined) {
            if (!Number.isInteger(input.orden)) {
                throw new errors_js_1.ModuloInvalidOrderError('debe ser un número entero');
            }
            if (input.orden < 0) {
                throw new errors_js_1.ModuloInvalidOrderError('no puede ser negativo');
            }
            if (input.orden > 9999) {
                throw new errors_js_1.ModuloInvalidOrderError('no puede ser mayor a 9999');
            }
        }
        // Validar icono si se proporciona
        if (input.icono !== undefined) {
            if (typeof input.icono !== 'string') {
                throw new errors_js_1.ModuloInvalidTypeError('el icono debe ser una cadena de texto');
            }
            var iconoTrimmed = input.icono.trim();
            if (iconoTrimmed.length > 50) {
                throw new errors_js_1.ModuloInvalidTypeError('el icono no puede tener más de 50 caracteres');
            }
        }
    };
    return UpdateModuloCommand;
}());
exports.UpdateModuloCommand = UpdateModuloCommand;
