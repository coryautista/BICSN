"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuPermissionError = exports.MenuHasChildrenError = exports.MenuHierarchyCycleError = exports.MenuInvalidParentError = exports.MenuInvalidOrderError = exports.MenuInvalidComponentError = exports.MenuInvalidNameError = exports.MenuAlreadyExistsError = exports.MenuNotFoundError = exports.MenuError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Error base para operaciones del módulo menú
 */
var MenuError = /** @class */ (function (_super) {
    __extends(MenuError, _super);
    function MenuError(message, code, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        return _super.call(this, message, code, statusCode) || this;
    }
    return MenuError;
}(errors_js_1.DomainError));
exports.MenuError = MenuError;
/**
 * Error cuando un menú no es encontrado
 */
var MenuNotFoundError = /** @class */ (function (_super) {
    __extends(MenuNotFoundError, _super);
    function MenuNotFoundError(menuId) {
        return _super.call(this, "Men\u00FA con ID ".concat(menuId, " no encontrado"), 'MENU_NOT_FOUND', 404) || this;
    }
    return MenuNotFoundError;
}(MenuError));
exports.MenuNotFoundError = MenuNotFoundError;
/**
 * Error cuando ya existe un menú con el mismo nombre
 */
var MenuAlreadyExistsError = /** @class */ (function (_super) {
    __extends(MenuAlreadyExistsError, _super);
    function MenuAlreadyExistsError(nombre) {
        return _super.call(this, "Ya existe un men\u00FA con el nombre: ".concat(nombre), 'MENU_ALREADY_EXISTS', 409) || this;
    }
    return MenuAlreadyExistsError;
}(MenuError));
exports.MenuAlreadyExistsError = MenuAlreadyExistsError;
/**
 * Error de validación del nombre del menú
 */
var MenuInvalidNameError = /** @class */ (function (_super) {
    __extends(MenuInvalidNameError, _super);
    function MenuInvalidNameError(details) {
        return _super.call(this, "Nombre del men\u00FA inv\u00E1lido: ".concat(details), 'MENU_INVALID_NAME', 400) || this;
    }
    return MenuInvalidNameError;
}(MenuError));
exports.MenuInvalidNameError = MenuInvalidNameError;
/**
 * Error de validación del componente del menú
 */
var MenuInvalidComponentError = /** @class */ (function (_super) {
    __extends(MenuInvalidComponentError, _super);
    function MenuInvalidComponentError(details) {
        return _super.call(this, "Componente del men\u00FA inv\u00E1lido: ".concat(details), 'MENU_INVALID_COMPONENT', 400) || this;
    }
    return MenuInvalidComponentError;
}(MenuError));
exports.MenuInvalidComponentError = MenuInvalidComponentError;
/**
 * Error de validación del orden del menú
 */
var MenuInvalidOrderError = /** @class */ (function (_super) {
    __extends(MenuInvalidOrderError, _super);
    function MenuInvalidOrderError(details) {
        return _super.call(this, "Orden del men\u00FA inv\u00E1lido: ".concat(details), 'MENU_INVALID_ORDER', 400) || this;
    }
    return MenuInvalidOrderError;
}(MenuError));
exports.MenuInvalidOrderError = MenuInvalidOrderError;
/**
 * Error cuando se intenta crear un menú con parentId inválido
 */
var MenuInvalidParentError = /** @class */ (function (_super) {
    __extends(MenuInvalidParentError, _super);
    function MenuInvalidParentError(parentId) {
        return _super.call(this, "El men\u00FA padre con ID ".concat(parentId, " no existe"), 'MENU_INVALID_PARENT', 400) || this;
    }
    return MenuInvalidParentError;
}(MenuError));
exports.MenuInvalidParentError = MenuInvalidParentError;
/**
 * Error cuando se intenta crear un ciclo en la jerarquía de menús
 */
var MenuHierarchyCycleError = /** @class */ (function (_super) {
    __extends(MenuHierarchyCycleError, _super);
    function MenuHierarchyCycleError(menuId, parentId) {
        return _super.call(this, "No se puede asignar el men\u00FA ".concat(parentId, " como padre del men\u00FA ").concat(menuId, " porque crear\u00EDa un ciclo en la jerarqu\u00EDa"), 'MENU_HIERARCHY_CYCLE', 400) || this;
    }
    return MenuHierarchyCycleError;
}(MenuError));
exports.MenuHierarchyCycleError = MenuHierarchyCycleError;
/**
 * Error cuando se intenta eliminar un menú que tiene hijos
 */
var MenuHasChildrenError = /** @class */ (function (_super) {
    __extends(MenuHasChildrenError, _super);
    function MenuHasChildrenError(menuId) {
        return _super.call(this, "No se puede eliminar el men\u00FA ".concat(menuId, " porque tiene men\u00FAs hijos"), 'MENU_HAS_CHILDREN', 409) || this;
    }
    return MenuHasChildrenError;
}(MenuError));
exports.MenuHasChildrenError = MenuHasChildrenError;
/**
 * Error de permisos insuficientes para operaciones de menú
 */
var MenuPermissionError = /** @class */ (function (_super) {
    __extends(MenuPermissionError, _super);
    function MenuPermissionError(operation) {
        return _super.call(this, "Permisos insuficientes para la operaci\u00F3n: ".concat(operation), 'MENU_PERMISSION_DENIED', 403) || this;
    }
    return MenuPermissionError;
}(MenuError));
exports.MenuPermissionError = MenuPermissionError;
