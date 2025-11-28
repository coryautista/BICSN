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
exports.ModuloRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var ModuloRepository = /** @class */ (function () {
    function ModuloRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    ModuloRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.Int, id)
                            .query("\n        SELECT\n          id,\n          nombre,\n          tipo,\n          icono,\n          orden\n        FROM dbo.Modulo\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToModulo(row)];
                }
            });
        });
    };
    ModuloRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .query("\n        SELECT\n          id,\n          nombre,\n          tipo,\n          icono,\n          orden\n        FROM dbo.Modulo\n        ORDER BY orden ASC, nombre ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToModulo(row); })];
                }
            });
        });
    };
    ModuloRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre)
                            .input('tipo', mssql_js_1.sql.VarChar(50), data.tipo)
                            .input('icono', mssql_js_1.sql.NVarChar(100), data.icono || null)
                            .input('orden', mssql_js_1.sql.Int, data.orden || 0)
                            .query("\n        INSERT INTO dbo.Modulo (nombre, tipo, icono, orden)\n        OUTPUT INSERTED.*\n        VALUES (@nombre, @tipo, @icono, @orden)\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.mapRowToModulo(result.recordset[0])];
                }
            });
        });
    };
    ModuloRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request, current, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_js_1.sql.Int, id);
                        if (data.nombre !== undefined) {
                            request.input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre);
                            updates.push('nombre = @nombre');
                        }
                        if (data.tipo !== undefined) {
                            request.input('tipo', mssql_js_1.sql.VarChar(50), data.tipo);
                            updates.push('tipo = @tipo');
                        }
                        if (data.icono !== undefined) {
                            request.input('icono', mssql_js_1.sql.NVarChar(100), data.icono);
                            updates.push('icono = @icono');
                        }
                        if (data.orden !== undefined) {
                            request.input('orden', mssql_js_1.sql.Int, data.orden);
                            updates.push('orden = @orden');
                        }
                        if (!(updates.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(id)];
                    case 1:
                        current = _a.sent();
                        if (!current)
                            throw new Error('MODULO_NOT_FOUND');
                        return [2 /*return*/, current];
                    case 2: return [4 /*yield*/, request.query("\n      UPDATE dbo.Modulo\n      SET ".concat(updates.join(', '), "\n      OUTPUT INSERTED.*\n      WHERE id = @id\n    "))];
                    case 3:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            throw new Error('MODULO_NOT_FOUND');
                        return [2 /*return*/, this.mapRowToModulo(row)];
                }
            });
        });
    };
    ModuloRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.Int, id)
                            .query("\n        DELETE FROM dbo.Modulo\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowsAffected[0] > 0];
                }
            });
        });
    };
    ModuloRepository.prototype.findByName = function (nombre) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('nombre', mssql_js_1.sql.NVarChar(255), nombre)
                            .query("\n        SELECT\n          id,\n          nombre,\n          tipo,\n          icono,\n          orden\n        FROM dbo.Modulo\n        WHERE nombre = @nombre\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToModulo(row)];
                }
            });
        });
    };
    ModuloRepository.prototype.isInUse = function (moduloId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('moduloId', mssql_js_1.sql.Int, moduloId)
                            .query("\n        SELECT COUNT(*) as count\n        FROM dbo.Modulo\n        WHERE id = @moduloId\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset[0].count > 0];
                }
            });
        });
    };
    ModuloRepository.prototype.mapRowToModulo = function (row) {
        return {
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            icono: row.icono,
            orden: row.orden
        };
    };
    return ModuloRepository;
}());
exports.ModuloRepository = ModuloRepository;
