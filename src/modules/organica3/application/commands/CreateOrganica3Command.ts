import { IOrganica3Repository } from '../../domain/repositories/IOrganica3Repository.js';
import { Organica3, CreateOrganica3Data } from '../../domain/entities/Organica3.js';
import {
  Organica3AlreadyExistsError,
  Organica3InvalidClaveOrganica0Error,
  Organica3InvalidClaveOrganica1Error,
  Organica3InvalidClaveOrganica2Error,
  Organica3InvalidClaveOrganica3Error,
  Organica3InvalidDescripcionError,
  Organica3InvalidTitularError,
  Organica3InvalidCalleNumError,
  Organica3InvalidFraccionamientoError,
  Organica3InvalidCodigoPostalError,
  Organica3InvalidTelefonoError,
  Organica3InvalidFaxError,
  Organica3InvalidLocalidadError,
  Organica3InvalidMunicipioError,
  Organica3InvalidEstadoError,
  Organica3InvalidEstatusError,
  Organica3InvalidFechaError
} from '../../domain/errors.js';

export class CreateOrganica3Command {
  constructor(private organica3Repo: IOrganica3Repository) {}

  async execute(data: CreateOrganica3Data, userId?: string): Promise<Organica3> {
    console.log('ORGANICA3_COMMAND', {
      operation: 'CREATE_ORGANICA3',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString(),
      data
    });

    // Validar claves
    this.validateClaveOrganica0(data.claveOrganica0);
    this.validateClaveOrganica1(data.claveOrganica1);
    this.validateClaveOrganica2(data.claveOrganica2);
    this.validateClaveOrganica3(data.claveOrganica3);

    // Validar campos obligatorios y opcionales
    if (data.descripcion !== undefined) {
      this.validateDescripcion(data.descripcion);
    }

    if (data.titular !== undefined) {
      this.validateTitular(data.titular);
    }

    if (data.calleNum !== undefined) {
      this.validateCalleNum(data.calleNum);
    }

    if (data.fraccionamiento !== undefined) {
      this.validateFraccionamiento(data.fraccionamiento);
    }

    if (data.codigoPostal !== undefined) {
      this.validateCodigoPostal(data.codigoPostal);
    }

    if (data.telefono !== undefined) {
      this.validateTelefono(data.telefono);
    }

    if (data.fax !== undefined) {
      this.validateFax(data.fax);
    }

    if (data.localidad !== undefined) {
      this.validateLocalidad(data.localidad);
    }

    if (data.municipio !== undefined) {
      this.validateMunicipio(data.municipio);
    }

    if (data.estado !== undefined) {
      this.validateEstado(data.estado);
    }

    this.validateEstatus(data.estatus);

    if (data.fechaFin3 !== undefined) {
      this.validateFechaFin(data.fechaFin3);
    }

    try {
      // Verificar que no exista ya la entidad
      const existing = await this.organica3Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3);
      if (existing) {
        console.warn('ORGANICA3_COMMAND_WARNING', {
          operation: 'CREATE_ORGANICA3',
          userId: userId || 'SYSTEM',
          claveOrganica0: data.claveOrganica0,
          claveOrganica1: data.claveOrganica1,
          claveOrganica2: data.claveOrganica2,
          claveOrganica3: data.claveOrganica3,
          reason: 'ORGANICA3_ALREADY_EXISTS',
          timestamp: new Date().toISOString()
        });
        throw new Organica3AlreadyExistsError(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3);
      }

      // Verificar que exista la clave padre (organica2)
      await this.validateParentExists(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);

      // Crear la entidad
      const result = await this.organica3Repo.create(data);

      console.log('ORGANICA3_COMMAND_SUCCESS', {
        operation: 'CREATE_ORGANICA3',
        userId: userId || 'SYSTEM',
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        claveOrganica3: data.claveOrganica3,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('ORGANICA3_COMMAND_ERROR', {
        operation: 'CREATE_ORGANICA3',
        userId: userId || 'SYSTEM',
        claveOrganica0: data.claveOrganica0,
        claveOrganica1: data.claveOrganica1,
        claveOrganica2: data.claveOrganica2,
        claveOrganica3: data.claveOrganica3,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private validateClaveOrganica0(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica0Error('La clave organica0 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica1(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica1Error('La clave organica1 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica2(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica2Error('La clave organica2 no puede tener más de 50 caracteres');
    }
  }

  private validateClaveOrganica3(clave: string): void {
    if (!clave || typeof clave !== 'string') {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 es requerida y debe ser una cadena de texto');
    }

    const trimmed = clave.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 no puede estar vacía');
    }

    if (trimmed.length > 50) {
      throw new Organica3InvalidClaveOrganica3Error('La clave organica3 no puede tener más de 50 caracteres');
    }
  }

  private validateDescripcion(descripcion: string): void {
    if (typeof descripcion !== 'string') {
      throw new Organica3InvalidDescripcionError('La descripción debe ser una cadena de texto');
    }

    const trimmed = descripcion.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidDescripcionError('La descripción no puede estar vacía');
    }

    if (trimmed.length > 500) {
      throw new Organica3InvalidDescripcionError('La descripción no puede tener más de 500 caracteres');
    }

    // Validar que no contenga caracteres de control o problemáticos
    if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
      throw new Organica3InvalidDescripcionError('La descripción contiene caracteres no válidos');
    }
  }

  private validateTitular(titular: number): void {
    if (typeof titular !== 'number' || !Number.isInteger(titular)) {
      throw new Organica3InvalidTitularError('El titular debe ser un número entero');
    }

    if (titular <= 0) {
      throw new Organica3InvalidTitularError('El titular debe ser un número positivo');
    }

    if (titular > 999999999) {
      throw new Organica3InvalidTitularError('El titular no puede tener más de 9 dígitos');
    }
  }

  private validateCalleNum(calleNum: string): void {
    if (typeof calleNum !== 'string') {
      throw new Organica3InvalidCalleNumError('La calle y número debe ser una cadena de texto');
    }

    const trimmed = calleNum.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidCalleNumError('La calle y número no puede estar vacía');
    }

    if (trimmed.length > 200) {
      throw new Organica3InvalidCalleNumError('La calle y número no puede tener más de 200 caracteres');
    }
  }

  private validateFraccionamiento(fraccionamiento: string): void {
    if (typeof fraccionamiento !== 'string') {
      throw new Organica3InvalidFraccionamientoError('El fraccionamiento debe ser una cadena de texto');
    }

    const trimmed = fraccionamiento.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidFraccionamientoError('El fraccionamiento no puede estar vacío');
    }

    if (trimmed.length > 200) {
      throw new Organica3InvalidFraccionamientoError('El fraccionamiento no puede tener más de 200 caracteres');
    }
  }

  private validateCodigoPostal(codigoPostal: string): void {
    if (typeof codigoPostal !== 'string') {
      throw new Organica3InvalidCodigoPostalError('El código postal debe ser una cadena de texto');
    }

    const trimmed = codigoPostal.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidCodigoPostalError('El código postal no puede estar vacío');
    }

    // Validar formato de código postal mexicano (5 dígitos)
    if (!/^\d{5}$/.test(trimmed)) {
      throw new Organica3InvalidCodigoPostalError('El código postal debe tener exactamente 5 dígitos');
    }
  }

  private validateTelefono(telefono: string): void {
    if (typeof telefono !== 'string') {
      throw new Organica3InvalidTelefonoError('El teléfono debe ser una cadena de texto');
    }

    const trimmed = telefono.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidTelefonoError('El teléfono no puede estar vacío');
    }

    if (trimmed.length > 20) {
      throw new Organica3InvalidTelefonoError('El teléfono no puede tener más de 20 caracteres');
    }

    // Validar formato básico de teléfono
    if (!/^[\d\s\-\+\(\)]+$/.test(trimmed)) {
      throw new Organica3InvalidTelefonoError('El teléfono contiene caracteres no válidos');
    }
  }

  private validateFax(fax: string): void {
    if (typeof fax !== 'string') {
      throw new Organica3InvalidFaxError('El fax debe ser una cadena de texto');
    }

    const trimmed = fax.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidFaxError('El fax no puede estar vacío');
    }

    if (trimmed.length > 20) {
      throw new Organica3InvalidFaxError('El fax no puede tener más de 20 caracteres');
    }

    // Validar formato básico de fax
    if (!/^[\d\s\-\+\(\)]+$/.test(trimmed)) {
      throw new Organica3InvalidFaxError('El fax contiene caracteres no válidos');
    }
  }

  private validateLocalidad(localidad: string): void {
    if (typeof localidad !== 'string') {
      throw new Organica3InvalidLocalidadError('La localidad debe ser una cadena de texto');
    }

    const trimmed = localidad.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidLocalidadError('La localidad no puede estar vacía');
    }

    if (trimmed.length > 100) {
      throw new Organica3InvalidLocalidadError('La localidad no puede tener más de 100 caracteres');
    }
  }

  private validateMunicipio(municipio: number): void {
    if (typeof municipio !== 'number' || !Number.isInteger(municipio)) {
      throw new Organica3InvalidMunicipioError('El municipio debe ser un número entero');
    }

    if (municipio <= 0) {
      throw new Organica3InvalidMunicipioError('El municipio debe ser un número positivo');
    }

    if (municipio > 9999) {
      throw new Organica3InvalidMunicipioError('El municipio no puede tener más de 4 dígitos');
    }
  }

  private validateEstado(estado: number): void {
    if (typeof estado !== 'number' || !Number.isInteger(estado)) {
      throw new Organica3InvalidEstadoError('El estado debe ser un número entero');
    }

    if (estado <= 0) {
      throw new Organica3InvalidEstadoError('El estado debe ser un número positivo');
    }

    if (estado > 99) {
      throw new Organica3InvalidEstadoError('El estado no puede tener más de 2 dígitos');
    }
  }

  private validateEstatus(estatus: string): void {
    if (typeof estatus !== 'string') {
      throw new Organica3InvalidEstatusError('El estatus debe ser una cadena de texto');
    }

    const trimmed = estatus.trim();
    if (trimmed.length === 0) {
      throw new Organica3InvalidEstatusError('El estatus no puede estar vacío');
    }

    // Valores permitidos para estatus
    const valoresPermitidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
    if (!valoresPermitidos.includes(trimmed.toUpperCase())) {
      throw new Organica3InvalidEstatusError(`El estatus debe ser uno de: ${valoresPermitidos.join(', ')}`);
    }
  }

  private validateFechaFin(fechaFin: Date): void {
    if (!(fechaFin instanceof Date) || isNaN(fechaFin.getTime())) {
      throw new Organica3InvalidFechaError('La fecha fin debe ser una fecha válida');
    }

    const now = new Date();
    if (fechaFin < now) {
      throw new Organica3InvalidFechaError('La fecha fin no puede ser anterior a la fecha actual');
    }
  }

  private async validateParentExists(_claveOrganica0: string, _claveOrganica1: string, _claveOrganica2: string): Promise<void> {
    // Aquí iría la validación de que existe la clave padre organica2
    // Por simplicidad, asumimos que existe o implementamos la validación específica
    // throw new Organica3ParentNotFoundError(claveOrganica0, claveOrganica1, claveOrganica2);
  }
}
