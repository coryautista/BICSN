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
exports.InfoRepositoryError = exports.InfoCreationDataMissingError = exports.InvalidInfoIdError = exports.InvalidInfoColorError = exports.InvalidInfoNameError = exports.InfoAlreadyExistsError = exports.InfoNotFoundError = exports.InfoError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
/**
 * Errores específicos del dominio Info
 */
// Error base para el dominio Info
var InfoError = /** @class */ (function (_super) {
    __extends(InfoError, _super);
    function InfoError(message, code, details) {
        var _this = _super.call(this, message, code, details) || this;
        _this.name = 'InfoError';
        return _this;
    }
    return InfoError;
}(errors_js_1.DomainError));
exports.InfoError = InfoError;
// Error cuando un Info no se encuentra
var InfoNotFoundError = /** @class */ (function (_super) {
    __extends(InfoNotFoundError, _super);
    function InfoNotFoundError(infoId) {
        var _this = _super.call(this, "La informaci\u00F3n con ID ".concat(infoId, " no fue encontrada"), 'INFO_NOT_FOUND', { infoId: infoId }) || this;
        _this.name = 'InfoNotFoundError';
        return _this;
    }
    return InfoNotFoundError;
}(InfoError));
exports.InfoNotFoundError = InfoNotFoundError;
// Error cuando ya existe un Info con el mismo nombre
var InfoAlreadyExistsError = /** @class */ (function (_super) {
    __extends(InfoAlreadyExistsError, _super);
    function InfoAlreadyExistsError(nombre) {
        var _this = _super.call(this, "Ya existe una informaci\u00F3n con el nombre '".concat(nombre, "'"), 'INFO_ALREADY_EXISTS', { nombre: nombre }) || this;
        _this.name = 'InfoAlreadyExistsError';
        return _this;
    }
    return InfoAlreadyExistsError;
}(InfoError));
exports.InfoAlreadyExistsError = InfoAlreadyExistsError;
// Error de validación para el nombre del Info
var InvalidInfoNameError = /** @class */ (function (_super) {
    __extends(InvalidInfoNameError, _super);
    function InvalidInfoNameError(nombre, reason) {
        var _this = _super.call(this, "El nombre '".concat(nombre, "' no es v\u00E1lido: ").concat(reason), 'INVALID_INFO_NAME', { nombre: nombre, reason: reason }) || this;
        _this.name = 'InvalidInfoNameError';
        return _this;
    }
    return InvalidInfoNameError;
}(InfoError));
exports.InvalidInfoNameError = InvalidInfoNameError;
// Error de validación para colores
var InvalidInfoColorError = /** @class */ (function (_super) {
    __extends(InvalidInfoColorError, _super);
    function InvalidInfoColorError(colorType, colorValue) {
        var _this = _super.call(this, "El color ".concat(colorType, " '").concat(colorValue, "' no tiene un formato v\u00E1lido"), 'INVALID_INFO_COLOR', { colorType: colorType, colorValue: colorValue }) || this;
        _this.name = 'InvalidInfoColorError';
        return _this;
    }
    return InvalidInfoColorError;
}(InfoError));
exports.InvalidInfoColorError = InvalidInfoColorError;
// Error cuando el ID del Info es inválido
var InvalidInfoIdError = /** @class */ (function (_super) {
    __extends(InvalidInfoIdError, _super);
    function InvalidInfoIdError(id) {
        var _this = _super.call(this, "El ID '".concat(id, "' no es un n\u00FAmero entero v\u00E1lido"), 'INVALID_INFO_ID', { id: id }) || this;
        _this.name = 'InvalidInfoIdError';
        return _this;
    }
    return InvalidInfoIdError;
}(InfoError));
exports.InvalidInfoIdError = InvalidInfoIdError;
// Error cuando faltan datos requeridos para crear un Info
var InfoCreationDataMissingError = /** @class */ (function (_super) {
    __extends(InfoCreationDataMissingError, _super);
    function InfoCreationDataMissingError(missingFields) {
        var _this = _super.call(this, "Faltan datos requeridos para crear la informaci\u00F3n: ".concat(missingFields.join(', ')), 'INFO_CREATION_DATA_MISSING', { missingFields: missingFields }) || this;
        _this.name = 'InfoCreationDataMissingError';
        return _this;
    }
    return InfoCreationDataMissingError;
}(InfoError));
exports.InfoCreationDataMissingError = InfoCreationDataMissingError;
// Error cuando ocurre un problema al acceder al repositorio
var InfoRepositoryError = /** @class */ (function (_super) {
    __extends(InfoRepositoryError, _super);
    function InfoRepositoryError(operation, originalError) {
        var _this = _super.call(this, "Error en el repositorio durante la operaci\u00F3n '".concat(operation, "'"), 'INFO_REPOSITORY_ERROR', { operation: operation, originalError: originalError === null || originalError === void 0 ? void 0 : originalError.message }) || this;
        _this.name = 'InfoRepositoryError';
        return _this;
    }
    return InfoRepositoryError;
}(InfoError));
exports.InfoRepositoryError = InfoRepositoryError;
