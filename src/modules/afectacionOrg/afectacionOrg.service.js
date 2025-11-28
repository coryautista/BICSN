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
exports.AfectacionOrgService = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var crypto_1 = require("crypto");
var errors_js_1 = require("./domain/errors.js");
var errors_js_2 = require("../../utils/errors.js");
var pino_1 = require("pino");
// Logger específico del módulo
var logger = (0, pino_1.default)({
    name: 'afectacionOrg-service',
    level: process.env.LOG_LEVEL || 'info'
});
var AfectacionOrgService = /** @class */ (function () {
    function AfectacionOrgService(deps) {
        this.afectacionOrgRepo = deps.afectacionOrgRepo;
        this.expedienteService = deps.expedienteService;
    }
    AfectacionOrgService.prototype.registerAfectacionOrgItem = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = {
                            operation: 'registerAfectacionOrg',
                            entidad: data.entidad,
                            anio: data.anio,
                            quincena: data.quincena,
                            orgNivel: data.orgNivel,
                            usuario: data.usuario
                        };
                        logger.info(logContext, 'Registrando afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Validaciones de negocio
                        if (data.quincena < 1 || data.quincena > 24) {
                            logger.warn(__assign(__assign({}, logContext), { quincena: data.quincena }), 'Valor de quincena inválido');
                            throw new errors_js_1.InvalidQuincenaError(data.quincena);
                        }
                        if (data.anio < 2000 || data.anio > 2100) {
                            logger.warn(__assign(__assign({}, logContext), { anio: data.anio }), 'Valor de año inválido');
                            throw new errors_js_1.InvalidAnioError(data.anio);
                        }
                        if (data.orgNivel < 0 || data.orgNivel > 3) {
                            logger.warn(__assign(__assign({}, logContext), { orgNivel: data.orgNivel }), 'Valor de orgNivel inválido');
                            throw new errors_js_1.InvalidOrgNivelError(data.orgNivel);
                        }
                        // Validación de jerarquía organizacional
                        this.validateOrgHierarchy(data.orgNivel, data.org0, data.org1, data.org2, data.org3);
                        return [4 /*yield*/, this.afectacionOrgRepo.registerAfectacionOrg(data)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { success: true }), 'Afectación registrada exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Failed to register afectación');
                        // Re-throw domain errors as-is
                        if (error_1 instanceof errors_js_1.InvalidQuincenaError ||
                            error_1 instanceof errors_js_1.InvalidAnioError ||
                            error_1 instanceof errors_js_1.InvalidOrgNivelError ||
                            error_1 instanceof errors_js_1.OrgHierarchyValidationError) {
                            throw error_1;
                        }
                        // Wrap database/unknown errors
                        throw new errors_js_1.AfectacionRegistrationError(error_1.message, { originalError: error_1.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Helper function to validate org hierarchy
    AfectacionOrgService.prototype.validateOrgHierarchy = function (orgNivel, org0, org1, org2, org3) {
        // org0 is always required
        if (!org0 || org0.length !== 2) {
            throw new errors_js_1.OrgHierarchyValidationError('org0 is required and must be 2 characters', { org0: org0 });
        }
        // If orgNivel >= 1, org1 is required
        if (orgNivel >= 1 && (!org1 || org1.length !== 2)) {
            throw new errors_js_1.OrgHierarchyValidationError('org1 is required when orgNivel >= 1', { orgNivel: orgNivel, org1: org1 });
        }
        // If orgNivel >= 2, org2 is required
        if (orgNivel >= 2 && (!org2 || org2.length !== 2)) {
            throw new errors_js_1.OrgHierarchyValidationError('org2 is required when orgNivel >= 2', { orgNivel: orgNivel, org2: org2 });
        }
        // If orgNivel >= 3, org3 is required
        if (orgNivel >= 3 && (!org3 || org3.length !== 2)) {
            throw new errors_js_1.OrgHierarchyValidationError('org3 is required when orgNivel >= 3', { orgNivel: orgNivel, org3: org3 });
        }
    };
    AfectacionOrgService.prototype.getEstadosAfectacionFiltered = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getEstadosAfectacion', filters: filters };
                        logger.info(logContext, 'Consultando estados de afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getEstadosAfectacion(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultCount: (result === null || result === void 0 ? void 0 : result.length) || 0 }), 'Estados obtenidos exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_2.message }), 'Error al obtener estados');
                        throw new errors_js_1.AfectacionQueryError('getEstadosAfectacion', { filters: filters, error: error_2.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AfectacionOrgService.prototype.getProgresoUsuarioFiltered = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getProgresoUsuario', filters: filters };
                        logger.info(logContext, 'Consultando progreso de usuario');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getProgresoUsuario(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultCount: (result === null || result === void 0 ? void 0 : result.length) || 0 }), 'Progreso obtenido exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_3.message }), 'Error al obtener progreso de usuario');
                        throw new errors_js_1.AfectacionQueryError('getProgresoUsuario', { filters: filters, error: error_3.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AfectacionOrgService.prototype.getBitacoraAfectacionFiltered = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getBitacoraAfectacion', filters: filters };
                        logger.info(logContext, 'Consultando bitácora de afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getBitacoraAfectacion(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultCount: (result === null || result === void 0 ? void 0 : result.length) || 0 }), 'Bitácora obtenida exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_4 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_4.message }), 'Error al obtener bitácora');
                        throw new errors_js_1.AfectacionQueryError('getBitacoraAfectacion', { filters: filters, error: error_4.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AfectacionOrgService.prototype.getTableroAfectacionesFiltered = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getTableroAfectaciones', filters: filters };
                        logger.info(logContext, 'Consultando tablero de afectaciones');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getTableroAfectaciones(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { resultCount: (result === null || result === void 0 ? void 0 : result.length) || 0 }), 'Tablero obtenido exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_5 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_5.message }), 'Error al obtener tablero');
                        throw new errors_js_1.AfectacionQueryError('getTableroAfectaciones', { filters: filters, error: error_5.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AfectacionOrgService.prototype.getUltimaAfectacionFiltered = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getUltimaAfectacion', filters: filters };
                        logger.info(logContext, 'Consultando última afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getUltimaAfectacion(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { found: !!result }), 'Última afectación obtenida exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_6 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_6.message }), 'Error al obtener última afectación');
                        throw new errors_js_1.AfectacionQueryError('getUltimaAfectacion', { filters: filters, error: error_6.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Calculate SHA256 hash of file
    AfectacionOrgService.prototype.calculateSha256 = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var hash = crypto_1.default.createHash('sha256');
                        var stream = fs_1.default.createReadStream(filePath);
                        stream.on('data', function (data) { return hash.update(data); });
                        stream.on('end', function () { return resolve(hash.digest('hex')); });
                        stream.on('error', reject);
                    })];
            });
        });
    };
    AfectacionOrgService.prototype.uploadDocumentToExpediente = function (curp, fileData, titulo, userId, tipoCodigo, observaciones, documentTypeId) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, mockReq, withDbContext;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = {
                            operation: 'uploadDocumentToExpediente',
                            curp: curp,
                            titulo: titulo,
                            userId: userId,
                            filename: fileData.filename,
                            mimetype: fileData.mimetype
                        };
                        logger.info(logContext, 'Subiendo documento al expediente');
                        mockReq = {
                            user: { sub: userId },
                            ip: '127.0.0.1'
                        };
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../../db/context.js'); })];
                    case 1:
                        withDbContext = (_a.sent()).withDbContext;
                        return [4 /*yield*/, withDbContext(mockReq, function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var tempFilePath, tempDir, buffer, sha256Hex, archivo, error_7;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            tempFilePath = null;
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 5, , 6]);
                                            tempDir = path_1.default.join(process.cwd(), 'temp');
                                            if (!fs_1.default.existsSync(tempDir)) {
                                                fs_1.default.mkdirSync(tempDir, { recursive: true });
                                            }
                                            tempFilePath = path_1.default.join(tempDir, "upload_".concat(Date.now(), "_").concat(fileData.filename));
                                            return [4 /*yield*/, fileData.toBuffer()];
                                        case 2:
                                            buffer = _a.sent();
                                            fs_1.default.writeFileSync(tempFilePath, buffer);
                                            logger.debug(__assign(__assign({}, logContext), { tempFilePath: tempFilePath, size: buffer.length }), 'Archivo temporal creado');
                                            return [4 /*yield*/, this.calculateSha256(tempFilePath)];
                                        case 3:
                                            sha256Hex = _a.sent();
                                            logger.debug(__assign(__assign({}, logContext), { sha256: sha256Hex }), 'SHA256 calculado');
                                            return [4 /*yield*/, this.expedienteService.createExpedienteArchivoItem(curp, tipoCodigo || null, titulo, fileData.filename, fileData.mimetype, buffer.length, sha256Hex, 'local', tempFilePath, observaciones || null, documentTypeId || null, userId, tx)];
                                        case 4:
                                            archivo = _a.sent();
                                            logger.info(__assign(__assign({}, logContext), { archivoId: archivo.archivoId }), 'Documento subido exitosamente');
                                            // 4. Cleanup temp file
                                            if (tempFilePath) {
                                                try {
                                                    fs_1.default.unlinkSync(tempFilePath);
                                                    logger.debug(__assign(__assign({}, logContext), { tempFilePath: tempFilePath }), 'Archivo temporal limpiado');
                                                }
                                                catch (cleanupError) {
                                                    logger.warn(__assign(__assign({}, logContext), { tempFilePath: tempFilePath, error: cleanupError.message }), 'Error al limpiar archivo temporal');
                                                }
                                            }
                                            return [2 /*return*/, {
                                                    archivoId: archivo.archivoId,
                                                    success: true,
                                                    message: 'Documento subido exitosamente'
                                                }];
                                        case 5:
                                            error_7 = _a.sent();
                                            logger.error(__assign(__assign({}, logContext), { error: error_7.message, stack: error_7.stack }), 'Error al subir documento');
                                            // Cleanup temp file on error
                                            if (tempFilePath) {
                                                try {
                                                    fs_1.default.unlinkSync(tempFilePath);
                                                }
                                                catch (cleanupError) {
                                                    logger.warn({ tempFilePath: tempFilePath }, 'Error al limpiar archivo temporal después del error');
                                                }
                                            }
                                            throw new errors_js_2.DatabaseError('Error al subir documento al expediente', {
                                                curp: curp,
                                                originalError: error_7.message
                                            });
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AfectacionOrgService.prototype.calculateQuincenaFromDate = function (fecha) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, date, year, month, day, quincenaInMonth, monthQuincenaStart, quincena, result;
            return __generator(this, function (_a) {
                logContext = { operation: 'calculateQuincenaFromDate', fecha: fecha };
                logger.info(logContext, 'Calculando quincena desde fecha');
                try {
                    date = new Date(fecha);
                    // Validar fecha válida
                    if (isNaN(date.getTime())) {
                        logger.warn(__assign({}, logContext), 'Formato de fecha inválido');
                        throw new errors_js_1.InvalidDateForQuincenaError(fecha);
                    }
                    year = date.getFullYear();
                    month = date.getMonth();
                    day = date.getDate();
                    quincenaInMonth = day <= 14 ? 1 : 2;
                    monthQuincenaStart = (month * 2) + 1;
                    quincena = monthQuincenaStart + (quincenaInMonth - 1);
                    result = {
                        fecha: fecha,
                        anio: year,
                        mes: month + 1,
                        dia: day,
                        quincena: quincena,
                        quincenaEnMes: quincenaInMonth,
                        descripcion: "Quincena ".concat(quincena, " del a\u00F1o ").concat(year, " (").concat(day <= 14 ? '1-14' : '15+', " de ").concat(date.toLocaleString('es-MX', { month: 'long' }), ")")
                    };
                    logger.info(__assign(__assign({}, logContext), { result: result }), 'Quincena calculada exitosamente');
                    return [2 /*return*/, result];
                }
                catch (error) {
                    logger.error(__assign(__assign({}, logContext), { error: error.message }), 'Error al calcular quincena');
                    if (error instanceof errors_js_1.InvalidDateForQuincenaError) {
                        throw error;
                    }
                    throw new errors_js_1.InvalidDateForQuincenaError(fecha);
                }
                return [2 /*return*/];
            });
        });
    };
    AfectacionOrgService.prototype.getQuincenaAltaAfectacionService = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = { operation: 'getQuincenaAltaAfectacion', filters: filters };
                        logger.info(logContext, 'Consultando quincena alta de afectación');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.afectacionOrgRepo.getQuincenaAltaAfectacion(filters)];
                    case 2:
                        result = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { found: !!result }), 'Quincena alta obtenida exitosamente');
                        return [2 /*return*/, result];
                    case 3:
                        error_8 = _a.sent();
                        logger.error(__assign(__assign({}, logContext), { error: error_8.message }), 'Error al obtener quincena alta');
                        throw new errors_js_1.AfectacionQueryError('getQuincenaAltaAfectacion', { filters: filters, error: error_8.message });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AfectacionOrgService;
}());
exports.AfectacionOrgService = AfectacionOrgService;
