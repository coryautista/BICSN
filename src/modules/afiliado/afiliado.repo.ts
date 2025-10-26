import { getPool, sql } from '../../db/mssql.js';

export type Afiliado = {
  id: number;
  folio: number;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombre: string | null;
  curp: string | null;
  rfc: string | null;
  numeroSeguroSocial: string | null;
  fechaNacimiento: string | null;
  entidadFederativaNacId: number | null;
  domicilioCalle: string | null;
  domicilioNumeroExterior: string | null;
  domicilioNumeroInterior: string | null;
  domicilioColonia: string | null;
  domicilioCodigoPostal: number | null;
  telefono: string | null;
  estadoCivilId: number | null;
  sexo: string | null;
  correoElectronico: string | null;
  estatus: boolean;
  interno: number | null;
  noEmpleado: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  dependientes: number | null;
  poseeInmuebles: boolean | null;
  fechaCarta: string | null;
  nacionalidad: string | null;
  fechaAlta: string | null;
  celular: string | null;
  expediente: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAllAfiliados(): Promise<Afiliado[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, createdAt, updatedAt
      FROM afi.Afiliado
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
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
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  }));
}

export async function getAfiliadoById(id: number): Promise<Afiliado | undefined> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, createdAt, updatedAt
      FROM afi.Afiliado
      WHERE id = @id
    `);
  const row = r.recordset[0];
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
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

export async function createAfiliado(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  const p = await getPool();
  const r = await p.request()
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
    .query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
        @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
        @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
        @domicilioColonia, @domicilioCodigoPostal, @telefono, @estadoCivilId,
        @sexo, @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
        @municipio, @estado, @pais, @dependientes, @poseeInmuebles, @fechaCarta,
        @nacionalidad, @fechaAlta, @celular, @expediente
      )
    `);
  const row = r.recordset[0];
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
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

export async function updateAfiliado(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  const p = await getPool();
  const updates: string[] = [];
  const request = p.request().input('id', sql.Int, id);

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

  updates.push('updatedAt = SYSUTCDATETIME()');

  const updateQuery = `
    UPDATE afi.Afiliado
    SET ${updates.join(', ')}
    OUTPUT INSERTED.*
    WHERE id = @id
  `;

  const r = await request.query(updateQuery);
  const row = r.recordset[0];
  if (!row) throw new Error('AFILIADO_NOT_FOUND');
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
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

export async function deleteAfiliado(id: number): Promise<void> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM afi.Afiliado
      WHERE id = @id
      SELECT @@ROWCOUNT as deletedCount
    `);
  if (r.recordset[0].deletedCount === 0) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
}