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
exports.TipoMovimientoRepository = void 0;
var mssql_1 = require("mssql");
var TipoMovimientoRepository = /** @class */ (function () {
    function TipoMovimientoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    TipoMovimientoRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .query("\n        SELECT\n          id,\n          abreviatura,\n          nombre\n        FROM afi.TipoMovimiento\n        ORDER BY id\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                abreviatura: row.abreviatura,
                                nombre: row.nombre
                            }); })];
                }
            });
        });
    };
    TipoMovimientoRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        SELECT\n          id,\n          abreviatura,\n          nombre\n        FROM afi.TipoMovimiento\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                abreviatura: row.abreviatura,
                                nombre: row.nombre
                            }];
                }
            });
        });
    };
    TipoMovimientoRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (!data.nombre || data.nombre.trim().length === 0) {
                            throw new Error('Nombre is required');
                        }
                        if (data.nombre.length > 64) {
                            throw new Error('Nombre must not exceed 64 characters');
                        }
                        if (data.abreviatura && data.abreviatura.length > 1) {
                            throw new Error('Abreviatura must not exceed 1 character');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_1.default.Int, data.id)
                                .input('abreviatura', mssql_1.default.Char(1), data.abreviatura)
                                .input('nombre', mssql_1.default.NVarChar(64), data.nombre)
                                .query("\n        INSERT INTO afi.TipoMovimiento (id, abreviatura, nombre)\n        VALUES (@id, @abreviatura, @nombre)\n        SELECT\n          id,\n          abreviatura,\n          nombre\n        FROM afi.TipoMovimiento\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                abreviatura: row.abreviatura,
                                nombre: row.nombre
                            }];
                }
            });
        });
    };
    TipoMovimientoRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request, updateQuery, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (data.nombre !== undefined) {
                            if (!data.nombre || data.nombre.trim().length === 0) {
                                throw new Error('Nombre is required');
                            }
                            if (data.nombre.length > 64) {
                                throw new Error('Nombre must not exceed 64 characters');
                            }
                        }
                        if (data.abreviatura !== undefined && data.abreviatura && data.abreviatura.length > 1) {
                            throw new Error('Abreviatura must not exceed 1 character');
                        }
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_1.default.Int, id);
                        if (data.abreviatura !== undefined) {
                            updates.push('abreviatura = @abreviatura');
                            request.input('abreviatura', mssql_1.default.Char(1), data.abreviatura);
                        }
                        if (data.nombre !== undefined) {
                            updates.push('nombre = @nombre');
                            request.input('nombre', mssql_1.default.NVarChar(64), data.nombre);
                        }
                        if (updates.length === 0) {
                            throw new Error('No fields to update');
                        }
                        updateQuery = "\n      UPDATE afi.TipoMovimiento\n      SET ".concat(updates.join(', '), "\n      WHERE id = @id\n      SELECT\n        id,\n        abreviatura,\n        nombre\n      FROM afi.TipoMovimiento\n      WHERE id = @id\n    ");
                        return [4 /*yield*/, request.query(updateQuery)];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row) {
                            throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
                        }
                        return [2 /*return*/, {
                                id: row.id,
                                abreviatura: row.abreviatura,
                                nombre: row.nombre
                            }];
                }
            });
        });
    };
    TipoMovimientoRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        DELETE FROM afi.TipoMovimiento\n        WHERE id = @id\n        SELECT @@ROWCOUNT as deletedCount\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset[0].deletedCount === 0) {
                            throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return TipoMovimientoRepository;
}());
exports.TipoMovimientoRepository = TipoMovimientoRepository;
