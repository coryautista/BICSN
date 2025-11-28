import { ReportFilters } from './reportes.schemas.js';

// Service class that orchestrates the report operations
export class ReportesService {
  private reportsRepo: any;
  private getMonthlyReportQuery: any;
  private getPersonnelMovementsQuery: any;

  constructor(deps: {
    reportsRepo: any;
    getMonthlyReportQuery: any;
    getPersonnelMovementsQuery: any;
  }) {
    this.reportsRepo = deps.reportsRepo;
    this.getMonthlyReportQuery = deps.getMonthlyReportQuery;
    this.getPersonnelMovementsQuery = deps.getPersonnelMovementsQuery;
  }

  async getMonthlyPersonnelReport(filters: ReportFilters, userId?: string) {
    return this.getMonthlyReportQuery.execute(filters, userId);
  }

  async getPersonnelMovements(filters: ReportFilters, userId?: string) {
    return this.getPersonnelMovementsQuery.execute(filters, userId);
  }
}