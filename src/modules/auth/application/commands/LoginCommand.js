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
exports.LoginCommand = void 0;
var crypto_js_1 = require("../../infrastructure/security/crypto.js");
var jwt_js_1 = require("../../infrastructure/security/jwt.js");
var errors_js_1 = require("../../domain/errors.js");
// Logger básico para comandos
var logger = {
    info: function (message, data) { return console.log("[INFO] ".concat(message), data ? JSON.stringify(data) : ''); },
    warn: function (message, data) { return console.warn("[WARN] ".concat(message), data ? JSON.stringify(data) : ''); },
    error: function (message, data) { return console.error("[ERROR] ".concat(message), data ? JSON.stringify(data) : ''); },
    debug: function (message, data) { return console.debug("[DEBUG] ".concat(message), data ? JSON.stringify(data) : ''); }
};
var LoginCommand = /** @class */ (function () {
    function LoginCommand(authRepo) {
        this.authRepo = authRepo;
    }
    LoginCommand.prototype.execute = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var user, isValid, recentFailedLogins, roles, roleNames, isEntidades, accessTokenData, _a, refreshToken, refreshHash, ttlMinutes, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        logger.info('Iniciando proceso de autenticación', {
                            identifier: input.usernameOrEmail,
                            hasIp: !!input.ip,
                            hasUserAgent: !!input.userAgent
                        });
                        // Validar entrada básica
                        if (!input.usernameOrEmail || input.usernameOrEmail.trim().length === 0) {
                            throw new errors_js_1.InvalidCredentialsError({ reason: 'identifier_missing' });
                        }
                        if (!input.password || input.password.length === 0) {
                            throw new errors_js_1.InvalidCredentialsError({ reason: 'password_missing' });
                        }
                        // 1. Find user
                        logger.debug('Buscando usuario en base de datos');
                        return [4 /*yield*/, this.authRepo.findUserByUsernameOrEmail(input.usernameOrEmail)];
                    case 1:
                        user = _b.sent();
                        if (!user) {
                            logger.warn('Intento de login con usuario inexistente', {
                                identifier: input.usernameOrEmail,
                                ip: input.ip,
                                userAgent: input.userAgent
                            });
                            throw new errors_js_1.InvalidCredentialsError({ reason: 'user_not_found' });
                        }
                        // 2. Check lockout
                        if (user.isLockedOut && user.lockoutEndAt && user.lockoutEndAt > new Date()) {
                            logger.warn('Intento de login en cuenta bloqueada', {
                                userId: user.id,
                                username: user.username,
                                lockoutEnd: user.lockoutEndAt.toISOString(),
                                ip: input.ip,
                                userAgent: input.userAgent
                            });
                            throw new errors_js_1.AccountLockedError(user.id, user.lockoutEndAt, {
                                remainingTime: Math.ceil((user.lockoutEndAt.getTime() - Date.now()) / 1000 / 60)
                            });
                        }
                        // 3. Verify password
                        logger.debug('Verificando contraseña');
                        return [4 /*yield*/, (0, crypto_js_1.verifyPassword)(user.passwordHash, input.password, user.passwordAlgo)];
                    case 2:
                        isValid = _b.sent();
                        if (!!isValid) return [3 /*break*/, 4];
                        logger.warn('Intento de login con contraseña incorrecta', {
                            userId: user.id,
                            username: user.username,
                            ip: input.ip,
                            userAgent: input.userAgent
                        });
                        // Registrar intento fallido
                        return [4 /*yield*/, this.authRepo.registerFailedLogin(user.id)];
                    case 3:
                        // Registrar intento fallido
                        _b.sent();
                        recentFailedLogins = 1;
                        if (recentFailedLogins >= 5) {
                            logger.warn('Múltiples intentos fallidos de login detectados', {
                                userId: user.id,
                                username: user.username,
                                failedAttempts: recentFailedLogins
                            });
                            throw new errors_js_1.RateLimitExceededError(user.username, 5, 15 * 60 * 1000); // 5 intentos por 15 minutos
                        }
                        throw new errors_js_1.InvalidCredentialsError({ reason: 'invalid_password' });
                    case 4:
                        // 4. Get roles
                        logger.debug('Obteniendo roles del usuario');
                        return [4 /*yield*/, this.authRepo.getUserRoles(user.id)];
                    case 5:
                        roles = _b.sent();
                        roleNames = roles.map(function (r) { return r.name; });
                        isEntidades = roles.map(function (r) { return r.isEntidad; });
                        // 5. Generate tokens
                        logger.debug('Generando tokens de acceso');
                        accessTokenData = (0, jwt_js_1.signAccessToken)(user.id, roleNames, isEntidades, user.idOrganica0, user.idOrganica1, user.idOrganica2, user.idOrganica3);
                        _a = (0, jwt_js_1.generateRefreshToken)(), refreshToken = _a.token, refreshHash = _a.hash, ttlMinutes = _a.ttlMinutes;
                        // 6. Store refresh token
                        logger.debug('Almacenando token de refresh');
                        return [4 /*yield*/, this.authRepo.issueRefreshToken(user.id, refreshHash, ttlMinutes, input.ip, input.userAgent)];
                    case 6:
                        _b.sent();
                        // 7. Register successful login
                        return [4 /*yield*/, this.authRepo.registerSuccessfulLogin(user.id)];
                    case 7:
                        // 7. Register successful login
                        _b.sent();
                        logger.info('Login exitoso', {
                            userId: user.id,
                            username: user.username,
                            roles: roleNames,
                            ip: input.ip,
                            userAgent: input.userAgent
                        });
                        return [2 /*return*/, {
                                userId: user.id,
                                username: user.username,
                                accessToken: accessTokenData.token,
                                refreshToken: refreshToken,
                                accessExp: accessTokenData.exp
                            }];
                    case 8:
                        error_1 = _b.sent();
                        if (error_1 instanceof errors_js_1.InvalidCredentialsError ||
                            error_1 instanceof errors_js_1.AccountLockedError ||
                            error_1 instanceof errors_js_1.RateLimitExceededError) {
                            throw error_1;
                        }
                        logger.error('Error durante el proceso de login', {
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido',
                            identifier: input.usernameOrEmail,
                            ip: input.ip,
                            stack: error_1 instanceof Error ? error_1.stack : undefined
                        });
                        throw new errors_js_1.LoginFailedError('Error interno durante la autenticación');
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return LoginCommand;
}());
exports.LoginCommand = LoginCommand;
