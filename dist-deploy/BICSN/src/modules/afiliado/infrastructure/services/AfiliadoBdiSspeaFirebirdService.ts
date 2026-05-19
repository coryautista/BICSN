import pino from 'pino';
import { executeExecutableProcedure, FIREBIRD_TIMEOUTS } from '../../../../db/firebird.js';

const logger = pino({
  name: 'afiliado-bdisspea-firebird-service',
  level: process.env.LOG_LEVEL || 'info'
});

export async function ejecutarAP_P_APLICAR(
  org0: string,
  org1: string,
  quincenaC: string,
  quincenaA: string,
  tipo: string
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
    await executeExecutableProcedure('AP_P_APLICAR', [org0, org1, quincenaC, quincenaA, tipo], {
      timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP
    });

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
      timeoutMs: FIREBIRD_TIMEOUTS.HEAVY_SP
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
