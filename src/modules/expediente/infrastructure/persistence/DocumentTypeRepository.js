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
exports.DocumentTypeRepository = void 0;
var mssql_1 = require("mssql");
var DocumentTypeRepository = /** @class */ (function () {
    function DocumentTypeRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    DocumentTypeRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        DocumentTypeId,\n        Code,\n        Name,\n        Required,\n        ValidityDays,\n        Active,\n        CreatedAt,\n        UpdatedAt,\n        CreatedBy,\n        UpdatedBy\n      FROM doc.DocumentType\n      ORDER BY Name ASC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                documentTypeId: row.DocumentTypeId,
                                code: row.Code,
                                name: row.Name,
                                required: row.Required === 1 || row.Required === true,
                                validityDays: row.ValidityDays,
                                active: row.Active === 1 || row.Active === true,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                createdBy: row.CreatedBy,
                                updatedBy: row.UpdatedBy
                            }); })];
                }
            });
        });
    };
    DocumentTypeRepository.prototype.findById = function (documentTypeId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('documentTypeId', mssql_1.default.BigInt, documentTypeId)
                            .query("\n        SELECT\n          DocumentTypeId,\n          Code,\n          Name,\n          Required,\n          ValidityDays,\n          Active,\n          CreatedAt,\n          UpdatedAt,\n          CreatedBy,\n          UpdatedBy\n        FROM doc.DocumentType\n        WHERE DocumentTypeId = @documentTypeId\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                documentTypeId: row.DocumentTypeId,
                                code: row.Code,
                                name: row.Name,
                                required: row.Required === 1 || row.Required === true,
                                validityDays: row.ValidityDays,
                                active: row.Active === 1 || row.Active === true,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                createdBy: row.CreatedBy,
                                updatedBy: row.UpdatedBy
                            }];
                }
            });
        });
    };
    DocumentTypeRepository.prototype.findByCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('code', mssql_1.default.VarChar(30), code)
                            .query("\n        SELECT\n          DocumentTypeId,\n          Code,\n          Name,\n          Required,\n          ValidityDays,\n          Active,\n          CreatedAt,\n          UpdatedAt,\n          CreatedBy,\n          UpdatedBy\n        FROM doc.DocumentType\n        WHERE Code = @code\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                documentTypeId: row.DocumentTypeId,
                                code: row.Code,
                                name: row.Name,
                                required: row.Required === 1 || row.Required === true,
                                validityDays: row.ValidityDays,
                                active: row.Active === 1 || row.Active === true,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                createdBy: row.CreatedBy,
                                updatedBy: row.UpdatedBy
                            }];
                }
            });
        });
    };
    DocumentTypeRepository.prototype.create = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('code', mssql_1.default.VarChar(30), data.code)
                            .input('name', mssql_1.default.NVarChar(120), data.name)
                            .input('required', mssql_1.default.Bit, data.required)
                            .input('validityDays', mssql_1.default.Int, data.validityDays)
                            .input('active', mssql_1.default.Bit, data.active)
                            .input('createdBy', mssql_1.default.NVarChar(100), userId !== null && userId !== void 0 ? userId : null)
                            .input('updatedBy', mssql_1.default.NVarChar(100), userId !== null && userId !== void 0 ? userId : null)
                            .query("\n        INSERT INTO doc.DocumentType (Code, Name, Required, ValidityDays, Active, CreatedBy, UpdatedBy)\n        OUTPUT\n          INSERTED.DocumentTypeId,\n          INSERTED.Code,\n          INSERTED.Name,\n          INSERTED.Required,\n          INSERTED.ValidityDays,\n          INSERTED.Active,\n          INSERTED.CreatedAt,\n          INSERTED.UpdatedAt,\n          INSERTED.CreatedBy,\n          INSERTED.UpdatedBy\n        VALUES (@code, @name, @required, @validityDays, @active, @createdBy, @updatedBy)\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                documentTypeId: row.DocumentTypeId,
                                code: row.Code,
                                name: row.Name,
                                required: row.Required === 1 || row.Required === true,
                                validityDays: row.ValidityDays,
                                active: row.Active === 1 || row.Active === true,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                createdBy: row.CreatedBy,
                                updatedBy: row.UpdatedBy
                            }];
                }
            });
        });
    };
    DocumentTypeRepository.prototype.update = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updates, request, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findById(data.documentTypeId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('DOCUMENT_TYPE_NOT_FOUND');
                        }
                        updates = [];
                        request = this.mssqlPool.request();
                        request.input('documentTypeId', mssql_1.default.BigInt, data.documentTypeId);
                        if (data.code !== undefined) {
                            updates.push('Code = @code');
                            request.input('code', mssql_1.default.VarChar(30), data.code);
                        }
                        if (data.name !== undefined) {
                            updates.push('Name = @name');
                            request.input('name', mssql_1.default.NVarChar(120), data.name);
                        }
                        if (data.required !== undefined) {
                            updates.push('Required = @required');
                            request.input('required', mssql_1.default.Bit, data.required);
                        }
                        if (data.validityDays !== undefined) {
                            updates.push('ValidityDays = @validityDays');
                            request.input('validityDays', mssql_1.default.Int, data.validityDays);
                        }
                        if (data.active !== undefined) {
                            updates.push('Active = @active');
                            request.input('active', mssql_1.default.Bit, data.active);
                        }
                        updates.push('UpdatedAt = SYSUTCDATETIME()');
                        updates.push('UpdatedBy = @updatedBy');
                        request.input('updatedBy', mssql_1.default.NVarChar(100), userId !== null && userId !== void 0 ? userId : null);
                        return [4 /*yield*/, request.query("\n      UPDATE doc.DocumentType\n      SET ".concat(updates.join(', '), "\n      OUTPUT\n        INSERTED.DocumentTypeId,\n        INSERTED.Code,\n        INSERTED.Name,\n        INSERTED.Required,\n        INSERTED.ValidityDays,\n        INSERTED.Active,\n        INSERTED.CreatedAt,\n        INSERTED.UpdatedAt,\n        INSERTED.CreatedBy,\n        INSERTED.UpdatedBy\n      WHERE DocumentTypeId = @documentTypeId\n    "))];
                    case 2:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                documentTypeId: row.DocumentTypeId,
                                code: row.Code,
                                name: row.Name,
                                required: row.Required === 1 || row.Required === true,
                                validityDays: row.ValidityDays,
                                active: row.Active === 1 || row.Active === true,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt,
                                createdBy: row.CreatedBy,
                                updatedBy: row.UpdatedBy
                            }];
                }
            });
        });
    };
    DocumentTypeRepository.prototype.delete = function (documentTypeId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findById(documentTypeId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('DOCUMENT_TYPE_NOT_FOUND');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('documentTypeId', mssql_1.default.BigInt, documentTypeId)
                                .query("\n        DELETE FROM doc.DocumentType\n        WHERE DocumentTypeId = @documentTypeId\n      ")];
                    case 2:
                        result = _a.sent();
                        if (result.rowsAffected[0] === 0) {
                            throw new Error('DOCUMENT_TYPE_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return DocumentTypeRepository;
}());
exports.DocumentTypeRepository = DocumentTypeRepository;
