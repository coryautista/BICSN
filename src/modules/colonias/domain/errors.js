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
exports.SearchColoniasError = exports.ColoniaCommandError = exports.ColoniaQueryError = exports.CodigoPostalNotFoundError = exports.MunicipioNotFoundError = exports.InvalidColoniaDataError = exports.DuplicateColoniaError = exports.ColoniaByCodigoPostalNotFoundError = exports.ColoniaByMunicipioNotFoundError = exports.ColoniaNotFoundError = exports.ColoniaError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
var ColoniaError = /** @class */ (function (_super) {
    __extends(ColoniaError, _super);
    function ColoniaError(message, operation, details) {
        return _super.call(this, message, "COLONIA_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return ColoniaError;
}(errors_js_1.DomainError));
exports.ColoniaError = ColoniaError;
var ColoniaNotFoundError = /** @class */ (function (_super) {
    __extends(ColoniaNotFoundError, _super);
    function ColoniaNotFoundError(coloniaId) {
        return _super.call(this, "Colonia con ID ".concat(coloniaId, " no encontrada"), 'findById', { coloniaId: coloniaId }) || this;
    }
    return ColoniaNotFoundError;
}(ColoniaError));
exports.ColoniaNotFoundError = ColoniaNotFoundError;
var ColoniaByMunicipioNotFoundError = /** @class */ (function (_super) {
    __extends(ColoniaByMunicipioNotFoundError, _super);
    function ColoniaByMunicipioNotFoundError(municipioId) {
        return _super.call(this, "No se encontraron colonias para el municipio ".concat(municipioId), 'findByMunicipio', { municipioId: municipioId }) || this;
    }
    return ColoniaByMunicipioNotFoundError;
}(ColoniaError));
exports.ColoniaByMunicipioNotFoundError = ColoniaByMunicipioNotFoundError;
var ColoniaByCodigoPostalNotFoundError = /** @class */ (function (_super) {
    __extends(ColoniaByCodigoPostalNotFoundError, _super);
    function ColoniaByCodigoPostalNotFoundError(codigoPostalId) {
        return _super.call(this, "No se encontraron colonias para el c\u00F3digo postal ".concat(codigoPostalId), 'findByCodigoPostal', { codigoPostalId: codigoPostalId }) || this;
    }
    return ColoniaByCodigoPostalNotFoundError;
}(ColoniaError));
exports.ColoniaByCodigoPostalNotFoundError = ColoniaByCodigoPostalNotFoundError;
var DuplicateColoniaError = /** @class */ (function (_super) {
    __extends(DuplicateColoniaError, _super);
    function DuplicateColoniaError(nombreColonia, municipioId) {
        return _super.call(this, "Ya existe una colonia con nombre '".concat(nombreColonia, "' en el municipio ").concat(municipioId), 'create', { nombreColonia: nombreColonia, municipioId: municipioId }) || this;
    }
    return DuplicateColoniaError;
}(ColoniaError));
exports.DuplicateColoniaError = DuplicateColoniaError;
var InvalidColoniaDataError = /** @class */ (function (_super) {
    __extends(InvalidColoniaDataError, _super);
    function InvalidColoniaDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidColoniaDataError;
}(ColoniaError));
exports.InvalidColoniaDataError = InvalidColoniaDataError;
var MunicipioNotFoundError = /** @class */ (function (_super) {
    __extends(MunicipioNotFoundError, _super);
    function MunicipioNotFoundError(municipioId) {
        return _super.call(this, "Municipio con ID ".concat(municipioId, " no encontrado"), 'municipioValidation', { municipioId: municipioId }) || this;
    }
    return MunicipioNotFoundError;
}(ColoniaError));
exports.MunicipioNotFoundError = MunicipioNotFoundError;
var CodigoPostalNotFoundError = /** @class */ (function (_super) {
    __extends(CodigoPostalNotFoundError, _super);
    function CodigoPostalNotFoundError(codigoPostalId) {
        return _super.call(this, "C\u00F3digo postal con ID ".concat(codigoPostalId, " no encontrado"), 'codigoPostalValidation', { codigoPostalId: codigoPostalId }) || this;
    }
    return CodigoPostalNotFoundError;
}(ColoniaError));
exports.CodigoPostalNotFoundError = CodigoPostalNotFoundError;
var ColoniaQueryError = /** @class */ (function (_super) {
    __extends(ColoniaQueryError, _super);
    function ColoniaQueryError(operation, details) {
        return _super.call(this, "Error en consulta de colonias: ".concat(operation), 'query', details) || this;
    }
    return ColoniaQueryError;
}(ColoniaError));
exports.ColoniaQueryError = ColoniaQueryError;
var ColoniaCommandError = /** @class */ (function (_super) {
    __extends(ColoniaCommandError, _super);
    function ColoniaCommandError(operation, details) {
        return _super.call(this, "Error en comando de colonias: ".concat(operation), 'command', details) || this;
    }
    return ColoniaCommandError;
}(ColoniaError));
exports.ColoniaCommandError = ColoniaCommandError;
var SearchColoniasError = /** @class */ (function (_super) {
    __extends(SearchColoniasError, _super);
    function SearchColoniasError(reason, filters) {
        return _super.call(this, "Error en b\u00FAsqueda de colonias: ".concat(reason), 'search', { filters: filters }) || this;
    }
    return SearchColoniasError;
}(ColoniaError));
exports.SearchColoniasError = SearchColoniasError;
