import { executeSerializedQuery } from '../../../../../db/firebird.js';
import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { EstadoCuentaCAIR } from '../../domain/entities/EstadoCuentaCAIR.js';
import { CAIREntregado } from '../../domain/entities/CAIREntregado.js';
import { CAIRError, CAIRErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'CAIRRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class CAIRRepository implements ICAIRRepository {
  async getEstadoCuentaCAIR(quincena: string): Promise<EstadoCuentaCAIR[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getEstadoCuentaCAIR',
      quincena
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.ORG0, 
        p.ORG1, 
        p.PERIODO, 
        p.ENTIDAD, 
        p.AP, 
        p.SAR, 
        p.CANTIDAD, 
        p.APR,
        p.RECUPERADO, 
        p.API, 
        p.APC, 
        p.INTERES, 
        p.APV, 
        p.VOLUNTARIO, 
        p.AFILIADOS,
        p.APCS, 
        p.CANCELADOS, 
        p.APCV, 
        p.CANCELADOV, 
        p.APES, 
        p.ENTREGADOS, 
        p.APEV,
        p.ENTREGADOV, 
        p.RENDIMIENTOS
      FROM SAR_TOTAL_A_ORG(?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<EstadoCuentaCAIR[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado SAR_TOTAL_A_ORG');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new CAIRError(
            'Conexión a Firebird no disponible o inválida',
            CAIRErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [quincena],
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
                reject(new CAIRError(
                  `Error al ejecutar procedimiento SAR_TOTAL_A_ORG: ${err.message || String(err)}`,
                  CAIRErrorCode.FIREBIRD_QUERY_ERROR
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

              const estados: EstadoCuentaCAIR[] = result.map((row: any) => ({
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                periodo: String(row.PERIODO || ''),
                entidad: String(row.ENTIDAD || ''),
                ap: Number(row.AP || 0),
                sar: Number(row.SAR || 0),
                cantidad: Number(row.CANTIDAD || 0),
                apr: Number(row.APR || 0),
                recuperado: Number(row.RECUPERADO || 0),
                api: Number(row.API || 0),
                apc: Number(row.APC || 0),
                interes: Number(row.INTERES || 0),
                apv: Number(row.APV || 0),
                voluntario: Number(row.VOLUNTARIO || 0),
                afiliados: Number(row.AFILIADOS || 0),
                apcs: Number(row.APCS || 0),
                cancelados: Number(row.CANCELADOS || 0),
                apcv: Number(row.APCV || 0),
                canceladoV: Number(row.CANCELADOV || 0),
                apes: Number(row.APES || 0),
                entregados: Number(row.ENTREGADOS || 0),
                apev: Number(row.APEV || 0),
                entregadoV: Number(row.ENTREGADOV || 0),
                rendimientos: Number(row.RENDIMIENTOS || 0)
              }));

              logger.info({
                ...logContext,
                recordCount: estados.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(estados);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new CAIRError(
            `Error síncrono al ejecutar procedimiento SAR_TOTAL_A_ORG: ${syncError.message || String(syncError)}`,
            CAIRErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getCAIREntregado(fi: string, ff: string, tipo: string): Promise<CAIREntregado[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getCAIREntregado',
      fi,
      ff,
      tipo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.RFC, 
        p.NO_APORTACIONES, 
        p.APORTACION,
        p.VOLUNTARIO, 
        p.RECUPERADO, 
        p.APORTACION_INTERES, 
        p.VOLUNTARIO_INTERES,
        p.ENTREGADO, 
        p.PERIODO, 
        p.FECHA_ENTREGA, 
        p.MOTIVO, 
        p.NMOTIVO, 
        p.TITULO,
        p.LEYENDA, 
        p.STATUS, 
        p.CHEQUE, 
        p.CVE_BANCO, 
        p.CUENTA, 
        p.FECHA_EMISION,
        p.NUM_BENEF, 
        p.NOMBRE_BENEF, 
        p.ENTREGADO_BENEF, 
        p.CHEQUE_BENEF,
        p.CVE_BANCO_BENEF, 
        p.CUENTA_BENEF, 
        p.FECHA_EMISION_BENEF, 
        p.ORG00, 
        p.ORG11,
        p.ORG22, 
        p.ORG33, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.ACTIVO, 
        p.FECHA,
        p.FECHAPASO, 
        p.FECHAPA, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3
      FROM SAR_DEVOLUCION_REPORTE(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<CAIREntregado[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado SAR_DEVOLUCION_REPORTE');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new CAIRError(
            'Conexión a Firebird no disponible o inválida',
            CAIRErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [fi, ff, tipo],
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
                reject(new CAIRError(
                  `Error al ejecutar procedimiento SAR_DEVOLUCION_REPORTE: ${err.message || String(err)}`,
                  CAIRErrorCode.FIREBIRD_QUERY_ERROR
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

              const entregados: CAIREntregado[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                nombre: String(row.NOMBRE || ''),
                rfc: String(row.RFC || ''),
                noAportaciones: Number(row.NO_APORTACIONES || 0),
                aportacion: Number(row.APORTACION || 0),
                voluntario: Number(row.VOLUNTARIO || 0),
                recuperado: Number(row.RECUPERADO || 0),
                aportacionInteres: Number(row.APORTACION_INTERES || 0),
                voluntarioInteres: Number(row.VOLUNTARIO_INTERES || 0),
                entregado: Number(row.ENTREGADO || 0),
                periodo: String(row.PERIODO || ''),
                fechaEntrega: String(row.FECHA_ENTREGA || ''),
                motivo: String(row.MOTIVO || ''),
                nmotivo: String(row.NMOTIVO || ''),
                titulo: String(row.TITULO || ''),
                leyenda: String(row.LEYENDA || ''),
                status: String(row.STATUS || ''),
                cheque: String(row.CHEQUE || ''),
                cveBanco: String(row.CVE_BANCO || ''),
                cuenta: String(row.CUENTA || ''),
                fechaEmision: String(row.FECHA_EMISION || ''),
                numBenef: String(row.NUM_BENEF || ''),
                nombreBenef: String(row.NOMBRE_BENEF || ''),
                entregadoBenef: Number(row.ENTREGADO_BENEF || 0),
                chequeBenef: String(row.CHEQUE_BENEF || ''),
                cveBancoBenef: String(row.CVE_BANCO_BENEF || ''),
                cuentaBenef: String(row.CUENTA_BENEF || ''),
                fechaEmisionBenef: String(row.FECHA_EMISION_BENEF || ''),
                org00: String(row.ORG00 || ''),
                org11: String(row.ORG11 || ''),
                org22: String(row.ORG22 || ''),
                org33: String(row.ORG33 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                activo: String(row.ACTIVO || ''),
                fecha: String(row.FECHA || ''),
                fechaPaso: String(row.FECHAPASO || ''),
                fechaPa: String(row.FECHAPA || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || '')
              }));

              logger.info({
                ...logContext,
                recordCount: entregados.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(entregados);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new CAIRError(
            `Error síncrono al ejecutar procedimiento SAR_DEVOLUCION_REPORTE: ${syncError.message || String(syncError)}`,
            CAIRErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }
}

