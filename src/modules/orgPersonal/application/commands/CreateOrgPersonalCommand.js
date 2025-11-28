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
exports.CreateOrgPersonalCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreateOrgPersonalCommand = /** @class */ (function () {
    function CreateOrgPersonalCommand(orgPersonalRepo) {
        this.orgPersonalRepo = orgPersonalRepo;
    }
    CreateOrgPersonalCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Logging de la operación
                        console.log("[ORG_PERSONAL] Creando nuevo registro orgPersonal, usuario: ".concat(userId || 'desconocido'));
                        // Validaciones de entrada
                        this.validateCreateData(data);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.orgPersonalRepo.findById(data.interno)];
                    case 2:
                        existing = _a.sent();
                        if (existing) {
                            throw new errors_js_1.OrgPersonalAlreadyExistsError(data.interno);
                        }
                        return [4 /*yield*/, this.orgPersonalRepo.create(data)];
                    case 3:
                        result = _a.sent();
                        console.log("[ORG_PERSONAL] Registro orgPersonal creado exitosamente: interno ".concat(result.interno));
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        // Si ya es un error de dominio, lo propagamos
                        if (error_1 instanceof errors_js_1.OrgPersonalAlreadyExistsError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidInternoError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidClaveOrganicaError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidSueldoError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidOtrasPrestacionesError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidQuinqueniosError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidActivoError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidFechaError ||
                            error_1 instanceof errors_js_1.OrgPersonalInvalidPorcentajeError) {
                            throw error_1;
                        }
                        console.error("[ORG_PERSONAL] Error al crear registro orgPersonal:", error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CreateOrgPersonalCommand.prototype.validateCreateData = function (data) {
        // Validar interno
        if (!data.interno || typeof data.interno !== 'number' || data.interno <= 0 || !Number.isInteger(data.interno)) {
            throw new errors_js_1.OrgPersonalInvalidInternoError(data.interno);
        }
        // Validar claves orgánicas (pueden ser null)
        if (data.clave_organica_0 !== null && data.clave_organica_0 !== undefined) {
            this.validateClaveOrganica(data.clave_organica_0, 0);
        }
        if (data.clave_organica_1 !== null && data.clave_organica_1 !== undefined) {
            this.validateClaveOrganica(data.clave_organica_1, 1);
        }
        if (data.clave_organica_2 !== null && data.clave_organica_2 !== undefined) {
            this.validateClaveOrganica(data.clave_organica_2, 2);
        }
        if (data.clave_organica_3 !== null && data.clave_organica_3 !== undefined) {
            this.validateClaveOrganica(data.clave_organica_3, 3);
        }
        // Validar sueldo
        if (data.sueldo !== null && data.sueldo !== undefined) {
            if (typeof data.sueldo !== 'number' || data.sueldo < 0) {
                throw new errors_js_1.OrgPersonalInvalidSueldoError(data.sueldo);
            }
        }
        // Validar otras prestaciones
        if (data.otras_prestaciones !== null && data.otras_prestaciones !== undefined) {
            if (typeof data.otras_prestaciones !== 'number' || data.otras_prestaciones < 0) {
                throw new errors_js_1.OrgPersonalInvalidOtrasPrestacionesError(data.otras_prestaciones);
            }
        }
        // Validar quinquenios
        if (data.quinquenios !== null && data.quinquenios !== undefined) {
            if (typeof data.quinquenios !== 'number' || data.quinquenios < 0) {
                throw new errors_js_1.OrgPersonalInvalidQuinqueniosError(data.quinquenios);
            }
        }
        // Validar activo
        if (data.activo !== null && data.activo !== undefined) {
            if (typeof data.activo !== 'string' || !['S', 'N'].includes(data.activo)) {
                throw new errors_js_1.OrgPersonalInvalidActivoError(data.activo);
            }
        }
        // Validar fecha_mov_alt
        if (data.fecha_mov_alt !== null && data.fecha_mov_alt !== undefined) {
            if (typeof data.fecha_mov_alt !== 'string' || isNaN(Date.parse(data.fecha_mov_alt))) {
                throw new errors_js_1.OrgPersonalInvalidFechaError(data.fecha_mov_alt);
            }
        }
        // Validar porcentaje
        if (data.porcentaje !== null && data.porcentaje !== undefined) {
            if (typeof data.porcentaje !== 'number' || data.porcentaje < 0 || data.porcentaje > 100) {
                throw new errors_js_1.OrgPersonalInvalidPorcentajeError(data.porcentaje);
            }
        }
    };
    CreateOrgPersonalCommand.prototype.validateClaveOrganica = function (clave, nivel) {
        if (typeof clave !== 'string') {
            throw new errors_js_1.OrgPersonalInvalidClaveOrganicaError(clave, nivel);
        }
        // Validar formato: 1-2 caracteres alfanuméricos
        var claveRegex = /^[A-Za-z0-9]{1,2}$/;
        if (!claveRegex.test(clave)) {
            throw new errors_js_1.OrgPersonalInvalidClaveOrganicaError(clave, nivel);
        }
    };
    return CreateOrgPersonalCommand;
}());
exports.CreateOrgPersonalCommand = CreateOrgPersonalCommand;
