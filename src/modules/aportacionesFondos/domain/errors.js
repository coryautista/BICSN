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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AportacionFondoErrorMessages = exports.AportacionFondoDomainError = exports.AportacionFondoError = void 0;
// Domain errors for fund contributions
var AportacionFondoError;
(function (AportacionFondoError) {
    AportacionFondoError["TIPO_FONDO_INVALIDO"] = "TIPO_FONDO_INVALIDO";
    AportacionFondoError["CLAVE_ORGANICA_REQUERIDA"] = "CLAVE_ORGANICA_REQUERIDA";
    AportacionFondoError["USUARIO_NO_AUTORIZADO"] = "USUARIO_NO_AUTORIZADO";
    AportacionFondoError["DATOS_NO_ENCONTRADOS"] = "DATOS_NO_ENCONTRADOS";
    AportacionFondoError["ERROR_CALCULO_APORTACION"] = "ERROR_CALCULO_APORTACION";
})(AportacionFondoError || (exports.AportacionFondoError = AportacionFondoError = {}));
var AportacionFondoDomainError = /** @class */ (function (_super) {
    __extends(AportacionFondoDomainError, _super);
    function AportacionFondoDomainError(message, code, isOperational) {
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.isOperational = isOperational;
        _this.name = 'AportacionFondoDomainError';
        Object.setPrototypeOf(_this, AportacionFondoDomainError.prototype);
        return _this;
    }
    return AportacionFondoDomainError;
}(Error));
exports.AportacionFondoDomainError = AportacionFondoDomainError;
exports.AportacionFondoErrorMessages = (_a = {},
    _a[AportacionFondoError.TIPO_FONDO_INVALIDO] = 'Tipo de fondo no válido. Opciones: ahorro, vivienda, prestaciones, cair',
    _a[AportacionFondoError.CLAVE_ORGANICA_REQUERIDA] = 'Las claves orgánicas son requeridas',
    _a[AportacionFondoError.USUARIO_NO_AUTORIZADO] = 'Usuario no autorizado para consultar estas claves orgánicas',
    _a[AportacionFondoError.DATOS_NO_ENCONTRADOS] = 'No se encontraron datos para las claves orgánicas especificadas',
    _a[AportacionFondoError.ERROR_CALCULO_APORTACION] = 'Error al calcular las aportaciones',
    _a);
