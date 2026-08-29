import { AfectacionOrgService } from '../../../afectacionOrg/infrastructure/services/AfectacionOrgService.js';
import { NominaAplicacionQnalUploadInput, NominaAplicacionQnalUploadResult } from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';
import { parseNominaAplicacionQnalTxt } from '../NominaAplicacionQnalTxtParser.js';
import { createHash, randomUUID } from 'node:crypto';
import { NominaLayout20FirebirdSyncService } from '../../infrastructure/firebird/NominaLayout20FirebirdSyncService.js';
import { NominaTxtSyncError } from '../../domain/errors.js';

export class CargarNominaAplicacionQnalTxtCommand {
  constructor(
    private nominaAplicacionQnalTxtRepo: INominaAplicacionQnalTxtRepository,
    private afectacionOrgService: AfectacionOrgService,
    private nominaLayout20FirebirdSyncService: NominaLayout20FirebirdSyncService
  ) {}

  async execute(input: NominaAplicacionQnalUploadInput): Promise<NominaAplicacionQnalUploadResult> {
    const parseResult = parseNominaAplicacionQnalTxt(input.archivoContenido);
    const rfcLines = new Map<string, number>();
    for (const registro of parseResult.registros) {
      const rfc = registro.rfc.trim().toUpperCase();
      const previousLine = rfcLines.get(rfc);
      if (previousLine !== undefined) {
        parseResult.errores.push({
          numeroLinea: registro.numeroLinea,
          campo: 'rfc',
          mensaje: `RFC duplicado en las líneas ${previousLine} y ${registro.numeroLinea}.`
        });
      } else {
        rfcLines.set(rfc, registro.numeroLinea);
      }
    }

    if (parseResult.errores.length > 0) {
      return this.nominaAplicacionQnalTxtRepo.registrarCargaRechazada(input, parseResult.errores, parseResult.registros.length);
    }

    const quincenaActual = await this.afectacionOrgService.getQuincenaFromFirebird(
      input.organica0,
      input.organica1,
      input.organica2,
      input.organica3
    );

    if (quincenaActual.anio !== input.anio || quincenaActual.quincena !== input.quincena) {
      parseResult.errores.push({
        numeroLinea: 0,
        campo: 'anio/quincena',
        mensaje: `La carga corresponde a ${input.anio}/${input.quincena}, pero la quincena vigente es ${quincenaActual.anio}/${quincenaActual.quincena}.`
      });
      return this.nominaAplicacionQnalTxtRepo.registrarCargaRechazada(input, parseResult.errores, parseResult.registros.length);
    }

    if (!input.usuarioId?.trim()) throw new NominaTxtSyncError('NOMINA_TXT_USUARIO_REQUERIDO', 500);

    const intentoUuid = randomUUID();
    const archivoHash = createHash('sha256').update(input.archivoContenido).digest('hex').toUpperCase();
    const prepared = await this.nominaAplicacionQnalTxtRepo.prepararSincronizacion(input, parseResult.registros, archivoHash, intentoUuid);
    if (prepared.alreadyTerminated) return prepared.alreadyTerminated;

    const claimToken = randomUUID();
    await this.nominaAplicacionQnalTxtRepo.iniciarSincronizacion(prepared.sincronizacionId, prepared.intentoUuid, claimToken);
    let execution;
    try {
      execution = await this.nominaLayout20FirebirdSyncService.sincronizar({ scope: input, registros: parseResult.registros });
    } catch (error) {
      await this.nominaAplicacionQnalTxtRepo.registrarResultadoFirebird(prepared.sincronizacionId, prepared.intentoUuid, claimToken, 'NO_INICIADA', undefined, error);
      throw error;
    }
    await this.nominaAplicacionQnalTxtRepo.registrarResultadoFirebird(prepared.sincronizacionId, prepared.intentoUuid, claimToken, execution.outcome, execution.value, execution.error);
    if (execution.outcome !== 'COMMIT_CONFIRMADO') {
      const uncertain = execution.outcome === 'RESULTADO_INCIERTO';
      throw new NominaTxtSyncError(uncertain ? 'NOMINA_FIREBIRD_RESULTADO_INCIERTO' : 'NOMINA_FIREBIRD_NO_APLICADA', uncertain ? 500 : 503);
    }
    return this.nominaAplicacionQnalTxtRepo.finalizarSincronizacion(prepared.sincronizacionId, prepared.intentoUuid);
  }
}
