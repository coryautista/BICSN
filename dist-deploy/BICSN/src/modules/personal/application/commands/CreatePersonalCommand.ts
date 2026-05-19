import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import { Personal, CreatePersonalData } from '../../domain/entities/Personal.js';
import {
  PersonalAlreadyExistsError,
  PersonalInvalidInternoError,
  PersonalInvalidCurpError,
  PersonalInvalidRfcError,
  PersonalInvalidNoEmpleadoError,
  PersonalInvalidNombreError,
  PersonalInvalidApellidoPaternoError,
  PersonalInvalidApellidoMaternoError,
  PersonalInvalidFechaNacimientoError,
  PersonalInvalidSeguroSocialError,
  PersonalInvalidCodigoPostalError,
  PersonalInvalidTelefonoError,
  PersonalInvalidSexoError,
  PersonalInvalidEstadoCivilError,
  PersonalInvalidEmailError,
  PersonalInvalidFechaAltaError,
  PersonalInvalidCelularError,
  PersonalInvalidExpedienteError
} from '../../domain/errors.js';

export class CreatePersonalCommand {
  constructor(private personalRepo: IPersonalRepository) {}

  async execute(data: CreatePersonalData, userId: string): Promise<Personal> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando creación de registro personal`, {
      interno: data.interno,
      curp: data.curp,
      rfc: data.rfc,
      noempleado: data.noempleado
    });

    try {
      // Validar datos de entrada
      await this.validateCreateData(data);

      // Verificar que no exista un registro con el mismo interno
      const existingPersonal = await this.personalRepo.findById(data.interno);
      if (existingPersonal) {
        throw new PersonalAlreadyExistsError(data.interno);
      }

      // Crear el registro personal
      const personal = await this.personalRepo.create(data);

      console.log(`[${timestamp}] [Usuario: ${userId}] Registro personal creado exitosamente`, {
        interno: personal.interno,
        curp: personal.curp,
        rfc: personal.rfc
      });

      return personal;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en creación de registro personal`, {
        interno: data.interno,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateCreateData(data: CreatePersonalData): Promise<void> {
    // Validar interno
    if (!data.interno || typeof data.interno !== 'number' || data.interno <= 0 || !Number.isInteger(data.interno)) {
      throw new PersonalInvalidInternoError(data.interno);
    }

    // Validar CURP (opcional pero si se proporciona debe ser válido)
    if (data.curp !== undefined && data.curp !== null) {
      if (typeof data.curp !== 'string' || data.curp.length !== 18 || !/^[A-Z0-9]{18}$/.test(data.curp)) {
        throw new PersonalInvalidCurpError(data.curp);
      }
    }

    // Validar RFC (opcional pero si se proporciona debe ser válido)
    if (data.rfc !== undefined && data.rfc !== null) {
      if (typeof data.rfc !== 'string' || (data.rfc.length < 12 || data.rfc.length > 13) || !/^[A-Z0-9]{12,13}$/.test(data.rfc)) {
        throw new PersonalInvalidRfcError(data.rfc);
      }
    }

    // Validar número de empleado (opcional pero si se proporciona debe ser válido)
    if (data.noempleado !== undefined && data.noempleado !== null) {
      if (typeof data.noempleado !== 'string' || data.noempleado.length > 20 || !/^[A-Z0-9]*$/.test(data.noempleado)) {
        throw new PersonalInvalidNoEmpleadoError(data.noempleado);
      }
    }

    // Validar nombre (requerido)
    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.nombre.trim())) {
      throw new PersonalInvalidNombreError(data.nombre || '');
    }

    // Validar apellido paterno (opcional pero si se proporciona debe ser válido)
    if (data.apellido_paterno !== undefined && data.apellido_paterno !== null) {
      if (typeof data.apellido_paterno !== 'string' || data.apellido_paterno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_paterno.trim())) {
        throw new PersonalInvalidApellidoPaternoError(data.apellido_paterno);
      }
    }

    // Validar apellido materno (opcional pero si se proporciona debe ser válido)
    if (data.apellido_materno !== undefined && data.apellido_materno !== null) {
      if (typeof data.apellido_materno !== 'string' || data.apellido_materno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_materno.trim())) {
        throw new PersonalInvalidApellidoMaternoError(data.apellido_materno);
      }
    }

    // Validar fecha de nacimiento (opcional pero si se proporciona debe ser válida)
    if (data.fecha_nacimiento !== undefined && data.fecha_nacimiento !== null) {
      const fecha = new Date(data.fecha_nacimiento);
      if (isNaN(fecha.getTime())) {
        throw new PersonalInvalidFechaNacimientoError(data.fecha_nacimiento);
      }
    }

    // Validar seguro social (opcional pero si se proporciona debe ser válido)
    if (data.seguro_social !== undefined && data.seguro_social !== null) {
      if (typeof data.seguro_social !== 'string' || data.seguro_social.length !== 11 || !/^\d{11}$/.test(data.seguro_social)) {
        throw new PersonalInvalidSeguroSocialError(data.seguro_social);
      }
    }

    // Validar código postal (opcional pero si se proporciona debe ser válido)
    if (data.codigo_postal !== undefined && data.codigo_postal !== null) {
      if (typeof data.codigo_postal !== 'string' || data.codigo_postal.length !== 5 || !/^\d{5}$/.test(data.codigo_postal)) {
        throw new PersonalInvalidCodigoPostalError(data.codigo_postal);
      }
    }

    // Validar teléfono (opcional pero si se proporciona debe ser válido)
    if (data.telefono !== undefined && data.telefono !== null) {
      if (typeof data.telefono !== 'string' || data.telefono.length > 15 || !/^\d+$/.test(data.telefono)) {
        throw new PersonalInvalidTelefonoError(data.telefono);
      }
    }

    // Validar sexo (opcional pero si se proporciona debe ser válido)
    if (data.sexo !== undefined && data.sexo !== null) {
      if (typeof data.sexo !== 'string' || !['M', 'F'].includes(data.sexo.toUpperCase())) {
        throw new PersonalInvalidSexoError(data.sexo);
      }
    }

    // Validar estado civil (opcional pero si se proporciona debe ser válido)
    if (data.estado_civil !== undefined && data.estado_civil !== null) {
      const estadosValidos = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'];
      if (typeof data.estado_civil !== 'string' || !estadosValidos.includes(data.estado_civil.toUpperCase())) {
        throw new PersonalInvalidEstadoCivilError(data.estado_civil);
      }
    }

    // Validar email (opcional pero si se proporciona debe ser válido)
    if (data.email !== undefined && data.email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
        throw new PersonalInvalidEmailError(data.email);
      }
    }

    // Validar fecha de alta (opcional pero si se proporciona debe ser válida)
    if (data.fecha_alta !== undefined && data.fecha_alta !== null) {
      const fecha = new Date(data.fecha_alta);
      if (isNaN(fecha.getTime())) {
        throw new PersonalInvalidFechaAltaError(data.fecha_alta);
      }
    }

    // Validar celular (opcional pero si se proporciona debe ser válido)
    if (data.celular !== undefined && data.celular !== null) {
      if (typeof data.celular !== 'string' || data.celular.length > 15 || !/^\d+$/.test(data.celular)) {
        throw new PersonalInvalidCelularError(data.celular);
      }
    }

    // Validar expediente (opcional pero si se proporciona debe ser válido)
    if (data.expediente !== undefined && data.expediente !== null) {
      if (typeof data.expediente !== 'string' || data.expediente.length > 50 || !/^[A-Z0-9\s]*$/i.test(data.expediente)) {
        throw new PersonalInvalidExpedienteError(data.expediente);
      }
    }
  }
}
