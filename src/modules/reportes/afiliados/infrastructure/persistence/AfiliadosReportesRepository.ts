import { executeSerializedQuery } from '../../../../../db/firebird.js';
import { IAfiliadosReportesRepository } from '../../domain/repositories/IAfiliadosReportesRepository.js';
import { HistorialMovimientosQuin } from '../../domain/entities/HistorialMovimientosQuin.js';
import { HistorialMovPromedioSdo } from '../../domain/entities/HistorialMovPromedioSdo.js';
import { AfiliadosReportesError, AfiliadosReportesErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'AfiliadosReportesRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AfiliadosReportesRepository implements IAfiliadosReportesRepository {
  async getHistorialMovimientosQuin(periodo: string): Promise<HistorialMovimientosQuin[]> {
    const startTime = Date.now();
    
    // Asegurar que el período tenga exactamente 4 caracteres (formato esperado por Firebird)
    const periodoFormateado = String(periodo || '').trim().substring(0, 4).padStart(4, '0');
    
    const logContext = {
      operation: 'getHistorialMovimientosQuin',
      periodo,
      periodoFormateado
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.ORG0, 
        p.ORG1, 
        p.QUINCENA, 
        p.NORG, 
        p.MOVIMIENTOS, 
        p.QUINCENA1, 
        p.FECHA1,
        p.FECHA, 
        p.NOMAL, 
        p.NOMBA, 
        p.NOMCS, 
        p.AL, 
        p.BA, 
        p.CS, 
        p.AL1, 
        p.BA1, 
        p.CS1,
        p.TOTAL_INICIAL, 
        p.TOTAL_ACTUAL, 
        p.TOTAL, 
        p.CVE_ERROR, 
        p.NOM_ERROR,
        p.PSUELDO, 
        p.POTRAS_PRESTACIONES, 
        p.PQUINQUENIOS
      FROM HISTORIAL_MOVIMIENTOS_QUIN(?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<HistorialMovimientosQuin[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado HISTORIAL_MOVIMIENTOS_QUIN');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AfiliadosReportesError(
            'Conexión a Firebird no disponible o inválida',
            AfiliadosReportesErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodoFormateado],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;

              if (err) {
                logger.error({
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                }, 'Error ejecutando procedimiento');
                reject(new AfiliadosReportesError(
                  `Error al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN: ${err.message || String(err)}`,
                  AfiliadosReportesErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Debug: Log del primer registro raw
              if (result.length > 0) {
                logger.info({ ...logContext, primerRegistro: result[0], keys: Object.keys(result[0]) }, 'Primer registro raw de Firebird');
              }

              const historiales: HistorialMovimientosQuin[] = result.map((row: any) => ({
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                quincena: String(row.QUINCENA || ''),
                nOrg: String(row.NORG || ''),
                movimientos: Number(row.MOVIMIENTOS || 0),
                quincena1: String(row.QUINCENA1 || ''),
                fecha1: row.FECHA1 instanceof Date ? row.FECHA1.toISOString() : String(row.FECHA1 || ''),
                fecha: row.FECHA instanceof Date ? row.FECHA.toISOString() : String(row.FECHA || ''),
                nomAl: String(row.NOMAL || ''),
                nomBa: String(row.NOMBA || ''),
                nomCs: String(row.NOMCS || ''),
                al: Number(row.AL || 0),
                ba: Number(row.BA || 0),
                cs: Number(row.CS || 0),
                al1: Number(row.AL1 || 0),
                ba1: Number(row.BA1 || 0),
                cs1: Number(row.CS1 || 0),
                totalInicial: Number(row.TOTAL_INICIAL || 0),
                totalActual: Number(row.TOTAL_ACTUAL || 0),
                total: Number(row.TOTAL || 0),
                cveError: Number(row.CVE_ERROR || 0),
                nomError: String(row.NOM_ERROR || ''),
                pSueldo: Number(row.PSUELDO || 0),
                pOtrasPrestaciones: Number(row.POTRAS_PRESTACIONES || 0),
                pQuinquenios: Number(row.PQUINQUENIOS || 0)
              }));

              logger.info({
                ...logContext,
                recordCount: historiales.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(historiales);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AfiliadosReportesError(
            `Error síncrono al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN: ${syncError.message || String(syncError)}`,
            AfiliadosReportesErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getHistorialMovPromedioSdo(periodo: string, pOrg0: string, pOrg1: string, pOrg2: string, pOrg3: string): Promise<HistorialMovPromedioSdo[]> {
    const startTime = Date.now();
    
    // Asegurar que el período tenga exactamente 4 caracteres (formato esperado por Firebird)
    const periodoFormateado = String(periodo || '').trim().substring(0, 4).padStart(4, '0');
    
    const logContext = {
      operation: 'getHistorialMovPromedioSdo',
      periodo,
      periodoFormateado,
      pOrg0,
      pOrg1,
      pOrg2,
      pOrg3
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.APORTACION, 
        p.TSARE, 
        p.TFRA, 
        p.TFRE, 
        p.TFHE, 
        p.TFVE, 
        p.TFAA, 
        p.TFAE,
        p.TFAT, 
        p.TFAI, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.TSUELDO,
        p.TOTRAS_PRESTACIONES, 
        p.TQUINQUENIOS, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3,
        p.PSUELDO, 
        p.POTRAS_PRESTACIONES, 
        p.PQUINQUENIOS
      FROM HISTORIAL_MOV_PROMEDIO_SDO(?, ?, ?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<HistorialMovPromedioSdo[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado HISTORIAL_MOV_PROMEDIO_SDO');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AfiliadosReportesError(
            'Conexión a Firebird no disponible o inválida',
            AfiliadosReportesErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodoFormateado, pOrg0, pOrg1, pOrg2, pOrg3],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;

              if (err) {
                logger.error({
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                }, 'Error ejecutando procedimiento');
                reject(new AfiliadosReportesError(
                  `Error al ejecutar procedimiento HISTORIAL_MOV_PROMEDIO_SDO: ${err.message || String(err)}`,
                  AfiliadosReportesErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Debug: Log del primer registro raw
              if (result.length > 0) {
                logger.info({ ...logContext, primerRegistro: result[0], keys: Object.keys(result[0]) }, 'Primer registro raw de Firebird');
              }

              const promedios: HistorialMovPromedioSdo[] = result.map((row: any) => ({
                aportacion: Number(row.APORTACION || 0),
                tsare: Number(row.TSARE || 0),
                tFra: Number(row.TFRA || 0),
                tFre: Number(row.TFRE || 0),
                tFhe: Number(row.TFHE || 0),
                tFve: Number(row.TFVE || 0),
                tFaa: Number(row.TFAA || 0),
                tFae: Number(row.TFAE || 0),
                tFat: Number(row.TFAT || 0),
                tFai: Number(row.TFAI || 0),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                tSueldo: Number(row.TSUELDO || 0),
                tOtrasPrestaciones: Number(row.TOTRAS_PRESTACIONES || 0),
                tQuinquenios: Number(row.TQUINQUENIOS || 0),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                pSueldo: Number(row.PSUELDO || 0),
                pOtrasPrestaciones: Number(row.POTRAS_PRESTACIONES || 0),
                pQuinquenios: Number(row.PQUINQUENIOS || 0)
              }));

              logger.info({
                ...logContext,
                recordCount: promedios.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(promedios);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AfiliadosReportesError(
            `Error síncrono al ejecutar procedimiento HISTORIAL_MOV_PROMEDIO_SDO: ${syncError.message || String(syncError)}`,
            AfiliadosReportesErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }
}

