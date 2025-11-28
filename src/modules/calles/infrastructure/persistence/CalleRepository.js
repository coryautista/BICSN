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
exports.CalleRepository = void 0;
var mssql_1 = require("mssql");
var CalleRepository = /** @class */ (function () {
    function CalleRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    CalleRepository.prototype.mapRowToCalle = function (row) {
        return {
            calleId: row.CalleID,
            coloniaId: row.ColoniaID,
            nombreCalle: row.NombreCalle,
            esValido: row.EsValido,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy
        };
    };
    CalleRepository.prototype.mapRowToCalleDetailed = function (row) {
        return {
            calleId: row.CalleID,
            coloniaId: row.ColoniaID,
            nombreCalle: row.NombreCalle,
            esValido: row.EsValido,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy,
            colonia: {
                coloniaId: row.ColoniaID,
                nombreColonia: row.NombreColonia,
                tipoAsentamiento: row.TipoAsentamiento
            },
            municipio: {
                municipioId: row.MunicipioID,
                nombreMunicipio: row.NombreMunicipio
            },
            codigoPostal: {
                codigoPostalId: row.CodigoPostalID,
                codigoPostal: row.CodigoPostal
            },
            estado: {
                estadoId: row.EstadoID,
                nombreEstado: row.NombreEstado
            }
        };
    };
    CalleRepository.prototype.findById = function (calleId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('calleId', mssql_1.default.Int, calleId)
                            .query("\n        SELECT\n          c.CalleID,\n          c.ColoniaID,\n          c.NombreCalle,\n          c.EsValido,\n          c.createdAt,\n          c.updatedAt,\n          c.createdBy,\n          c.updatedBy,\n          col.NombreColonia,\n          col.TipoAsentamiento,\n          m.MunicipioID,\n          m.NombreMunicipio,\n          cp.CodigoPostalID,\n          cp.CodigoPostal,\n          e.EstadoID,\n          e.NombreEstado\n        FROM geo.Calles c\n        INNER JOIN geo.Colonias col ON c.ColoniaID = col.ColoniaID\n        INNER JOIN geo.Municipios m ON col.MunicipioID = m.MunicipioID\n        INNER JOIN geo.CodigosPostales cp ON col.CodigoPostalID = cp.CodigoPostalID\n        INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID\n        WHERE c.CalleID = @calleId\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToCalleDetailed(result.recordset[0])];
                }
            });
        });
    };
    CalleRepository.prototype.findByColonia = function (coloniaId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('coloniaId', mssql_1.default.Int, coloniaId)
                            .query("\n        SELECT\n          CalleID,\n          ColoniaID,\n          NombreCalle,\n          EsValido,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM geo.Calles\n        WHERE ColoniaID = @coloniaId\n        ORDER BY NombreCalle ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(this.mapRowToCalle)];
                }
            });
        });
    };
    CalleRepository.prototype.search = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var query, request, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT\n        c.CalleID,\n        c.ColoniaID,\n        c.NombreCalle,\n        c.EsValido,\n        c.createdAt,\n        c.updatedAt,\n        c.createdBy,\n        c.updatedBy\n      FROM geo.Calles c\n      WHERE 1=1\n    ";
                        request = this.mssqlPool.request();
                        // Solo filtros que existen en geo.Calles
                        if (filters.coloniaId) {
                            query += " AND c.ColoniaID = @coloniaId";
                            request.input('coloniaId', mssql_1.default.Int, filters.coloniaId);
                        }
                        if (filters.nombreCalle) {
                            query += " AND c.NombreCalle LIKE @nombreCalle";
                            request.input('nombreCalle', mssql_1.default.VarChar(152), "%".concat(filters.nombreCalle, "%"));
                        }
                        if (filters.esValido !== undefined) {
                            query += " AND c.EsValido = @esValido";
                            request.input('esValido', mssql_1.default.Bit, filters.esValido);
                        }
                        query += " ORDER BY c.ColoniaID ASC, c.NombreCalle ASC";
                        if (filters.limit) {
                            query += " OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
                            request.input('offset', mssql_1.default.Int, filters.offset || 0);
                            request.input('limit', mssql_1.default.Int, filters.limit);
                        }
                        return [4 /*yield*/, request.query(query)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToCalle(row); })];
                }
            });
        });
    };
    CalleRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // Insert the record
                    return [4 /*yield*/, this.mssqlPool.request()
                            .input('coloniaId', mssql_1.default.Int, data.coloniaId)
                            .input('nombreCalle', mssql_1.default.VarChar(150), data.nombreCalle)
                            .input('esValido', mssql_1.default.Bit, data.esValido)
                            .input('createdBy', mssql_1.default.VarChar(128), (_a = data.userId) !== null && _a !== void 0 ? _a : null)
                            .input('updatedBy', mssql_1.default.VarChar(128), (_b = data.userId) !== null && _b !== void 0 ? _b : null)
                            .query("\n        INSERT INTO geo.Calles (ColoniaID, NombreCalle, EsValido, createdBy, updatedBy)\n        VALUES (@coloniaId, @nombreCalle, @esValido, @createdBy, @updatedBy)\n      ")];
                    case 1:
                        // Insert the record
                        _c.sent();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('coloniaId', mssql_1.default.Int, data.coloniaId)
                                .input('nombreCalle', mssql_1.default.VarChar(150), data.nombreCalle)
                                .query("\n        SELECT TOP 1\n          CalleID,\n          ColoniaID,\n          NombreCalle,\n          EsValido,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM geo.Calles\n        WHERE ColoniaID = @coloniaId AND NombreCalle = @nombreCalle\n        ORDER BY CalleID DESC\n      ")];
                    case 2:
                        result = _c.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('Failed to retrieve inserted calle');
                        }
                        return [2 /*return*/, this.mapRowToCalle(result.recordset[0])];
                }
            });
        });
    };
    CalleRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sets, request, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sets = [];
                        request = this.mssqlPool.request().input('calleId', mssql_1.default.Int, data.calleId);
                        if (data.nombreCalle !== undefined) {
                            request.input('nombreCalle', mssql_1.default.VarChar(150), data.nombreCalle);
                            sets.push('NombreCalle = @nombreCalle');
                        }
                        if (data.esValido !== undefined) {
                            request.input('esValido', mssql_1.default.Bit, data.esValido);
                            sets.push('EsValido = @esValido');
                        }
                        sets.push('updatedAt = SYSUTCDATETIME()');
                        request.input('updatedBy', mssql_1.default.VarChar(128), (_a = data.userId) !== null && _a !== void 0 ? _a : null);
                        sets.push('updatedBy = @updatedBy');
                        if (sets.length === 2) { // Only updatedAt and updatedBy
                            throw new Error('CALLE_NO_UPDATE_DATA');
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE geo.Calles\n      SET ".concat(sets.join(', '), "\n      WHERE CalleID = @calleId\n    "))];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('calleId', mssql_1.default.Int, data.calleId)
                                .query("\n        SELECT\n          CalleID,\n          ColoniaID,\n          NombreCalle,\n          EsValido,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM geo.Calles\n        WHERE CalleID = @calleId\n      ")];
                    case 2:
                        result = _b.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('CALLE_NOT_FOUND');
                        }
                        return [2 /*return*/, this.mapRowToCalle(result.recordset[0])];
                }
            });
        });
    };
    CalleRepository.prototype.delete = function (calleId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('calleId', mssql_1.default.Int, calleId)
                            .query("\n        DELETE FROM geo.Calles\n        OUTPUT DELETED.CalleID\n        WHERE CalleID = @calleId\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('CALLE_NOT_FOUND');
                        }
                        return [2 /*return*/, result.recordset[0].CalleID];
                }
            });
        });
    };
    return CalleRepository;
}());
exports.CalleRepository = CalleRepository;
