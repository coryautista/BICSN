import { IReportsRepository } from '../../domain/repositories/IReportsRepository.js';
import { PersonnelMovement, ReportFilters } from '../../domain/entities/MonthlyPersonnelReport.js';
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
        throw new Error('Month and year are required');
      }

      if (filters.month < 1 || filters.month > 12) {
        throw new Error('Month must be between 1 and 12');
      }

      if (filters.year < 2000 || filters.year > new Date().getFullYear() + 1) {
        throw new Error('Invalid year provided');
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
      logger.error({
        operation: 'GET_PERSONNEL_MOVEMENTS',
        userId: userId || 'SYSTEM',
        filters,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'REPORTS_QUERY_ERROR');
      throw error;
    }
  }
}