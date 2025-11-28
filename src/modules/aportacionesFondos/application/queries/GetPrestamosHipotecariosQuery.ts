import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { PrestamosHipotecariosResponse } from '../../domain/entities/PrestamoHipotecario.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';

export class GetPrestamosHipotecariosQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    computadoraAntigua: boolean = false,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string
  ): Promise<PrestamosHipotecariosResponse> {
    const startTime = Date.now();
    const procedimiento = computadoraAntigua ? 'AP_S_COMP_QNA' : 'AP_S_HIP_QNA';
    const logContext = {
      userId: userId || 'desconocido',
      userClave0,
      userClave1,
      isEntidad,
      computadoraAntigua,
      procedimiento,
      claveOrganica0,
      claveOrganica1,
      tipo: 'PRESTAMOS_HIPOTECARIOS'
    };

    console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Iniciando consulta', logContext);

    try {
      // Validar parámetros de entrada
      this.validarParametrosEntrada(userClave0, userClave1, computadoraAntigua, claveOrganica0, claveOrganica1);

      // Validar acceso según el rol del usuario
      console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Validando acceso a claves orgánicas', logContext);
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );
      console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Acceso validado', { ...logContext, clavesValidadas: claves });

      // Obtener período de aplicación desde BitacoraAfectacionOrg
      console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Obteniendo período de aplicación', { ...logContext, org0: claves.clave0, org1: claves.clave1 });
      const periodo = await this.aportacionFondoRepo.obtenerPeriodoAplicacion(
        claves.clave0,
        claves.clave1
      );
      console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Período obtenido', { ...logContext, periodo });

      // Obtener préstamos hipotecarios ejecutando procedimiento AP_S_HIP_QNA o AP_S_COMP_QNA
      console.log(`[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Ejecutando procedimiento ${procedimiento}`, { ...logContext, periodo });
      const prestamos = await this.aportacionFondoRepo.obtenerPrestamosHipotecarios(
        claves.clave0,
        claves.clave1,
        periodo,
        computadoraAntigua
      );

      const duration = Date.now() - startTime;
      console.log('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Consulta completada exitosamente', {
        ...logContext,
        periodo,
        totalPrestamos: prestamos.length,
        duracionMs: duration
      });

      return {
        clave_organica_0: claves.clave0,
        clave_organica_1: claves.clave1,
        periodo,
        computadora_antigua: computadoraAntigua,
        prestamos
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [PRESTAMOS_HIPOTECARIOS] Error en consulta', {
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
        `Error al consultar préstamos hipotecarios: ${error.message || 'Error desconocido'}`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  private validarParametrosEntrada(
    userClave0: string,
    userClave1: string,
    computadoraAntigua: boolean,
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

    // Validar que computadoraAntigua sea un booleano
    if (typeof computadoraAntigua !== 'boolean') {
      throw new AportacionFondoDomainError(
        `Parámetro computadoraAntigua debe ser un valor booleano, recibido: ${typeof computadoraAntigua}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }
  }
}

