import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionCompleta } from '../../domain/entities/AportacionFondo.js';

export class GetAportacionesCompletasQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string
  ): Promise<AportacionCompleta> {
    console.log(`[APORTACIONES_FONDOS] Consultando aportaciones completas, Usuario: ${userId || 'desconocido'}`);

    try {
      // Validar acceso según el rol del usuario
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );

      const result = await this.aportacionFondoRepo.obtenerAportacionesCompletas(
        claves.clave0,
        claves.clave1
      );

      console.log(`[APORTACIONES_FONDOS] Se encontraron aportaciones completas para ${claves.clave0}-${claves.clave1}`);
      console.log(`[APORTACIONES_FONDOS] Fondos incluidos: ${result.resumen_general.fondos_incluidos.join(', ')}`);
      return result;
    } catch (error: any) {
      console.error('[APORTACIONES_FONDOS] Error al consultar aportaciones completas:', error);
      throw error;
    }
  }
}