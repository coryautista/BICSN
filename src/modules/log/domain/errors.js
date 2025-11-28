"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogFileSystemError = exports.LogPermissionError = exports.LogFileNotFoundError = exports.InvalidLogArchiveParamsError = exports.InvalidLogCleanupParamsError = exports.LogArchiveError = exports.LogCleanupError = exports.LogSearchError = exports.LogContentError = exports.LogStatsError = exports.LogError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio Log
 */
// Error base para el dominio Log
var LogError = /** @class */ (function (_super) {
    __extends(LogError, _super);
    function LogError(message, code, details) {
        var _this = _super.call(this, message, code, details) || this;
        _this.name = 'LogError';
        return _this;
    }
    return LogError;
}(errors_js_1.DomainError));
exports.LogError = LogError;
// Error cuando ocurre un problema con las estadísticas de logs
var LogStatsError = /** @class */ (function (_super) {
    __extends(LogStatsError, _super);
    function LogStatsError(operation, originalError) {
        var _this = _super.call(this, "Error al obtener estad\u00EDsticas de logs durante la operaci\u00F3n '".concat(operation, "'"), 'LOG_STATS_ERROR', { operation: operation, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogStatsError';
        return _this;
    }
    return LogStatsError;
}(LogError));
exports.LogStatsError = LogStatsError;
// Error cuando ocurre un problema al leer el contenido de un log
var LogContentError = /** @class */ (function (_super) {
    __extends(LogContentError, _super);
    function LogContentError(fileName, originalError) {
        var _this = _super.call(this, "Error al leer el contenido del archivo de log '".concat(fileName, "'"), 'LOG_CONTENT_ERROR', { fileName: fileName, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogContentError';
        return _this;
    }
    return LogContentError;
}(LogError));
exports.LogContentError = LogContentError;
// Error cuando ocurre un problema en la búsqueda de logs
var LogSearchError = /** @class */ (function (_super) {
    __extends(LogSearchError, _super);
    function LogSearchError(query, originalError) {
        var _this = _super.call(this, "Error al buscar en logs con la consulta '".concat(query, "'"), 'LOG_SEARCH_ERROR', { query: query, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogSearchError';
        return _this;
    }
    return LogSearchError;
}(LogError));
exports.LogSearchError = LogSearchError;
// Error cuando ocurre un problema en la limpieza de logs
var LogCleanupError = /** @class */ (function (_super) {
    __extends(LogCleanupError, _super);
    function LogCleanupError(operation, originalError) {
        var _this = _super.call(this, "Error durante la limpieza de logs en la operaci\u00F3n '".concat(operation, "'"), 'LOG_CLEANUP_ERROR', { operation: operation, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogCleanupError';
        return _this;
    }
    return LogCleanupError;
}(LogError));
exports.LogCleanupError = LogCleanupError;
// Error cuando ocurre un problema en el archivado de logs
var LogArchiveError = /** @class */ (function (_super) {
    __extends(LogArchiveError, _super);
    function LogArchiveError(operation, originalError) {
        var _this = _super.call(this, "Error durante el archivado de logs en la operaci\u00F3n '".concat(operation, "'"), 'LOG_ARCHIVE_ERROR', { operation: operation, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogArchiveError';
        return _this;
    }
    return LogArchiveError;
}(LogError));
exports.LogArchiveError = LogArchiveError;
// Error de validación para parámetros de limpieza de logs
var InvalidLogCleanupParamsError = /** @class */ (function (_super) {
    __extends(InvalidLogCleanupParamsError, _super);
    function InvalidLogCleanupParamsError(param, value, reason) {
        var _this = _super.call(this, "Par\u00E1metro de limpieza de logs inv\u00E1lido: ".concat(param, " = ").concat(value, ". ").concat(reason), 'INVALID_LOG_CLEANUP_PARAMS', { param: param, value: value, reason: reason }) || this;
        _this.name = 'InvalidLogCleanupParamsError';
        return _this;
    }
    return InvalidLogCleanupParamsError;
}(LogError));
exports.InvalidLogCleanupParamsError = InvalidLogCleanupParamsError;
// Error de validación para parámetros de archivado de logs
var InvalidLogArchiveParamsError = /** @class */ (function (_super) {
    __extends(InvalidLogArchiveParamsError, _super);
    function InvalidLogArchiveParamsError(param, value, reason) {
        var _this = _super.call(this, "Par\u00E1metro de archivado de logs inv\u00E1lido: ".concat(param, " = ").concat(value, ". ").concat(reason), 'INVALID_LOG_ARCHIVE_PARAMS', { param: param, value: value, reason: reason }) || this;
        _this.name = 'InvalidLogArchiveParamsError';
        return _this;
    }
    return InvalidLogArchiveParamsError;
}(LogError));
exports.InvalidLogArchiveParamsError = InvalidLogArchiveParamsError;
// Error cuando no se encuentra un archivo de log específico
var LogFileNotFoundError = /** @class */ (function (_super) {
    __extends(LogFileNotFoundError, _super);
    function LogFileNotFoundError(fileName) {
        var _this = _super.call(this, "Archivo de log '".concat(fileName, "' no encontrado"), 'LOG_FILE_NOT_FOUND', { fileName: fileName }) || this;
        _this.name = 'LogFileNotFoundError';
        return _this;
    }
    return LogFileNotFoundError;
}(LogError));
exports.LogFileNotFoundError = LogFileNotFoundError;
// Error cuando ocurre un problema de permisos en operaciones de log
var LogPermissionError = /** @class */ (function (_super) {
    __extends(LogPermissionError, _super);
    function LogPermissionError(operation, fileName) {
        var _this = _super.call(this, "Permisos insuficientes para la operaci\u00F3n '".concat(operation, "'").concat(fileName ? " en el archivo '".concat(fileName, "'") : ''), 'LOG_PERMISSION_ERROR', { operation: operation, fileName: fileName }) || this;
        _this.name = 'LogPermissionError';
        return _this;
    }
    return LogPermissionError;
}(LogError));
exports.LogPermissionError = LogPermissionError;
// Error cuando ocurre un problema con el sistema de archivos para logs
var LogFileSystemError = /** @class */ (function (_super) {
    __extends(LogFileSystemError, _super);
    function LogFileSystemError(operation, path, originalError) {
        var _this = _super.call(this, "Error del sistema de archivos durante '".concat(operation, "' en la ruta '").concat(path, "'"), 'LOG_FILESYSTEM_ERROR', { operation: operation, path: path, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'LogFileSystemError';
        return _this;
    }
    return LogFileSystemError;
}(LogError));
exports.LogFileSystemError = LogFileSystemError;
