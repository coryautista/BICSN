import pino from 'pino';
import {
  executeExecutableProcedure,
  executeProcedureInTransaction,
  executeQueryInTransaction,
  executeSelectableProcedure,
  FIREBIRD_TIMEOUTS
} from '../../../../db/firebird.js';

const logger = pino({
  name: 'afiliado-bdisspea-firebird-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function verificarAP_DN_APLICAR(
  periodo: string,
  org0: string,
  org1: string,
  org2: string,
  org3: string,
  tx: unknown
): Promise<void> {
  const details = await executeQueryInTransaction(tx, `
    SELECT COUNT(*) AS TOTAL,
      SUM(CASE WHEN STATUS = 'P' THEN 1 ELSE 0 END) AS PREPARADOS,
      SUM(CASE WHEN STATUS = 'N' THEN 1 ELSE 0 END) AS NUEVOS,
      SUM(CASE WHEN STATUS = 'A' THEN 1 ELSE 0 END) AS APLICADOS
    FROM AP_D_ORIGEN_TODOS
    WHERE QNA = ? AND ORG0 = ? AND ORG1 = ?`, [periodo, org0, org1], { org0, org1 });
  const summary = await executeQueryInTransaction(tx, `
    SELECT COUNT(*) AS TOTAL
    FROM AP_D_ORIGEN_RESUMEN
    WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ?
      AND ORG2 = ? AND ORG3 = ? AND TIPO = 'AN'`, [periodo, org0, org1, org2, org3], { org0, org1 });
  const row = details[0] ?? {};
  const total = Number(row.TOTAL ?? row.total ?? 0);
  const prepared = Number(row.PREPARADOS ?? row.preparados ?? 0);
  const newRows = Number(row.NUEVOS ?? row.nuevos ?? 0);
  const applied = Number(row.APLICADOS ?? row.aplicados ?? 0);
  const summaries = Number(summary[0]?.TOTAL ?? summary[0]?.total ?? 0);
  if (total === 0 || prepared !== total || newRows !== 0 || applied !== 0 || summaries !== 1) {
    throw new Error('NOMINA_FIREBIRD_SCOPE_NO_PREPARADO');
  }
}

export async function ejecutarAP_DN_APLICAR(
  periodo: string,
  org0: string,
  org1: string,
  org2: string,
  org3: string,
  tx?: unknown
): Promise<void> {
  for (const [nombre, valor] of Object.entries({ org0, org1, org2, org3 })) {
    if (!/^\d{2}$/.test(valor)) throw new Error(`Parámetro inválido para ${nombre}: ${valor}`);
  }
  if (!/^\d{4}$/.test(periodo)) throw new Error(`Parámetro inválido para periodo: ${periodo}`);

  const params = [periodo, org0, org1, org2, org3];
  const logContext = { operation: 'ejecutarAP_DN_APLICAR', periodo, org0, org1, org2, org3 };
  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de AP_DN_APLICAR');
  try {
    if (tx) await executeProcedureInTransaction(tx, 'AP_DN_APLICAR', params, { org0, org1 });
    else await executeExecutableProcedure('AP_DN_APLICAR', params, { timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP, scope: { org0, org1 } });
    logger.info({ ...logContext, duracionMs: Date.now() - startTime }, 'AP_DN_APLICAR ejecutado exitosamente');
  } catch (error: any) {
    logger.error({ ...logContext, error: { message: error.message || String(error), code: error.code }, duracionMs: Date.now() - startTime },
      'Error ejecutando AP_DN_APLICAR');
    throw new Error(`Error al ejecutar AP_DN_APLICAR: ${error.message || String(error)}`);
  }
}

export async function ejecutarAP_P_APLICAR(
  org0: string,
  org1: string,
  quincenaC: string,
  quincenaA: string,
  tipo: string,
  tx?: unknown
): Promise<void> {
  const logContext = {
    operation: 'ejecutarAP_P_APLICAR',
    org0,
    org1,
    quincenaC,
    quincenaA,
    tipo
  };

  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de AP_P_APLICAR');
  console.log(`[AP_P_APLICAR] Iniciando ejecución con parámetros: org0=${org0}, org1=${org1}, quincenaC=${quincenaC}, quincenaA=${quincenaA}, tipo=${tipo}`);

  const ensureMatch = (value: string, re: RegExp, label: string) => {
    if (!re.test(value)) {
      throw new Error(`Parámetro inválido para ${label}: ${value}`);
    }
    return value;
  };

  ensureMatch(org0, /^\d{2}$/, 'org0');
  ensureMatch(org1, /^\d{2}$/, 'org1');
  ensureMatch(quincenaC, /^\d{4}$/, 'quincenaC');
  ensureMatch(quincenaA, /^\d{4}$/, 'quincenaA');
  ensureMatch(tipo, /^[A-Z]$/, 'tipo');

  try {
    const params = [org0, org1, quincenaC, quincenaA, tipo];
    if (tx) {
      await executeProcedureInTransaction(tx, 'AP_P_APLICAR', params, { org0, org1 });
    } else {
      await executeExecutableProcedure('AP_P_APLICAR', params, { timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP, scope: { org0, org1 } });
    }

    const duration = Date.now() - startTime;
    logger.info({
      ...logContext,
      duracionMs: duration
    }, 'AP_P_APLICAR ejecutado exitosamente');
    console.log(`[AP_P_APLICAR] ✅ Ejecutado exitosamente en ${duration}ms`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        code: error.code,
        name: error.name,
        stack: error.stack
      },
      duracionMs: duration
    }, 'Error ejecutando AP_P_APLICAR');
    console.error(`[AP_P_APLICAR] ❌ Error ejecutando stored procedure: ${error.message || String(error)}`);
    throw new Error(`Error al ejecutar AP_P_APLICAR: ${error.message || String(error)}`);
  }
}

export interface EBI2RecibosApResult {
  periodo: string;
  error?: boolean | null;
  mensaje?: string | null;
}

export async function ejecutarEBI2_RECIBOS_AP(
  org0: string,
  org1: string,
  org2: string,
  org3: string,
  periodo: string,
  accion: 'APLICAR',
  tx?: unknown
): Promise<EBI2RecibosApResult> {
  const logContext = {
    operation: 'ejecutarEBI2_RECIBOS_AP',
    org0,
    org1,
    org2,
    org3,
    periodo,
    accion
  };

  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de EBI2_RECIBOS_AP');
  console.log(`[EBI2_RECIBOS_AP] Iniciando ejecución con parámetros: org0=${org0}, org1=${org1}, org2=${org2}, org3=${org3}, periodo=${periodo}, accion=${accion}`);

  for (const [nombre, valor] of Object.entries({ org0, org1, org2, org3 })) {
    if (!/^\d{2}$/.test(valor)) throw new Error(`Parámetro inválido para ${nombre}: ${valor}`);
  }
  if (!/^\d{4}$/.test(periodo)) {
    throw new Error(`Parámetro inválido para periodo: ${periodo}`);
  }

  if (accion !== 'APLICAR') {
    throw new Error(`Parámetro inválido para accion: ${accion}`);
  }

  try {
    const params = [org0, org1, org2, org3, periodo, accion];
    const resultRows = tx
      ? await executeQueryInTransaction(tx, 'SELECT * FROM EBI2_RECIBOS_AP(?, ?, ?, ?, ?, ?)', params, { org0, org1 })
      : await executeSelectableProcedure('EBI2_RECIBOS_AP', params, { timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP, scope: { org0, org1 } });
    const result = resultRows[0] ?? {};
    if (result.ERROR === true) {
      throw new Error(result.MENSAJE || 'EBI2_RECIBOS_AP reportó un error sin mensaje.');
    }

    const duration = Date.now() - startTime;
    logger.info({
      ...logContext,
      resultado: result,
      duracionMs: duration
    }, 'EBI2_RECIBOS_AP ejecutado exitosamente');
    console.log(`[EBI2_RECIBOS_AP] ✅ Ejecutado exitosamente en ${duration}ms`);

    return {
      periodo,
      error: result.ERROR ?? null,
      mensaje: result.MENSAJE ?? null
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        code: error.code,
        name: error.name,
        stack: error.stack
      },
      duracionMs: duration
    }, 'Error ejecutando EBI2_RECIBOS_AP');
    console.error(`[EBI2_RECIBOS_AP] ❌ Error ejecutando stored procedure: ${error.message || String(error)}`);
    throw new Error(`Error al ejecutar EBI2_RECIBOS_AP: ${error.message || String(error)}`);
  }
}

export async function ejecutarAP_D_ENVIO_LAYOUT(
  quincena: string,
  org0: string,
  org1: string,
  org2: string,
  org3: string
): Promise<void> {
  const logContext = {
    operation: 'ejecutarAP_D_ENVIO_LAYOUT',
    quincena,
    org0,
    org1,
    org2,
    org3
  };

  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de AP_D_ENVIO_LAYOUT');
  console.log(`[AP_D_ENVIO_LAYOUT] Iniciando ejecución con parámetros: quincena=${quincena}, org0=${org0}, org1=${org1}, org2=${org2}, org3=${org3}`);

  try {
    await executeExecutableProcedure('AP_D_ENVIO_LAYOUT', [quincena, org0, org1, org2, org3], {
      timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP,
      scope: { org0, org1 }
    });

    const duration = Date.now() - startTime;
    logger.info({
      ...logContext,
      duracionMs: duration
    }, 'AP_D_ENVIO_LAYOUT ejecutado exitosamente');
    console.log(`[AP_D_ENVIO_LAYOUT] ✅ Ejecutado exitosamente en ${duration}ms`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        code: error.code,
        name: error.name,
        stack: error.stack
      },
      duracionMs: duration
    }, 'Error ejecutando AP_D_ENVIO_LAYOUT');
    console.error(`[AP_D_ENVIO_LAYOUT] ❌ Error ejecutando stored procedure: ${error.message || String(error)}`);
    throw new Error(`Error al ejecutar AP_D_ENVIO_LAYOUT: ${error.message || String(error)}`);
  }
}
