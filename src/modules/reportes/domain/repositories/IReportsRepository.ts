import { MonthlyPersonnelReport, PersonnelMovement, ReportFilters } from '../entities/MonthlyPersonnelReport.js';

export interface IReportsRepository {
  getMonthlyPersonnelReport(filters: ReportFilters, scope: { org0: string; org1: string }): Promise<MonthlyPersonnelReport[]>;
  getPersonnelMovements(filters: ReportFilters, scope: { org0: string; org1: string }): Promise<PersonnelMovement[]>;
}
