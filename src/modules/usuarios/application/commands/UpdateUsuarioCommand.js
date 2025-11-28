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
exports.UpdateUsuarioCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var UpdateUsuarioCommand = /** @class */ (function () {
    function UpdateUsuarioCommand(usuariosRepo) {
        this.usuariosRepo = usuariosRepo;
    }
    UpdateUsuarioCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existing, existingEmail, updateData, updated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] Iniciando actualizaci\u00F3n de usuario"), {
                            targetUserId: input.userId,
                            hasEmail: !!input.email,
                            hasDisplayName: !!input.displayName,
                            hasPhotoPath: !!input.photoPath,
                            hasOrganica: !!(input.idOrganica0 || input.idOrganica1 || input.idOrganica2 || input.idOrganica3),
                            userId: userId || 'anonymous'
                        });
                        // 1. Validar ID del usuario
                        this.validateUserId(input.userId);
                        // 2. Validar email si está presente
                        if (input.email !== undefined) {
                            this.validateEmail(input.email);
                        }
                        // 3. Validar displayName si está presente
                        if (input.displayName !== undefined) {
                            this.validateDisplayName(input.displayName);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.usuariosRepo.findById(input.userId)];
                    case 2:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.UsuarioNotFoundError(input.userId);
                        }
                        if (!(input.email !== undefined && input.email !== existing.email)) return [3 /*break*/, 4];
                        if (!input.email) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.usuariosRepo.findByEmail(input.email)];
                    case 3:
                        existingEmail = _a.sent();
                        if (existingEmail && existingEmail.id !== input.userId) {
                            throw new errors_js_1.UsuarioAlreadyExistsError('email', input.email);
                        }
                        _a.label = 4;
                    case 4:
                        updateData = {
                            email: input.email,
                            displayName: input.displayName,
                            photoPath: input.photoPath,
                            idOrganica0: input.idOrganica0,
                            idOrganica1: input.idOrganica1,
                            idOrganica2: input.idOrganica2,
                            idOrganica3: input.idOrganica3
                        };
                        return [4 /*yield*/, this.usuariosRepo.update(input.userId, updateData)];
                    case 5:
                        updated = _a.sent();
                        if (!updated) {
                            throw new errors_js_1.UsuarioNotFoundError(input.userId);
                        }
                        console.log("[".concat(timestamp, "] Usuario actualizado exitosamente"), {
                            targetUserId: input.userId,
                            username: updated.username,
                            email: updated.email,
                            displayName: updated.displayName,
                            userId: userId || 'anonymous'
                        });
                        return [2 /*return*/, updated];
                    case 6:
                        error_1 = _a.sent();
                        console.error("[".concat(timestamp, "] Error actualizando usuario"), {
                            targetUserId: input.userId,
                            error: error_1.message,
                            userId: userId || 'anonymous'
                        });
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UpdateUsuarioCommand.prototype.validateUserId = function (userId) {
        if (!userId || typeof userId !== 'string') {
            throw new errors_js_1.UsuarioInvalidIdError(userId || 'undefined');
        }
        var trimmed = userId.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.UsuarioInvalidIdError(userId);
        }
    };
    UpdateUsuarioCommand.prototype.validateEmail = function (email) {
        if (email === null) {
            return; // Email puede ser null (opcional)
        }
        if (typeof email !== 'string') {
            throw new errors_js_1.UsuarioInvalidEmailError(String(email));
        }
        if (email.trim().length === 0) {
            return; // Email vacío es válido (se establece como null)
        }
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new errors_js_1.UsuarioInvalidEmailError(email);
        }
    };
    UpdateUsuarioCommand.prototype.validateDisplayName = function (displayName) {
        if (displayName === null) {
            return; // displayName puede ser null (opcional)
        }
        if (typeof displayName !== 'string') {
            throw new errors_js_1.UsuarioInvalidNameError('displayName', String(displayName));
        }
        if (displayName.trim().length === 0) {
            return; // displayName vacío es válido (se establece como null)
        }
        var trimmed = displayName.trim();
        if (trimmed.length < 2 || trimmed.length > 100) {
            throw new errors_js_1.UsuarioInvalidNameError('displayName', displayName);
        }
    };
    return UpdateUsuarioCommand;
}());
exports.UpdateUsuarioCommand = UpdateUsuarioCommand;
