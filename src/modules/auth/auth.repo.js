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
exports.findUserByUsernameOrEmail = findUserByUsernameOrEmail;
exports.createUser = createUser;
exports.getUserRoles = getUserRoles;
exports.registerFailedLogin = registerFailedLogin;
exports.registerSuccessfulLogin = registerSuccessfulLogin;
exports.issueRefreshToken = issueRefreshToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeAllRefreshTokensForUser = revokeAllRefreshTokensForUser;
exports.denylistJwt = denylistJwt;
exports.isJtiDenylisted = isJtiDenylisted;
exports.findUserById = findUserById;
var mssql_js_1 = require("../../db/mssql.js");
function findUserByUsernameOrEmail(usernameOrEmail) {
    return __awaiter(this, void 0, void 0, function () {
        var p, result, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('val', mssql_js_1.sql.NVarChar(320), usernameOrEmail)
                            .query("\n      SELECT TOP 1\n        CAST(u.id AS NVARCHAR(50)) as id,\n        u.username,\n        u.email,\n        u.passwordHash,\n        u.passwordAlgo,\n        u.isLockedOut,\n        u.lockoutEndAt,\n        u.accessFailedCount,\n        u.displayName,\n        u.photoPath,\n        u.idOrganica0,\n        u.idOrganica1,\n        u.idOrganica2,\n        u.idOrganica3\n      FROM auth.[user] u\n      WHERE u.normalizedUsername = UPPER(@val)\n         OR (u.email IS NOT NULL AND u.normalizedEmail = UPPER(@val))\n    ")];
                case 2:
                    result = _a.sent();
                    row = result.recordset[0];
                    if (!row)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, {
                            id: row.id,
                            username: row.username,
                            email: row.email,
                            passwordHash: row.passwordHash,
                            passwordAlgo: row.passwordAlgo,
                            isLockedOut: row.isLockedOut === 1 || row.isLockedOut === true,
                            lockoutEndAt: row.lockoutEndAt,
                            accessFailedCount: row.accessFailedCount,
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
}
function createUser(username, email, passwordHash, passwordAlgo, displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3) {
    return __awaiter(this, void 0, void 0, function () {
        var p, selectResult, row;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _e.sent();
                    return [4 /*yield*/, p.request()
                            .input('username', mssql_js_1.sql.NVarChar(100), username)
                            .input('email', mssql_js_1.sql.NVarChar(320), email)
                            .input('pwd', mssql_js_1.sql.NVarChar(255), passwordHash)
                            .input('algo', mssql_js_1.sql.VarChar(20), passwordAlgo)
                            .input('displayName', mssql_js_1.sql.NVarChar(255), displayName !== null && displayName !== void 0 ? displayName : null)
                            .input('photoPath', mssql_js_1.sql.NVarChar(255), photoPath !== null && photoPath !== void 0 ? photoPath : null)
                            .input('idOrganica0', mssql_js_1.sql.NVarChar(2), (_a = idOrganica0 === null || idOrganica0 === void 0 ? void 0 : idOrganica0.toString()) !== null && _a !== void 0 ? _a : null)
                            .input('idOrganica1', mssql_js_1.sql.NVarChar(2), (_b = idOrganica1 === null || idOrganica1 === void 0 ? void 0 : idOrganica1.toString()) !== null && _b !== void 0 ? _b : null)
                            .input('idOrganica2', mssql_js_1.sql.NVarChar(2), (_c = idOrganica2 === null || idOrganica2 === void 0 ? void 0 : idOrganica2.toString()) !== null && _c !== void 0 ? _c : null)
                            .input('idOrganica3', mssql_js_1.sql.NVarChar(2), (_d = idOrganica3 === null || idOrganica3 === void 0 ? void 0 : idOrganica3.toString()) !== null && _d !== void 0 ? _d : null)
                            .query("\n      INSERT INTO auth.[user] (\n        username, email, passwordHash, passwordAlgo,\n        displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3\n      )\n      VALUES(\n        @username, @email, @pwd, @algo,\n        @displayName, @photoPath, @idOrganica0, @idOrganica1, @idOrganica2, @idOrganica3\n      )\n    ")];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, p.request()
                            .input('username', mssql_js_1.sql.NVarChar(100), username)
                            .query("\n      SELECT TOP 1\n        CAST(u.id AS NVARCHAR(50)) as id,\n        u.username,\n        u.email,\n        u.displayName,\n        u.photoPath,\n        u.idOrganica0,\n        u.idOrganica1,\n        u.idOrganica2,\n        u.idOrganica3\n      FROM auth.[user] u\n      WHERE u.username = @username\n      ORDER BY u.createdAt DESC\n    ")];
                case 3:
                    selectResult = _e.sent();
                    row = selectResult.recordset[0];
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
}
function getUserRoles(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var p, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('uid', mssql_js_1.sql.UniqueIdentifier, userId)
                            .query("\n      SELECT r.name, r.isEntidad FROM auth.userRole ur\n      JOIN auth.role r ON r.id = ur.roleId\n      WHERE ur.userId = @uid\n    ")];
                case 2:
                    r = _a.sent();
                    return [2 /*return*/, r.recordset.map(function (x) { return ({ name: x.name, isEntidad: x.isEntidad === 1 || x.isEntidad === true }); })];
            }
        });
    });
}
function registerFailedLogin(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, maxFailures, lockoutMinutes) {
        var p;
        if (maxFailures === void 0) { maxFailures = 5; }
        if (lockoutMinutes === void 0) { lockoutMinutes = 15; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .input('maxFailures', mssql_js_1.sql.Int, maxFailures)
                            .input('lockoutMinutes', mssql_js_1.sql.Int, lockoutMinutes)
                            .execute('auth.uspRegisterFailedLogin')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function registerSuccessfulLogin(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .execute('auth.uspRegisterSuccessfulLogin')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function issueRefreshToken(userId, tokenHash, ttlMinutes, ip, ua) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .input('tokenHash', mssql_js_1.sql.VarBinary(64), tokenHash)
                            .input('ttlMinutes', mssql_js_1.sql.Int, ttlMinutes)
                            .input('ip', mssql_js_1.sql.NVarChar(64), ip !== null && ip !== void 0 ? ip : null)
                            .input('ua', mssql_js_1.sql.NVarChar(300), ua !== null && ua !== void 0 ? ua : null)
                            .execute('auth.uspIssueRefreshToken')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function rotateRefreshToken(currentHash, newHash, ttlMinutes, ip, ua) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('currentTokenHash', mssql_js_1.sql.VarBinary(64), currentHash)
                            .input('newTokenHash', mssql_js_1.sql.VarBinary(64), newHash)
                            .input('ttlMinutes', mssql_js_1.sql.Int, ttlMinutes)
                            .input('ip', mssql_js_1.sql.NVarChar(64), ip !== null && ip !== void 0 ? ip : null)
                            .input('ua', mssql_js_1.sql.NVarChar(300), ua !== null && ua !== void 0 ? ua : null)
                            .execute('auth.uspRotateRefreshToken')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function revokeAllRefreshTokensForUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .execute('auth.uspRevokeAllRefreshTokensForUser')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function denylistJwt(jti, userId, expiresAtIso, reason) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('jti', mssql_js_1.sql.NVarChar(50), jti)
                            .input('userId', userId ? mssql_js_1.sql.UniqueIdentifier : mssql_js_1.sql.UniqueIdentifier, userId !== null && userId !== void 0 ? userId : null)
                            .input('expiresAt', mssql_js_1.sql.DateTime2, new Date(expiresAtIso))
                            .input('reason', mssql_js_1.sql.NVarChar(200), reason !== null && reason !== void 0 ? reason : null)
                            .execute('auth.uspDenylistJwt')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function isJtiDenylisted(jti) {
    return __awaiter(this, void 0, void 0, function () {
        var p, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('jti', mssql_js_1.sql.NVarChar(50), jti)
                            .query("SELECT 1 FROM auth.jwtDenylist WHERE jti = @jti AND expiresAt > SYSUTCDATETIME()")];
                case 2:
                    r = _a.sent();
                    return [2 /*return*/, r.recordset.length > 0];
            }
        });
    });
}
function findUserById(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var p, r, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    p = _a.sent();
                    return [4 /*yield*/, p.request()
                            .input('userId', mssql_js_1.sql.UniqueIdentifier, userId)
                            .query("\n      SELECT TOP 1\n        CAST(u.id AS NVARCHAR(50)) as id,\n        u.username,\n        u.idOrganica0,\n        u.idOrganica1,\n        u.idOrganica2,\n        u.idOrganica3\n      FROM auth.[user] u\n      WHERE u.id = @userId\n    ")];
                case 2:
                    r = _a.sent();
                    row = r.recordset[0];
                    if (!row)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, {
                            id: row.id,
                            username: row.username,
                            idOrganica0: row.idOrganica0,
                            idOrganica1: row.idOrganica1,
                            idOrganica2: row.idOrganica2,
                            idOrganica3: row.idOrganica3
                        }];
            }
        });
    });
}
// Auth repository
