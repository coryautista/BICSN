import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2, CreateOrganica2Data } from '../../domain/entities/Organica2.js';
import {
  Organica2AlreadyExistsError,
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error,
  Organica2InvalidClaveOrganica2Error,
  Organica2InvalidDescripcionError,
  Organica2InvalidTitularError,
  Organica2InvalidEstatusError,
  Organica2InvalidFechaError
} from '../../domain/errors.js';

export class CreateOrganica2Command {
  constructor(private organica2Repo: IOrganica2Repository) {}

  async execute(data: CreateOrganica2Data, userId?: string): Promise<Organica2> {
    console.log('ORGANICA2_COMMAND', {
      operation: 'CREATE_ORGANICA2',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      data: {
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        descripcion: data.descripcion,
        titular: data.titular,
        fechaFin2: data.fechaFin2,
        usuario: data.usuario,
        estatus: data.estatus
      }
    });

    // Validar claves
    this.validateClaveOrganica0(data.claveOrganica0);
    this.validateClaveOrganica1(data.claveOrganica1);
    this.validateClaveOrganica2(data.claveOrganica2);

    // Validar campos opcionales si están presentes
    if (data.descripcion !== undefined) {
      this.validateDescripcion(data.descripcion);
    }

    if (data.titular !== undefined) {
      this.validateTitular(data.titular);
    }

    // Validar estatus
    this.validateEstatus(data.estatus);

    // Validar fechas si están presentes
    if (data.fechaFin2) {
      this.validateFechaFin(data.fechaFin2);
    }

    try {
      // Verificar que la clave organica1 padre existe
      // Nota: Aquí necesitaríamos inyectar el repositorio de organica1 o hacer una verificación
      // Por ahora, asumiremos que existe o implementaremos esta validación más tarde

      // Verificar si ya existe una entidad con la misma clave compuesta
      const existing = await this.organica2Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
      if (existing) {
        console.warn('ORGANICA2_COMMAND_WARNING', {
          operation: 'CREATE_ORGANICA2',
          userId: userId || 'SYSTEM',
          claveOrganica0: data.claveOrganica0,
          claveOrganica1: data.claveOrganica1,
          claveOrganica2: data.claveOrganica2,
          reason: 'CLAVE_TRIPLE_ALREADY_EXISTS',
          timestamp: new Date().toISOString()
        });
        throw new Organica2AlreadyExistsError(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
      }

      // Crear la entidad
      const organica2Data = {
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        descripcion: data.descripcion,
        titular: data.titular,
        fechaRegistro2: new Date(),
        fechaFin2: data.fechaFin2,
        usuario: data.usuario,
        estatus: data.estatus
      };

      const result = await this.organica2Repo.create(organica2Data);

      console.log('ORGANICA2_COMMAND_SUCCESS', {
        operation: 'CREATE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0: result.claveOrganica0,
        claveOrganica1: result.claveOrganica1,
        claveOrganica2: result.claveOrganica2,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA2_COMMAND_ERROR', {
        operation: 'CREATE_ORGANICA2',
        userId: userId || 'SYSTEM',
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
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

    // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
    const claveRegex = /^[A-Za-z0-9\-_\.]+$/;
    if (!claveRegex.test(trimmed)) {
      throw new Organica2InvalidClaveOrganica0Error('La clave organica0 solo puede contener letras, números, guiones, puntos y guiones bajos');
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

    // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
    const claveRegex = /^[A-Za-z0-9\-_\.]+$/;
    if (!claveRegex.test(trimmed)) {
      throw new Organica2InvalidClaveOrganica1Error('La clave organica1 solo puede contener letras, números, guiones, puntos y guiones bajos');
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

    // Solo permitir letras, números y algunos caracteres especiales comunes en claves organizacionales
    const claveRegex = /^[A-Za-z0-9\-_\.]+$/;
    if (!claveRegex.test(trimmed)) {
      throw new Organica2InvalidClaveOrganica2Error('La clave organica2 solo puede contener letras, números, guiones, puntos y guiones bajos');
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
    if (!estatus || typeof estatus !== 'string') {
      throw new Organica2InvalidEstatusError('El estatus es requerido y debe ser una cadena de texto');
    }

    const trimmed = estatus.trim();
    if (trimmed.length === 0) {
      throw new Organica2InvalidEstatusError('El estatus no puede estar vacío');
    }

    // Valores permitidos para estatus (ajustar según necesidades del negocio)
    const valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
    if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
      throw new Organica2InvalidEstatusError(`El estatus debe ser uno de: ${valoresPermitidos.join(', ')}`);
    }
  }

  private validateFechaFin(fechaFin: Date): void {
    if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
      throw new Organica2InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    const now = new Date();
    if (fechaFin < now) {
      throw new Organica2InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
    }
  }
}
