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
exports.CategoriaPuestoOrgRepository = void 0;
var mssql_1 = require("mssql");
var CategoriaPuestoOrgRepository = /** @class */ (function () {
    function CategoriaPuestoOrgRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    CategoriaPuestoOrgRepository.prototype.mapRowToCategoriaPuestoOrg = function (row) {
        return {
            categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
            nivel: row.Nivel,
            org0: row.Org0,
            org1: row.Org1,
            org2: row.Org2,
            org3: row.Org3,
            categoria: row.Categoria,
            nombreCategoria: row.NombreCategoria,
            ingresoBrutoMensual: row.IngresoBrutoMensual,
            vigenciaInicio: row.VigenciaInicio,
            vigenciaFin: row.VigenciaFin,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy,
            baseConfianza: row.BaseConfianza,
            porcentaje: row.Porcentaje
        };
    };
    CategoriaPuestoOrgRepository.prototype.findById = function (categoriaPuestoOrgId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('categoriaPuestoOrgId', mssql_1.default.BigInt, categoriaPuestoOrgId)
                            .query("\n        SELECT\n          CategoriaPuestoOrgId,\n          Nivel,\n          Org0,\n          Org1,\n          Org2,\n          Org3,\n          Categoria,\n          NombreCategoria,\n          IngresoBrutoMensual,\n          VigenciaInicio,\n          VigenciaFin,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy,\n          BaseConfianza,\n          Porcentaje\n        FROM afi.CategoriaPuestoOrg\n        WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToCategoriaPuestoOrg(result.recordset[0])];
                }
            });
        });
    };
    CategoriaPuestoOrgRepository.prototype.findAll = function () {
        return __awaiter(this, arguments, void 0, function (filters) {
            var query, request, result;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT\n        CategoriaPuestoOrgId,\n        Nivel,\n        Org0,\n        Org1,\n        Org2,\n        Org3,\n        Categoria,\n        NombreCategoria,\n        IngresoBrutoMensual,\n        VigenciaInicio,\n        VigenciaFin,\n        createdAt,\n        updatedAt,\n        createdBy,\n        updatedBy,\n        BaseConfianza,\n        Porcentaje\n      FROM afi.CategoriaPuestoOrg\n      WHERE 1=1\n    ";
                        request = this.mssqlPool.request();
                        if (filters.nivel !== undefined) {
                            query += ' AND Nivel = @nivel';
                            request.input('nivel', mssql_1.default.TinyInt, filters.nivel);
                        }
                        if (filters.org0) {
                            query += ' AND Org0 = @org0';
                            request.input('org0', mssql_1.default.Char(2), filters.org0);
                        }
                        if (filters.org1) {
                            query += ' AND Org1 = @org1';
                            request.input('org1', mssql_1.default.Char(2), filters.org1);
                        }
                        if (filters.org2) {
                            query += ' AND Org2 = @org2';
                            request.input('org2', mssql_1.default.Char(2), filters.org2);
                        }
                        if (filters.org3) {
                            query += ' AND Org3 = @org3';
                            request.input('org3', mssql_1.default.Char(2), filters.org3);
                        }
                        if (filters.vigenciaInicio) {
                            query += ' AND VigenciaInicio = @vigenciaInicio';
                            request.input('vigenciaInicio', mssql_1.default.DateTime2, filters.vigenciaInicio);
                        }
                        if (filters.categoria) {
                            query += ' AND Categoria = @categoria';
                            request.input('categoria', mssql_1.default.VarChar(10), filters.categoria);
                        }
                        query += ' ORDER BY Nivel, Org0, Org1, Org2, Org3, VigenciaInicio DESC, Categoria';
                        return [4 /*yield*/, request.query(query)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(this.mapRowToCategoriaPuestoOrg)];
                }
            });
        });
    };
    CategoriaPuestoOrgRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('nivel', mssql_1.default.TinyInt, data.nivel)
                            .input('org0', mssql_1.default.Char(2), data.org0)
                            .input('org1', mssql_1.default.Char(2), data.org1)
                            .input('org2', mssql_1.default.Char(2), (_a = data.org2) !== null && _a !== void 0 ? _a : null)
                            .input('org3', mssql_1.default.Char(2), (_b = data.org3) !== null && _b !== void 0 ? _b : null)
                            .input('categoria', mssql_1.default.VarChar(10), data.categoria)
                            .input('nombreCategoria', mssql_1.default.NVarChar(80), data.nombreCategoria)
                            .input('ingresoBrutoMensual', mssql_1.default.Decimal(12, 2), data.ingresoBrutoMensual)
                            .input('vigenciaInicio', mssql_1.default.DateTime2, data.vigenciaInicio)
                            .input('vigenciaFin', mssql_1.default.DateTime2, (_c = data.vigenciaFin) !== null && _c !== void 0 ? _c : null)
                            .input('createdBy', mssql_1.default.VarChar(128), (_d = data.userId) !== null && _d !== void 0 ? _d : null)
                            .input('updatedBy', mssql_1.default.VarChar(128), (_e = data.userId) !== null && _e !== void 0 ? _e : null)
                            .input('baseConfianza', mssql_1.default.NVarChar(1), (_f = data.baseConfianza) !== null && _f !== void 0 ? _f : null)
                            .input('porcentaje', mssql_1.default.Int, (_g = data.porcentaje) !== null && _g !== void 0 ? _g : null)
                            .query("\n        INSERT INTO afi.CategoriaPuestoOrg (\n          Nivel, Org0, Org1, Org2, Org3, Categoria, NombreCategoria,\n          IngresoBrutoMensual, VigenciaInicio, VigenciaFin, createdBy, updatedBy,\n          BaseConfianza, Porcentaje\n        )\n        OUTPUT\n          INSERTED.CategoriaPuestoOrgId,\n          INSERTED.Nivel,\n          INSERTED.Org0,\n          INSERTED.Org1,\n          INSERTED.Org2,\n          INSERTED.Org3,\n          INSERTED.Categoria,\n          INSERTED.NombreCategoria,\n          INSERTED.IngresoBrutoMensual,\n          INSERTED.VigenciaInicio,\n          INSERTED.VigenciaFin,\n          INSERTED.createdAt,\n          INSERTED.updatedAt,\n          INSERTED.createdBy,\n          INSERTED.updatedBy,\n          INSERTED.BaseConfianza,\n          INSERTED.Porcentaje\n        VALUES (\n          @nivel, @org0, @org1, @org2, @org3, @categoria, @nombreCategoria,\n          @ingresoBrutoMensual, @vigenciaInicio, @vigenciaFin, @createdBy, @updatedBy,\n          @baseConfianza, @porcentaje\n        )\n      ")];
                    case 1:
                        result = _h.sent();
                        return [2 /*return*/, this.mapRowToCategoriaPuestoOrg(result.recordset[0])];
                }
            });
        });
    };
    CategoriaPuestoOrgRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sets, request, updateQuery, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sets = [];
                        request = this.mssqlPool.request().input('categoriaPuestoOrgId', mssql_1.default.BigInt, data.categoriaPuestoOrgId);
                        if (data.nombreCategoria !== undefined) {
                            request.input('nombreCategoria', mssql_1.default.NVarChar(80), data.nombreCategoria);
                            sets.push('NombreCategoria = @nombreCategoria');
                        }
                        if (data.ingresoBrutoMensual !== undefined) {
                            request.input('ingresoBrutoMensual', mssql_1.default.Decimal(12, 2), data.ingresoBrutoMensual);
                            sets.push('IngresoBrutoMensual = @ingresoBrutoMensual');
                        }
                        if (data.vigenciaFin !== undefined) {
                            request.input('vigenciaFin', mssql_1.default.DateTime2, data.vigenciaFin);
                            sets.push('VigenciaFin = @vigenciaFin');
                        }
                        if (data.baseConfianza !== undefined) {
                            request.input('baseConfianza', mssql_1.default.NVarChar(1), data.baseConfianza);
                            sets.push('BaseConfianza = @baseConfianza');
                        }
                        if (data.porcentaje !== undefined) {
                            request.input('porcentaje', mssql_1.default.Int, data.porcentaje);
                            sets.push('Porcentaje = @porcentaje');
                        }
                        sets.push('updatedAt = SYSUTCDATETIME()');
                        request.input('updatedBy', mssql_1.default.VarChar(128), (_a = data.userId) !== null && _a !== void 0 ? _a : null);
                        sets.push('updatedBy = @updatedBy');
                        if (sets.length === 2) { // Only updatedAt and updatedBy
                            throw new Error('CATEGORIA_PUESTO_ORG_NO_UPDATE_DATA');
                        }
                        updateQuery = "\n      UPDATE afi.CategoriaPuestoOrg\n      SET ".concat(sets.join(', '), "\n      OUTPUT\n        INSERTED.CategoriaPuestoOrgId,\n        INSERTED.Nivel,\n        INSERTED.Org0,\n        INSERTED.Org1,\n        INSERTED.Org2,\n        INSERTED.Org3,\n        INSERTED.Categoria,\n        INSERTED.NombreCategoria,\n        INSERTED.IngresoBrutoMensual,\n        INSERTED.VigenciaInicio,\n        INSERTED.VigenciaFin,\n        INSERTED.createdAt,\n        INSERTED.updatedAt,\n        INSERTED.createdBy,\n        INSERTED.updatedBy,\n        INSERTED.BaseConfianza,\n        INSERTED.Porcentaje\n      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId\n    ");
                        return [4 /*yield*/, request.query(updateQuery)];
                    case 1:
                        result = _b.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
                        }
                        return [2 /*return*/, this.mapRowToCategoriaPuestoOrg(result.recordset[0])];
                }
            });
        });
    };
    CategoriaPuestoOrgRepository.prototype.delete = function (categoriaPuestoOrgId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('categoriaPuestoOrgId', mssql_1.default.BigInt, categoriaPuestoOrgId)
                            .query("\n        DELETE FROM afi.CategoriaPuestoOrg\n        OUTPUT DELETED.CategoriaPuestoOrgId\n        WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
                        }
                        return [2 /*return*/, result.recordset[0].CategoriaPuestoOrgId];
                }
            });
        });
    };
    return CategoriaPuestoOrgRepository;
}());
exports.CategoriaPuestoOrgRepository = CategoriaPuestoOrgRepository;
