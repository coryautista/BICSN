import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { AguinaldoResponse } from '../../domain/entities/Aguinaldo.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';

export class GetAguinaldoQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string,
    usarDiasLaboradosNomina = false
  ): Promise<AguinaldoResponse> {
    const startTime = Date.now();
    const logContext = {
      userId: userId || 'desconocido',
      userClave0,
      userClave1,
      isEntidad,
      claveOrganica0,
      claveOrganica1,
      tipo: 'AGUINALDO'
    };

    console.log('[APORTACIONES_FONDOS] [AGUINALDO] Iniciando consulta', logContext);

    try {
      // Validar parámetros de entrada
      this.validarParametrosEntrada(userClave0, userClave1, claveOrganica0, claveOrganica1);

      // Validar acceso según el rol del usuario
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Validando acceso a claves orgánicas', logContext);
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Acceso validado', { ...logContext, clavesValidadas: claves });

      // Normalizar claves orgánicas a 2 caracteres
      const org0Normalized = claves.clave0.padStart(2, '0').substring(0, 2);
      const org1Normalized = claves.clave1.padStart(2, '0').substring(0, 2);

      // Obtener período de aplicación desde BitacoraAfectacionOrg
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Obteniendo período de aplicación', {
        ...logContext,
        org0: org0Normalized,
        org1: org1Normalized
      });
      const { periodo, accion } = await this.aportacionFondoRepo.obtenerPeriodoAplicacion(
        org0Normalized,
        org1Normalized
      );
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Período obtenido', {
        ...logContext,
        periodo,
        accion
      });

      // Obtener aguinaldos ejecutando función AGUINALDO_ORGANICAS
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Ejecutando función AGUINALDO_ORGANICAS', {
        ...logContext,
        periodo
      });
      const aguinaldos = await this.aportacionFondoRepo.obtenerAguinaldo(
        org0Normalized,
        org1Normalized,
        periodo,
        usarDiasLaboradosNomina
      );

      const duration = Date.now() - startTime;
      console.log('[APORTACIONES_FONDOS] [AGUINALDO] Consulta completada exitosamente', {
        ...logContext,
        periodo,
        accion,
        totalAguinaldos: aguinaldos.length,
        duracionMs: duration
      });

      return {
        clave_organica_0: org0Normalized,
        clave_organica_1: org1Normalized,
        periodo,
        accion,
        aguinaldos
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [AGUINALDO] Error en consulta', {
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
        `Error al consultar aguinaldo: ${error.message || 'Error desconocido'}`,
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

    // Validar claves orgánicas opcionales solo si se proporcionan
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

