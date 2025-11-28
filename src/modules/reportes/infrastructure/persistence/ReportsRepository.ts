import { getFirebirdDb } from '../../../../db/firebird.js';
import { IReportsRepository } from '../../domain/repositories/IReportsRepository.js';
import { MonthlyPersonnelReport, PersonnelMovement, ReportFilters } from '../../domain/entities/MonthlyPersonnelReport.js';
import pino from 'pino';

const logger = pino({
  name: 'ReportsRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class ReportsRepository implements IReportsRepository {
  async getMonthlyPersonnelReport(filters: ReportFilters): Promise<MonthlyPersonnelReport[]> {
    const db = getFirebirdDb();

    return new Promise((resolve, reject) => {
      // Complex query to get monthly report with bi-weekly breakdown
      const sql = `
        SELECT
          OP.CLAVE_ORGANICA_0,
          OP.CLAVE_ORGANICA_1,
          O1.DESCRIPCION,
          COUNT(DISTINCT CASE WHEN OP.ACTIVO = 'A' THEN OP.INTERNO END) as afiliados,
          -- Primera quincena altas (days 1-15)
          COUNT(CASE WHEN OP.ACTIVO = 'A' AND EXTRACT(DAY FROM OP.FECHA_MOV_ALT) BETWEEN 1 AND 15 THEN 1 END) as primera_quincena_altas,
          -- Primera quincena bajas (days 1-15)
          COUNT(CASE WHEN OP.ACTIVO = 'B' AND EXTRACT(DAY FROM OP.FECHA_MOV_ALT) BETWEEN 1 AND 15 THEN 1 END) as primera_quincena_bajas,
          -- Segunda quincena altas (days 16-end)
          COUNT(CASE WHEN OP.ACTIVO = 'A' AND EXTRACT(DAY FROM OP.FECHA_MOV_ALT) >= 16 THEN 1 END) as segunda_quincena_altas,
          -- Segunda quincena bajas (days 16-end)
          COUNT(CASE WHEN OP.ACTIVO = 'B' AND EXTRACT(DAY FROM OP.FECHA_MOV_ALT) >= 16 THEN 1 END) as segunda_quincena_bajas,
          -- Average monthly salary
          AVG(COALESCE(OP.SUELDO, 0)) as sueldo_mensual
        FROM ORG_PERSONAL OP
        LEFT JOIN ORGANICA_1 O1 ON OP.CLAVE_ORGANICA_0 = O1.CLAVE_ORGANICA_0
                               AND OP.CLAVE_ORGANICA_1 = O1.CLAVE_ORGANICA_1
        WHERE EXTRACT(YEAR FROM OP.FECHA_MOV_ALT) = ?
          AND EXTRACT(MONTH FROM OP.FECHA_MOV_ALT) = ?
          ${filters.organica0 ? 'AND OP.CLAVE_ORGANICA_0 = ?' : ''}
          ${filters.organica1 ? 'AND OP.CLAVE_ORGANICA_1 = ?' : ''}
        GROUP BY OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, O1.DESCRIPCION
        ORDER BY OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1
      `;

      const params: any[] = [filters.year, filters.month];
      if (filters.organica0) params.push(filters.organica0);
      if (filters.organica1) params.push(filters.organica1);

      db.query(sql, params, (err: any, result: any) => {
        if (err) {
          logger.error({
            error: err.message,
            stack: err.stack,
            operation: 'getMonthlyPersonnelReport',
            filters
          }, 'REPORTS_REPO_ERROR');
          reject(err);
          return;
        }

        const reports: MonthlyPersonnelReport[] = result.map((row: any) => ({
          month: filters.month,
          year: filters.year,
          organica0: row.CLAVE_ORGANICA_0,
          organica1: row.CLAVE_ORGANICA_1,
          descripcionOrganica1: row.DESCRIPCION || '',
          sueldoMensual: row.SUELDO_MENSUAL || 0,
          afiliados: row.AFILIADOS || 0,
          primeraQuincena: {
            altas: row.PRIMERA_QUINCENA_ALTAS || 0,
            bajas: row.PRIMERA_QUINCENA_BAJAS || 0
          },
          segundaQuincena: {
            altas: row.SEGUNDA_QUINCENA_ALTAS || 0,
            bajas: row.SEGUNDA_QUINCENA_BAJAS || 0
          }
        }));

        logger.info({
          operation: 'getMonthlyPersonnelReport',
          recordCount: reports.length,
          filters
        }, 'REPORTS_REPO_SUCCESS');

        resolve(reports);
      });
    });
  }

  async getPersonnelMovements(filters: ReportFilters): Promise<PersonnelMovement[]> {
    const db = getFirebirdDb();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT FIRST 10
          OP.INTERNO,
          P.NOMBRE || COALESCE(' ' || P.APELLIDO_PATERNO, '') || COALESCE(' ' || P.APELLIDO_MATERNO, '') as nombre_completo,
          OP.CLAVE_ORGANICA_0,
          OP.CLAVE_ORGANICA_1,
          OP.ACTIVO,
          OP.FECHA_MOV_ALT,
          OP.SUELDO,
          CASE WHEN EXTRACT(DAY FROM OP.FECHA_MOV_ALT) BETWEEN 1 AND 15 THEN 1 ELSE 2 END as quincena
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE EXTRACT(YEAR FROM OP.FECHA_MOV_ALT) = ?
          AND EXTRACT(MONTH FROM OP.FECHA_MOV_ALT) = ?
          ${filters.organica0 ? 'AND OP.CLAVE_ORGANICA_0 = ?' : ''}
          ${filters.organica1 ? 'AND OP.CLAVE_ORGANICA_1 = ?' : ''}
        ORDER BY OP.FECHA_MOV_ALT, OP.INTERNO
      `;

      const params: any[] = [filters.year, filters.month];
      if (filters.organica0) params.push(filters.organica0);
      if (filters.organica1) params.push(filters.organica1);

      db.query(sql, params, (err: any, result: any) => {
        if (err) {
          logger.error({
            error: err.message,
            stack: err.stack,
            operation: 'getPersonnelMovements',
            filters
          }, 'REPORTS_REPO_ERROR');
          reject(err);
          return;
        }

        const movements: PersonnelMovement[] = result.map((row: any) => ({
          interno: row.INTERNO,
          nombreCompleto: row.NOMBRE_COMPLETO || '',
          organica0: row.CLAVE_ORGANICA_0,
          organica1: row.CLAVE_ORGANICA_1,
          tipoMovimiento: row.ACTIVO === 'A' ? 'ALTA' : 'BAJA',
          fechaMovimiento: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : '',
          quincena: row.QUINCENA,
          sueldo: row.SUELDO || 0
        }));

        logger.info({
          operation: 'getPersonnelMovements',
          recordCount: movements.length,
          filters
        }, 'REPORTS_REPO_SUCCESS');

        resolve(movements);
      });
    });
  }
}