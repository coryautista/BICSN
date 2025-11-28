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
exports.ProcesoRepository = void 0;
var mssql_1 = require("mssql");
var ProcesoRepository = /** @class */ (function () {
    function ProcesoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    ProcesoRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id,\n        nombre,\n        componente,\n        idModulo,\n        orden,\n        tipo\n      FROM dbo.Proceso\n      ORDER BY orden ASC, nombre ASC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                nombre: row.nombre,
                                componente: row.componente,
                                idModulo: row.idModulo,
                                orden: row.orden,
                                tipo: row.tipo
                            }); })];
                }
            });
        });
    };
    ProcesoRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0 || !Number.isInteger(id)) {
                            throw new Error('Invalid id: must be a positive integer');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_1.default.Int, id)
                                .query("\n        SELECT\n          id,\n          nombre,\n          componente,\n          idModulo,\n          orden,\n          tipo\n        FROM dbo.Proceso\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                nombre: row.nombre,
                                componente: row.componente,
                                idModulo: row.idModulo,
                                orden: row.orden,
                                tipo: row.tipo
                            }];
                }
            });
        });
    };
    ProcesoRepository.prototype.create = function (data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var pool, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validations
                        if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0 || data.nombre.length > 4000) {
                            throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
                        }
                        if (!data.componente || typeof data.componente !== 'string' || data.componente.length > 4000) {
                            throw new Error('Invalid componente: must be a string with max 4000 characters');
                        }
                        if (!data.idModulo || data.idModulo <= 0 || !Number.isInteger(data.idModulo)) {
                            throw new Error('Invalid idModulo: must be a positive integer');
                        }
                        if (data.orden === undefined || data.orden < 0 || !Number.isInteger(data.orden)) {
                            throw new Error('Invalid orden: must be a non-negative integer');
                        }
                        if (!data.tipo || typeof data.tipo !== 'string' || data.tipo.trim().length === 0 || data.tipo.length > 50) {
                            throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
                        }
                        pool = tx || this.mssqlPool;
                        return [4 /*yield*/, pool.request()
                                .input('nombre', mssql_1.default.NVarChar(4000), data.nombre)
                                .input('componente', mssql_1.default.NVarChar(4000), data.componente)
                                .input('idModulo', mssql_1.default.Int, data.idModulo)
                                .input('orden', mssql_1.default.Int, data.orden)
                                .input('tipo', mssql_1.default.NVarChar(50), data.tipo)
                                .query("\n        INSERT INTO dbo.Proceso (nombre, componente, idModulo, orden, tipo)\n        OUTPUT\n          INSERTED.id,\n          INSERTED.nombre,\n          INSERTED.componente,\n          INSERTED.idModulo,\n          INSERTED.orden,\n          INSERTED.tipo\n        VALUES (@nombre, @componente, @idModulo, @orden, @tipo)\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                nombre: row.nombre,
                                componente: row.componente,
                                idModulo: row.idModulo,
                                orden: row.orden,
                                tipo: row.tipo
                            }];
                }
            });
        });
    };
    ProcesoRepository.prototype.update = function (id, data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var sets, pool, request, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0 || !Number.isInteger(id)) {
                            throw new Error('Invalid id: must be a positive integer');
                        }
                        // Validations
                        if (data.nombre !== undefined && (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0 || data.nombre.length > 4000)) {
                            throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
                        }
                        if (data.componente !== undefined && (!data.componente || typeof data.componente !== 'string' || data.componente.length > 4000)) {
                            throw new Error('Invalid componente: must be a string with max 4000 characters');
                        }
                        if (data.idModulo !== undefined && (!data.idModulo || data.idModulo <= 0 || !Number.isInteger(data.idModulo))) {
                            throw new Error('Invalid idModulo: must be a positive integer');
                        }
                        if (data.orden !== undefined && (data.orden < 0 || !Number.isInteger(data.orden))) {
                            throw new Error('Invalid orden: must be a non-negative integer');
                        }
                        if (data.tipo !== undefined && (!data.tipo || typeof data.tipo !== 'string' || data.tipo.trim().length === 0 || data.tipo.length > 50)) {
                            throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
                        }
                        sets = [];
                        pool = tx || this.mssqlPool;
                        request = pool.request().input('id', mssql_1.default.Int, id);
                        if (data.nombre !== undefined) {
                            request.input('nombre', mssql_1.default.NVarChar(4000), data.nombre);
                            sets.push('nombre = @nombre');
                        }
                        if (data.componente !== undefined) {
                            request.input('componente', mssql_1.default.NVarChar(4000), data.componente);
                            sets.push('componente = @componente');
                        }
                        if (data.idModulo !== undefined) {
                            request.input('idModulo', mssql_1.default.Int, data.idModulo);
                            sets.push('idModulo = @idModulo');
                        }
                        if (data.orden !== undefined) {
                            request.input('orden', mssql_1.default.Int, data.orden);
                            sets.push('orden = @orden');
                        }
                        if (data.tipo !== undefined) {
                            request.input('tipo', mssql_1.default.NVarChar(50), data.tipo);
                            sets.push('tipo = @tipo');
                        }
                        if (sets.length === 0) {
                            throw new Error('No fields to update');
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE dbo.Proceso\n      SET ".concat(sets.join(', '), "\n      OUTPUT\n        INSERTED.id,\n        INSERTED.nombre,\n        INSERTED.componente,\n        INSERTED.idModulo,\n        INSERTED.orden,\n        INSERTED.tipo\n      WHERE id = @id\n    "))];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                nombre: row.nombre,
                                componente: row.componente,
                                idModulo: row.idModulo,
                                orden: row.orden,
                                tipo: row.tipo
                            }];
                }
            });
        });
    };
    ProcesoRepository.prototype.delete = function (id, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var pool, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0 || !Number.isInteger(id)) {
                            throw new Error('Invalid id: must be a positive integer');
                        }
                        pool = tx || this.mssqlPool;
                        return [4 /*yield*/, pool.request()
                                .input('id', mssql_1.default.Int, id)
                                .query("\n        DELETE FROM dbo.Proceso\n        OUTPUT DELETED.id\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.length > 0];
                }
            });
        });
    };
    return ProcesoRepository;
}());
exports.ProcesoRepository = ProcesoRepository;
