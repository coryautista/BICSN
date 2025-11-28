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
exports.RoleRepository = void 0;
var mssql_1 = require("mssql");
var context_js_1 = require("../../../../db/context.js");
var RoleRepository = /** @class */ (function () {
    function RoleRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    RoleRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        CAST(id AS NVARCHAR(50)) as id,\n        name,\n        description,\n        CAST(isSystem AS BIT) as isSystem,\n        CAST(isEntidad AS BIT) as isEntidad,\n        createdAt\n      FROM auth.role\n      ORDER BY name ASC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                name: row.name,
                                description: row.description,
                                isSystem: row.isSystem === 1 || row.isSystem === true,
                                isEntidad: row.isEntidad === 1 || row.isEntidad === true,
                                createdAt: row.createdAt
                            }); })];
                }
            });
        });
    };
    RoleRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.UniqueIdentifier, id)
                            .query("\n        SELECT TOP 1\n          CAST(id AS NVARCHAR(50)) as id,\n          name,\n          description,\n          isSystem,\n          isEntidad,\n          createdAt\n        FROM auth.role\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                name: row.name,
                                description: row.description,
                                isSystem: row.isSystem === 1 || row.isSystem === true,
                                isEntidad: row.isEntidad === 1 || row.isEntidad === true,
                                createdAt: row.createdAt
                            }];
                }
            });
        });
    };
    RoleRepository.prototype.findByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('name', mssql_1.default.NVarChar(100), name)
                            .query("\n        SELECT TOP 1\n          CAST(id AS NVARCHAR(50)) as id,\n          name,\n          description,\n          isSystem,\n          isEntidad,\n          createdAt\n        FROM auth.role\n        WHERE normalizedName = UPPER(@name)\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                name: row.name,
                                description: row.description,
                                isSystem: row.isSystem === 1 || row.isSystem === true,
                                isEntidad: row.isEntidad === 1 || row.isEntidad === true,
                                createdAt: row.createdAt
                            }];
                }
            });
        });
    };
    RoleRepository.prototype.create = function (data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req, result, row;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validaciones
                        if (!data.name || data.name.trim().length === 0) {
                            throw new Error('Role name is required');
                        }
                        if (data.name.length > 100) {
                            throw new Error('Role name must not exceed 100 characters');
                        }
                        if (data.description && data.description.length > 300) {
                            throw new Error('Role description must not exceed 300 characters');
                        }
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('name', mssql_1.default.NVarChar(100), data.name)
                                .input('description', mssql_1.default.NVarChar(300), (_a = data.description) !== null && _a !== void 0 ? _a : null)
                                .input('isSystem', mssql_1.default.Bit, data.isSystem ? 1 : 0)
                                .input('isEntidad', mssql_1.default.Bit, data.isEntidad ? 1 : 0)
                                .query("\n        INSERT INTO auth.role (name, description, isSystem, isEntidad)\n        OUTPUT\n          CAST(INSERTED.id AS NVARCHAR(50)) as id,\n          INSERTED.name,\n          INSERTED.description,\n          INSERTED.isSystem,\n          INSERTED.isEntidad,\n          INSERTED.createdAt\n        VALUES (@name, @description, @isSystem, @isEntidad)\n      ")];
                    case 1:
                        result = _b.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                name: row.name,
                                description: row.description,
                                isSystem: row.isSystem === 1 || row.isSystem === true,
                                isEntidad: row.isEntidad === 1 || row.isEntidad === true,
                                createdAt: row.createdAt
                            }];
                }
            });
        });
    };
    RoleRepository.prototype.createWithoutOutput = function (data, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validaciones
                        if (!data.name || data.name.trim().length === 0) {
                            throw new Error('Role name is required');
                        }
                        if (data.name.length > 100) {
                            throw new Error('Role name must not exceed 100 characters');
                        }
                        if (data.description && data.description.length > 300) {
                            throw new Error('Role description must not exceed 300 characters');
                        }
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('name', mssql_1.default.NVarChar(100), data.name)
                                .input('description', mssql_1.default.NVarChar(300), (_a = data.description) !== null && _a !== void 0 ? _a : null)
                                .input('isSystem', mssql_1.default.Bit, data.isSystem ? 1 : 0)
                                .input('isEntidad', mssql_1.default.Bit, data.isEntidad ? 1 : 0)
                                .query("\n        INSERT INTO auth.role (name, description, isSystem, isEntidad)\n        VALUES (@name, @description, @isSystem, @isEntidad)\n      ")];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RoleRepository.prototype.findUserById = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('uid', mssql_1.default.UniqueIdentifier, userId)
                            .query("\n        SELECT TOP 1\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3\n        FROM auth.[user]\n        WHERE id = @uid\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                username: row.username,
                                email: row.email,
                                displayName: row.displayName,
                                photoPath: row.photoPath,
                                idOrganica0: row.idOrganica0,
                                idOrganica1: row.idOrganica1,
                                idOrganica2: row.idOrganica2,
                                idOrganica3: row.idOrganica3
                            }];
                }
            });
        });
    };
    RoleRepository.prototype.assignUserRole = function (userId, roleId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('uid', mssql_1.default.UniqueIdentifier, userId)
                                .input('rid', mssql_1.default.UniqueIdentifier, roleId)
                                .query("\n        IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @uid AND roleId = @rid)\n        INSERT INTO auth.userRole (userId, roleId) VALUES (@uid, @rid)\n      ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RoleRepository.prototype.unassignUserRole = function (userId, roleId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('uid', mssql_1.default.UniqueIdentifier, userId)
                                .input('rid', mssql_1.default.UniqueIdentifier, roleId)
                                .query("DELETE FROM auth.userRole WHERE userId = @uid AND roleId = @rid")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return RoleRepository;
}());
exports.RoleRepository = RoleRepository;
