export class CAIRError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CAIRError';
    Object.setPrototypeOf(this, CAIRError.prototype);
  }
}

export enum CAIRErrorCode {
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  FIREBIRD_CONNECTION_ERROR = 'FIREBIRD_CONNECTION_ERROR',
  FIREBIRD_QUERY_ERROR = 'FIREBIRD_QUERY_ERROR',
  STORED_PROCEDURE_ERROR = 'STORED_PROCEDURE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

