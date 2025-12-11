import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { PensionNominaTransitorioResponse } from '../../domain/entities/PensionNominaTransitorio.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';

export class GetPensionNominaTransitorioQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string
  ): Promise<PensionNominaTransitorioResponse> {
    const startTime = Date.now();
    const logContext = {
      userId: userId || 'desconocido',
      userClave0,
      userClave1,
      isEntidad,
      claveOrganica0,
      claveOrganica1,
      tipo: 'PENSION_NOMINA_TRANSITORIO'
    };

    console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Iniciando consulta', logContext);

    try {
      // Validar parámetros de entrada
      this.validarParametrosEntrada(userClave0, userClave1, claveOrganica0, claveOrganica1);

      // Validar acceso según el rol del usuario
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Validando acceso a claves orgánicas', logContext);
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Acceso validado', { ...logContext, clavesValidadas: claves });

      // Obtener quincena y año desde BitacoraAfectacionOrg usando org0 y org1 del token
      // Para pensionados, usamos las claves orgánicas del usuario para obtener el período
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Obteniendo quincena y año', { ...logContext, org0: userClave0, org1: userClave1 });
      const { quincena, anio, accion } = await this.aportacionFondoRepo.obtenerQuincenaYAnio(
        userClave0,
        userClave1
      );
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Quincena y año obtenidos', { ...logContext, quincena, anio, accion });

      // Calcular período: quincena con padding de 2 dígitos + dos últimos dígitos del año (SIN restar 1)
      const quincenaStr = String(quincena).padStart(2, '0');
      const anioStr = String(anio).slice(-2);
      const periodo = quincenaStr + anioStr;
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Período calculado', { ...logContext, periodo, quincena, anio, accion });

      // Para pensionados: org0='04' y org1='60' son hardcodeados, org2 y org3 vienen del token
      const org0Pension = '04';
      const org1Pension = '60';
      const org2Pension = userClave0;
      const org3Pension = userClave1;

      // Obtener registros ejecutando función PENSION_NOMINA_QNAL_TRANSITORIO
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Ejecutando función PENSION_NOMINA_QNAL_TRANSITORIO', { 
        ...logContext, 
        periodo,
        org0: org0Pension,
        org1: org1Pension,
        org2: org2Pension,
        org3: org3Pension
      });
      const registros = await this.aportacionFondoRepo.obtenerPensionNominaTransitorio(
        org0Pension,
        org1Pension,
        org2Pension,
        org3Pension,
        periodo
      );

      const duration = Date.now() - startTime;
      console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Consulta completada exitosamente', {
        ...logContext,
        periodo,
        accion,
        totalRegistros: registros.length,
        duracionMs: duration
      });

      // Retornar org2 y org3 del token (las claves orgánicas reales del usuario)
      return {
        clave_organica_0: userClave0,
        clave_organica_1: userClave1,
        periodo,
        accion,
        registros
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Error en consulta', {
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
        `Error al consultar pensión nómina transitorio: ${error.message || 'Error desconocido'}`,
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

