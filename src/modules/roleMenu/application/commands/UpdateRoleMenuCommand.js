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
exports.UpdateRoleMenuCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var UpdateRoleMenuCommand = /** @class */ (function () {
    function UpdateRoleMenuCommand(roleMenuRepo, menuRepo) {
        this.roleMenuRepo = roleMenuRepo;
        this.menuRepo = menuRepo;
    }
    UpdateRoleMenuCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existing, hasFieldsToUpdate, newRoleId, newMenuId_1, roleMenus, menu, updated, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Iniciando actualizaci\u00F3n de asignaci\u00F3n role-menu"), {
                            roleMenuId: data.id,
                            camposActualizar: Object.keys(data).filter(function (key) { return key !== 'id' && data[key] !== undefined; })
                        });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 9, , 10]);
                        // Validar ID del roleMenu
                        if (!data.id || typeof data.id !== 'number' || data.id <= 0 || !Number.isInteger(data.id)) {
                            throw new errors_js_1.RoleMenuInvalidIdError(data.id);
                        }
                        return [4 /*yield*/, this.roleMenuRepo.findById(data.id)];
                    case 2:
                        existing = _c.sent();
                        if (!existing) {
                            throw new errors_js_1.RoleMenuNotFoundError(data.id);
                        }
                        // Validar datos de entrada si se proporcionan
                        return [4 /*yield*/, this.validateUpdateInput(data)];
                    case 3:
                        // Validar datos de entrada si se proporcionan
                        _c.sent();
                        hasFieldsToUpdate = data.roleId !== undefined ||
                            data.menuId !== undefined ||
                            data.createdAt !== undefined;
                        if (!hasFieldsToUpdate) {
                            console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] No hay campos para actualizar en roleMenu ").concat(data.id));
                            return [2 /*return*/, existing];
                        }
                        if (!(data.roleId || data.menuId)) return [3 /*break*/, 7];
                        newRoleId = (_a = data.roleId) !== null && _a !== void 0 ? _a : existing.roleId;
                        newMenuId_1 = (_b = data.menuId) !== null && _b !== void 0 ? _b : existing.menuId;
                        if (!(newRoleId !== existing.roleId || newMenuId_1 !== existing.menuId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.roleMenuRepo.findByRoleId(newRoleId)];
                    case 4:
                        roleMenus = _c.sent();
                        if (roleMenus.some(function (rm) { return rm.menuId === newMenuId_1 && rm.id !== data.id; })) {
                            throw new errors_js_1.RoleMenuAlreadyExistsError(newRoleId, newMenuId_1);
                        }
                        _c.label = 5;
                    case 5:
                        if (!data.menuId) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.menuRepo.findById(data.menuId)];
                    case 6:
                        menu = _c.sent();
                        if (!menu) {
                            throw new errors_js_1.RoleMenuMenuNotFoundError(data.menuId);
                        }
                        _c.label = 7;
                    case 7: return [4 /*yield*/, this.roleMenuRepo.update(data.id, data.roleId, data.menuId, data.createdAt)];
                    case 8:
                        updated = _c.sent();
                        if (!updated) {
                            throw new errors_js_1.RoleMenuNotFoundError(data.id);
                        }
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Asignaci\u00F3n role-menu actualizada exitosamente"), {
                            roleMenuId: updated.id,
                            roleId: updated.roleId,
                            menuId: updated.menuId,
                            cambiosAplicados: Object.keys(data).filter(function (key) { return key !== 'id' && data[key] !== undefined; })
                        });
                        return [2 /*return*/, updated];
                    case 9:
                        error_1 = _c.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en actualizaci\u00F3n de asignaci\u00F3n role-menu"), {
                            roleMenuId: data.id,
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido'
                        });
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    UpdateRoleMenuCommand.prototype.validateUpdateInput = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Validar roleId si se proporciona
                if (data.roleId !== undefined) {
                    if (typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
                        throw new errors_js_1.RoleMenuInvalidRoleIdError(data.roleId);
                    }
                }
                // Validar menuId si se proporciona
                if (data.menuId !== undefined) {
                    if (typeof data.menuId !== 'number' || data.menuId <= 0 || !Number.isInteger(data.menuId)) {
                        throw new errors_js_1.RoleMenuInvalidMenuIdError(data.menuId);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return UpdateRoleMenuCommand;
}());
exports.UpdateRoleMenuCommand = UpdateRoleMenuCommand;
