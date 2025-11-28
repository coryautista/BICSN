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
exports.RoleMenuPermissionError = exports.RoleMenuInUseError = exports.RoleMenuMenuNotFoundError = exports.RoleMenuRoleNotFoundError = exports.RoleMenuInvalidMenuIdError = exports.RoleMenuInvalidRoleIdError = exports.RoleMenuInvalidIdError = exports.RoleMenuAlreadyExistsError = exports.RoleMenuNotFoundError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var RoleMenuNotFoundError = /** @class */ (function (_super) {
    __extends(RoleMenuNotFoundError, _super);
    function RoleMenuNotFoundError(id) {
        return _super.call(this, "RoleMenu con ID ".concat(id, " no encontrado"), 'ROLE_MENU_NOT_FOUND', 404) || this;
    }
    return RoleMenuNotFoundError;
}(errors_js_1.DomainError));
exports.RoleMenuNotFoundError = RoleMenuNotFoundError;
var RoleMenuAlreadyExistsError = /** @class */ (function (_super) {
    __extends(RoleMenuAlreadyExistsError, _super);
    function RoleMenuAlreadyExistsError(roleId, menuId) {
        return _super.call(this, "El men\u00FA ".concat(menuId, " ya est\u00E1 asignado al rol ").concat(roleId), 'ROLE_MENU_ALREADY_EXISTS', 409) || this;
    }
    return RoleMenuAlreadyExistsError;
}(errors_js_1.DomainError));
exports.RoleMenuAlreadyExistsError = RoleMenuAlreadyExistsError;
var RoleMenuInvalidIdError = /** @class */ (function (_super) {
    __extends(RoleMenuInvalidIdError, _super);
    function RoleMenuInvalidIdError(id) {
        return _super.call(this, "ID de RoleMenu inv\u00E1lido: ".concat(id), 'ROLE_MENU_INVALID_ID', 400) || this;
    }
    return RoleMenuInvalidIdError;
}(errors_js_1.DomainError));
exports.RoleMenuInvalidIdError = RoleMenuInvalidIdError;
var RoleMenuInvalidRoleIdError = /** @class */ (function (_super) {
    __extends(RoleMenuInvalidRoleIdError, _super);
    function RoleMenuInvalidRoleIdError(roleId) {
        return _super.call(this, "ID de rol inv\u00E1lido: ".concat(roleId), 'ROLE_MENU_INVALID_ROLE_ID', 400) || this;
    }
    return RoleMenuInvalidRoleIdError;
}(errors_js_1.DomainError));
exports.RoleMenuInvalidRoleIdError = RoleMenuInvalidRoleIdError;
var RoleMenuInvalidMenuIdError = /** @class */ (function (_super) {
    __extends(RoleMenuInvalidMenuIdError, _super);
    function RoleMenuInvalidMenuIdError(menuId) {
        return _super.call(this, "ID de men\u00FA inv\u00E1lido: ".concat(menuId), 'ROLE_MENU_INVALID_MENU_ID', 400) || this;
    }
    return RoleMenuInvalidMenuIdError;
}(errors_js_1.DomainError));
exports.RoleMenuInvalidMenuIdError = RoleMenuInvalidMenuIdError;
var RoleMenuRoleNotFoundError = /** @class */ (function (_super) {
    __extends(RoleMenuRoleNotFoundError, _super);
    function RoleMenuRoleNotFoundError(roleId) {
        return _super.call(this, "Rol con ID ".concat(roleId, " no encontrado"), 'ROLE_MENU_ROLE_NOT_FOUND', 404) || this;
    }
    return RoleMenuRoleNotFoundError;
}(errors_js_1.DomainError));
exports.RoleMenuRoleNotFoundError = RoleMenuRoleNotFoundError;
var RoleMenuMenuNotFoundError = /** @class */ (function (_super) {
    __extends(RoleMenuMenuNotFoundError, _super);
    function RoleMenuMenuNotFoundError(menuId) {
        return _super.call(this, "Men\u00FA con ID ".concat(menuId, " no encontrado"), 'ROLE_MENU_MENU_NOT_FOUND', 404) || this;
    }
    return RoleMenuMenuNotFoundError;
}(errors_js_1.DomainError));
exports.RoleMenuMenuNotFoundError = RoleMenuMenuNotFoundError;
var RoleMenuInUseError = /** @class */ (function (_super) {
    __extends(RoleMenuInUseError, _super);
    function RoleMenuInUseError(id, reason) {
        return _super.call(this, "RoleMenu ".concat(id, " no puede eliminarse: ").concat(reason), 'ROLE_MENU_IN_USE', 409) || this;
    }
    return RoleMenuInUseError;
}(errors_js_1.DomainError));
exports.RoleMenuInUseError = RoleMenuInUseError;
var RoleMenuPermissionError = /** @class */ (function (_super) {
    __extends(RoleMenuPermissionError, _super);
    function RoleMenuPermissionError(action) {
        return _super.call(this, "No tiene permisos para ".concat(action, " roleMenus"), 'ROLE_MENU_PERMISSION_ERROR', 403) || this;
    }
    return RoleMenuPermissionError;
}(errors_js_1.DomainError));
exports.RoleMenuPermissionError = RoleMenuPermissionError;
