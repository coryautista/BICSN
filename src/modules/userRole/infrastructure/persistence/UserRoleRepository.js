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
exports.UserRoleRepository = void 0;
var mssql_1 = require("mssql");
var context_js_1 = require("../../../../db/context.js");
var UserRoleRepository = /** @class */ (function () {
    function UserRoleRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    UserRoleRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        userId,\n        roleId\n      FROM auth.userRole\n      ORDER BY userId ASC, roleId ASC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                usuarioId: row.userId,
                                roleId: row.roleId
                            }); })];
                }
            });
        });
    };
    UserRoleRepository.prototype.findByIds = function (usuarioId, roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
                            throw new Error('Invalid usuarioId: must be a non-empty string');
                        }
                        if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
                            throw new Error('Invalid roleId: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('usuarioId', mssql_1.default.UniqueIdentifier, usuarioId)
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                                .query("\n        SELECT\n          userId,\n          roleId\n        FROM auth.userRole\n        WHERE userId = @usuarioId AND roleId = @roleId\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                usuarioId: row.userId,
                                roleId: row.roleId
                            }];
                }
            });
        });
    };
    UserRoleRepository.prototype.findByUsuarioId = function (usuarioId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
                            throw new Error('Invalid usuarioId: must be a non-empty string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('usuarioId', mssql_1.default.UniqueIdentifier, usuarioId)
                                .query("\n        SELECT\n          userId,\n          roleId\n        FROM auth.userRole\n        WHERE userId = @usuarioId\n        ORDER BY roleId ASC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                usuarioId: row.userId,
                                roleId: row.roleId
                            }); })];
                }
            });
        });
    };
    UserRoleRepository.prototype.create = function (usuarioId, roleId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
                            throw new Error('Invalid usuarioId: must be a non-empty string');
                        }
                        if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
                            throw new Error('Invalid roleId: must be a non-empty string');
                        }
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('usuarioId', mssql_1.default.UniqueIdentifier, usuarioId)
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                                .query("\n        INSERT INTO auth.userRole (userId, roleId)\n        VALUES (@usuarioId, @roleId)\n      ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {
                                usuarioId: usuarioId,
                                roleId: roleId
                            }];
                }
            });
        });
    };
    UserRoleRepository.prototype.delete = function (usuarioId, roleId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validaciones
                        if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
                            throw new Error('Invalid usuarioId: must be a non-empty string');
                        }
                        if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
                            throw new Error('Invalid roleId: must be a non-empty string');
                        }
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('usuarioId', mssql_1.default.UniqueIdentifier, usuarioId)
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                                .query("\n        DELETE FROM auth.userRole\n        WHERE userId = @usuarioId AND roleId = @roleId\n      ")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { usuarioId: usuarioId, roleId: roleId }];
                }
            });
        });
    };
    return UserRoleRepository;
}());
exports.UserRoleRepository = UserRoleRepository;
