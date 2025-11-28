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
exports.RoleMenuRepository = void 0;
var mssql_1 = require("mssql");
var context_js_1 = require("../../../../db/context.js");
var RoleMenuRepository = /** @class */ (function () {
    function RoleMenuRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    RoleMenuRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id,\n        roleId,\n        menuId,\n        createdAt\n      FROM auth.RoleMenu\n      ORDER BY createdAt DESC\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }); })];
                }
            });
        });
    };
    RoleMenuRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        SELECT\n          id,\n          roleId,\n          menuId,\n          createdAt\n        FROM auth.RoleMenu\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }];
                }
            });
        });
    };
    RoleMenuRepository.prototype.findByRoleId = function (roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                            .query("\n        SELECT\n          id,\n          roleId,\n          menuId,\n          createdAt\n        FROM auth.RoleMenu\n        WHERE roleId = @roleId\n        ORDER BY createdAt DESC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }); })];
                }
            });
        });
    };
    RoleMenuRepository.prototype.findByMenuId = function (menuId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('menuId', mssql_1.default.Int, menuId)
                            .query("\n        SELECT\n          id,\n          roleId,\n          menuId,\n          createdAt\n        FROM auth.RoleMenu\n        WHERE menuId = @menuId\n        ORDER BY createdAt DESC\n      ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }); })];
                }
            });
        });
    };
    RoleMenuRepository.prototype.findByRoleNames = function (roleNames) {
        return __awaiter(this, void 0, void 0, function () {
            var upperRoleNames, placeholders, req, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!roleNames || roleNames.length === 0) {
                            return [2 /*return*/, []];
                        }
                        upperRoleNames = roleNames.map(function (name) { return name.toUpperCase(); });
                        placeholders = upperRoleNames.map(function (_, i) { return "@role".concat(i); }).join(',');
                        req = this.mssqlPool.request();
                        upperRoleNames.forEach(function (name, i) {
                            req.input("role".concat(i), mssql_1.default.NVarChar(100), name);
                        });
                        return [4 /*yield*/, req.query("\n      SELECT DISTINCT\n        rm.id,\n        rm.roleId,\n        rm.menuId,\n        rm.createdAt,\n        r.name as roleName,\n        m.nombre as menuName,\n        m.componente as menuPath,\n        m.icono as menuIcon,\n        m.parentId as menuParentId,\n        m.orden as menuOrder\n      FROM auth.RoleMenu rm\n      INNER JOIN auth.role r ON rm.roleId = r.id\n      INNER JOIN dbo.Menu m ON rm.menuId = m.id\n      WHERE UPPER(r.name) IN (".concat(placeholders, ")\n      ORDER BY m.orden ASC, m.nombre ASC\n    "))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) { return ({
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString(),
                                role: {
                                    id: row.roleId,
                                    name: row.roleName
                                },
                                menu: {
                                    id: row.menuId,
                                    name: row.menuName,
                                    path: row.menuPath,
                                    icon: row.menuIcon,
                                    parentId: row.menuParentId,
                                    order: row.menuOrder
                                }
                            }); })];
                }
            });
        });
    };
    RoleMenuRepository.prototype.create = function (roleId, menuId, createdAt, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                                .input('menuId', mssql_1.default.Int, menuId)
                                .input('createdAt', mssql_1.default.DateTime2, createdAt)
                                .query("\n        INSERT INTO auth.RoleMenu (roleId, menuId, createdAt)\n        OUTPUT\n          INSERTED.id,\n          INSERTED.roleId,\n          INSERTED.menuId,\n          INSERTED.createdAt\n        VALUES (@roleId, @menuId, @createdAt)\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }];
                }
            });
        });
    };
    RoleMenuRepository.prototype.update = function (id, roleId, menuId, createdAt, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req, result, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('id', mssql_1.default.Int, id)
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId !== null && roleId !== void 0 ? roleId : null)
                                .input('menuId', mssql_1.default.Int, menuId !== null && menuId !== void 0 ? menuId : null)
                                .input('createdAt', mssql_1.default.DateTime2, createdAt !== null && createdAt !== void 0 ? createdAt : null)
                                .query("\n        UPDATE auth.RoleMenu\n        SET roleId = @roleId,\n            menuId = @menuId,\n            createdAt = @createdAt\n        OUTPUT\n          INSERTED.id,\n          INSERTED.roleId,\n          INSERTED.menuId,\n          INSERTED.createdAt\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                roleId: row.roleId,
                                menuId: row.menuId,
                                createdAt: row.createdAt.toISOString()
                            }];
                }
            });
        });
    };
    RoleMenuRepository.prototype.delete = function (id, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('id', mssql_1.default.Int, id)
                                .query("\n        DELETE FROM auth.RoleMenu\n        OUTPUT DELETED.id\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.recordset[0]) === null || _a === void 0 ? void 0 : _a.id];
                }
            });
        });
    };
    RoleMenuRepository.prototype.deleteByRoleAndMenu = function (roleId, menuId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var req, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        req = tx ? new context_js_1.sql.Request(tx) : this.mssqlPool.request();
                        return [4 /*yield*/, req
                                .input('roleId', mssql_1.default.UniqueIdentifier, roleId)
                                .input('menuId', mssql_1.default.Int, menuId)
                                .query("\n        DELETE FROM auth.RoleMenu\n        OUTPUT DELETED.id\n        WHERE roleId = @roleId AND menuId = @menuId\n      ")];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.recordset[0]) === null || _a === void 0 ? void 0 : _a.id];
                }
            });
        });
    };
    return RoleMenuRepository;
}());
exports.RoleMenuRepository = RoleMenuRepository;
