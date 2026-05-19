import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import { Personal, UpdatePersonalData } from '../../domain/entities/Personal.js';
import {
  PersonalNotFoundError,
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

export class UpdatePersonalCommand {
  constructor(private personalRepo: IPersonalRepository) {}

  async execute(interno: number, data: UpdatePersonalData, userId: string): Promise<Personal> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando actualización de registro personal`, {
      interno,
      camposActualizar: Object.keys(data)
    });

    try {
      // Validar interno
      if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
        throw new PersonalInvalidInternoError(interno);
      }

      // Validar datos de entrada
      await this.validateUpdateData(data);

      // Verificar que el registro exista
      const existing = await this.personalRepo.findById(interno);
      if (!existing) {
        throw new PersonalNotFoundError(interno);
      }

      // Actualizar el registro personal
      const personal = await this.personalRepo.update(interno, data);

      console.log(`[${timestamp}] [Usuario: ${userId}] Registro personal actualizado exitosamente`, {
        interno: personal.interno,
        camposActualizados: Object.keys(data)
      });

      return personal;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en actualización de registro personal`, {
        interno,
        camposActualizar: Object.keys(data),
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  private async validateUpdateData(data: UpdatePersonalData): Promise<void> {
    // Validar CURP si se proporciona
    if (data.curp !== undefined && data.curp !== null) {
      if (typeof data.curp !== 'string' || data.curp.length !== 18 || !/^[A-Z0-9]{18}$/.test(data.curp)) {
        throw new PersonalInvalidCurpError(data.curp);
      }
    }

    // Validar RFC si se proporciona
    if (data.rfc !== undefined && data.rfc !== null) {
      if (typeof data.rfc !== 'string' || (data.rfc.length < 12 || data.rfc.length > 13) || !/^[A-Z0-9]{12,13}$/.test(data.rfc)) {
        throw new PersonalInvalidRfcError(data.rfc);
      }
    }

    // Validar número de empleado si se proporciona
    if (data.noempleado !== undefined && data.noempleado !== null) {
      if (typeof data.noempleado !== 'string' || data.noempleado.length > 20 || !/^[A-Z0-9]*$/.test(data.noempleado)) {
        throw new PersonalInvalidNoEmpleadoError(data.noempleado);
      }
    }

    // Validar nombre si se proporciona
    if (data.nombre !== undefined && data.nombre !== null) {
      if (typeof data.nombre !== 'string' || data.nombre.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.nombre.trim())) {
        throw new PersonalInvalidNombreError(data.nombre);
      }
    }

    // Validar apellido paterno si se proporciona
    if (data.apellido_paterno !== undefined && data.apellido_paterno !== null) {
      if (typeof data.apellido_paterno !== 'string' || data.apellido_paterno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_paterno.trim())) {
        throw new PersonalInvalidApellidoPaternoError(data.apellido_paterno);
      }
    }

    // Validar apellido materno si se proporciona
    if (data.apellido_materno !== undefined && data.apellido_materno !== null) {
      if (typeof data.apellido_materno !== 'string' || data.apellido_materno.length > 50 || !/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(data.apellido_materno.trim())) {
        throw new PersonalInvalidApellidoMaternoError(data.apellido_materno);
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.fecha_nacimiento !== undefined && data.fecha_nacimiento !== null) {
      const fecha = new Date(data.fecha_nacimiento);
      if (isNaN(fecha.getTime())) {
        throw new PersonalInvalidFechaNacimientoError(data.fecha_nacimiento);
      }
    }

    // Validar seguro social si se proporciona
    if (data.seguro_social !== undefined && data.seguro_social !== null) {
      if (typeof data.seguro_social !== 'string' || data.seguro_social.length !== 11 || !/^\d{11}$/.test(data.seguro_social)) {
        throw new PersonalInvalidSeguroSocialError(data.seguro_social);
      }
    }

    // Validar código postal si se proporciona
    if (data.codigo_postal !== undefined && data.codigo_postal !== null) {
      if (typeof data.codigo_postal !== 'string' || data.codigo_postal.length !== 5 || !/^\d{5}$/.test(data.codigo_postal)) {
        throw new PersonalInvalidCodigoPostalError(data.codigo_postal);
      }
    }

    // Validar teléfono si se proporciona
    if (data.telefono !== undefined && data.telefono !== null) {
      if (typeof data.telefono !== 'string' || data.telefono.length > 15 || !/^\d+$/.test(data.telefono)) {
        throw new PersonalInvalidTelefonoError(data.telefono);
      }
    }

    // Validar sexo si se proporciona
    if (data.sexo !== undefined && data.sexo !== null) {
      if (typeof data.sexo !== 'string' || !['M', 'F'].includes(data.sexo.toUpperCase())) {
        throw new PersonalInvalidSexoError(data.sexo);
      }
    }

    // Validar estado civil si se proporciona
    if (data.estado_civil !== undefined && data.estado_civil !== null) {
      const estadosValidos = ['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE'];
      if (typeof data.estado_civil !== 'string' || !estadosValidos.includes(data.estado_civil.toUpperCase())) {
        throw new PersonalInvalidEstadoCivilError(data.estado_civil);
      }
    }

    // Validar email si se proporciona
    if (data.email !== undefined && data.email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
        throw new PersonalInvalidEmailError(data.email);
      }
    }

    // Validar fecha de alta si se proporciona
    if (data.fecha_alta !== undefined && data.fecha_alta !== null) {
      const fecha = new Date(data.fecha_alta);
      if (isNaN(fecha.getTime())) {
        throw new PersonalInvalidFechaAltaError(data.fecha_alta);
      }
    }

    // Validar celular si se proporciona
    if (data.celular !== undefined && data.celular !== null) {
      if (typeof data.celular !== 'string' || data.celular.length > 15 || !/^\d+$/.test(data.celular)) {
        throw new PersonalInvalidCelularError(data.celular);
      }
    }

    // Validar expediente si se proporciona
    if (data.expediente !== undefined && data.expediente !== null) {
      if (typeof data.expediente !== 'string' || data.expediente.length > 50 || !/^[A-Z0-9\s]*$/i.test(data.expediente)) {
        throw new PersonalInvalidExpedienteError(data.expediente);
      }
    }
  }
}
