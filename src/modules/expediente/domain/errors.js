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
exports.ExpedienteArchivosNotFoundError = exports.DocumentTypesNotFoundError = exports.ExpedientesNotFoundError = exports.ExpedienteArchivoCommandError = exports.DocumentTypeCommandError = exports.ExpedienteCommandError = exports.ExpedienteArchivoQueryError = exports.DocumentTypeQueryError = exports.ExpedienteQueryError = exports.InvalidFileNameError = exports.InvalidMimeTypeError = exports.FileTooLargeError = exports.InvalidExpedienteArchivoDataError = exports.DuplicateExpedienteArchivoError = exports.ExpedienteArchivoNotFoundError = exports.ExpedienteArchivoError = exports.InvalidCURPError = exports.InvalidExpedienteDataError = exports.DuplicateExpedienteError = exports.ExpedienteNotFoundError = exports.ExpedienteError = exports.InvalidDocumentTypeDataError = exports.DuplicateDocumentTypeError = exports.DocumentTypeByCodeNotFoundError = exports.DocumentTypeNotFoundError = exports.DocumentTypeError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
// DocumentType errors
var DocumentTypeError = /** @class */ (function (_super) {
    __extends(DocumentTypeError, _super);
    function DocumentTypeError(message, operation, details) {
        return _super.call(this, message, "DOCUMENT_TYPE_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return DocumentTypeError;
}(errors_js_1.DomainError));
exports.DocumentTypeError = DocumentTypeError;
var DocumentTypeNotFoundError = /** @class */ (function (_super) {
    __extends(DocumentTypeNotFoundError, _super);
    function DocumentTypeNotFoundError(documentTypeId) {
        return _super.call(this, "Tipo de documento con ID ".concat(documentTypeId, " no encontrado"), 'findById', { documentTypeId: documentTypeId }) || this;
    }
    return DocumentTypeNotFoundError;
}(DocumentTypeError));
exports.DocumentTypeNotFoundError = DocumentTypeNotFoundError;
var DocumentTypeByCodeNotFoundError = /** @class */ (function (_super) {
    __extends(DocumentTypeByCodeNotFoundError, _super);
    function DocumentTypeByCodeNotFoundError(code) {
        return _super.call(this, "Tipo de documento con c\u00F3digo '".concat(code, "' no encontrado"), 'findByCode', { code: code }) || this;
    }
    return DocumentTypeByCodeNotFoundError;
}(DocumentTypeError));
exports.DocumentTypeByCodeNotFoundError = DocumentTypeByCodeNotFoundError;
var DuplicateDocumentTypeError = /** @class */ (function (_super) {
    __extends(DuplicateDocumentTypeError, _super);
    function DuplicateDocumentTypeError(code) {
        return _super.call(this, "Ya existe un tipo de documento con c\u00F3digo '".concat(code, "'"), 'create', { code: code }) || this;
    }
    return DuplicateDocumentTypeError;
}(DocumentTypeError));
exports.DuplicateDocumentTypeError = DuplicateDocumentTypeError;
var InvalidDocumentTypeDataError = /** @class */ (function (_super) {
    __extends(InvalidDocumentTypeDataError, _super);
    function InvalidDocumentTypeDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidDocumentTypeDataError;
}(DocumentTypeError));
exports.InvalidDocumentTypeDataError = InvalidDocumentTypeDataError;
// Expediente errors
var ExpedienteError = /** @class */ (function (_super) {
    __extends(ExpedienteError, _super);
    function ExpedienteError(message, operation, details) {
        return _super.call(this, message, "EXPEDIENTE_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return ExpedienteError;
}(errors_js_1.DomainError));
exports.ExpedienteError = ExpedienteError;
var ExpedienteNotFoundError = /** @class */ (function (_super) {
    __extends(ExpedienteNotFoundError, _super);
    function ExpedienteNotFoundError(curp) {
        return _super.call(this, "Expediente con CURP ".concat(curp, " no encontrado"), 'findByCurp', { curp: curp }) || this;
    }
    return ExpedienteNotFoundError;
}(ExpedienteError));
exports.ExpedienteNotFoundError = ExpedienteNotFoundError;
var DuplicateExpedienteError = /** @class */ (function (_super) {
    __extends(DuplicateExpedienteError, _super);
    function DuplicateExpedienteError(curp) {
        return _super.call(this, "Ya existe un expediente para la CURP ".concat(curp), 'create', { curp: curp }) || this;
    }
    return DuplicateExpedienteError;
}(ExpedienteError));
exports.DuplicateExpedienteError = DuplicateExpedienteError;
var InvalidExpedienteDataError = /** @class */ (function (_super) {
    __extends(InvalidExpedienteDataError, _super);
    function InvalidExpedienteDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidExpedienteDataError;
}(ExpedienteError));
exports.InvalidExpedienteDataError = InvalidExpedienteDataError;
var InvalidCURPError = /** @class */ (function (_super) {
    __extends(InvalidCURPError, _super);
    function InvalidCURPError(curp) {
        return _super.call(this, "CURP '".concat(curp, "' inv\u00E1lida. Debe tener formato v\u00E1lido de 18 caracteres"), 'curpValidation', { curp: curp }) || this;
    }
    return InvalidCURPError;
}(ExpedienteError));
exports.InvalidCURPError = InvalidCURPError;
// ExpedienteArchivo errors
var ExpedienteArchivoError = /** @class */ (function (_super) {
    __extends(ExpedienteArchivoError, _super);
    function ExpedienteArchivoError(message, operation, details) {
        return _super.call(this, message, "EXPEDIENTE_ARCHIVO_".concat(operation.toUpperCase(), "_ERROR"), 500, details) || this;
    }
    return ExpedienteArchivoError;
}(errors_js_1.DomainError));
exports.ExpedienteArchivoError = ExpedienteArchivoError;
var ExpedienteArchivoNotFoundError = /** @class */ (function (_super) {
    __extends(ExpedienteArchivoNotFoundError, _super);
    function ExpedienteArchivoNotFoundError(archivoId) {
        return _super.call(this, "Archivo de expediente con ID ".concat(archivoId, " no encontrado"), 'findById', { archivoId: archivoId }) || this;
    }
    return ExpedienteArchivoNotFoundError;
}(ExpedienteArchivoError));
exports.ExpedienteArchivoNotFoundError = ExpedienteArchivoNotFoundError;
var DuplicateExpedienteArchivoError = /** @class */ (function (_super) {
    __extends(DuplicateExpedienteArchivoError, _super);
    function DuplicateExpedienteArchivoError(curp, sha256Hex) {
        return _super.call(this, "Ya existe un archivo con el mismo hash SHA256 para la CURP ".concat(curp), 'create', { curp: curp, sha256Hex: sha256Hex }) || this;
    }
    return DuplicateExpedienteArchivoError;
}(ExpedienteArchivoError));
exports.DuplicateExpedienteArchivoError = DuplicateExpedienteArchivoError;
var InvalidExpedienteArchivoDataError = /** @class */ (function (_super) {
    __extends(InvalidExpedienteArchivoDataError, _super);
    function InvalidExpedienteArchivoDataError(field, reason) {
        return _super.call(this, "Campo '".concat(field, "' inv\u00E1lido: ").concat(reason), 'validation', { field: field, reason: reason }) || this;
    }
    return InvalidExpedienteArchivoDataError;
}(ExpedienteArchivoError));
exports.InvalidExpedienteArchivoDataError = InvalidExpedienteArchivoDataError;
var FileTooLargeError = /** @class */ (function (_super) {
    __extends(FileTooLargeError, _super);
    function FileTooLargeError(maxSize, actualSize) {
        return _super.call(this, "Archivo demasiado grande. Tama\u00F1o m\u00E1ximo: ".concat(maxSize, " bytes, tama\u00F1o actual: ").concat(actualSize, " bytes"), 'fileSizeValidation', { maxSize: maxSize, actualSize: actualSize }) || this;
    }
    return FileTooLargeError;
}(ExpedienteArchivoError));
exports.FileTooLargeError = FileTooLargeError;
var InvalidMimeTypeError = /** @class */ (function (_super) {
    __extends(InvalidMimeTypeError, _super);
    function InvalidMimeTypeError(mimeType, allowedTypes) {
        return _super.call(this, "Tipo MIME '".concat(mimeType, "' no permitido. Tipos permitidos: ").concat(allowedTypes.join(', ')), 'mimeTypeValidation', { mimeType: mimeType, allowedTypes: allowedTypes }) || this;
    }
    return InvalidMimeTypeError;
}(ExpedienteArchivoError));
exports.InvalidMimeTypeError = InvalidMimeTypeError;
var InvalidFileNameError = /** @class */ (function (_super) {
    __extends(InvalidFileNameError, _super);
    function InvalidFileNameError(fileName) {
        return _super.call(this, "Nombre de archivo '".concat(fileName, "' inv\u00E1lido. Solo se permiten caracteres alfanum\u00E9ricos, guiones y puntos"), 'fileNameValidation', { fileName: fileName }) || this;
    }
    return InvalidFileNameError;
}(ExpedienteArchivoError));
exports.InvalidFileNameError = InvalidFileNameError;
// Query errors
var ExpedienteQueryError = /** @class */ (function (_super) {
    __extends(ExpedienteQueryError, _super);
    function ExpedienteQueryError(operation, details) {
        return _super.call(this, "Error en consulta de expedientes: ".concat(operation), 'query', details) || this;
    }
    return ExpedienteQueryError;
}(ExpedienteError));
exports.ExpedienteQueryError = ExpedienteQueryError;
var DocumentTypeQueryError = /** @class */ (function (_super) {
    __extends(DocumentTypeQueryError, _super);
    function DocumentTypeQueryError(operation, details) {
        return _super.call(this, "Error en consulta de tipos de documento: ".concat(operation), 'query', details) || this;
    }
    return DocumentTypeQueryError;
}(DocumentTypeError));
exports.DocumentTypeQueryError = DocumentTypeQueryError;
var ExpedienteArchivoQueryError = /** @class */ (function (_super) {
    __extends(ExpedienteArchivoQueryError, _super);
    function ExpedienteArchivoQueryError(operation, details) {
        return _super.call(this, "Error en consulta de archivos de expediente: ".concat(operation), 'query', details) || this;
    }
    return ExpedienteArchivoQueryError;
}(ExpedienteArchivoError));
exports.ExpedienteArchivoQueryError = ExpedienteArchivoQueryError;
// Command errors
var ExpedienteCommandError = /** @class */ (function (_super) {
    __extends(ExpedienteCommandError, _super);
    function ExpedienteCommandError(operation, details) {
        return _super.call(this, "Error en comando de expedientes: ".concat(operation), 'command', details) || this;
    }
    return ExpedienteCommandError;
}(ExpedienteError));
exports.ExpedienteCommandError = ExpedienteCommandError;
var DocumentTypeCommandError = /** @class */ (function (_super) {
    __extends(DocumentTypeCommandError, _super);
    function DocumentTypeCommandError(operation, details) {
        return _super.call(this, "Error en comando de tipos de documento: ".concat(operation), 'command', details) || this;
    }
    return DocumentTypeCommandError;
}(DocumentTypeError));
exports.DocumentTypeCommandError = DocumentTypeCommandError;
var ExpedienteArchivoCommandError = /** @class */ (function (_super) {
    __extends(ExpedienteArchivoCommandError, _super);
    function ExpedienteArchivoCommandError(operation, details) {
        return _super.call(this, "Error en comando de archivos de expediente: ".concat(operation), 'command', details) || this;
    }
    return ExpedienteArchivoCommandError;
}(ExpedienteArchivoError));
exports.ExpedienteArchivoCommandError = ExpedienteArchivoCommandError;
// Not found collections
var ExpedientesNotFoundError = /** @class */ (function (_super) {
    __extends(ExpedientesNotFoundError, _super);
    function ExpedientesNotFoundError() {
        return _super.call(this, 'No se encontraron expedientes en el sistema', 'findAll', {}) || this;
    }
    return ExpedientesNotFoundError;
}(ExpedienteError));
exports.ExpedientesNotFoundError = ExpedientesNotFoundError;
var DocumentTypesNotFoundError = /** @class */ (function (_super) {
    __extends(DocumentTypesNotFoundError, _super);
    function DocumentTypesNotFoundError() {
        return _super.call(this, 'No se encontraron tipos de documento en el sistema', 'findAll', {}) || this;
    }
    return DocumentTypesNotFoundError;
}(DocumentTypeError));
exports.DocumentTypesNotFoundError = DocumentTypesNotFoundError;
var ExpedienteArchivosNotFoundError = /** @class */ (function (_super) {
    __extends(ExpedienteArchivosNotFoundError, _super);
    function ExpedienteArchivosNotFoundError(curp) {
        return _super.call(this, "No se encontraron archivos para el expediente con CURP ".concat(curp), 'findByCurp', { curp: curp }) || this;
    }
    return ExpedienteArchivosNotFoundError;
}(ExpedienteArchivoError));
exports.ExpedienteArchivosNotFoundError = ExpedienteArchivosNotFoundError;
