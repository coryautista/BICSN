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
exports.ArchiveLogsCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var path_1 = require("path");
var logger = (0, pino_1.default)({
    name: 'archiveLogsCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var ArchiveLogsCommand = /** @class */ (function () {
    function ArchiveLogsCommand(logRepo) {
        this.logRepo = logRepo;
    }
    ArchiveLogsCommand.prototype.execute = function (input, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        logger.info({
                            operation: 'archiveLogs',
                            archiveDir: input.archiveDir,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando archivado de logs');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.logRepo.archive(input.archiveDir)];
                    case 1:
                        result = _e.sent();
                        logger.info({
                            operation: 'archiveLogs',
                            archivedFiles: result.archivedFiles.length,
                            totalArchived: result.totalArchived,
                            archiveDir: input.archiveDir,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Archivado de logs completado exitosamente');
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _e.sent();
                        if (error_1 instanceof errors_js_1.InvalidLogArchiveParamsError) {
                            throw error_1;
                        }
                        // Manejar errores específicos del repositorio
                        if (((_a = error_1.message) === null || _a === void 0 ? void 0 : _a.includes('EACCES')) || ((_b = error_1.message) === null || _b === void 0 ? void 0 : _b.includes('EPERM'))) {
                            logger.error({
                                operation: 'archiveLogs',
                                error: error_1.message,
                                archiveDir: input.archiveDir,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Error de permisos en archivado de logs');
                            throw new errors_js_1.LogPermissionError('archive');
                        }
                        if (((_c = error_1.message) === null || _c === void 0 ? void 0 : _c.includes('ENOENT')) || ((_d = error_1.message) === null || _d === void 0 ? void 0 : _d.includes('ENOTDIR'))) {
                            logger.error({
                                operation: 'archiveLogs',
                                error: error_1.message,
                                archiveDir: input.archiveDir,
                                userId: _userId,
                                timestamp: new Date().toISOString()
                            }, 'Error del sistema de archivos en archivado de logs');
                            throw new errors_js_1.LogFileSystemError('archive', input.archiveDir || 'default archive directory', error_1);
                        }
                        logger.error({
                            operation: 'archiveLogs',
                            error: error_1.message,
                            archiveDir: input.archiveDir,
                            userId: _userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al archivar logs');
                        throw new errors_js_1.LogArchiveError('archive', error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ArchiveLogsCommand.prototype.validateInput = function (input) {
        // Validar archiveDir si está presente
        if (input.archiveDir) {
            // Validar que no contenga caracteres peligrosos
            var dangerousChars = /[<>:"|?*\x00-\x1f]/;
            if (dangerousChars.test(input.archiveDir)) {
                throw new errors_js_1.InvalidLogArchiveParamsError('archiveDir', input.archiveDir, 'contiene caracteres no válidos');
            }
            // Validar longitud
            if (input.archiveDir.length > 260) {
                throw new errors_js_1.InvalidLogArchiveParamsError('archiveDir', input.archiveDir, 'la ruta es demasiado larga (máximo 260 caracteres)');
            }
            // Validar que no sea una ruta absoluta peligrosa
            var resolvedPath = path_1.default.resolve(input.archiveDir);
            var rootDir = path_1.default.parse(process.cwd()).root;
            if (!resolvedPath.startsWith(rootDir)) {
                throw new errors_js_1.InvalidLogArchiveParamsError('archiveDir', input.archiveDir, 'la ruta debe estar dentro del directorio raíz del sistema');
            }
            // Validar que no intente acceder a directorios del sistema
            var systemDirs = ['/bin', '/sbin', '/boot', '/sys', '/proc', '/dev', 'C:\\Windows', 'C:\\System32'];
            for (var _i = 0, systemDirs_1 = systemDirs; _i < systemDirs_1.length; _i++) {
                var systemDir = systemDirs_1[_i];
                if (resolvedPath.toLowerCase().includes(systemDir.toLowerCase())) {
                    throw new errors_js_1.InvalidLogArchiveParamsError('archiveDir', input.archiveDir, 'no se permite acceder a directorios del sistema');
                }
            }
        }
    };
    return ArchiveLogsCommand;
}());
exports.ArchiveLogsCommand = ArchiveLogsCommand;
