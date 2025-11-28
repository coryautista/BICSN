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
exports.ExpedienteRepository = void 0;
var mssql_1 = require("mssql");
var ExpedienteRepository = /** @class */ (function () {
    function ExpedienteRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    ExpedienteRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        CURP,\n        AfiliadoId,\n        Interno,\n        Estado,\n        Notas,\n        CreatedAt,\n        UpdatedAt\n      FROM doc.Expediente\n      ORDER BY CreatedAt DESC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                curp: row.CURP,
                                afiliadoId: row.AfiliadoId,
                                interno: row.Interno,
                                estado: row.Estado,
                                notas: row.Notas,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt
                            }); })];
                }
            });
        });
    };
    ExpedienteRepository.prototype.findByCurp = function (curp) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('curp', mssql_1.default.Char(18), curp)
                            .query("\n        SELECT\n          CURP,\n          AfiliadoId,\n          Interno,\n          Estado,\n          Notas,\n          CreatedAt,\n          UpdatedAt\n        FROM doc.Expediente\n        WHERE CURP = @curp\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                curp: row.CURP,
                                afiliadoId: row.AfiliadoId,
                                interno: row.Interno,
                                estado: row.Estado,
                                notas: row.Notas,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt
                            }];
                }
            });
        });
    };
    ExpedienteRepository.prototype.create = function (data, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('curp', mssql_1.default.Char(18), data.curp)
                            .input('afiliadoId', mssql_1.default.BigInt, data.afiliadoId)
                            .input('interno', mssql_1.default.Int, data.interno)
                            .input('estado', mssql_1.default.VarChar(20), data.estado)
                            .input('notas', mssql_1.default.NVarChar(300), data.notas)
                            .query("\n        INSERT INTO doc.Expediente (CURP, AfiliadoId, Interno, Estado, Notas)\n        OUTPUT\n          INSERTED.CURP,\n          INSERTED.AfiliadoId,\n          INSERTED.Interno,\n          INSERTED.Estado,\n          INSERTED.Notas,\n          INSERTED.CreatedAt,\n          INSERTED.UpdatedAt\n        VALUES (@curp, @afiliadoId, @interno, @estado, @notas)\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                curp: row.CURP,
                                afiliadoId: row.AfiliadoId,
                                interno: row.Interno,
                                estado: row.Estado,
                                notas: row.Notas,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt
                            }];
                }
            });
        });
    };
    ExpedienteRepository.prototype.update = function (data, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updates, request, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findByCurp(data.curp)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('EXPEDIENTE_NOT_FOUND');
                        }
                        updates = [];
                        request = this.mssqlPool.request();
                        request.input('curp', mssql_1.default.Char(18), data.curp);
                        if (data.afiliadoId !== undefined) {
                            updates.push('AfiliadoId = @afiliadoId');
                            request.input('afiliadoId', mssql_1.default.BigInt, data.afiliadoId);
                        }
                        if (data.interno !== undefined) {
                            updates.push('Interno = @interno');
                            request.input('interno', mssql_1.default.Int, data.interno);
                        }
                        if (data.estado !== undefined) {
                            updates.push('Estado = @estado');
                            request.input('estado', mssql_1.default.VarChar(20), data.estado);
                        }
                        if (data.notas !== undefined) {
                            updates.push('Notas = @notas');
                            request.input('notas', mssql_1.default.NVarChar(300), data.notas);
                        }
                        updates.push('UpdatedAt = SYSUTCDATETIME()');
                        return [4 /*yield*/, request.query("\n      UPDATE doc.Expediente\n      SET ".concat(updates.join(', '), "\n      OUTPUT\n        INSERTED.CURP,\n        INSERTED.AfiliadoId,\n        INSERTED.Interno,\n        INSERTED.Estado,\n        INSERTED.Notas,\n        INSERTED.CreatedAt,\n        INSERTED.UpdatedAt\n      WHERE CURP = @curp\n    "))];
                    case 2:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                curp: row.CURP,
                                afiliadoId: row.AfiliadoId,
                                interno: row.Interno,
                                estado: row.Estado,
                                notas: row.Notas,
                                createdAt: row.CreatedAt,
                                updatedAt: row.UpdatedAt
                            }];
                }
            });
        });
    };
    ExpedienteRepository.prototype.delete = function (curp) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findByCurp(curp)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('EXPEDIENTE_NOT_FOUND');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('curp', mssql_1.default.Char(18), curp)
                                .query("\n        DELETE FROM doc.Expediente\n        WHERE CURP = @curp\n      ")];
                    case 2:
                        result = _a.sent();
                        if (result.rowsAffected[0] === 0) {
                            throw new Error('EXPEDIENTE_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return ExpedienteRepository;
}());
exports.ExpedienteRepository = ExpedienteRepository;
