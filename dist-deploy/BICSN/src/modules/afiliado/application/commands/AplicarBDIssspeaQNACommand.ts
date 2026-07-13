import pino from 'pino';
import { actualizarBitacoraAfectacionOrgTerminado } from '../../infrastructure/services/AfiliadoBdiSspeaService.js';
import { ejecutarAP_P_APLICAR, ejecutarEBI2_RECIBOS } from '../../infrastructure/services/AfiliadoBdiSspeaFirebirdService.js';
import { getQuincenaAplicacion } from '../../infrastructure/services/AfiliadoQuincenaService.js';
import { crearAplicacionQnaLogPayload, guardarAplicacionQnaLogFtp } from '../../infrastructure/services/AplicacionQnaLogFtpService.js';

const logger = pino({
  name: 'aplicarBDIssspeaQNACommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface AplicarBDIssspeaQNAData {
  org0: string;
  org1: string;
  usuarioId: string;
}

export interface AplicarBDIssspeaQNAResult {
  exito: boolean;
  quincena: string;
  quincenaNumero: number;
  anio: number;
  ejecuciones: {
    obtenerQuincena: { exito: boolean; duracionMs: number; error?: string };
    aplicarC: { exito: boolean; duracionMs: number; error?: string };
    aplicarF: { exito: boolean; duracionMs: number; error?: string };
    ebi2Recibos: { exito: boolean; duracionMs: number; error?: string; idPeriodoFirebird?: number; mensaje?: string | null };
    envioLayout: { exito: boolean; duracionMs: number; error?: string };
    actualizarBitacora: { exito: boolean; duracionMs: number; error?: string };
    guardarLogFtp: { exito: boolean; duracionMs: number; error?: string; ruta?: string };
  };
  bitacoraActualizada: boolean;
  logFtpPath?: string | null;
  idPeriodoFirebird?: number | null;
  mensaje: string;
  tiempoTotalMs: number;
}

export class AplicarBDIssspeaQNACommand {
  async execute(data: AplicarBDIssspeaQNAData): Promise<AplicarBDIssspeaQNAResult> {
    const startTime = Date.now();
    const logContext = {
      operation: 'aplicarBDIssspeaQNA',
      org0: data.org0,
      org1: data.org1,
      usuarioId: data.usuarioId
    };

    logger.info(logContext, '🚀 [INICIO] Aplicando BDIssspea QNA');
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 [INICIO] Aplicando BDIssspea QNA`);
    console.log(`   Orgánica: ${data.org0}/${data.org1}`);
    console.log(`   Usuario: ${data.usuarioId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);

    const ejecuciones = {
      obtenerQuincena: { exito: false, duracionMs: 0, error: undefined as string | undefined },
      aplicarC: { exito: false, duracionMs: 0, error: undefined as string | undefined },
      aplicarF: { exito: false, duracionMs: 0, error: undefined as string | undefined },
      ebi2Recibos: { exito: false, duracionMs: 0, error: undefined as string | undefined, idPeriodoFirebird: undefined as number | undefined, mensaje: undefined as string | null | undefined },
      envioLayout: { exito: true, duracionMs: 0, error: 'OMITIDO' as string | undefined },
      actualizarBitacora: { exito: false, duracionMs: 0, error: undefined as string | undefined },
      guardarLogFtp: { exito: false, duracionMs: 0, error: undefined as string | undefined, ruta: undefined as string | undefined }
    };

    let quincena: string = '';
    let quincenaNumero: number = 0;
    let anio: number = 0;
    let bitacoraActualizada = false;
    let logFtpPath: string | null = null;
    let idPeriodoFirebird: number | null = null;
    const inicioUtc = new Date().toISOString();

    const guardarLogFtp = async (resultado: 'OK' | 'ERROR' | 'PARCIAL', mensaje: string): Promise<string | null> => {
      const logStart = Date.now();

      try {
        const path = await guardarAplicacionQnaLogFtp(crearAplicacionQnaLogPayload({
          resultado,
          solicitud: {
            org0: data.org0,
            org1: data.org1,
            periodo: quincena || '0000',
            idPeriodoFirebird,
            quincenaNumero,
            anio,
            usuarioId: data.usuarioId
          },
          ejecuciones,
          timestamps: {
            inicioUtc,
            finUtc: new Date().toISOString()
          },
          mensaje,
          tiempoTotalMs: Date.now() - startTime
        }));

        ejecuciones.guardarLogFtp = { exito: true, duracionMs: Date.now() - logStart, error: undefined, ruta: path };
        return path;
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        ejecuciones.guardarLogFtp = { exito: false, duracionMs: Date.now() - logStart, error: errorMsg, ruta: undefined };
        logger.error({ ...logContext, step: 'errorGuardarLogFtp', error: errorMsg }, 'No se pudo guardar log APLIQNA en SFTP');
        return null;
      }
    };

    try {
      // PASO 1: Obtener quincena de AP_G_APLICADO_TIPO
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 1: Obteniendo quincena de AP_G_APLICADO_TIPO`);
      console.log(`${'─'.repeat(80)}`);
      
      const paso1Start = Date.now();
      logger.info({
        ...logContext,
        step: 'obtenerQuincena',
        elapsedMs: Date.now() - startTime
      }, 'Obteniendo quincena de AP_G_APLICADO_TIPO');
      console.log(`⏳ [${Date.now() - startTime}ms] Ejecutando AP_G_APLICADO_TIPO(${data.org0}, ${data.org1}, '01', '01')...`);

      try {
        const quincenaResult = await getQuincenaAplicacion(
          data.org0,
          data.org1,
          '01',
          '01',
          parseInt(data.usuarioId) || undefined
        );

        quincenaNumero = quincenaResult.quincena;
        anio = quincenaResult.anio;
        // Formato QQAA (ej: "2125" = quincena 21 del año 2025)
        quincena = `${String(quincenaNumero).padStart(2, '0')}${String(anio).slice(-2)}`;

        const paso1Time = Date.now() - paso1Start;
        ejecuciones.obtenerQuincena = { exito: true, duracionMs: paso1Time, error: undefined };
        
        logger.info({
          ...logContext,
          step: 'quincenaObtenida',
          quincena,
          quincenaNumero,
          anio,
          duracionMs: paso1Time,
          elapsedMs: Date.now() - startTime
        }, `✅ Quincena obtenida: ${quincena} (${quincenaNumero}/${anio})`);
        console.log(`✅ [${paso1Time}ms] Quincena obtenida: ${quincena} (Quincena: ${quincenaNumero}, Año: ${anio})`);

      } catch (error: any) {
        const paso1Time = Date.now() - paso1Start;
        const errorMsg = error.message || String(error);
        ejecuciones.obtenerQuincena = { exito: false, duracionMs: paso1Time, error: errorMsg };
        
        logger.error({
          ...logContext,
          step: 'errorObtenerQuincena',
          error: {
            message: errorMsg,
            stack: error.stack,
            name: error.name
          },
          duracionMs: paso1Time,
          elapsedMs: Date.now() - startTime
        }, '❌ Error obteniendo quincena');
        console.error(`❌ [${paso1Time}ms] Error obteniendo quincena: ${errorMsg}`);
        throw new Error(`Error al obtener quincena: ${errorMsg}`);
      }

      // PASO 2: Ejecutar AP_P_APLICAR con tipo 'C'
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 2: Ejecutando AP_P_APLICAR con tipo 'C'`);
      console.log(`${'─'.repeat(80)}`);
      
      const paso2Start = Date.now();
      logger.info({
        ...logContext,
        step: 'ejecutarAP_P_APLICAR_C',
        quincena,
        elapsedMs: Date.now() - startTime
      }, `Ejecutando AP_P_APLICAR(${data.org0}, ${data.org1}, ${quincena}, ${quincena}, 'C')`);
      console.log(`⏳ [${Date.now() - startTime}ms] Ejecutando AP_P_APLICAR(${data.org0}, ${data.org1}, ${quincena}, ${quincena}, 'C')...`);

      try {
        await ejecutarAP_P_APLICAR(data.org0, data.org1, quincena, quincena, 'C');
        const paso2Time = Date.now() - paso2Start;
        ejecuciones.aplicarC = { exito: true, duracionMs: paso2Time, error: undefined };
        
        logger.info({
          ...logContext,
          step: 'AP_P_APLICAR_C_exitoso',
          quincena,
          duracionMs: paso2Time,
          elapsedMs: Date.now() - startTime
        }, '✅ AP_P_APLICAR con tipo C ejecutado exitosamente');
        console.log(`✅ [${paso2Time}ms] AP_P_APLICAR con tipo 'C' ejecutado exitosamente`);

      } catch (error: any) {
        const paso2Time = Date.now() - paso2Start;
        const errorMsg = error.message || String(error);
        ejecuciones.aplicarC = { exito: false, duracionMs: paso2Time, error: errorMsg };
        
        logger.error({
          ...logContext,
          step: 'errorAP_P_APLICAR_C',
          quincena,
          error: {
            message: errorMsg,
            stack: error.stack,
            name: error.name
          },
          duracionMs: paso2Time,
          elapsedMs: Date.now() - startTime
        }, '❌ Error ejecutando AP_P_APLICAR con tipo C');
        console.error(`❌ [${paso2Time}ms] Error ejecutando AP_P_APLICAR con tipo 'C': ${errorMsg}`);
        throw new Error(`Error al ejecutar AP_P_APLICAR con tipo 'C': ${errorMsg}`);
      }

      // PASO 3: Ejecutar AP_P_APLICAR con tipo 'F'
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 3: Ejecutando AP_P_APLICAR con tipo 'F'`);
      console.log(`${'─'.repeat(80)}`);
      
      const paso3Start = Date.now();
      logger.info({
        ...logContext,
        step: 'ejecutarAP_P_APLICAR_F',
        quincena,
        elapsedMs: Date.now() - startTime
      }, `Ejecutando AP_P_APLICAR(${data.org0}, ${data.org1}, ${quincena}, ${quincena}, 'F')`);
      console.log(`⏳ [${Date.now() - startTime}ms] Ejecutando AP_P_APLICAR(${data.org0}, ${data.org1}, ${quincena}, ${quincena}, 'F')...`);

      try {
        await ejecutarAP_P_APLICAR(data.org0, data.org1, quincena, quincena, 'F');
        const paso3Time = Date.now() - paso3Start;
        ejecuciones.aplicarF = { exito: true, duracionMs: paso3Time, error: undefined };
        
        logger.info({
          ...logContext,
          step: 'AP_P_APLICAR_F_exitoso',
          quincena,
          duracionMs: paso3Time,
          elapsedMs: Date.now() - startTime
        }, '✅ AP_P_APLICAR con tipo F ejecutado exitosamente');
        console.log(`✅ [${paso3Time}ms] AP_P_APLICAR con tipo 'F' ejecutado exitosamente`);

      } catch (error: any) {
        const paso3Time = Date.now() - paso3Start;
        const errorMsg = error.message || String(error);
        ejecuciones.aplicarF = { exito: false, duracionMs: paso3Time, error: errorMsg };
        
        logger.error({
          ...logContext,
          step: 'errorAP_P_APLICAR_F',
          quincena,
          error: {
            message: errorMsg,
            stack: error.stack,
            name: error.name
          },
          duracionMs: paso3Time,
          elapsedMs: Date.now() - startTime
        }, '❌ Error ejecutando AP_P_APLICAR con tipo F');
        console.error(`❌ [${paso3Time}ms] Error ejecutando AP_P_APLICAR con tipo 'F': ${errorMsg}`);
        throw new Error(`Error al ejecutar AP_P_APLICAR con tipo 'F': ${errorMsg}`);
      }

      // PASO 4: Ejecutar EBI2_RECIBOS con accion 'APLICAR'
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 4: Ejecutando EBI2_RECIBOS con accion 'APLICAR'`);
      console.log(`${'─'.repeat(80)}`);

      const paso4Start = Date.now();
      logger.info({
        ...logContext,
        step: 'ejecutarEBI2_RECIBOS',
        quincena,
        elapsedMs: Date.now() - startTime
      }, `Ejecutando EBI2_RECIBOS para periodo ${quincena} con accion 'APLICAR'`);
      console.log(`⏳ [${Date.now() - startTime}ms] Ejecutando EBI2_RECIBOS para periodo ${quincena} con accion 'APLICAR'...`);

      try {
        const ebi2Result = await ejecutarEBI2_RECIBOS(quincena, 'APLICAR');
        const paso4Time = Date.now() - paso4Start;
        idPeriodoFirebird = ebi2Result.idPeriodo;
        ejecuciones.ebi2Recibos = {
          exito: true,
          duracionMs: paso4Time,
          error: undefined,
          idPeriodoFirebird: ebi2Result.idPeriodo,
          mensaje: ebi2Result.mensaje ?? null
        };

        logger.info({
          ...logContext,
          step: 'EBI2_RECIBOS_exitoso',
          quincena,
          idPeriodoFirebird: ebi2Result.idPeriodo,
          mensajeFirebird: ebi2Result.mensaje,
          duracionMs: paso4Time,
          elapsedMs: Date.now() - startTime
        }, '✅ EBI2_RECIBOS ejecutado exitosamente');
        console.log(`✅ [${paso4Time}ms] EBI2_RECIBOS ejecutado exitosamente (ID_PERIODO=${ebi2Result.idPeriodo})`);

      } catch (error: any) {
        const paso4Time = Date.now() - paso4Start;
        const errorMsg = error.message || String(error);
        ejecuciones.ebi2Recibos = {
          exito: false,
          duracionMs: paso4Time,
          error: errorMsg,
          idPeriodoFirebird: idPeriodoFirebird ?? undefined,
          mensaje: null
        };

        logger.error({
          ...logContext,
          step: 'errorEBI2_RECIBOS',
          quincena,
          error: {
            message: errorMsg,
            stack: error.stack,
            name: error.name
          },
          duracionMs: paso4Time,
          elapsedMs: Date.now() - startTime
        }, '❌ Error ejecutando EBI2_RECIBOS');
        console.error(`❌ [${paso4Time}ms] Error ejecutando EBI2_RECIBOS: ${errorMsg}`);
        throw new Error(`Error al ejecutar EBI2_RECIBOS: ${errorMsg}`);
      }

      // PASO 5: Actualizar BitacoraAfectacionOrg a TERMINADO (SOLO si todos los pasos anteriores fueron exitosos)
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 5: Actualizando BitacoraAfectacionOrg a TERMINADO`);
      console.log(`${'─'.repeat(80)}`);
      
      const paso5Start = Date.now();
      logger.info({
        ...logContext,
        step: 'actualizarBitacoraTerminado',
        quincena,
        elapsedMs: Date.now() - startTime
      }, 'Actualizando BitacoraAfectacionOrg a TERMINADO');
      console.log(`⏳ [${Date.now() - startTime}ms] Actualizando BitacoraAfectacionOrg a TERMINADO...`);

      try {
        const mensajeBitacora = `Proceso QNA completado - Quincena: ${quincena} (${quincenaNumero}/${anio}). Stored procedures ejecutados: AP_P_APLICAR(C), AP_P_APLICAR(F), EBI2_RECIBOS(APLICAR)`;
        const bitacoraResult = await actualizarBitacoraAfectacionOrgTerminado(
          data.org0,
          data.org1,
          data.usuarioId,
          mensajeBitacora
        );

        const paso5Time = Date.now() - paso5Start;
        bitacoraActualizada = bitacoraResult.actualizado;
        ejecuciones.actualizarBitacora = { 
          exito: bitacoraActualizada, 
          duracionMs: paso5Time,
          error: bitacoraActualizada ? undefined : 'No se encontró registro para actualizar'
        };
        
        if (bitacoraActualizada) {
          logger.info({
            ...logContext,
            step: 'bitacoraActualizadaExitosamente',
            quincena,
            registrosAfectados: bitacoraResult.registrosAfectados,
            duracionMs: paso5Time,
            elapsedMs: Date.now() - startTime
          }, '✅ BitacoraAfectacionOrg actualizada a TERMINADO exitosamente');
          console.log(`✅ [${paso5Time}ms] BitacoraAfectacionOrg actualizada a TERMINADO (${bitacoraResult.registrosAfectados} registro(s))`);
        } else {
          logger.warn({
            ...logContext,
            step: 'bitacoraNoEncontrada',
            quincena,
            duracionMs: paso5Time,
            elapsedMs: Date.now() - startTime
          }, '⚠️  No se encontró registro en BitacoraAfectacionOrg para actualizar');
          console.log(`⚠️  [${paso5Time}ms] No se encontró registro en BitacoraAfectacionOrg para actualizar`);
        }

      } catch (error: any) {
        const paso5Time = Date.now() - paso5Start;
        const errorMsg = error.message || String(error);
        ejecuciones.actualizarBitacora = { exito: false, duracionMs: paso5Time, error: errorMsg };
        
        logger.error({
          ...logContext,
          step: 'errorActualizarBitacora',
          quincena,
          error: {
            message: errorMsg,
            stack: error.stack,
            name: error.name
          },
          duracionMs: paso5Time,
          elapsedMs: Date.now() - startTime
        }, '❌ Error actualizando BitacoraAfectacionOrg');
        console.error(`❌ [${paso5Time}ms] Error actualizando BitacoraAfectacionOrg: ${errorMsg}`);
        // NO lanzar error aquí - los stored procedures ya fueron exitosos
        // Solo loguear el error pero continuar
      }

      // Resumen final
      const tiempoTotal = Date.now() - startTime;
      const todosExitosos = ejecuciones.obtenerQuincena.exito &&
                            ejecuciones.aplicarC.exito &&
                            ejecuciones.aplicarF.exito &&
                            ejecuciones.ebi2Recibos.exito;
      const mensaje = todosExitosos
        ? `Proceso completado exitosamente. Quincena: ${quincena} (${quincenaNumero}/${anio}).`
        : `Proceso completado con errores. Revisar ejecuciones para detalles.`;

      logFtpPath = await guardarLogFtp(todosExitosos && bitacoraActualizada ? 'OK' : todosExitosos ? 'PARCIAL' : 'ERROR', mensaje);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎉 PROCESO ${todosExitosos ? '✅ COMPLETADO' : '❌ FALLIDO'}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`⏱️  Tiempo total: ${Math.round(tiempoTotal / 1000)}s (${tiempoTotal}ms)`);
      console.log(`📊 Resumen:`);
      console.log(`   📋 Quincena: ${quincena} (${quincenaNumero}/${anio})`);
      console.log(`   🔢 ID_PERIODO Firebird: ${idPeriodoFirebird ?? 'NO RESUELTO'}`);
      console.log(`   ✅ Obtener quincena: ${ejecuciones.obtenerQuincena.exito ? 'SÍ' : 'NO'} (${ejecuciones.obtenerQuincena.duracionMs}ms)`);
      console.log(`   ✅ AP_P_APLICAR(C): ${ejecuciones.aplicarC.exito ? 'SÍ' : 'NO'} (${ejecuciones.aplicarC.duracionMs}ms)`);
      console.log(`   ✅ AP_P_APLICAR(F): ${ejecuciones.aplicarF.exito ? 'SÍ' : 'NO'} (${ejecuciones.aplicarF.duracionMs}ms)`);
      console.log(`   ✅ EBI2_RECIBOS(APLICAR): ${ejecuciones.ebi2Recibos.exito ? 'SÍ' : 'NO'} (${ejecuciones.ebi2Recibos.duracionMs}ms)`);
      console.log(`   💾 Bitácora actualizada: ${bitacoraActualizada ? 'SÍ' : 'NO'} (${ejecuciones.actualizarBitacora.duracionMs}ms)`);
      console.log(`   📄 Log SFTP: ${logFtpPath || 'NO GENERADO'}`);
      console.log(`   🏢 Orgánica: ${data.org0}/${data.org1}`);
      console.log(`${'='.repeat(80)}\n`);

      logger.info({
        ...logContext,
        step: 'procesoCompletado',
        quincena,
        todosExitosos,
        bitacoraActualizada,
        tiempoTotalMs: tiempoTotal,
        ejecuciones
      }, `Proceso completado en ${Math.round(tiempoTotal / 1000)}s`);

      return {
        exito: todosExitosos,
        quincena,
        quincenaNumero,
        anio,
        ejecuciones,
        bitacoraActualizada,
        logFtpPath,
        idPeriodoFirebird,
        mensaje,
        tiempoTotalMs: tiempoTotal
      };

    } catch (error: any) {
      const tiempoTotal = Date.now() - startTime;
      const errorMsg = error.message || String(error);
      logFtpPath = await guardarLogFtp('ERROR', `Error durante el proceso: ${errorMsg}`);
      
      console.error(`\n${'='.repeat(80)}`);
      console.error(`🔴 ERROR DURANTE EL PROCESO`);
      console.error(`${'='.repeat(80)}`);
      console.error(`❌ Error: ${errorMsg}`);
      console.error(`   Tiempo transcurrido: ${Math.round(tiempoTotal / 1000)}s`);
      console.error(`${'='.repeat(80)}\n`);

      logger.error({
        ...logContext,
        step: 'errorGeneral',
        error: {
          message: errorMsg,
          stack: error.stack,
          name: error.name
        },
        tiempoTotalMs: tiempoTotal,
        ejecuciones
      }, 'Error durante proceso aplicarBDIssspeaQNA');

      return {
        exito: false,
        quincena: quincena || '',
        quincenaNumero,
        anio,
        ejecuciones,
        bitacoraActualizada: false,
        logFtpPath,
        idPeriodoFirebird,
        mensaje: `Error durante el proceso: ${errorMsg}`,
        tiempoTotalMs: tiempoTotal
      };
    }
  }
}

