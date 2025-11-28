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
exports.CreateCategoriaPuestoOrgCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createCategoriaPuestoOrgCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateCategoriaPuestoOrgCommand = /** @class */ (function () {
    function CreateCategoriaPuestoOrgCommand(categoriaPuestoOrgRepo) {
        this.categoriaPuestoOrgRepo = categoriaPuestoOrgRepo;
    }
    CreateCategoriaPuestoOrgCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'createCategoriaPuestoOrg',
                            nivel: data.nivel,
                            org0: data.org0,
                            org1: data.org1,
                            categoria: data.categoria,
                            userId: data.userId
                        };
                        logger.info(logContext, 'Creando nueva categoría de puesto orgánico');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Verificar duplicados antes de crear
                        return [4 /*yield*/, this.checkForDuplicates(data)];
                    case 2:
                        // Verificar duplicados antes de crear
                        _a.sent();
                        return [4 /*yield*/, this.categoriaPuestoOrgRepo.create(data)];
                    case 3:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { categoriaPuestoOrgId: result.categoriaPuestoOrgId, nombreCategoria: result.nombreCategoria, ingresoBrutoMensual: result.ingresoBrutoMensual }), 'Categoría de puesto orgánico creada exitosamente');
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.DuplicateCategoriaPuestoOrgError ||
                            error_1 instanceof errors_js_1.InvalidCategoriaPuestoOrgDataError ||
                            error_1 instanceof errors_js_1.InvalidOrgHierarchyError ||
                            error_1 instanceof errors_js_1.InvalidNivelError ||
                            error_1 instanceof errors_js_1.InvalidIngresoBrutoError ||
                            error_1 instanceof errors_js_1.InvalidVigenciaDatesError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al crear categoría de puesto orgánico');
                        throw new errors_js_1.CategoriaPuestoOrgRegistrationError('Error al crear categoría de puesto orgánico', {
                            originalError: error_1.message,
                            data: data
                        });
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CreateCategoriaPuestoOrgCommand.prototype.validateInput = function (data) {
        // Validar nivel
        if (data.nivel === undefined || data.nivel === null || typeof data.nivel !== 'number' || data.nivel < 0 || data.nivel > 3) {
            throw new errors_js_1.InvalidNivelError(data.nivel || 0);
        }
        // Validar org0
        if (!data.org0 || typeof data.org0 !== 'string' || data.org0.trim().length !== 2) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org0', 'Debe ser una cadena de exactamente 2 caracteres');
        }
        // Validar formato de org0 (solo letras mayúsculas y números)
        if (!/^[A-Z0-9]{2}$/.test(data.org0)) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org0', 'Debe contener solo letras mayúsculas y números');
        }
        // Validar org1
        if (!data.org1 || typeof data.org1 !== 'string' || data.org1.trim().length !== 2) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org1', 'Debe ser una cadena de exactamente 2 caracteres');
        }
        // Validar formato de org1
        if (!/^[A-Z0-9]{2}$/.test(data.org1)) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org1', 'Debe contener solo letras mayúsculas y números');
        }
        // Validar org2 para niveles >= 2
        if (data.nivel >= 2) {
            if (!data.org2 || typeof data.org2 !== 'string' || data.org2.trim().length !== 2) {
                throw new errors_js_1.InvalidOrgHierarchyError("org2 es requerido para nivel ".concat(data.nivel));
            }
            if (!/^[A-Z0-9]{2}$/.test(data.org2)) {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org2', 'Debe contener solo letras mayúsculas y números');
            }
        }
        // Validar org3 para niveles >= 3
        if (data.nivel >= 3) {
            if (!data.org3 || typeof data.org3 !== 'string' || data.org3.trim().length !== 2) {
                throw new errors_js_1.InvalidOrgHierarchyError("org3 es requerido para nivel ".concat(data.nivel));
            }
            if (!/^[A-Z0-9]{2}$/.test(data.org3)) {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('org3', 'Debe contener solo letras mayúsculas y números');
            }
        }
        // Validar categoria
        if (!data.categoria || typeof data.categoria !== 'string' || data.categoria.trim().length === 0) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('categoria', 'Es requerida y debe ser una cadena no vacía');
        }
        if (data.categoria.length > 10) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('categoria', 'No debe exceder 10 caracteres');
        }
        // Validar nombreCategoria
        if (!data.nombreCategoria || typeof data.nombreCategoria !== 'string' || data.nombreCategoria.trim().length === 0) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'Es requerido y debe ser una cadena no vacía');
        }
        if (data.nombreCategoria.length > 80) {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('nombreCategoria', 'No debe exceder 80 caracteres');
        }
        // Validar ingresoBrutoMensual
        if (data.ingresoBrutoMensual === undefined || data.ingresoBrutoMensual === null || typeof data.ingresoBrutoMensual !== 'number' || data.ingresoBrutoMensual <= 0) {
            throw new errors_js_1.InvalidIngresoBrutoError(data.ingresoBrutoMensual || 0);
        }
        // Validar vigenciaInicio
        if (!data.vigenciaInicio || typeof data.vigenciaInicio !== 'string') {
            throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('vigenciaInicio', 'Es requerida y debe ser una cadena');
        }
        // Validar formato de fecha (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.vigenciaInicio)) {
            throw new errors_js_1.InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
        }
        // Validar que la fecha sea válida
        var vigenciaInicioDate = new Date(data.vigenciaInicio + 'T00:00:00.000Z');
        if (isNaN(vigenciaInicioDate.getTime())) {
            throw new errors_js_1.InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
        }
        // Validar vigenciaFin si está presente
        if (data.vigenciaFin) {
            if (typeof data.vigenciaFin !== 'string') {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('vigenciaFin', 'Debe ser una cadena');
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(data.vigenciaFin)) {
                throw new errors_js_1.InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
            }
            var vigenciaFinDate = new Date(data.vigenciaFin + 'T23:59:59.999Z');
            if (isNaN(vigenciaFinDate.getTime())) {
                throw new errors_js_1.InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
            }
            if (vigenciaInicioDate >= vigenciaFinDate) {
                throw new errors_js_1.InvalidVigenciaDatesError(data.vigenciaInicio, data.vigenciaFin);
            }
        }
        // Validar baseConfianza si está presente
        if (data.baseConfianza !== undefined && data.baseConfianza !== null) {
            if (typeof data.baseConfianza !== 'string') {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('baseConfianza', 'Debe ser una cadena de texto');
            }
            if (data.baseConfianza.length !== 1) {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('baseConfianza', 'Debe ser exactamente 1 carácter');
            }
        }
        // Validar porcentaje si está presente
        if (data.porcentaje !== undefined && data.porcentaje !== null) {
            if (typeof data.porcentaje !== 'number') {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('porcentaje', 'Debe ser un número');
            }
            if (!Number.isInteger(data.porcentaje) || data.porcentaje < 0 || data.porcentaje > 100) {
                throw new errors_js_1.InvalidCategoriaPuestoOrgDataError('porcentaje', 'Debe ser un entero entre 0 y 100');
            }
        }
    };
    CreateCategoriaPuestoOrgCommand.prototype.checkForDuplicates = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var filters, existing, duplicate, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        filters = {
                            nivel: data.nivel,
                            org0: data.org0,
                            org1: data.org1,
                            org2: data.org2 || undefined,
                            org3: data.org3 || undefined
                        };
                        return [4 /*yield*/, this.categoriaPuestoOrgRepo.findAll(filters)];
                    case 1:
                        existing = _a.sent();
                        duplicate = existing.find(function (cat) { return cat.categoria === data.categoria; });
                        if (duplicate) {
                            throw new errors_js_1.DuplicateCategoriaPuestoOrgError(data.categoria, data.org0, data.org1);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        if (error_2 instanceof errors_js_1.DuplicateCategoriaPuestoOrgError) {
                            throw error_2;
                        }
                        // Si hay error de conexión o similar, continuar (mejor fallar en la creación que prevenirla)
                        logger.warn({
                            operation: 'checkForDuplicates',
                            categoria: data.categoria,
                            org0: data.org0,
                            org1: data.org1,
                            error: error_2.message
                        }, 'No se pudo verificar duplicados, continuando con la creación');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CreateCategoriaPuestoOrgCommand;
}());
exports.CreateCategoriaPuestoOrgCommand = CreateCategoriaPuestoOrgCommand;
