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
exports.RefreshTokenCommand = void 0;
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
var RefreshTokenCommand = /** @class */ (function () {
    function RefreshTokenCommand(authRepo) {
        this.authRepo = authRepo;
    }
    RefreshTokenCommand.prototype.execute = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var currentHash, _a, newToken, newHash, ttlMinutes, error_1, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        logger.info('Iniciando proceso de refresco de token', {
                            hasIp: !!input.ip,
                            hasUserAgent: !!input.userAgent
                        });
                        // Validar entrada básica
                        if (!input.currentRefreshToken || input.currentRefreshToken.trim().length === 0) {
                            throw new errors_js_1.InvalidTokenError('refresh_token', { reason: 'token_missing' });
                        }
                        // 1. Hash current token
                        logger.debug('Generando hash del token actual');
                        currentHash = (0, crypto_js_1.sha256)(input.currentRefreshToken);
                        // 2. Generate new token
                        logger.debug('Generando nuevo token de refresh');
                        _a = (0, jwt_js_1.generateRefreshToken)(), newToken = _a.token, newHash = _a.hash, ttlMinutes = _a.ttlMinutes;
                        // 3. Rotate token in database
                        logger.debug('Rotando token en base de datos');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.authRepo.rotateRefreshToken(currentHash, newHash, ttlMinutes, input.ip, input.userAgent)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        logger.warn('Token de refresh inválido o expirado', {
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido',
                            ip: input.ip,
                            userAgent: input.userAgent
                        });
                        throw new errors_js_1.RevokedTokenError('refresh_token', undefined, { reason: 'token_not_found_or_expired' });
                    case 4:
                        logger.info('Token de refresh renovado exitosamente', {
                            ip: input.ip,
                            userAgent: input.userAgent
                        });
                        return [2 /*return*/, {
                                newRefreshToken: newToken
                            }];
                    case 5:
                        error_2 = _b.sent();
                        if (error_2 instanceof errors_js_1.InvalidTokenError || error_2 instanceof errors_js_1.RevokedTokenError) {
                            throw error_2;
                        }
                        logger.error('Error durante el refresco de token', {
                            error: error_2 instanceof Error ? error_2.message : 'Error desconocido',
                            ip: input.ip,
                            userAgent: input.userAgent,
                            stack: error_2 instanceof Error ? error_2.stack : undefined
                        });
                        throw new errors_js_1.TokenRefreshFailedError('Error interno durante el refresco de token');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return RefreshTokenCommand;
}());
exports.RefreshTokenCommand = RefreshTokenCommand;
