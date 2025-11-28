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
exports.CreateUsuarioCommand = void 0;
var crypto_js_1 = require("../../../auth/infrastructure/security/crypto.js");
var errors_js_1 = require("../../domain/errors.js");
var CreateUsuarioCommand = /** @class */ (function () {
    function CreateUsuarioCommand(usuariosRepo, userRoleRepo) {
        this.usuariosRepo = usuariosRepo;
        this.userRoleRepo = userRoleRepo;
    }
    CreateUsuarioCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existingUsername, existingEmail, _a, hash, algo, userData, usuario, roleError_1, error_1;
            var _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] Iniciando creaci\u00F3n de usuario"), {
                            username: input.username,
                            email: input.email,
                            hasDisplayName: !!input.displayName,
                            hasRole: !!input.roleId,
                            userId: userId || 'anonymous'
                        });
                        // 1. Validar username
                        this.validateUsername(input.username);
                        // 2. Validar email si está presente
                        if (input.email) {
                            this.validateEmail(input.email);
                        }
                        // 3. Validar password
                        this.validatePassword(input.password);
                        // 4. Validar displayName si está presente
                        if (input.displayName) {
                            this.validateDisplayName(input.displayName);
                        }
                        if (!input.roleId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validateRole(input.roleId, userId)];
                    case 1:
                        _j.sent();
                        _j.label = 2;
                    case 2:
                        _j.trys.push([2, 12, , 13]);
                        return [4 /*yield*/, this.usuariosRepo.findByUsername(input.username)];
                    case 3:
                        existingUsername = _j.sent();
                        if (existingUsername) {
                            throw new errors_js_1.UsuarioAlreadyExistsError('username', input.username);
                        }
                        if (!input.email) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.usuariosRepo.findByEmail(input.email)];
                    case 4:
                        existingEmail = _j.sent();
                        if (existingEmail) {
                            throw new errors_js_1.UsuarioAlreadyExistsError('email', input.email);
                        }
                        _j.label = 5;
                    case 5: return [4 /*yield*/, (0, crypto_js_1.hashPassword)(input.password)];
                    case 6:
                        _a = _j.sent(), hash = _a.hash, algo = _a.algo;
                        userData = {
                            username: input.username,
                            email: (_b = input.email) !== null && _b !== void 0 ? _b : null,
                            passwordHash: hash,
                            passwordAlgo: algo,
                            displayName: (_c = input.displayName) !== null && _c !== void 0 ? _c : null,
                            photoPath: (_d = input.photoPath) !== null && _d !== void 0 ? _d : null,
                            idOrganica0: (_e = input.idOrganica0) !== null && _e !== void 0 ? _e : null,
                            idOrganica1: (_f = input.idOrganica1) !== null && _f !== void 0 ? _f : null,
                            idOrganica2: (_g = input.idOrganica2) !== null && _g !== void 0 ? _g : null,
                            idOrganica3: (_h = input.idOrganica3) !== null && _h !== void 0 ? _h : null
                        };
                        return [4 /*yield*/, this.usuariosRepo.create(userData)];
                    case 7:
                        usuario = _j.sent();
                        console.log("[".concat(timestamp, "] Usuario creado exitosamente"), {
                            usuarioId: usuario.id,
                            username: usuario.username,
                            email: usuario.email,
                            userId: userId || 'anonymous'
                        });
                        if (!input.roleId) return [3 /*break*/, 11];
                        _j.label = 8;
                    case 8:
                        _j.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.userRoleRepo.create(usuario.id, input.roleId)];
                    case 9:
                        _j.sent();
                        console.log("[".concat(timestamp, "] Rol asignado exitosamente"), {
                            usuarioId: usuario.id,
                            roleId: input.roleId,
                            userId: userId || 'anonymous'
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        roleError_1 = _j.sent();
                        console.error("[".concat(timestamp, "] Error asignando rol al usuario"), {
                            usuarioId: usuario.id,
                            roleId: input.roleId,
                            error: roleError_1.message,
                            userId: userId || 'anonymous'
                        });
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, usuario];
                    case 12:
                        error_1 = _j.sent();
                        console.error("[".concat(timestamp, "] Error creando usuario"), {
                            username: input.username,
                            email: input.email,
                            error: error_1.message,
                            userId: userId || 'anonymous'
                        });
                        throw error_1;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    CreateUsuarioCommand.prototype.validateUsername = function (username) {
        if (!username || typeof username !== 'string') {
            throw new errors_js_1.UsuarioInvalidUsernameError(username || 'undefined');
        }
        var trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 50) {
            throw new errors_js_1.UsuarioInvalidUsernameError(username);
        }
        // Solo letras, números y guiones bajos
        var usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(trimmed)) {
            throw new errors_js_1.UsuarioInvalidUsernameError(username);
        }
    };
    CreateUsuarioCommand.prototype.validateEmail = function (email) {
        if (!email || typeof email !== 'string') {
            throw new errors_js_1.UsuarioInvalidEmailError(email || 'undefined');
        }
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new errors_js_1.UsuarioInvalidEmailError(email);
        }
    };
    CreateUsuarioCommand.prototype.validatePassword = function (password) {
        if (!password || typeof password !== 'string') {
            throw new errors_js_1.UsuarioInvalidPasswordError();
        }
        // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo
        var passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new errors_js_1.UsuarioInvalidPasswordError();
        }
    };
    CreateUsuarioCommand.prototype.validateDisplayName = function (displayName) {
        if (!displayName || typeof displayName !== 'string') {
            throw new errors_js_1.UsuarioInvalidNameError('displayName', displayName || 'undefined');
        }
        var trimmed = displayName.trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
            throw new errors_js_1.UsuarioInvalidNameError('displayName', displayName);
        }
    };
    CreateUsuarioCommand.prototype.validateRole = function (roleId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmed;
            return __generator(this, function (_a) {
                if (!roleId || typeof roleId !== 'string') {
                    throw new errors_js_1.UsuarioInvalidRoleError(roleId || 'undefined');
                }
                trimmed = roleId.trim();
                if (trimmed.length === 0) {
                    throw new errors_js_1.UsuarioInvalidRoleError(roleId);
                }
                console.log("[".concat(new Date().toISOString(), "] Validando rol para usuario"), {
                    roleId: trimmed,
                    userId: userId || 'anonymous'
                });
                return [2 /*return*/];
            });
        });
    };
    return CreateUsuarioCommand;
}());
exports.CreateUsuarioCommand = CreateUsuarioCommand;
