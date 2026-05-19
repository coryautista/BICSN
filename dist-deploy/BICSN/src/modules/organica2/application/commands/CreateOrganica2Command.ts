import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { CreateOrganica2 } from '../../organica2.schemas.js';
import { Organica2 } from '../../organica2.schemas.js';
import { Organica2AlreadyExistsError, Organica2InvalidClaveOrganica0Error, Organica2InvalidClaveOrganica1Error, Organica2InvalidClaveOrganica2Error, Organica2InvalidEstatusError } from '../../domain/errors.js';
import { env } from '../../../../config/env.js';

export class CreateOrganica2Command {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(data: CreateOrganica2, userId?: string): Promise<Organica2> {
    // Validate input parameters
    await this.validateInput(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
    
    // Validar estatus si está presente
    if (data.estatus !== undefined) {
      this.validateEstatus(data.estatus);
    }

    console.log(`[CREATE ORGANICA_2] Iniciando creación con datos:`, {
      claveOrganica0: data.claveOrganica0,
      claveOrganica1: data.claveOrganica1,
      claveOrganica2: data.claveOrganica2,
      usuarioId: userId || 'no proporcionado',
      firebirdUser: env.firebird.user
    });

    try {
      // Verificar si ya existe una entidad con la misma clave compuesta
      const existing = await this.organica2Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
      if (existing) {
        console.warn(`[CREATE ORGANICA_2] Intento de crear entidad duplicada:`, {
          claveOrganica0: data.claveOrganica0,
          claveOrganica1: data.claveOrganica1,
          claveOrganica2: data.claveOrganica2,
          timestamp: new Date().toISOString()
        });
        throw new Organica2AlreadyExistsError(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
      }

      // Crear la entidad - usuario se establece automáticamente como el usuario de BD
      const organica2Data = {
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        descripcion: data.descripcion,
        titular: data.titular,
        fechaRegistro2: new Date(),
        fechaFin2: data.fechaFin2,
        usuario: env.firebird.user, // Automáticamente establecido al usuario de BD desde ENV
        estatus: data.estatus
      };

      const result = await this.organica2Repo.create(organica2Data);

      console.log(`[CREATE ORGANICA_2] Entidad creada exitosamente:`, {
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        usuario: env.firebird.user,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error(`[CREATE ORGANICA_2] Error durante la creación:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-lanzar errores conocidos
      if (error instanceof Organica2AlreadyExistsError) {
        throw error;
      }

      // Para otros errores, lanzar un error genérico
      throw new Error(`Error al crear la entidad organica2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateInput(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<void> {
    // Validar claveOrganica0
    if (!claveOrganica0 || typeof claveOrganica0 !== 'string') {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }
    
    const trimmed0 = claveOrganica0.trim();
    if (trimmed0.length === 0) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }
    
    if (trimmed0.length > 2) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 2 caracteres');
    }

    // Validar claveOrganica1 (FIXED: Changed from 1 to 2 characters)
    if (!claveOrganica1 || typeof claveOrganica1 !== 'string') {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }
    
    const trimmed1 = claveOrganica1.trim();
    if (trimmed1.length === 0) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }
    
    if (trimmed1.length > 2) {  // FIXED: Now accepts 2 characters like database schema
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 2 caracteres');
    }

    // Validar claveOrganica2
    if (!claveOrganica2 || typeof claveOrganica2 !== 'string') {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
    }
    
    const trimmed2 = claveOrganica2.trim();
    if (trimmed2.length === 0) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
    }
    
    if (trimmed2.length > 2) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 2 caracteres');
    }
  }

  private validateEstatus(estatus: string): void {
    if (typeof estatus !== 'string') {
      throw new Organica2InvalidEstatusError('El estatus debe ser una cadena de texto');
    }

    const trimmed = estatus.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidEstatusError('El estatus no puede estar vacío');
    }

    // Valores permitidos para estatus (acepta tanto valores completos como abreviados de 1 carácter)
    const valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'A', 'I', 'S'];
    const valorUpper = trimmed.toUpperCase();
    if (!valoresPermitidos.includes(valorUpper)) {
      throw new Organica2InvalidEstatusError(`El estatus debe ser uno de: ACTIVO, INACTIVO, SUSPENDIDO (o sus abreviaciones A, I, S)`);
    }
  }
}
