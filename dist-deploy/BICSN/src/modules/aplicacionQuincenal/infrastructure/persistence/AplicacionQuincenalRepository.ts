import { FastifyRequest } from 'fastify';
import { executeSerializedQuery, decodeFirebirdObject, executeSelectableProcedure, executeSafeQuery, FIREBIRD_TIMEOUTS } from '../../../../db/firebird.js';
import { withDbContext, sql } from '../../../../db/context.js';
import { getPool } from '../../../../db/mssql.js';
import { IAplicacionQuincenalRepository, GuardarHistoricoAportacionesResult, GuardarHistoricoRetencionesResult, ValidarAplicacionQnaAportacionesResult } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import { AportacionQuincenalResumen } from '../../domain/entities/AportacionQuincenalResumen.js';
import { ResumenOrgQnaAll } from '../../domain/entities/ResumenOrgQnaAll.js';
import { AplicacionQuincenalError, AplicacionQuincenalErrorCode } from '../../domain/errors.js';
import {
  GuardarHistoricoAportaciones,
  AhorroHeader,
  AhorroDetalle,
  ViviendaHeader,
  ViviendaDetalle,
  PrestacionesHeader,
  PrestacionesDetalle,
  CairHeader,
  CairDetalle,
  TransitorioHeader,
  TransitorioDetalle,
  GuarderiasHeader,
  GuarderiasDetalle,
  AguinaldoHeader,
  AguinaldoDetalle,
  GuardarHistoricoRetenciones,
  PrestamosCortoPlazoHeader,
  PrestamosCortoPlazoDetalle,
  PrestamosMedianoPlazoHeader,
  PrestamosMedianoPlazoDetalle,
  PrestamosHipotecariosHeader,
  PrestamosHipotecariosDetalle
} from '../../aplicacionQuincenal.schemas.js';
import pino from 'pino';

const logger = pino({
  name: 'AplicacionQuincenalRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AplicacionQuincenalRepository implements IAplicacionQuincenalRepository {
  async validarAplicacionQnaAportaciones(organica0: string, organica1: string, periodo: string): Promise<ValidarAplicacionQnaAportacionesResult> {
    const org0 = String(organica0).trim().toUpperCase().padStart(2, '0');
    const org1 = String(organica1).trim().toUpperCase().padStart(2, '0');
    const periodoStr = String(periodo).trim();
    const quincena = Number(periodoStr.slice(0, 2));
    const anio = 2000 + Number(periodoStr.slice(2, 4));

    if (!/^\d{4}$/.test(periodoStr) || quincena < 1 || quincena > 24) {
      throw new Error('PERIODO_INVALIDO');
    }

    const p = await getPool();
    const bitacoraResult = await p.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT TOP 1
          AfectacionId AS afectacionId,
          Entidad AS entidad,
          Anio AS anio,
          Quincena AS quincena,
          Accion AS accion,
          Org0 AS organica0,
          Org1 AS organica1,
          Org2 AS organica2,
          Org3 AS organica3,
          Resultado AS resultado,
          Mensaje AS mensaje,
          Usuario AS usuario,
          UserId AS userId,
          AppName AS appName,
          Ip AS ip,
          UserAgent AS userAgent,
          CreatedAt AS createdAt,
          ModifiedAt AS modifiedAt
        FROM afec.BitacoraAfectacionOrg
        WHERE Entidad = 'AFILIADOS'
          AND Org0 = @org0
          AND Org1 = @org1
          AND Quincena = @quincena
          AND Anio = @anio
          AND Accion = 'TERMINADO'
        ORDER BY ModifiedAt DESC, CreatedAt DESC
      `);

    const bitacora = bitacoraResult.recordset[0] || null;
    const baseResult = {
      organica0: org0,
      organica1: org1,
      periodo: periodoStr,
      quincena,
      anio
    };

    if (!bitacora) {
      return {
        aplicada: false,
        ...baseResult,
        bitacora: null,
        parametrosAplicacion: null,
        aportaciones: null,
        totales: null
      };
    }

    const createRequest = () => p.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio);

    const [
      ahorroResult,
      viviendaResult,
      prestacionesResult,
      cairResult,
      transitorioResult,
      guarderiasResult,
      aguinaldoResult,
      detalleAguinaldoResult,
      resumenResult
    ] = await Promise.all([
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesAhorroHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesViviendaHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesPrestacionesHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesCairHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.PensionNominaTransitorioHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.GuarderiasHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.AguinaldoHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.DetalleHistoricoAguinaldo
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.ResumenHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `)
    ]);

    const aportaciones = {
      ahorro: ahorroResult.recordset,
      vivienda: viviendaResult.recordset,
      prestaciones: prestacionesResult.recordset,
      cair: cairResult.recordset,
      transitorio: transitorioResult.recordset,
      guarderias: guarderiasResult.recordset,
      aguinaldo: aguinaldoResult.recordset,
      detalleAguinaldo: detalleAguinaldoResult.recordset,
      resumen: resumenResult.recordset
    };

    return {
      aplicada: true,
      ...baseResult,
      bitacora,
      parametrosAplicacion: {
        aplicarC: {
          sp: 'AP_P_APLICAR',
          org0,
          org1,
          quincenaC: periodoStr,
          quincenaA: periodoStr,
          tipo: 'C'
        },
        aplicarF: {
          sp: 'AP_P_APLICAR',
          org0,
          org1,
          quincenaC: periodoStr,
          quincenaA: periodoStr,
          tipo: 'F'
        }
      },
      aportaciones,
      totales: {
        ahorro: aportaciones.ahorro.length,
        vivienda: aportaciones.vivienda.length,
        prestaciones: aportaciones.prestaciones.length,
        cair: aportaciones.cair.length,
        transitorio: aportaciones.transitorio.length,
        guarderias: aportaciones.guarderias.length,
        aguinaldo: aportaciones.aguinaldo.length,
        detalleAguinaldo: aportaciones.detalleAguinaldo.length,
        resumen: aportaciones.resumen.length
      }
    };
  }

  async getEntidadesRptPdfInserta(organica0: string, organica1: string, periodo: string): Promise<Record<string, unknown>[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getEntidadesRptPdfInserta',
      organica0,
      organica1,
      periodo
    };

    const clave0 = String(organica0).trim().toUpperCase().padStart(2, '0');
    const clave1 = String(organica1).trim().toUpperCase().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT
        r.CLAVE_ORGANICA_0,
        r.CLAVE_ORGANICA_1,
        r.CLAVE_ORGANICA_2,
        r.CLAVE_ORGANICA_3,
        r.PERIODO,
        r.FECHA_GENERACION,
        r.STATUS
      FROM AQ_ENTIDADES_RPT_PDF r
      WHERE r.CLAVE_ORGANICA_0 = ?
        AND r.CLAVE_ORGANICA_1 = ?
        AND r.PERIODO = ?
        AND r.STATUS = 'A'
    `;

    try {
      logger.info(logContext, 'Consultando AQ_ENTIDADES_RPT_PDF');

      const result = await executeSerializedQuery((db) => {
        return new Promise<Record<string, unknown>[]>((resolve, reject) => {
          if (!db || typeof db.query !== 'function') {
            reject(new AplicacionQuincenalError(
              'Conexión a Firebird no disponible o inválida',
              AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
            ));
            return;
          }

          db.query(sql, [clave0, clave1, periodoStr], (err: any, rows: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(Array.isArray(rows) ? rows : []);
          });
        });
      });
      const duration = Date.now() - startTime;

      const registros = (Array.isArray(result) ? result : [])
        .map((row: any) => decodeFirebirdObject(row));

      logger.info({
        ...logContext,
        recordCount: registros.length,
        duracionMs: duration
      }, 'Consulta AQ_ENTIDADES_RPT_PDF completada exitosamente');

      return registros;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        errorCode: error.code,
        errorName: error.name,
        stack: error.stack,
        duracionMs: duration
      }, 'Error consultando AQ_ENTIDADES_RPT_PDF');

      throw new AplicacionQuincenalError(
        `Error al consultar AQ_ENTIDADES_RPT_PDF: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
      );
    }
  }

  async getAportacionQuincenalResumen(org0: string, org1: string, periodo: string): Promise<AportacionQuincenalResumen[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAportacionQuincenalResumen',
      org0,
      org1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    // Asegurar que los parámetros sean strings y estén limpios
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT 
        r.RDB$DB_KEY, r.ORG0, r.ORG1, r.ORG2, r.ORG3, r.PERIODO, r.TIPO, r.FA_SA,
        r.FO_AFIL, r.FO_SDO, r.FO_SDOB, r.FO_OP, r.FO_OPB, r.FO_Q, r.FO_QB,
        r.FO_SAR, r.FO_FRA, r.FO_FRE, r.FO_FHE, r.FO_FVE, r.FO_FAA, r.FO_FAE,
        r.FM_AFIL, r.FM_SDO, r.FM_SAR, r.FM_FRA, r.FM_FRE, r.FM_FHE, r.FM_FVE,
        r.FM_FAA, r.FM_FAE, r.FR_AFIL, r.FR_SDO, r.FR_OP, r.FR_Q, r.FR_SAR,
        r.FR_FRA, r.FR_FRE, r.FR_FHE, r.FR_FVE, r.FR_FAA, r.FR_FAE, r.FA_PE,
        r.FA_FV, r.FA_SAR, r.FV_SAR, r.EBIA, r.EBIE, r.EBIC, r.PCP_SA,
        r.PCP_N_NUEVOS, r.PCP_NUEVOS, r.PCP_N_COBRO, r.PCP_COBRO, r.PCP_COBRO_K,
        r.PCP_COBRO_I, r.PCP_COBRO_M, r.PCP_N_ALTAS, r.PCP_ALTAS, r.PCP_N_BAJAS,
        r.PCP_BAJAS, r.PCP_N_CANCELADO, r.PCP_CANCELADO, r.PCP_N_DIRECTOS,
        r.PCP_DIRECTOS, r.PPV_N_HIP, r.PPV_HIP, r.PPV_HIP_K, r.PPV_HIP_I,
        r.PPV_HIP_S, r.PPV_HIP_M, r.PPV_N_PC, r.PPV_PC, r.PPV_PC_K, r.PPV_PC_I,
        r.PPV_PC_S, r.PPV_PC_M, r.PMP_N_EV, r.PMP_EV, r.PMP_EV_M, r.PMP_EV_S,
        r.PMP_EV_K, r.PENS_SDO, r.PENS_SDO_BONIFICADO, r.PENS_DEFUNCION,
        r.PENS_TRANS, r.PENS_FORAN, r.AGUI_FRE, r.PMP_EV_I, r.PMP_N_GM, r.PMP_GM,
        r.PMP_GM_K, r.PMP_GM_M, r.PMP_GM_S, r.PMP_GM_I, r.PMP_N_AV, r.PMP_AV,
        r.PMP_AV_K, r.PMP_AV_M, r.PMP_AV_S, r.PMP_AV_I, r.PMP_N_ET, r.PMP_ET,
        r.PMP_ET_K, r.PMP_ET_M, r.PMP_ET_S, r.PMP_ET_I, r.PMP_N_CO, r.PMP_CO,
        r.PMP_CO_K, r.PMP_CO_M, r.PMP_CO_S, r.PMP_CO_I, r.FMOV_ALT, r.USER_ALT
      FROM APORTACION_QUINCENAL_RESUMEN r
      WHERE r.ORG0 = ? 
        AND r.ORG1 = ? 
        AND r.PERIODO = ?
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AportacionQuincenalResumen[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando consulta a APORTACION_QUINCENAL_RESUMEN');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionQuincenalError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [clave0, clave1, periodoStr],
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
                }, 'Error ejecutando consulta');
                reject(new AplicacionQuincenalError(
                  `Error al ejecutar consulta APORTACION_QUINCENAL_RESUMEN: ${err.message || String(err)}`,
                  AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
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

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const registros: AportacionQuincenalResumen[] = decodedResult.map((row: any) => ({
                rdbDbKey: row.RDB$DB_KEY ? String(row.RDB$DB_KEY) : null,
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: row.ORG2 ? String(row.ORG2) : null,
                org3: row.ORG3 ? String(row.ORG3) : null,
                periodo: String(row.PERIODO || ''),
                tipo: row.TIPO ? String(row.TIPO) : null,
                faSa: row.FA_SA != null ? Number(row.FA_SA) : null,
                foAfil: row.FO_AFIL != null ? Number(row.FO_AFIL) : null,
                foSdo: row.FO_SDO != null ? Number(row.FO_SDO) : null,
                foSdob: row.FO_SDOB != null ? Number(row.FO_SDOB) : null,
                foOp: row.FO_OP != null ? Number(row.FO_OP) : null,
                foOpb: row.FO_OPB != null ? Number(row.FO_OPB) : null,
                foQ: row.FO_Q != null ? Number(row.FO_Q) : null,
                foQb: row.FO_QB != null ? Number(row.FO_QB) : null,
                foSar: row.FO_SAR != null ? Number(row.FO_SAR) : null,
                foFra: row.FO_FRA != null ? Number(row.FO_FRA) : null,
                foFre: row.FO_FRE != null ? Number(row.FO_FRE) : null,
                foFhe: row.FO_FHE != null ? Number(row.FO_FHE) : null,
                foFve: row.FO_FVE != null ? Number(row.FO_FVE) : null,
                foFaa: row.FO_FAA != null ? Number(row.FO_FAA) : null,
                foFae: row.FO_FAE != null ? Number(row.FO_FAE) : null,
                fmAfil: row.FM_AFIL != null ? Number(row.FM_AFIL) : null,
                fmSdo: row.FM_SDO != null ? Number(row.FM_SDO) : null,
                fmSar: row.FM_SAR != null ? Number(row.FM_SAR) : null,
                fmFra: row.FM_FRA != null ? Number(row.FM_FRA) : null,
                fmFre: row.FM_FRE != null ? Number(row.FM_FRE) : null,
                fmFhe: row.FM_FHE != null ? Number(row.FM_FHE) : null,
                fmFve: row.FM_FVE != null ? Number(row.FM_FVE) : null,
                fmFaa: row.FM_FAA != null ? Number(row.FM_FAA) : null,
                fmFae: row.FM_FAE != null ? Number(row.FM_FAE) : null,
                frAfil: row.FR_AFIL != null ? Number(row.FR_AFIL) : null,
                frSdo: row.FR_SDO != null ? Number(row.FR_SDO) : null,
                frOp: row.FR_OP != null ? Number(row.FR_OP) : null,
                frQ: row.FR_Q != null ? Number(row.FR_Q) : null,
                frSar: row.FR_SAR != null ? Number(row.FR_SAR) : null,
                frFra: row.FR_FRA != null ? Number(row.FR_FRA) : null,
                frFre: row.FR_FRE != null ? Number(row.FR_FRE) : null,
                frFhe: row.FR_FHE != null ? Number(row.FR_FHE) : null,
                frFve: row.FR_FVE != null ? Number(row.FR_FVE) : null,
                frFaa: row.FR_FAA != null ? Number(row.FR_FAA) : null,
                frFae: row.FR_FAE != null ? Number(row.FR_FAE) : null,
                faPe: row.FA_PE != null ? Number(row.FA_PE) : null,
                faFv: row.FA_FV != null ? Number(row.FA_FV) : null,
                faSar: row.FA_SAR != null ? Number(row.FA_SAR) : null,
                fvSar: row.FV_SAR != null ? Number(row.FV_SAR) : null,
                ebia: row.EBIA != null ? Number(row.EBIA) : null,
                ebie: row.EBIE != null ? Number(row.EBIE) : null,
                ebic: row.EBIC != null ? Number(row.EBIC) : null,
                pcpSa: row.PCP_SA != null ? Number(row.PCP_SA) : null,
                pcpNNuevos: row.PCP_N_NUEVOS != null ? Number(row.PCP_N_NUEVOS) : null,
                pcpNuevos: row.PCP_NUEVOS != null ? Number(row.PCP_NUEVOS) : null,
                pcpNCobro: row.PCP_N_COBRO != null ? Number(row.PCP_N_COBRO) : null,
                pcpCobro: row.PCP_COBRO != null ? Number(row.PCP_COBRO) : null,
                pcpCobroK: row.PCP_COBRO_K != null ? Number(row.PCP_COBRO_K) : null,
                pcpCobroI: row.PCP_COBRO_I != null ? Number(row.PCP_COBRO_I) : null,
                pcpCobroM: row.PCP_COBRO_M != null ? Number(row.PCP_COBRO_M) : null,
                pcpNAltas: row.PCP_N_ALTAS != null ? Number(row.PCP_N_ALTAS) : null,
                pcpAltas: row.PCP_ALTAS != null ? Number(row.PCP_ALTAS) : null,
                pcpNBajas: row.PCP_N_BAJAS != null ? Number(row.PCP_N_BAJAS) : null,
                pcpBajas: row.PCP_BAJAS != null ? Number(row.PCP_BAJAS) : null,
                pcpNCancelado: row.PCP_N_CANCELADO != null ? Number(row.PCP_N_CANCELADO) : null,
                pcpCancelado: row.PCP_CANCELADO != null ? Number(row.PCP_CANCELADO) : null,
                pcpNDirectos: row.PCP_N_DIRECTOS != null ? Number(row.PCP_N_DIRECTOS) : null,
                pcpDirectos: row.PCP_DIRECTOS != null ? Number(row.PCP_DIRECTOS) : null,
                ppvNHip: row.PPV_N_HIP != null ? Number(row.PPV_N_HIP) : null,
                ppvHip: row.PPV_HIP != null ? Number(row.PPV_HIP) : null,
                ppvHipK: row.PPV_HIP_K != null ? Number(row.PPV_HIP_K) : null,
                ppvHipI: row.PPV_HIP_I != null ? Number(row.PPV_HIP_I) : null,
                ppvHipS: row.PPV_HIP_S != null ? Number(row.PPV_HIP_S) : null,
                ppvHipM: row.PPV_HIP_M != null ? Number(row.PPV_HIP_M) : null,
                ppvNPC: row.PPV_N_PC != null ? Number(row.PPV_N_PC) : null,
                ppvPC: row.PPV_PC != null ? Number(row.PPV_PC) : null,
                ppvPCK: row.PPV_PC_K != null ? Number(row.PPV_PC_K) : null,
                ppvPCI: row.PPV_PC_I != null ? Number(row.PPV_PC_I) : null,
                ppvPCS: row.PPV_PC_S != null ? Number(row.PPV_PC_S) : null,
                ppvPCM: row.PPV_PC_M != null ? Number(row.PPV_PC_M) : null,
                pmpNEv: row.PMP_N_EV != null ? Number(row.PMP_N_EV) : null,
                pmpEv: row.PMP_EV != null ? Number(row.PMP_EV) : null,
                pmpEvM: row.PMP_EV_M != null ? Number(row.PMP_EV_M) : null,
                pmpEvS: row.PMP_EV_S != null ? Number(row.PMP_EV_S) : null,
                pmpEvK: row.PMP_EV_K != null ? Number(row.PMP_EV_K) : null,
                pensSdo: row.PENS_SDO != null ? Number(row.PENS_SDO) : null,
                pensSdoBonificado: row.PENS_SDO_BONIFICADO != null ? Number(row.PENS_SDO_BONIFICADO) : null,
                pensDefuncion: row.PENS_DEFUNCION != null ? Number(row.PENS_DEFUNCION) : null,
                pensTrans: row.PENS_TRANS != null ? Number(row.PENS_TRANS) : null,
                pensForan: row.PENS_FORAN != null ? Number(row.PENS_FORAN) : null,
                aguiFre: row.AGUI_FRE != null ? Number(row.AGUI_FRE) : null,
                pmpEvI: row.PMP_EV_I != null ? Number(row.PMP_EV_I) : null,
                pmpNGm: row.PMP_N_GM != null ? Number(row.PMP_N_GM) : null,
                pmpGm: row.PMP_GM != null ? Number(row.PMP_GM) : null,
                pmpGmK: row.PMP_GM_K != null ? Number(row.PMP_GM_K) : null,
                pmpGmM: row.PMP_GM_M != null ? Number(row.PMP_GM_M) : null,
                pmpGmS: row.PMP_GM_S != null ? Number(row.PMP_GM_S) : null,
                pmpGmI: row.PMP_GM_I != null ? Number(row.PMP_GM_I) : null,
                pmpNAv: row.PMP_N_AV != null ? Number(row.PMP_N_AV) : null,
                pmpAv: row.PMP_AV != null ? Number(row.PMP_AV) : null,
                pmpAvK: row.PMP_AV_K != null ? Number(row.PMP_AV_K) : null,
                pmpAvM: row.PMP_AV_M != null ? Number(row.PMP_AV_M) : null,
                pmpAvS: row.PMP_AV_S != null ? Number(row.PMP_AV_S) : null,
                pmpAvI: row.PMP_AV_I != null ? Number(row.PMP_AV_I) : null,
                pmpNEt: row.PMP_N_ET != null ? Number(row.PMP_N_ET) : null,
                pmpEt: row.PMP_ET != null ? Number(row.PMP_ET) : null,
                pmpEtK: row.PMP_ET_K != null ? Number(row.PMP_ET_K) : null,
                pmpEtM: row.PMP_ET_M != null ? Number(row.PMP_ET_M) : null,
                pmpEtS: row.PMP_ET_S != null ? Number(row.PMP_ET_S) : null,
                pmpEtI: row.PMP_ET_I != null ? Number(row.PMP_ET_I) : null,
                pmpNCo: row.PMP_N_CO != null ? Number(row.PMP_N_CO) : null,
                pmpCo: row.PMP_CO != null ? Number(row.PMP_CO) : null,
                pmpCoK: row.PMP_CO_K != null ? Number(row.PMP_CO_K) : null,
                pmpCoM: row.PMP_CO_M != null ? Number(row.PMP_CO_M) : null,
                pmpCoS: row.PMP_CO_S != null ? Number(row.PMP_CO_S) : null,
                pmpCoI: row.PMP_CO_I != null ? Number(row.PMP_CO_I) : null,
                fmovAlt: row.FMOV_ALT ? new Date(row.FMOV_ALT) : null,
                userAlt: row.USER_ALT ? String(row.USER_ALT) : null
              }));

              logger.info({
                ...logContext,
                recordCount: registros.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(registros);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando consulta');
          reject(new AplicacionQuincenalError(
            `Error síncrono al ejecutar consulta APORTACION_QUINCENAL_RESUMEN: ${syncError.message || String(syncError)}`,
            AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getResumenOrgQnaAll(org0: string, org1: string, periodo: string): Promise<ResumenOrgQnaAll[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getResumenOrgQnaAll',
      org0,
      org1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada a AP_RESUMEN_ORG_QNA_ALL');

    // Asegurar que los parámetros sean strings y estén limpios
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT 
        p.PORG0, p.PORG1, p.QNA, p.NORG, p.AFILIADOS, p.SDO, p.SDOBC, p.OP,
        p.OPBC, p.QNQ, p.QNQBC, p.PCP, p.PCP_M, p.PH, p.PH_M, p.EV, p.EV_M, p.PC,
        p.PC_M, p.FAA, p.FAE, p.FAT, p.FO_FAA, p.FO_FAE, p.FO_FAT, p.FM_FAA,
        p.FM_FAE, p.FM_FAT, p.FR_FAA, p.FR_FAE, p.FR_FAT, p.FRA, p.FRE, p.FRT,
        p.FO_FRA, p.FO_FRE, p.FO_FRT, p.FM_FRA, p.FM_FRE, p.FM_FRT, p.FR_FRA,
        p.FR_FRE, p.FR_FRT, p.FV, p.FO_FV, p.FM_FV, p.FR_FV, p.FH, p.FO_FH, p.FM_FH,
        p.FR_FH, p.SAR, p.FO_SAR, p.FM_SAR, p.FR_SAR, p.SARV, p.EBIA, p.EBIE,
        p.EBIT, p.AGUI, p.P_TRANS, p.P_FORAN, p.PMP_GM_M, p.PMP_GM, p.PMP_AV_M,
        p.PMP_AV, p.PMP_ET_M, p.PMP_ET, p.PMP_HO_M, p.PMP_HO, p.PMP_TU_M, p.PMP_TU,
        p.PMP_ED_M, p.PMP_ED, p.PMP_OT_M, p.PMP_OT, p.CONCEPTO, p.MONTO
      FROM AP_RESUMEN_ORG_QNA_ALL(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<ResumenOrgQnaAll[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando stored procedure AP_RESUMEN_ORG_QNA_ALL');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionQuincenalError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [clave0, clave1, periodoStr],
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
                }, 'Error ejecutando stored procedure');
                reject(new AplicacionQuincenalError(
                  `Error al ejecutar AP_RESUMEN_ORG_QNA_ALL: ${err.message || String(err)}`,
                  AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
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

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const registros: ResumenOrgQnaAll[] = decodedResult.map((row: any) => ({
                porg0: String(row.PORG0 || ''),
                porg1: String(row.PORG1 || ''),
                qna: String(row.QNA || ''),
                norg: row.NORG ? String(row.NORG) : null,
                afiliados: row.AFILIADOS != null ? Number(row.AFILIADOS) : null,
                sdo: row.SDO != null ? Number(row.SDO) : null,
                sdoBc: row.SDOBC != null ? Number(row.SDOBC) : null,
                op: row.OP != null ? Number(row.OP) : null,
                opBc: row.OPBC != null ? Number(row.OPBC) : null,
                qnq: row.QNQ != null ? Number(row.QNQ) : null,
                qnqBc: row.QNQBC != null ? Number(row.QNQBC) : null,
                pcp: row.PCP != null ? Number(row.PCP) : null,
                pcpM: row.PCP_M != null ? Number(row.PCP_M) : null,
                ph: row.PH != null ? Number(row.PH) : null,
                phM: row.PH_M != null ? Number(row.PH_M) : null,
                ev: row.EV != null ? Number(row.EV) : null,
                evM: row.EV_M != null ? Number(row.EV_M) : null,
                pc: row.PC != null ? Number(row.PC) : null,
                pcM: row.PC_M != null ? Number(row.PC_M) : null,
                faa: row.FAA != null ? Number(row.FAA) : null,
                fae: row.FAE != null ? Number(row.FAE) : null,
                fat: row.FAT != null ? Number(row.FAT) : null,
                foFaa: row.FO_FAA != null ? Number(row.FO_FAA) : null,
                foFae: row.FO_FAE != null ? Number(row.FO_FAE) : null,
                foFat: row.FO_FAT != null ? Number(row.FO_FAT) : null,
                fmFaa: row.FM_FAA != null ? Number(row.FM_FAA) : null,
                fmFae: row.FM_FAE != null ? Number(row.FM_FAE) : null,
                fmFat: row.FM_FAT != null ? Number(row.FM_FAT) : null,
                frFaa: row.FR_FAA != null ? Number(row.FR_FAA) : null,
                frFae: row.FR_FAE != null ? Number(row.FR_FAE) : null,
                frFat: row.FR_FAT != null ? Number(row.FR_FAT) : null,
                fra: row.FRA != null ? Number(row.FRA) : null,
                fre: row.FRE != null ? Number(row.FRE) : null,
                frt: row.FRT != null ? Number(row.FRT) : null,
                foFra: row.FO_FRA != null ? Number(row.FO_FRA) : null,
                foFre: row.FO_FRE != null ? Number(row.FO_FRE) : null,
                foFrt: row.FO_FRT != null ? Number(row.FO_FRT) : null,
                fmFra: row.FM_FRA != null ? Number(row.FM_FRA) : null,
                fmFre: row.FM_FRE != null ? Number(row.FM_FRE) : null,
                fmFrt: row.FM_FRT != null ? Number(row.FM_FRT) : null,
                frFra: row.FR_FRA != null ? Number(row.FR_FRA) : null,
                frFre: row.FR_FRE != null ? Number(row.FR_FRE) : null,
                frFrt: row.FR_FRT != null ? Number(row.FR_FRT) : null,
                fv: row.FV != null ? Number(row.FV) : null,
                foFv: row.FO_FV != null ? Number(row.FO_FV) : null,
                fmFv: row.FM_FV != null ? Number(row.FM_FV) : null,
                frFv: row.FR_FV != null ? Number(row.FR_FV) : null,
                fh: row.FH != null ? Number(row.FH) : null,
                foFh: row.FO_FH != null ? Number(row.FO_FH) : null,
                fmFh: row.FM_FH != null ? Number(row.FM_FH) : null,
                frFh: row.FR_FH != null ? Number(row.FR_FH) : null,
                sar: row.SAR != null ? Number(row.SAR) : null,
                foSar: row.FO_SAR != null ? Number(row.FO_SAR) : null,
                fmSar: row.FM_SAR != null ? Number(row.FM_SAR) : null,
                frSar: row.FR_SAR != null ? Number(row.FR_SAR) : null,
                sarv: row.SARV != null ? Number(row.SARV) : null,
                ebia: row.EBIA != null ? Number(row.EBIA) : null,
                ebie: row.EBIE != null ? Number(row.EBIE) : null,
                ebit: row.EBIT != null ? Number(row.EBIT) : null,
                agui: row.AGUI != null ? Number(row.AGUI) : null,
                pTrans: row.P_TRANS != null ? Number(row.P_TRANS) : null,
                pForan: row.P_FORAN != null ? Number(row.P_FORAN) : null,
                pmpGmM: row.PMP_GM_M != null ? Number(row.PMP_GM_M) : null,
                pmpGm: row.PMP_GM != null ? Number(row.PMP_GM) : null,
                pmpAvM: row.PMP_AV_M != null ? Number(row.PMP_AV_M) : null,
                pmpAv: row.PMP_AV != null ? Number(row.PMP_AV) : null,
                pmpEtM: row.PMP_ET_M != null ? Number(row.PMP_ET_M) : null,
                pmpEt: row.PMP_ET != null ? Number(row.PMP_ET) : null,
                pmpHoM: row.PMP_HO_M != null ? Number(row.PMP_HO_M) : null,
                pmpHo: row.PMP_HO != null ? Number(row.PMP_HO) : null,
                pmpTuM: row.PMP_TU_M != null ? Number(row.PMP_TU_M) : null,
                pmpTu: row.PMP_TU != null ? Number(row.PMP_TU) : null,
                pmpEdM: row.PMP_ED_M != null ? Number(row.PMP_ED_M) : null,
                pmpEd: row.PMP_ED != null ? Number(row.PMP_ED) : null,
                pmpOtM: row.PMP_OT_M != null ? Number(row.PMP_OT_M) : null,
                pmpOt: row.PMP_OT != null ? Number(row.PMP_OT) : null,
                concepto: row.CONCEPTO ? String(row.CONCEPTO) : null,
                monto: row.MONTO != null ? Number(row.MONTO) : null
              }));

              logger.info({
                ...logContext,
                recordCount: registros.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(registros);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando stored procedure');
          reject(new AplicacionQuincenalError(
            `Error síncrono al ejecutar AP_RESUMEN_ORG_QNA_ALL: ${syncError.message || String(syncError)}`,
            AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async guardarHistoricoAportaciones(
    req: FastifyRequest,
    data: GuardarHistoricoAportaciones
  ): Promise<GuardarHistoricoAportacionesResult> {
    const startTime = Date.now();
    const logContext = {
      operation: 'guardarHistoricoAportaciones',
      tipos: Object.keys(data).filter(key => data[key as keyof GuardarHistoricoAportaciones] !== undefined)
    };

    logger.info(logContext, 'Iniciando guardado de histórico de aportaciones');

    const procesados: string[] = [];
    const totalRegistros: Record<string, number> = {};

    try {
      await withDbContext(req, async (tx) => {
        // Procesar Ahorro (siempre, incluso con 0 registros)
        if (data.ahorro) {
          try {
            await this.crearYEjecutarAhorro(tx, data.ahorro.header, data.ahorro.detalle);
            procesados.push('ahorro');
            totalRegistros.ahorro = data.ahorro.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'ahorro', error: err.message || String(err), stack: err.stack }, 'Error al procesar ahorro');
            throw err;
          }
        }

        // Procesar Vivienda (siempre, incluso con 0 registros)
        if (data.vivienda) {
          try {
            await this.crearYEjecutarVivienda(tx, data.vivienda.header, data.vivienda.detalle);
            procesados.push('vivienda');
            totalRegistros.vivienda = data.vivienda.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'vivienda', error: err.message || String(err), stack: err.stack }, 'Error al procesar vivienda');
            throw err;
          }
        }

        // Procesar Prestaciones (siempre, incluso con 0 registros)
        if (data.prestaciones) {
          try {
            await this.crearYEjecutarPrestaciones(tx, data.prestaciones.header, data.prestaciones.detalle);
            procesados.push('prestaciones');
            totalRegistros.prestaciones = data.prestaciones.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'prestaciones', error: err.message || String(err), stack: err.stack }, 'Error al procesar prestaciones');
            throw err;
          }
        }

        // Procesar Cair (siempre, incluso con 0 registros)
        if (data.cair) {
          try {
            await this.crearYEjecutarCair(tx, data.cair.header, data.cair.detalle);
            procesados.push('cair');
            totalRegistros.cair = data.cair.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'cair', error: err.message || String(err), stack: err.stack }, 'Error al procesar cair');
            throw err;
          }
        }

        // Procesar Transitorio (siempre, incluso con 0 registros)
        if (data.transitorio) {
          try {
            await this.crearYEjecutarTransitorio(tx, data.transitorio.header, data.transitorio.detalle);
            procesados.push('transitorio');
            totalRegistros.transitorio = data.transitorio.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'transitorio', error: err.message || String(err), stack: err.stack }, 'Error al procesar transitorio');
            throw err;
          }
        }

        // Procesar Guarderias (siempre, incluso con 0 registros)
        if (data.guarderias) {
          try {
            await this.crearYEjecutarGuarderias(tx, data.guarderias.header, data.guarderias.detalle);
            procesados.push('guarderias');
            totalRegistros.guarderias = data.guarderias.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'guarderias', error: err.message || String(err), stack: err.stack }, 'Error al procesar guarderias');
            throw err;
          }
        }

        // Procesar Aguinaldo (siempre, incluso con 0 registros)
        if (data.aguinaldo) {
          try {
            await this.crearYEjecutarAguinaldo(tx, data.aguinaldo.header, data.aguinaldo.detalle);
            procesados.push('aguinaldo');
            totalRegistros.aguinaldo = data.aguinaldo.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'aguinaldo', error: err.message || String(err), stack: err.stack }, 'Error al procesar aguinaldo');
            throw err;
          }
        }
      });

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        duracionMs: duration
      }, 'Guardado de histórico completado exitosamente');

      return {
        procesados,
        totalRegistros
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Capturar información detallada del error de mssql
      const errorDetails: any = {
        message: error.message || String(error),
        name: error.name,
        stack: error.stack
      };
      
      // Si es un error de mssql, agregar información adicional
      if (error.code) errorDetails.code = error.code;
      if (error.number) errorDetails.number = error.number;
      if (error.class) errorDetails.class = error.class;
      if (error.state) errorDetails.state = error.state;
      if (error.procName) errorDetails.procName = error.procName;
      if (error.lineNumber) errorDetails.lineNumber = error.lineNumber;
      if (error.info) errorDetails.info = error.info;
      
      // Capturar originalError con todas sus propiedades
      if (error.originalError) {
        errorDetails.originalError = {
          message: error.originalError.message,
          name: error.originalError.name,
          code: error.originalError.code,
          number: error.originalError.number,
          class: error.originalError.class,
          state: error.originalError.state,
          procName: error.originalError.procName,
          lineNumber: error.originalError.lineNumber,
          info: error.originalError.info,
          serverName: error.originalError.serverName,
          sqlState: error.originalError.sqlState
        };
      }
      
      // Intentar obtener el mensaje del error de diferentes fuentes
      let errorMessage = error.message || String(error);
      if (error.originalError?.message) {
        errorMessage = error.originalError.message;
      } else if (error.originalError && typeof error.originalError === 'object') {
        // Intentar serializar el originalError completo
        try {
          const serialized = JSON.stringify(error.originalError, Object.getOwnPropertyNames(error.originalError));
          errorDetails.originalErrorSerialized = serialized;
          if (serialized.includes('message')) {
            const parsed = JSON.parse(serialized);
            if (parsed.message) errorMessage = parsed.message;
          }
        } catch (e) {
          // Ignorar errores de serialización
        }
      }
      
      logger.error({
        ...logContext,
        ...errorDetails,
        errorMessage,
        duracionMs: duration
      }, 'Error al guardar histórico de aportaciones');

      throw new AplicacionQuincenalError(
        `Error al guardar histórico de aportaciones: ${errorMessage}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  // Funciones helper privadas para cada tipo de aportación

  private async crearYEjecutarAhorro(
    tx: sql.Transaction,
    header: AhorroHeader,
    detalle: AhorroDetalle[]
  ): Promise<void> {
    // Crear TVP Header
    const headerTable = new sql.Table('aportaciones.TVP_AhorroLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados,
      header.total_contribucion,
      header.total_sueldo_base
    );

    // Crear TVP Detalle
    const detalleTable = new sql.Table('aportaciones.TVP_AhorroLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(18, 2));
    detalleTable.columns.add('quinquenios', sql.Decimal(18, 2));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(18, 2));
    detalleTable.columns.add('sueldo_base', sql.Decimal(18, 2));
    detalleTable.columns.add('afae', sql.Decimal(18, 2));
    detalleTable.columns.add('afaa', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo,
        row.quinquenios,
        row.otras_prestaciones ?? null,
        row.sueldo_base,
        row.afae,
        row.afaa,
        row.total
      );
    });

    // Ejecutar stored procedure
    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesAhorroHistorico_Lote');
  }

  private async crearYEjecutarVivienda(
    tx: sql.Transaction,
    header: ViviendaHeader,
    detalle: ViviendaDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_ViviendaLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_ViviendaLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(18, 2));
    detalleTable.columns.add('quinquenios', sql.Decimal(18, 2));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(18, 2));
    detalleTable.columns.add('sueldo_base', sql.Decimal(18, 2));
    detalleTable.columns.add('afe', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo,
        row.quinquenios,
        row.otras_prestaciones ?? null,
        row.sueldo_base,
        row.afe,
        row.total
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesViviendaHistorico_Lote');
  }

  private async crearYEjecutarPrestaciones(
    tx: sql.Transaction,
    header: PrestacionesHeader,
    detalle: PrestacionesDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_PrestacionesLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_PrestacionesLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(18, 2));
    detalleTable.columns.add('quinquenios', sql.Decimal(18, 2));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(18, 2));
    detalleTable.columns.add('sueldo_base', sql.Decimal(18, 2));
    detalleTable.columns.add('afpe', sql.Decimal(18, 2));
    detalleTable.columns.add('afpa', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo,
        row.quinquenios,
        row.otras_prestaciones ?? null,
        row.sueldo_base,
        row.afpe,
        row.afpa,
        row.total
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesPrestacionesHistorico_Lote');
  }

  private async crearYEjecutarCair(
    tx: sql.Transaction,
    header: CairHeader,
    detalle: CairDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_CairLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_CairLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(18, 2));
    detalleTable.columns.add('quinquenios', sql.Decimal(18, 2));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(18, 2));
    detalleTable.columns.add('sueldo_base', sql.Decimal(18, 2));
    detalleTable.columns.add('afe', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo,
        row.quinquenios,
        row.otras_prestaciones ?? null,
        row.sueldo_base,
        row.afe,
        row.total
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesCairHistorico_Lote');
  }

  private async crearYEjecutarTransitorio(
    tx: sql.Transaction,
    header: TransitorioHeader,
    detalle: TransitorioDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_TransitorioLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_TransitorioLoteDetalle');
    // Agregar todas las columnas requeridas (63 en total)
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('fpension', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombres', sql.NVarChar(255));
    detalleTable.columns.add('nonombre', sql.NVarChar(50));
    detalleTable.columns.add('rfc', sql.NVarChar(13));
    detalleTable.columns.add('norfc', sql.NVarChar(13));
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('norg0', sql.NVarChar(255));
    detalleTable.columns.add('norg1', sql.NVarChar(255));
    detalleTable.columns.add('norg2', sql.NVarChar(255));
    detalleTable.columns.add('norg3', sql.NVarChar(255));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('oprestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('sdo', sql.Decimal(19, 6));
    detalleTable.columns.add('oprest', sql.Decimal(19, 6));
    detalleTable.columns.add('quinq', sql.Decimal(19, 6));
    detalleTable.columns.add('tpension', sql.Decimal(19, 6));
    detalleTable.columns.add('transitorio', sql.Decimal(19, 6));
    detalleTable.columns.add('cconcepto', sql.NVarChar(20));
    detalleTable.columns.add('descripcion', sql.NVarChar(255));
    detalleTable.columns.add('importe', sql.Decimal(19, 6));
    detalleTable.columns.add('defuncion', sql.DateTime2(7));
    detalleTable.columns.add('pcp', sql.Decimal(19, 6));
    detalleTable.columns.add('palimenticia', sql.Decimal(19, 6));
    detalleTable.columns.add('retroactivo', sql.Decimal(19, 6));
    detalleTable.columns.add('payudaecon', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp1', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp2', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp3', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp4', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp5', sql.Decimal(19, 6));
    detalleTable.columns.add('terreno', sql.Decimal(19, 6));
    detalleTable.columns.add('hipviv', sql.Decimal(19, 6));
    detalleTable.columns.add('prodental', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod1', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod2', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod3', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod4', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod5', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod6', sql.Decimal(19, 6));
    detalleTable.columns.add('tpercep', sql.Decimal(19, 6));
    detalleTable.columns.add('tdeduc', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));
    detalleTable.columns.add('fin', sql.DateTime2(7));
    detalleTable.columns.add('inicio', sql.DateTime2(7));
    detalleTable.columns.add('anio_registro', sql.Int);
    detalleTable.columns.add('sihay', sql.NVarChar(10));
    detalleTable.columns.add('porcentaje', sql.Decimal(19, 6));
    detalleTable.columns.add('sdoporc', sql.Decimal(19, 6));
    detalleTable.columns.add('ayudporc', sql.Decimal(19, 6));
    detalleTable.columns.add('quinqporc', sql.Decimal(19, 6));
    detalleTable.columns.add('transorg0', sql.Char(2));
    detalleTable.columns.add('transorg1', sql.Char(2));
    detalleTable.columns.add('transnorg0', sql.NVarChar(255));
    detalleTable.columns.add('transnorg1', sql.NVarChar(255));

    const truncate = (value: string | null | undefined, maxLength: number) => {
      if (value === null || value === undefined) return null;
      if (value.length <= maxLength) return value;
      return value.slice(0, maxLength);
    };

    detalle.forEach(row => {
      // Validar campos Char(2) para asegurar que sean strings de exactamente 2 caracteres
      const org0Str = (row.org0 && String(row.org0).length === 2) ? String(row.org0) : (row.clave_organica_0 || '00');
      const org1Str = (row.org1 && String(row.org1).length === 2) ? String(row.org1) : (row.clave_organica_1 || '00');
      const org2Str = (row.org2 && String(row.org2).length === 2) ? String(row.org2) : '00';
      const org3Str = (row.org3 && String(row.org3).length === 2) ? String(row.org3) : '00';
      const transorg0Str = (row.transorg0 && String(row.transorg0).length === 2) ? String(row.transorg0) : (row.clave_organica_0 || '00');
      const transorg1Str = (row.transorg1 && String(row.transorg1).length === 2) ? String(row.transorg1) : (row.clave_organica_1 || '00');
      const claveOrg0Str = (row.clave_organica_0 && String(row.clave_organica_0).length === 2) ? String(row.clave_organica_0) : '00';
      const claveOrg1Str = (row.clave_organica_1 && String(row.clave_organica_1).length === 2) ? String(row.clave_organica_1) : '00';

      detalleTable.rows.add(
        claveOrg0Str,
        claveOrg1Str,
        row.quincena,
        row.anio,
        row.fpension ?? null,
        row.interno ?? null,
        truncate(row.nombres ?? null, 255),
        truncate(row.nonombre ?? null, 50),
        truncate(row.rfc ?? null, 13),
        truncate(row.norfc ?? null, 13),
        org0Str,
        org1Str,
        org2Str,
        org3Str,
        truncate(row.norg0 ?? null, 255),
        truncate(row.norg1 ?? null, 255),
        truncate(row.norg2 ?? null, 255),
        truncate(row.norg3 ?? null, 255),
        row.sueldo ?? null,
        row.oprestaciones ?? null,
        row.quinquenios ?? null,
        row.sdo ?? null,
        row.oprest ?? null,
        row.quinq ?? null,
        row.tpension ?? null,
        row.transitorio ?? null,
        truncate(row.cconcepto ?? null, 20),
        truncate(row.descripcion ?? null, 255),
        row.importe ?? null,
        row.defuncion ? new Date(row.defuncion) : null,
        row.pcp ?? null,
        row.palimenticia ?? null,
        row.retroactivo ?? null,
        row.payudaecon ?? null,
        row.otrosp1 ?? null,
        row.otrosp2 ?? null,
        row.otrosp3 ?? null,
        row.otrosp4 ?? null,
        row.otrosp5 ?? null,
        row.terreno ?? null,
        row.hipviv ?? null,
        row.prodental ?? null,
        row.otrod1 ?? null,
        row.otrod2 ?? null,
        row.otrod3 ?? null,
        row.otrod4 ?? null,
        row.otrod5 ?? null,
        row.otrod6 ?? null,
        row.tpercep ?? null,
        row.tdeduc ?? null,
        row.total ?? null,
        row.fin ? new Date(row.fin) : null,
        row.inicio ? new Date(row.inicio) : null,
        row.anio_detalle ?? null,
        truncate(row.sihay ?? null, 10),
        row.porcentaje ?? null,
        row.sdoporc ?? null,
        row.ayudporc ?? null,
        row.quinqporc ?? null,
        transorg0Str,
        transorg1Str,
        truncate(row.transnorg0 ?? null, 255),
        truncate(row.transnorg1 ?? null, 255)
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarPensionNominaTransitorioHistorico_Lote');
  }

  private async crearYEjecutarGuarderias(
    tx: sql.Transaction,
    header: GuarderiasHeader,
    detalle: GuarderiasDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_GuarderiasLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_GuarderiasLoteDetalle');
    // Agregar todas las columnas requeridas (29 en total)
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('titular_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_no_empleado', sql.NVarChar(50));
    detalleTable.columns.add('titular_monto', sql.Decimal(18, 2));
    detalleTable.columns.add('titular_rfc', sql.NVarChar(20));
    detalleTable.columns.add('titular_monto_texto', sql.NVarChar(200));
    detalleTable.columns.add('titular_org0', sql.Char(2));
    detalleTable.columns.add('titular_org0_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org1', sql.Char(2));
    detalleTable.columns.add('titular_org1_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org2', sql.Char(2));
    detalleTable.columns.add('titular_org2_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org3', sql.Char(2));
    detalleTable.columns.add('titular_org3_nombre', sql.NVarChar(200));
    detalleTable.columns.add('entidad_monto', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_ajuste', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_total', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_mes_ano', sql.NVarChar(50));
    detalleTable.columns.add('recibo_fecha_venc', sql.Date);
    detalleTable.columns.add('recibo_folio', sql.NVarChar(50));
    detalleTable.columns.add('menor_id', sql.Int);
    detalleTable.columns.add('menor_nombre', sql.NVarChar(200));
    detalleTable.columns.add('menor_rfc', sql.NVarChar(20));
    detalleTable.columns.add('menor_nivel', sql.NVarChar(100));
    detalleTable.columns.add('menor_sala', sql.NVarChar(100));
    detalleTable.columns.add('estatus', sql.NVarChar(50));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.titular_nombre,
        row.titular_no_empleado,
        row.titular_monto,
        row.titular_rfc,
        row.titular_monto_texto ?? null,
        row.titular_org0 ?? null,
        row.titular_org0_nombre ?? null,
        row.titular_org1 ?? null,
        row.titular_org1_nombre ?? null,
        row.titular_org2 ?? null,
        row.titular_org2_nombre ?? null,
        row.titular_org3 ?? null,
        row.titular_org3_nombre ?? null,
        row.entidad_monto ?? null,
        row.recibo_ajuste ?? null,
        row.recibo_total,
        row.recibo_mes_ano,
        new Date(row.recibo_fecha_venc),
        row.recibo_folio,
        row.menor_id,
        row.menor_nombre,
        row.menor_rfc ?? null,
        row.menor_nivel,
        row.menor_sala,
        row.estatus
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarGuarderiasHistorico_Lote');
  }

  private async crearYEjecutarAguinaldo(
    tx: sql.Transaction,
    header: AguinaldoHeader,
    detalle: AguinaldoDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_AguinaldoLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_AguinaldoLoteDetalle');
    // Agregar todas las columnas requeridas (41 en total) en el orden correcto del TVP
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('movimiento', sql.NVarChar(50));
    detalleTable.columns.add('noempleado', sql.NVarChar(50));
    detalleTable.columns.add('tipomovimiento', sql.NVarChar(50));
    detalleTable.columns.add('nombres', sql.NVarChar(200));
    detalleTable.columns.add('rfc', sql.NVarChar(20));
    detalleTable.columns.add('curp', sql.NVarChar(20));
    detalleTable.columns.add('fecha', sql.Date);
    detalleTable.columns.add('dias_aguinaldo', sql.Int);
    detalleTable.columns.add('cuantos', sql.Int);
    detalleTable.columns.add('cuantos_ori', sql.Int);
    detalleTable.columns.add('nocontar', sql.NVarChar(50));
    detalleTable.columns.add('sdo', sql.Decimal(18, 2));
    detalleTable.columns.add('op', sql.Decimal(18, 2));
    detalleTable.columns.add('q', sql.Decimal(18, 2));
    detalleTable.columns.add('activo', sql.NVarChar(50));
    detalleTable.columns.add('nom_activo', sql.NVarChar(200));
    detalleTable.columns.add('qna_a', sql.Int);
    detalleTable.columns.add('porcentaje_a', sql.Decimal(18, 2));
    detalleTable.columns.add('diario', sql.Decimal(18, 2));
    detalleTable.columns.add('general', sql.Decimal(18, 2));
    detalleTable.columns.add('porcentaje', sql.Decimal(18, 2));
    detalleTable.columns.add('proporcion', sql.Decimal(18, 2));
    detalleTable.columns.add('mensaje', sql.NVarChar(500));
    detalleTable.columns.add('dias_gral_agui', sql.Int);
    detalleTable.columns.add('fecha_lf', sql.Date);
    detalleTable.columns.add('fecha_li', sql.Date);
    detalleTable.columns.add('f_inicio', sql.Date);
    detalleTable.columns.add('f_fin', sql.Date);
    detalleTable.columns.add('norg0', sql.NVarChar(200));
    detalleTable.columns.add('norg1', sql.NVarChar(200));
    detalleTable.columns.add('norg2', sql.NVarChar(200));
    detalleTable.columns.add('norg3', sql.NVarChar(200));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.org0,
        row.org1,
        row.org2,
        row.org3,
        row.movimiento ?? null,
        row.noempleado,
        row.tipomovimiento ?? null,
        row.nombres,
        row.rfc,
        row.curp,
        row.fecha ? new Date(row.fecha) : new Date('1900-01-01'),
        row.dias_aguinaldo ?? null,
        row.cuantos ?? null,
        row.cuantos_ori ?? null,
        row.nocontar ?? null,
        row.sdo ?? 0,
        row.op ?? null,
        row.q ?? null,
        row.activo ?? null,
        row.nom_activo ?? null,
        row.qna_a ?? null,
        row.porcentaje_a ?? null,
        row.diario ?? null,
        row.general ?? 0,
        row.porcentaje ?? null,
        row.proporcion ?? 0,
        row.mensaje ?? null,
        row.dias_gral_agui ?? null,
        row.fecha_lf ? new Date(row.fecha_lf) : null,
        row.fecha_li ? new Date(row.fecha_li) : null,
        row.f_inicio ? new Date(row.f_inicio) : null,
        row.f_fin ? new Date(row.f_fin) : null,
        row.norg0,
        row.norg1,
        row.norg2,
        row.norg3
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarAguinaldoHistorico_Lote');
  }

  async guardarHistoricoRetenciones(
    req: FastifyRequest,
    data: GuardarHistoricoRetenciones
  ): Promise<GuardarHistoricoRetencionesResult> {
    const startTime = Date.now();
    const logContext = {
      operation: 'guardarHistoricoRetenciones',
      tipos: Object.keys(data).filter(key => data[key as keyof GuardarHistoricoRetenciones] !== undefined)
    };

    logger.info(logContext, 'Iniciando guardado de histórico de retenciones');

    const procesados: string[] = [];
    const totalRegistros: Record<string, number> = {};

    try {
      await withDbContext(req, async (tx) => {
        // Procesar PrestamosCortoPlazo
        if (data.prestamosCortoPlazo) {
          const detalleLength = Array.isArray(data.prestamosCortoPlazo.detalle) ? data.prestamosCortoPlazo.detalle.length : 0;
          await this.crearYEjecutarPrestamosCortoPlazo(tx, data.prestamosCortoPlazo.header, data.prestamosCortoPlazo.detalle);
          procesados.push('prestamosCortoPlazo');
          totalRegistros.prestamosCortoPlazo = detalleLength;
          logger.info({ tipo: 'prestamosCortoPlazo', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosCortoPlazo');
        }

        // Procesar PrestamosMedianoPlazo
        if (data.prestamosMedianoPlazo) {
          const detalleLength = Array.isArray(data.prestamosMedianoPlazo.detalle) ? data.prestamosMedianoPlazo.detalle.length : 0;
          await this.crearYEjecutarPrestamosMedianoPlazo(tx, data.prestamosMedianoPlazo.header, data.prestamosMedianoPlazo.detalle);
          procesados.push('prestamosMedianoPlazo');
          totalRegistros.prestamosMedianoPlazo = detalleLength;
          logger.info({ tipo: 'prestamosMedianoPlazo', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosMedianoPlazo');
        }

        // Procesar PrestamosHipotecarios
        if (data.prestamosHipotecarios) {
          const detalleLength = Array.isArray(data.prestamosHipotecarios.detalle) ? data.prestamosHipotecarios.detalle.length : 0;
          await this.crearYEjecutarPrestamosHipotecarios(tx, data.prestamosHipotecarios.header, data.prestamosHipotecarios.detalle);
          procesados.push('prestamosHipotecarios');
          totalRegistros.prestamosHipotecarios = detalleLength;
          logger.info({ tipo: 'prestamosHipotecarios', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosHipotecarios');
        }
      });

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        totalRegistrosKeys: Object.keys(totalRegistros),
        totalRegistrosString: JSON.stringify(totalRegistros),
        duracionMs: duration
      }, 'Guardado de histórico de retenciones completado exitosamente');

      // Asegurar que totalRegistros tenga valores para todos los procesados
      // Usar el mismo objeto totalRegistros directamente, asegurando que todos los procesados tengan un valor
      procesados.forEach(tipo => {
        if (totalRegistros[tipo] === undefined || totalRegistros[tipo] === null) {
          totalRegistros[tipo] = 0;
          logger.warn({ tipo, totalRegistros }, `totalRegistros[${tipo}] era undefined/null, asignando 0`);
        }
      });

      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        totalRegistrosKeys: Object.keys(totalRegistros),
        totalRegistrosString: JSON.stringify(totalRegistros),
        totalRegistrosEntries: Object.entries(totalRegistros)
      }, 'Retornando resultado final con totalRegistros');

      return {
        procesados,
        totalRegistros: { ...totalRegistros } // Crear una copia para asegurar que se retorne correctamente
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al guardar histórico de retenciones');

      throw new AplicacionQuincenalError(
        `Error al guardar histórico de retenciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  // Funciones helper privadas para cada tipo de préstamo

  private async crearYEjecutarPrestamosCortoPlazo(
    tx: sql.Transaction,
    header: PrestamosCortoPlazoHeader,
    detalle: PrestamosCortoPlazoDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('retenciones.TVP_PrestamosCortoPlazoLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      (header as any).total_empleados ?? 0,
      (header as any).total_contribucion ?? 0,
      (header as any).total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('retenciones.TVP_PrestamosCortoPlazoLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('rfc', sql.NVarChar(20));
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('prestamo', sql.Int);
    detalleTable.columns.add('letra', sql.Int);
    detalleTable.columns.add('plazo', sql.Int);
    detalleTable.columns.add('periodo_c', sql.NVarChar(50));
    detalleTable.columns.add('fecha_c', sql.Date);
    detalleTable.columns.add('capital', sql.Decimal(18, 2));
    detalleTable.columns.add('interes', sql.Decimal(18, 2));
    detalleTable.columns.add('monto', sql.Decimal(18, 2));
    detalleTable.columns.add('moratorios', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));
    detalleTable.columns.add('resultado', sql.NVarChar(50));
    detalleTable.columns.add('td', sql.NVarChar(10));
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('norg0', sql.NVarChar(100));
    detalleTable.columns.add('norg1', sql.NVarChar(100));
    detalleTable.columns.add('norg2', sql.NVarChar(100));
    detalleTable.columns.add('norg3', sql.NVarChar(100));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.rfc,
        row.nombre,
        row.prestamo,
        row.letra,
        row.plazo,
        row.periodo_c,
        new Date(row.fecha_c),
        row.capital,
        row.interes,
        row.monto,
        row.moratorios,
        row.total,
        row.resultado,
        row.td,
        row.org0,
        row.org1,
        row.org2,
        row.org3,
        row.norg0,
        row.norg1,
        row.norg2,
        row.norg3
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('retenciones.spGuardarPrestamosCortoPlazoHistorico_Lote');
  }

  private async crearYEjecutarPrestamosMedianoPlazo(
    tx: sql.Transaction,
    header: PrestamosMedianoPlazoHeader,
    detalle: PrestamosMedianoPlazoDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('retenciones.TVP_PrestamosMedianoPlazoLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      (header as any).total_empleados ?? 0,
      (header as any).total_contribucion ?? 0,
      (header as any).total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('retenciones.TVP_PrestamosMedianoPlazoLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('rfc', sql.NVarChar(20));
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('prestamo', sql.Int);
    detalleTable.columns.add('letra', sql.Int);
    detalleTable.columns.add('plazo', sql.Int);
    detalleTable.columns.add('periodo_c', sql.NVarChar(50));
    detalleTable.columns.add('fecha_c', sql.Date);
    detalleTable.columns.add('capital', sql.Decimal(18, 2));
    detalleTable.columns.add('moratorios', sql.Decimal(18, 2));
    detalleTable.columns.add('interes', sql.Decimal(18, 2));
    detalleTable.columns.add('seguro', sql.Decimal(18, 2));
    detalleTable.columns.add('total', sql.Decimal(18, 2));
    detalleTable.columns.add('resultado', sql.NVarChar(50));
    detalleTable.columns.add('clase', sql.NVarChar(10));
    detalleTable.columns.add('desc_clase', sql.NVarChar(100));
    detalleTable.columns.add('desc_prestamo', sql.NVarChar(200));
    detalleTable.columns.add('clave_p', sql.NVarChar(50));
    detalleTable.columns.add('noemple', sql.NVarChar(50));
    detalleTable.columns.add('folio', sql.Int);
    detalleTable.columns.add('anio_prestamo', sql.Int);
    detalleTable.columns.add('po', sql.NVarChar(50));
    detalleTable.columns.add('fecha_origen', sql.Date);
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('norg0', sql.NVarChar(100));
    detalleTable.columns.add('norg1', sql.NVarChar(100));
    detalleTable.columns.add('norg2', sql.NVarChar(100));
    detalleTable.columns.add('norg3', sql.NVarChar(100));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.rfc,
        row.nombre,
        row.prestamo,
        row.letra,
        row.plazo,
        row.periodo_c,
        new Date(row.fecha_c),
        row.capital,
        row.moratorios,
        row.interes,
        row.seguro,
        row.total,
        row.resultado,
        row.clase,
        row.desc_clase,
        row.desc_prestamo,
        row.clave_p,
        row.noemple,
        row.folio,
        row.anio_prestamo,
        row.po,
        new Date(row.fecha_origen),
        row.org0,
        row.org1,
        row.org2,
        row.org3,
        row.norg0,
        row.norg1,
        row.norg2,
        row.norg3
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('retenciones.spGuardarPrestamosMedianoPlazoHistorico_Lote');
  }

  private async crearYEjecutarPrestamosHipotecarios(
    tx: sql.Transaction,
    header: PrestamosHipotecariosHeader,
    detalle: PrestamosHipotecariosDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('retenciones.TVP_PrestamosHipotecariosLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      (header as any).total_empleados ?? 0,
      (header as any).total_contribucion ?? 0,
      (header as any).total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('retenciones.TVP_PrestamosHipotecariosLoteDetalle');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('computadora_antigua', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('noempleado', sql.NVarChar(50));
    detalleTable.columns.add('rfc', sql.NVarChar(20));
    detalleTable.columns.add('cantidad', sql.Decimal(18, 2));
    detalleTable.columns.add('status', sql.NVarChar(50));
    detalleTable.columns.add('referencia_1', sql.NVarChar(100));
    detalleTable.columns.add('referencia_2', sql.NVarChar(100));
    detalleTable.columns.add('pno_solicitud', sql.Int);
    detalleTable.columns.add('pano', sql.Int);
    detalleTable.columns.add('pclave_clase_prestamo', sql.NVarChar(20));
    detalleTable.columns.add('pdescripcion', sql.NVarChar(200));
    detalleTable.columns.add('pclave_prestamo', sql.NVarChar(50));
    detalleTable.columns.add('prestamo_desc', sql.NVarChar(200));
    detalleTable.columns.add('tipo', sql.NVarChar(50));
    detalleTable.columns.add('periodo_c', sql.NVarChar(50));
    detalleTable.columns.add('descto', sql.Decimal(18, 2));
    detalleTable.columns.add('fecha_c', sql.Date);
    detalleTable.columns.add('resultado', sql.NVarChar(50));
    detalleTable.columns.add('po', sql.NVarChar(50));
    detalleTable.columns.add('fecha_origen', sql.Date);
    detalleTable.columns.add('plazo', sql.Int);
    detalleTable.columns.add('capital_pagar', sql.Decimal(18, 2));
    detalleTable.columns.add('interes_pagar', sql.Decimal(18, 2));
    detalleTable.columns.add('interes_diferido_pagar', sql.Decimal(18, 2));
    detalleTable.columns.add('seguro_pagar', sql.Decimal(18, 2));
    detalleTable.columns.add('moratorio_pagar', sql.Decimal(18, 2));
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('norg0', sql.NVarChar(100));
    detalleTable.columns.add('norg1', sql.NVarChar(100));
    detalleTable.columns.add('norg2', sql.NVarChar(100));
    detalleTable.columns.add('norg3', sql.NVarChar(100));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.computadora_antigua,
        row.interno,
        row.nombre,
        row.noempleado,
        row.rfc,
        row.cantidad,
        row.status,
        row.referencia_1,
        row.referencia_2,
        row.pno_solicitud,
        row.pano,
        row.pclave_clase_prestamo,
        row.pdescripcion,
        row.pclave_prestamo,
        row.prestamo_desc,
        row.tipo,
        row.periodo_c,
        row.descto,
        new Date(row.fecha_c),
        row.resultado,
        row.po,
        new Date(row.fecha_origen),
        row.plazo,
        row.capital_pagar,
        row.interes_pagar,
        row.interes_diferido_pagar,
        row.seguro_pagar,
        row.moratorio_pagar,
        row.org0,
        row.org1,
        row.org2,
        row.org3,
        row.norg0,
        row.norg1,
        row.norg2,
        row.norg3
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('retenciones.spGuardarPrestamosHipotecariosHistorico_Lote');
  }

  // ============================================================================
  // Métodos de consulta de históricos
  // ============================================================================

  async obtenerHistoricoAportaciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<{
    ahorro: any[];
    vivienda: any[];
    prestaciones: any[];
    cair: any[];
    transitorio: any[];
    guarderias: any[];
    aguinaldo: any[];
  }> {
    const startTime = Date.now();
    const logContext = {
      operation: 'obtenerHistoricoAportaciones',
      org0,
      org1,
      quincena,
      anio
    };

    logger.info(logContext, 'Iniciando consulta de histórico de aportaciones');

    try {
      const p = await getPool();

      // Ejecutar todas las consultas en paralelo
      const [
        ahorroResult,
        viviendaResult,
        prestacionesResult,
        cairResult,
        transitorioResult,
        guarderiasResult,
        aguinaldoResult
      ] = await Promise.all([
        // Ahorro
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Vivienda
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Prestaciones
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Cair
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Transitorio
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.PensionNominaTransitorioHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Guarderias
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.GuarderiasHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Aguinaldo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.AguinaldoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `)
      ]);

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        duracionMs: duration,
        registros: {
          ahorro: ahorroResult.recordset.length,
          vivienda: viviendaResult.recordset.length,
          prestaciones: prestacionesResult.recordset.length,
          cair: cairResult.recordset.length,
          transitorio: transitorioResult.recordset.length,
          guarderias: guarderiasResult.recordset.length,
          aguinaldo: aguinaldoResult.recordset.length
        }
      }, 'Consulta de histórico de aportaciones completada');

      const diasMap = await this.obtenerDiasLaboradosHistoricoMap(
        p,
        org0,
        org1,
        quincena,
        anio,
        [
          ahorroResult.recordset,
          viviendaResult.recordset,
          prestacionesResult.recordset,
          cairResult.recordset,
          transitorioResult.recordset,
          guarderiasResult.recordset,
          aguinaldoResult.recordset
        ].flat()
      );
      return {
        ahorro: this.enriquecerHistoricoConDiasLaborados(ahorroResult.recordset, diasMap),
        vivienda: this.enriquecerHistoricoConDiasLaborados(viviendaResult.recordset, diasMap),
        prestaciones: this.enriquecerHistoricoConDiasLaborados(prestacionesResult.recordset, diasMap),
        cair: this.enriquecerHistoricoConDiasLaborados(cairResult.recordset, diasMap),
        transitorio: this.enriquecerHistoricoConDiasLaborados(transitorioResult.recordset, diasMap),
        guarderias: this.enriquecerHistoricoConDiasLaborados(guarderiasResult.recordset, diasMap),
        aguinaldo: this.enriquecerHistoricoConDiasLaborados(aguinaldoResult.recordset, diasMap)
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al consultar histórico de aportaciones');

      throw new AplicacionQuincenalError(
        `Error al consultar histórico de aportaciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  async obtenerHistoricoRetenciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<{
    prestamosCortoPlazo: any[];
    prestamosMedianoPlazo: any[];
    prestamosHipotecarios: any[];
  }> {
    const startTime = Date.now();
    const logContext = {
      operation: 'obtenerHistoricoRetenciones',
      org0,
      org1,
      quincena,
      anio
    };

    logger.info(logContext, 'Iniciando consulta de histórico de retenciones');

    try {
      const p = await getPool();

      // Ejecutar todas las consultas en paralelo
      const [
        cortoPlazoResult,
        medianoPlazoResult,
        hipotecariosResult
      ] = await Promise.all([
        // Préstamos Corto Plazo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosCortoPlazoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Préstamos Mediano Plazo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosMedianoPlazoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Préstamos Hipotecarios
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosHipotecariosHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `)
      ]);

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        duracionMs: duration,
        registros: {
          prestamosCortoPlazo: cortoPlazoResult.recordset.length,
          prestamosMedianoPlazo: medianoPlazoResult.recordset.length,
          prestamosHipotecarios: hipotecariosResult.recordset.length
        }
      }, 'Consulta de histórico de retenciones completada');

      return {
        prestamosCortoPlazo: cortoPlazoResult.recordset,
        prestamosMedianoPlazo: medianoPlazoResult.recordset,
        prestamosHipotecarios: hipotecariosResult.recordset
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al consultar histórico de retenciones');

      throw new AplicacionQuincenalError(
        `Error al consultar histórico de retenciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  private normalizarRfcHistorico(value: unknown): string | null {
    const rfc = String(value ?? '').trim().toUpperCase();
    return rfc ? rfc : null;
  }

  private obtenerRfcHistorico(row: any): string | null {
    return this.normalizarRfcHistorico(row?.rfc ?? row?.RFC ?? row?.titular_rfc ?? row?.TitularRFC);
  }

  private normalizarInternoHistorico(value: unknown): string | null {
    const interno = String(value ?? '').trim();
    return interno ? interno : null;
  }

  private obtenerInternoHistorico(row: any): string | null {
    return this.normalizarInternoHistorico(row?.interno ?? row?.INTERNO ?? row?.titular_no_empleado ?? row?.TitularNoEmpleado);
  }

  private async obtenerRfcPorInternoHistoricoMap(
    org0: string,
    org1: string,
    rows: any[]
  ): Promise<Map<string, string>> {
    const internos = Array.from(new Set(rows
      .map((row) => this.obtenerInternoHistorico(row))
      .filter((interno): interno is string => Boolean(interno))));

    if (internos.length === 0) {
      return new Map();
    }

    const params: any[] = [org0, org1, ...internos];
    const internoPlaceholders = internos.map(() => '?').join(', ');
    const result = await executeSafeQuery(`
      SELECT
        CAST(p.INTERNO AS VARCHAR(30)) AS INTERNO,
        p.RFC
      FROM PERSONAL p
      INNER JOIN ORG_PERSONAL o ON o.INTERNO = p.INTERNO
      WHERE o.CLAVE_ORGANICA_0 = ?
        AND o.CLAVE_ORGANICA_1 = ?
        AND CAST(p.INTERNO AS VARCHAR(30)) IN (${internoPlaceholders})
    `, params);

    const map = new Map<string, string>();
    result.forEach((row: any) => {
      const interno = this.normalizarInternoHistorico(row.INTERNO ?? row.interno);
      const rfc = this.normalizarRfcHistorico(row.RFC ?? row.rfc);
      if (interno && rfc && !map.has(interno)) {
        map.set(interno, rfc);
      }
    });

    return map;
  }

  private async obtenerDiasLaboradosHistoricoMap(
    pool: any,
    org0: string,
    org1: string,
    quincena: number,
    anio: number,
    rows: any[]
  ): Promise<Map<string, { dias: number; baseCotizacionQuinquenios: number | null }>> {
    const rfcPorInterno = await this.obtenerRfcPorInternoHistoricoMap(org0, org1, rows);
    const rfcs = Array.from(new Set(rows
      .map((row) => this.obtenerRfcHistorico(row) ?? rfcPorInterno.get(this.obtenerInternoHistorico(row) ?? ''))
      .filter((rfc): rfc is string => Boolean(rfc))));

    if (rfcs.length === 0) {
      return new Map();
    }

    const request = pool.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio);

    const rfcParams = rfcs.map((rfc, index) => {
      const paramName = `rfc${index}`;
      request.input(paramName, sql.VarChar(20), rfc);
      return `@${paramName}`;
    });

    const result = await request.query(`
        SELECT
          UPPER(LTRIM(RTRIM(d.RFC))) AS rfc,
          MAX(d.DiasLaborados) AS dias_laborados,
          MAX(d.BaseCotizacionQuinquenios) AS base_cotizacion_quinquenios
        FROM [SII-ISSSSPEA].[dbo].[NominaAplicacionQnalDetalle] d
        WHERE d.Organica0 = @org0
          AND d.Organica1 = @org1
          AND d.Anio = @anio
          AND d.Quincena = @quincena
          AND UPPER(LTRIM(RTRIM(d.RFC))) IN (${rfcParams.join(', ')})
        GROUP BY UPPER(LTRIM(RTRIM(d.RFC)))
      `);

    const diasMap = new Map<string, { dias: number; baseCotizacionQuinquenios: number | null }>();
    result.recordset.forEach((row: any) => {
      const rfc = this.normalizarRfcHistorico(row.rfc);
      const dias = row.dias_laborados == null ? null : Number(row.dias_laborados);
      const baseCotizacionQuinquenios = row.base_cotizacion_quinquenios == null ? null : Number(row.base_cotizacion_quinquenios);
      if (rfc && dias !== null && Number.isFinite(dias)) {
        diasMap.set(rfc, {
          dias,
          baseCotizacionQuinquenios: Number.isFinite(baseCotizacionQuinquenios) ? baseCotizacionQuinquenios : null
        });
      } else if (rfc && baseCotizacionQuinquenios !== null && Number.isFinite(baseCotizacionQuinquenios)) {
        diasMap.set(rfc, {
          dias: 15,
          baseCotizacionQuinquenios
        });
      }
    });

    const diasPorInterno = new Map<string, { dias: number; baseCotizacionQuinquenios: number | null }>();
    rfcPorInterno.forEach((rfc, interno) => {
      const info = diasMap.get(rfc);
      if (info !== undefined) {
        diasPorInterno.set(interno, info);
      }
    });

    return new Map([...diasMap, ...diasPorInterno]);
  }

  private enriquecerHistoricoConDiasLaborados(
    rows: any[],
    diasMap: Map<string, { dias: number; baseCotizacionQuinquenios: number | null }>
  ): any[] {
    return rows.map((row) => {
      const rfc = this.obtenerRfcHistorico(row);
      const interno = this.obtenerInternoHistorico(row);
      const info = (rfc ? diasMap.get(rfc) : undefined) ?? (interno ? diasMap.get(interno) : undefined);
      const nominaInfo = info ?? { dias: 15, baseCotizacionQuinquenios: null };

      return {
        ...row,
        dias_laborados: nominaInfo.dias,
        dias_laborados_origen: info === undefined ? 'categoriapuesto' : 'txt'
      };
    });
  }
}

