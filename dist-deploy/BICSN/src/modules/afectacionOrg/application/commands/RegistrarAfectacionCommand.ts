import { IAfectacionRepository } from '../../domain/repositories/IAfectacionRepository.js';
import { RegistrarAfectacionData, RegistrarAfectacionResult } from '../../domain/entities/RegistrarAfectacion.js';
import {
  InvalidQuincenaError,
  InvalidAnioError,
  InvalidOrgNivelError,
  InvalidAfectacionDataError,
  AfectacionRegistrationError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'registrarAfectacionCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class RegistrarAfectacionCommand {
  constructor(private afectacionRepo: IAfectacionRepository) {}

  async execute(data: RegistrarAfectacionData): Promise<RegistrarAfectacionResult> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'registrarAfectacion',
      entidad: data.entidad,
      anio: data.anio,
      quincena: data.quincena,
      orgNivel: data.orgNivel,
      org0: data.org0,
      usuario: data.usuario,
      appName: data.appName,
      ip: data.ip
    };

    logger.info(logContext, 'Iniciando registro de afectación');

    try {
      const result = await this.afectacionRepo.registrar(data);

      logger.info({
        ...logContext,
        afectacionId: result.afectacionId,
        success: result.success
      }, 'Afectación registrada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof InvalidAfectacionDataError ||
          error instanceof InvalidQuincenaError ||
          error instanceof InvalidAnioError ||
          error instanceof InvalidOrgNivelError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al registrar afectación');

      throw new AfectacionRegistrationError('Error interno al registrar afectación', {
        originalError: error.message,
        entidad: data.entidad,
        anio: data.anio,
        quincena: data.quincena
      });
    }
  }

  private validateInput(data: RegistrarAfectacionData): void {
    // Validar quincena
    if (data.quincena < 1 || data.quincena > 24) {
      throw new InvalidQuincenaError(data.quincena);
    }

    // Validar año
    if (data.anio < 2000 || data.anio > 2100) {
      throw new InvalidAnioError(data.anio);
    }

    // Validar nivel organizacional
    if (data.orgNivel < 0 || data.orgNivel > 3) {
      throw new InvalidOrgNivelError(data.orgNivel);
    }

    // Validar campos requeridos
    if (!data.entidad?.trim()) {
      throw new InvalidAfectacionDataError('entidad', 'La entidad es requerida');
    }

    if (!data.org0?.trim()) {
      throw new InvalidAfectacionDataError('org0', 'El código org0 es requerido');
    }

    if (!data.accion?.trim()) {
      throw new InvalidAfectacionDataError('accion', 'La acción es requerida');
    }

    if (!data.resultado?.trim()) {
      throw new InvalidAfectacionDataError('resultado', 'El resultado es requerido');
    }

    if (!data.usuario?.trim()) {
      throw new InvalidAfectacionDataError('usuario', 'El usuario es requerido');
    }

    if (!data.appName?.trim()) {
      throw new InvalidAfectacionDataError('appName', 'El nombre de la aplicación es requerido');
    }

    if (!data.ip?.trim()) {
      throw new InvalidAfectacionDataError('ip', 'La dirección IP es requerida');
    }

    // Validar códigos organizacionales según el nivel
    if (data.orgNivel >= 1 && !data.org1?.trim()) {
      throw new InvalidAfectacionDataError('org1', 'El código org1 es requerido para nivel >= 1');
    }

    if (data.orgNivel >= 2 && !data.org2?.trim()) {
      throw new InvalidAfectacionDataError('org2', 'El código org2 es requerido para nivel >= 2');
    }

    if (data.orgNivel >= 3 && !data.org3?.trim()) {
      throw new InvalidAfectacionDataError('org3', 'El código org3 es requerido para nivel >= 3');
    }
  }
}
