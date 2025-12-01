import { IReportsRepository } from '../../domain/repositories/IReportsRepository.js';
import { PersonnelMovement, ReportFilters } from '../../domain/entities/MonthlyPersonnelReport.js';
import {
  MissingMonthOrYearError,
  InvalidMonthError,
  InvalidYearError,
  ReportDatabaseError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'GetPersonnelMovementsQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetPersonnelMovementsQuery {
  constructor(private reportsRepo: IReportsRepository) {}

  async execute(filters: ReportFilters, userId?: string): Promise<PersonnelMovement[]> {
    logger.info({
      operation: 'GET_PERSONNEL_MOVEMENTS',
      userId: userId || 'SYSTEM',
      filters,
      timestamp: new Date().toISOString()
    }, 'REPORTS_QUERY');

    try {
      // Validate filters
      if (!filters.month || !filters.year) {
        throw new MissingMonthOrYearError();
      }

      if (filters.month < 1 || filters.month > 12) {
        throw new InvalidMonthError(filters.month);
      }

      if (filters.year < 2000 || filters.year > new Date().getFullYear() + 1) {
        throw new InvalidYearError(filters.year);
      }

      const movements = await this.reportsRepo.getPersonnelMovements(filters);

      logger.info({
        operation: 'GET_PERSONNEL_MOVEMENTS',
        userId: userId || 'SYSTEM',
        recordCount: movements.length,
        filters,
        timestamp: new Date().toISOString()
      }, 'REPORTS_QUERY_SUCCESS');

      return movements;

    } catch (error) {
      // Re-throw domain errors as-is
      if (error instanceof MissingMonthOrYearError ||
          error instanceof InvalidMonthError ||
          error instanceof InvalidYearError) {
        throw error;
      }

      logger.error({
        operation: 'GET_PERSONNEL_MOVEMENTS',
        userId: userId || 'SYSTEM',
        filters,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, 'REPORTS_QUERY_ERROR');

      // Wrap database errors
      if (error instanceof Error) {
        throw new ReportDatabaseError(error.message, { originalError: error.message });
      }

      throw error;
    }
  }
}