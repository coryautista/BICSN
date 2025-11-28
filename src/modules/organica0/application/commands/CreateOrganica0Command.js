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
exports.CreateOrganica0Command = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreateOrganica0Command = /** @class */ (function () {
    function CreateOrganica0Command(organica0Repo) {
        this.organica0Repo = organica0Repo;
    }
    CreateOrganica0Command.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, organica0Data, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('ORGANICA0_COMMAND', {
                            operation: 'CREATE_ORGANICA0',
                            userId: userId || 'SYSTEM',
                            timestamp: new Date().toISOString(),
                            data: {
                                claveOrganica: data.claveOrganica,
                                nombreOrganica: data.nombreOrganica,
                                usuario: data.usuario,
                                fechaFin: data.fechaFin,
                                estatus: data.estatus
                            }
                        });
                        // Validar clave organica0
                        this.validateClaveOrganica(data.claveOrganica);
                        // Validar nombre organica0
                        this.validateNombreOrganica(data.nombreOrganica);
                        // Validar estatus
                        this.validateEstatus(data.estatus);
                        // Validar fechas si están presentes
                        if (data.fechaFin) {
                            this.validateFechaFin(data.fechaFin);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.organica0Repo.findById(data.claveOrganica)];
                    case 2:
                        existing = _a.sent();
                        if (existing) {
                            console.warn('ORGANICA0_COMMAND_WARNING', {
                                operation: 'CREATE_ORGANICA0',
                                userId: userId || 'SYSTEM',
                                claveOrganica: data.claveOrganica,
                                reason: 'CLAVE_ALREADY_EXISTS',
                                timestamp: new Date().toISOString()
                            });
                            throw new errors_js_1.Organica0AlreadyExistsError(data.claveOrganica);
                        }
                        organica0Data = {
                            claveOrganica: data.claveOrganica,
                            nombreOrganica: data.nombreOrganica,
                            usuario: data.usuario,
                            fechaRegistro: new Date(),
                            fechaFin: data.fechaFin,
                            estatus: data.estatus
                        };
                        return [4 /*yield*/, this.organica0Repo.create(organica0Data)];
                    case 3:
                        result = _a.sent();
                        console.log('ORGANICA0_COMMAND_SUCCESS', {
                            operation: 'CREATE_ORGANICA0',
                            userId: userId || 'SYSTEM',
                            claveOrganica: result.claveOrganica,
                            timestamp: new Date().toISOString()
                        });
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        console.error('ORGANICA0_COMMAND_ERROR', {
                            operation: 'CREATE_ORGANICA0',
                            userId: userId || 'SYSTEM',
                            claveOrganica: data.claveOrganica,
                            error: error_1 instanceof Error ? error_1.message : 'UNKNOWN_ERROR',
                            timestamp: new Date().toISOString()
                        });
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CreateOrganica0Command.prototype.validateClaveOrganica = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica0InvalidClaveError('La clave organica0 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica0InvalidClaveError('La clave organica0 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica0InvalidClaveError('La clave organica0 no puede tener más de 50 caracteres');
        }
        // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
        var claveRegex = /^[A-Za-z0-9\-_\.]+$/;
        if (!claveRegex.test(trimmed)) {
            throw new errors_js_1.Organica0InvalidClaveError('La clave organica0 solo puede contener letras, números, guiones, puntos y guiones bajos');
        }
    };
    CreateOrganica0Command.prototype.validateNombreOrganica = function (nombre) {
        if (!nombre || typeof nombre !== 'string') {
            throw new errors_js_1.Organica0InvalidNombreError('El nombre organica0 es requerido y debe ser una cadena de texto');
        }
        var trimmed = nombre.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica0InvalidNombreError('El nombre organica0 no puede estar vacío');
        }
        if (trimmed.length > 200) {
            throw new errors_js_1.Organica0InvalidNombreError('El nombre organica0 no puede tener más de 200 caracteres');
        }
        // Validar que no contenga caracteres de control o problemáticos
        if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
            throw new errors_js_1.Organica0InvalidNombreError('El nombre organica0 contiene caracteres no válidos');
        }
    };
    CreateOrganica0Command.prototype.validateEstatus = function (estatus) {
        if (!estatus || typeof estatus !== 'string') {
            throw new errors_js_1.Organica0InvalidEstatusError('El estatus es requerido y debe ser una cadena de texto');
        }
        var trimmed = estatus.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica0InvalidEstatusError('El estatus no puede estar vacío');
        }
        // Valores permitidos para estatus (ajustar según necesidades del negocio)
        var valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
        if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
            throw new errors_js_1.Organica0InvalidEstatusError("El estatus debe ser uno de: ".concat(valoresPermitidos.join(', ')));
        }
    };
    CreateOrganica0Command.prototype.validateFechaFin = function (fechaFin) {
        if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
            throw new errors_js_1.Organica0InvalidFechaError('La fecha fin debe ser una fecha válida');
        }
        var now = new Date();
        if (fechaFin < now) {
            throw new errors_js_1.Organica0InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
        }
    };
    return CreateOrganica0Command;
}());
exports.CreateOrganica0Command = CreateOrganica0Command;
