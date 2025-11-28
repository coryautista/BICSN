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
exports.DeleteUsuarioCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var DeleteUsuarioCommand = /** @class */ (function () {
    function DeleteUsuarioCommand(usuariosRepo) {
        this.usuariosRepo = usuariosRepo;
    }
    DeleteUsuarioCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existing, deleted, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] Iniciando eliminaci\u00F3n de usuario"), {
                            targetUserId: input.userId,
                            userId: userId || 'anonymous'
                        });
                        // 1. Validar ID del usuario
                        this.validateUserId(input.userId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.usuariosRepo.findById(input.userId)];
                    case 2:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.UsuarioNotFoundError(input.userId);
                        }
                        // 3. Verificar que el usuario no esté en uso
                        return [4 /*yield*/, this.checkUsuarioInUse(input.userId, userId)];
                    case 3:
                        // 3. Verificar que el usuario no esté en uso
                        _a.sent();
                        return [4 /*yield*/, this.usuariosRepo.delete(input.userId)];
                    case 4:
                        deleted = _a.sent();
                        if (deleted) {
                            console.log("[".concat(timestamp, "] Usuario eliminado exitosamente"), {
                                targetUserId: input.userId,
                                username: existing.username,
                                email: existing.email,
                                userId: userId || 'anonymous'
                            });
                        }
                        else {
                            console.warn("[".concat(timestamp, "] No se pudo eliminar el usuario"), {
                                targetUserId: input.userId,
                                userId: userId || 'anonymous'
                            });
                        }
                        return [2 /*return*/, deleted];
                    case 5:
                        error_1 = _a.sent();
                        console.error("[".concat(timestamp, "] Error eliminando usuario"), {
                            targetUserId: input.userId,
                            error: error_1.message,
                            userId: userId || 'anonymous'
                        });
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DeleteUsuarioCommand.prototype.validateUserId = function (userId) {
        if (!userId || typeof userId !== 'string') {
            throw new errors_js_1.UsuarioInvalidIdError(userId || 'undefined');
        }
        var trimmed = userId.trim();
        if (trimmed.length === 0) {
            throw new errors_js_1.UsuarioInvalidIdError(userId);
        }
    };
    DeleteUsuarioCommand.prototype.checkUsuarioInUse = function (userId, requestingUserId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Aquí podríamos verificar si el usuario tiene:
                // - Sesiones activas
                // - Registros de auditoría críticos
                // - Relaciones importantes que no deberían eliminarse
                // - Etc.
                // Por ahora, una verificación básica: no permitir eliminar al propio usuario
                if (requestingUserId && userId === requestingUserId) {
                    throw new errors_js_1.UsuarioInUseError(userId);
                }
                console.log("[".concat(new Date().toISOString(), "] Verificando si usuario est\u00E1 en uso"), {
                    targetUserId: userId,
                    userId: requestingUserId || 'anonymous'
                });
                return [2 /*return*/];
            });
        });
    };
    return DeleteUsuarioCommand;
}());
exports.DeleteUsuarioCommand = DeleteUsuarioCommand;
