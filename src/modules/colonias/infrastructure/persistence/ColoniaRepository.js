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
exports.ColoniaRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var ColoniaRepository = /** @class */ (function () {
    function ColoniaRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    ColoniaRepository.prototype.mapRowToColoniaDetailed = function (row) {
        return {
            coloniaId: row.ColoniaID,
            municipioId: row.MunicipioID,
            codigoPostalId: row.CodigoPostalID,
            nombreColonia: row.NombreColonia,
            tipoAsentamiento: row.TipoAsentamiento,
            esValido: row.EsValido,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy,
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
    ColoniaRepository.prototype.mapRowToColonia = function (row) {
        return {
            coloniaId: row.ColoniaID,
            municipioId: row.MunicipioID,
            codigoPostalId: row.CodigoPostalID,
            nombreColonia: row.NombreColonia,
            tipoAsentamiento: row.TipoAsentamiento,
            esValido: row.EsValido,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdBy: row.createdBy,
            updatedBy: row.updatedBy,
            codigoPostal: row.CodigoPostal ? {
                codigoPostalId: row.CodigoPostalID,
                codigoPostal: row.CodigoPostal
            } : undefined
        };
    };
    ColoniaRepository.prototype.findById = function (coloniaId) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
                            throw new Error('Invalid coloniaId: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('coloniaId', mssql_js_1.sql.Int, coloniaId)
                                .query("\n        SELECT\n          c.ColoniaID,\n          c.MunicipioID,\n          c.CodigoPostalID,\n          c.NombreColonia,\n          c.TipoAsentamiento,\n          c.EsValido,\n          c.createdAt,\n          c.updatedAt,\n          c.createdBy,\n          c.updatedBy,\n          m.NombreMunicipio,\n          cp.CodigoPostal,\n          e.EstadoID,\n          e.NombreEstado\n        FROM geo.Colonias c\n        INNER JOIN geo.Municipios m ON c.MunicipioID = m.MunicipioID\n        INNER JOIN geo.CodigosPostales cp ON c.CodigoPostalID = cp.CodigoPostalID\n        INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID\n        WHERE c.ColoniaID = @coloniaId\n      ")];
                    case 1:
                        r = _a.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToColoniaDetailed(row)];
                }
            });
        });
    };
    ColoniaRepository.prototype.findByMunicipio = function (municipioId) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
                            throw new Error('Invalid municipioId: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('municipioId', mssql_js_1.sql.Int, municipioId)
                                .query("\n        SELECT\n          c.ColoniaID,\n          c.MunicipioID,\n          c.CodigoPostalID,\n          c.NombreColonia,\n          c.TipoAsentamiento,\n          c.EsValido,\n          c.createdAt,\n          c.updatedAt,\n          c.createdBy,\n          c.updatedBy,\n          cp.CodigoPostal\n        FROM geo.Colonias c\n        INNER JOIN geo.CodigosPostales cp ON c.CodigoPostalID = cp.CodigoPostalID\n        WHERE c.MunicipioID = @municipioId\n        ORDER BY c.NombreColonia ASC\n      ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) { return _this.mapRowToColonia(row); })];
                }
            });
        });
    };
    ColoniaRepository.prototype.findByCodigoPostal = function (codigoPostalId) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
                            throw new Error('Invalid codigoPostalId: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('codigoPostalId', mssql_js_1.sql.Int, codigoPostalId)
                                .query("\n        SELECT\n          c.ColoniaID,\n          c.MunicipioID,\n          c.CodigoPostalID,\n          c.NombreColonia,\n          c.TipoAsentamiento,\n          c.EsValido,\n          c.createdAt,\n          c.updatedAt,\n          c.createdBy,\n          c.updatedBy,\n          m.NombreMunicipio,\n          e.EstadoID,\n          e.NombreEstado\n        FROM geo.Colonias c\n        INNER JOIN geo.Municipios m ON c.MunicipioID = m.MunicipioID\n        INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID\n        WHERE c.CodigoPostalID = @codigoPostalId\n        ORDER BY c.NombreColonia ASC\n      ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) { return ({
                                coloniaId: row.ColoniaID,
                                municipioId: row.MunicipioID,
                                codigoPostalId: row.CodigoPostalID,
                                nombreColonia: row.NombreColonia,
                                tipoAsentamiento: row.TipoAsentamiento,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }); })];
                }
            });
        });
    };
    ColoniaRepository.prototype.search = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var query, req, r;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT\n        c.ColoniaID,\n        c.MunicipioID,\n        c.CodigoPostalID,\n        c.NombreColonia,\n        c.TipoAsentamiento,\n        c.EsValido,\n        c.createdAt,\n        c.updatedAt,\n        c.createdBy,\n        c.updatedBy\n      FROM geo.Colonias c\n      WHERE c.NombreColonia LIKE @nombreColonia\n      ORDER BY c.NombreColonia ASC\n    ";
                        req = this.mssqlPool.request();
                        req.input('nombreColonia', mssql_js_1.sql.VarChar(102), "%".concat(filters.nombreColonia, "%"));
                        return [4 /*yield*/, req.query(query)];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) { return _this.mapRowToColonia(row); })];
                }
            });
        });
    };
    ColoniaRepository.prototype.create = function (municipioId, codigoPostalId, nombreColonia, tipoAsentamiento, esValido, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, result, coloniaId, colonia, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        req = transaction.request();
                        req.input('municipioId', mssql_js_1.sql.Int, municipioId);
                        req.input('codigoPostalId', mssql_js_1.sql.Int, codigoPostalId);
                        req.input('nombreColonia', mssql_js_1.sql.VarChar(100), nombreColonia);
                        if (tipoAsentamiento) {
                            req.input('tipoAsentamiento', mssql_js_1.sql.VarChar(50), tipoAsentamiento);
                        }
                        req.input('esValido', mssql_js_1.sql.Bit, esValido !== null && esValido !== void 0 ? esValido : false);
                        if (userId) {
                            req.input('userId', mssql_js_1.sql.UniqueIdentifier, userId);
                        }
                        return [4 /*yield*/, req.query("\n        INSERT INTO geo.Colonias (MunicipioID, CodigoPostalID, NombreColonia".concat(tipoAsentamiento ? ', TipoAsentamiento' : '', ", EsValido").concat(userId ? ', createdBy' : '', ")\n        OUTPUT INSERTED.ColoniaID\n        VALUES (@municipioId, @codigoPostalId, @nombreColonia").concat(tipoAsentamiento ? ', @tipoAsentamiento' : '', ", @esValido").concat(userId ? ', @userId' : '', ")\n      "))];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        coloniaId = result.recordset[0].ColoniaID;
                        return [4 /*yield*/, this.findById(coloniaId)];
                    case 5:
                        colonia = _a.sent();
                        if (!colonia) {
                            throw new Error('Failed to retrieve created colonia');
                        }
                        return [2 /*return*/, colonia];
                    case 6:
                        error_1 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 7:
                        _a.sent();
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ColoniaRepository.prototype.update = function (coloniaId, nombreColonia, tipoAsentamiento, esValido, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, updates, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        req = transaction.request();
                        req.input('coloniaId', mssql_js_1.sql.Int, coloniaId);
                        updates = [];
                        if (nombreColonia !== undefined) {
                            req.input('nombreColonia', mssql_js_1.sql.VarChar(100), nombreColonia);
                            updates.push('NombreColonia = @nombreColonia');
                        }
                        if (tipoAsentamiento !== undefined) {
                            req.input('tipoAsentamiento', mssql_js_1.sql.VarChar(50), tipoAsentamiento);
                            updates.push('TipoAsentamiento = @tipoAsentamiento');
                        }
                        if (esValido !== undefined) {
                            req.input('esValido', mssql_js_1.sql.Bit, esValido);
                            updates.push('EsValido = @esValido');
                        }
                        if (userId) {
                            req.input('userId', mssql_js_1.sql.UniqueIdentifier, userId);
                            updates.push('updatedBy = @userId');
                        }
                        updates.push('updatedAt = GETDATE()');
                        return [4 /*yield*/, req.query("\n        UPDATE geo.Colonias\n        SET ".concat(updates.join(', '), "\n        OUTPUT INSERTED.ColoniaID\n        WHERE ColoniaID = @coloniaId\n      "))];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        if (result.recordset.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, this.findById(coloniaId)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        error_2 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 7:
                        _a.sent();
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ColoniaRepository.prototype.delete = function (coloniaId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, result, row, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        req = transaction.request();
                        req.input('coloniaId', mssql_js_1.sql.Int, coloniaId);
                        return [4 /*yield*/, req.query("\n        DELETE FROM geo.Colonias\n        OUTPUT DELETED.ColoniaID\n        WHERE ColoniaID = @coloniaId\n      ")];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, row.ColoniaID];
                    case 5:
                        error_3 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 6:
                        _a.sent();
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return ColoniaRepository;
}());
exports.ColoniaRepository = ColoniaRepository;
