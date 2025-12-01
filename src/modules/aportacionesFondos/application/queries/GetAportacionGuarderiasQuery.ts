import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionGuarderiasResponse } from '../../domain/entities/AportacionGuarderia.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';

export class GetAportacionGuarderiasQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string
  ): Promise<AportacionGuarderiasResponse> {
    const startTime = Date.now();
    const logContext = {
      userId: userId || 'desconocido',
      userClave0,
      userClave1,
      isEntidad,
      claveOrganica0,
      claveOrganica1,
      tipo: 'APORTACION_GUARDERIAS'
    };

    console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Iniciando consulta', logContext);

    try {
      // Validar parámetros de entrada
      this.validarParametrosEntrada(userClave0, userClave1, claveOrganica0, claveOrganica1);

      // Validar acceso según el rol del usuario
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Validando acceso a claves orgánicas', logContext);
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Acceso validado', { ...logContext, clavesValidadas: claves });

      // Obtener quincena y año desde BitacoraAfectacionOrg
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Obteniendo quincena y año', { ...logContext, org0: claves.clave0, org1: claves.clave1 });
      const { quincena, anio } = await this.aportacionFondoRepo.obtenerQuincenaYAnio(
        claves.clave0,
        claves.clave1
      );
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Quincena y año obtenidos', { ...logContext, quincena, anio });

      // Calcular período: quincena con padding de 2 dígitos + dos últimos dígitos del año
      const quincenaStr = String(quincena).padStart(2, '0');
      const anioStr = String(anio).slice(-2);
      const periodo = quincenaStr + anioStr;
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Período calculado', { ...logContext, periodo, quincena, anio });

      // Obtener aportaciones ejecutando función EBI2_RECIBOS_IMPRIMIR
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Ejecutando función EBI2_RECIBOS_IMPRIMIR', { ...logContext, periodo });
      const aportaciones = await this.aportacionFondoRepo.obtenerAportacionGuarderias(
        claves.clave0,
        claves.clave1,
        periodo
      );

      const duration = Date.now() - startTime;
      console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Consulta completada exitosamente', {
        ...logContext,
        periodo,
        totalAportaciones: aportaciones.length,
        duracionMs: duration
      });

      return {
        clave_organica_0: claves.clave0,
        clave_organica_1: claves.clave1,
        periodo,
        aportaciones
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Error en consulta', {
        ...logContext,
        error: error.message || String(error),
        errorCode: error.code,
        stack: error.stack,
        duracionMs: duration
      });

      // Si ya es un error del dominio, re-lanzarlo
      if (error instanceof AportacionFondoDomainError) {
        throw error;
      }

      // Envolver errores desconocidos
      throw new AportacionFondoDomainError(
        `Error al consultar aportación guarderías: ${error.message || 'Error desconocido'}`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  private validarParametrosEntrada(
    userClave0: string,
    userClave1: string,
    claveOrganica0?: string,
    claveOrganica1?: string
  ): void {
    // Validar claves orgánicas del usuario
    if (!userClave0 || userClave0.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 0 del usuario es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!userClave1 || userClave1.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 1 del usuario es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (userClave0.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 0 del usuario inválida: "${userClave0}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (userClave1.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 1 del usuario inválida: "${userClave1}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    // Validar claves orgánicas opcionales si se proporcionan
    if (claveOrganica0 !== undefined && claveOrganica0 !== null) {
      if (claveOrganica0.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 0 no puede estar vacía si se proporciona',
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }
      if (claveOrganica0.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 0 inválida: "${claveOrganica0}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }
    }

    if (claveOrganica1 !== undefined && claveOrganica1 !== null) {
      if (claveOrganica1.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 1 no puede estar vacía si se proporciona',
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }
      if (claveOrganica1.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 1 inválida: "${claveOrganica1}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }
    }
  }
}

