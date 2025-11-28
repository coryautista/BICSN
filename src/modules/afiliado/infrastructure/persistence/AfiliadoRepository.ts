import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { Afiliado, CreateAfiliadoData, UpdateAfiliadoData } from '../../domain/entities/Afiliado.js';
import { ConnectionPool } from 'mssql';
import sql from 'mssql';

export class AfiliadoRepository implements IAfiliadoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Afiliado[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,
        fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,
        domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,
        domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,
        interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,
        fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,
        anioAplicacion, codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt
      FROM afi.Afiliado
      ORDER BY id
    `);

    return result.recordset.map((row) => ({
      id: row.id,
      folio: row.folio,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion,
      anioAplicacion: row.anioAplicacion,
      codigoPostal: row.codigoPostal,
      numValidacion: row.numValidacion || 1,
      afiliadosComplete: row.afiliadosComplete || 0,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    }));
  }

  async findById(id: number): Promise<Afiliado | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,
          fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,
          domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,
          domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,
          interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,
          fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,
          anioAplicacion, codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt
        FROM afi.Afiliado
        WHERE id = @id
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return {
      id: row.id,
      folio: row.folio,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion,
      anioAplicacion: row.anioAplicacion,
      codigoPostal: row.codigoPostal,
      numValidacion: row.numValidacion || 1,
      afiliadosComplete: row.afiliadosComplete || 0,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async create(data: CreateAfiliadoData): Promise<Afiliado> {
    const request = this.mssqlPool.request()
      .input('folio', sql.Int, data.folio)
      .input('apellidoPaterno', sql.NVarChar(255), data.apellidoPaterno)
      .input('apellidoMaterno', sql.NVarChar(255), data.apellidoMaterno)
      .input('nombre', sql.NVarChar(200), data.nombre)
      .input('curp', sql.VarChar(18), data.curp)
      .input('rfc', sql.VarChar(13), data.rfc)
      .input('numeroSeguroSocial', sql.VarChar(50), data.numeroSeguroSocial)
      .input('fechaNacimiento', sql.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null)
      .input('entidadFederativaNacId', sql.Int, data.entidadFederativaNacId)
      .input('domicilioCalle', sql.NVarChar(255), data.domicilioCalle)
      .input('domicilioNumeroExterior', sql.VarChar(50), data.domicilioNumeroExterior)
      .input('domicilioNumeroInterior', sql.VarChar(50), data.domicilioNumeroInterior)
      .input('domicilioEntreCalle1', sql.NVarChar(120), data.domicilioEntreCalle1)
      .input('domicilioEntreCalle2', sql.NVarChar(120), data.domicilioEntreCalle2)
      .input('domicilioColonia', sql.NVarChar(255), data.domicilioColonia)
      .input('domicilioCodigoPostal', sql.Int, data.domicilioCodigoPostal)
      .input('telefono', sql.VarChar(10), data.telefono)
      .input('estadoCivilId', sql.Int, data.estadoCivilId)
      .input('sexo', sql.Char(1), data.sexo)
      .input('correoElectronico', sql.NVarChar(255), data.correoElectronico)
      .input('estatus', sql.Bit, data.estatus)
      .input('interno', sql.Int, data.interno)
      .input('noEmpleado', sql.VarChar(20), data.noEmpleado)
      .input('localidad', sql.NVarChar(150), data.localidad)
      .input('municipio', sql.NVarChar(150), data.municipio)
      .input('estado', sql.NVarChar(150), data.estado)
      .input('pais', sql.NVarChar(100), data.pais)
      .input('dependientes', sql.SmallInt, data.dependientes)
      .input('poseeInmuebles', sql.Bit, data.poseeInmuebles)
      .input('fechaCarta', sql.Date, data.fechaCarta ? new Date(data.fechaCarta) : null)
      .input('nacionalidad', sql.NVarChar(80), data.nacionalidad)
      .input('fechaAlta', sql.Date, data.fechaAlta ? new Date(data.fechaAlta) : null)
      .input('celular', sql.VarChar(15), data.celular)
      .input('expediente', sql.VarChar(50), data.expediente)
      .input('quincenaAplicacion', sql.TinyInt, data.quincenaAplicacion)
      .input('anioAplicacion', sql.SmallInt, data.anioAplicacion);

    const result = await request.query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,
        fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,
        domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,
        domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,
        interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,
        fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,
        anioAplicacion
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc, @numeroSeguroSocial,
        @fechaNacimiento, @entidadFederativaNacId, @domicilioCalle, @domicilioNumeroExterior,
        @domicilioNumeroInterior, @domicilioEntreCalle1, @domicilioEntreCalle2, @domicilioColonia,
        @domicilioCodigoPostal, @telefono, @estadoCivilId, @sexo, @correoElectronico, @estatus,
        @interno, @noEmpleado, @localidad, @municipio, @estado, @pais, @dependientes, @poseeInmuebles,
        @fechaCarta, @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion,
        @anioAplicacion
      )
    `);

    const row = result.recordset[0];
    return {
      id: row.id,
      folio: row.folio,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion,
      anioAplicacion: row.anioAplicacion,
      codigoPostal: row.codigoPostal,
      numValidacion: row.numValidacion || 1,
      afiliadosComplete: row.afiliadosComplete || 0,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async update(data: UpdateAfiliadoData): Promise<Afiliado> {
    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, data.id);

    if (data.folio !== undefined) {
      updates.push('folio = @folio');
      request.input('folio', sql.Int, data.folio);
    }
    if (data.apellidoPaterno !== undefined) {
      updates.push('apellidoPaterno = @apellidoPaterno');
      request.input('apellidoPaterno', sql.NVarChar(255), data.apellidoPaterno);
    }
    if (data.apellidoMaterno !== undefined) {
      updates.push('apellidoMaterno = @apellidoMaterno');
      request.input('apellidoMaterno', sql.NVarChar(255), data.apellidoMaterno);
    }
    if (data.nombre !== undefined) {
      updates.push('nombre = @nombre');
      request.input('nombre', sql.NVarChar(200), data.nombre);
    }
    if (data.curp !== undefined) {
      updates.push('curp = @curp');
      request.input('curp', sql.VarChar(18), data.curp);
    }
    if (data.rfc !== undefined) {
      updates.push('rfc = @rfc');
      request.input('rfc', sql.VarChar(13), data.rfc);
    }
    if (data.numeroSeguroSocial !== undefined) {
      updates.push('numeroSeguroSocial = @numeroSeguroSocial');
      request.input('numeroSeguroSocial', sql.VarChar(50), data.numeroSeguroSocial);
    }
    if (data.fechaNacimiento !== undefined) {
      updates.push('fechaNacimiento = @fechaNacimiento');
      request.input('fechaNacimiento', sql.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null);
    }
    if (data.entidadFederativaNacId !== undefined) {
      updates.push('entidadFederativaNacId = @entidadFederativaNacId');
      request.input('entidadFederativaNacId', sql.Int, data.entidadFederativaNacId);
    }
    if (data.domicilioCalle !== undefined) {
      updates.push('domicilioCalle = @domicilioCalle');
      request.input('domicilioCalle', sql.NVarChar(255), data.domicilioCalle);
    }
    if (data.domicilioNumeroExterior !== undefined) {
      updates.push('domicilioNumeroExterior = @domicilioNumeroExterior');
      request.input('domicilioNumeroExterior', sql.VarChar(50), data.domicilioNumeroExterior);
    }
    if (data.domicilioNumeroInterior !== undefined) {
      updates.push('domicilioNumeroInterior = @domicilioNumeroInterior');
      request.input('domicilioNumeroInterior', sql.VarChar(50), data.domicilioNumeroInterior);
    }
    if (data.domicilioEntreCalle1 !== undefined) {
      updates.push('domicilioEntreCalle1 = @domicilioEntreCalle1');
      request.input('domicilioEntreCalle1', sql.NVarChar(120), data.domicilioEntreCalle1);
    }
    if (data.domicilioEntreCalle2 !== undefined) {
      updates.push('domicilioEntreCalle2 = @domicilioEntreCalle2');
      request.input('domicilioEntreCalle2', sql.NVarChar(120), data.domicilioEntreCalle2);
    }
    if (data.domicilioColonia !== undefined) {
      updates.push('domicilioColonia = @domicilioColonia');
      request.input('domicilioColonia', sql.NVarChar(255), data.domicilioColonia);
    }
    if (data.domicilioCodigoPostal !== undefined) {
      updates.push('domicilioCodigoPostal = @domicilioCodigoPostal');
      request.input('domicilioCodigoPostal', sql.Int, data.domicilioCodigoPostal);
    }
    if (data.telefono !== undefined) {
      updates.push('telefono = @telefono');
      request.input('telefono', sql.VarChar(10), data.telefono);
    }
    if (data.estadoCivilId !== undefined) {
      updates.push('estadoCivilId = @estadoCivilId');
      request.input('estadoCivilId', sql.Int, data.estadoCivilId);
    }
    if (data.sexo !== undefined) {
      updates.push('sexo = @sexo');
      request.input('sexo', sql.Char(1), data.sexo);
    }
    if (data.correoElectronico !== undefined) {
      updates.push('correoElectronico = @correoElectronico');
      request.input('correoElectronico', sql.NVarChar(255), data.correoElectronico);
    }
    if (data.estatus !== undefined) {
      updates.push('estatus = @estatus');
      request.input('estatus', sql.Bit, data.estatus);
    }
    if (data.interno !== undefined) {
      updates.push('interno = @interno');
      request.input('interno', sql.Int, data.interno);
    }
    if (data.noEmpleado !== undefined) {
      updates.push('noEmpleado = @noEmpleado');
      request.input('noEmpleado', sql.VarChar(20), data.noEmpleado);
    }
    if (data.localidad !== undefined) {
      updates.push('localidad = @localidad');
      request.input('localidad', sql.NVarChar(150), data.localidad);
    }
    if (data.municipio !== undefined) {
      updates.push('municipio = @municipio');
      request.input('municipio', sql.NVarChar(150), data.municipio);
    }
    if (data.estado !== undefined) {
      updates.push('estado = @estado');
      request.input('estado', sql.NVarChar(150), data.estado);
    }
    if (data.pais !== undefined) {
      updates.push('pais = @pais');
      request.input('pais', sql.NVarChar(100), data.pais);
    }
    if (data.dependientes !== undefined) {
      updates.push('dependientes = @dependientes');
      request.input('dependientes', sql.SmallInt, data.dependientes);
    }
    if (data.poseeInmuebles !== undefined) {
      updates.push('poseeInmuebles = @poseeInmuebles');
      request.input('poseeInmuebles', sql.Bit, data.poseeInmuebles);
    }
    if (data.fechaCarta !== undefined) {
      updates.push('fechaCarta = @fechaCarta');
      request.input('fechaCarta', sql.Date, data.fechaCarta ? new Date(data.fechaCarta) : null);
    }
    if (data.nacionalidad !== undefined) {
      updates.push('nacionalidad = @nacionalidad');
      request.input('nacionalidad', sql.NVarChar(80), data.nacionalidad);
    }
    if (data.fechaAlta !== undefined) {
      updates.push('fechaAlta = @fechaAlta');
      request.input('fechaAlta', sql.Date, data.fechaAlta ? new Date(data.fechaAlta) : null);
    }
    if (data.celular !== undefined) {
      updates.push('celular = @celular');
      request.input('celular', sql.VarChar(15), data.celular);
    }
    if (data.expediente !== undefined) {
      updates.push('expediente = @expediente');
      request.input('expediente', sql.VarChar(50), data.expediente);
    }
    if (data.quincenaAplicacion !== undefined) {
      updates.push('quincenaAplicacion = @quincenaAplicacion');
      request.input('quincenaAplicacion', sql.TinyInt, data.quincenaAplicacion);
    }
    if (data.anioAplicacion !== undefined) {
      updates.push('anioAplicacion = @anioAplicacion');
      request.input('anioAplicacion', sql.SmallInt, data.anioAplicacion);
    }

    updates.push('updatedAt = SYSUTCDATETIME()');

    const result = await request.query(`
      UPDATE afi.Afiliado
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    const row = result.recordset[0];
    if (!row) throw new Error('AFILIADO_NOT_FOUND');

    return {
      id: row.id,
      folio: row.folio,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      codigoPostal: row.codigoPostal,
      numValidacion: row.numValidacion,
      afiliadosComplete: row.afiliadosComplete,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion,
      anioAplicacion: row.anioAplicacion,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  async delete(id: number): Promise<void> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM afi.Afiliado
        WHERE id = @id
        SELECT @@ROWCOUNT as deletedCount
      `);

    if (result.recordset[0].deletedCount === 0) {
      throw new Error('AFILIADO_NOT_FOUND');
    }
  }

  async aplicarBDIsspeaLote(
    org0: string,
    org1: string,
    usuarioId: string,
    motivo?: string,
    observaciones?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<import('../../domain/repositories/IAfiliadoRepository.js').AplicarBDIsspeaLoteResult> {
    // Importar la función del repo legacy
    const { aplicarBDIsspeaLote } = await import('../../afiliado.repo.js');
    return await aplicarBDIsspeaLote(org0, org1, usuarioId, motivo, observaciones, ipAddress, userAgent);
  }

  async findByStatusAndOrganica(
    org0: string,
    org1: string,
    estados: number[]
  ): Promise<Afiliado[]> {
    // Construir parámetros dinámicos para los estados
    const request = this.mssqlPool.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1);
    
    // Agregar cada estado como parámetro
    estados.forEach((estado, i) => {
      request.input(`estado${i}`, sql.Int, estado);
    });

    // Construir la lista de parámetros para el IN clause
    const estadoParams = estados.map((_, i) => `@estado${i}`).join(', ');

    const result = await request.query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.numeroSeguroSocial, a.fechaNacimiento, a.entidadFederativaNacId,
        a.domicilioCalle, a.domicilioNumeroExterior, a.domicilioNumeroInterior,
        a.domicilioEntreCalle1, a.domicilioEntreCalle2,
        a.domicilioColonia, a.domicilioCodigoPostal, a.telefono, a.estadoCivilId,
        a.sexo, a.correoElectronico, a.estatus, a.interno, a.noEmpleado, a.localidad,
        a.municipio, a.estado, a.pais, a.dependientes, a.poseeInmuebles, a.fechaCarta,
        a.nacionalidad, a.fechaAlta, a.celular, a.expediente, a.quincenaAplicacion, a.anioAplicacion,
        a.codigoPostal, a.numValidacion, a.afiliadosComplete, a.createdAt, a.updatedAt
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion IN (${estadoParams})
        AND a.estatus = 1
      ORDER BY a.id
    `);

    return result.recordset.map((row: any) => ({
      id: row.id,
      folio: row.folio,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion,
      anioAplicacion: row.anioAplicacion,
      codigoPostal: row.codigoPostal,
      numValidacion: row.numValidacion || 1,
      afiliadosComplete: row.afiliadosComplete || 0,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    }));
  }
}
