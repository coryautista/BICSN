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
  PARAMETRO_INVALIDO = 'PARAMETRO_INVALIDO',
  FORMULA_CALCULO_NO_ENCONTRADA = 'FORMULA_CALCULO_NO_ENCONTRADA',
  FORMULA_CALCULO_TRASLAPADA = 'FORMULA_CALCULO_TRASLAPADA',
  FORMULA_CALCULO_PARAMETROS_INVALIDOS = 'FORMULA_CALCULO_PARAMETROS_INVALIDOS',
  ERROR_SQL_FORMULA_CALCULO = 'ERROR_SQL_FORMULA_CALCULO',
  NOMINA_RFC_SIN_COINCIDENCIA = 'NOMINA_RFC_SIN_COINCIDENCIA',
  NOMINA_BASE_COTIZACION_INVALIDA = 'NOMINA_BASE_COTIZACION_INVALIDA',
  SNAPSHOT_V2_NO_ENCONTRADO = 'SNAPSHOT_V2_NO_ENCONTRADO',
  SNAPSHOT_V2_NO_DECIDIBLE = 'SNAPSHOT_V2_NO_DECIDIBLE'
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
  [AportacionFondoError.PARAMETRO_INVALIDO]: 'Parámetro inválido en la solicitud',
  [AportacionFondoError.FORMULA_CALCULO_NO_ENCONTRADA]: 'No existe una fórmula activa para el periodo',
  [AportacionFondoError.FORMULA_CALCULO_TRASLAPADA]: 'Existen fórmulas activas traslapadas para el periodo',
  [AportacionFondoError.FORMULA_CALCULO_PARAMETROS_INVALIDOS]: 'La fórmula de cálculo contiene parámetros inválidos',
  [AportacionFondoError.ERROR_SQL_FORMULA_CALCULO]: 'Error al consultar la fórmula de cálculo',
  [AportacionFondoError.NOMINA_RFC_SIN_COINCIDENCIA]: 'El RFC no existe en la nómina vigente del período',
  [AportacionFondoError.NOMINA_BASE_COTIZACION_INVALIDA]: 'La nómina vigente no contiene bases de cotización válidas',
  [AportacionFondoError.SNAPSHOT_V2_NO_ENCONTRADO]: 'Snapshot V2 no encontrado',
  [AportacionFondoError.SNAPSHOT_V2_NO_DECIDIBLE]: 'Solo se pueden decidir snapshots completos y cerrados'
};
