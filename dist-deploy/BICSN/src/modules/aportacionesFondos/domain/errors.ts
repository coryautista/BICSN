// Domain errors for fund contributions
export enum AportacionFondoError {
  TIPO_FONDO_INVALIDO = 'TIPO_FONDO_INVALIDO',
  CLAVE_ORGANICA_REQUERIDA = 'CLAVE_ORGANICA_REQUERIDA',
  USUARIO_NO_AUTORIZADO = 'USUARIO_NO_AUTORIZADO',
  DATOS_NO_ENCONTRADOS = 'DATOS_NO_ENCONTRADOS',
  ERROR_CALCULO_APORTACION = 'ERROR_CALCULO_APORTACION',
  PERIODO_NO_ENCONTRADO = 'PERIODO_NO_ENCONTRADO',
  ERROR_FIREBIRD_CONEXION = 'ERROR_FIREBIRD_CONEXION',
  ERROR_FIREBIRD_PROCEDIMIENTO = 'ERROR_FIREBIRD_PROCEDIMIENTO',
  CLAVE_ORGANICA_INVALIDA = 'CLAVE_ORGANICA_INVALIDA',
  PARAMETRO_INVALIDO = 'PARAMETRO_INVALIDO'
}

export class AportacionFondoDomainError extends Error {
  constructor(
    message: string,
    public code: AportacionFondoError,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AportacionFondoDomainError';
    Object.setPrototypeOf(this, AportacionFondoDomainError.prototype);
  }
}

export const AportacionFondoErrorMessages = {
  [AportacionFondoError.TIPO_FONDO_INVALIDO]: 'Tipo de fondo no válido. Opciones: ahorro, vivienda, prestaciones, cair',
  [AportacionFondoError.CLAVE_ORGANICA_REQUERIDA]: 'Las claves orgánicas son requeridas',
  [AportacionFondoError.USUARIO_NO_AUTORIZADO]: 'Usuario no autorizado para consultar estas claves orgánicas',
  [AportacionFondoError.DATOS_NO_ENCONTRADOS]: 'No se encontraron datos para las claves orgánicas especificadas',
  [AportacionFondoError.ERROR_CALCULO_APORTACION]: 'Error al calcular las aportaciones',
  [AportacionFondoError.PERIODO_NO_ENCONTRADO]: 'No se encontró período de aplicación para las claves orgánicas especificadas',
  [AportacionFondoError.ERROR_FIREBIRD_CONEXION]: 'Error de conexión con la base de datos Firebird',
  [AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO]: 'Error al ejecutar procedimiento almacenado en Firebird',
  [AportacionFondoError.CLAVE_ORGANICA_INVALIDA]: 'Clave orgánica inválida. Debe tener máximo 2 caracteres',
  [AportacionFondoError.PARAMETRO_INVALIDO]: 'Parámetro inválido en la solicitud'
};