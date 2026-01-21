import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal } from '../../domain/entities/OrgPersonal.js';
import { OrgPersonalSearchNotFoundError } from '../../domain/errors.js';

export class GetOrgPersonalByNombreApellidosFechaNacQuery {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(
    nombre: string,
    apellidoPaterno: string,
    apellidoMaterno: string | null,
    fechaNacimiento: string,
    userId?: string
  ): Promise<OrgPersonal> {
    // Logging de la operación
    console.log(
      `[ORG_PERSONAL] Buscando registro orgPersonal por nombre: '${nombre}', apellido paterno: '${apellidoPaterno}', apellido materno: '${apellidoMaterno || 'N/A'}', fecha nacimiento: '${fechaNacimiento}', usuario: ${userId || 'desconocido'}`
    );

    // Validación de parámetros
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      console.warn(`[ORG_PERSONAL] Nombre inválido: '${nombre}'`);
      throw new OrgPersonalSearchNotFoundError('', 'NOMBRE');
    }

    if (!apellidoPaterno || typeof apellidoPaterno !== 'string' || apellidoPaterno.trim().length === 0) {
      console.warn(`[ORG_PERSONAL] Apellido paterno inválido: '${apellidoPaterno}'`);
      throw new OrgPersonalSearchNotFoundError('', 'NOMBRE');
    }

    if (!fechaNacimiento || typeof fechaNacimiento !== 'string' || fechaNacimiento.trim().length === 0) {
      console.warn(`[ORG_PERSONAL] Fecha de nacimiento inválida: '${fechaNacimiento}'`);
      throw new OrgPersonalSearchNotFoundError('', 'NOMBRE');
    }

    const nombreTrimmed = nombre.trim();
    const apellidoPaternoTrimmed = apellidoPaterno.trim();
    const apellidoMaternoTrimmed = apellidoMaterno ? apellidoMaterno.trim() : null;
    const fechaNacimientoTrimmed = fechaNacimiento.trim();

    try {
      const orgPersonal = await this.orgPersonalRepo.findByNombreApellidosFechaNac(
        nombreTrimmed,
        apellidoPaternoTrimmed,
        apellidoMaternoTrimmed,
        fechaNacimientoTrimmed
      );

      if (!orgPersonal) {
        console.warn(
          `[ORG_PERSONAL] No se encontró registro orgPersonal para nombre: '${nombreTrimmed}', apellido paterno: '${apellidoPaternoTrimmed}', apellido materno: '${apellidoMaternoTrimmed || 'N/A'}', fecha nacimiento: '${fechaNacimientoTrimmed}'`
        );
        throw new OrgPersonalSearchNotFoundError(
          `${nombreTrimmed} ${apellidoPaternoTrimmed} ${apellidoMaternoTrimmed || ''}`.trim(),
          'NOMBRE'
        );
      }

      console.log(`[ORG_PERSONAL] Registro orgPersonal encontrado por búsqueda: interno ${orgPersonal.interno}`);
      return orgPersonal;
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalSearchNotFoundError) {
        throw error;
      }

      console.error(
        `[ORG_PERSONAL] Error al buscar registro orgPersonal por nombre/apellidos/fecha:`,
        error
      );
      throw error;
    }
  }
}
