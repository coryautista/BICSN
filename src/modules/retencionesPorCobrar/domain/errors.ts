export class RetencionesPorCobrarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RetencionesPorCobrarError';
    Object.setPrototypeOf(this, RetencionesPorCobrarError.prototype);
  }
}

export enum RetencionesPorCobrarErrorCode {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  FIREBIRD_CONNECTION_ERROR = 'FIREBIRD_CONNECTION_ERROR',
  FIREBIRD_QUERY_ERROR = 'FIREBIRD_QUERY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_ORGANICA_KEYS = 'MISSING_ORGANICA_KEYS'
}

