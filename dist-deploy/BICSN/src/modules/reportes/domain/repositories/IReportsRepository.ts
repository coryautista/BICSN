import { MonthlyPersonnelReport, PersonnelMovement, ReportFilters } from '../entities/MonthlyPersonnelReport.js';

export interface IReportsRepository {
  getMonthlyPersonnelReport(filters: ReportFilters): Promise<MonthlyPersonnelReport[]>;
  getPersonnelMovements(filters: ReportFilters): Promise<PersonnelMovement[]>;
}