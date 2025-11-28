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
exports.UpdateMunicipioCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'updateMunicipioCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var UpdateMunicipioCommand = /** @class */ (function () {
    function UpdateMunicipioCommand(municipioRepo) {
        this.municipioRepo = municipioRepo;
    }
    UpdateMunicipioCommand.prototype.execute = function (input, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updateData, updated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger.info({
                            operation: 'updateMunicipio',
                            municipioId: input.municipioId,
                            nombreMunicipio: input.nombreMunicipio,
                            esValido: input.esValido,
                            userId: input.userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando actualización de municipio');
                        // Validar ID
                        this.validateId(input.municipioId);
                        return [4 /*yield*/, this.municipioRepo.findById(input.municipioId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.MunicipioNotFoundError(input.municipioId);
                        }
                        // Validaciones de entrada
                        this.validateInput(input);
                        updateData = {
                            nombreMunicipio: input.nombreMunicipio,
                            esValido: input.esValido,
                            userId: input.userId
                        };
                        return [4 /*yield*/, this.municipioRepo.update(input.municipioId, updateData, tx)];
                    case 2:
                        updated = _a.sent();
                        if (!updated) {
                            throw new errors_js_1.MunicipioError('Error al actualizar municipio en la base de datos', 'MUNICIPIO_UPDATE_FAILED', 500);
                        }
                        logger.info({
                            operation: 'updateMunicipio',
                            municipioId: updated.municipioId,
                            estadoId: updated.estadoId,
                            claveMunicipio: updated.claveMunicipio,
                            nombreMunicipio: updated.nombreMunicipio,
                            esValido: updated.esValido,
                            userId: input.userId,
                            timestamp: new Date().toISOString()
                        }, 'Municipio actualizado exitosamente');
                        return [2 /*return*/, updated];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.MunicipioNotFoundError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidIdError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidNombreError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'updateMunicipio',
                            error: error_1.message,
                            municipioId: input.municipioId,
                            nombreMunicipio: input.nombreMunicipio,
                            esValido: input.esValido,
                            userId: input.userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al actualizar municipio');
                        throw new errors_js_1.MunicipioError('Error interno al actualizar municipio', 'MUNICIPIO_UPDATE_ERROR', 500);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UpdateMunicipioCommand.prototype.validateId = function (municipioId) {
        if (!Number.isInteger(municipioId) || municipioId <= 0) {
            throw new errors_js_1.MunicipioInvalidIdError('debe ser un número entero positivo');
        }
    };
    UpdateMunicipioCommand.prototype.validateInput = function (input) {
        // Validar nombreMunicipio si se proporciona
        if (input.nombreMunicipio !== undefined) {
            if (typeof input.nombreMunicipio !== 'string') {
                throw new errors_js_1.MunicipioInvalidNombreError('debe ser una cadena de texto');
            }
            var nombreTrimmed = input.nombreMunicipio.trim();
            if (nombreTrimmed.length === 0) {
                throw new errors_js_1.MunicipioInvalidNombreError('no puede estar vacío');
            }
            if (nombreTrimmed.length > 100) {
                throw new errors_js_1.MunicipioInvalidNombreError('no puede tener más de 100 caracteres');
            }
            // Validar que no contenga caracteres peligrosos
            var nombreRegex = /^[\w\sáéíóúÁÉÍÓÚñÑüÜ.,()-]+$/;
            if (!nombreRegex.test(nombreTrimmed)) {
                throw new errors_js_1.MunicipioInvalidNombreError('contiene caracteres no permitidos');
            }
        }
        // Validar esValido si se proporciona
        if (input.esValido !== undefined && typeof input.esValido !== 'boolean') {
            throw new errors_js_1.MunicipioInvalidNombreError('el campo esValido debe ser un valor booleano');
        }
    };
    return UpdateMunicipioCommand;
}());
exports.UpdateMunicipioCommand = UpdateMunicipioCommand;
