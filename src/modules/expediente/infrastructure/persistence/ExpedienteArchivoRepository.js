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
exports.ExpedienteArchivoRepository = void 0;
var mssql_1 = require("mssql");
var ExpedienteArchivoRepository = /** @class */ (function () {
    function ExpedienteArchivoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    ExpedienteArchivoRepository.prototype.findById = function (archivoId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('archivoId', mssql_1.default.BigInt, archivoId)
                            .query("\n        SELECT\n          ArchivoId,\n          CURP,\n          TipoCodigo,\n          Titulo,\n          FileName,\n          MimeType,\n          ByteSize,\n          Sha256Hex,\n          StorageProvider,\n          StoragePath,\n          Observaciones,\n          CreatedBy,\n          CreatedAt,\n          UpdatedAt,\n          DocumentTypeId\n        FROM doc.ExpedienteArchivo\n        WHERE ArchivoId = @archivoId\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                archivoId: row.ArchivoId,
                                curp: row.CURP,
                                tipoCodigo: row.TipoCodigo,
                                titulo: row.Titulo,
                                fileName: row.FileName,
                                mimeType: row.MimeType,
                                byteSize: row.ByteSize,
                                sha256Hex: row.Sha256Hex,
                                storageProvider: row.StorageProvider,
                                storagePath: row.StoragePath,
                                observaciones: row.Observaciones,
                                createdBy: row.CreatedBy,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                documentTypeId: row.DocumentTypeId
                            }];
                }
            });
        });
    };
    ExpedienteArchivoRepository.prototype.findByCurp = function (curp) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('curp', mssql_1.default.Char(18), curp)
                            .query("\n        SELECT\n          ArchivoId,\n          CURP,\n          TipoCodigo,\n          Titulo,\n          FileName,\n          MimeType,\n          ByteSize,\n          Sha256Hex,\n          StorageProvider,\n          StoragePath,\n          Observaciones,\n          CreatedBy,\n          CreatedAt,\n          UpdatedAt,\n          DocumentTypeId\n        FROM doc.ExpedienteArchivo\n        WHERE CURP = @curp\n        ORDER BY CreatedAt DESC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                archivoId: row.ArchivoId,
                                curp: row.CURP,
                                tipoCodigo: row.TipoCodigo,
                                titulo: row.Titulo,
                                fileName: row.FileName,
                                mimeType: row.MimeType,
                                byteSize: row.ByteSize,
                                sha256Hex: row.Sha256Hex,
                                storageProvider: row.StorageProvider,
                                storagePath: row.StoragePath,
                                observaciones: row.Observaciones,
                                createdBy: row.CreatedBy,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                documentTypeId: row.DocumentTypeId
                            }); })];
                }
            });
        });
    };
    ExpedienteArchivoRepository.prototype.findByCurpAndSha256 = function (curp, sha256Hex) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('curp', mssql_1.default.Char(18), curp)
                            .input('sha256Hex', mssql_1.default.Char(64), sha256Hex)
                            .query("\n        SELECT\n          ArchivoId,\n          CURP,\n          TipoCodigo,\n          Titulo,\n          FileName,\n          MimeType,\n          ByteSize,\n          Sha256Hex,\n          StorageProvider,\n          StoragePath,\n          Observaciones,\n          CreatedBy,\n          CreatedAt,\n          UpdatedAt,\n          DocumentTypeId\n        FROM doc.ExpedienteArchivo\n        WHERE CURP = @curp AND Sha256Hex = @sha256Hex\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                archivoId: row.ArchivoId,
                                curp: row.CURP,
                                tipoCodigo: row.TipoCodigo,
                                titulo: row.Titulo,
                                fileName: row.FileName,
                                mimeType: row.MimeType,
                                byteSize: row.ByteSize,
                                sha256Hex: row.Sha256Hex,
                                storageProvider: row.StorageProvider,
                                storagePath: row.StoragePath,
                                observaciones: row.Observaciones,
                                createdBy: row.CreatedBy,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                documentTypeId: row.DocumentTypeId
                            }];
                }
            });
        });
    };
    ExpedienteArchivoRepository.prototype.create = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('curp', mssql_1.default.Char(18), data.curp)
                            .input('tipoCodigo', mssql_1.default.VarChar(30), data.tipoCodigo)
                            .input('titulo', mssql_1.default.NVarChar(200), data.titulo)
                            .input('fileName', mssql_1.default.NVarChar(300), data.fileName)
                            .input('mimeType', mssql_1.default.VarChar(100), data.mimeType)
                            .input('byteSize', mssql_1.default.BigInt, data.byteSize)
                            .input('sha256Hex', mssql_1.default.Char(64), data.sha256Hex)
                            .input('storageProvider', mssql_1.default.VarChar(30), data.storageProvider)
                            .input('storagePath', mssql_1.default.NVarChar(500), data.storagePath)
                            .input('observaciones', mssql_1.default.NVarChar(300), data.observaciones)
                            .input('documentTypeId', mssql_1.default.BigInt, data.documentTypeId)
                            .input('createdBy', mssql_1.default.NVarChar(100), userId !== null && userId !== void 0 ? userId : null)
                            .query("\n        INSERT INTO doc.ExpedienteArchivo (\n          CURP, TipoCodigo, Titulo, FileName, MimeType, ByteSize,\n          Sha256Hex, StorageProvider, StoragePath, Observaciones,\n          DocumentTypeId, CreatedBy\n        )\n        OUTPUT\n          INSERTED.ArchivoId,\n          INSERTED.CURP,\n          INSERTED.TipoCodigo,\n          INSERTED.Titulo,\n          INSERTED.FileName,\n          INSERTED.MimeType,\n          INSERTED.ByteSize,\n          INSERTED.Sha256Hex,\n          INSERTED.StorageProvider,\n          INSERTED.StoragePath,\n          INSERTED.Observaciones,\n          INSERTED.CreatedBy,\n          INSERTED.CreatedAt,\n          INSERTED.UpdatedAt,\n          INSERTED.DocumentTypeId\n        VALUES (\n          @curp, @tipoCodigo, @titulo, @fileName, @mimeType, @byteSize,\n          @sha256Hex, @storageProvider, @storagePath, @observaciones,\n          @documentTypeId, @createdBy\n        )\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                archivoId: row.ArchivoId,
                                curp: row.CURP,
                                tipoCodigo: row.TipoCodigo,
                                titulo: row.Titulo,
                                fileName: row.FileName,
                                mimeType: row.MimeType,
                                byteSize: row.ByteSize,
                                sha256Hex: row.Sha256Hex,
                                storageProvider: row.StorageProvider,
                                storagePath: row.StoragePath,
                                observaciones: row.Observaciones,
                                createdBy: row.CreatedBy,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                documentTypeId: row.DocumentTypeId
                            }];
                }
            });
        });
    };
    ExpedienteArchivoRepository.prototype.update = function (data, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updates, request, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findById(data.archivoId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
                        }
                        updates = [];
                        request = this.mssqlPool.request();
                        request.input('archivoId', mssql_1.default.BigInt, data.archivoId);
                        if (data.tipoCodigo !== undefined) {
                            updates.push('TipoCodigo = @tipoCodigo');
                            request.input('tipoCodigo', mssql_1.default.VarChar(30), data.tipoCodigo);
                        }
                        if (data.titulo !== undefined) {
                            updates.push('Titulo = @titulo');
                            request.input('titulo', mssql_1.default.NVarChar(200), data.titulo);
                        }
                        if (data.fileName !== undefined) {
                            updates.push('FileName = @fileName');
                            request.input('fileName', mssql_1.default.NVarChar(300), data.fileName);
                        }
                        if (data.mimeType !== undefined) {
                            updates.push('MimeType = @mimeType');
                            request.input('mimeType', mssql_1.default.VarChar(100), data.mimeType);
                        }
                        if (data.byteSize !== undefined) {
                            updates.push('ByteSize = @byteSize');
                            request.input('byteSize', mssql_1.default.BigInt, data.byteSize);
                        }
                        if (data.sha256Hex !== undefined) {
                            updates.push('Sha256Hex = @sha256Hex');
                            request.input('sha256Hex', mssql_1.default.Char(64), data.sha256Hex);
                        }
                        if (data.storageProvider !== undefined) {
                            updates.push('StorageProvider = @storageProvider');
                            request.input('storageProvider', mssql_1.default.VarChar(30), data.storageProvider);
                        }
                        if (data.storagePath !== undefined) {
                            updates.push('StoragePath = @storagePath');
                            request.input('storagePath', mssql_1.default.NVarChar(500), data.storagePath);
                        }
                        if (data.observaciones !== undefined) {
                            updates.push('Observaciones = @observaciones');
                            request.input('observaciones', mssql_1.default.NVarChar(300), data.observaciones);
                        }
                        if (data.documentTypeId !== undefined) {
                            updates.push('DocumentTypeId = @documentTypeId');
                            request.input('documentTypeId', mssql_1.default.BigInt, data.documentTypeId);
                        }
                        updates.push('UpdatedAt = SYSUTCDATETIME()');
                        return [4 /*yield*/, request.query("\n      UPDATE doc.ExpedienteArchivo\n      SET ".concat(updates.join(', '), "\n      OUTPUT\n        INSERTED.ArchivoId,\n        INSERTED.CURP,\n        INSERTED.TipoCodigo,\n        INSERTED.Titulo,\n        INSERTED.FileName,\n        INSERTED.MimeType,\n        INSERTED.ByteSize,\n        INSERTED.Sha256Hex,\n        INSERTED.StorageProvider,\n        INSERTED.StoragePath,\n        INSERTED.Observaciones,\n        INSERTED.CreatedBy,\n        INSERTED.CreatedAt,\n        INSERTED.UpdatedAt,\n        INSERTED.DocumentTypeId\n      WHERE ArchivoId = @archivoId\n    "))];
                    case 2:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                archivoId: row.ArchivoId,
                                curp: row.CURP,
                                tipoCodigo: row.TipoCodigo,
                                titulo: row.Titulo,
                                fileName: row.FileName,
                                mimeType: row.MimeType,
                                byteSize: row.ByteSize,
                                sha256Hex: row.Sha256Hex,
                                storageProvider: row.StorageProvider,
                                storagePath: row.StoragePath,
                                observaciones: row.Observaciones,
                                createdBy: row.CreatedBy,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                documentTypeId: row.DocumentTypeId
                            }];
                }
            });
        });
    };
    ExpedienteArchivoRepository.prototype.delete = function (archivoId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findById(archivoId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('archivoId', mssql_1.default.BigInt, archivoId)
                                .query("\n        DELETE FROM doc.ExpedienteArchivo\n        WHERE ArchivoId = @archivoId\n      ")];
                    case 2:
                        result = _a.sent();
                        if (result.rowsAffected[0] === 0) {
                            throw new Error('EXPEDIENTE_ARCHIVO_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return ExpedienteArchivoRepository;
}());
exports.ExpedienteArchivoRepository = ExpedienteArchivoRepository;
