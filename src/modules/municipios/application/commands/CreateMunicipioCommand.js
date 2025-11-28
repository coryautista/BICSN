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
exports.CreateMunicipioCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createMunicipioCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateMunicipioCommand = /** @class */ (function () {
    function CreateMunicipioCommand(municipioRepo) {
        this.municipioRepo = municipioRepo;
    }
    CreateMunicipioCommand.prototype.execute = function (input, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMunicipio, createData, municipio, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger.info({
                            operation: 'createMunicipio',
                            estadoId: input.estadoId,
                            claveMunicipio: input.claveMunicipio,
                            nombreMunicipio: input.nombreMunicipio,
                            esValido: input.esValido,
                            userId: input.userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando creación de municipio');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.municipioRepo.findByClave(input.claveMunicipio)];
                    case 1:
                        existingMunicipio = _a.sent();
                        if (existingMunicipio) {
                            throw new errors_js_1.MunicipioAlreadyExistsError(input.claveMunicipio);
                        }
                        createData = {
                            estadoId: input.estadoId,
                            claveMunicipio: input.claveMunicipio,
                            nombreMunicipio: input.nombreMunicipio,
                            esValido: input.esValido,
                            userId: input.userId
                        };
                        return [4 /*yield*/, this.municipioRepo.create(createData, tx)];
                    case 2:
                        municipio = _a.sent();
                        logger.info({
                            operation: 'createMunicipio',
                            municipioId: municipio.municipioId,
                            estadoId: municipio.estadoId,
                            claveMunicipio: municipio.claveMunicipio,
                            nombreMunicipio: municipio.nombreMunicipio,
                            userId: input.userId,
                            timestamp: new Date().toISOString()
                        }, 'Municipio creado exitosamente');
                        return [2 /*return*/, municipio];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.MunicipioAlreadyExistsError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidEstadoError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidClaveError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidNombreError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'createMunicipio',
                            error: error_1.message,
                            estadoId: input.estadoId,
                            claveMunicipio: input.claveMunicipio,
                            nombreMunicipio: input.nombreMunicipio,
                            userId: input.userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al crear municipio');
                        throw new errors_js_1.MunicipioError('Error interno al crear municipio', 'MUNICIPIO_CREATE_ERROR', 500);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CreateMunicipioCommand.prototype.validateInput = function (input) {
        // Validar estadoId
        if (!input.estadoId || typeof input.estadoId !== 'string') {
            throw new errors_js_1.MunicipioInvalidEstadoError('debe ser una cadena de texto');
        }
        var estadoIdTrimmed = input.estadoId.trim();
        if (estadoIdTrimmed.length === 0) {
            throw new errors_js_1.MunicipioInvalidEstadoError('no puede estar vacío');
        }
        if (estadoIdTrimmed.length !== 2) {
            throw new errors_js_1.MunicipioInvalidEstadoError('debe tener exactamente 2 caracteres');
        }
        // Solo permitir letras mayúsculas para códigos de estado
        var estadoRegex = /^[A-Z]{2}$/;
        if (!estadoRegex.test(estadoIdTrimmed)) {
            throw new errors_js_1.MunicipioInvalidEstadoError('debe contener solo letras mayúsculas');
        }
        // Validar claveMunicipio
        if (!input.claveMunicipio || typeof input.claveMunicipio !== 'string') {
            throw new errors_js_1.MunicipioInvalidClaveError('debe ser una cadena de texto');
        }
        var claveTrimmed = input.claveMunicipio.trim();
        if (claveTrimmed.length === 0) {
            throw new errors_js_1.MunicipioInvalidClaveError('no puede estar vacía');
        }
        if (claveTrimmed.length > 3) {
            throw new errors_js_1.MunicipioInvalidClaveError('no puede tener más de 3 caracteres');
        }
        // Solo permitir letras, números y algunos caracteres especiales
        var claveRegex = /^[A-Z0-9\-]+$/;
        if (!claveRegex.test(claveTrimmed)) {
            throw new errors_js_1.MunicipioInvalidClaveError('solo puede contener letras mayúsculas, números y guiones');
        }
        // Validar nombreMunicipio
        if (!input.nombreMunicipio || typeof input.nombreMunicipio !== 'string') {
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
        // Validar esValido
        if (typeof input.esValido !== 'boolean') {
            throw new errors_js_1.MunicipioInvalidEstadoError('el campo esValido debe ser un valor booleano');
        }
    };
    return CreateMunicipioCommand;
}());
exports.CreateMunicipioCommand = CreateMunicipioCommand;
