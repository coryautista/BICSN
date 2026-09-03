import {
  actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId,
} from '../../infrastructure/services/AfiliadoBdiSspeaService.js';
import { ejecutarAP_DN_APLICAR, ejecutarAP_P_APLICAR, ejecutarEBI2_RECIBOS_AP, verificarAP_DN_APLICAR } from '../../infrastructure/services/AfiliadoBdiSspeaFirebirdService.js';
import { crearAplicacionQnaLogPayload, guardarAplicacionQnaLogFtp } from '../../infrastructure/services/AplicacionQnaLogFtpService.js';
import { executeInTransactionWithOutcome, type FirebirdScope, type FirebirdTransactionExecution } from '../../../../db/firebird.js';
import { GenerateLineaCapturaPeriodoCommand, type GenerateLineaCapturaPeriodoResult } from '../../../reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.js';
import type { ILiquidacionQnaRepository, QnaApplicationSnapshot } from '../../../liquidacionQna/domain/repositories/ILiquidacionQnaRepository.js';
import type { QnaProcessState, QnaScope } from '../../../liquidacionQna/domain/entities/LiquidacionQna.js';
import { qnaFail } from '../../../liquidacionQna/domain/errors.js';
import { qnaApplicationHeartbeatMs, qnaApplicationRuntimeConfig, type QnaApplicationClaimType } from '../../../liquidacionQna/domain/services/QnaApplicationSagaPolicy.js';
import pino from 'pino';

const logger=pino({name:'aplicarBDIssspeaQNACommand',level:process.env.LOG_LEVEL||'info'});

export interface AplicarBDIssspeaQNAData extends QnaScope {
  usuarioId: string;
  liquidacionSnapshotId: string;
}

type Step = { exito: boolean; duracionMs: number; error?: string };
export interface AplicarBDIssspeaQNAResult {
  exito: boolean;
  quincena: string;
  quincenaNumero: number;
  anio: number;
  ejecuciones: {
    obtenerQuincena: Step;
    aplicarDn?: Step;
    aplicarC?: Step;
    aplicarF?: Step;
    ebi2Recibos: Step & { idPeriodoFirebird?: number; mensaje?: string | null };
    lineaPago: Step;
    envioLayout: Step;
    actualizarBitacora: Step;
    guardarLogFtp: Step & { ruta?: string };
  };
  bitacoraActualizada: boolean;
  logFtpPath?: string | null;
  idPeriodoFirebird?: number | null;
  baMovimiento: { generados: number; fechaInicio?: string; fechaFin?: string; error?: string };
  firebirdTransaction: 'NO_INICIADA' | 'COMMIT' | 'ROLLBACK' | 'INCIERTA';
  pasoFallido?: string | null;
  lineaPago?: GenerateLineaCapturaPeriodoResult | null;
  mensaje: string;
  tiempoTotalMs: number;
  liquidacionSnapshotId: string;
  estadoProceso: QnaProcessState;
  idempotente: boolean;
  requiereResolucionManual: boolean;
  intentoUuid: string;
  afectacionId: number;
}

export interface AplicarQnaDependencies {
  executeFirebirdTransaction<T>(fn: (tx: any) => Promise<T>, scope: FirebirdScope): Promise<FirebirdTransactionExecution<T>>;
  verificarAP_DN_APLICAR: typeof verificarAP_DN_APLICAR;
  ejecutarAP_DN_APLICAR: typeof ejecutarAP_DN_APLICAR;
  ejecutarAP_P_APLICAR: typeof ejecutarAP_P_APLICAR;
  ejecutarEBI2_RECIBOS_AP: typeof ejecutarEBI2_RECIBOS_AP;
  actualizarBitacora: typeof actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId;
  guardarLogFtp: typeof guardarAplicacionQnaLogFtp;
  heartbeatIntervalMs?: () => number;
  setHeartbeatInterval?: (callback: () => void, milliseconds: number) => ReturnType<typeof setInterval>;
  clearHeartbeatInterval?: (timer: ReturnType<typeof setInterval>) => void;
}

export const aplicarQnaDependencies: AplicarQnaDependencies = {
  executeFirebirdTransaction: executeInTransactionWithOutcome,
  verificarAP_DN_APLICAR,
  ejecutarAP_DN_APLICAR,
  ejecutarAP_P_APLICAR,
  ejecutarEBI2_RECIBOS_AP,
  actualizarBitacora: actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId,
  guardarLogFtp: guardarAplicacionQnaLogFtp,
};

export class AplicarBDIssspeaQNACommand {
  constructor(
    private generateLineaCapturaPeriodoCommand: GenerateLineaCapturaPeriodoCommand,
    private liquidacionQnaRepo: ILiquidacionQnaRepository,
    private aplicarQnaDependencies: AplicarQnaDependencies
  ) {}

  async execute(data: AplicarBDIssspeaQNAData): Promise<AplicarBDIssspeaQNAResult> {
    qnaApplicationRuntimeConfig();
    const startedAt = Date.now();
    const decision = await this.liquidacionQnaRepo.beginOrResumeApplication(data.liquidacionSnapshotId, data, data.usuarioId);
    const ejecuciones = this.emptySteps(decision.nominaCargaId !== null);
    if (decision.action === 'RESOLUCION_MANUAL') {
      qnaFail('La aplicacion Firebird requiere resolucion administrativa con evidencia', 'QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL', 409);
    }
    if (decision.action === 'TERMINADA') return this.result(data, decision, ejecuciones, startedAt, {
      firebirdTransaction: 'NO_INICIADA', bitacoraActualizada: true, mensaje: 'Proceso QNA ya terminado.', idempotente: true,
    });

    const { periodo } = decision;
    const quincenaNumero = decision.scope.quincena;
    const anio = decision.scope.anio;
    let firebirdTransaction: AplicarBDIssspeaQNAResult['firebirdTransaction'] = 'NO_INICIADA';
    let state = decision.estadoProceso;
    const afectacionId = decision.afectacionId;
    let lineaPago: GenerateLineaCapturaPeriodoResult | null = null;

    if (decision.action === 'EJECUTAR_FIREBIRD') {
      if(!decision.claimToken)qnaFail('No se obtuvo claim Firebird','QNA_APLICACION_CLAIM_CONFLICTO',409);
      ejecuciones.obtenerQuincena = { exito: true, duracionMs: 0 };

      let failedStep: string | null = null;
      const heartbeat=this.startApplicationHeartbeat(decision.intentoUuid,decision.claimToken,'FIREBIRD',data.usuarioId);
      let transaction:FirebirdTransactionExecution<void>={outcome:'NO_INICIADA'};
      let firebirdStarted=false;
      try {
        await heartbeat.ensure();
        firebirdStarted=true;
        transaction = await this.aplicarQnaDependencies.executeFirebirdTransaction(async tx => {
          if (decision.nominaCargaId !== null) {
            await heartbeat.ensure();failedStep = 'PRECHECK_AP_DN_APLICAR';
            await this.aplicarQnaDependencies.verificarAP_DN_APLICAR(
              periodo, decision.scope.organica0, decision.scope.organica1, decision.scope.organica2, decision.scope.organica3, tx);
            await heartbeat.ensure();failedStep = 'AP_DN_APLICAR';
            await this.timed(ejecuciones.aplicarDn!, () => this.aplicarQnaDependencies.ejecutarAP_DN_APLICAR(
              periodo, decision.scope.organica0, decision.scope.organica1, decision.scope.organica2, decision.scope.organica3, tx));await heartbeat.ensure();
          } else {
            await heartbeat.ensure();failedStep = 'AP_P_APLICAR_C';
            await this.timed(ejecuciones.aplicarC!, () => this.aplicarQnaDependencies.ejecutarAP_P_APLICAR(
              decision.scope.organica0, decision.scope.organica1, periodo, periodo, 'C', tx));await heartbeat.ensure();
            await heartbeat.ensure();failedStep = 'AP_P_APLICAR_F';
            await this.timed(ejecuciones.aplicarF!, () => this.aplicarQnaDependencies.ejecutarAP_P_APLICAR(
              decision.scope.organica0, decision.scope.organica1, periodo, periodo, 'F', tx));await heartbeat.ensure();
          }
          if (quincenaNumero % 2 === 0) {
            await heartbeat.ensure();failedStep = 'EBI2_RECIBOS_AP';
            await this.timed(ejecuciones.ebi2Recibos, async () => {
              const response = await this.aplicarQnaDependencies.ejecutarEBI2_RECIBOS_AP(
                decision.scope.organica0, decision.scope.organica1, '01', '01', periodo, 'APLICAR', tx);
              ejecuciones.ebi2Recibos.mensaje = response.mensaje ?? null;
            });await heartbeat.ensure();
          } else {
            ejecuciones.ebi2Recibos = { exito: true, duracionMs: 0, mensaje: 'No aplica en quincenas impares' };
          }
        }, { org0: decision.scope.organica0, org1: decision.scope.organica1 });
      }catch(error){transaction={outcome:firebirdStarted?'RESULTADO_INCIERTO':'NO_INICIADA',error};}finally {await heartbeat.stop();}
      const heartbeatNote=heartbeat.failed()?' Heartbeat de claim no saludable.':'';
      const destination=transaction.outcome==='COMMIT_CONFIRMADO'?'FIREBIRD_CONFIRMADO':transaction.outcome==='RESULTADO_INCIERTO'?'APLICACION_INCIERTA':'FIREBIRD_REVERTIDO';
      const outcomeReason=transaction.outcome==='COMMIT_CONFIRMADO'?`Transaccion Firebird confirmada.${heartbeatNote}`:
        transaction.outcome==='RESULTADO_INCIERTO'?`${failedStep??'FIREBIRD'}: ${this.message(transaction.error)}.${heartbeatNote}`:`${this.message(transaction.error)}.${heartbeatNote}`;
      try{await this.liquidacionQnaRepo.completeFirebirdAttempt(decision.intentoUuid,decision.claimToken,destination,outcomeReason,data.usuarioId);}
      catch(error){const code=String((error as any)?.code??'QNA_RESULTADO_FIREBIRD_PERSISTENCIA_ERROR');logger.error({intentoUuid:decision.intentoUuid,
          firebirdOutcome:transaction.outcome,heartbeatHealthy:!heartbeat.failed(),persistenceErrorCode:code},'No se pudo persistir el resultado Firebird autoritativo');
        if(code.includes('CONFLICTO')||code.includes('CLAIM'))qnaFail('El resultado Firebird conocido conflicto con una decision durable previa','QNA_RESULTADO_FIREBIRD_PERSISTENCIA_CONFLICTO',409);
        qnaFail('El resultado Firebird conocido no pudo persistirse','QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL',409);}
      if (transaction.outcome === 'COMMIT_CONFIRMADO') {
        firebirdTransaction = 'COMMIT';
        state = 'FIREBIRD_CONFIRMADO';
      } else if (transaction.outcome === 'ROLLBACK_CONFIRMADO' || transaction.outcome === 'NO_INICIADA') {
        firebirdTransaction = transaction.outcome === 'ROLLBACK_CONFIRMADO' ? 'ROLLBACK' : 'NO_INICIADA';
        qnaFail('La transaccion Firebird fue revertida', 'QNA_FIREBIRD_REVERTIDO', 500);
      } else {
        firebirdTransaction = 'INCIERTA';
        qnaFail('El resultado de la transaccion Firebird es incierto', 'QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL', 409);
      }
    } else {
      ejecuciones.obtenerQuincena = { exito: true, duracionMs: 0 };
    }

    const recoveryClaim=decision.claimToken;
    if(!recoveryClaim)qnaFail('No se obtuvo claim de recuperacion','QNA_RECUPERACION_CLAIM_CONFLICTO',409);
    const recoveryHeartbeat=this.startApplicationHeartbeat(decision.intentoUuid,recoveryClaim,'RECUPERACION',data.usuarioId);
    let bitacoraActualizada = false;
    try{if (state === 'FIREBIRD_CONFIRMADO') {
      const lineStart = Date.now();
      try {
        await recoveryHeartbeat.ensure();
        lineaPago = await this.generateLineaCapturaPeriodoCommand.createOrReuseFromSnapshot({
          org0: decision.scope.organica0, org1: decision.scope.organica1, periodo, usuarioId: data.usuarioId,
          organica2: decision.scope.organica2, organica3: decision.scope.organica3, entidadId: decision.scope.entidadId,
          omitirValidacionEstado: true, liquidacionSnapshotId: data.liquidacionSnapshotId,
        });
        ejecuciones.lineaPago = { exito: true, duracionMs: Date.now() - lineStart };
        await recoveryHeartbeat.ensure();
        await this.liquidacionQnaRepo.advanceRecoveryAttempt(decision.intentoUuid,recoveryClaim,'LINEA_CONFIRMADA','Linea de pago confirmada',data.usuarioId);
        state='LINEA_CONFIRMADA';await recoveryHeartbeat.ensure();
      } catch (error) {
        const message = this.message(error);
        ejecuciones.lineaPago = { exito: false, duracionMs: Date.now() - lineStart, error: message };
        await this.liquidacionQnaRepo.releaseRecoveryClaim(decision.intentoUuid,recoveryClaim,message,data.usuarioId).catch(()=>undefined);
        qnaFail('Firebird confirmado; linea o REVISA pendiente de recuperacion', 'QNA_RECUPERACION_SQL_PENDIENTE', 500);
      }
    }

    if(state==='LINEA_CONFIRMADA'){
      try{await recoveryHeartbeat.ensure();await this.generateLineaCapturaPeriodoCommand.scheduleRevisionFromSnapshot({org0:decision.scope.organica0,org1:decision.scope.organica1,
        organica2:decision.scope.organica2,organica3:decision.scope.organica3,entidadId:decision.scope.entidadId,periodo,usuarioId:data.usuarioId,
        omitirValidacionEstado:true,liquidacionSnapshotId:data.liquidacionSnapshotId});
        await recoveryHeartbeat.ensure();await this.liquidacionQnaRepo.advanceRecoveryAttempt(decision.intentoUuid,recoveryClaim,'REVISA_PROGRAMADA','Tarea REVISA programada',data.usuarioId);state='REVISA_PROGRAMADA';await recoveryHeartbeat.ensure();
      }catch(error){await this.liquidacionQnaRepo.releaseRecoveryClaim(decision.intentoUuid,recoveryClaim,this.message(error),data.usuarioId).catch(()=>undefined);
        qnaFail('Linea confirmada; REVISA pendiente de recuperacion','QNA_RECUPERACION_SQL_PENDIENTE',500);}}

    try {
      await recoveryHeartbeat.ensure();
      const bitacoraStart = Date.now();
      const update = await this.aplicarQnaDependencies.actualizarBitacora(afectacionId, data.usuarioId, `Proceso QNA completado - Quincena: ${periodo}`);
      bitacoraActualizada = update.actualizado;
      ejecuciones.actualizarBitacora = { exito: bitacoraActualizada, duracionMs: Date.now() - bitacoraStart,
        ...(bitacoraActualizada ? {} : { error: 'BITACORA_TERMINADO_NO_ACTUALIZADA' }) };
      if (!bitacoraActualizada) throw new Error('BITACORA_TERMINADO_NO_ACTUALIZADA');
      await recoveryHeartbeat.ensure();
    }catch(error){await this.liquidacionQnaRepo.releaseRecoveryClaim(decision.intentoUuid,recoveryClaim,this.message(error),data.usuarioId).catch(()=>undefined);
      qnaFail('No se pudo terminar la bitacora exacta de afectacion','QNA_RECUPERACION_SQL_PENDIENTE',500);}
    await this.liquidacionQnaRepo.advanceRecoveryAttempt(decision.intentoUuid,recoveryClaim,'TERMINADO','Aplicacion QNA terminada',data.usuarioId);
    state = 'TERMINADO';
    }finally{await recoveryHeartbeat.stop();}

    let logFtpPath: string | null = null;
    try {
      logFtpPath = await this.aplicarQnaDependencies.guardarLogFtp(crearAplicacionQnaLogPayload({
        resultado: 'OK', solicitud: { org0: decision.scope.organica0, org1: decision.scope.organica1, periodo,
          idPeriodoFirebird: null, quincenaNumero, anio, usuarioId: data.usuarioId }, ejecuciones,
        firebirdTransaction, pasoFallido: null, timestamps: { inicioUtc: new Date(startedAt).toISOString(), finUtc: new Date().toISOString() },
        mensaje: 'Proceso completado exitosamente.', tiempoTotalMs: Date.now() - startedAt,
      }));
      ejecuciones.guardarLogFtp = { exito: true, duracionMs: 0, ruta: logFtpPath };
    } catch (error) {
      ejecuciones.guardarLogFtp = { exito: false, duracionMs: 0, error: this.message(error) };
    }
    return this.result(data, { ...decision, estadoProceso: state }, ejecuciones, startedAt, {
      firebirdTransaction, bitacoraActualizada, lineaPago, logFtpPath,
      mensaje: `Proceso completado exitosamente. Quincena: ${periodo} (${quincenaNumero}/${anio}).`,
      idempotente: decision.idempotente,
    });
  }

  private async timed(step: Step, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try { await fn(); step.exito = true; step.duracionMs = Date.now() - start; }
    catch (error) { step.exito = false; step.duracionMs = Date.now() - start; step.error = this.message(error); throw error; }
  }

  private startApplicationHeartbeat(intentoUuid:string,claimToken:string,claimType:QnaApplicationClaimType,usuarioId:string){
    let failure:unknown=null;let pending=Promise.resolve();let running=false;
    const renew=async()=>{if(failure)return;try{await this.liquidacionQnaRepo.renewApplicationClaim(intentoUuid,claimToken,claimType,usuarioId);}catch(error){failure=error;}};
    const enqueue=()=>{if(running||failure)return;running=true;pending=renew().catch(error=>{failure=error;}).finally(()=>{running=false;});};
    const setTimer=this.aplicarQnaDependencies.setHeartbeatInterval??setInterval;
    const clearTimer=this.aplicarQnaDependencies.clearHeartbeatInterval??clearInterval;
    const interval=(this.aplicarQnaDependencies.heartbeatIntervalMs??qnaApplicationHeartbeatMs)();
    const timer=setTimer(enqueue,interval);
    return {ensure:async()=>{await pending;if(failure)throw failure;enqueue();await pending;if(failure)throw failure;},failed:()=>failure!==null,
      stop:async()=>{clearTimer(timer);await pending.catch(error=>{failure=error;});}};
  }

  private emptySteps(conTxt: boolean): AplicarBDIssspeaQNAResult['ejecuciones'] {
    return { obtenerQuincena: { exito: false, duracionMs: 0 },
      ...(conTxt ? { aplicarDn: { exito: false, duracionMs: 0 } } : {
        aplicarC: { exito: false, duracionMs: 0 }, aplicarF: { exito: false, duracionMs: 0 },
      }), ebi2Recibos: { exito: false, duracionMs: 0 },
      lineaPago: { exito: false, duracionMs: 0 }, envioLayout: { exito: true, duracionMs: 0, error: 'OMITIDO' },
      actualizarBitacora: { exito: false, duracionMs: 0 }, guardarLogFtp: { exito: false, duracionMs: 0 } };
  }

  private result(
    data: AplicarBDIssspeaQNAData, decision: QnaApplicationSnapshot, ejecuciones: AplicarBDIssspeaQNAResult['ejecuciones'], startedAt: number,
    values: Partial<AplicarBDIssspeaQNAResult>
  ): AplicarBDIssspeaQNAResult {
    return { exito: true, quincena: decision.periodo, quincenaNumero: decision.scope.quincena, anio: decision.scope.anio,
      ejecuciones, bitacoraActualizada: false, logFtpPath: null, idPeriodoFirebird: null, baMovimiento: { generados: 0 },
      firebirdTransaction: 'NO_INICIADA', pasoFallido: null, lineaPago: null, mensaje: '', tiempoTotalMs: Date.now() - startedAt,
      liquidacionSnapshotId: data.liquidacionSnapshotId, estadoProceso: decision.estadoProceso, idempotente: decision.idempotente,
      requiereResolucionManual: false,intentoUuid:decision.intentoUuid,afectacionId:decision.afectacionId,...values };
  }

  private message(error: unknown): string { return String((error as any)?.message ?? error ?? 'ERROR_DESCONOCIDO').slice(0, 400); }
}
