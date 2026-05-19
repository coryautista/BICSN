import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0, CreateOrganica0Data } from '../../domain/entities/Organica0.js';
import {
  Organica0AlreadyExistsError,
  Organica0InvalidClaveError,
  Organica0InvalidNombreError,
  Organica0InvalidEstatusError,
  Organica0InvalidFechaError
} from '../../domain/errors.js';

export class CreateOrganica0Command {
  constructor(private organica0Repo: IOrganica0Repository) {}

  async execute(data: CreateOrganica0Data, userId?: string): Promise<Organica0> {
    console.log('ORGANICA0_COMMAND', {
      operation: 'CREATE_ORGANICA0',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      data: {
        claveOrganica: data.claveOrganica,
        nombreOrganica: data.nombreOrganica,
        usuario: data.usuario,
        fechaFin: data.fechaFin,
        estatus: data.estatus
      }
    });

    // Validar clave organica0
    this.validateClaveOrganica(data.claveOrganica);

    // Validar nombre organica0
    this.validateNombreOrganica(data.nombreOrganica);

    // Validar estatus
    this.validateEstatus(data.estatus);

    // Validar fechas si están presentes
    if (data.fechaFin) {
      this.validateFechaFin(data.fechaFin);
    }

    try {
      // Verificar si ya existe una entidad con la misma clave
      const existing = await this.organica0Repo.findById(data.claveOrganica);
      if (existing) {
        console.warn('ORGANICA0_COMMAND_WARNING', {
          operation: 'CREATE_ORGANICA0',
          userId: userId || 'SYSTEM',
          claveOrganica: data.claveOrganica,
          reason: 'CLAVE_ALREADY_EXISTS',
          timestamp: new Date().toISOString()
        });
        throw new Organica0AlreadyExistsError(data.claveOrganica);
      }

      // Crear la entidad
      const organica0Data = {
        claveOrganica: data.claveOrganica,
        nombreOrganica: data.nombreOrganica,
        usuario: data.usuario,
        fechaRegistro: new Date(),
        fechaFin: data.fechaFin,
        estatus: data.estatus
      };

      const result = await this.organica0Repo.create(organica0Data);

      console.log('ORGANICA0_COMMAND_SUCCESS', {
        operation: 'CREATE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica: result.claveOrganica,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA0_COMMAND_ERROR', {
        operation: 'CREATE_ORGANICA0',
        userId: userId || 'SYSTEM',
        claveOrganica: data.claveOrganica,
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

    // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
    const claveRegex = /^[A-Za-z0-9\-_\.]+$/;
    if (!claveRegex.test(trimmed)) {
      throw new Organica0InvalidClaveError('La clave organica0 solo puede contener letras, números, guiones, puntos y guiones bajos');
    }
  }

  private validateNombreOrganica(nombre: string): void {
    if (!nombre || typeof nombre !== 'string') {
      throw new Organica0InvalidNombreError('El nombre organica0 es requerido y debe ser una cadena de texto');
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
    if (!estatus || typeof estatus !== 'string') {
      throw new Organica0InvalidEstatusError('El estatus es requerido y debe ser una cadena de texto');
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

  private validateFechaFin(fechaFin: Date): void {
    if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
      throw new Organica0InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    const now = new Date();
    if (fechaFin < now) {
      throw new Organica0InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
    }
  }
}
