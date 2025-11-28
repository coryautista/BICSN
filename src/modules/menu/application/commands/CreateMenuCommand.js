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
exports.CreateMenuCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createMenuCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateMenuCommand = /** @class */ (function () {
    function CreateMenuCommand(menuRepo) {
        this.menuRepo = menuRepo;
    }
    CreateMenuCommand.prototype.execute = function (input, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMenu, parent_1, menuData, menu, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        logger.info({
                            operation: 'createMenu',
                            nombre: input.nombre,
                            orden: input.orden,
                            componente: input.componente,
                            parentId: input.parentId,
                            icono: input.icono,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando creación de menú');
                        // Validaciones de entrada
                        this.validateInput(input);
                        return [4 /*yield*/, this.menuRepo.findByName(input.nombre)];
                    case 1:
                        existingMenu = _d.sent();
                        if (existingMenu) {
                            throw new errors_js_1.MenuAlreadyExistsError(input.nombre);
                        }
                        if (!input.parentId) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.menuRepo.findById(input.parentId)];
                    case 2:
                        parent_1 = _d.sent();
                        if (!parent_1) {
                            throw new errors_js_1.MenuInvalidParentError(input.parentId);
                        }
                        // Verificar que no se cree un ciclo en la jerarquía
                        return [4 /*yield*/, this.validateHierarchyCycle(input.parentId, null)];
                    case 3:
                        // Verificar que no se cree un ciclo en la jerarquía
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        menuData = {
                            nombre: input.nombre,
                            orden: input.orden,
                            componente: (_a = input.componente) !== null && _a !== void 0 ? _a : null,
                            parentId: (_b = input.parentId) !== null && _b !== void 0 ? _b : null,
                            icono: (_c = input.icono) !== null && _c !== void 0 ? _c : null
                        };
                        return [4 /*yield*/, this.menuRepo.create(menuData)];
                    case 5:
                        menu = _d.sent();
                        logger.info({
                            operation: 'createMenu',
                            menuId: menu.id,
                            nombre: menu.nombre,
                            orden: menu.orden,
                            parentId: menu.parentId,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Menú creado exitosamente');
                        return [2 /*return*/, menu];
                    case 6:
                        error_1 = _d.sent();
                        if (error_1 instanceof errors_js_1.MenuAlreadyExistsError ||
                            error_1 instanceof errors_js_1.MenuInvalidNameError ||
                            error_1 instanceof errors_js_1.MenuInvalidComponentError ||
                            error_1 instanceof errors_js_1.MenuInvalidOrderError ||
                            error_1 instanceof errors_js_1.MenuInvalidParentError ||
                            error_1 instanceof errors_js_1.MenuHierarchyCycleError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'createMenu',
                            error: error_1.message,
                            nombre: input.nombre,
                            orden: input.orden,
                            parentId: input.parentId,
                            userId: userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al crear menú');
                        throw new errors_js_1.MenuError('Error interno al crear menú', 'MENU_CREATE_ERROR', 500);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CreateMenuCommand.prototype.validateInput = function (input) {
        // Validar nombre
        if (!input.nombre || typeof input.nombre !== 'string') {
            throw new errors_js_1.MenuInvalidNameError('es requerido y debe ser una cadena de texto');
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
        // Validar componente si se proporciona
        if (input.componente !== undefined && input.componente !== null) {
            if (typeof input.componente !== 'string') {
                throw new errors_js_1.MenuInvalidComponentError('debe ser una cadena de texto');
            }
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
        // Validar orden
        if (!Number.isInteger(input.orden)) {
            throw new errors_js_1.MenuInvalidOrderError('debe ser un número entero');
        }
        if (input.orden < 0) {
            throw new errors_js_1.MenuInvalidOrderError('no puede ser negativo');
        }
        if (input.orden > 9999) {
            throw new errors_js_1.MenuInvalidOrderError('no puede ser mayor a 9999');
        }
        // Validar parentId si se proporciona
        if (input.parentId !== undefined && input.parentId !== null) {
            if (!Number.isInteger(input.parentId) || input.parentId <= 0) {
                throw new errors_js_1.MenuInvalidParentError(input.parentId);
            }
        }
        // Validar icono si se proporciona
        if (input.icono !== undefined && input.icono !== null) {
            if (typeof input.icono !== 'string') {
                throw new errors_js_1.MenuInvalidComponentError('el icono debe ser una cadena de texto');
            }
            var iconoTrimmed = input.icono.trim();
            if (iconoTrimmed.length > 50) {
                throw new errors_js_1.MenuInvalidComponentError('el icono no puede tener más de 50 caracteres');
            }
        }
    };
    CreateMenuCommand.prototype.validateHierarchyCycle = function (parentId, currentMenuId) {
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
                            throw new errors_js_1.MenuHierarchyCycleError(currentMenuId || 0, parentId);
                        }
                        if (currentMenuId !== null && currentParentId === currentMenuId) {
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
    return CreateMenuCommand;
}());
exports.CreateMenuCommand = CreateMenuCommand;
