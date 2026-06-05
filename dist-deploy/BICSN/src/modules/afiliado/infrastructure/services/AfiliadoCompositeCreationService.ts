import { getPool, sql } from '../../../../db/mssql.js';
import type { AfiliadoOrg } from '../../../afiliadoOrg/afiliadoOrg.repo.js';
import type { Movimiento } from '../../../movimiento/movimiento.repo.js';
import type { Afiliado } from '../../domain/entities/Afiliado.js';
import { AfiliadoAlreadyExistsError } from '../../domain/errors.js';
import { getQuincenaAplicacion } from './AfiliadoQuincenaService.js';
import { syncMovimientoNominaDiasLaborados } from './MovimientoNominaDiasLaboradosService.js';

export async function createAfiliadoAfiliadoOrgMovimiento(data: {
  afiliado: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>;
  afiliadoOrg: Omit<AfiliadoOrg, 'id' | 'afiliadoId' | 'createdAt' | 'updatedAt'> & { categoriaPuestoOrgId?: number | null };
  movimiento: Omit<Movimiento, 'id' | 'afiliadoId' | 'createdAt'>;
}): Promise<{ afiliado: Afiliado; afiliadoOrg: AfiliadoOrg; movimiento: Movimiento }> {
  const p = await getPool();

  let quincenaAplicacion = data.afiliado.quincenaAplicacion;
  let anioAplicacion = data.afiliado.anioAplicacion;

  if (quincenaAplicacion === null || quincenaAplicacion === undefined ||
      anioAplicacion === null || anioAplicacion === undefined) {
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

  const interno = data.afiliado.interno;
  if (interno != null && interno > 0 && quincenaAplicacion != null && anioAplicacion != null) {
    const dupResult = await p.request()
      .input('interno', sql.Int, interno)
      .input('quincenaAplicacion', sql.TinyInt, quincenaAplicacion)
      .input('anioAplicacion', sql.SmallInt, anioAplicacion)
      .query(`
        SELECT id, interno, quincenaAplicacion, anioAplicacion
        FROM afi.Afiliado
        WHERE interno = @interno
          AND quincenaAplicacion = @quincenaAplicacion
          AND anioAplicacion = @anioAplicacion
          AND estatus = 1
      `);

    if (dupResult.recordset.length > 0) {
      const error = new AfiliadoAlreadyExistsError({
        field: 'interno',
        value: String(interno)
      });
      error.message = `Ya existe un registro para el interno ${interno} en la quincena ${quincenaAplicacion} del año ${anioAplicacion}`;
      throw error;
    }
  }

  const transaction = p.transaction();

  try {
    await transaction.begin();

    let folio = data.afiliado.folio;
    if (!folio || folio === 0) {
      const folioResult = await p.request().query(`
        SELECT ISNULL(MAX(folio), 0) + 1 AS nextFolio
        FROM afi.Afiliado
      `);
      folio = folioResult.recordset[0].nextFolio;
      console.log(`Folio auto-generado: ${folio}`);
    }

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
      .input('anioAplicacion', sql.SmallInt, anioAplicacion)
      .input('codigoPostal', sql.Int, data.afiliado.codigoPostal)
      .input('numValidacion', sql.Int, data.afiliado.numValidacion || 1)
      .input('afiliadosComplete', sql.Int, data.afiliado.afiliadosComplete || 0);

    const afiliadoResult = await afiliadoRequest.query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion,
        codigoPostal, numValidacion, afiliadosComplete
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
        @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion, @anioAplicacion,
        @codigoPostal, @numValidacion, @afiliadosComplete
      )
    `);

    const afiliadoRow = afiliadoResult.recordset[0];
    const afiliadoId = afiliadoRow.id;

    console.log(`Afiliado creado - ID: ${afiliadoId}, Folio: ${afiliadoRow.folio}, QuincenaAplicacion: ${afiliadoRow.quincenaAplicacion}, AnioAplicacion: ${afiliadoRow.anioAplicacion}`);

    const hasNumQuinquenios = (await p.request().query(`
      SELECT COL_LENGTH('afi.AfiliadoOrg', 'numQuinquenios') AS len
    `)).recordset[0]?.len != null;

    let afiliadoOrgRequest = transaction.request()
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

    if (hasNumQuinquenios) {
      afiliadoOrgRequest = afiliadoOrgRequest.input('numQuinquenios', sql.Int, data.afiliadoOrg.numQuinquenios ?? 1);
    }

    const numQuinCols = hasNumQuinquenios ? ', numQuinquenios' : '';
    const numQuinVals = hasNumQuinquenios ? ', @numQuinquenios' : '';

    const afiliadoOrgResult = await afiliadoOrgRequest.query(`
      INSERT INTO afi.AfiliadoOrg (
        afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
        claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
        interno, sueldo, otrasPrestaciones, quinquenios, activo,
        fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
        dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje${numQuinCols}
      )
      OUTPUT INSERTED.*
      VALUES (
        @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,
        @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,
        @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,
        @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,
        @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje${numQuinVals}
      )
    `);

    const afiliadoOrgRow = afiliadoOrgResult.recordset[0];

    const movimientoResult = await transaction.request()
      .input('quincenaId', sql.VarChar(30), data.movimiento.quincenaId)
      .input('tipoMovimientoId', sql.Int, data.movimiento.tipoMovimientoId)
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('fecha', sql.Date, data.movimiento.fecha ? new Date(data.movimiento.fecha) : null)
      .input('fechaMovimiento', sql.Date, data.movimiento.fechaMovimiento ? new Date(data.movimiento.fechaMovimiento) : null)
      .input('observaciones', sql.NVarChar(1024), data.movimiento.observaciones)
      .input('folio', sql.VarChar(100), data.movimiento.folio)
      .input('estatus', sql.VarChar(30), data.movimiento.estatus)
      .input('creadoPor', sql.Int, data.movimiento.creadoPor)
      .input('creadoPorUid', sql.UniqueIdentifier, data.movimiento.creadoPorUid)
      .input('entregaRendimiento', sql.VarChar(2), data.movimiento.entregaRendimiento)
      .query(`
        INSERT INTO afi.Movimiento (
          quincenaId, tipoMovimientoId, afiliadoId, fecha, fechaMovimiento,
          observaciones, folio, estatus, creadoPor, creadoPorUid, entregaRendimiento
        )
        OUTPUT INSERTED.*
        VALUES (
          @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha, @fechaMovimiento,
          @observaciones, @folio, @estatus, @creadoPor, @creadoPorUid, @entregaRendimiento
        )
      `);

    const movimientoRow = movimientoResult.recordset[0];

    await syncMovimientoNominaDiasLaborados({
      executor: transaction,
      tipoMovimientoId: data.movimiento.tipoMovimientoId,
      quincenaId: data.movimiento.quincenaId,
      fechaMovimiento: data.movimiento.fechaMovimiento,
      categoriaPuestoOrgId: data.afiliadoOrg.categoriaPuestoOrgId ?? null,
      usuarioRegistro: data.movimiento.creadoPorUid ?? data.movimiento.creadoPor,
      afiliado: {
        id: afiliadoRow.id,
        rfc: afiliadoRow.rfc,
        nombre: afiliadoRow.nombre,
        apellidoPaterno: afiliadoRow.apellidoPaterno,
        apellidoMaterno: afiliadoRow.apellidoMaterno,
        noEmpleado: afiliadoRow.noEmpleado,
        interno: afiliadoRow.interno,
        quincenaAplicacion,
        anioAplicacion
      },
      afiliadoOrg: {
        claveOrganica0: afiliadoOrgRow.claveOrganica0,
        claveOrganica1: afiliadoOrgRow.claveOrganica1,
        claveOrganica2: afiliadoOrgRow.claveOrganica2,
        claveOrganica3: afiliadoOrgRow.claveOrganica3,
        sueldo: afiliadoOrgRow.sueldo,
        quinquenios: afiliadoOrgRow.quinquenios
      }
    });

    await transaction.commit();

    return {
      afiliado: {
        ...afiliadoRow,
        fechaNacimiento: afiliadoRow.fechaNacimiento?.toISOString().split('T')[0] || null,
        fechaCarta: afiliadoRow.fechaCarta?.toISOString().split('T')[0] || null,
        fechaAlta: afiliadoRow.fechaAlta?.toISOString().split('T')[0] || null,
        estatus: afiliadoRow.estatus === 1 || afiliadoRow.estatus === true,
        poseeInmuebles: afiliadoRow.poseeInmuebles === 1 || afiliadoRow.poseeInmuebles === true ? true : afiliadoRow.poseeInmuebles === 0 || afiliadoRow.poseeInmuebles === false ? false : null,
        numValidacion: afiliadoRow.numValidacion || 1,
        afiliadosComplete: afiliadoRow.afiliadosComplete || 0,
        createdAt: afiliadoRow.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: afiliadoRow.updatedAt?.toISOString() || new Date().toISOString()
      },
      afiliadoOrg: {
        ...afiliadoOrgRow,
        numQuinquenios: hasNumQuinquenios ? afiliadoOrgRow.numQuinquenios : null,
        activo: afiliadoOrgRow.activo === 1 || afiliadoOrgRow.activo === true,
        fechaMovAlt: afiliadoOrgRow.fechaMovAlt?.toISOString().split('T')[0] || null,
        aplicar: afiliadoOrgRow.aplicar === 1 || afiliadoOrgRow.aplicar === true ? true : afiliadoOrgRow.aplicar === 0 || afiliadoOrgRow.aplicar === false ? false : null,
        createdAt: afiliadoOrgRow.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: afiliadoOrgRow.updatedAt?.toISOString() || new Date().toISOString()
      },
      movimiento: {
        ...movimientoRow,
        fecha: movimientoRow.fecha?.toISOString().split('T')[0] || null,
        fechaMovimiento: movimientoRow.fechaMovimiento?.toISOString().split('T')[0] || null,
        creadoPorUid: movimientoRow.creadoPorUid || null,
        createdAt: movimientoRow.createdAt?.toISOString() || new Date().toISOString()
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
