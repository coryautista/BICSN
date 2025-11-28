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
exports.MunicipioRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var MunicipioRepository = /** @class */ (function () {
    function MunicipioRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    MunicipioRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .query("\n        SELECT\n          MunicipioID,\n          EstadoID,\n          ClaveMunicipio,\n          NombreMunicipio,\n          EsValido\n        FROM geo.Municipios\n        ORDER BY EstadoID ASC, NombreMunicipio ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToMunicipio(row); })];
                }
            });
        });
    };
    MunicipioRepository.prototype.findByEstado = function (estadoId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
                            throw new Error('Invalid estadoId: must be a 2-character string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('estadoId', mssql_js_1.sql.Char(2), estadoId)
                                .query("\n        SELECT\n          MunicipioID,\n          EstadoID,\n          ClaveMunicipio,\n          NombreMunicipio,\n          EsValido\n        FROM geo.Municipios\n        WHERE EstadoID = @estadoId\n        ORDER BY NombreMunicipio ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToMunicipio(row); })];
                }
            });
        });
    };
    MunicipioRepository.prototype.findById = function (municipioId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!municipioId || municipioId <= 0) {
                            throw new Error('Invalid municipioId: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('municipioId', mssql_js_1.sql.Int, municipioId)
                                .query("\n        SELECT\n          MunicipioID,\n          EstadoID,\n          ClaveMunicipio,\n          NombreMunicipio,\n          EsValido\n        FROM geo.Municipios\n        WHERE MunicipioID = @municipioId\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToMunicipio(row)];
                }
            });
        });
    };
    MunicipioRepository.prototype.findByClave = function (claveMunicipio) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!claveMunicipio || typeof claveMunicipio !== 'string' || claveMunicipio.trim().length === 0) {
                            throw new Error('Invalid claveMunicipio: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('claveMunicipio', mssql_js_1.sql.VarChar(3), claveMunicipio.trim())
                                .query("\n        SELECT\n          MunicipioID,\n          EstadoID,\n          ClaveMunicipio,\n          NombreMunicipio,\n          EsValido\n        FROM geo.Municipios\n        WHERE ClaveMunicipio = @claveMunicipio\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToMunicipio(row)];
                }
            });
        });
    };
    MunicipioRepository.prototype.create = function (data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var pool, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!data.estadoId || data.estadoId.length !== 2) {
                            throw new Error('Invalid estadoId: must be a 2-character string');
                        }
                        if (!data.claveMunicipio || data.claveMunicipio.trim().length === 0) {
                            throw new Error('Invalid claveMunicipio: cannot be empty');
                        }
                        if (!data.nombreMunicipio || data.nombreMunicipio.trim().length === 0) {
                            throw new Error('Invalid nombreMunicipio: cannot be empty');
                        }
                        pool = tx || this.mssqlPool;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, pool.request()
                                .input('estadoId', mssql_js_1.sql.Char(2), data.estadoId)
                                .input('claveMunicipio', mssql_js_1.sql.VarChar(3), data.claveMunicipio)
                                .input('nombreMunicipio', mssql_js_1.sql.NVarChar(100), data.nombreMunicipio)
                                .input('esValido', mssql_js_1.sql.Bit, data.esValido ? 1 : 0)
                                .input('userId', mssql_js_1.sql.NVarChar(128), data.userId || null)
                                .query("\n          INSERT INTO geo.Municipios (EstadoID, ClaveMunicipio, NombreMunicipio, EsValido, createdBy, updatedBy)\n          OUTPUT\n            INSERTED.MunicipioID,\n            INSERTED.EstadoID,\n            INSERTED.ClaveMunicipio,\n            INSERTED.NombreMunicipio,\n            INSERTED.EsValido\n          VALUES (@estadoId, @claveMunicipio, @nombreMunicipio, @esValido, @userId, @userId)\n        ")];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, this.mapRowToMunicipio(result.recordset[0])];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1.message.includes('Violation of PRIMARY KEY constraint')) {
                            throw new Error('MUNICIPIO_EXISTS');
                        }
                        if (error_1.message.includes('FOREIGN KEY constraint')) {
                            throw new Error('ESTADO_NOT_FOUND');
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MunicipioRepository.prototype.update = function (municipioId, data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, pool, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!municipioId || municipioId <= 0) {
                            throw new Error('Invalid municipioId: must be a positive number');
                        }
                        if (data.nombreMunicipio !== undefined && (!data.nombreMunicipio || data.nombreMunicipio.trim().length === 0)) {
                            throw new Error('Invalid nombreMunicipio: cannot be empty');
                        }
                        updates = [];
                        pool = tx || this.mssqlPool;
                        request = pool.request().input('municipioId', mssql_js_1.sql.Int, municipioId);
                        if (data.nombreMunicipio !== undefined) {
                            updates.push('NombreMunicipio = @nombreMunicipio');
                            request.input('nombreMunicipio', mssql_js_1.sql.NVarChar(100), data.nombreMunicipio);
                        }
                        if (data.esValido !== undefined) {
                            updates.push('EsValido = @esValido');
                            request.input('esValido', mssql_js_1.sql.Bit, data.esValido ? 1 : 0);
                        }
                        if (data.userId !== undefined) {
                            updates.push('updatedBy = @userId');
                            request.input('userId', mssql_js_1.sql.NVarChar(128), data.userId);
                        }
                        if (updates.length === 0) {
                            return [2 /*return*/, this.findById(municipioId)];
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE geo.Municipios\n      SET ".concat(updates.join(', '), "\n      WHERE MunicipioID = @municipioId\n    "))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.findById(municipioId)];
                }
            });
        });
    };
    MunicipioRepository.prototype.delete = function (municipioId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var pool, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!municipioId || municipioId <= 0) {
                            throw new Error('Invalid municipioId: must be a positive number');
                        }
                        pool = tx || this.mssqlPool;
                        return [4 /*yield*/, pool.request()
                                .input('municipioId', mssql_js_1.sql.Int, municipioId)
                                .query("\n        DELETE FROM geo.Municipios\n        WHERE MunicipioID = @municipioId\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowsAffected[0] > 0];
                }
            });
        });
    };
    MunicipioRepository.prototype.mapRowToMunicipio = function (row) {
        return {
            municipioId: row.MunicipioID,
            estadoId: row.EstadoID,
            claveMunicipio: row.ClaveMunicipio,
            nombreMunicipio: row.NombreMunicipio,
            esValido: row.EsValido === 1 || row.EsValido === true
        };
    };
    return MunicipioRepository;
}());
exports.MunicipioRepository = MunicipioRepository;
