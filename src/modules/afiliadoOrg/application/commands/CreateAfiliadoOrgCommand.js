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
exports.CreateAfiliadoOrgCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createAfiliadoOrgCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateAfiliadoOrgCommand = /** @class */ (function () {
    function CreateAfiliadoOrgCommand(afiliadoOrgRepo) {
        this.afiliadoOrgRepo = afiliadoOrgRepo;
    }
    CreateAfiliadoOrgCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'createAfiliadoOrg',
                            afiliadoId: data.afiliadoId,
                            claveOrganica0: data.claveOrganica0,
                            claveOrganica1: data.claveOrganica1,
                            claveOrganica2: data.claveOrganica2,
                            claveOrganica3: data.claveOrganica3,
                            sueldo: data.sueldo,
                            activo: data.activo
                        };
                        logger.info(logContext, 'Iniciando creación de relación afiliado-org');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afiliadoOrgRepo.create(data)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { afiliadoOrgId: result.id }), 'Relación afiliado-org creada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.InvalidAfiliadoOrgDataError ||
                            error_1 instanceof errors_js_1.InvalidOrgLevelError ||
                            error_1 instanceof errors_js_1.InvalidSueldoError ||
                            error_1 instanceof errors_js_1.InvalidOrgHierarchyError ||
                            error_1 instanceof errors_js_1.InvalidFechaMovAltError ||
                            error_1 instanceof errors_js_1.InvalidOrgClaveError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al crear relación afiliado-org');
                        throw new errors_js_1.AfiliadoOrgRegistrationError('Error interno al crear relación afiliado-org', {
                            originalError: error_1.message,
                            afiliadoId: data.afiliadoId
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CreateAfiliadoOrgCommand.prototype.validateInput = function (data) {
        var _a;
        // Validar campos requeridos
        if (!data.afiliadoId || data.afiliadoId <= 0) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('afiliadoId', 'El ID del afiliado es requerido y debe ser positivo');
        }
        if (!((_a = data.claveOrganica0) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('claveOrganica0', 'La clave orgánica 0 es requerida');
        }
        // Validar jerarquía organizacional
        this.validateOrgHierarchy(data);
        // Validar sueldo si está presente
        if (data.sueldo !== null && data.sueldo !== undefined && data.sueldo < 0) {
            throw new errors_js_1.InvalidSueldoError(data.sueldo);
        }
        // Validar otras prestaciones si están presentes
        if (data.otrasPrestaciones !== null && data.otrasPrestaciones !== undefined && data.otrasPrestaciones < 0) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('otrasPrestaciones', 'Las otras prestaciones no pueden ser negativas');
        }
        // Validar quinquenios si están presentes
        if (data.quinquenios !== null && data.quinquenios !== undefined && data.quinquenios < 0) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('quinquenios', 'Los quinquenios no pueden ser negativos');
        }
        // Validar fecha de movimiento/alta si está presente
        if (data.fechaMovAlt) {
            this.validateFechaMovAlt(data.fechaMovAlt);
        }
        // Validar porcentaje si está presente
        if (data.porcentaje !== null && data.porcentaje !== undefined && (data.porcentaje < 0 || data.porcentaje > 100)) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('porcentaje', 'El porcentaje debe estar entre 0 y 100');
        }
    };
    CreateAfiliadoOrgCommand.prototype.validateOrgHierarchy = function (data) {
        var _a, _b, _c;
        // Validar que las claves orgánicas tengan el formato correcto (2 caracteres)
        if (data.claveOrganica0 && data.claveOrganica0.length !== 2) {
            throw new errors_js_1.InvalidOrgClaveError(data.claveOrganica0, 0);
        }
        if (data.claveOrganica1 && data.claveOrganica1.length !== 2) {
            throw new errors_js_1.InvalidOrgClaveError(data.claveOrganica1, 1);
        }
        if (data.claveOrganica2 && data.claveOrganica2.length !== 2) {
            throw new errors_js_1.InvalidOrgClaveError(data.claveOrganica2, 2);
        }
        if (data.claveOrganica3 && data.claveOrganica3.length !== 2) {
            throw new errors_js_1.InvalidOrgClaveError(data.claveOrganica3, 3);
        }
        // Validar consistencia de jerarquía
        var hasNivel1 = data.nivel1Id !== null && data.nivel1Id !== undefined;
        var hasClave1 = (_a = data.claveOrganica1) === null || _a === void 0 ? void 0 : _a.trim();
        if (hasNivel1 && !hasClave1) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se especifica nivel1Id, debe incluirse claveOrganica1');
        }
        if (!hasNivel1 && hasClave1) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se incluye claveOrganica1, debe especificarse nivel1Id');
        }
        var hasNivel2 = data.nivel2Id !== null && data.nivel2Id !== undefined;
        var hasClave2 = (_b = data.claveOrganica2) === null || _b === void 0 ? void 0 : _b.trim();
        if (hasNivel2 && !hasClave2) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se especifica nivel2Id, debe incluirse claveOrganica2');
        }
        if (!hasNivel2 && hasClave2) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se incluye claveOrganica2, debe especificarse nivel2Id');
        }
        var hasNivel3 = data.nivel3Id !== null && data.nivel3Id !== undefined;
        var hasClave3 = (_c = data.claveOrganica3) === null || _c === void 0 ? void 0 : _c.trim();
        if (hasNivel3 && !hasClave3) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se especifica nivel3Id, debe incluirse claveOrganica3');
        }
        if (!hasNivel3 && hasClave3) {
            throw new errors_js_1.InvalidOrgHierarchyError('Si se incluye claveOrganica3, debe especificarse nivel3Id');
        }
    };
    CreateAfiliadoOrgCommand.prototype.validateFechaMovAlt = function (fecha) {
        // Validar formato de fecha (YYYY-MM-DD)
        var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(fecha)) {
            throw new errors_js_1.InvalidFechaMovAltError(fecha);
        }
        // Validar que sea una fecha válida
        var date = new Date(fecha);
        if (isNaN(date.getTime())) {
            throw new errors_js_1.InvalidFechaMovAltError(fecha);
        }
        // Validar que no sea una fecha futura
        var now = new Date();
        if (date > now) {
            throw new errors_js_1.InvalidAfiliadoOrgDataError('fechaMovAlt', 'La fecha de movimiento/alta no puede ser futura');
        }
    };
    return CreateAfiliadoOrgCommand;
}());
exports.CreateAfiliadoOrgCommand = CreateAfiliadoOrgCommand;
