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
exports.InfoRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var InfoRepository = /** @class */ (function () {
    function InfoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    InfoRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .query("\n        SELECT\n          id,\n          nombre,\n          icono,\n          color,\n          colorBotones,\n          colorEncabezados,\n          colorLetra,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM dbo.Info\n        ORDER BY nombre ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToInfo(row); })];
                }
            });
        });
    };
    InfoRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid info id: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, id)
                                .query("\n        SELECT\n          id,\n          nombre,\n          icono,\n          color,\n          colorBotones,\n          colorEncabezados,\n          colorLetra,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM dbo.Info\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToInfo(row)];
                }
            });
        });
    };
    InfoRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var createdAt, updatedAt, result;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        if (!data.nombre || data.nombre.trim().length === 0) {
                            throw new Error('Invalid nombre: cannot be empty');
                        }
                        createdAt = (_a = data.createdAt) !== null && _a !== void 0 ? _a : new Date().toISOString();
                        updatedAt = (_b = data.updatedAt) !== null && _b !== void 0 ? _b : new Date().toISOString();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre)
                                .input('icono', mssql_js_1.sql.NVarChar(255), (_c = data.icono) !== null && _c !== void 0 ? _c : null)
                                .input('color', mssql_js_1.sql.NVarChar(50), (_d = data.color) !== null && _d !== void 0 ? _d : null)
                                .input('colorBotones', mssql_js_1.sql.NVarChar(50), (_e = data.colorBotones) !== null && _e !== void 0 ? _e : null)
                                .input('colorEncabezados', mssql_js_1.sql.NVarChar(50), (_f = data.colorEncabezados) !== null && _f !== void 0 ? _f : null)
                                .input('colorLetra', mssql_js_1.sql.NVarChar(50), (_g = data.colorLetra) !== null && _g !== void 0 ? _g : null)
                                .input('createdAt', mssql_js_1.sql.DateTime2, createdAt)
                                .input('updatedAt', mssql_js_1.sql.DateTime2, updatedAt)
                                .input('createdBy', mssql_js_1.sql.NVarChar(128), (_h = data.createdBy) !== null && _h !== void 0 ? _h : null)
                                .input('updatedBy', mssql_js_1.sql.NVarChar(128), (_j = data.updatedBy) !== null && _j !== void 0 ? _j : null)
                                .query("\n        INSERT INTO dbo.Info (nombre, icono, color, colorBotones, colorEncabezados, colorLetra, createdAt, updatedAt, createdBy, updatedBy)\n        OUTPUT\n          INSERTED.id,\n          INSERTED.nombre,\n          INSERTED.icono,\n          INSERTED.color,\n          INSERTED.colorBotones,\n          INSERTED.colorEncabezados,\n          INSERTED.colorLetra,\n          INSERTED.createdAt,\n          INSERTED.updatedAt,\n          INSERTED.createdBy,\n          INSERTED.updatedBy\n        VALUES (@nombre, @icono, @color, @colorBotones, @colorEncabezados, @colorLetra, @createdAt, @updatedAt, @createdBy, @updatedBy)\n      ")];
                    case 1:
                        result = _k.sent();
                        return [2 /*return*/, this.mapRowToInfo(result.recordset[0])];
                }
            });
        });
    };
    InfoRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid info id: must be a positive number');
                        }
                        if (data.nombre !== undefined && (!data.nombre || data.nombre.trim().length === 0)) {
                            throw new Error('Invalid nombre: cannot be empty');
                        }
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_js_1.sql.Int, id);
                        if (data.nombre !== undefined) {
                            updates.push('nombre = @nombre');
                            request.input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre);
                        }
                        if (data.icono !== undefined) {
                            updates.push('icono = @icono');
                            request.input('icono', mssql_js_1.sql.NVarChar(255), data.icono);
                        }
                        if (data.color !== undefined) {
                            updates.push('color = @color');
                            request.input('color', mssql_js_1.sql.NVarChar(50), data.color);
                        }
                        if (data.colorBotones !== undefined) {
                            updates.push('colorBotones = @colorBotones');
                            request.input('colorBotones', mssql_js_1.sql.NVarChar(50), data.colorBotones);
                        }
                        if (data.colorEncabezados !== undefined) {
                            updates.push('colorEncabezados = @colorEncabezados');
                            request.input('colorEncabezados', mssql_js_1.sql.NVarChar(50), data.colorEncabezados);
                        }
                        if (data.colorLetra !== undefined) {
                            updates.push('colorLetra = @colorLetra');
                            request.input('colorLetra', mssql_js_1.sql.NVarChar(50), data.colorLetra);
                        }
                        if (data.updatedAt !== undefined) {
                            updates.push('updatedAt = @updatedAt');
                            request.input('updatedAt', mssql_js_1.sql.DateTime2, data.updatedAt);
                        }
                        else {
                            updates.push('updatedAt = @updatedAt');
                            request.input('updatedAt', mssql_js_1.sql.DateTime2, new Date().toISOString());
                        }
                        if (data.updatedBy !== undefined) {
                            updates.push('updatedBy = @updatedBy');
                            request.input('updatedBy', mssql_js_1.sql.NVarChar(128), data.updatedBy);
                        }
                        if (updates.length === 0) {
                            return [2 /*return*/, this.findById(id)];
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE dbo.Info\n      SET ".concat(updates.join(', '), "\n      WHERE id = @id\n    "))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.findById(id)];
                }
            });
        });
    };
    InfoRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid info id: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, id)
                                .query("\n        DELETE FROM dbo.Info\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowsAffected[0] > 0];
                }
            });
        });
    };
    InfoRepository.prototype.mapRowToInfo = function (row) {
        return {
            id: row.id,
            nombre: row.nombre,
            icono: row.icono,
            color: row.color,
            colorBotones: row.colorBotones,
            colorEncabezados: row.colorEncabezados,
            colorLetra: row.colorLetra,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy
        };
    };
    return InfoRepository;
}());
exports.InfoRepository = InfoRepository;
