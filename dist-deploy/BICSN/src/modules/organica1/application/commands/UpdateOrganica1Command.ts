import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1, UpdateOrganica1Data } from '../../domain/entities/Organica1.js';
import {
  Organica1NotFoundError,
  Organica1InvalidClaveOrganica0Error,
  Organica1InvalidClaveOrganica1Error,
  Organica1InvalidDescripcionError,
  Organica1InvalidTitularError,
  Organica1InvalidRfcError,
  Organica1InvalidImssError,
  Organica1InvalidInfonavitError,
  Organica1InvalidEstatusError,
  Organica1InvalidFechaError
} from '../../domain/errors.js';

export class UpdateOrganica1Command {
  constructor(private organica1Repo: IOrganica1Repository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, data: UpdateOrganica1Data, userId?: string): Promise<Organica1> {
    console.log('ORGANICA1_COMMAND', {
      operation: 'UPDATE_ORGANICA1',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      claveOrganica0,
      claveOrganica1,
      data
    });

    // Validar claves
    this.validateClaveOrganica0(claveOrganica0);
    this.validateClaveOrganica1(claveOrganica1);

    // Validar campos a actualizar si están presentes
    if (data.descripcion !== undefined) {
      this.validateDescripcion(data.descripcion);
    }

    if (data.titular !== undefined) {
      this.validateTitular(data.titular);
    }

    if (data.rfc !== undefined) {
      this.validateRfc(data.rfc);
    }

    if (data.imss !== undefined) {
      this.validateImss(data.imss);
    }

    if (data.infonavit !== undefined) {
      this.validateInfonavit(data.infonavit);
    }

    if (data.estatus !== undefined) {
      this.validateEstatus(data.estatus);
    }

    if (data.fechaFin1 !== undefined) {
      this.validateFechaFin(data.fechaFin1);
    }

    try {
      // Verificar que la entidad existe
      const existing = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);
      if (!existing) {
        console.warn('ORGANICA1_COMMAND_WARNING', {
          operation: 'UPDATE_ORGANICA1',
          userId: userId || 'SYSTEM',
          claveOrganica0,
          claveOrganica1,
          reason: 'ORGANICA1_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
        throw new Organica1NotFoundError(claveOrganica0, claveOrganica1);
      }

      // Actualizar la entidad
      const result = await this.organica1Repo.update(claveOrganica0, claveOrganica1, data);

      console.log('ORGANICA1_COMMAND_SUCCESS', {
        operation: 'UPDATE_ORGANICA1',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        updatedFields: Object.keys(data),
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA1_COMMAND_ERROR', {
        operation: 'UPDATE_ORGANICA1',
        userId: userId || 'SYSTEM',
        claveOrganica0,
        claveOrganica1,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica1InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica1InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica1InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica1InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private validateDescripcion(descripcion: string): void {
    if (typeof descripcion !== 'string') {
      throw new Organica1InvalidDescripcionError('La descripción debe ser una cadena de texto');
    }

    const trimmed = descripcion.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidDescripcionError('La descripción no puede estar vacía');
    }

    if (trimmed.length > 500) {
      throw new Organica1InvalidDescripcionError('La descripción no puede tener más de 500 caracteres');
    }

    // Validar que no contenga caracteres de control o problemáticos
    if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
      throw new Organica1InvalidDescripcionError('La descripción contiene caracteres no válidos');
    }
  }

  private validateTitular(titular: number): void {
    if (typeof titular !== 'number' || !Number.isInteger(titular)) {
      throw new Organica1InvalidTitularError('El titular debe ser un número entero');
    }

    if (titular <= 0) {
      throw new Organica1InvalidTitularError('El titular debe ser un número positivo');
    }

    if (titular > 999999999) {
      throw new Organica1InvalidTitularError('El titular no puede tener más de 9 dígitos');
    }
  }

  private validateRfc(rfc: string): void {
    if (typeof rfc !== 'string') {
      throw new Organica1InvalidRfcError('El RFC debe ser una cadena de texto');
    }

    const trimmed = rfc.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidRfcError('El RFC no puede estar vacío');
    }

    if (trimmed.length > 13) {
      throw new Organica1InvalidRfcError('El RFC no puede tener más de 13 caracteres');
    }

    // Validar formato básico de RFC
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(trimmed.toUpperCase())) {
      throw new Organica1InvalidRfcError('El formato del RFC no es válido');
    }
  }

  private validateImss(imss: string): void {
    if (typeof imss !== 'string') {
      throw new Organica1InvalidImssError('El IMSS debe ser una cadena de texto');
    }

    const trimmed = imss.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidImssError('El IMSS no puede estar vacío');
    }

    if (trimmed.length > 20) {
      throw new Organica1InvalidImssError('El IMSS no puede tener más de 20 caracteres');
    }

    // Validar que contenga solo números
    if (!/^\d+$/.test(trimmed)) {
      throw new Organica1InvalidImssError('El IMSS debe contener solo números');
    }
  }

  private validateInfonavit(infonavit: string): void {
    if (typeof infonavit !== 'string') {
      throw new Organica1InvalidInfonavitError('El INFONAVIT debe ser una cadena de texto');
    }

    const trimmed = infonavit.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidInfonavitError('El INFONAVIT no puede estar vacío');
    }

    if (trimmed.length > 20) {
      throw new Organica1InvalidInfonavitError('El INFONAVIT no puede tener más de 20 caracteres');
    }

    // Validar que contenga solo números
    if (!/^\d+$/.test(trimmed)) {
      throw new Organica1InvalidInfonavitError('El INFONAVIT debe contener solo números');
    }
  }

  private validateEstatus(estatus: string): void {
    if (typeof estatus !== 'string') {
      throw new Organica1InvalidEstatusError('El estatus debe ser una cadena de texto');
    }

    const trimmed = estatus.trim();
    if (trimmed.length === 0) {
      throw new Organica1InvalidEstatusError('El estatus no puede estar vacío');
    }

    // Valores permitidos para estatus
    const valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
    if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
      throw new Organica1InvalidEstatusError(`El estatus debe ser uno de: ${valoresPermitidos.join(', ')}`);
    }
  }

  private validateFechaFin(fechaFin: Date | undefined): void {
    if (fechaFin === null) {
      // Permitir null para quitar la fecha fin
      return;
    }

    if (fechaFin && (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime()))) {
      throw new Organica1InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    if (fechaFin) {
      const now = new Date();
      if (fechaFin < now) {
        throw new Organica1InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
      }
    }
  }
}
