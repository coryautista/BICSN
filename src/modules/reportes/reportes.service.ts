import { ReportsRepository } from './infrastructure/persistence/ReportsRepository.js';
import { GetMonthlyPersonnelReportQuery } from './application/queries/GetMonthlyPersonnelReportQuery.js';
import { GetPersonnelMovementsQuery } from './application/queries/GetPersonnelMovementsQuery.js';
import { ReportFilters } from './reportes.schemas.js';

// Service class that orchestrates the report operations
export class ReportesService {
  private reportsRepo: ReportsRepository;
  private getMonthlyReportQuery: GetMonthlyPersonnelReportQuery;
  private getPersonnelMovementsQuery: GetPersonnelMovementsQuery;

  constructor() {
    this.reportsRepo = new ReportsRepository();
    this.getMonthlyReportQuery = new GetMonthlyPersonnelReportQuery(this.reportsRepo);
    this.getPersonnelMovementsQuery = new GetPersonnelMovementsQuery(this.reportsRepo);
  }

  async getMonthlyPersonnelReport(filters: ReportFilters, userId?: string) {
    return this.getMonthlyReportQuery.execute(filters, userId);
  }

  async getPersonnelMovements(filters: ReportFilters, userId?: string) {
    return this.getPersonnelMovementsQuery.execute(filters, userId);
  }
}