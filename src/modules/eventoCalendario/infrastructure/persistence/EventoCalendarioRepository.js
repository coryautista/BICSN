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
exports.EventoCalendarioRepository = void 0;
var mssql_1 = require("mssql");
var EventoCalendarioRepository = /** @class */ (function () {
    function EventoCalendarioRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    EventoCalendarioRepository.prototype.mapRowToEventoCalendario = function (row) {
        return {
            id: row.id,
            fecha: row.fecha,
            tipo: row.tipo,
            anio: row.anio,
            createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
        };
    };
    EventoCalendarioRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        SELECT\n          id,\n          CONVERT(VARCHAR(10), fecha, 23) as fecha,\n          tipo,\n          anio,\n          createdAt\n        FROM dbo.EventoCalendario\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToEventoCalendario(result.recordset[0])];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id,\n        CONVERT(VARCHAR(10), fecha, 23) as fecha,\n        tipo,\n        anio,\n        createdAt\n      FROM dbo.EventoCalendario\n      ORDER BY fecha DESC, createdAt DESC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(this.mapRowToEventoCalendario)];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.findByAnio = function (anio) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('anio', mssql_1.default.Int, anio)
                            .query("\n        SELECT\n          id,\n          CONVERT(VARCHAR(10), fecha, 23) as fecha,\n          tipo,\n          anio,\n          createdAt\n        FROM dbo.EventoCalendario\n        WHERE anio = @anio\n        ORDER BY fecha ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(this.mapRowToEventoCalendario)];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.findByDateRange = function (fechaInicio, fechaFin, tipo) {
        return __awaiter(this, void 0, void 0, function () {
            var request, query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = this.mssqlPool.request()
                            .input('fechaInicio', mssql_1.default.Date, fechaInicio)
                            .input('fechaFin', mssql_1.default.Date, fechaFin);
                        query = "\n      SELECT\n        id,\n        CONVERT(VARCHAR(10), fecha, 23) as fecha,\n        tipo,\n        anio,\n        createdAt\n      FROM dbo.EventoCalendario\n      WHERE fecha BETWEEN @fechaInicio AND @fechaFin\n    ";
                        if (tipo) {
                            request.input('tipo', mssql_1.default.NVarChar(50), tipo);
                            query += " AND tipo = @tipo";
                        }
                        query += " ORDER BY fecha ASC";
                        return [4 /*yield*/, request.query(query)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(this.mapRowToEventoCalendario)];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var createdAt, checkResult, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createdAt = data.createdAt || new Date().toISOString();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('fecha', mssql_1.default.Date, data.fecha)
                                .input('tipo', mssql_1.default.NVarChar(50), data.tipo)
                                .query("\n        SELECT id FROM dbo.EventoCalendario\n        WHERE fecha = @fecha AND tipo = @tipo\n      ")];
                    case 1:
                        checkResult = _a.sent();
                        if (checkResult.recordset.length > 0) {
                            throw new Error('EVENTO_CALENDARIO_ALREADY_EXISTS');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('fecha', mssql_1.default.Date, data.fecha)
                                .input('tipo', mssql_1.default.NVarChar(50), data.tipo)
                                .input('anio', mssql_1.default.Int, data.anio)
                                .input('createdAt', mssql_1.default.DateTime2, createdAt)
                                .query("\n        INSERT INTO dbo.EventoCalendario (fecha, tipo, anio, createdAt)\n        VALUES (@fecha, @tipo, @anio, @createdAt);\n\n        SELECT\n          id,\n          CONVERT(VARCHAR(10), fecha, 23) as fecha,\n          tipo,\n          anio,\n          createdAt\n        FROM dbo.EventoCalendario\n        WHERE id = SCOPE_IDENTITY()\n      ")];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, this.mapRowToEventoCalendario(result.recordset[0])];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sets, request, updateQuery, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sets = [];
                        request = this.mssqlPool.request().input('id', mssql_1.default.Int, data.id);
                        if (data.fecha !== undefined) {
                            request.input('fecha', mssql_1.default.Date, data.fecha);
                            sets.push('fecha = @fecha');
                        }
                        if (data.tipo !== undefined) {
                            request.input('tipo', mssql_1.default.NVarChar(50), data.tipo);
                            sets.push('tipo = @tipo');
                        }
                        if (data.anio !== undefined) {
                            request.input('anio', mssql_1.default.Int, data.anio);
                            sets.push('anio = @anio');
                        }
                        if (data.createdAt !== undefined) {
                            request.input('createdAt', mssql_1.default.DateTime2, data.createdAt);
                            sets.push('createdAt = @createdAt');
                        }
                        if (sets.length === 0) {
                            throw new Error('EVENTO_CALENDARIO_NO_UPDATE_DATA');
                        }
                        updateQuery = "\n      UPDATE dbo.EventoCalendario\n      SET ".concat(sets.join(', '), "\n      WHERE id = @id;\n\n      SELECT\n        id,\n        CONVERT(VARCHAR(10), fecha, 23) as fecha,\n        tipo,\n        anio,\n        createdAt\n      FROM dbo.EventoCalendario\n      WHERE id = @id\n    ");
                        return [4 /*yield*/, request.query(updateQuery)];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0) {
                            throw new Error('EVENTO_CALENDARIO_NOT_FOUND');
                        }
                        return [2 /*return*/, this.mapRowToEventoCalendario(result.recordset[0])];
                }
            });
        });
    };
    EventoCalendarioRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        DELETE FROM dbo.EventoCalendario\n        WHERE id = @id;\n        SELECT @@ROWCOUNT AS affected;\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset[0].affected === 0) {
                            throw new Error('EVENTO_CALENDARIO_NOT_FOUND');
                        }
                        return [2 /*return*/, id];
                }
            });
        });
    };
    return EventoCalendarioRepository;
}());
exports.EventoCalendarioRepository = EventoCalendarioRepository;
