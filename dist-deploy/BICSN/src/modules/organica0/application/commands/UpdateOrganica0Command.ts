import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0, UpdateOrganica0Data } from '../../domain/entities/Organica0.js';
import {
  Organica0NotFoundError,
  Organica0InvalidNombreError,
  Organica0InvalidEstatusError,
  Organica0InvalidFechaError
} from '../../domain/errors.js';

export class UpdateOrganica0Command {
  constructor(private organica0Repo: IOrganica0Repository) {}

  async execute(claveOrganica: string, data: UpdateOrganica0Data, userId?: string): Promise<Organica0> {
    console.log('ORGANICA0_COMMAND', {
      operation: 'UPDATE_ORGANICA0',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica,
      data
    });

    // Validar clave organica0
    this.validateClaveOrganica(claveOrganica);

    // Validar campos a actualizar si están presentes
    if (data.nombreOrganica !== undefined) {
      this.validateNombreOrganica(data.nombreOrganica);
    }

    if (data.estatus !== undefined) {
      this.validateEstatus(data.estatus);
    }

    if (data.fechaFin !== undefined) {
      this.validateFechaFin(data.fechaFin);
    }

    try {
      // Verificar que la entidad existe
      const existing = await this.organica0Repo.findById(claveOrganica);
      if (!existing) {
        console.warn('ORGANICA0_COMMAND_WARNING', {
          operation: 'UPDATE_ORGANICA0',
          userId: userId || 'SYSTEM',
          claveOrganica,
          reason: 'ORGANICA0_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica0NotFoundError(claveOrganica);
      }

      // Actualizar la entidad
      const result = await this.organica0Repo.update(claveOrganica, data);

      console.log('ORGANICA0_COMMAND_SUCCESS', {
        operation: 'UPDATE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica,
        updatedFields: Object.keys(data),
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA0_COMMAND_ERROR', {
        operation: 'UPDATE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica0InvalidClaveError('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica0InvalidClaveError('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica0InvalidClaveError('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateNombreOrganica(nombre: string): void {
    if (typeof nombre !== 'string') {
      throw new Organica0InvalidNombreError('El nombre organica0 debe ser una cadena de texto');
    }

    const trimmed = nombre.trim();
    if (trimmed.length === 0) {
      throw new Organica0InvalidNombreError('El nombre organica0 no puede estar vacío');
    }

    if (trimmed.length > 200) {
      throw new Organica0InvalidNombreError('El nombre organica0 no puede tener más de 200 caracteres');
    }

    // Validar que no contenga caracteres de control o problemáticos
    if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
      throw new Organica0InvalidNombreError('El nombre organica0 contiene caracteres no válidos');
    }
  }

  private validateEstatus(estatus: string): void {
    if (typeof estatus !== 'string') {
      throw new Organica0InvalidEstatusError('El estatus debe ser una cadena de texto');
    }

    const trimmed = estatus.trim();
    if (trimmed.length === 0) {
      throw new Organica0InvalidEstatusError('El estatus no puede estar vacío');
    }

    // Valores permitidos para estatus (ajustar según necesidades del negocio)
    const valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
    if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
      throw new Organica0InvalidEstatusError(`El estatus debe ser uno de: ${valoresPermitidos.join(', ')}`);
    }
  }

  private validateFechaFin(fechaFin: Date | undefined): void {
    if (fechaFin === null) {
      // Permitir null para quitar la fecha fin
      return;
    }

    if (fechaFin && (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime()))) {
      throw new Organica0InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    if (fechaFin) {
      const now = new Date();
      if (fechaFin < now) {
        throw new Organica0InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
      }
    }
  }
}

// Importar el error que falta
import { Organica0InvalidClaveError } from '../../domain/errors.js';
