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
exports.CreateExpedienteArchivoCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createExpedienteArchivoCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var MIME_TYPES_PERMITIDOS = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
];
var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
var CreateExpedienteArchivoCommand = /** @class */ (function () {
    function CreateExpedienteArchivoCommand(expedienteArchivoRepo) {
        this.expedienteArchivoRepo = expedienteArchivoRepo;
    }
    CreateExpedienteArchivoCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, expedienteArchivo, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones de entrada
                        this.validateInput(data);
                        logContext = {
                            operation: 'createExpedienteArchivo',
                            curp: data.curp,
                            titulo: data.titulo,
                            fileName: data.fileName,
                            mimeType: data.mimeType,
                            byteSize: data.byteSize,
                            tipoCodigo: data.tipoCodigo,
                            userId: userId
                        };
                        logger.info(logContext, 'Creando archivo de expediente');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.expedienteArchivoRepo.create(data, userId)];
                    case 2:
                        expedienteArchivo = _a.sent();
                        logger.info(__assign(__assign({}, logContext), { archivoId: expedienteArchivo.archivoId, created: true }), 'Archivo de expediente creado exitosamente');
                        return [2 /*return*/, expedienteArchivo];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.ExpedienteArchivoNotFoundError ||
                            error_1 instanceof errors_js_1.InvalidExpedienteArchivoDataError ||
                            error_1 instanceof errors_js_1.InvalidCURPError ||
                            error_1 instanceof errors_js_1.DuplicateExpedienteArchivoError ||
                            error_1 instanceof errors_js_1.FileTooLargeError ||
                            error_1 instanceof errors_js_1.InvalidMimeTypeError ||
                            error_1 instanceof errors_js_1.InvalidFileNameError) {
                            throw error_1;
                        }
                        logger.error(__assign(__assign({}, logContext), { error: error_1.message, stack: error_1.stack }), 'Error al crear archivo de expediente');
                        throw new errors_js_1.ExpedienteArchivoCommandError('creación', {
                            originalError: error_1.message,
                            curp: data.curp,
                            fileName: data.fileName,
                            userId: userId
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CreateExpedienteArchivoCommand.prototype.validateInput = function (data) {
        // Validar CURP
        if (!data.curp || typeof data.curp !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('curp', 'Es requerida y debe ser una cadena de texto');
        }
        // Validar formato de CURP (18 caracteres alfanuméricos)
        var curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
        if (!curpRegex.test(data.curp)) {
            throw new errors_js_1.InvalidCURPError(data.curp);
        }
        // Validar titulo
        if (!data.titulo || typeof data.titulo !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('titulo', 'Es requerido y debe ser una cadena de texto');
        }
        if (data.titulo.length < 3 || data.titulo.length > 200) {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('titulo', 'Debe tener entre 3 y 200 caracteres');
        }
        // Validar fileName
        if (!data.fileName || typeof data.fileName !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('fileName', 'Es requerido y debe ser una cadena de texto');
        }
        // Validar caracteres del nombre de archivo
        var fileNameRegex = /^[a-zA-Z0-9._\-\s]+$/;
        if (!fileNameRegex.test(data.fileName)) {
            throw new errors_js_1.InvalidFileNameError(data.fileName);
        }
        if (data.fileName.length < 1 || data.fileName.length > 255) {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('fileName', 'Debe tener entre 1 y 255 caracteres');
        }
        // Validar mimeType
        if (!data.mimeType || typeof data.mimeType !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('mimeType', 'Es requerido y debe ser una cadena de texto');
        }
        if (!MIME_TYPES_PERMITIDOS.includes(data.mimeType)) {
            throw new errors_js_1.InvalidMimeTypeError(data.mimeType, MIME_TYPES_PERMITIDOS);
        }
        // Validar byteSize
        if (typeof data.byteSize !== 'number' || data.byteSize <= 0) {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('byteSize', 'Es requerido y debe ser un número positivo');
        }
        if (data.byteSize > MAX_FILE_SIZE) {
            throw new errors_js_1.FileTooLargeError(MAX_FILE_SIZE, data.byteSize);
        }
        // Validar sha256Hex si se proporciona
        if (data.sha256Hex !== null && data.sha256Hex !== undefined) {
            if (typeof data.sha256Hex !== 'string') {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser una cadena de texto o null');
            }
            // SHA256 hex should be 64 characters
            if (data.sha256Hex.length !== 64 || !/^[a-f0-9]{64}$/i.test(data.sha256Hex)) {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser un hash SHA256 válido de 64 caracteres hexadecimales');
            }
        }
        // Validar storageProvider
        if (!data.storageProvider || typeof data.storageProvider !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('storageProvider', 'Es requerido y debe ser una cadena de texto');
        }
        if (data.storageProvider.length < 1 || data.storageProvider.length > 50) {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('storageProvider', 'Debe tener entre 1 y 50 caracteres');
        }
        // Validar storagePath
        if (!data.storagePath || typeof data.storagePath !== 'string') {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('storagePath', 'Es requerido y debe ser una cadena de texto');
        }
        if (data.storagePath.length < 1 || data.storagePath.length > 500) {
            throw new errors_js_1.InvalidExpedienteArchivoDataError('storagePath', 'Debe tener entre 1 y 500 caracteres');
        }
        // Validar tipoCodigo si se proporciona
        if (data.tipoCodigo !== null && data.tipoCodigo !== undefined) {
            if (typeof data.tipoCodigo !== 'string') {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe ser una cadena de texto o null');
            }
            if (data.tipoCodigo.length < 1 || data.tipoCodigo.length > 10) {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe tener entre 1 y 10 caracteres');
            }
        }
        // Validar observaciones si se proporciona
        if (data.observaciones !== null && data.observaciones !== undefined) {
            if (typeof data.observaciones !== 'string') {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('observaciones', 'Debe ser una cadena de texto o null');
            }
            if (data.observaciones.length > 1000) {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('observaciones', 'No debe exceder 1000 caracteres');
            }
        }
        // Validar documentTypeId si se proporciona
        if (data.documentTypeId !== null && data.documentTypeId !== undefined) {
            if (typeof data.documentTypeId !== 'number' || data.documentTypeId <= 0) {
                throw new errors_js_1.InvalidExpedienteArchivoDataError('documentTypeId', 'Debe ser un número positivo o null');
            }
        }
    };
    return CreateExpedienteArchivoCommand;
}());
exports.CreateExpedienteArchivoCommand = CreateExpedienteArchivoCommand;
