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
exports.CreatePersonalCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreatePersonalCommand = /** @class */ (function () {
    function CreatePersonalCommand(personalRepo) {
        this.personalRepo = personalRepo;
    }
    CreatePersonalCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existingPersonal, personal, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Iniciando creaci\u00F3n de registro personal"), {
                            interno: data.interno,
                            curp: data.curp,
                            rfc: data.rfc,
                            noempleado: data.noempleado
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Validar datos de entrada
                        return [4 /*yield*/, this.validateCreateData(data)];
                    case 2:
                        // Validar datos de entrada
                        _a.sent();
                        return [4 /*yield*/, this.personalRepo.findById(data.interno)];
                    case 3:
                        existingPersonal = _a.sent();
                        if (existingPersonal) {
                            throw new errors_js_1.PersonalAlreadyExistsError(data.interno);
                        }
                        return [4 /*yield*/, this.personalRepo.create(data)];
                    case 4:
                        personal = _a.sent();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Registro personal creado exitosamente"), {
                            interno: personal.interno,
                            curp: personal.curp,
                            rfc: personal.rfc
                        });
                        return [2 /*return*/, personal];
                    case 5:
                        error_1 = _a.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en creaci\u00F3n de registro personal"), {
                            interno: data.interno,
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido'
                        });
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CreatePersonalCommand.prototype.validateCreateData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var fecha, estadosValidos, emailRegex, fecha;
            return __generator(this, function (_a) {
                // Validar interno
                if (!data.interno || typeof data.interno !== 'number' || data.interno <= 0 || !Number.isInteger(data.interno)) {
                    throw new errors_js_1.PersonalInvalidInternoError(data.interno);
                }
                // Validar CURP (opcional pero si se proporciona debe ser válido)
                if (data.curp !== undefined && data.curp !== null) {
                    if (typeof data.curp !== 'string' || data.curp.length !== 18 || !/^[A-Z0-9]{18}$/.test(data.curp)) {
                        throw new errors_js_1.PersonalInvalidCurpError(data.curp);
                    }
                }
                // Validar RFC (opcional pero si se proporciona debe ser válido)
                if (data.rfc !== undefined && data.rfc !== null) {
                    if (typeof data.rfc !== 'string' || (data.rfc.length < 12 || data.rfc.length > 13) || !/^[A-Z0-9]{12,13}$/.test(data.rfc)) {
                        throw new errors_js_1.PersonalInvalidRfcError(data.rfc);
                    }
                }
                // Validar número de empleado (opcional pero si se proporciona debe ser válido)
                if (data.noempleado !== undefined && data.noempleado !== null) {
                    if (typeof data.noempleado !== 'string' || data.noempleado.length > 20 || !/^[A-Z0-9]*$/.test(data.noempleado)) {
                        throw new errors_js_1.PersonalInvalidNoEmpleadoError(data.noempleado);
                    }
                }
                // Validar nombre (requerido)
                if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.nombre.trim())) {
                    throw new errors_js_1.PersonalInvalidNombreError(data.nombre || '');
                }
                // Validar apellido paterno (opcional pero si se proporciona debe ser válido)
                if (data.apellido_paterno !== undefined && data.apellido_paterno !== null) {
                    if (typeof data.apellido_paterno !== 'string' || data.apellido_paterno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_paterno.trim())) {
                        throw new errors_js_1.PersonalInvalidApellidoPaternoError(data.apellido_paterno);
                    }
                }
                // Validar apellido materno (opcional pero si se proporciona debe ser válido)
                if (data.apellido_materno !== undefined && data.apellido_materno !== null) {
                    if (typeof data.apellido_materno !== 'string' || data.apellido_materno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_materno.trim())) {
                        throw new errors_js_1.PersonalInvalidApellidoMaternoError(data.apellido_materno);
                    }
                }
                // Validar fecha de nacimiento (opcional pero si se proporciona debe ser válida)
                if (data.fecha_nacimiento !== undefined && data.fecha_nacimiento !== null) {
                    fecha = new Date(data.fecha_nacimiento);
                    if (isNaN(fecha.getTime())) {
                        throw new errors_js_1.PersonalInvalidFechaNacimientoError(data.fecha_nacimiento);
                    }
                }
                // Validar seguro social (opcional pero si se proporciona debe ser válido)
                if (data.seguro_social !== undefined && data.seguro_social !== null) {
                    if (typeof data.seguro_social !== 'string' || data.seguro_social.length !== 11 || !/^\d{11}$/.test(data.seguro_social)) {
                        throw new errors_js_1.PersonalInvalidSeguroSocialError(data.seguro_social);
                    }
                }
                // Validar código postal (opcional pero si se proporciona debe ser válido)
                if (data.codigo_postal !== undefined && data.codigo_postal !== null) {
                    if (typeof data.codigo_postal !== 'string' || data.codigo_postal.length !== 5 || !/^\d{5}$/.test(data.codigo_postal)) {
                        throw new errors_js_1.PersonalInvalidCodigoPostalError(data.codigo_postal);
                    }
                }
                // Validar teléfono (opcional pero si se proporciona debe ser válido)
                if (data.telefono !== undefined && data.telefono !== null) {
                    if (typeof data.telefono !== 'string' || data.telefono.length > 15 || !/^\d+$/.test(data.telefono)) {
                        throw new errors_js_1.PersonalInvalidTelefonoError(data.telefono);
                    }
                }
                // Validar sexo (opcional pero si se proporciona debe ser válido)
                if (data.sexo !== undefined && data.sexo !== null) {
                    if (typeof data.sexo !== 'string' || !['M', 'F'].includes(data.sexo.toUpperCase())) {
                        throw new errors_js_1.PersonalInvalidSexoError(data.sexo);
                    }
                }
                // Validar estado civil (opcional pero si se proporciona debe ser válido)
                if (data.estado_civil !== undefined && data.estado_civil !== null) {
                    estadosValidos = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'];
                    if (typeof data.estado_civil !== 'string' || !estadosValidos.includes(data.estado_civil.toUpperCase())) {
                        throw new errors_js_1.PersonalInvalidEstadoCivilError(data.estado_civil);
                    }
                }
                // Validar email (opcional pero si se proporciona debe ser válido)
                if (data.email !== undefined && data.email !== null) {
                    emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
                        throw new errors_js_1.PersonalInvalidEmailError(data.email);
                    }
                }
                // Validar fecha de alta (opcional pero si se proporciona debe ser válida)
                if (data.fecha_alta !== undefined && data.fecha_alta !== null) {
                    fecha = new Date(data.fecha_alta);
                    if (isNaN(fecha.getTime())) {
                        throw new errors_js_1.PersonalInvalidFechaAltaError(data.fecha_alta);
                    }
                }
                // Validar celular (opcional pero si se proporciona debe ser válido)
                if (data.celular !== undefined && data.celular !== null) {
                    if (typeof data.celular !== 'string' || data.celular.length > 15 || !/^\d+$/.test(data.celular)) {
                        throw new errors_js_1.PersonalInvalidCelularError(data.celular);
                    }
                }
                // Validar expediente (opcional pero si se proporciona debe ser válido)
                if (data.expediente !== undefined && data.expediente !== null) {
                    if (typeof data.expediente !== 'string' || data.expediente.length > 50 || !/^[A-Z0-9\s]*$/i.test(data.expediente)) {
                        throw new errors_js_1.PersonalInvalidExpedienteError(data.expediente);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return CreatePersonalCommand;
}());
exports.CreatePersonalCommand = CreatePersonalCommand;
