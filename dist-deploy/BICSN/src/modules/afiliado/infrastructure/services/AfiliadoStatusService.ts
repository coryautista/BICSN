import { getPool, sql } from '../../../../db/mssql.js';
import type {
  AfiliadoStatusControl,
  AfiliadoStatusHistory,
  AfiliadoWithStatus
} from '../../domain/entities/Afiliado.js';

export async function getAllStatusControl(): Promise<AfiliadoStatusControl[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, numValidacion, nombreStatus, descripcion, color,
        activo, orden, fechaCreacion, fechaModificacion,
        usuarioCreacion, usuarioModificacion
      FROM afi.AfiliadoStatusControl
      WHERE activo = 1
      ORDER BY orden
    `);

  return r.recordset.map((row: any) => ({
    id: row.id,
    numValidacion: row.numValidacion,
    nombreStatus: row.nombreStatus,
    descripcion: row.descripcion,
    color: row.color,
    activo: row.activo === 1 || row.activo === true,
    orden: row.orden,
    fechaCreacion: row.fechaCreacion?.toISOString() || new Date().toISOString(),
    fechaModificacion: row.fechaModificacion?.toISOString() || new Date().toISOString(),
    usuarioCreacion: row.usuarioCreacion,
    usuarioModificacion: row.usuarioModificacion
  }));
}

export async function getAfiliadosByStatus(org0: string, org1: string, numValidacion: number): Promise<AfiliadoWithStatus[]> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('numValidacion', sql.Int, numValidacion)
    .query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.numeroSeguroSocial, a.fechaNacimiento, a.entidadFederativaNacId,
        a.domicilioCalle, a.domicilioNumeroExterior, a.domicilioNumeroInterior,
        a.domicilioEntreCalle1, a.domicilioEntreCalle2,
        a.domicilioColonia, a.domicilioCodigoPostal, a.telefono, a.estadoCivilId,
        a.sexo, a.correoElectronico, a.estatus, a.interno, a.noEmpleado, a.localidad,
        a.municipio, a.estado, a.pais, a.dependientes, a.poseeInmuebles, a.fechaCarta,
        a.nacionalidad, a.fechaAlta, a.celular, a.expediente, a.quincenaAplicacion, a.anioAplicacion,
        a.codigoPostal, a.numValidacion, a.afiliadosComplete, a.createdAt, a.updatedAt,
        s.nombreStatus, s.descripcion as statusDescripcion, s.color as statusColor
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion = @numValidacion
        AND s.activo = 1
        AND a.estatus = 1
      ORDER BY a.createdAt DESC
    `);

  return r.recordset.map((row: any) => ({
    ...row,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    estatus: row.estatus === 1 || row.estatus === true,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0
  }));
}

export async function cambiarAStatusAfiliado(
  afiliadoId: number,
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .input('numValidacionNuevo', sql.Int, numValidacionNuevo)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('motivo', sql.NVarChar(500), motivo)
    .input('observaciones', sql.NVarChar(1000), observaciones)
    .input('ipAddress', sql.NVarChar(45), ipAddress)
    .input('userAgent', sql.NVarChar(500), userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}

export async function cambiarStatusAfiliadosLote(
  afiliadoIds: number[],
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any[]> {
  const results: any[] = [];

  for (const afiliadoId of afiliadoIds) {
    try {
      const result = await cambiarAStatusAfiliado(
        afiliadoId,
        numValidacionNuevo,
        usuarioId,
        motivo || 'Cambio de estado en lote',
        observaciones,
        ipAddress,
        userAgent
      );
      results.push({
        afiliadoId,
        numValidacionAnterior: result.numValidacionAnterior,
        numValidacionNuevo: result.numValidacionNuevo,
        statusAnterior: result.statusAnterior,
        statusNuevo: result.statusNuevo,
        mensaje: result.mensaje,
        exitoso: true,
        error: null
      });
    } catch (error: any) {
      results.push({
        afiliadoId,
        numValidacionAnterior: null,
        numValidacionNuevo,
        statusAnterior: null,
        statusNuevo: 'Estado Desconocido',
        mensaje: 'Error al cambiar status de afiliado',
        exitoso: false,
        error: error.message
      });
    }
  }

  return results;
}

export async function getAfiliadosPendientes(org0: string, org1: string): Promise<AfiliadoWithStatus[]> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.correoElectronico, a.telefono, a.numValidacion, a.afiliadosComplete,
        s.nombreStatus, s.descripcion as statusDescripcion, s.color as statusColor,
        a.createdAt, a.updatedAt
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0 
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion = 1
        AND s.activo = 1
        AND a.estatus = 1
      ORDER BY a.createdAt DESC
    `);

  return r.recordset.map((row: any) => ({
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    correoElectronico: row.correoElectronico,
    telefono: row.telefono,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    nombreStatus: row.nombreStatus,
    statusDescripcion: row.statusDescripcion,
    statusColor: row.statusColor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    numeroSeguroSocial: null,
    fechaNacimiento: null,
    entidadFederativaNacId: null,
    domicilioCalle: null,
    domicilioNumeroExterior: null,
    domicilioNumeroInterior: null,
    domicilioEntreCalle1: null,
    domicilioEntreCalle2: null,
    domicilioColonia: null,
    domicilioCodigoPostal: null,
    estadoCivilId: null,
    sexo: null,
    estatus: true,
    interno: null,
    noEmpleado: null,
    localidad: null,
    municipio: null,
    estado: null,
    pais: null,
    dependientes: null,
    poseeInmuebles: null,
    fechaCarta: null,
    nacionalidad: null,
    fechaAlta: null,
    celular: null,
    expediente: null,
    quincenaAplicacion: null,
    anioAplicacion: null,
    codigoPostal: null
  }));
}

export async function getAfiliadoStatusHistory(afiliadoId: number): Promise<AfiliadoStatusHistory[]> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .query(`
      SELECT
        id, afiliadoId, numValidacionAnterior, numValidacionNuevo,
        statusAnterior, statusNuevo, motivo, observaciones,
        usuarioId, fechaCambio, ipAddress, userAgent
      FROM afi.AfiliadoStatusHistory
      WHERE afiliadoId = @afiliadoId
      ORDER BY fechaCambio DESC
    `);

  return r.recordset.map((row: any) => ({
    id: row.id,
    afiliadoId: row.afiliadoId,
    numValidacionAnterior: row.numValidacionAnterior,
    numValidacionNuevo: row.numValidacionNuevo,
    statusAnterior: row.statusAnterior,
    statusNuevo: row.statusNuevo,
    motivo: row.motivo,
    observaciones: row.observaciones,
    usuarioId: row.usuarioId,
    fechaCambio: row.fechaCambio?.toISOString() || new Date().toISOString(),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent
  }));
}

export async function aprobarAfiliado(params: {
  afiliadoId: number;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, params.afiliadoId)
    .input('numValidacionNuevo', sql.Int, 2)
    .input('usuarioId', sql.NVarChar(50), params.usuarioId)
    .input('motivo', sql.NVarChar(500), params.motivo || 'Aprobación de afiliado')
    .input('observaciones', sql.NVarChar(1000), params.observaciones)
    .input('ipAddress', sql.NVarChar(45), params.ipAddress)
    .input('userAgent', sql.NVarChar(500), params.userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}

export async function aprobarAfiliadosLote(
  afiliadoIds: number[],
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any[]> {
  const results: any[] = [];

  for (const afiliadoId of afiliadoIds) {
    try {
      const result = await aprobarAfiliado({
        afiliadoId,
        motivo: motivo || 'Aprobación en lote',
        observaciones,
        usuarioId,
        ipAddress,
        userAgent
      });
      results.push({
        afiliadoId,
        numValidacionAnterior: result.numValidacionAnterior,
        numValidacionNuevo: result.numValidacionNuevo,
        statusAnterior: result.statusAnterior,
        statusNuevo: result.statusNuevo,
        mensaje: result.mensaje,
        exitoso: true,
        error: null
      });
    } catch (error: any) {
      results.push({
        afiliadoId,
        numValidacionAnterior: null,
        numValidacionNuevo: 2,
        statusAnterior: null,
        statusNuevo: 'Aprobado',
        mensaje: 'Error al aprobar afiliado',
        exitoso: false,
        error: error.message
      });
    }
  }

  return results;
}

export async function cambiarStatusAfiliado(
  afiliadoId: number,
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .input('numValidacionNuevo', sql.Int, numValidacionNuevo)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('motivo', sql.NVarChar(500), motivo)
    .input('observaciones', sql.NVarChar(1000), observaciones)
    .input('ipAddress', sql.NVarChar(45), ipAddress)
    .input('userAgent', sql.NVarChar(500), userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}
