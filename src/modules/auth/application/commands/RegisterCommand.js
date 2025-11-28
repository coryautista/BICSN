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
exports.RegisterCommand = void 0;
var crypto_js_1 = require("../../infrastructure/security/crypto.js");
var errors_js_1 = require("../../domain/errors.js");
// Logger básico para comandos (se puede mejorar con inyección de dependencias)
var logger = {
    info: function (message, data) { return console.log("[INFO] ".concat(message), data ? JSON.stringify(data) : ''); },
    warn: function (message, data) { return console.warn("[WARN] ".concat(message), data ? JSON.stringify(data) : ''); },
    error: function (message, data) { return console.error("[ERROR] ".concat(message), data ? JSON.stringify(data) : ''); },
    debug: function (message, data) { return console.debug("[DEBUG] ".concat(message), data ? JSON.stringify(data) : ''); }
};
var RegisterCommand = /** @class */ (function () {
    function RegisterCommand(authRepo) {
        this.authRepo = authRepo;
    }
    RegisterCommand.prototype.execute = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, existingEmailUser, _a, hash, algo, userData, user, error_1;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        _k.trys.push([0, 6, , 7]);
                        logger.info('Iniciando proceso de registro de usuario', {
                            username: input.username,
                            hasEmail: !!input.email,
                            hasDisplayName: !!input.displayName,
                            hasPhotoPath: !!input.photoPath,
                            hasOrganicaData: !!(input.idOrganica0 || input.idOrganica1 || input.idOrganica2 || input.idOrganica3)
                        });
                        // Validar entrada básica
                        if (!input.username || input.username.trim().length === 0) {
                            throw new errors_js_1.InvalidRegistrationDataError('El nombre de usuario es requerido');
                        }
                        if (!input.password || input.password.length < 8) {
                            throw new errors_js_1.WeakPasswordError({ passwordLength: ((_b = input.password) === null || _b === void 0 ? void 0 : _b.length) || 0 });
                        }
                        return [4 /*yield*/, this.authRepo.findUserByUsernameOrEmail(input.username)];
                    case 1:
                        existingUser = _k.sent();
                        if (existingUser) {
                            logger.warn('Intento de registro con usuario existente', {
                                username: input.username,
                                existingUserId: existingUser.id
                            });
                            throw new errors_js_1.UserAlreadyExistsError(input.username, 'username');
                        }
                        if (!input.email) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.authRepo.findUserByUsernameOrEmail(input.email)];
                    case 2:
                        existingEmailUser = _k.sent();
                        if (existingEmailUser) {
                            logger.warn('Intento de registro con email existente', {
                                email: input.email,
                                existingUserId: existingEmailUser.id
                            });
                            throw new errors_js_1.UserAlreadyExistsError(input.email, 'email');
                        }
                        _k.label = 3;
                    case 3:
                        // 1. Hash password
                        logger.debug('Generando hash de contraseña para nuevo usuario');
                        return [4 /*yield*/, (0, crypto_js_1.hashPassword)(input.password)];
                    case 4:
                        _a = _k.sent(), hash = _a.hash, algo = _a.algo;
                        userData = {
                            username: input.username,
                            email: (_c = input.email) !== null && _c !== void 0 ? _c : null,
                            passwordHash: hash,
                            passwordAlgo: algo,
                            displayName: (_d = input.displayName) !== null && _d !== void 0 ? _d : null,
                            photoPath: (_e = input.photoPath) !== null && _e !== void 0 ? _e : null,
                            idOrganica0: (_f = input.idOrganica0) !== null && _f !== void 0 ? _f : null,
                            idOrganica1: (_g = input.idOrganica1) !== null && _g !== void 0 ? _g : null,
                            idOrganica2: (_h = input.idOrganica2) !== null && _h !== void 0 ? _h : null,
                            idOrganica3: (_j = input.idOrganica3) !== null && _j !== void 0 ? _j : null
                        };
                        // 3. Create user
                        logger.debug('Creando usuario en base de datos');
                        return [4 /*yield*/, this.authRepo.createUser(userData)];
                    case 5:
                        user = _k.sent();
                        logger.info('Usuario registrado exitosamente', {
                            userId: user.id,
                            username: user.username,
                            email: user.email
                        });
                        // 4. Return safe user data
                        return [2 /*return*/, {
                                id: user.id,
                                username: user.username,
                                email: user.email,
                                displayName: user.displayName,
                                photoPath: user.photoPath,
                                idOrganica0: user.idOrganica0,
                                idOrganica1: user.idOrganica1,
                                idOrganica2: user.idOrganica2,
                                idOrganica3: user.idOrganica3
                            }];
                    case 6:
                        error_1 = _k.sent();
                        if (error_1 instanceof errors_js_1.UserAlreadyExistsError || error_1 instanceof errors_js_1.InvalidRegistrationDataError || error_1 instanceof errors_js_1.WeakPasswordError) {
                            throw error_1;
                        }
                        logger.error('Error durante el registro de usuario', {
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido',
                            username: input.username,
                            stack: error_1 instanceof Error ? error_1.stack : undefined
                        });
                        throw new errors_js_1.InvalidRegistrationDataError('Error interno durante el registro');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return RegisterCommand;
}());
exports.RegisterCommand = RegisterCommand;
