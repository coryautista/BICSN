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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AportacionFondoRepository = void 0;
var errors_js_1 = require("../../domain/errors.js");
var orgPersonal_repo_js_1 = require("../../../orgPersonal/orgPersonal.repo.js");
var AportacionFondoRepository = /** @class */ (function () {
    function AportacionFondoRepository() {
    }
    AportacionFondoRepository.prototype.obtenerAportacionesIndividuales = function (tipo, claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            var tiposValidos, registros, datos, resumen, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        tiposValidos = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
                        if (!tiposValidos.includes(tipo)) {
                            throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.TIPO_FONDO_INVALIDO], errors_js_1.AportacionFondoError.TIPO_FONDO_INVALIDO);
                        }
                        return [4 /*yield*/, (0, orgPersonal_repo_js_1.getOrgPersonalByClavesOrganicas)(claveOrganica0, claveOrganica1)];
                    case 1:
                        registros = _a.sent();
                        if (registros.length === 0) {
                            throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.DATOS_NO_ENCONTRADOS], errors_js_1.AportacionFondoError.DATOS_NO_ENCONTRADOS);
                        }
                        return [4 /*yield*/, this.calcularAportaciones(registros, tipo)];
                    case 2:
                        datos = _a.sent();
                        resumen = {
                            total_empleados: datos.length,
                            total_contribucion: datos.reduce(function (sum, item) { return sum + item.total; }, 0),
                            total_sueldo_base: datos.reduce(function (sum, item) { return sum + item.sueldo_base; }, 0)
                        };
                        return [2 /*return*/, {
                                tipo: tipo,
                                clave_organica_0: claveOrganica0,
                                clave_organica_1: claveOrganica1,
                                datos: datos,
                                resumen: resumen
                            }];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.AportacionFondoDomainError) {
                            throw error_1;
                        }
                        console.error('[APORTACIONES_FONDOS] Error en obtenerAportacionesIndividuales:', error_1);
                        throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.ERROR_CALCULO_APORTACION], errors_js_1.AportacionFondoError.ERROR_CALCULO_APORTACION);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AportacionFondoRepository.prototype.obtenerAportacionesCompletas = function (claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            var registros, resultado, tiposFondo, _i, tiposFondo_1, tipo, datos, resumen, resultadoTipo, error_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, (0, orgPersonal_repo_js_1.getOrgPersonalByClavesOrganicas)(claveOrganica0, claveOrganica1)];
                    case 1:
                        registros = _a.sent();
                        if (registros.length === 0) {
                            throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.DATOS_NO_ENCONTRADOS], errors_js_1.AportacionFondoError.DATOS_NO_ENCONTRADOS);
                        }
                        resultado = {
                            clave_organica_0: claveOrganica0,
                            clave_organica_1: claveOrganica1,
                            resumen_general: {
                                total_empleados: registros.length,
                                total_contribucion_general: 0,
                                total_sueldo_base_general: 0,
                                fondos_incluidos: []
                            }
                        };
                        tiposFondo = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
                        _i = 0, tiposFondo_1 = tiposFondo;
                        _a.label = 2;
                    case 2:
                        if (!(_i < tiposFondo_1.length)) return [3 /*break*/, 7];
                        tipo = tiposFondo_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.calcularAportaciones(registros, tipo)];
                    case 4:
                        datos = _a.sent();
                        resumen = {
                            total_empleados: datos.length,
                            total_contribucion: datos.reduce(function (sum, item) { return sum + item.total; }, 0),
                            total_sueldo_base: datos.reduce(function (sum, item) { return sum + item.sueldo_base; }, 0)
                        };
                        resultadoTipo = {
                            tipo: tipo,
                            clave_organica_0: claveOrganica0,
                            clave_organica_1: claveOrganica1,
                            datos: datos,
                            resumen: resumen
                        };
                        // Asignar al resultado según el tipo
                        switch (tipo) {
                            case 'ahorro':
                                resultado.ahorro = resultadoTipo;
                                break;
                            case 'vivienda':
                                resultado.vivienda = resultadoTipo;
                                break;
                            case 'prestaciones':
                                resultado.prestaciones = resultadoTipo;
                                break;
                            case 'cair':
                                resultado.cair = resultadoTipo;
                                break;
                        }
                        // Actualizar resumen general
                        resultado.resumen_general.total_contribucion_general += resumen.total_contribucion;
                        resultado.resumen_general.total_sueldo_base_general += resumen.total_sueldo_base;
                        resultado.resumen_general.fondos_incluidos.push(tipo);
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        console.warn("[APORTACIONES_FONDOS] Error calculando tipo ".concat(tipo, ":"), error_2 instanceof Error ? error_2.message : String(error_2));
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, resultado];
                    case 8:
                        error_3 = _a.sent();
                        if (error_3 instanceof errors_js_1.AportacionFondoDomainError) {
                            throw error_3;
                        }
                        console.error('[APORTACIONES_FONDOS] Error en obtenerAportacionesCompletas:', error_3);
                        throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.ERROR_CALCULO_APORTACION], errors_js_1.AportacionFondoError.ERROR_CALCULO_APORTACION);
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    AportacionFondoRepository.prototype.validarAccesoClavesOrganicas = function (userClave0, userClave1, isEntidad, claveOrganica0, claveOrganica1) {
        // Si es entidad (isEntidad = 1), usar solo las claves del token del usuario
        if (isEntidad) {
            return {
                clave0: userClave0,
                clave1: userClave1
            };
        }
        // Si no es entidad (isEntidad = 0), validar que se proporcionen las claves
        if (!claveOrganica0 || !claveOrganica1) {
            throw new errors_js_1.AportacionFondoDomainError(AportacionFondoErrorMessages[errors_js_1.AportacionFondoError.CLAVE_ORGANICA_REQUERIDA], errors_js_1.AportacionFondoError.CLAVE_ORGANICA_REQUERIDA);
        }
        return {
            clave0: claveOrganica0,
            clave1: claveOrganica1
        };
    };
    AportacionFondoRepository.prototype.calcularAportaciones = function (registros, tipo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, registros.map(function (registro) {
                        var sueldo = registro.sueldo || 0;
                        var otrasPrestaciones = registro.otras_prestaciones || 0;
                        var quinquenios = registro.quinquenios || 0;
                        // Calcular sueldo base (misma para todos los tipos)
                        var sueldoBase = ((sueldo + otrasPrestaciones + quinquenios) / 30) * 15;
                        // Calcular aportaciones según el tipo
                        var aportacion = {
                            interno: registro.interno,
                            sueldo: registro.sueldo,
                            quinquenios: registro.quinquenios,
                            otras_prestaciones: registro.otras_prestaciones,
                            sueldo_base: sueldoBase,
                            total: 0, // Initialize total
                            tipo: tipo
                        };
                        switch (tipo) {
                            case 'ahorro':
                                aportacion.afae = ((sueldo / 30) * 15) * 0.0250; // Patron contribution
                                aportacion.afaa = ((sueldo / 30) * 15) * 0.050; // Employee contribution
                                aportacion.total = (aportacion.afae || 0) + (aportacion.afaa || 0);
                                break;
                            case 'vivienda':
                                aportacion.afe = ((sueldo / 30) * 15) * 0.0175; // Patron contribution
                                aportacion.total = aportacion.afe || 0;
                                break;
                            case 'prestaciones':
                                aportacion.afpe = ((sueldoBase) * 0.2225); // Patron contribution
                                aportacion.afpa = ((sueldoBase) * 0.0450); // Employee contribution
                                aportacion.total = (aportacion.afpe || 0) + (aportacion.afpa || 0);
                                break;
                            case 'cair':
                                aportacion.afe = ((sueldo / 30) * 15) * 0.020; // Patron contribution
                                aportacion.total = aportacion.afe || 0;
                                break;
                        }
                        return aportacion;
                    })];
            });
        });
    };
    return AportacionFondoRepository;
}());
exports.AportacionFondoRepository = AportacionFondoRepository;
// Helper function for error messages (moved from errors file)
var AportacionFondoErrorMessages = (_a = {},
    _a[errors_js_1.AportacionFondoError.TIPO_FONDO_INVALIDO] = 'Tipo de fondo no válido. Opciones: ahorro, vivienda, prestaciones, cair',
    _a[errors_js_1.AportacionFondoError.CLAVE_ORGANICA_REQUERIDA] = 'Las claves orgánicas son requeridas',
    _a[errors_js_1.AportacionFondoError.USUARIO_NO_AUTORIZADO] = 'Usuario no autorizado para consultar estas claves orgánicas',
    _a[errors_js_1.AportacionFondoError.DATOS_NO_ENCONTRADOS] = 'No se encontraron datos para las claves orgánicas especificadas',
    _a[errors_js_1.AportacionFondoError.ERROR_CALCULO_APORTACION] = 'Error al calcular las aportaciones',
    _a);
