import {
  getAllAfiliados,
  getAfiliadoById,
  createAfiliado,
  updateAfiliado,
  deleteAfiliado,
  createAfiliadoAfiliadoOrgMovimiento,
  type Afiliado
} from './afiliado.repo.js';
import type { AfiliadoOrg } from '../afiliadoOrg/afiliadoOrg.repo.js';
import type { Movimiento } from '../movimiento/movimiento.repo.js';
import { connectFirebirdDatabase } from '../../db/firebird.js';
import { getPool, sql } from '../../db/mssql.js';

// Validate that interno exists in Firebird PERSONAL and ORG_PERSONAL tables
export async function validateInternoInFirebird(interno: number): Promise<boolean> {
  const db = await connectFirebirdDatabase();
  
  return new Promise((resolve, reject) => {
    // First check if interno exists in PERSONAL table
    db.query('SELECT FIRST 1 INTERNO FROM PERSONAL WHERE INTERNO = ?', [interno], (err, personalResult) => {
      if (err) {
        console.error('Error checking PERSONAL table:', err);
        reject(new Error('Error validating interno in PERSONAL table'));
        return;
      }

      if (!personalResult || personalResult.length === 0) {
        resolve(false);
        return;
      }

      // If exists in PERSONAL, check ORG_PERSONAL table
      db.query('SELECT FIRST 1 INTERNO FROM ORG_PERSONAL WHERE INTERNO = ?', [interno], (err2, orgPersonalResult) => {
        if (err2) {
          console.error('Error checking ORG_PERSONAL table:', err2);
          reject(new Error('Error validating interno in ORG_PERSONAL table'));
          return;
        }

        resolve(orgPersonalResult && orgPersonalResult.length > 0);
      });
    });
  });
}

export async function getAllAfiliadosService(): Promise<Afiliado[]> {
  return getAllAfiliados();
}

export async function getAfiliadoByIdService(id: number): Promise<Afiliado> {
  const record = await getAfiliadoById(id);
  if (!record) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return record;
}

export async function createAfiliadoService(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  // Check if folio already exists
  // Note: We would need to implement a check for unique folio if required
  return createAfiliado(data);
}

export async function updateAfiliadoService(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return updateAfiliado(id, data);
}

export async function deleteAfiliadoService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return deleteAfiliado(id);
}

export async function getMovimientosQuincenalesService(userOrg0: string, userOrg1: string): Promise<Array<{
  afiliado: {
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
  };
  afiliadoOrg: Omit<AfiliadoOrg, 'createdAt' | 'updatedAt'>;
  movimiento: Omit<Movimiento, 'createdAt'>;
}>> {
  const p = await getPool();
  const r = await p.request()
    .input('userOrg0', sql.Char(2), userOrg0)
    .input('userOrg1', sql.Char(2), userOrg1)
    .query(`
      SELECT
        -- Afiliado fields (excluding control/audit fields)
        a.id as afiliado_id,
        a.folio,
        a.apellidoPaterno,
        a.apellidoMaterno,
        a.nombre,
        a.curp,
        a.rfc,
        a.numeroSeguroSocial,
        a.fechaNacimiento,
        a.entidadFederativaNacId,
        a.domicilioCalle,
        a.domicilioNumeroExterior,
        a.domicilioNumeroInterior,
        a.domicilioEntreCalle1,
        a.domicilioEntreCalle2,
        a.domicilioColonia,
        a.domicilioCodigoPostal,
        a.telefono,
        a.estadoCivilId,
        a.sexo,
        a.correoElectronico,
        a.estatus,
        a.interno,
        a.noEmpleado,
        a.localidad,
        a.municipio,
        a.estado,
        a.pais,
        a.dependientes,
        a.poseeInmuebles,
        a.fechaCarta,
        a.nacionalidad,
        a.fechaAlta,
        a.celular,
        a.expediente,
        a.quincenaAplicacion,
        a.anioAplicacion,

        -- AfiliadoOrg fields (excluding control/audit fields)
        ao.id as afiliadoOrg_id,
        ao.afiliadoId,
        ao.nivel0Id,
        ao.nivel1Id,
        ao.nivel2Id,
        ao.nivel3Id,
        ao.claveOrganica0,
        ao.claveOrganica1,
        ao.claveOrganica2,
        ao.claveOrganica3,
        ao.interno as internoOrg,
        ao.sueldo,
        ao.otrasPrestaciones,
        ao.quinquenios,
        ao.activo,
        ao.fechaMovAlt,
        ao.orgs1,
        ao.orgs2,
        ao.orgs3,
        ao.orgs4,
        ao.dSueldo,
        ao.dOtrasPrestaciones,
        ao.dQuinquenios,
        ao.aplicar,
        ao.bc,
        ao.porcentaje,

        -- Movimiento fields (excluding control/audit fields)
        m.id as movimiento_id,
        m.quincenaId,
        m.tipoMovimientoId,
        m.afiliadoId,
        m.fecha,
        m.observaciones,
        m.folio,
        m.estatus,
        m.creadoPor,
        m.creadoPorUid

      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.Movimiento m ON a.id = m.afiliadoId
      WHERE ao.claveOrganica0 = @userOrg0
        AND ao.claveOrganica1 = @userOrg1
        AND a.estatus = 1
        AND m.estatus = 'A'
      ORDER BY a.id, m.id
    `);

  return r.recordset.map((row: any) => ({
    afiliado: {
      id: parseInt(row.afiliado_id) || 0,
      folio: row.folio ? parseInt(row.folio) : null,
      apellidoPaterno: row.apellidoPaterno,
      apellidoMaterno: row.apellidoMaterno,
      nombre: row.nombre,
      curp: row.curp,
      rfc: row.rfc,
      numeroSeguroSocial: row.numeroSeguroSocial,
      fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
      entidadFederativaNacId: row.entidadFederativaNacId ? parseInt(row.entidadFederativaNacId) : null,
      domicilioCalle: row.domicilioCalle,
      domicilioNumeroExterior: row.domicilioNumeroExterior,
      domicilioNumeroInterior: row.domicilioNumeroInterior,
      domicilioEntreCalle1: row.domicilioEntreCalle1,
      domicilioEntreCalle2: row.domicilioEntreCalle2,
      domicilioColonia: row.domicilioColonia,
      domicilioCodigoPostal: row.domicilioCodigoPostal ? parseInt(row.domicilioCodigoPostal) : null,
      telefono: row.telefono,
      estadoCivilId: row.estadoCivilId ? parseInt(row.estadoCivilId) : null,
      sexo: row.sexo,
      correoElectronico: row.correoElectronico,
      estatus: row.estatus === 1 || row.estatus === true,
      interno: row.interno ? parseInt(row.interno) : null,
      noEmpleado: row.noEmpleado,
      localidad: row.localidad,
      municipio: row.municipio,
      estado: row.estado,
      pais: row.pais,
      dependientes: row.dependientes ? parseInt(row.dependientes) : null,
      poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
      fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
      nacionalidad: row.nacionalidad,
      fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
      celular: row.celular,
      expediente: row.expediente,
      quincenaAplicacion: row.quincenaAplicacion ? parseInt(row.quincenaAplicacion) : null,
      anioAplicacion: row.anioAplicacion ? parseInt(row.anioAplicacion) : null
    },
    afiliadoOrg: {
      id: parseInt(row.afiliadoOrg_id) || 0,
      afiliadoId: parseInt(row.afiliadoId) || 0,
      nivel0Id: row.nivel0Id ? parseInt(row.nivel0Id) : null,
      nivel1Id: row.nivel1Id ? parseInt(row.nivel1Id) : null,
      nivel2Id: row.nivel2Id ? parseInt(row.nivel2Id) : null,
      nivel3Id: row.nivel3Id ? parseInt(row.nivel3Id) : null,
      claveOrganica0: row.claveOrganica0,
      claveOrganica1: row.claveOrganica1,
      claveOrganica2: row.claveOrganica2,
      claveOrganica3: row.claveOrganica3,
      interno: row.internoOrg ? parseInt(row.internoOrg) : null,
      sueldo: row.sueldo ? parseFloat(row.sueldo) : null,
      otrasPrestaciones: row.otrasPrestaciones ? parseFloat(row.otrasPrestaciones) : null,
      quinquenios: row.quinquenios ? parseFloat(row.quinquenios) : null,
      activo: row.activo === 1 || row.activo === true,
      fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
      orgs1: row.orgs1,
      orgs2: row.orgs2,
      orgs3: row.orgs3,
      orgs4: row.orgs4,
      dSueldo: row.dSueldo,
      dOtrasPrestaciones: row.dOtrasPrestaciones,
      dQuinquenios: row.dQuinquenios,
      aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
      bc: row.bc,
      porcentaje: row.porcentaje ? parseFloat(row.porcentaje) : null
    },
    movimiento: {
      id: parseInt(row.movimiento_id) || 0,
      quincenaId: row.quincenaId,
      tipoMovimientoId: row.tipoMovimientoId ? parseInt(row.tipoMovimientoId) : 0,
      afiliadoId: parseInt(row.afiliadoId) || 0,
      fecha: row.fecha?.toISOString().split('T')[0] || null,
      observaciones: row.observaciones,
      folio: row.folio,
      estatus: row.estatus,
      creadoPor: row.creadoPor ? parseInt(row.creadoPor) : null,
      creadoPorUid: row.creadoPorUid
    }
  }));
}

export async function createAfiliadoAfiliadoOrgMovimientoService(data: {
  // Afiliado fields
  folio?: number | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  nombre?: string | null;
  curp?: string | null;
  rfc?: string | null;
  numeroSeguroSocial?: string | null;
  fechaNacimiento?: string | null;
  entidadFederativaNacId?: number | null;
  domicilioCalle?: string | null;
  domicilioNumeroExterior?: string | null;
  domicilioNumeroInterior?: string | null;
  domicilioEntreCalle1?: string | null;
  domicilioEntreCalle2?: string | null;
  domicilioColonia?: string | null;
  domicilioCodigoPostal?: number | null;
  telefono?: string | null;
  estadoCivilId?: number | null;
  sexo?: string | null;
  correoElectronico?: string | null;
  estatus?: boolean;
  interno?: number | null;
  noEmpleado?: string | null;
  localidad?: string | null;
  municipio?: string | null;
  estado?: string | null;
  pais?: string | null;
  dependientes?: number | null;
  poseeInmuebles?: boolean | null;
  fechaCarta?: string | null;
  nacionalidad?: string | null;
  fechaAlta?: string | null;
  celular?: string | null;
  expediente?: string | null;
  quincenaAplicacion?: number | null;
  anioAplicacion?: number | null;
  nivel0Id?: number | null;
  nivel1Id?: number | null;
  nivel2Id?: number | null;
  nivel3Id?: number | null;
  claveOrganica0?: string | null;
  claveOrganica1?: string | null;
  claveOrganica2?: string | null;
  claveOrganica3?: string | null;
  internoOrg?: number | null;
  sueldo?: number | null;
  otrasPrestaciones?: number | null;
  quinquenios?: number | null;
  activo?: boolean;
  fechaMovAlt?: string | null;
  orgs1?: string | null;
  orgs2?: string | null;
  orgs3?: string | null;
  orgs4?: string | null;
  dSueldo?: string | null;
  dOtrasPrestaciones?: string | null;
  dQuinquenios?: string | null;
  aplicar?: boolean | null;
  bc?: string | null;
  porcentaje?: number | null;
  quincenaId?: string | null;
  tipoMovimientoId?: number;
  fechaMov?: string | null;
  observaciones?: string | null;
  folioMov?: string | null;
  estatusMov?: string | null;
  creadoPor?: number | null;
}): Promise<{ afiliado: Afiliado; afiliadoOrg: AfiliadoOrg; movimiento: Movimiento }> {
  // Calcular quincena y año basado en claveOrganica para generar fechas automáticamente
  const claveOrganica0 = data.claveOrganica0 || '';
  const claveOrganica1 = data.claveOrganica1;
  const claveOrganica2 = data.claveOrganica2;
  const claveOrganica3 = data.claveOrganica3;

  // Calcular quincena y año usando la función del repo
  const { getQuincenaAplicacion } = await import('./afiliado.repo.js');
  const calculatedValues = await getQuincenaAplicacion(
    claveOrganica0,
    claveOrganica1,
    claveOrganica2,
    claveOrganica3,
    data.creadoPor ?? undefined
  );
  
  // Generar fechas basadas en la quincena calculada
  const currentYear = calculatedValues.anio;
  const quincena = calculatedValues.quincena;
  
  // Calcular fecha de la quincena (aproximada)
  const monthFromQuincena = Math.ceil(quincena / 2);
  const dayFromQuincena = (quincena % 2 === 1) ? 15 : 28; // Quincena impar = día 15, par = día 28
  const fechaQuincena = new Date(currentYear, monthFromQuincena - 1, dayFromQuincena).toISOString().split('T')[0];
  
  // Construir quincenaId basado en año y quincena
  const quincenaId = `${currentYear}-${quincena.toString().padStart(2, '0')}`;

  return createAfiliadoAfiliadoOrgMovimiento({
    afiliado: {
      folio: data.folio ?? null,
      apellidoPaterno: data.apellidoPaterno ?? null,
      apellidoMaterno: data.apellidoMaterno ?? null,
      nombre: data.nombre ?? null,
      curp: data.curp ?? null,
      rfc: data.rfc ?? null,
      numeroSeguroSocial: data.numeroSeguroSocial ?? null,
      fechaNacimiento: data.fechaNacimiento ?? null,
      entidadFederativaNacId: data.entidadFederativaNacId ?? null,
      domicilioCalle: data.domicilioCalle ?? null,
      domicilioNumeroExterior: data.domicilioNumeroExterior ?? null,
      domicilioNumeroInterior: data.domicilioNumeroInterior ?? null,
      domicilioEntreCalle1: data.domicilioEntreCalle1 ?? null,
      domicilioEntreCalle2: data.domicilioEntreCalle2 ?? null,
      domicilioColonia: data.domicilioColonia ?? null,
      domicilioCodigoPostal: data.domicilioCodigoPostal ?? null,
      telefono: data.telefono ?? null,
      estadoCivilId: data.estadoCivilId ?? null,
      sexo: data.sexo ?? null,
      correoElectronico: data.correoElectronico ?? null,
      estatus: data.estatus ?? true,
      interno: data.interno ?? null,
      noEmpleado: data.noEmpleado ?? null,
      localidad: data.localidad ?? null,
      municipio: data.municipio ?? null,
      estado: data.estado ?? null,
      pais: data.pais ?? null,
      dependientes: data.dependientes ?? null,
      poseeInmuebles: data.poseeInmuebles ?? null,
      fechaCarta: data.fechaCarta ?? fechaQuincena,
      nacionalidad: data.nacionalidad ?? null,
      fechaAlta: data.fechaAlta ?? fechaQuincena,
      celular: data.celular ?? null,
      expediente: data.expediente ?? null,
      quincenaAplicacion: data.quincenaAplicacion ?? null,
      anioAplicacion: data.anioAplicacion ?? null
    },
    afiliadoOrg: {
      nivel0Id: data.nivel0Id ?? null,
      nivel1Id: data.nivel1Id ?? null,
      nivel2Id: data.nivel2Id ?? null,
      nivel3Id: data.nivel3Id ?? null,
      claveOrganica0: data.claveOrganica0 ?? null,
      claveOrganica1: data.claveOrganica1 ?? null,
      claveOrganica2: data.claveOrganica2 ?? null,
      claveOrganica3: data.claveOrganica3 ?? null,
      interno: data.internoOrg ?? null,
      sueldo: data.sueldo ?? null,
      otrasPrestaciones: data.otrasPrestaciones ?? null,
      quinquenios: data.quinquenios ?? null,
      activo: data.activo ?? true,
      fechaMovAlt: data.fechaMovAlt ?? fechaQuincena,
      orgs1: data.orgs1 ?? null,
      orgs2: data.orgs2 ?? null,
      orgs3: data.orgs3 ?? null,
      orgs4: data.orgs4 ?? null,
      dSueldo: data.dSueldo ?? null,
      dOtrasPrestaciones: data.dOtrasPrestaciones ?? null,
      dQuinquenios: data.dQuinquenios ?? null,
      aplicar: data.aplicar ?? null,
      bc: data.bc ?? null,
      porcentaje: data.porcentaje ?? null
    },
    movimiento: {
      quincenaId: data.quincenaId ?? quincenaId,
      tipoMovimientoId: data.tipoMovimientoId ?? 1,
      fecha: data.fechaMov ?? null,
      observaciones: data.observaciones ?? null,
      folio: data.folioMov ?? null,
      estatus: data.estatusMov ?? null,
      creadoPor: data.creadoPor ?? null,
      creadoPorUid: null // Will be set by the route handler with user token
    }
  });
}