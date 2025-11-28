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
exports.MenuRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var MenuRepository = /** @class */ (function () {
    function MenuRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    MenuRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid menu id: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, id)
                                .query("\n        SELECT\n          id,\n          nombre,\n          componente,\n          parentId,\n          icono,\n          orden\n        FROM dbo.Menu\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToMenu(row)];
                }
            });
        });
    };
    MenuRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id,\n        nombre,\n        componente,\n        parentId,\n        icono,\n        orden\n      FROM dbo.Menu\n      ORDER BY orden ASC, nombre ASC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToMenu(row); })];
                }
            });
        });
    };
    MenuRepository.prototype.findByName = function (nombre) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!nombre || nombre.trim().length === 0) {
                            throw new Error('Invalid nombre: cannot be empty');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('nombre', mssql_js_1.sql.NVarChar(255), nombre.trim())
                                .query("\n        SELECT\n          id,\n          nombre,\n          componente,\n          parentId,\n          icono,\n          orden\n        FROM dbo.Menu\n        WHERE nombre = @nombre\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToMenu(row)];
                }
            });
        });
    };
    MenuRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var maxIdResult, nextId, result;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!data.nombre || data.nombre.trim().length === 0) {
                            throw new Error('Invalid nombre: cannot be empty');
                        }
                        if (data.orden === undefined || data.orden < 0) {
                            throw new Error('Invalid orden: must be a non-negative number');
                        }
                        if (data.parentId !== undefined && data.parentId !== null && data.parentId <= 0) {
                            throw new Error('Invalid parentId: must be a positive number or undefined');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .query("SELECT ISNULL(MAX(id), 0) + 1 as nextId FROM dbo.Menu")];
                    case 1:
                        maxIdResult = _d.sent();
                        nextId = maxIdResult.recordset[0].nextId;
                        // Insert with explicit ID (table doesn't have IDENTITY)
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, nextId)
                                .input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre)
                                .input('componente', mssql_js_1.sql.NVarChar(255), (_a = data.componente) !== null && _a !== void 0 ? _a : null)
                                .input('parentId', mssql_js_1.sql.Int, (_b = data.parentId) !== null && _b !== void 0 ? _b : null)
                                .input('icono', mssql_js_1.sql.NVarChar(255), (_c = data.icono) !== null && _c !== void 0 ? _c : null)
                                .input('orden', mssql_js_1.sql.Int, data.orden)
                                .query("\n        INSERT INTO dbo.Menu (id, nombre, componente, parentId, icono, orden)\n        VALUES (@id, @nombre, @componente, @parentId, @icono, @orden)\n      ")];
                    case 2:
                        // Insert with explicit ID (table doesn't have IDENTITY)
                        _d.sent();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, nextId)
                                .query("\n        SELECT\n          id,\n          nombre,\n          componente,\n          parentId,\n          icono,\n          orden\n        FROM dbo.Menu\n        WHERE id = @id\n      ")];
                    case 3:
                        result = _d.sent();
                        return [2 /*return*/, this.mapRowToMenu(result.recordset[0])];
                }
            });
        });
    };
    MenuRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid menu id: must be a positive number');
                        }
                        if (data.nombre !== undefined && (!data.nombre || data.nombre.trim().length === 0)) {
                            throw new Error('Invalid nombre: cannot be empty');
                        }
                        if (data.orden !== undefined && data.orden < 0) {
                            throw new Error('Invalid orden: must be a non-negative number');
                        }
                        if (data.parentId !== undefined && data.parentId !== null && data.parentId <= 0) {
                            throw new Error('Invalid parentId: must be a positive number or undefined');
                        }
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_js_1.sql.Int, id);
                        if (data.nombre !== undefined) {
                            updates.push('nombre = @nombre');
                            request.input('nombre', mssql_js_1.sql.NVarChar(255), data.nombre);
                        }
                        if (data.componente !== undefined) {
                            updates.push('componente = @componente');
                            request.input('componente', mssql_js_1.sql.NVarChar(255), data.componente);
                        }
                        if (data.parentId !== undefined) {
                            updates.push('parentId = @parentId');
                            request.input('parentId', mssql_js_1.sql.Int, data.parentId);
                        }
                        if (data.icono !== undefined) {
                            updates.push('icono = @icono');
                            request.input('icono', mssql_js_1.sql.NVarChar(255), data.icono);
                        }
                        if (data.orden !== undefined) {
                            updates.push('orden = @orden');
                            request.input('orden', mssql_js_1.sql.Int, data.orden);
                        }
                        if (updates.length === 0) {
                            // No updates to perform, just return the current record
                            return [2 /*return*/, this.findById(id)];
                        }
                        return [4 /*yield*/, request.query("\n      UPDATE dbo.Menu\n      SET ".concat(updates.join(', '), "\n      WHERE id = @id\n    "))];
                    case 1:
                        _a.sent();
                        // Retrieve the updated record
                        return [2 /*return*/, this.findById(id)];
                }
            });
        });
    };
    MenuRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id <= 0) {
                            throw new Error('Invalid menu id: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('id', mssql_js_1.sql.Int, id)
                                .query("\n        DELETE FROM dbo.Menu\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowsAffected[0] > 0];
                }
            });
        });
    };
    MenuRepository.prototype.hasChildren = function (parentId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('parentId', mssql_js_1.sql.Int, parentId)
                            .query("\n        SELECT COUNT(*) as count\n        FROM dbo.Menu\n        WHERE parentId = @parentId\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset[0].count > 0];
                }
            });
        });
    };
    MenuRepository.prototype.mapRowToMenu = function (row) {
        return {
            id: row.id,
            nombre: row.nombre,
            componente: row.componente,
            parentId: row.parentId,
            icono: row.icono,
            orden: row.orden
        };
    };
    return MenuRepository;
}());
exports.MenuRepository = MenuRepository;
