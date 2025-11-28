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
exports.SearchCallesQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
// Logger básico para queries
var logger = {
    info: function (message, data) { return console.log("[INFO] ".concat(message), data ? JSON.stringify(data) : ''); },
    warn: function (message, data) { return console.warn("[WARN] ".concat(message), data ? JSON.stringify(data) : ''); },
    error: function (message, data) { return console.error("[ERROR] ".concat(message), data ? JSON.stringify(data) : ''); },
    debug: function (message, data) { return console.debug("[DEBUG] ".concat(message), data ? JSON.stringify(data) : ''); }
};
var SearchCallesQuery = /** @class */ (function () {
    function SearchCallesQuery(calleRepo) {
        this.calleRepo = calleRepo;
    }
    SearchCallesQuery.prototype.execute = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var validationErrors, validatedFilters, municipioIdStr, coloniaIdStr, maxLimit, limitStr, limit, offsetStr, calles, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger.debug('Ejecutando búsqueda de calles con filtros', filters);
                        validationErrors = [];
                        validatedFilters = __assign({}, filters);
                        // Validar estadoId
                        if (filters.estadoId !== undefined) {
                            if (typeof filters.estadoId !== 'string' || filters.estadoId.length !== 2) {
                                validationErrors.push('estadoId debe ser una cadena de 2 caracteres');
                            }
                            else {
                                validatedFilters.estadoId = filters.estadoId;
                            }
                        }
                        // Validar municipioId
                        if (filters.municipioId !== undefined) {
                            municipioIdStr = filters.municipioId.toString();
                            if (!/^[0-9]+$/.test(municipioIdStr)) {
                                validationErrors.push('municipioId debe ser un número válido');
                            }
                            else {
                                validatedFilters.municipioId = parseInt(municipioIdStr);
                            }
                        }
                        // Validar coloniaId
                        if (filters.coloniaId !== undefined) {
                            coloniaIdStr = filters.coloniaId.toString();
                            if (!/^[0-9]+$/.test(coloniaIdStr)) {
                                validationErrors.push('coloniaId debe ser un número válido');
                            }
                            else {
                                validatedFilters.coloniaId = parseInt(coloniaIdStr);
                            }
                        }
                        // Validar codigoPostal
                        if (filters.codigoPostal !== undefined) {
                            if (typeof filters.codigoPostal !== 'string' || filters.codigoPostal.length !== 5 || !/^[0-9]{5}$/.test(filters.codigoPostal)) {
                                validationErrors.push('codigoPostal debe ser una cadena de 5 dígitos');
                            }
                            else {
                                validatedFilters.codigoPostal = filters.codigoPostal;
                            }
                        }
                        // Validar nombreCalle
                        if (filters.nombreCalle !== undefined) {
                            if (typeof filters.nombreCalle !== 'string' || filters.nombreCalle.trim().length === 0) {
                                validationErrors.push('nombreCalle debe ser una cadena no vacía');
                            }
                            else {
                                validatedFilters.nombreCalle = filters.nombreCalle.trim();
                            }
                        }
                        // Validar esValido
                        if (filters.esValido !== undefined) {
                            if (typeof filters.esValido !== 'string' || !['true', 'false'].includes(filters.esValido)) {
                                validationErrors.push('esValido debe ser "true" o "false"');
                            }
                            else {
                                validatedFilters.esValido = filters.esValido === 'true';
                            }
                        }
                        maxLimit = 1000;
                        if (filters.limit !== undefined) {
                            limitStr = filters.limit.toString();
                            if (!/^[0-9]+$/.test(limitStr)) {
                                validationErrors.push('limit debe ser un número válido');
                            }
                            else {
                                limit = parseInt(limitStr);
                                if (limit > maxLimit) {
                                    validationErrors.push("limit no puede exceder ".concat(maxLimit));
                                }
                                else {
                                    validatedFilters.limit = limit;
                                }
                            }
                        }
                        if (filters.offset !== undefined) {
                            offsetStr = filters.offset.toString();
                            if (!/^[0-9]+$/.test(offsetStr)) {
                                validationErrors.push('offset debe ser un número válido');
                            }
                            else {
                                validatedFilters.offset = parseInt(offsetStr);
                            }
                        }
                        // Si hay errores de validación, lanzarlos
                        if (validationErrors.length > 0) {
                            logger.warn('Filtros de búsqueda inválidos', {
                                filters: filters,
                                validationErrors: validationErrors
                            });
                            throw new errors_js_1.InvalidSearchFiltersError(validationErrors);
                        }
                        // Ejecutar búsqueda
                        logger.debug('Ejecutando búsqueda con filtros validados', validatedFilters);
                        return [4 /*yield*/, this.calleRepo.search(validatedFilters)];
                    case 1:
                        calles = _a.sent();
                        logger.info('Búsqueda de calles completada exitosamente', {
                            filters: validatedFilters,
                            totalResults: calles.length
                        });
                        return [2 /*return*/, calles];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.InvalidSearchFiltersError) {
                            throw error_1;
                        }
                        logger.error('Error en búsqueda de calles', {
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido',
                            filters: filters,
                            stack: error_1 instanceof Error ? error_1.stack : undefined
                        });
                        throw new errors_js_1.CalleSearchError(filters, 'Error interno en búsqueda de calles');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return SearchCallesQuery;
}());
exports.SearchCallesQuery = SearchCallesQuery;
