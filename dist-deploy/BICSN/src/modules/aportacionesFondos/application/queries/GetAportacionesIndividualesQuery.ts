import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionIndividual, TipoFondo } from '../../domain/entities/AportacionFondo.js';

export class GetAportacionesIndividualesQuery {
  constructor(private aportacionFondoRepo: IAportacionFondoRepository) {}

  async execute(
    tipo: TipoFondo,
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string,
    userId?: string
  ): Promise<AportacionIndividual> {
    console.log(`[APORTACIONES_FONDOS] Consultando aportaciones individuales - Tipo: ${tipo}, Usuario: ${userId || 'desconocido'}`);

    try {
      // Validar acceso según el rol del usuario
      const claves = this.aportacionFondoRepo.validarAccesoClavesOrganicas(
        userClave0,
        userClave1,
        isEntidad,
        claveOrganica0,
        claveOrganica1
      );

      const result = await this.aportacionFondoRepo.obtenerAportacionesIndividuales(
        tipo,
        claves.clave0,
        claves.clave1
      );

      console.log(`[APORTACIONES_FONDOS] Se encontraron ${result.datos.length} registros para tipo ${tipo}`);
      return result;
    } catch (error: any) {
      console.error('[APORTACIONES_FONDOS] Error al consultar aportaciones individuales:', error);
      throw error;
    }
  }
}