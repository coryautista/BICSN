export class AplicacionQuincenalError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AplicacionQuincenalError';
    Object.setPrototypeOf(this, AplicacionQuincenalError.prototype);
  }
}

export enum AplicacionQuincenalErrorCode {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  FIREBIRD_CONNECTION_ERROR = 'FIREBIRD_CONNECTION_ERROR',
  FIREBIRD_QUERY_ERROR = 'FIREBIRD_QUERY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_ORGANICA_KEYS = 'MISSING_ORGANICA_KEYS'
}

