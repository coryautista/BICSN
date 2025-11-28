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
exports.GetLogContentQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'getLogContentQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetLogContentQuery = /** @class */ (function () {
    function GetLogContentQuery(logRepo) {
        this.logRepo = logRepo;
    }
    GetLogContentQuery.prototype.execute = function (input, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        logger.info({
                            operation: 'getLogContent',
                            fileName: input.fileName,
                            lines: input.lines,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Consultando contenido de archivo de log');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.logRepo.getContent(input.fileName, input.lines)];
                    case 1:
                        result = _e.sent();
                        // Verificar si el archivo existe
                        if (!result.content && result.totalLines === 0) {
                            logger.warn({
                                operation: 'getLogContent',
                                fileName: input.fileName,
                                lines: input.lines,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Archivo de log no encontrado');
                            throw new errors_js_1.LogFileNotFoundError(input.fileName);
                        }
                        logger.info({
                            operation: 'getLogContent',
                            fileName: input.fileName,
                            lines: input.lines,
                            totalLines: result.totalLines,
                            hasMore: result.hasMore,
                            contentLength: result.content.length,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Contenido de log obtenido exitosamente');
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _e.sent();
                        if (error_1 instanceof errors_js_1.LogFileNotFoundError) {
                            throw error_1;
                        }
                        // Manejar errores específicos del sistema de archivos
                        if ((_a = error_1.message) === null || _a === void 0 ? void 0 : _a.includes('ENOENT')) {
                            logger.error({
                                operation: 'getLogContent',
                                error: error_1.message,
                                fileName: input.fileName,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Archivo de log no encontrado en el sistema de archivos');
                            throw new errors_js_1.LogFileNotFoundError(input.fileName);
                        }
                        if (((_b = error_1.message) === null || _b === void 0 ? void 0 : _b.includes('EACCES')) || ((_c = error_1.message) === null || _c === void 0 ? void 0 : _c.includes('EPERM'))) {
                            logger.error({
                                operation: 'getLogContent',
                                error: error_1.message,
                                fileName: input.fileName,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Error de permisos al leer archivo de log');
                            throw new errors_js_1.LogPermissionError('read', input.fileName);
                        }
                        if ((_d = error_1.message) === null || _d === void 0 ? void 0 : _d.includes('ENOTDIR')) {
                            logger.error({
                                operation: 'getLogContent',
                                error: error_1.message,
                                fileName: input.fileName,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Error del sistema de archivos al acceder al directorio de logs');
                            throw new errors_js_1.LogFileSystemError('read', input.fileName, error_1);
                        }
                        logger.error({
                            operation: 'getLogContent',
                            error: error_1.message,
                            fileName: input.fileName,
                            lines: input.lines,
                            userId: _userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al consultar contenido de log');
                        throw new errors_js_1.LogContentError(input.fileName, error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GetLogContentQuery.prototype.validateInput = function (input) {
        // Validar fileName
        if (!input.fileName || typeof input.fileName !== 'string' || input.fileName.trim().length === 0) {
            throw new Error('LOG_INVALID_FILENAME: El nombre del archivo es requerido y no puede estar vacío');
        }
        var fileName = input.fileName.trim();
        // Validar caracteres peligrosos en el nombre del archivo
        var dangerousChars = /[<>:"|?*\x00-\x1f]/;
        if (dangerousChars.test(fileName)) {
            throw new Error("LOG_INVALID_FILENAME: El nombre del archivo contiene caracteres no v\u00E1lidos: ".concat(fileName));
        }
        // Validar extensión del archivo (debe ser .log)
        if (!fileName.endsWith('.log')) {
            throw new Error("LOG_INVALID_FILENAME: El archivo debe tener extensi\u00F3n .log: ".concat(fileName));
        }
        // Validar longitud del nombre
        if (fileName.length > 255) {
            throw new Error("LOG_INVALID_FILENAME: El nombre del archivo es demasiado largo: ".concat(fileName));
        }
        // Validar lines
        if (!Number.isInteger(input.lines) || input.lines <= 0) {
            throw new Error("LOG_INVALID_LINES: El n\u00FAmero de l\u00EDneas debe ser un entero positivo: ".concat(input.lines));
        }
        if (input.lines > 10000) {
            throw new Error("LOG_INVALID_LINES: El n\u00FAmero m\u00E1ximo de l\u00EDneas es 10000: ".concat(input.lines));
        }
    };
    return GetLogContentQuery;
}());
exports.GetLogContentQuery = GetLogContentQuery;
