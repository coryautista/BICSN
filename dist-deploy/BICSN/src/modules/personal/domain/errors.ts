import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo personal
 */
export class PersonalError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un registro personal no es encontrado
 */
export class PersonalNotFoundError extends PersonalError {
  constructor(interno: number) {
    super(
      `Registro personal con interno ${interno} no encontrado`,
      'PERSONAL_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un registro personal con el mismo interno
 */
export class PersonalAlreadyExistsError extends PersonalError {
  constructor(interno: number) {
    super(
      `Ya existe un registro personal con interno ${interno}`,
      'PERSONAL_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error cuando el interno no es válido
 */
export class PersonalInvalidInternoError extends PersonalError {
  constructor(interno: any) {
    super(
      `El interno '${interno}' no es válido. Debe ser un número entero positivo.`,
      'PERSONAL_INVALID_INTERNO',
      400
    );
  }
}

/**
 * Error cuando la CURP no es válida
 */
export class PersonalInvalidCurpError extends PersonalError {
  constructor(curp: string) {
    super(
      `La CURP '${curp}' no es válida. Debe tener 18 caracteres alfanuméricos.`,
      'PERSONAL_INVALID_CURP',
      400
    );
  }
}

/**
 * Error cuando el RFC no es válido
 */
export class PersonalInvalidRfcError extends PersonalError {
  constructor(rfc: string) {
    super(
      `El RFC '${rfc}' no es válido. Debe tener entre 12-13 caracteres alfanuméricos.`,
      'PERSONAL_INVALID_RFC',
      400
    );
  }
}

/**
 * Error cuando el número de empleado no es válido
 */
export class PersonalInvalidNoEmpleadoError extends PersonalError {
  constructor(noempleado: string) {
    super(
      `El número de empleado '${noempleado}' no es válido. Debe tener máximo 20 caracteres alfanuméricos.`,
      'PERSONAL_INVALID_NO_EMPLEADO',
      400
    );
  }
}

/**
 * Error cuando el nombre no es válido
 */
export class PersonalInvalidNombreError extends PersonalError {
  constructor(nombre: string) {
    super(
      `El nombre '${nombre}' no es válido. Debe tener máximo 50 caracteres y solo letras.`,
      'PERSONAL_INVALID_NOMBRE',
      400
    );
  }
}

/**
 * Error cuando el apellido paterno no es válido
 */
export class PersonalInvalidApellidoPaternoError extends PersonalError {
  constructor(apellido: string) {
    super(
      `El apellido paterno '${apellido}' no es válido. Debe tener máximo 50 caracteres y solo letras.`,
      'PERSONAL_INVALID_APELLIDO_PATERNO',
      400
    );
  }
}

/**
 * Error cuando el apellido materno no es válido
 */
export class PersonalInvalidApellidoMaternoError extends PersonalError {
  constructor(apellido: string) {
    super(
      `El apellido materno '${apellido}' no es válido. Debe tener máximo 50 caracteres y solo letras.`,
      'PERSONAL_INVALID_APELLIDO_MATERNO',
      400
    );
  }
}

/**
 * Error cuando la fecha de nacimiento no es válida
 */
export class PersonalInvalidFechaNacimientoError extends PersonalError {
  constructor(fecha: any) {
    super(
      `La fecha de nacimiento '${fecha}' no es válida. Debe ser una fecha ISO válida.`,
      'PERSONAL_INVALID_FECHA_NACIMIENTO',
      400
    );
  }
}

/**
 * Error cuando el seguro social no es válido
 */
export class PersonalInvalidSeguroSocialError extends PersonalError {
  constructor(seguro: string) {
    super(
      `El seguro social '${seguro}' no es válido. Debe tener 11 dígitos.`,
      'PERSONAL_INVALID_SEGURO_SOCIAL',
      400
    );
  }
}

/**
 * Error cuando el código postal no es válido
 */
export class PersonalInvalidCodigoPostalError extends PersonalError {
  constructor(codigo: string) {
    super(
      `El código postal '${codigo}' no es válido. Debe tener 5 dígitos.`,
      'PERSONAL_INVALID_CODIGO_POSTAL',
      400
    );
  }
}

/**
 * Error cuando el teléfono no es válido
 */
export class PersonalInvalidTelefonoError extends PersonalError {
  constructor(telefono: string) {
    super(
      `El teléfono '${telefono}' no es válido. Debe tener máximo 15 caracteres numéricos.`,
      'PERSONAL_INVALID_TELEFONO',
      400
    );
  }
}

/**
 * Error cuando el sexo no es válido
 */
export class PersonalInvalidSexoError extends PersonalError {
  constructor(sexo: any) {
    super(
      `El sexo '${sexo}' no es válido. Debe ser 'M', 'F' o null.`,
      'PERSONAL_INVALID_SEXO',
      400
    );
  }
}

/**
 * Error cuando el estado civil no es válido
 */
export class PersonalInvalidEstadoCivilError extends PersonalError {
  constructor(estado: any) {
    super(
      `El estado civil '${estado}' no es válido. Debe ser uno de los valores permitidos.`,
      'PERSONAL_INVALID_ESTADO_CIVIL',
      400
    );
  }
}

/**
 * Error cuando el email no es válido
 */
export class PersonalInvalidEmailError extends PersonalError {
  constructor(email: string) {
    super(
      `El email '${email}' no es válido. Debe tener un formato de email correcto.`,
      'PERSONAL_INVALID_EMAIL',
      400
    );
  }
}

/**
 * Error cuando la fecha de alta no es válida
 */
export class PersonalInvalidFechaAltaError extends PersonalError {
  constructor(fecha: any) {
    super(
      `La fecha de alta '${fecha}' no es válida. Debe ser una fecha ISO válida.`,
      'PERSONAL_INVALID_FECHA_ALTA',
      400
    );
  }
}

/**
 * Error cuando el celular no es válido
 */
export class PersonalInvalidCelularError extends PersonalError {
  constructor(celular: string) {
    super(
      `El celular '${celular}' no es válido. Debe tener máximo 15 caracteres numéricos.`,
      'PERSONAL_INVALID_CELULAR',
      400
    );
  }
}

/**
 * Error cuando el expediente no es válido
 */
export class PersonalInvalidExpedienteError extends PersonalError {
  constructor(expediente: string) {
    super(
      `El expediente '${expediente}' no es válido. Debe tener máximo 50 caracteres alfanuméricos.`,
      'PERSONAL_INVALID_EXPEDIENTE',
      400
    );
  }
}

/**
 * Error cuando la clave orgánica no es válida
 */
export class PersonalInvalidClaveOrganicaError extends PersonalError {
  constructor(clave: string, nivel: number) {
    super(
      `La clave orgánica ${nivel} '${clave}' no es válida. Debe ser una cadena de 1-2 caracteres alfanuméricos.`,
      'PERSONAL_INVALID_CLAVE_ORGANICA',
      400
    );
  }
}

/**
 * Error cuando el registro está en uso y no puede ser eliminado
 */
export class PersonalInUseError extends PersonalError {
  constructor(interno: number) {
    super(
      `El registro personal con interno ${interno} está en uso y no puede ser eliminado`,
      'PERSONAL_IN_USE',
      409
    );
  }
}

/**
 * Error de permisos para acceder a información personal
 */
export class PersonalPermissionError extends PersonalError {
  constructor(userId: string) {
    super(
      `El usuario '${userId}' no tiene permisos para acceder a esta información personal.`,
      'PERSONAL_PERMISSION_DENIED',
      403
    );
  }
}