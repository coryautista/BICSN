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
exports.CreateOrganica1Command = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreateOrganica1Command = /** @class */ (function () {
    function CreateOrganica1Command(organica1Repo) {
        this.organica1Repo = organica1Repo;
    }
    CreateOrganica1Command.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, organica1Data, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('ORGANICA1_COMMAND', {
                            operation: 'CREATE_ORGANICA1',
                            userId: userId || 'SYSTEM',
                            timestamp: new Date().toISOString(),
                            data: {
                                claveOrganica0: data.claveOrganica0,
                                claveOrganica1: data.claveOrganica1,
                                descripcion: data.descripcion,
                                titular: data.titular,
                                rfc: data.rfc,
                                imss: data.imss,
                                infonavit: data.infonavit,
                                bancoSar: data.bancoSar,
                                cuentaSar: data.cuentaSar,
                                tipoEmpresaSar: data.tipoEmpresaSar,
                                pcp: data.pcp,
                                ph: data.ph,
                                fv: data.fv,
                                fg: data.fg,
                                di: data.di,
                                fechaFin1: data.fechaFin1,
                                usuario: data.usuario,
                                estatus: data.estatus,
                                sar: data.sar
                            }
                        });
                        // Validar claves
                        this.validateClaveOrganica0(data.claveOrganica0);
                        this.validateClaveOrganica1(data.claveOrganica1);
                        // Validar campos opcionales si están presentes
                        if (data.descripcion !== undefined) {
                            this.validateDescripcion(data.descripcion);
                        }
                        if (data.titular !== undefined) {
                            this.validateTitular(data.titular);
                        }
                        if (data.rfc !== undefined) {
                            this.validateRfc(data.rfc);
                        }
                        if (data.imss !== undefined) {
                            this.validateImss(data.imss);
                        }
                        if (data.infonavit !== undefined) {
                            this.validateInfonavit(data.infonavit);
                        }
                        // Validar estatus
                        this.validateEstatus(data.estatus);
                        // Validar fechas si están presentes
                        if (data.fechaFin1) {
                            this.validateFechaFin(data.fechaFin1);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.organica1Repo.findById(data.claveOrganica0, data.claveOrganica1)];
                    case 2:
                        existing = _a.sent();
                        if (existing) {
                            console.warn('ORGANICA1_COMMAND_WARNING', {
                                operation: 'CREATE_ORGANICA1',
                                userId: userId || 'SYSTEM',
                                claveOrganica0: data.claveOrganica0,
                                claveOrganica1: data.claveOrganica1,
                                reason: 'CLAVE_COMBO_ALREADY_EXISTS',
                                timestamp: new Date().toISOString()
                            });
                            throw new errors_js_1.Organica1AlreadyExistsError(data.claveOrganica0, data.claveOrganica1);
                        }
                        organica1Data = {
                            claveOrganica0: data.claveOrganica0,
                            claveOrganica1: data.claveOrganica1,
                            descripcion: data.descripcion,
                            titular: data.titular,
                            rfc: data.rfc,
                            imss: data.imss,
                            infonavit: data.infonavit,
                            bancoSar: data.bancoSar,
                            cuentaSar: data.cuentaSar,
                            tipoEmpresaSar: data.tipoEmpresaSar,
                            pcp: data.pcp,
                            ph: data.ph,
                            fv: data.fv,
                            fg: data.fg,
                            di: data.di,
                            fechaRegistro1: new Date(),
                            fechaFin1: data.fechaFin1,
                            usuario: data.usuario,
                            estatus: data.estatus,
                            sar: data.sar
                        };
                        return [4 /*yield*/, this.organica1Repo.create(organica1Data)];
                    case 3:
                        result = _a.sent();
                        console.log('ORGANICA1_COMMAND_SUCCESS', {
                            operation: 'CREATE_ORGANICA1',
                            userId: userId || 'SYSTEM',
                            claveOrganica0: result.claveOrganica0,
                            claveOrganica1: result.claveOrganica1,
                            timestamp: new Date().toISOString()
                        });
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        console.error('ORGANICA1_COMMAND_ERROR', {
                            operation: 'CREATE_ORGANICA1',
                            userId: userId || 'SYSTEM',
                            claveOrganica0: data.claveOrganica0,
                            claveOrganica1: data.claveOrganica1,
                            error: error_1 instanceof Error ? error_1.message : 'UNKNOWN_ERROR',
                            timestamp: new Date().toISOString()
                        });
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CreateOrganica1Command.prototype.validateClaveOrganica0 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica1InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica1InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
        }
        // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
        var claveRegex = /^[A-Za-z0-9\-_\.]+$/;
        if (!claveRegex.test(trimmed)) {
            throw new errors_js_1.Organica1InvalidClaveOrganica0Error('La clave organica0 solo puede contener letras, números, guiones, puntos y guiones bajos');
        }
    };
    CreateOrganica1Command.prototype.validateClaveOrganica1 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica1InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica1InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
        }
        // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
        var claveRegex = /^[A-Za-z0-9\-_\.]+$/;
        if (!claveRegex.test(trimmed)) {
            throw new errors_js_1.Organica1InvalidClaveOrganica1Error('La clave organica1 solo puede contener letras, números, guiones, puntos y guiones bajos');
        }
    };
    CreateOrganica1Command.prototype.validateDescripcion = function (descripcion) {
        if (typeof descripcion !== 'string') {
            throw new errors_js_1.Organica1InvalidDescripcionError('La descripción debe ser una cadena de texto');
        }
        var trimmed = descripcion.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidDescripcionError('La descripción no puede estar vacía');
        }
        if (trimmed.length > 500) {
            throw new errors_js_1.Organica1InvalidDescripcionError('La descripción no puede tener más de 500 caracteres');
        }
        // Validar que no contenga caracteres de control o problemáticos
        if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
            throw new errors_js_1.Organica1InvalidDescripcionError('La descripción contiene caracteres no válidos');
        }
    };
    CreateOrganica1Command.prototype.validateTitular = function (titular) {
        if (typeof titular !== 'number' || !Number.isInteger(titular)) {
            throw new errors_js_1.Organica1InvalidTitularError('El titular debe ser un número entero');
        }
        if (titular <= 0) {
            throw new errors_js_1.Organica1InvalidTitularError('El titular debe ser un número positivo');
        }
        if (titular > 999999999) {
            throw new errors_js_1.Organica1InvalidTitularError('El titular no puede tener más de 9 dígitos');
        }
    };
    CreateOrganica1Command.prototype.validateRfc = function (rfc) {
        if (typeof rfc !== 'string') {
            throw new errors_js_1.Organica1InvalidRfcError('El RFC debe ser una cadena de texto');
        }
        var trimmed = rfc.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidRfcError('El RFC no puede estar vacío');
        }
        if (trimmed.length > 13) {
            throw new errors_js_1.Organica1InvalidRfcError('El RFC no puede tener más de 13 caracteres');
        }
        // Validar formato básico de RFC (puedes expandir esta validación según necesidades)
        var rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(trimmed.toUpperCase())) {
            throw new errors_js_1.Organica1InvalidRfcError('El formato del RFC no es válido');
        }
    };
    CreateOrganica1Command.prototype.validateImss = function (imss) {
        if (typeof imss !== 'string') {
            throw new errors_js_1.Organica1InvalidImssError('El IMSS debe ser una cadena de texto');
        }
        var trimmed = imss.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidImssError('El IMSS no puede estar vacío');
        }
        if (trimmed.length > 20) {
            throw new errors_js_1.Organica1InvalidImssError('El IMSS no puede tener más de 20 caracteres');
        }
        // Validar que contenga solo números
        if (!/^\d+$/.test(trimmed)) {
            throw new errors_js_1.Organica1InvalidImssError('El IMSS debe contener solo números');
        }
    };
    CreateOrganica1Command.prototype.validateInfonavit = function (infonavit) {
        if (typeof infonavit !== 'string') {
            throw new errors_js_1.Organica1InvalidInfonavitError('El INFONAVIT debe ser una cadena de texto');
        }
        var trimmed = infonavit.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidInfonavitError('El INFONAVIT no puede estar vacío');
        }
        if (trimmed.length > 20) {
            throw new errors_js_1.Organica1InvalidInfonavitError('El INFONAVIT no puede tener más de 20 caracteres');
        }
        // Validar que contenga solo números
        if (!/^\d+$/.test(trimmed)) {
            throw new errors_js_1.Organica1InvalidInfonavitError('El INFONAVIT debe contener solo números');
        }
    };
    CreateOrganica1Command.prototype.validateEstatus = function (estatus) {
        if (!estatus || typeof estatus !== 'string') {
            throw new errors_js_1.Organica1InvalidEstatusError('El estatus es requerido y debe ser una cadena de texto');
        }
        var trimmed = estatus.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica1InvalidEstatusError('El estatus no puede estar vacío');
        }
        // Valores permitidos para estatus (ajustar según necesidades del negocio)
        var valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
        if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
            throw new errors_js_1.Organica1InvalidEstatusError("El estatus debe ser uno de: ".concat(valoresPermitidos.join(', ')));
        }
    };
    CreateOrganica1Command.prototype.validateFechaFin = function (fechaFin) {
        if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
            throw new errors_js_1.Organica1InvalidFechaError('La fecha fin debe ser una fecha válida');
        }
        var now = new Date();
        if (fechaFin < now) {
            throw new errors_js_1.Organica1InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
        }
    };
    return CreateOrganica1Command;
}());
exports.CreateOrganica1Command = CreateOrganica1Command;
