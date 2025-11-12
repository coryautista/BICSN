export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

export const REPORT_ERRORS = {
  INVALID_FILTERS: new ReportError('Invalid report filters provided', 'INVALID_FILTERS', 400),
  REPORT_NOT_FOUND: new ReportError('Report not found', 'REPORT_NOT_FOUND', 404),
  DATABASE_ERROR: new ReportError('Database error occurred', 'DATABASE_ERROR', 500),
  INVALID_DATE_RANGE: new ReportError('Invalid date range provided', 'INVALID_DATE_RANGE', 400),
} as const;