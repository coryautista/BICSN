import { executeSerializedQuery } from '../../../../../db/firebird.js';
import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { MovimientoQuincenal } from '../../domain/entities/MovimientoQuincenal.js';
import { AplicacionAportaciones } from '../../domain/entities/AplicacionAportaciones.js';
import { AplicacionPCP } from '../../domain/entities/AplicacionPCP.js';
import { AplicacionPMP } from '../../domain/entities/AplicacionPMP.js';
import { AplicacionHIP } from '../../domain/entities/AplicacionHIP.js';
import { Concentrado } from '../../domain/entities/Concentrado.js';
import { AplicacionesQNAError, AplicacionesQNAErrorCode } from '../../domain/errors.js';
import pino from 'pino';
import { decodeFirebirdObject } from '../../../../../db/firebird.js';

const logger = pino({
  name: 'AplicacionesQNARepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AplicacionesQNARepository implements IAplicacionesQNARepository {
  async getMovimientosQuincenales(periodo: string, pOrg0: string, pOrg1: string): Promise<MovimientoQuincenal[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getMovimientosQuincenales',
      periodo,
      pOrg0,
      pOrg1
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.CONSECUTIVO, 
        p.CVE_MOVIMIENTO, 
        p.NOM_MOVIMIENTO, 
        p.NOMBRE,
        p.NOEMPLEADO, 
        p.RFC, 
        p.S_A, 
        p.OP_A, 
        p.Q_A, 
        p.S_N, 
        p.OP_N, 
        p.Q_N,
        p.RETROACTIVAS, 
        p.S_R, 
        p.OP_R, 
        p.Q_R, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3,
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.USUARIO, 
        p.FREALM
      FROM HISTORIAL_MOVIMIENTOS_QUIN_IND(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<MovimientoQuincenal[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado HISTORIAL_MOVIMIENTOS_QUIN_IND');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodo, pOrg0, pOrg1],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN_IND: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron movimientos');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              const movimientos: MovimientoQuincenal[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                consecutivo: row.CONSECUTIVO || 0,
                cveMovimiento: String(row.CVE_MOVIMIENTO || ''),
                nomMovimiento: String(row.NOM_MOVIMIENTO || ''),
                nombre: String(row.NOMBRE || ''),
                noEmpleado: String(row.NOEMPLEADO || ''),
                rfc: String(row.RFC || ''),
                sA: Number(row.S_A || 0),
                opA: Number(row.OP_A || 0),
                qA: Number(row.Q_A || 0),
                sN: Number(row.S_N || 0),
                opN: Number(row.OP_N || 0),
                qN: Number(row.Q_N || 0),
                retroactivas: Number(row.RETROACTIVAS || 0),
                sR: Number(row.S_R || 0),
                opR: Number(row.OP_R || 0),
                qR: Number(row.Q_R || 0),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                usuario: String(row.USUARIO || ''),
                fRealm: String(row.FREALM || '')
              }));

              logger.info({
                ...logContext,
                recordCount: movimientos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(movimientos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN_IND: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionAportaciones(pOrg0: string, pOrg1: string, periodo: string): Promise<AplicacionAportaciones[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionAportaciones',
      pOrg0,
      pOrg1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.SUELDOM, 
        p.OTRAS_PRESTACIONES, 
        p.QUINQUENIOS,
        p.SUELDOQ, 
        p.OPQ, 
        p.QQ, 
        p.SARE, 
        p.FRA, 
        p.FRE, 
        p.FHE, 
        p.FVE, 
        p.FAA, 
        p.FAE,
        p.FAT, 
        p.FAI, 
        p.SFRA, 
        p.SFRE, 
        p.SFHE, 
        p.SFVE, 
        p.SFAA, 
        p.SFAE, 
        p.SFAT,
        p.SFAI, 
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
        p.RFC
      FROM AP_P_FONDOS(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionAportaciones[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_P_FONDOS');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, periodo],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_P_FONDOS: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron aportaciones');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              const aportaciones: AplicacionAportaciones[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                nombre: String(row.NOMBRE || ''),
                sueldom: Number(row.SUELDOM || 0),
                otrasPrestaciones: Number(row.OTRAS_PRESTACIONES || 0),
                quinquenios: Number(row.QUINQUENIOS || 0),
                sueldoq: Number(row.SUELDOQ || 0),
                opq: Number(row.OPQ || 0),
                qq: Number(row.QQ || 0),
                sare: Number(row.SARE || 0),
                fra: Number(row.FRA || 0),
                fre: Number(row.FRE || 0),
                fhe: Number(row.FHE || 0),
                fve: Number(row.FVE || 0),
                faa: Number(row.FAA || 0),
                fae: Number(row.FAE || 0),
                fat: Number(row.FAT || 0),
                fai: Number(row.FAI || 0),
                sFra: Number(row.SFRA || 0),
                sFre: Number(row.SFRE || 0),
                sFhe: Number(row.SFHE || 0),
                sFve: Number(row.SFVE || 0),
                sFaa: Number(row.SFAA || 0),
                sFae: Number(row.SFAE || 0),
                sFat: Number(row.SFAT || 0),
                sFai: Number(row.SFAI || 0),
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
                rfc: String(row.RFC || '')
              }));

              logger.info({
                ...logContext,
                recordCount: aportaciones.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(aportaciones);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_P_FONDOS: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionPCP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPCP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionPCP',
      pOrg0,
      pOrg1,
      pPeriodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C,
        p.FECHA_C, 
        p.CAPITAL, 
        p.INTERES, 
        p.MONTO, 
        p.MORATORIOS, 
        p.TOTAL,
        p.RESULTADO, 
        p.TD, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1,
        p.NORG2, 
        p.NORG3
      FROM AP_S_PCP(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionPCP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_PCP');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, pPeriodo],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_PCP: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos PCP');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              const prestamos: AplicacionPCP[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                rfc: String(row.RFC || ''),
                nombre: String(row.NOMBRE || ''),
                prestamo: String(row.PRESTAMO || ''),
                letra: Number(row.LETRA || 0),
                plazo: Number(row.PLAZO || 0),
                periodoC: String(row.PERIODO_C || ''),
                fechaC: String(row.FECHA_C || ''),
                capital: Number(row.CAPITAL || 0),
                interes: Number(row.INTERES || 0),
                monto: Number(row.MONTO || 0),
                moratorios: Number(row.MORATORIOS || 0),
                total: Number(row.TOTAL || 0),
                resultado: String(row.RESULTADO || ''),
                td: String(row.TD || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || '')
              }));

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_PCP: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionPMP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPMP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionPMP',
      pOrg0,
      pOrg1,
      pPeriodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C,
        p.FECHA_C, 
        p.CAPITAL, 
        p.MORATORIOS, 
        p.INTERES, 
        p.SEGURO, 
        p.TOTAL,
        p.RESULTADO, 
        p.CLASE, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1,
        p.NORG2, 
        p.NORG3, 
        p.DESC_CLASE, 
        p.DESC_PRESTAMO, 
        p.CLAVE_P, 
        p.NOEMPLE,
        p.FOLIO, 
        p.ANIO, 
        p.PO, 
        p.FECHA_ORIGEN
      FROM AP_S_VIV(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionPMP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_VIV');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, pPeriodo],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_VIV: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos PMP');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              const prestamos: AplicacionPMP[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                rfc: String(row.RFC || ''),
                nombre: String(row.NOMBRE || ''),
                prestamo: String(row.PRESTAMO || ''),
                letra: Number(row.LETRA || 0),
                plazo: Number(row.PLAZO || 0),
                periodoC: String(row.PERIODO_C || ''),
                fechaC: String(row.FECHA_C || ''),
                capital: Number(row.CAPITAL || 0),
                moratorios: Number(row.MORATORIOS || 0),
                interes: Number(row.INTERES || 0),
                seguro: Number(row.SEGURO || 0),
                total: Number(row.TOTAL || 0),
                resultado: String(row.RESULTADO || ''),
                clase: String(row.CLASE || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                descClase: String(row.DESC_CLASE || ''),
                descPrestamo: String(row.DESC_PRESTAMO || ''),
                claveP: String(row.CLAVE_P || ''),
                noEmple: String(row.NOEMPLE || ''),
                folio: String(row.FOLIO || ''),
                anio: Number(row.ANIO || 0),
                po: String(row.PO || ''),
                fechaOrigen: String(row.FECHA_ORIGEN || '')
              }));

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_VIV: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionHIP(org0: string, org1: string, quincena: string): Promise<AplicacionHIP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionHIP',
      org0,
      org1,
      quincena
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.NOEMPLEADO, 
        p.CANTIDAD, 
        p.STATUS, 
        p.REFERENCIA_1,
        p.REFERENCIA_2, 
        p.CAPITAL_PAGAR, 
        p.INTERES_PAGAR, 
        p.INTERES_DIFERIDO_PAGAR,
        p.SEGURO_PAGAR, 
        p.MORATORIO_PAGAR, 
        p.PNO_SOLICITUD, 
        p.PANO,
        p.PCLAVE_CLASE_PRESTAMO, 
        p.PDESCRIPCION, 
        p.RFC, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.PCLAVE_PRESTAMO,
        p.PRESTAMO_DESC, 
        p.TIPO, 
        p.PERIODO_C, 
        p.DESCTO, 
        p.FECHA_C, 
        p.RESULTADO,
        p.PO, 
        p.FECHA_ORIGEN, 
        p.PLAZO
      FROM AP_S_HIP_QNA(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionHIP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_HIP_QNA');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [org0, org1, quincena],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_HIP_QNA: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos hipotecarios');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              const prestamos: AplicacionHIP[] = result.map((row: any) => ({
                interno: row.INTERNO || 0,
                nombre: String(row.NOMBRE || ''),
                noEmpleado: String(row.NOEMPLEADO || ''),
                cantidad: Number(row.CANTIDAD || 0),
                status: String(row.STATUS || ''),
                referencia1: String(row.REFERENCIA_1 || ''),
                referencia2: String(row.REFERENCIA_2 || ''),
                capitalPagar: Number(row.CAPITAL_PAGAR || 0),
                interesPagar: Number(row.INTERES_PAGAR || 0),
                interesDiferidoPagar: Number(row.INTERES_DIFERIDO_PAGAR || 0),
                seguroPagar: Number(row.SEGURO_PAGAR || 0),
                moratorioPagar: Number(row.MORATORIO_PAGAR || 0),
                pnoSolicitud: String(row.PNO_SOLICITUD || ''),
                pano: Number(row.PANO || 0),
                pclaveClasePrestamo: String(row.PCLAVE_CLASE_PRESTAMO || ''),
                pdescripcion: String(row.PDESCRIPCION || ''),
                rfc: String(row.RFC || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                pclavePrestamo: String(row.PCLAVE_PRESTAMO || ''),
                prestamoDesc: String(row.PRESTAMO_DESC || ''),
                tipo: String(row.TIPO || ''),
                periodoC: String(row.PERIODO_C || ''),
                descto: Number(row.DESCTO || 0),
                fechaC: String(row.FECHA_C || ''),
                resultado: String(row.RESULTADO || ''),
                po: String(row.PO || ''),
                fechaOrigen: String(row.FECHA_ORIGEN || ''),
                plazo: Number(row.PLAZO || 0)
              }));

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_HIP_QNA: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getConcentrado(org0: string, org1: string, org2: string, org3: string, periodo: string): Promise<Concentrado[]> {
    const startTime = Date.now();
    
    // Asegurar que el período tenga exactamente 4 caracteres (formato esperado por Firebird)
    const periodoFormateado = String(periodo || '').trim().substring(0, 4).padStart(4, '0');
    
    const logContext = {
      operation: 'getConcentrado',
      org0,
      org1,
      org2,
      org3,
      periodo,
      periodoFormateado
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.TIPO, 
        p.CONCEPTO, 
        p.PARCIAL, 
        p.TOTAL, 
        p.TIPO_FONDO
      FROM ADEUDO_ORGANICA_LAYOUT(?, ?, ?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<Concentrado[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado ADEUDO_ORGANICA_LAYOUT');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [org0, org1, org2, org3, periodoFormateado],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento ADEUDO_ORGANICA_LAYOUT: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              // Asegurar que el resultado sea un array
              const records = Array.isArray(result) ? result : [result];
              
              if (records.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros de concentrado');
                resolve([]);
                return;
              }

              // Decodificar los records de Firebird ANTES del mapeo
              const decodedRecords = records.map(record => decodeFirebirdObject(record));

              logger.info({ 
                ...logContext, 
                totalRegistros: decodedRecords.length, 
                tipoResultado: Array.isArray(result) ? 'array' : typeof result,
                primerRegistro: decodedRecords.length > 0 ? decodedRecords[0] : null,
                keys: decodedRecords.length > 0 ? Object.keys(decodedRecords[0]) : []
              }, 'Mapeando resultados');

              const concentrados: Concentrado[] = decodedRecords.map((row: any, index: number) => {
                try {
                  // Log detallado del primer registro para debugging
                  if (index === 0) {
                    logger.info({ 
                      ...logContext, 
                      rowRaw: row,
                      rowKeys: Object.keys(row),
                      rowTIPO: row.TIPO,
                      rowCONCEPTO: row.CONCEPTO,
                      rowPARCIAL: row.PARCIAL,
                      rowTOTAL: row.TOTAL,
                      rowTIPO_FONDO: row.TIPO_FONDO
                    }, 'Primer registro raw de Firebird');
                  }
                  
                  // Mapear campos directamente - Firebird retorna en mayúsculas con lowercase_keys: false
                  const mapped: Concentrado = {
                    tipo: String(row.TIPO || ''),
                    concepto: String(row.CONCEPTO || ''),
                    parcial: Number(row.PARCIAL || 0),
                    total: Number(row.TOTAL || 0),
                    tipoFondo: String(row.TIPO_FONDO || '')
                  };
                  
                  // Log del primer registro mapeado
                  if (index === 0) {
                    logger.info({ ...logContext, mapped, mappedKeys: Object.keys(mapped) }, 'Primer registro mapeado');
                  }

                  // CREAR COPIA PROFUNDA para asegurar que las referencias se mantengan
                  // Esto resuelve el problema de serialización de Fastify
                  const safeMapped = JSON.parse(JSON.stringify(mapped));
                  
                  return safeMapped;
                } catch (error: any) {
                  logger.error({
                    ...logContext,
                    index,
                    error: error.message,
                    row: row,
                    stack: error.stack
                  }, 'Error mapeando registro');
                  // Retornar objeto vacío si hay error en el mapeo
                  return {
                    tipo: '',
                    concepto: '',
                    parcial: 0,
                    total: 0,
                    tipoFondo: ''
                  };
                }
              });

              logger.info({
                ...logContext,
                recordCount: concentrados.length,
                duracionMs: duration,
                primerConcentrado: concentrados.length > 0 ? concentrados[0] : null,
                todosConcentrados: JSON.stringify(concentrados),
                todosConcentradosKeys: concentrados.length > 0 ? concentrados.map(c => Object.keys(c)) : []
              }, 'Consulta completada exitosamente');

              resolve(concentrados);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento ADEUDO_ORGANICA_LAYOUT: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }
}

