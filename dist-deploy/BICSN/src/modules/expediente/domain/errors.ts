import { DomainError } from '../../../utils/errors.js';

// DocumentType errors
export class DocumentTypeError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `DOCUMENT_TYPE_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class DocumentTypeNotFoundError extends DocumentTypeError {
  constructor(documentTypeId: number) {
    super(
      `Tipo de documento con ID ${documentTypeId} no encontrado`,
      'findById',
      { documentTypeId }
    );
  }
}

export class DocumentTypeByCodeNotFoundError extends DocumentTypeError {
  constructor(code: string) {
    super(
      `Tipo de documento con código '${code}' no encontrado`,
      'findByCode',
      { code }
    );
  }
}

export class DuplicateDocumentTypeError extends DocumentTypeError {
  constructor(code: string) {
    super(
      `Ya existe un tipo de documento con código '${code}'`,
      'create',
      { code }
    );
  }
}

export class InvalidDocumentTypeDataError extends DocumentTypeError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

// Expediente errors
export class ExpedienteError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `EXPEDIENTE_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class ExpedienteNotFoundError extends ExpedienteError {
  constructor(curp: string) {
    super(
      `Expediente con CURP ${curp} no encontrado`,
      'findByCurp',
      { curp }
    );
  }
}

export class DuplicateExpedienteError extends ExpedienteError {
  constructor(curp: string) {
    super(
      `Ya existe un expediente para la CURP ${curp}`,
      'create',
      { curp }
    );
  }
}

export class InvalidExpedienteDataError extends ExpedienteError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

export class InvalidCURPError extends ExpedienteError {
  constructor(curp: string) {
    super(
      `CURP '${curp}' inválida. Debe tener formato válido de 18 caracteres`,
      'curpValidation',
      { curp }
    );
  }
}

// ExpedienteArchivo errors
export class ExpedienteArchivoError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `EXPEDIENTE_ARCHIVO_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class ExpedienteArchivoNotFoundError extends ExpedienteArchivoError {
  constructor(archivoId: number) {
    super(
      `Archivo de expediente con ID ${archivoId} no encontrado`,
      'findById',
      { archivoId }
    );
  }
}

export class DuplicateExpedienteArchivoError extends ExpedienteArchivoError {
  constructor(curp: string, sha256Hex: string) {
    super(
      `Ya existe un archivo con el mismo hash SHA256 para la CURP ${curp}`,
      'create',
      { curp, sha256Hex }
    );
  }
}

export class InvalidExpedienteArchivoDataError extends ExpedienteArchivoError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

export class FileTooLargeError extends ExpedienteArchivoError {
  constructor(maxSize: number, actualSize: number) {
    super(
      `Archivo demasiado grande. Tamaño máximo: ${maxSize} bytes, tamaño actual: ${actualSize} bytes`,
      'fileSizeValidation',
      { maxSize, actualSize }
    );
  }
}

export class InvalidMimeTypeError extends ExpedienteArchivoError {
  constructor(mimeType: string, allowedTypes: string[]) {
    super(
      `Tipo MIME '${mimeType}' no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
      'mimeTypeValidation',
      { mimeType, allowedTypes }
    );
  }
}

export class InvalidFileNameError extends ExpedienteArchivoError {
  constructor(fileName: string) {
    super(
      `Nombre de archivo '${fileName}' inválido. Solo se permiten caracteres alfanuméricos, guiones y puntos`,
      'fileNameValidation',
      { fileName }
    );
  }
}

// Query errors
export class ExpedienteQueryError extends ExpedienteError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de expedientes: ${operation}`,
      'query',
      details
    );
  }
}

export class DocumentTypeQueryError extends DocumentTypeError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de tipos de documento: ${operation}`,
      'query',
      details
    );
  }
}

export class ExpedienteArchivoQueryError extends ExpedienteArchivoError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de archivos de expediente: ${operation}`,
      'query',
      details
    );
  }
}

// Command errors
export class ExpedienteCommandError extends ExpedienteError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de expedientes: ${operation}`,
      'command',
      details
    );
  }
}

export class DocumentTypeCommandError extends DocumentTypeError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de tipos de documento: ${operation}`,
      'command',
      details
    );
  }
}

export class ExpedienteArchivoCommandError extends ExpedienteArchivoError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de archivos de expediente: ${operation}`,
      'command',
      details
    );
  }
}

// Not found collections
export class ExpedientesNotFoundError extends ExpedienteError {
  constructor() {
    super(
      'No se encontraron expedientes en el sistema',
      'findAll',
      {}
    );
  }
}

export class DocumentTypesNotFoundError extends DocumentTypeError {
  constructor() {
    super(
      'No se encontraron tipos de documento en el sistema',
      'findAll',
      {}
    );
  }
}

export class ExpedienteArchivosNotFoundError extends ExpedienteArchivoError {
  constructor(curp: string) {
    super(
      `No se encontraron archivos para el expediente con CURP ${curp}`,
      'findByCurp',
      { curp }
    );
  }
}