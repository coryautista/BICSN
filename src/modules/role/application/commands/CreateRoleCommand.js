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
exports.CreateRoleCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var CreateRoleCommand = /** @class */ (function () {
    function CreateRoleCommand(roleRepo) {
        this.roleRepo = roleRepo;
    }
    CreateRoleCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existing, createdRole, error_1, createdRole, fallbackError_1, error_2;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Iniciando creaci\u00F3n de rol"), {
                            name: data.name,
                            description: data.description,
                            isSystem: data.isSystem,
                            isEntidad: data.isEntidad
                        });
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 13, , 14]);
                        // Validar datos de entrada
                        return [4 /*yield*/, this.validateCreateData(data)];
                    case 2:
                        // Validar datos de entrada
                        _e.sent();
                        return [4 /*yield*/, this.roleRepo.findByName(data.name)];
                    case 3:
                        existing = _e.sent();
                        if (existing) {
                            console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Rol ya existe, retornando rol existente (comportamiento idempotente)"), {
                                roleId: existing.id,
                                roleName: existing.name
                            });
                            return [2 /*return*/, existing];
                        }
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Creando nuevo rol"));
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 6, , 12]);
                        return [4 /*yield*/, this.roleRepo.create({
                                name: data.name,
                                description: data.description,
                                isSystem: (_a = data.isSystem) !== null && _a !== void 0 ? _a : false,
                                isEntidad: (_b = data.isEntidad) !== null && _b !== void 0 ? _b : false
                            })];
                    case 5:
                        createdRole = _e.sent();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Rol creado exitosamente"), {
                            roleId: createdRole.id,
                            roleName: createdRole.name
                        });
                        return [2 /*return*/, createdRole];
                    case 6:
                        error_1 = _e.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en creaci\u00F3n de rol:"), {
                            errorNumber: error_1.number,
                            errorCode: error_1.code,
                            errorMessage: error_1.message
                        });
                        // Unique constraint violation (duplicate key)
                        if (error_1.number === 2627) {
                            throw new errors_js_1.RoleAlreadyExistsError(data.name);
                        }
                        if (!(error_1.number === 334)) return [3 /*break*/, 11];
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Conflicto con OUTPUT, intentando m\u00E9todo alternativo"));
                        _e.label = 7;
                    case 7:
                        _e.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, this.roleRepo.createWithoutOutput({
                                name: data.name,
                                description: data.description,
                                isSystem: (_c = data.isSystem) !== null && _c !== void 0 ? _c : false,
                                isEntidad: (_d = data.isEntidad) !== null && _d !== void 0 ? _d : false
                            })];
                    case 8:
                        _e.sent();
                        return [4 /*yield*/, this.roleRepo.findByName(data.name)];
                    case 9:
                        createdRole = _e.sent();
                        if (createdRole) {
                            console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Rol creado exitosamente via m\u00E9todo alternativo"), {
                                roleId: createdRole.id,
                                roleName: createdRole.name
                            });
                            return [2 /*return*/, createdRole];
                        }
                        else {
                            throw new Error('No se pudo recuperar el rol creado después del método alternativo');
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        fallbackError_1 = _e.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] M\u00E9todo alternativo tambi\u00E9n fall\u00F3:"), {
                            errorNumber: fallbackError_1.number,
                            errorCode: fallbackError_1.code,
                            errorMessage: fallbackError_1.message
                        });
                        if (fallbackError_1.number === 2627) {
                            throw new errors_js_1.RoleAlreadyExistsError(data.name);
                        }
                        throw fallbackError_1;
                    case 11: throw error_1;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_2 = _e.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en comando de creaci\u00F3n de rol"), {
                            name: data.name,
                            error: error_2 instanceof Error ? error_2.message : 'Error desconocido'
                        });
                        throw error_2;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    CreateRoleCommand.prototype.validateCreateData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Validar nombre (requerido)
                if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.length > 50) {
                    throw new errors_js_1.RoleInvalidNameError(data.name || '');
                }
                // Validar formato del nombre (solo caracteres alfanuméricos y guiones bajos)
                if (!/^[A-Z0-9_]+$/i.test(data.name)) {
                    throw new errors_js_1.RoleInvalidNameError(data.name);
                }
                // Validar descripción si se proporciona
                if (data.description !== undefined && data.description !== null) {
                    if (typeof data.description !== 'string' || data.description.length > 255) {
                        throw new errors_js_1.RoleInvalidDescriptionError(data.description);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return CreateRoleCommand;
}());
exports.CreateRoleCommand = CreateRoleCommand;
