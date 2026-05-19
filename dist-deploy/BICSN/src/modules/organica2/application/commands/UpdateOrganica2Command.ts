import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2, UpdateOrganica2Data } from '../../domain/entities/Organica2.js';
import {
  Organica2NotFoundError,
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error,
  Organica2InvalidClaveOrganica2Error,
  Organica2InvalidDescripcionError,
  Organica2InvalidTitularError,
  Organica2InvalidEstatusError,
  Organica2InvalidFechaError
} from '../../domain/errors.js';

export class UpdateOrganica2Command {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2Data, userId?: string): Promise<Organica2> {
    console.log('ORGANICA2_COMMAND', {
      operation: 'UPDATE_ORGANICA2',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1,
      claveOrganica2,
      data
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);
    this.validateClaveOrganica2(claveOrganica2);

    // Validar campos a actualizar si están presentes
    if (data.descripcion !== undefined) {
      this.validateDescripcion(data.descripcion);
    }

    if (data.titular !== undefined) {
      this.validateTitular(data.titular);
    }

    if (data.estatus !== undefined) {
      this.validateEstatus(data.estatus);
    }

    if (data.fechaFin2 !== undefined) {
      this.validateFechaFin(data.fechaFin2);
    }

    try {
      // Verificar que la entidad existe
      const existing = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
      if (!existing) {
        console.warn('ORGANICA2_COMMAND_WARNING', {
          operation: 'UPDATE_ORGANICA2',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          claveOrganica2,
          reason: 'ORGANICA2_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica2NotFoundError(claveOrganica0, claveOrganica1, claveOrganica2);
      }

      // Actualizar la entidad
      const result = await this.organica2Repo.update(claveOrganica0, claveOrganica1, claveOrganica2, data);

      console.log('ORGANICA2_COMMAND_SUCCESS', {
        operation: 'UPDATE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        updatedFields: Object.keys(data),
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA2_COMMAND_ERROR', {
        operation: 'UPDATE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        claveOrganica2,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica2(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 50 caracteres');
    }
  }

  private validateDescripcion(descripcion: string): void {
    if (typeof descripcion !== 'string') {
      throw new Organica2InvalidDescripcionError('La descripción debe ser una cadena de texto');
    }

    const trimmed = descripcion.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidDescripcionError('La descripción no puede estar vacía');
    }

    if (trimmed.length > 500) {
      throw new Organica2InvalidDescripcionError('La descripción no puede tener más de 500 caracteres');
    }

    // Validar que no contenga caracteres de control o problemáticos
    if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
      throw new Organica2InvalidDescripcionError('La descripción contiene caracteres no válidos');
    }
  }

  private validateTitular(titular: number): void {
    if (typeof titular !== 'number' || !Number.isInteger(titular)) {
      throw new Organica2InvalidTitularError('El titular debe ser un número entero');
    }

    if (titular <= 0) {
      throw new Organica2InvalidTitularError('El titular debe ser un número positivo');
    }

    if (titular > 999999999) {
      throw new Organica2InvalidTitularError('El titular no puede tener más de 9 dígitos');
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

  private validateFechaFin(fechaFin: Date | undefined): void {
    if (fechaFin === null) {
      // Permitir null para quitar la fecha fin
      return;
    }

    if (fechaFin && (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime()))) {
      throw new Organica2InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    if (fechaFin) {
      const now = new Date();
      if (fechaFin < now) {
        throw new Organica2InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
      }
    }
  }
}
