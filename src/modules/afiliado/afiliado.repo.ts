import { getPool, sql } from '../../db/mssql.js';
import type { AfiliadoOrg } from '../afiliadoOrg/afiliadoOrg.repo.js';
import type { Movimiento } from '../movimiento/movimiento.repo.js';

export type Afiliado = {
  id: number;
  folio: number | null;
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
  domicilioEntreCalle1: string | null;
  domicilioEntreCalle2: string | null;
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
  quincenaAplicacion: number | null;
  anioAplicacion: number | null;
  createdAt: string;
  updatedAt: string;
};

// Helper function to calculate quincenaAplicacion and anioAplicacion by organica
export async function getQuincenaAplicacion(
  org0: string,
  org1?: string | null,
  org2?: string | null,
  org3?: string | null,
  userId?: number
): Promise<{ quincena: number; anio: number }> {
  const p = await getPool();
  
  // Construir el WHERE dinámicamente basado en los niveles de orgánica proporcionados
  const whereConditions = ['Org0 = @Org0'];
  const request = p.request().input('Org0', sql.Char(2), org0);
  
  let orgNivel = 0;
  if (org1) {
    whereConditions.push('Org1 = @Org1');
    request.input('Org1', sql.Char(2), org1);
    orgNivel = 1;
  }
  if (org2) {
    whereConditions.push('Org2 = @Org2');
    request.input('Org2', sql.Char(2), org2);
    orgNivel = 2;
  }
  if (org3) {
    whereConditions.push('Org3 = @Org3');
    request.input('Org3', sql.Char(2), org3);
    orgNivel = 3;
  }
  
  const result = await request.query(`
    SELECT TOP 1 Quincena, Anio, Accion
    FROM afec.BitacoraAfectacionOrg
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
  `);

  const currentYear = new Date().getFullYear();
  let quincena: number;
  let anio: number;
  let needsRegistration = false;

  if (result.recordset.length === 0) {
    // No hay registros para esta orgánica, iniciar con quincena 1 del año actual
    quincena = 1;
    anio = currentYear;
    needsRegistration = true;
    console.log(`No existe quincena para orgánica ${org0}/${org1}/${org2}/${org3}. Creando quincena inicial: ${quincena}, Año: ${anio}`);
  } else {
    const lastRecord = result.recordset[0];
    const lastQuincena = lastRecord.Quincena;
    const lastAnio = lastRecord.Anio;
    const accion = lastRecord.Accion;

    // Si la última acción es "Completa", generar nueva quincena
    if (accion === 'Completa') {
      quincena = lastQuincena === 24 ? 1 : lastQuincena + 1;
      anio = lastQuincena === 24 ? lastAnio + 1 : lastAnio;
      needsRegistration = true;
      console.log(`Última acción fue 'Completa'. Nueva quincena: ${quincena}, Año: ${anio}`);
    } else {
      // Si es "Aplicar", usar la última quincena (no crear nueva)
      quincena = lastQuincena;
      anio = lastAnio;
      console.log(`Última acción fue '${accion}'. Usando quincena existente: ${quincena}, Año: ${anio}`);
    }
  }

  // Si se necesita registrar una nueva quincena, hacerlo en las 3 tablas
  if (needsRegistration) {
    try {
      const registerRequest = p.request()
        .input('Entidad', sql.NVarChar(128), 'AFILIADOS')
        .input('Anio', sql.SmallInt, anio)
        .input('Quincena', sql.TinyInt, quincena)
        .input('OrgNivel', sql.TinyInt, orgNivel)
        .input('Org0', sql.Char(2), org0)
        .input('Org1', sql.Char(2), org1 || null)
        .input('Org2', sql.Char(2), org2 || null)
        .input('Org3', sql.Char(2), org3 || null)
        .input('Accion', sql.VarChar(20), 'Aplicar')
        .input('Resultado', sql.VarChar(10), 'OK')
        .input('Mensaje', sql.NVarChar(4000), `Quincena ${quincena}/${anio} creada automáticamente para afiliación`)
        .input('Usuario', sql.NVarChar(100), userId ? `Usuario_${userId}` : 'Sistema')
        .input('AppName', sql.NVarChar(100), 'BICSN_Afiliados')
        .input('Ip', sql.NVarChar(64), 'localhost');

      await registerRequest.execute('afec.usp_RegistrarAfectacionOrg');
      console.log(`Quincena ${quincena}/${anio} registrada exitosamente en BitacoraAfectacionOrg, EstadoAfectacionOrg y ProgresoUsuarioOrg`);
    } catch (error: any) {
      console.error(`Error al registrar quincena en afec: ${error.message}`);
      // No fallar la transacción por esto, solo loguearlo
    }
  }

  return { quincena, anio };
}

export async function getAllAfiliados(): Promise<Afiliado[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion, createdAt, updatedAt
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
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion, createdAt, updatedAt
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

export async function createAfiliado(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  const p = await getPool();

  // Para createAfiliado sin información de orgánica, 
  // quincenaAplicacion y anioAplicacion deben proporcionarse manualmente o serán null
  const quincenaAplicacion = data.quincenaAplicacion ?? null;
  const anioAplicacion = data.anioAplicacion ?? null;

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
    .input('quincenaAplicacion', sql.TinyInt, quincenaAplicacion)
    .input('anioAplicacion', sql.SmallInt, anioAplicacion)
    .query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
        @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
        @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
        @domicilioEntreCalle1, @domicilioEntreCalle2,
        @domicilioColonia, @domicilioCodigoPostal, @telefono, @estadoCivilId,
        @sexo, @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
        @municipio, @estado, @pais, @dependientes, @poseeInmuebles, @fechaCarta,
        @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion, @anioAplicacion
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

export async function createAfiliadoAfiliadoOrgMovimiento(data: {
  afiliado: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>;
  afiliadoOrg: Omit<AfiliadoOrg, 'id' | 'afiliadoId' | 'createdAt' | 'updatedAt'>;
  movimiento: Omit<Movimiento, 'id' | 'afiliadoId' | 'createdAt'>;
}): Promise<{ afiliado: Afiliado; afiliadoOrg: AfiliadoOrg; movimiento: Movimiento }> {
  const p = await getPool();
  
  // Validar que no exista ya un afiliado con el mismo CURP, RFC o NSS
  const validationResult = await p.request()
    .input('curp', sql.VarChar(18), data.afiliado.curp)
    .input('rfc', sql.VarChar(13), data.afiliado.rfc)
    .input('numeroSeguroSocial', sql.VarChar(50), data.afiliado.numeroSeguroSocial)
    .query(`
      SELECT id, curp, rfc, numeroSeguroSocial
      FROM afi.Afiliado
      WHERE (curp = @curp AND curp IS NOT NULL)
         OR (rfc = @rfc AND rfc IS NOT NULL)
         OR (numeroSeguroSocial = @numeroSeguroSocial AND numeroSeguroSocial IS NOT NULL)
    `);

  if (validationResult.recordset.length > 0) {
    const existing = validationResult.recordset[0];
    let duplicateField = '';
    if (existing.curp === data.afiliado.curp) duplicateField = 'CURP';
    else if (existing.rfc === data.afiliado.rfc) duplicateField = 'RFC';
    else if (existing.numeroSeguroSocial === data.afiliado.numeroSeguroSocial) duplicateField = 'Número de Seguro Social';
    
    throw new Error(`Ya existe un afiliado registrado con el mismo ${duplicateField}: ${existing.curp || existing.rfc || existing.numeroSeguroSocial}`);
  }

  const transaction = p.transaction();

  try {
    await transaction.begin();

    // Generar folio automático si no se proporciona
    let folio = data.afiliado.folio;
    if (!folio || folio === 0) {
      const folioResult = await p.request().query(`
        SELECT ISNULL(MAX(folio), 0) + 1 AS nextFolio
        FROM afi.Afiliado
      `);
      folio = folioResult.recordset[0].nextFolio;
      console.log(`Folio auto-generado: ${folio}`);
    }

    // Calcular quincenaAplicacion y anioAplicacion basado en la orgánica si no se proporcionan
    let quincenaAplicacion = data.afiliado.quincenaAplicacion;
    let anioAplicacion = data.afiliado.anioAplicacion;
    
    if (quincenaAplicacion === null || quincenaAplicacion === undefined || 
        anioAplicacion === null || anioAplicacion === undefined) {
      // Usar los datos de orgánica para consultar la quincena específica
      const calculatedValues = await getQuincenaAplicacion(
        data.afiliadoOrg.claveOrganica0 || '',
        data.afiliadoOrg.claveOrganica1,
        data.afiliadoOrg.claveOrganica2,
        data.afiliadoOrg.claveOrganica3,
        data.movimiento.creadoPor ?? undefined
      );
      quincenaAplicacion = calculatedValues.quincena;
      anioAplicacion = calculatedValues.anio;
      
      console.log(`Quincena calculada para orgánica ${data.afiliadoOrg.claveOrganica0}/${data.afiliadoOrg.claveOrganica1}/${data.afiliadoOrg.claveOrganica2}/${data.afiliadoOrg.claveOrganica3}: ${quincenaAplicacion}, Año: ${anioAplicacion}`);
    }

    // Create Afiliado
    const afiliadoRequest = transaction.request()
      .input('folio', sql.Int, folio)
      .input('apellidoPaterno', sql.NVarChar(255), data.afiliado.apellidoPaterno)
      .input('apellidoMaterno', sql.NVarChar(255), data.afiliado.apellidoMaterno)
      .input('nombre', sql.NVarChar(200), data.afiliado.nombre)
      .input('curp', sql.VarChar(18), data.afiliado.curp)
      .input('rfc', sql.VarChar(13), data.afiliado.rfc)
      .input('numeroSeguroSocial', sql.VarChar(50), data.afiliado.numeroSeguroSocial)
      .input('fechaNacimiento', sql.Date, data.afiliado.fechaNacimiento ? new Date(data.afiliado.fechaNacimiento) : null)
      .input('entidadFederativaNacId', sql.Int, data.afiliado.entidadFederativaNacId)
      .input('domicilioCalle', sql.NVarChar(255), data.afiliado.domicilioCalle)
      .input('domicilioNumeroExterior', sql.VarChar(50), data.afiliado.domicilioNumeroExterior)
      .input('domicilioNumeroInterior', sql.VarChar(50), data.afiliado.domicilioNumeroInterior)
      .input('domicilioEntreCalle1', sql.NVarChar(120), data.afiliado.domicilioEntreCalle1)
      .input('domicilioEntreCalle2', sql.NVarChar(120), data.afiliado.domicilioEntreCalle2)
      .input('domicilioColonia', sql.NVarChar(255), data.afiliado.domicilioColonia)
      .input('domicilioCodigoPostal', sql.Int, data.afiliado.domicilioCodigoPostal)
      .input('telefono', sql.VarChar(10), data.afiliado.telefono)
      .input('estadoCivilId', sql.Int, data.afiliado.estadoCivilId)
      .input('sexo', sql.Char(1), data.afiliado.sexo)
      .input('correoElectronico', sql.NVarChar(255), data.afiliado.correoElectronico)
      .input('estatus', sql.Bit, data.afiliado.estatus)
      .input('interno', sql.Int, data.afiliado.interno)
      .input('noEmpleado', sql.VarChar(20), data.afiliado.noEmpleado)
      .input('localidad', sql.NVarChar(150), data.afiliado.localidad)
      .input('municipio', sql.NVarChar(150), data.afiliado.municipio)
      .input('estado', sql.NVarChar(150), data.afiliado.estado)
      .input('pais', sql.NVarChar(100), data.afiliado.pais)
      .input('dependientes', sql.SmallInt, data.afiliado.dependientes)
      .input('poseeInmuebles', sql.Bit, data.afiliado.poseeInmuebles)
      .input('fechaCarta', sql.Date, data.afiliado.fechaCarta ? new Date(data.afiliado.fechaCarta) : null)
      .input('nacionalidad', sql.NVarChar(80), data.afiliado.nacionalidad)
      .input('fechaAlta', sql.Date, data.afiliado.fechaAlta ? new Date(data.afiliado.fechaAlta) : null)
      .input('celular', sql.VarChar(15), data.afiliado.celular)
      .input('expediente', sql.VarChar(50), data.afiliado.expediente)
      .input('quincenaAplicacion', sql.TinyInt, quincenaAplicacion)
      .input('anioAplicacion', sql.SmallInt, anioAplicacion);

    const afiliadoResult = await afiliadoRequest.query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
        @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
        @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
        @domicilioEntreCalle1, @domicilioEntreCalle2,
        @domicilioColonia, @domicilioCodigoPostal, @telefono, @estadoCivilId,
        @sexo, @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
        @municipio, @estado, @pais, @dependientes, @poseeInmuebles, @fechaCarta,
        @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion, @anioAplicacion
      )
    `);

    const afiliadoRow = afiliadoResult.recordset[0];
    const afiliadoId = afiliadoRow.id;
    
    console.log(`Afiliado creado - ID: ${afiliadoId}, Folio: ${afiliadoRow.folio}, QuincenaAplicacion: ${afiliadoRow.quincenaAplicacion}, AnioAplicacion: ${afiliadoRow.anioAplicacion}`);

    // Create AfiliadoOrg
    const afiliadoOrgRequest = transaction.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('nivel0Id', sql.BigInt, data.afiliadoOrg.nivel0Id)
      .input('nivel1Id', sql.BigInt, data.afiliadoOrg.nivel1Id)
      .input('nivel2Id', sql.BigInt, data.afiliadoOrg.nivel2Id)
      .input('nivel3Id', sql.BigInt, data.afiliadoOrg.nivel3Id)
      .input('claveOrganica0', sql.VarChar(30), data.afiliadoOrg.claveOrganica0)
      .input('claveOrganica1', sql.VarChar(30), data.afiliadoOrg.claveOrganica1)
      .input('claveOrganica2', sql.VarChar(30), data.afiliadoOrg.claveOrganica2)
      .input('claveOrganica3', sql.VarChar(30), data.afiliadoOrg.claveOrganica3)
      .input('interno', sql.Int, data.afiliadoOrg.interno)
      .input('sueldo', sql.Decimal(12, 2), data.afiliadoOrg.sueldo)
      .input('otrasPrestaciones', sql.Decimal(12, 2), data.afiliadoOrg.otrasPrestaciones)
      .input('quinquenios', sql.Decimal(12, 2), data.afiliadoOrg.quinquenios)
      .input('activo', sql.Bit, data.afiliadoOrg.activo)
      .input('fechaMovAlt', sql.Date, data.afiliadoOrg.fechaMovAlt ? new Date(data.afiliadoOrg.fechaMovAlt) : null)
      .input('orgs1', sql.VarChar(200), data.afiliadoOrg.orgs1)
      .input('orgs2', sql.VarChar(200), data.afiliadoOrg.orgs2)
      .input('orgs3', sql.VarChar(200), data.afiliadoOrg.orgs3)
      .input('orgs4', sql.VarChar(200), data.afiliadoOrg.orgs4)
      .input('dSueldo', sql.VarChar(200), data.afiliadoOrg.dSueldo)
      .input('dOtrasPrestaciones', sql.VarChar(200), data.afiliadoOrg.dOtrasPrestaciones)
      .input('dQuinquenios', sql.VarChar(200), data.afiliadoOrg.dQuinquenios)
      .input('aplicar', sql.Bit, data.afiliadoOrg.aplicar)
      .input('bc', sql.VarChar(30), data.afiliadoOrg.bc)
      .input('porcentaje', sql.Decimal(9, 4), data.afiliadoOrg.porcentaje);

    const afiliadoOrgResult = await afiliadoOrgRequest.query(`
      INSERT INTO afi.AfiliadoOrg (
        afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
        claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
        interno, sueldo, otrasPrestaciones, quinquenios, activo,
        fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
        dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje
      )
      OUTPUT INSERTED.*
      VALUES (
        @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,
        @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,
        @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,
        @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,
        @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje
      )
    `);

    const afiliadoOrgRow = afiliadoOrgResult.recordset[0];

    // Create Movimiento
    const movimientoRequest = transaction.request()
      .input('quincenaId', sql.VarChar(30), data.movimiento.quincenaId)
      .input('tipoMovimientoId', sql.Int, data.movimiento.tipoMovimientoId)
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('fecha', sql.Date, data.movimiento.fecha ? new Date(data.movimiento.fecha) : null)
      .input('observaciones', sql.NVarChar(1024), data.movimiento.observaciones)
      .input('folio', sql.VarChar(100), data.movimiento.folio)
      .input('estatus', sql.VarChar(30), data.movimiento.estatus)
      .input('creadoPor', sql.Int, data.movimiento.creadoPor);

    const movimientoResult = await movimientoRequest.query(`
      INSERT INTO afi.Movimiento (
        quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor
      )
      OUTPUT INSERTED.*
      VALUES (
        @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha,
        @observaciones, @folio, @estatus, @creadoPor
      )
    `);

    const movimientoRow = movimientoResult.recordset[0];

    await transaction.commit();

    return {
      afiliado: {
        id: afiliadoRow.id,
        folio: afiliadoRow.folio,
        apellidoPaterno: afiliadoRow.apellidoPaterno,
        apellidoMaterno: afiliadoRow.apellidoMaterno,
        nombre: afiliadoRow.nombre,
        curp: afiliadoRow.curp,
        rfc: afiliadoRow.rfc,
        numeroSeguroSocial: afiliadoRow.numeroSeguroSocial,
        fechaNacimiento: afiliadoRow.fechaNacimiento?.toISOString().split('T')[0] || null,
        entidadFederativaNacId: afiliadoRow.entidadFederativaNacId,
        domicilioCalle: afiliadoRow.domicilioCalle,
        domicilioNumeroExterior: afiliadoRow.domicilioNumeroExterior,
        domicilioNumeroInterior: afiliadoRow.domicilioNumeroInterior,
        domicilioEntreCalle1: afiliadoRow.domicilioEntreCalle1,
        domicilioEntreCalle2: afiliadoRow.domicilioEntreCalle2,
        domicilioColonia: afiliadoRow.domicilioColonia,
        domicilioCodigoPostal: afiliadoRow.domicilioCodigoPostal,
        telefono: afiliadoRow.telefono,
        estadoCivilId: afiliadoRow.estadoCivilId,
        sexo: afiliadoRow.sexo,
        correoElectronico: afiliadoRow.correoElectronico,
        estatus: afiliadoRow.estatus === 1 || afiliadoRow.estatus === true,
        interno: afiliadoRow.interno,
        noEmpleado: afiliadoRow.noEmpleado,
        localidad: afiliadoRow.localidad,
        municipio: afiliadoRow.municipio,
        estado: afiliadoRow.estado,
        pais: afiliadoRow.pais,
        dependientes: afiliadoRow.dependientes,
        poseeInmuebles: afiliadoRow.poseeInmuebles === 1 || afiliadoRow.poseeInmuebles === true ? true : afiliadoRow.poseeInmuebles === 0 || afiliadoRow.poseeInmuebles === false ? false : null,
        fechaCarta: afiliadoRow.fechaCarta?.toISOString().split('T')[0] || null,
        nacionalidad: afiliadoRow.nacionalidad,
        fechaAlta: afiliadoRow.fechaAlta?.toISOString().split('T')[0] || null,
        celular: afiliadoRow.celular,
        expediente: afiliadoRow.expediente,
        quincenaAplicacion: afiliadoRow.quincenaAplicacion,
        anioAplicacion: afiliadoRow.anioAplicacion,
        createdAt: afiliadoRow.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: afiliadoRow.updatedAt?.toISOString() || new Date().toISOString()
      },
      afiliadoOrg: {
        id: afiliadoOrgRow.id,
        afiliadoId: afiliadoOrgRow.afiliadoId,
        nivel0Id: afiliadoOrgRow.nivel0Id,
        nivel1Id: afiliadoOrgRow.nivel1Id,
        nivel2Id: afiliadoOrgRow.nivel2Id,
        nivel3Id: afiliadoOrgRow.nivel3Id,
        claveOrganica0: afiliadoOrgRow.claveOrganica0,
        claveOrganica1: afiliadoOrgRow.claveOrganica1,
        claveOrganica2: afiliadoOrgRow.claveOrganica2,
        claveOrganica3: afiliadoOrgRow.claveOrganica3,
        interno: afiliadoOrgRow.interno,
        sueldo: afiliadoOrgRow.sueldo,
        otrasPrestaciones: afiliadoOrgRow.otrasPrestaciones,
        quinquenios: afiliadoOrgRow.quinquenios,
        activo: afiliadoOrgRow.activo === 1 || afiliadoOrgRow.activo === true,
        fechaMovAlt: afiliadoOrgRow.fechaMovAlt?.toISOString().split('T')[0] || null,
        orgs1: afiliadoOrgRow.orgs1,
        orgs2: afiliadoOrgRow.orgs2,
        orgs3: afiliadoOrgRow.orgs3,
        orgs4: afiliadoOrgRow.orgs4,
        dSueldo: afiliadoOrgRow.dSueldo,
        dOtrasPrestaciones: afiliadoOrgRow.dOtrasPrestaciones,
        dQuinquenios: afiliadoOrgRow.dQuinquenios,
        aplicar: afiliadoOrgRow.aplicar === 1 || afiliadoOrgRow.aplicar === true ? true : afiliadoOrgRow.aplicar === 0 || afiliadoOrgRow.aplicar === false ? false : null,
        bc: afiliadoOrgRow.bc,
        porcentaje: afiliadoOrgRow.porcentaje,
        createdAt: afiliadoOrgRow.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: afiliadoOrgRow.updatedAt?.toISOString() || new Date().toISOString()
      },
      movimiento: {
        id: movimientoRow.id,
        quincenaId: movimientoRow.quincenaId,
        tipoMovimientoId: movimientoRow.tipoMovimientoId,
        afiliadoId: movimientoRow.afiliadoId,
        fecha: movimientoRow.fecha?.toISOString().split('T')[0] || null,
        observaciones: movimientoRow.observaciones,
        folio: movimientoRow.folio,
        estatus: movimientoRow.estatus,
        creadoPor: movimientoRow.creadoPor,
        creadoPorUid: movimientoRow.creadoPorUid || null,
        createdAt: movimientoRow.createdAt?.toISOString() || new Date().toISOString()
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}