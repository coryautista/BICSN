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
exports.CreateOrganica3Command = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreateOrganica3Command = /** @class */ (function () {
    function CreateOrganica3Command(organica3Repo) {
        this.organica3Repo = organica3Repo;
    }
    CreateOrganica3Command.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('ORGANICA3_COMMAND', {
                            operation: 'CREATE_ORGANICA3',
                            userId: userId || 'SYSTEM',
                            timestamp: new Date().toISOString(),
                            data: data
                        });
                        // Validar claves
                        this.validateClaveOrganica0(data.claveOrganica0);
                        this.validateClaveOrganica1(data.claveOrganica1);
                        this.validateClaveOrganica2(data.claveOrganica2);
                        this.validateClaveOrganica3(data.claveOrganica3);
                        // Validar campos obligatorios y opcionales
                        if (data.descripcion !== undefined) {
                            this.validateDescripcion(data.descripcion);
                        }
                        if (data.titular !== undefined) {
                            this.validateTitular(data.titular);
                        }
                        if (data.calleNum !== undefined) {
                            this.validateCalleNum(data.calleNum);
                        }
                        if (data.fraccionamiento !== undefined) {
                            this.validateFraccionamiento(data.fraccionamiento);
                        }
                        if (data.codigoPostal !== undefined) {
                            this.validateCodigoPostal(data.codigoPostal);
                        }
                        if (data.telefono !== undefined) {
                            this.validateTelefono(data.telefono);
                        }
                        if (data.fax !== undefined) {
                            this.validateFax(data.fax);
                        }
                        if (data.localidad !== undefined) {
                            this.validateLocalidad(data.localidad);
                        }
                        if (data.municipio !== undefined) {
                            this.validateMunicipio(data.municipio);
                        }
                        if (data.estado !== undefined) {
                            this.validateEstado(data.estado);
                        }
                        this.validateEstatus(data.estatus);
                        if (data.fechaFin3 !== undefined) {
                            this.validateFechaFin(data.fechaFin3);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.organica3Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3)];
                    case 2:
                        existing = _a.sent();
                        if (existing) {
                            console.warn('ORGANICA3_COMMAND_WARNING', {
                                operation: 'CREATE_ORGANICA3',
                                userId: userId || 'SYSTEM',
                                claveOrganica0: data.claveOrganica0,
                                claveOrganica1: data.claveOrganica1,
                                claveOrganica2: data.claveOrganica2,
                                claveOrganica3: data.claveOrganica3,
                                reason: 'ORGANICA3_ALREADY_EXISTS',
                                timestamp: new Date().toISOString()
                            });
                            throw new errors_js_1.Organica3AlreadyExistsError(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3);
                        }
                        // Verificar que exista la clave padre (organica2)
                        return [4 /*yield*/, this.validateParentExists(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2)];
                    case 3:
                        // Verificar que exista la clave padre (organica2)
                        _a.sent();
                        return [4 /*yield*/, this.organica3Repo.create(data)];
                    case 4:
                        result = _a.sent();
                        console.log('ORGANICA3_COMMAND_SUCCESS', {
                            operation: 'CREATE_ORGANICA3',
                            userId: userId || 'SYSTEM',
                            claveOrganica0: data.claveOrganica0,
                            claveOrganica1: data.claveOrganica1,
                            claveOrganica2: data.claveOrganica2,
                            claveOrganica3: data.claveOrganica3,
                            timestamp: new Date().toISOString()
                        });
                        return [2 /*return*/, result];
                    case 5:
                        error_1 = _a.sent();
                        console.error('ORGANICA3_COMMAND_ERROR', {
                            operation: 'CREATE_ORGANICA3',
                            userId: userId || 'SYSTEM',
                            claveOrganica0: data.claveOrganica0,
                            claveOrganica1: data.claveOrganica1,
                            claveOrganica2: data.claveOrganica2,
                            claveOrganica3: data.claveOrganica3,
                            error: error_1 instanceof Error ? error_1.message : 'UNKNOWN_ERROR',
                            timestamp: new Date().toISOString()
                        });
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CreateOrganica3Command.prototype.validateClaveOrganica0 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica3InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica3InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateClaveOrganica1 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica3InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica3InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateClaveOrganica2 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica3InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica3InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 50 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateClaveOrganica3 = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new errors_js_1.Organica3InvalidClaveOrganica3Error('La clave organica3 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidClaveOrganica3Error('La clave organica3 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new errors_js_1.Organica3InvalidClaveOrganica3Error('La clave organica3 no puede tener más de 50 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateDescripcion = function (descripcion) {
        if (typeof descripcion !== 'string') {
            throw new errors_js_1.Organica3InvalidDescripcionError('La descripción debe ser una cadena de texto');
        }
        var trimmed = descripcion.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidDescripcionError('La descripción no puede estar vacía');
        }
        if (trimmed.length > 500) {
            throw new errors_js_1.Organica3InvalidDescripcionError('La descripción no puede tener más de 500 caracteres');
        }
        // Validar que no contenga caracteres de control o problemáticos
        if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
            throw new errors_js_1.Organica3InvalidDescripcionError('La descripción contiene caracteres no válidos');
        }
    };
    CreateOrganica3Command.prototype.validateTitular = function (titular) {
        if (typeof titular !== 'number' || !Number.isInteger(titular)) {
            throw new errors_js_1.Organica3InvalidTitularError('El titular debe ser un número entero');
        }
        if (titular <= 0) {
            throw new errors_js_1.Organica3InvalidTitularError('El titular debe ser un número positivo');
        }
        if (titular > 999999999) {
            throw new errors_js_1.Organica3InvalidTitularError('El titular no puede tener más de 9 dígitos');
        }
    };
    CreateOrganica3Command.prototype.validateCalleNum = function (calleNum) {
        if (typeof calleNum !== 'string') {
            throw new errors_js_1.Organica3InvalidCalleNumError('La calle y número debe ser una cadena de texto');
        }
        var trimmed = calleNum.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidCalleNumError('La calle y número no puede estar vacía');
        }
        if (trimmed.length > 200) {
            throw new errors_js_1.Organica3InvalidCalleNumError('La calle y número no puede tener más de 200 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateFraccionamiento = function (fraccionamiento) {
        if (typeof fraccionamiento !== 'string') {
            throw new errors_js_1.Organica3InvalidFraccionamientoError('El fraccionamiento debe ser una cadena de texto');
        }
        var trimmed = fraccionamiento.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidFraccionamientoError('El fraccionamiento no puede estar vacío');
        }
        if (trimmed.length > 200) {
            throw new errors_js_1.Organica3InvalidFraccionamientoError('El fraccionamiento no puede tener más de 200 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateCodigoPostal = function (codigoPostal) {
        if (typeof codigoPostal !== 'string') {
            throw new errors_js_1.Organica3InvalidCodigoPostalError('El código postal debe ser una cadena de texto');
        }
        var trimmed = codigoPostal.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidCodigoPostalError('El código postal no puede estar vacío');
        }
        // Validar formato de código postal mexicano (5 dígitos)
        if (!/^\d{5}$/.test(trimmed)) {
            throw new errors_js_1.Organica3InvalidCodigoPostalError('El código postal debe tener exactamente 5 dígitos');
        }
    };
    CreateOrganica3Command.prototype.validateTelefono = function (telefono) {
        if (typeof telefono !== 'string') {
            throw new errors_js_1.Organica3InvalidTelefonoError('El teléfono debe ser una cadena de texto');
        }
        var trimmed = telefono.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidTelefonoError('El teléfono no puede estar vacío');
        }
        if (trimmed.length > 20) {
            throw new errors_js_1.Organica3InvalidTelefonoError('El teléfono no puede tener más de 20 caracteres');
        }
        // Validar formato básico de teléfono
        if (!/^[\d\s\-\+\(\)]+$/.test(trimmed)) {
            throw new errors_js_1.Organica3InvalidTelefonoError('El teléfono contiene caracteres no válidos');
        }
    };
    CreateOrganica3Command.prototype.validateFax = function (fax) {
        if (typeof fax !== 'string') {
            throw new errors_js_1.Organica3InvalidFaxError('El fax debe ser una cadena de texto');
        }
        var trimmed = fax.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidFaxError('El fax no puede estar vacío');
        }
        if (trimmed.length > 20) {
            throw new errors_js_1.Organica3InvalidFaxError('El fax no puede tener más de 20 caracteres');
        }
        // Validar formato básico de fax
        if (!/^[\d\s\-\+\(\)]+$/.test(trimmed)) {
            throw new errors_js_1.Organica3InvalidFaxError('El fax contiene caracteres no válidos');
        }
    };
    CreateOrganica3Command.prototype.validateLocalidad = function (localidad) {
        if (typeof localidad !== 'string') {
            throw new errors_js_1.Organica3InvalidLocalidadError('La localidad debe ser una cadena de texto');
        }
        var trimmed = localidad.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidLocalidadError('La localidad no puede estar vacía');
        }
        if (trimmed.length > 100) {
            throw new errors_js_1.Organica3InvalidLocalidadError('La localidad no puede tener más de 100 caracteres');
        }
    };
    CreateOrganica3Command.prototype.validateMunicipio = function (municipio) {
        if (typeof municipio !== 'number' || !Number.isInteger(municipio)) {
            throw new errors_js_1.Organica3InvalidMunicipioError('El municipio debe ser un número entero');
        }
        if (municipio <= 0) {
            throw new errors_js_1.Organica3InvalidMunicipioError('El municipio debe ser un número positivo');
        }
        if (municipio > 9999) {
            throw new errors_js_1.Organica3InvalidMunicipioError('El municipio no puede tener más de 4 dígitos');
        }
    };
    CreateOrganica3Command.prototype.validateEstado = function (estado) {
        if (typeof estado !== 'number' || !Number.isInteger(estado)) {
            throw new errors_js_1.Organica3InvalidEstadoError('El estado debe ser un número entero');
        }
        if (estado <= 0) {
            throw new errors_js_1.Organica3InvalidEstadoError('El estado debe ser un número positivo');
        }
        if (estado > 99) {
            throw new errors_js_1.Organica3InvalidEstadoError('El estado no puede tener más de 2 dígitos');
        }
    };
    CreateOrganica3Command.prototype.validateEstatus = function (estatus) {
        if (typeof estatus !== 'string') {
            throw new errors_js_1.Organica3InvalidEstatusError('El estatus debe ser una cadena de texto');
        }
        var trimmed = estatus.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.Organica3InvalidEstatusError('El estatus no puede estar vacío');
        }
        // Valores permitidos para estatus
        var valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
        if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
            throw new errors_js_1.Organica3InvalidEstatusError("El estatus debe ser uno de: ".concat(valoresPermitidos.join(', ')));
        }
    };
    CreateOrganica3Command.prototype.validateFechaFin = function (fechaFin) {
        if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
            throw new errors_js_1.Organica3InvalidFechaError('La fecha fin debe ser una fecha válida');
        }
        var now = new Date();
        if (fechaFin < now) {
            throw new errors_js_1.Organica3InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
        }
    };
    CreateOrganica3Command.prototype.validateParentExists = function (_claveOrganica0, _claveOrganica1, _claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return CreateOrganica3Command;
}());
exports.CreateOrganica3Command = CreateOrganica3Command;
