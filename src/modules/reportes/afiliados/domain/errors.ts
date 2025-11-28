export class AfiliadosReportesError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AfiliadosReportesError';
    Object.setPrototypeOf(this, AfiliadosReportesError.prototype);
  }
}

export enum AfiliadosReportesErrorCode {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  FIREBIRD_CONNECTION_ERROR = 'FIREBIRD_CONNECTION_ERROR',
  FIREBIRD_QUERY_ERROR = 'FIREBIRD_QUERY_ERROR',
  STORED_PROCEDURE_ERROR = 'STORED_PROCEDURE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

