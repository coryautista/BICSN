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
exports.UsuariosRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var UsuariosRepository = /** @class */ (function () {
    function UsuariosRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    UsuariosRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .query("\n        SELECT\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          isLockedOut,\n          lockoutEndAt,\n          accessFailedCount,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3,\n          createdAt,\n          updatedAt\n        FROM auth.[user]\n        ORDER BY createdAt DESC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return _this.mapRowToUsuario(row); })];
                }
            });
        });
    };
    UsuariosRepository.prototype.findById = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
                            throw new Error('Invalid usuarioId: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('userId', mssql_js_1.sql.VarChar(50), userId)
                                .query("\n        SELECT\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          isLockedOut,\n          lockoutEndAt,\n          accessFailedCount,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3,\n          createdAt,\n          updatedAt\n        FROM auth.[user]\n        WHERE id = @userId\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToUsuario(row)];
                }
            });
        });
    };
    UsuariosRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var selectResult;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('username', mssql_js_1.sql.NVarChar(100), data.username)
                            .input('email', mssql_js_1.sql.NVarChar(320), data.email)
                            .input('passwordHash', mssql_js_1.sql.NVarChar(255), data.passwordHash)
                            .input('passwordAlgo', mssql_js_1.sql.VarChar(20), data.passwordAlgo)
                            .input('displayName', mssql_js_1.sql.NVarChar(255), (_a = data.displayName) !== null && _a !== void 0 ? _a : null)
                            .input('photoPath', mssql_js_1.sql.NVarChar(255), (_b = data.photoPath) !== null && _b !== void 0 ? _b : null)
                            .input('idOrganica0', mssql_js_1.sql.NVarChar(2), (_d = (_c = data.idOrganica0) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : null)
                            .input('idOrganica1', mssql_js_1.sql.NVarChar(2), (_f = (_e = data.idOrganica1) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : null)
                            .input('idOrganica2', mssql_js_1.sql.NVarChar(2), (_h = (_g = data.idOrganica2) === null || _g === void 0 ? void 0 : _g.toString()) !== null && _h !== void 0 ? _h : null)
                            .input('idOrganica3', mssql_js_1.sql.NVarChar(2), (_k = (_j = data.idOrganica3) === null || _j === void 0 ? void 0 : _j.toString()) !== null && _k !== void 0 ? _k : null)
                            .query("\n        INSERT INTO auth.[user] (\n          username, email, passwordHash, passwordAlgo,\n          displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3\n        )\n        VALUES(\n          @username, @email, @passwordHash, @passwordAlgo,\n          @displayName, @photoPath, @idOrganica0, @idOrganica1, @idOrganica2, @idOrganica3\n        )\n      ")];
                    case 1:
                        _l.sent();
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('username', mssql_js_1.sql.NVarChar(100), data.username)
                                .query("\n        SELECT TOP 1\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          isLockedOut,\n          lockoutEndAt,\n          accessFailedCount,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3,\n          createdAt,\n          updatedAt\n        FROM auth.[user]\n        WHERE username = @username\n        ORDER BY createdAt DESC\n      ")];
                    case 2:
                        selectResult = _l.sent();
                        return [2 /*return*/, this.mapRowToUsuario(selectResult.recordset[0])];
                }
            });
        });
    };
    UsuariosRepository.prototype.update = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        updates = [];
                        request = this.mssqlPool.request().input('userId', mssql_js_1.sql.UniqueIdentifier, userId);
                        if (data.email !== undefined) {
                            updates.push('email = @email');
                            request.input('email', mssql_js_1.sql.NVarChar(320), data.email);
                        }
                        if (data.displayName !== undefined) {
                            updates.push('displayName = @displayName');
                            request.input('displayName', mssql_js_1.sql.NVarChar(255), data.displayName);
                        }
                        if (data.photoPath !== undefined) {
                            updates.push('photoPath = @photoPath');
                            request.input('photoPath', mssql_js_1.sql.NVarChar(255), data.photoPath);
                        }
                        if (data.idOrganica0 !== undefined) {
                            updates.push('idOrganica0 = @idOrganica0');
                            request.input('idOrganica0', mssql_js_1.sql.NVarChar(2), (_b = (_a = data.idOrganica0) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null);
                        }
                        if (data.idOrganica1 !== undefined) {
                            updates.push('idOrganica1 = @idOrganica1');
                            request.input('idOrganica1', mssql_js_1.sql.NVarChar(2), (_d = (_c = data.idOrganica1) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : null);
                        }
                        if (data.idOrganica2 !== undefined) {
                            updates.push('idOrganica2 = @idOrganica2');
                            request.input('idOrganica2', mssql_js_1.sql.NVarChar(2), (_f = (_e = data.idOrganica2) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : null);
                        }
                        if (data.idOrganica3 !== undefined) {
                            updates.push('idOrganica3 = @idOrganica3');
                            request.input('idOrganica3', mssql_js_1.sql.NVarChar(2), (_h = (_g = data.idOrganica3) === null || _g === void 0 ? void 0 : _g.toString()) !== null && _h !== void 0 ? _h : null);
                        }
                        if (updates.length === 0) {
                            return [2 /*return*/, this.findById(userId)];
                        }
                        updates.push('updatedAt = SYSUTCDATETIME()');
                        return [4 /*yield*/, request.query("\n      UPDATE auth.[user]\n      SET ".concat(updates.join(', '), "\n      WHERE id = @userId\n    "))];
                    case 1:
                        _j.sent();
                        return [2 /*return*/, this.findById(userId)];
                }
            });
        });
    };
    UsuariosRepository.prototype.delete = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .query("\n        DELETE FROM auth.[user]\n        WHERE id = @userId\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowsAffected[0] > 0];
                }
            });
        });
    };
    UsuariosRepository.prototype.getUserRoles = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .query("\n        SELECT \n          CAST(r.id AS NVARCHAR(50)) as roleId,\n          r.name as roleName,\n          r.isEntidad\n        FROM auth.userRole ur\n        JOIN auth.role r ON r.id = ur.roleId\n        WHERE ur.userId = @userId\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                roleId: row.roleId,
                                roleName: row.roleName,
                                isEntidad: row.isEntidad === 1 || row.isEntidad === true
                            }); })];
                }
            });
        });
    };
    UsuariosRepository.prototype.assignRole = function (userId, roleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .input('roleId', mssql_js_1.sql.UniqueIdentifier, roleId)
                            .query("\n        IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @userId AND roleId = @roleId)\n        BEGIN\n          INSERT INTO auth.userRole (userId, roleId)\n          VALUES (@userId, @roleId)\n        END\n      ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UsuariosRepository.prototype.removeRole = function (userId, roleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .input('roleId', mssql_js_1.sql.UniqueIdentifier, roleId)
                            .query("\n        DELETE FROM auth.userRole\n        WHERE userId = @userId AND roleId = @roleId\n      ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UsuariosRepository.prototype.findByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!username || typeof username !== 'string' || username.trim().length === 0) {
                            throw new Error('Invalid username: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('username', mssql_js_1.sql.NVarChar(100), username)
                                .query("\n        SELECT\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          isLockedOut,\n          lockoutEndAt,\n          accessFailedCount,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3,\n          createdAt,\n          updatedAt\n        FROM auth.[user]\n        WHERE username = @username\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToUsuario(row)];
                }
            });
        });
    };
    UsuariosRepository.prototype.findByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!email || typeof email !== 'string' || email.trim().length === 0) {
                            throw new Error('Invalid email: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('email', mssql_js_1.sql.NVarChar(320), email)
                                .query("\n        SELECT\n          CAST(id AS NVARCHAR(50)) as id,\n          username,\n          email,\n          displayName,\n          photoPath,\n          isLockedOut,\n          lockoutEndAt,\n          accessFailedCount,\n          idOrganica0,\n          idOrganica1,\n          idOrganica2,\n          idOrganica3,\n          createdAt,\n          updatedAt\n        FROM auth.[user]\n        WHERE email = @email\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, this.mapRowToUsuario(row)];
                }
            });
        });
    };
    UsuariosRepository.prototype.mapRowToUsuario = function (row) {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            displayName: row.displayName,
            photoPath: row.photoPath,
            isLockedOut: row.isLockedOut === 1 || row.isLockedOut === true,
            lockoutEndAt: row.lockoutEndAt,
            accessFailedCount: row.accessFailedCount,
            idOrganica0: row.idOrganica0,
            idOrganica1: row.idOrganica1,
            idOrganica2: row.idOrganica2,
            idOrganica3: row.idOrganica3,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        };
    };
    return UsuariosRepository;
}());
exports.UsuariosRepository = UsuariosRepository;
// Singleton instance
