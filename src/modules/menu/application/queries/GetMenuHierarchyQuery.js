"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GetMenuHierarchyQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'getMenuHierarchyQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetMenuHierarchyQuery = /** @class */ (function () {
    function GetMenuHierarchyQuery(menuRepo) {
        this.menuRepo = menuRepo;
    }
    GetMenuHierarchyQuery.prototype.execute = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var menus, menuMap_1, rootMenus_1, sortMenus_1, hierarchy, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger.info({
                            operation: 'getMenuHierarchy',
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Consultando jerarquía de menús');
                        return [4 /*yield*/, this.menuRepo.findAll()];
                    case 1:
                        menus = _a.sent();
                        menuMap_1 = new Map();
                        rootMenus_1 = [];
                        // Primero, indexar todos los menús con children vacío
                        menus.forEach(function (menu) {
                            menuMap_1.set(menu.id, __assign(__assign({}, menu), { children: [] }));
                        });
                        // Luego, construir la jerarquía
                        menus.forEach(function (menu) {
                            var menuWithChildren = menuMap_1.get(menu.id);
                            if (menu.parentId) {
                                var parent_1 = menuMap_1.get(menu.parentId);
                                if (parent_1) {
                                    if (!parent_1.children) {
                                        parent_1.children = [];
                                    }
                                    parent_1.children.push(menuWithChildren);
                                }
                            }
                            else {
                                rootMenus_1.push(menuWithChildren);
                            }
                        });
                        sortMenus_1 = function (menus) {
                            return menus.sort(function (a, b) {
                                if (a.orden !== b.orden)
                                    return a.orden - b.orden;
                                return a.nombre.localeCompare(b.nombre);
                            }).map(function (menu) { return (__assign(__assign({}, menu), { children: menu.children ? sortMenus_1(menu.children) : [] })); });
                        };
                        hierarchy = sortMenus_1(rootMenus_1);
                        logger.info({
                            operation: 'getMenuHierarchy',
                            totalMenus: menus.length,
                            rootMenus: rootMenus_1.length,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Jerarquía de menús obtenida exitosamente');
                        return [2 /*return*/, hierarchy];
                    case 2:
                        error_1 = _a.sent();
                        logger.error({
                            operation: 'getMenuHierarchy',
                            error: error_1.message,
                            userId: userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al consultar jerarquía de menús');
                        throw new errors_js_1.MenuError('Error interno al consultar jerarquía de menús', 'MENU_HIERARCHY_QUERY_ERROR', 500);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return GetMenuHierarchyQuery;
}());
exports.GetMenuHierarchyQuery = GetMenuHierarchyQuery;
