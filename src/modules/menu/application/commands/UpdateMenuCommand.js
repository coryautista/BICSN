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
exports.UpdateMenuCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'updateMenuCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var UpdateMenuCommand = /** @class */ (function () {
    function UpdateMenuCommand(menuRepo) {
        this.menuRepo = menuRepo;
    }
    UpdateMenuCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, menuWithSameName, parent_1, updateData, updated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        logger.info({
                            operation: 'updateMenu',
                            menuId: input.id,
                            nombre: input.nombre,
                            componente: input.componente,
                            parentId: input.parentId,
                            icono: input.icono,
                            orden: input.orden,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando actualización de menú');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.menuRepo.findById(input.id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.MenuNotFoundError(input.id);
                        }
                        if (!(input.nombre !== undefined && input.nombre !== existing.nombre)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.menuRepo.findByName(input.nombre)];
                    case 2:
                        menuWithSameName = _a.sent();
                        if (menuWithSameName && menuWithSameName.id !== input.id) {
                            throw new errors_js_1.MenuAlreadyExistsError(input.nombre);
                        }
                        _a.label = 3;
                    case 3:
                        if (!(input.parentId !== undefined)) return [3 /*break*/, 6];
                        if (!(input.parentId !== null)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.menuRepo.findById(input.parentId)];
                    case 4:
                        parent_1 = _a.sent();
                        if (!parent_1) {
                            throw new errors_js_1.MenuInvalidParentError(input.parentId);
                        }
                        // Verificar que no se cree un ciclo en la jerarquía
                        return [4 /*yield*/, this.validateHierarchyCycle(input.parentId, input.id)];
                    case 5:
                        // Verificar que no se cree un ciclo en la jerarquía
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        updateData = {
                            nombre: input.nombre,
                            componente: input.componente,
                            parentId: input.parentId,
                            icono: input.icono,
                            orden: input.orden
                        };
                        return [4 /*yield*/, this.menuRepo.update(input.id, updateData)];
                    case 7:
                        updated = _a.sent();
                        if (!updated) {
                            throw new errors_js_1.MenuError('Error interno al actualizar menú', 'MENU_UPDATE_ERROR', 500);
                        }
                        logger.info({
                            operation: 'updateMenu',
                            menuId: updated.id,
                            nombre: updated.nombre,
                            orden: updated.orden,
                            parentId: updated.parentId,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Menú actualizado exitosamente');
                        return [2 /*return*/, updated];
                    case 8:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.MenuNotFoundError ||
                            error_1 instanceof errors_js_1.MenuAlreadyExistsError ||
                            error_1 instanceof errors_js_1.MenuInvalidNameError ||
                            error_1 instanceof errors_js_1.MenuInvalidComponentError ||
                            error_1 instanceof errors_js_1.MenuInvalidOrderError ||
                            error_1 instanceof errors_js_1.MenuInvalidParentError ||
                            error_1 instanceof errors_js_1.MenuHierarchyCycleError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'updateMenu',
                            error: error_1.message,
                            menuId: input.id,
                            nombre: input.nombre,
                            parentId: input.parentId,
                            userId: userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al actualizar menú');
                        throw new errors_js_1.MenuError('Error interno al actualizar menú', 'MENU_UPDATE_ERROR', 500);
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    UpdateMenuCommand.prototype.validateInput = function (input) {
        // Validar ID
        if (!Number.isInteger(input.id) || input.id <= 0) {
            throw new errors_js_1.MenuInvalidParentError(input.id);
        }
        // Validar nombre si se proporciona
        if (input.nombre !== undefined) {
            if (typeof input.nombre !== 'string') {
                throw new errors_js_1.MenuInvalidNameError('debe ser una cadena de texto');
            }
            var nombreTrimmed = input.nombre.trim();
            if (nombreTrimmed.length === 0) {
                throw new errors_js_1.MenuInvalidNameError('no puede estar vacío');
            }
            if (nombreTrimmed.length > 100) {
                throw new errors_js_1.MenuInvalidNameError('no puede tener más de 100 caracteres');
            }
            // Solo permitir letras, números, espacios y algunos caracteres especiales
            var nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
            if (!nombreRegex.test(nombreTrimmed)) {
                throw new errors_js_1.MenuInvalidNameError('solo puede contener letras, números, espacios, guiones y guiones bajos');
            }
        }
        // Validar componente si se proporciona
        if (input.componente !== undefined) {
            if (input.componente !== null && typeof input.componente !== 'string') {
                throw new errors_js_1.MenuInvalidComponentError('debe ser una cadena de texto o null');
            }
            if (input.componente !== null) {
                var componenteTrimmed = input.componente.trim();
                if (componenteTrimmed.length > 200) {
                    throw new errors_js_1.MenuInvalidComponentError('no puede tener más de 200 caracteres');
                }
                // Validar formato de componente (debe ser un path válido)
                var componenteRegex = /^[a-zA-Z0-9\-_\/\.]+$/;
                if (componenteTrimmed.length > 0 && !componenteRegex.test(componenteTrimmed)) {
                    throw new errors_js_1.MenuInvalidComponentError('tiene un formato inválido');
                }
            }
        }
        // Validar orden si se proporciona
        if (input.orden !== undefined) {
            if (!Number.isInteger(input.orden)) {
                throw new errors_js_1.MenuInvalidOrderError('debe ser un número entero');
            }
            if (input.orden < 0) {
                throw new errors_js_1.MenuInvalidOrderError('no puede ser negativo');
            }
            if (input.orden > 9999) {
                throw new errors_js_1.MenuInvalidOrderError('no puede ser mayor a 9999');
            }
        }
        // Validar parentId si se proporciona
        if (input.parentId !== undefined) {
            if (input.parentId !== null) {
                if (!Number.isInteger(input.parentId) || input.parentId <= 0) {
                    throw new errors_js_1.MenuInvalidParentError(input.parentId);
                }
            }
        }
        // Validar icono si se proporciona
        if (input.icono !== undefined) {
            if (input.icono !== null && typeof input.icono !== 'string') {
                throw new errors_js_1.MenuInvalidComponentError('el icono debe ser una cadena de texto o null');
            }
            if (input.icono !== null) {
                var iconoTrimmed = input.icono.trim();
                if (iconoTrimmed.length > 50) {
                    throw new errors_js_1.MenuInvalidComponentError('el icono no puede tener más de 50 caracteres');
                }
            }
        }
    };
    UpdateMenuCommand.prototype.validateHierarchyCycle = function (parentId, currentMenuId) {
        return __awaiter(this, void 0, void 0, function () {
            var currentParentId, visitedIds, parentMenu;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentParentId = parentId;
                        visitedIds = new Set();
                        _a.label = 1;
                    case 1:
                        if (!(currentParentId !== null)) return [3 /*break*/, 3];
                        if (visitedIds.has(currentParentId)) {
                            throw new errors_js_1.MenuHierarchyCycleError(currentMenuId, parentId);
                        }
                        if (currentParentId === currentMenuId) {
                            throw new errors_js_1.MenuHierarchyCycleError(currentMenuId, parentId);
                        }
                        visitedIds.add(currentParentId);
                        return [4 /*yield*/, this.menuRepo.findById(currentParentId)];
                    case 2:
                        parentMenu = _a.sent();
                        if (!parentMenu) {
                            return [3 /*break*/, 3]; // El padre no existe, pero esto ya se valida antes
                        }
                        currentParentId = parentMenu.parentId;
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return UpdateMenuCommand;
}());
exports.UpdateMenuCommand = UpdateMenuCommand;
