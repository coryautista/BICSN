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
exports.MovimientoRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var MovimientoRepository = /** @class */ (function () {
    function MovimientoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    MovimientoRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id, quincenaId, tipoMovimientoId, afiliadoId, fecha,\n        observaciones, folio, estatus, creadoPor, creadoPorUid, createdAt\n      FROM afi.Movimiento\n      ORDER BY id\n    ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) {
                                var _a, _b;
                                return ({
                                    id: row.id,
                                    quincenaId: row.quincenaId,
                                    tipoMovimientoId: row.tipoMovimientoId,
                                    afiliadoId: row.afiliadoId,
                                    fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    observaciones: row.observaciones,
                                    folio: row.folio,
                                    estatus: row.estatus,
                                    creadoPor: row.creadoPor,
                                    creadoPorUid: row.creadoPorUid,
                                    createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    MovimientoRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.Int, id)
                            .query("\n        SELECT\n          id, quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid, createdAt\n        FROM afi.Movimiento\n        WHERE id = @id\n      ")];
                    case 1:
                        r = _c.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                quincenaId: row.quincenaId,
                                tipoMovimientoId: row.tipoMovimientoId,
                                afiliadoId: row.afiliadoId,
                                fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                observaciones: row.observaciones,
                                folio: row.folio,
                                estatus: row.estatus,
                                creadoPor: row.creadoPor,
                                creadoPorUid: row.creadoPorUid,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    MovimientoRepository.prototype.findByAfiliadoId = function (afiliadoId) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('afiliadoId', mssql_js_1.sql.Int, afiliadoId)
                            .query("\n        SELECT\n          id, quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid, createdAt\n        FROM afi.Movimiento\n        WHERE afiliadoId = @afiliadoId\n        ORDER BY id\n      ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) {
                                var _a, _b;
                                return ({
                                    id: row.id,
                                    quincenaId: row.quincenaId,
                                    tipoMovimientoId: row.tipoMovimientoId,
                                    afiliadoId: row.afiliadoId,
                                    fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    observaciones: row.observaciones,
                                    folio: row.folio,
                                    estatus: row.estatus,
                                    creadoPor: row.creadoPor,
                                    creadoPorUid: row.creadoPorUid,
                                    createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    MovimientoRepository.prototype.findByTipoMovimientoId = function (tipoMovimientoId) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('tipoMovimientoId', mssql_js_1.sql.Int, tipoMovimientoId)
                            .query("\n        SELECT\n          id, quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid, createdAt\n        FROM afi.Movimiento\n        WHERE tipoMovimientoId = @tipoMovimientoId\n        ORDER BY id\n      ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) {
                                var _a, _b;
                                return ({
                                    id: row.id,
                                    quincenaId: row.quincenaId,
                                    tipoMovimientoId: row.tipoMovimientoId,
                                    afiliadoId: row.afiliadoId,
                                    fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    observaciones: row.observaciones,
                                    folio: row.folio,
                                    estatus: row.estatus,
                                    creadoPor: row.creadoPor,
                                    creadoPorUid: row.creadoPorUid,
                                    createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    MovimientoRepository.prototype.findByFolio = function (folio) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('folio', mssql_js_1.sql.VarChar(100), folio)
                            .query("\n        SELECT\n          id, quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid, createdAt\n        FROM afi.Movimiento\n        WHERE folio = @folio\n      ")];
                    case 1:
                        r = _c.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                quincenaId: row.quincenaId,
                                tipoMovimientoId: row.tipoMovimientoId,
                                afiliadoId: row.afiliadoId,
                                fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                observaciones: row.observaciones,
                                folio: row.folio,
                                estatus: row.estatus,
                                creadoPor: row.creadoPor,
                                creadoPorUid: row.creadoPorUid,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    MovimientoRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('quincenaId', mssql_js_1.sql.VarChar(30), data.quincenaId)
                            .input('tipoMovimientoId', mssql_js_1.sql.Int, data.tipoMovimientoId)
                            .input('afiliadoId', mssql_js_1.sql.Int, data.afiliadoId)
                            .input('fecha', mssql_js_1.sql.Date, data.fecha ? new Date(data.fecha) : null)
                            .input('observaciones', mssql_js_1.sql.NVarChar(1024), data.observaciones)
                            .input('folio', mssql_js_1.sql.VarChar(100), data.folio)
                            .input('estatus', mssql_js_1.sql.VarChar(30), data.estatus)
                            .input('creadoPor', mssql_js_1.sql.Int, data.creadoPor)
                            .input('creadoPorUid', mssql_js_1.sql.UniqueIdentifier, data.creadoPorUid)
                            .query("\n        INSERT INTO afi.Movimiento (\n          quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid\n        )\n        OUTPUT INSERTED.*\n        VALUES (\n          @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha,\n          @observaciones, @folio, @estatus, @creadoPor, @creadoPorUid\n        )\n      ")];
                    case 1:
                        r = _c.sent();
                        row = r.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                quincenaId: row.quincenaId,
                                tipoMovimientoId: row.tipoMovimientoId,
                                afiliadoId: row.afiliadoId,
                                fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                observaciones: row.observaciones,
                                folio: row.folio,
                                estatus: row.estatus,
                                creadoPor: row.creadoPor,
                                creadoPorUid: row.creadoPorUid,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    MovimientoRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request, r, row;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_js_1.sql.Int, data.id);
                        if (data.quincenaId !== undefined) {
                            updates.push('quincenaId = @quincenaId');
                            request.input('quincenaId', mssql_js_1.sql.VarChar(30), data.quincenaId);
                        }
                        if (data.tipoMovimientoId !== undefined) {
                            updates.push('tipoMovimientoId = @tipoMovimientoId');
                            request.input('tipoMovimientoId', mssql_js_1.sql.Int, data.tipoMovimientoId);
                        }
                        if (data.afiliadoId !== undefined) {
                            updates.push('afiliadoId = @afiliadoId');
                            request.input('afiliadoId', mssql_js_1.sql.Int, data.afiliadoId);
                        }
                        if (data.fecha !== undefined) {
                            updates.push('fecha = @fecha');
                            request.input('fecha', mssql_js_1.sql.Date, data.fecha ? new Date(data.fecha) : null);
                        }
                        if (data.observaciones !== undefined) {
                            updates.push('observaciones = @observaciones');
                            request.input('observaciones', mssql_js_1.sql.NVarChar(1024), data.observaciones);
                        }
                        if (data.folio !== undefined) {
                            updates.push('folio = @folio');
                            request.input('folio', mssql_js_1.sql.VarChar(100), data.folio);
                        }
                        if (data.estatus !== undefined) {
                            updates.push('estatus = @estatus');
                            request.input('estatus', mssql_js_1.sql.VarChar(30), data.estatus);
                        }
                        if (data.creadoPor !== undefined) {
                            updates.push('creadoPor = @creadoPor');
                            request.input('creadoPor', mssql_js_1.sql.Int, data.creadoPor);
                        }
                        if (data.creadoPorUid !== undefined) {
                            updates.push('creadoPorUid = @creadoPorUid');
                            request.input('creadoPorUid', mssql_js_1.sql.UniqueIdentifier, data.creadoPorUid);
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE afi.Movimiento\n      SET ".concat(updates.join(', '), "\n      OUTPUT INSERTED.*\n      WHERE id = @id\n    "))];
                    case 1:
                        r = _c.sent();
                        row = r.recordset[0];
                        if (!row)
                            throw new Error('MOVIMIENTO_NOT_FOUND');
                        return [2 /*return*/, {
                                id: row.id,
                                quincenaId: row.quincenaId,
                                tipoMovimientoId: row.tipoMovimientoId,
                                afiliadoId: row.afiliadoId,
                                fecha: ((_a = row.fecha) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                observaciones: row.observaciones,
                                folio: row.folio,
                                estatus: row.estatus,
                                creadoPor: row.creadoPor,
                                creadoPorUid: row.creadoPorUid,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    MovimientoRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.Int, id)
                            .query("\n        DELETE FROM afi.Movimiento\n        WHERE id = @id\n        SELECT @@ROWCOUNT as deletedCount\n      ")];
                    case 1:
                        r = _a.sent();
                        if (r.recordset[0].deletedCount === 0) {
                            throw new Error('MOVIMIENTO_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return MovimientoRepository;
}());
exports.MovimientoRepository = MovimientoRepository;
