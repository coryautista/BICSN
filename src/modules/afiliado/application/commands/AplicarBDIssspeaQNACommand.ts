import pino from 'pino';
import { actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId, marcarBitacoraPendienteLineaPago, registrarSiguienteQnaSiDisponible, verificarAplicacionMovimientosFinalizada } from '../../infrastructure/services/AfiliadoBdiSspeaService.js';
import { ejecutarAP_P_APLICAR, ejecutarEBI2_RECIBOS_AP } from '../../infrastructure/services/AfiliadoBdiSspeaFirebirdService.js';
import { getQuincenaAplicacion } from '../../infrastructure/services/AfiliadoQuincenaService.js';
import { crearAplicacionQnaLogPayload, guardarAplicacionQnaLogFtp } from '../../infrastructure/services/AplicacionQnaLogFtpService.js';
import type { IEventoCalendarioRepository } from '../../../eventoCalendario/domain/repositories/IEventoCalendarioRepository.js';
import { executeInTransaction } from '../../../../db/firebird.js';
import { GenerateLineaCapturaPeriodoCommand, GenerateLineaCapturaPeriodoResult } from '../../../reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.js';

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
    lineaPago: { exito: boolean; duracionMs: number; error?: string };
    envioLayout: { exito: boolean; duracionMs: number; error?: string };
    actualizarBitacora: { exito: boolean; duracionMs: number; error?: string };
    guardarLogFtp: { exito: boolean; duracionMs: number; error?: string; ruta?: string };
  };
  bitacoraActualizada: boolean;
  logFtpPath?: string | null;
  idPeriodoFirebird?: number | null;
  baMovimiento: { generados: number; fechaInicio?: string; fechaFin?: string; error?: string };
  firebirdTransaction: 'NO_INICIADA' | 'COMMIT' | 'ROLLBACK';
  pasoFallido?: string | null;
  lineaPago?: GenerateLineaCapturaPeriodoResult | null;
  mensaje: string;
  tiempoTotalMs: number;
}

export class AplicarBDIssspeaQNACommand {
  constructor(
    private eventoCalendarioRepo: IEventoCalendarioRepository,
    private generateLineaCapturaPeriodoCommand: GenerateLineaCapturaPeriodoCommand
  ) {}

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
      lineaPago: { exito: false, duracionMs: 0, error: undefined as string | undefined },
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
    let baMovimiento: AplicarBDIssspeaQNAResult['baMovimiento'] = { generados: 0 };
    let afectacionId: number | null = null;
    let firebirdTransaction: AplicarBDIssspeaQNAResult['firebirdTransaction'] = 'NO_INICIADA';
    let pasoFallido: string | null = null;
    let lineaPago: GenerateLineaCapturaPeriodoResult | null = null;
    const inicioUtc = new Date().toISOString();

    const guardarLogFtp = async (resultado: 'OK' | 'ERROR' | 'PARCIAL', mensaje: string): Promise<string | null> => {
      const logStart = Date.now();

      try {
        // Si el archivo existe en SFTP, la escritura terminó correctamente; si falla, el catch corrige el resultado de la API.
        ejecuciones.guardarLogFtp = { exito: true, duracionMs: 0, error: undefined, ruta: undefined };
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
          firebirdTransaction,
          pasoFallido,
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

        const estadoMovimientos = await verificarAplicacionMovimientosFinalizada(
          data.org0,
          data.org1,
          quincenaNumero,
          anio
        );

        if (!estadoMovimientos.finalizada) {
          throw new Error('APLICACION_MOVIMIENTOS_NO_FINALIZADA');
        }
        if (estadoMovimientos.resultado === 'PENDIENTE') {
          throw new Error('LINEA_PAGO_PENDIENTE_RECUPERACION');
        }
        afectacionId = estadoMovimientos.afectacionId;

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

      const esQuincenaPar = quincenaNumero % 2 === 0;
      await executeInTransaction(async (firebirdTx) => {
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
        pasoFallido = 'AP_P_APLICAR_C';
        await ejecutarAP_P_APLICAR(data.org0, data.org1, quincena, quincena, 'C', firebirdTx);
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
        pasoFallido = 'AP_P_APLICAR_F';
        await ejecutarAP_P_APLICAR(data.org0, data.org1, quincena, quincena, 'F', firebirdTx);
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

      // PASO 4: Ejecutar EBI2_RECIBOS_AP con accion 'APLICAR' solo en quincenas pares
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 PASO 4: ${esQuincenaPar ? "Ejecutando EBI2_RECIBOS_AP con accion 'APLICAR'" : 'Omitiendo EBI2_RECIBOS_AP por quincena impar'}`);
      console.log(`${'─'.repeat(80)}`);

      const paso4Start = Date.now();
      if (!esQuincenaPar) {
        ejecuciones.ebi2Recibos = {
          exito: true,
          duracionMs: 0,
          error: undefined,
          idPeriodoFirebird: undefined,
          mensaje: 'No aplica en quincenas impares'
        };
        logger.info({
          ...logContext,
          step: 'EBI2_RECIBOS_AP_omitido',
          quincena,
          quincenaNumero,
          elapsedMs: Date.now() - startTime
        }, 'EBI2_RECIBOS_AP omitido por quincena impar');
        console.log(`⏭️  EBI2_RECIBOS_AP omitido: quincena ${quincenaNumero} es impar`);
      } else {
        logger.info({
          ...logContext,
          step: 'ejecutarEBI2_RECIBOS_AP',
          quincena,
          elapsedMs: Date.now() - startTime
        }, `Ejecutando EBI2_RECIBOS_AP para periodo ${quincena} con accion 'APLICAR'`);
        console.log(`⏳ [${Date.now() - startTime}ms] Ejecutando EBI2_RECIBOS_AP para periodo ${quincena} con accion 'APLICAR'...`);

        try {
          pasoFallido = 'EBI2_RECIBOS_AP';
          const ebi2Result = await ejecutarEBI2_RECIBOS_AP(data.org0, data.org1, '01', '01', quincena, 'APLICAR', firebirdTx);
          const paso4Time = Date.now() - paso4Start;
          ejecuciones.ebi2Recibos = {
            exito: true,
            duracionMs: paso4Time,
            error: undefined,
            idPeriodoFirebird: undefined,
            mensaje: ebi2Result.mensaje ?? null
          };

          logger.info({
            ...logContext,
            step: 'EBI2_RECIBOS_AP_exitoso',
            quincena,
            mensajeFirebird: ebi2Result.mensaje,
            duracionMs: paso4Time,
            elapsedMs: Date.now() - startTime
          }, '✅ EBI2_RECIBOS_AP ejecutado exitosamente');
          console.log(`✅ [${paso4Time}ms] EBI2_RECIBOS_AP ejecutado exitosamente`);

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
            step: 'errorEBI2_RECIBOS_AP',
            quincena,
            error: {
              message: errorMsg,
              stack: error.stack,
              name: error.name
            },
            duracionMs: paso4Time,
            elapsedMs: Date.now() - startTime
          }, '❌ Error ejecutando EBI2_RECIBOS_AP');
          console.error(`❌ [${paso4Time}ms] Error ejecutando EBI2_RECIBOS_AP: ${errorMsg}`);
          throw new Error(`Error al ejecutar EBI2_RECIBOS_AP: ${errorMsg}`);
        }
      }
      });
      firebirdTransaction = 'COMMIT';
      pasoFallido = null;

      const lineaPagoStart = Date.now();
      try {
        pasoFallido = 'LINEA_PAGO';
        lineaPago = await this.generateLineaCapturaPeriodoCommand.execute({
          org0: data.org0,
          org1: data.org1,
          periodo: quincena,
          usuarioId: data.usuarioId,
          omitirValidacionEstado: true
        });
        ejecuciones.lineaPago = { exito: true, duracionMs: Date.now() - lineaPagoStart, error: undefined };
        pasoFallido = null;
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        ejecuciones.lineaPago = { exito: false, duracionMs: Date.now() - lineaPagoStart, error: errorMsg };
        if (!afectacionId) throw new Error('AFECTACION_ID_NO_RESUELTO');
        await marcarBitacoraPendienteLineaPago(afectacionId, data.usuarioId, errorMsg);
        throw new Error(`LINEA_PAGO_PENDIENTE_RECUPERACION: ${errorMsg}`);
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
        const mensajeBitacora = esQuincenaPar
          ? `Proceso QNA completado - Quincena: ${quincena} (${quincenaNumero}/${anio}). Stored procedures ejecutados: AP_P_APLICAR(C), AP_P_APLICAR(F), EBI2_RECIBOS_AP(APLICAR)`
          : `Proceso QNA completado - Quincena: ${quincena} (${quincenaNumero}/${anio}). Stored procedures ejecutados: AP_P_APLICAR(C), AP_P_APLICAR(F). EBI2_RECIBOS_AP omitido por quincena impar`;
        if (!afectacionId) throw new Error('AFECTACION_ID_NO_RESUELTO');
        const bitacoraResult = await actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId(
          afectacionId,
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
        if (!bitacoraActualizada) {
          throw new Error('BITACORA_TERMINADO_NO_ACTUALIZADA');
        }
        
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
        pasoFallido = 'ACTUALIZAR_BITACORA';
        ejecuciones.actualizarBitacora = { exito: false, duracionMs: paso5Time, error: errorMsg };
        if (afectacionId) {
          await marcarBitacoraPendienteLineaPago(afectacionId, data.usuarioId, errorMsg);
        }
        
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

      if (bitacoraActualizada) {
        try {
          await registrarSiguienteQnaSiDisponible(data.org0, data.org1, quincena, data.usuarioId);
        } catch (error: any) {
          logger.error({ ...logContext, quincena, error: error.message || String(error) }, 'No se pudo registrar la siguiente QNA');
        }
      }

      // Resumen final
      const tiempoTotal = Date.now() - startTime;
      const todosExitosos = ejecuciones.obtenerQuincena.exito &&
                            ejecuciones.aplicarC.exito &&
                            ejecuciones.aplicarF.exito &&
                            ejecuciones.ebi2Recibos.exito &&
                            ejecuciones.lineaPago.exito;
      if (todosExitosos && bitacoraActualizada) {
        try {
          baMovimiento = await this.generarBaMovimiento(quincena);
        } catch (error: any) {
          const errorMessage = error.message || String(error);
          baMovimiento = { generados: 0, error: errorMessage };
          logger.error({ ...logContext, quincena, error: errorMessage }, 'No se pudieron generar los eventos BA_MOVIMIENTO');
        }
      }
      const procesoCompleto = todosExitosos && bitacoraActualizada;
      const mensaje = procesoCompleto
        ? `Proceso completado exitosamente. Quincena: ${quincena} (${quincenaNumero}/${anio}).`
        : `Proceso completado con errores. Revisar ejecuciones para detalles.`;

      logFtpPath = await guardarLogFtp(todosExitosos && bitacoraActualizada ? 'OK' : todosExitosos ? 'PARCIAL' : 'ERROR', mensaje);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎉 PROCESO ${procesoCompleto ? '✅ COMPLETADO' : '❌ FALLIDO'}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`⏱️  Tiempo total: ${Math.round(tiempoTotal / 1000)}s (${tiempoTotal}ms)`);
      console.log(`📊 Resumen:`);
      console.log(`   📋 Quincena: ${quincena} (${quincenaNumero}/${anio})`);
      console.log(`   ✅ Obtener quincena: ${ejecuciones.obtenerQuincena.exito ? 'SÍ' : 'NO'} (${ejecuciones.obtenerQuincena.duracionMs}ms)`);
      console.log(`   ✅ AP_P_APLICAR(C): ${ejecuciones.aplicarC.exito ? 'SÍ' : 'NO'} (${ejecuciones.aplicarC.duracionMs}ms)`);
      console.log(`   ✅ AP_P_APLICAR(F): ${ejecuciones.aplicarF.exito ? 'SÍ' : 'NO'} (${ejecuciones.aplicarF.duracionMs}ms)`);
      console.log(`   ✅ EBI2_RECIBOS_AP(APLICAR): ${ejecuciones.ebi2Recibos.exito ? 'SÍ' : 'NO'} (${ejecuciones.ebi2Recibos.duracionMs}ms)`);
      console.log(`   💾 Bitácora actualizada: ${bitacoraActualizada ? 'SÍ' : 'NO'} (${ejecuciones.actualizarBitacora.duracionMs}ms)`);
      console.log(`   📄 Log SFTP: ${logFtpPath || 'NO GENERADO'}`);
      console.log(`   🏢 Orgánica: ${data.org0}/${data.org1}`);
      console.log(`${'='.repeat(80)}\n`);

      logger.info({
        ...logContext,
        step: 'procesoCompletado',
        quincena,
        todosExitosos,
        procesoCompleto,
        bitacoraActualizada,
        tiempoTotalMs: tiempoTotal,
        ejecuciones
      }, `Proceso completado en ${Math.round(tiempoTotal / 1000)}s`);

      return {
        exito: procesoCompleto,
        quincena,
        quincenaNumero,
        anio,
        ejecuciones,
        bitacoraActualizada,
        logFtpPath,
        idPeriodoFirebird,
        baMovimiento,
        firebirdTransaction,
        pasoFallido,
        lineaPago,
        mensaje,
        tiempoTotalMs: tiempoTotal
      };

    } catch (error: any) {
      if (firebirdTransaction === 'NO_INICIADA' && ejecuciones.obtenerQuincena.exito) {
        firebirdTransaction = 'ROLLBACK';
      }
      const tiempoTotal = Date.now() - startTime;
      const errorMsg = error.message || String(error);
      const resultadoFtp = firebirdTransaction === 'COMMIT' && pasoFallido === 'LINEA_PAGO' ? 'PARCIAL' : 'ERROR';
      logFtpPath = await guardarLogFtp(resultadoFtp, `Error durante el proceso: ${errorMsg}`);
      
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
        baMovimiento,
        firebirdTransaction,
        pasoFallido,
        lineaPago,
        mensaje: `Error durante el proceso: ${errorMsg}`,
        tiempoTotalMs: tiempoTotal
      };
    }
  }

  private async generarBaMovimiento(periodoQna: string): Promise<AplicarBDIssspeaQNAResult['baMovimiento']> {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    const inicio = new Date(hoy);

    const formato = (fecha: Date) => {
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${anio}-${mes}-${dia}`;
    };
    const hipotecarios = await this.eventoCalendarioRepo.findByDateRange(
      formato(hoy),
      formato(new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate())),
      'HIPOTECARIO',
    );
    const corte = hipotecarios[0];
    if (!corte) {
      throw new Error('CORTE_HIPOTECARIO_NO_ENCONTRADO');
    }
    const fin = new Date(`${corte.fecha}T12:00:00`);
    fin.setDate(fin.getDate() - 1);

    let generados = 0;
    for (const fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
      try {
        await this.eventoCalendarioRepo.create({
          fecha: formato(fecha),
          tipo: 'BA_MOVIMIENTO',
          anio: fecha.getFullYear(),
          origen: 'AUTOMATICO',
          periodoQna,
          eventoHipotecarioId: corte?.id ?? null,
        });
        generados += 1;
      } catch (error: any) {
        if (error.message !== 'EVENTO_CALENDARIO_ALREADY_EXISTS') {
          throw error;
        }
      }
    }

    return { generados, fechaInicio: formato(inicio), fechaFin: formato(fin) };
  }
}

