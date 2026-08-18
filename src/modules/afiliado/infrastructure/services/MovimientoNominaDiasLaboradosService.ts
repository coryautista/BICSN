import { ConnectionPool, Transaction } from 'mssql';
import { sql } from '../../../../db/mssql.js';
import {
  calcularDiasLaboradosMovimiento,
  MOVIMIENTO_TIPO
} from '../../domain/services/MovimientoFechaPolicy.js';

type SqlExecutor = ConnectionPool | Transaction;

export interface SyncMovimientoNominaInput {
  executor: SqlExecutor;
  tipoMovimientoId: number;
  quincenaId: string | null;
  fechaMovimiento: string | null;
  categoriaPuestoOrgId?: number | null;
  usuarioRegistro?: string | number | null;
  afiliado: {
    id: number;
    rfc: string | null;
    nombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
    noEmpleado: string | null;
    interno: number | null;
    quincenaAplicacion: number | null;
    anioAplicacion: number | null;
  };
  afiliadoOrg: {
    claveOrganica0: string | null;
    claveOrganica1: string | null;
    claveOrganica2: string | null;
    claveOrganica3: string | null;
    sueldo: number | null;
    quinquenios: number | null;
  };
}

function normalizeOrg(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toDateOnly(value: Date): string {
  return value.toISOString().split('T')[0];
}

function parsePeriod(input: SyncMovimientoNominaInput): { anio: number; quincena: number } {
  if (input.afiliado.anioAplicacion && input.afiliado.quincenaAplicacion) {
    return {
      anio: input.afiliado.anioAplicacion,
      quincena: input.afiliado.quincenaAplicacion
    };
  }

  const match = input.quincenaId?.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) {
    throw new Error('MOVIMIENTO_NOMINA_PERIODO_INVALIDO');
  }

  return {
    anio: Number(match[1]),
    quincena: Number(match[2])
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function validarMovimientoAntesDeTxt(input: {
  executor: SqlExecutor;
  anio: number;
  quincena: number;
  organica0: string | null;
  organica1: string | null;
  organica2: string | null;
  organica3: string | null;
}): Promise<void> {
  const result = await input.executor.request()
    .input('Anio', sql.SmallInt, input.anio)
    .input('Quincena', sql.TinyInt, input.quincena)
    .input('Organica0', sql.VarChar(10), normalizeOrg(input.organica0))
    .input('Organica1', sql.VarChar(10), normalizeOrg(input.organica1))
    .input('Organica2', sql.VarChar(10), normalizeOrg(input.organica2))
    .input('Organica3', sql.VarChar(10), normalizeOrg(input.organica3))
    .query(`
      SELECT TOP 1 Id
      FROM dbo.NominaAplicacionQnalCarga
      WHERE Anio=@Anio AND Quincena=@Quincena
        AND Organica0=@Organica0
        AND ((Organica1=@Organica1) OR (Organica1 IS NULL AND @Organica1 IS NULL))
        AND ((Organica2=@Organica2) OR (Organica2 IS NULL AND @Organica2 IS NULL))
        AND ((Organica3=@Organica3) OR (Organica3 IS NULL AND @Organica3 IS NULL))
        AND TipoCarga='TXT' AND Estatus='APLICADA' AND EsVigente=1
    `);
  if (result.recordset.length > 0) throw new Error('MOVIMIENTO_POSTERIOR_TXT_NO_PERMITIDO');
}

async function getCategoriaPuestoOrg(executor: SqlExecutor, categoriaPuestoOrgId: number) {
  const result = await executor.request()
    .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
    .query(`
      SELECT TOP 1
        CategoriaPuestoOrgId,
        Org0,
        Org1,
        Org2,
        Org3,
        Categoria,
        NombreCategoria,
        IngresoBrutoMensual
      FROM afi.CategoriaPuestoOrg
      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
    `);

  return result.recordset[0] ?? null;
}

async function createSyntheticCarga(executor: SqlExecutor, input: {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string | null;
  organica2: string | null;
  organica3: string | null;
  usuarioRegistro: string | null;
}): Promise<number> {
  const result = await executor.request()
    .input('EntidadId', sql.Int, input.entidadId)
    .input('Anio', sql.SmallInt, input.anio)
    .input('Quincena', sql.TinyInt, input.quincena)
    .input('Organica0', sql.VarChar(10), input.organica0)
    .input('Organica1', sql.VarChar(10), input.organica1)
    .input('Organica2', sql.VarChar(10), input.organica2)
    .input('Organica3', sql.VarChar(10), input.organica3)
    .input('ArchivoNombre', sql.NVarChar(255), 'MOVIMIENTO_AFILIADO')
    .input('Estatus', sql.VarChar(20), 'APLICADA')
    .input('TipoCarga', sql.VarChar(20), 'MOVIMIENTO')
    .input('EsVigente', sql.Bit, false)
    .input('TotalLineas', sql.Int, 1)
    .input('TotalDetalles', sql.Int, 1)
    .input('MotivoRechazo', sql.NVarChar(1000), null)
    .input('UsuarioRegistro', sql.NVarChar(100), input.usuarioRegistro)
    .query(`
      INSERT INTO dbo.NominaAplicacionQnalCarga
        (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, ArchivoNombre, TotalLineas, TotalDetalles, Estatus, TipoCarga, EsVigente, MotivoRechazo, UsuarioRegistro)
      OUTPUT INSERTED.Id
      VALUES
        (@EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @ArchivoNombre, @TotalLineas, @TotalDetalles, @Estatus, @TipoCarga, @EsVigente, @MotivoRechazo, @UsuarioRegistro)
    `);

  return result.recordset[0].Id;
}

export async function syncMovimientoNominaDiasLaborados(input: SyncMovimientoNominaInput): Promise<void> {
  const tiposConDias = new Set<number>([
    MOVIMIENTO_TIPO.ALTA,
    MOVIMIENTO_TIPO.BAJA_PERMANENTE,
    MOVIMIENTO_TIPO.TERMINA_SUSPENSION_Y_BAJA
  ]);
  if (!tiposConDias.has(input.tipoMovimientoId)) {
    return;
  }

  if (!input.fechaMovimiento) {
    throw new Error('MOVIMIENTO_NOMINA_FECHA_MOVIMIENTO_REQUERIDA');
  }

  const { anio, quincena } = parsePeriod(input);
  const diasLaborados = calcularDiasLaboradosMovimiento(input.tipoMovimientoId, input.fechaMovimiento, anio, quincena)!;
  const categoria = input.categoriaPuestoOrgId
    ? await getCategoriaPuestoOrg(input.executor, input.categoriaPuestoOrgId)
    : null;

  if (input.tipoMovimientoId === MOVIMIENTO_TIPO.ALTA && !categoria) {
    throw new Error('MOVIMIENTO_NOMINA_CATEGORIA_REQUERIDA');
  }

  const organica0 = normalizeOrg(categoria?.Org0) ?? normalizeOrg(input.afiliadoOrg.claveOrganica0);
  const organica1 = normalizeOrg(categoria?.Org1) ?? normalizeOrg(input.afiliadoOrg.claveOrganica1);
  const organica2 = normalizeOrg(categoria?.Org2) ?? normalizeOrg(input.afiliadoOrg.claveOrganica2);
  const organica3 = normalizeOrg(categoria?.Org3) ?? normalizeOrg(input.afiliadoOrg.claveOrganica3);

  if (!organica0) {
    throw new Error('MOVIMIENTO_NOMINA_ORGANICA0_REQUERIDA');
  }

  const sueldoMensual = Number(categoria?.IngresoBrutoMensual ?? input.afiliadoOrg.sueldo ?? 0);
  const ayudasMensuales = 0;
  const quinqueniosMensual = Number(input.afiliadoOrg.quinquenios ?? 0);
  const baseCotizacionSueldo = roundMoney((sueldoMensual / 30) * diasLaborados);
  const baseCotizacionQuinquenios = roundMoney((quinqueniosMensual / 30) * diasLaborados);
  const nombreAfiliado = [input.afiliado.nombre, input.afiliado.apellidoPaterno, input.afiliado.apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim() || null;
  const movimiento = input.tipoMovimientoId === MOVIMIENTO_TIPO.ALTA ? 'AL' : 'BA';
  const lineaOriginal = JSON.stringify({
    fuente: 'MOVIMIENTO_AFILIADO',
    movimiento,
    afiliadoId: input.afiliado.id,
    categoriaPuestoOrgId: input.categoriaPuestoOrgId ?? null,
    categoria: categoria?.Categoria ?? null,
    nombreCategoria: categoria?.NombreCategoria ?? null,
    fechaMovimiento: input.fechaMovimiento,
    diasLaborados,
    sueldoMensual,
    ayudasMensuales,
    quinqueniosMensual,
    baseCotizacionSueldo,
    baseCotizacionQuinquenios
  });

  const existing = await input.executor.request()
    .input('EntidadId', sql.Int, 1)
    .input('Anio', sql.SmallInt, anio)
    .input('Quincena', sql.TinyInt, quincena)
    .input('Organica0', sql.VarChar(10), organica0)
    .input('Organica1', sql.VarChar(10), organica1)
    .input('Organica2', sql.VarChar(10), organica2)
    .input('Organica3', sql.VarChar(10), organica3)
    .input('RFC', sql.VarChar(13), input.afiliado.rfc)
    .query(`
      SELECT TOP 1 d.Id,d.CargaId,d.Movimiento
      FROM dbo.NominaAplicacionQnalDetalle d WITH (UPDLOCK, HOLDLOCK)
      INNER JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId
      WHERE d.EntidadId = @EntidadId
        AND d.Anio = @Anio
        AND d.Quincena = @Quincena
        AND d.Organica0 = @Organica0
        AND ((d.Organica1 = @Organica1) OR (d.Organica1 IS NULL AND @Organica1 IS NULL))
        AND ((d.Organica2 = @Organica2) OR (d.Organica2 IS NULL AND @Organica2 IS NULL))
        AND ((d.Organica3 = @Organica3) OR (d.Organica3 IS NULL AND @Organica3 IS NULL))
        AND UPPER(LTRIM(RTRIM(d.RFC))) = UPPER(LTRIM(RTRIM(@RFC)))
        AND c.TipoCarga='MOVIMIENTO'
      ORDER BY d.Id DESC
    `);

  const existingId = existing.recordset[0]?.Id;
  const movimientoExistente = String(existing.recordset[0]?.Movimiento ?? '').trim().toUpperCase();
  if (existingId && movimientoExistente && movimientoExistente !== movimiento) {
    throw new Error('MOVIMIENTO_NOMINA_CONFLICTO_ALTA_BAJA');
  }
  const cargaId = existingId
    ? Number(existing.recordset[0].CargaId)
    : await createSyntheticCarga(input.executor, {
        entidadId: 1,
        anio,
        quincena,
        organica0,
        organica1,
        organica2,
        organica3,
        usuarioRegistro: input.usuarioRegistro == null ? null : String(input.usuarioRegistro)
      });

  const request = input.executor.request()
    .input('CargaId', sql.BigInt, cargaId)
    .input('EntidadId', sql.Int, 1)
    .input('Anio', sql.SmallInt, anio)
    .input('Quincena', sql.TinyInt, quincena)
    .input('Organica0', sql.VarChar(10), organica0)
    .input('Organica1', sql.VarChar(10), organica1)
    .input('Organica2', sql.VarChar(10), organica2)
    .input('Organica3', sql.VarChar(10), organica3)
    .input('LineaNumero', sql.Int, 1)
    .input('LineaOriginal', sql.NVarChar(sql.MAX), lineaOriginal)
    .input('Lote', sql.VarChar(20), 'MOVIMIENTO')
    .input('TipoRegistro', sql.Char(1), '2')
    .input('RFC', sql.VarChar(13), input.afiliado.rfc)
    .input('ClavePersonal', sql.VarChar(20), input.afiliado.noEmpleado ?? (input.afiliado.interno == null ? null : String(input.afiliado.interno)))
    .input('NombreAfiliado', sql.NVarChar(150), nombreAfiliado)
    .input('Movimiento', sql.VarChar(2), movimiento)
    .input('FechaMovimiento', sql.Date, input.fechaMovimiento)
    .input('SueldoMensual', sql.Decimal(18, 2), sueldoMensual)
    .input('AyudasMensuales', sql.Decimal(18, 2), ayudasMensuales)
    .input('QuinqueniosMensual', sql.Decimal(18, 2), quinqueniosMensual)
    .input('BaseCotizacionSueldo', sql.Decimal(18, 2), baseCotizacionSueldo)
    .input('BaseCotizacionQuinquenios', sql.Decimal(18, 2), baseCotizacionQuinquenios)
    .input('DiasLaborados', sql.Decimal(5, 2), diasLaborados);

  if (existingId) {
    await request.input('Id', sql.BigInt, existingId).query(`
      UPDATE dbo.NominaAplicacionQnalDetalle
      SET CargaId = @CargaId,
          EntidadId = @EntidadId,
          LineaNumero = @LineaNumero,
          LineaOriginal = @LineaOriginal,
          Lote = @Lote,
          TipoRegistro = @TipoRegistro,
          RFC = @RFC,
          ClavePersonal = @ClavePersonal,
          NombreAfiliado = @NombreAfiliado,
          Movimiento = @Movimiento,
          FechaMovimiento = @FechaMovimiento,
          SueldoMensual = @SueldoMensual,
          AyudasMensuales = @AyudasMensuales,
          QuinqueniosMensual = @QuinqueniosMensual,
          BaseCotizacionSueldo = @BaseCotizacionSueldo,
          BaseCotizacionQuinquenios = @BaseCotizacionQuinquenios,
          DiasLaborados = @DiasLaborados
      WHERE Id = @Id
    `);
    return;
  }

  await request.query(`
    INSERT INTO dbo.NominaAplicacionQnalDetalle
      (CargaId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal,
       Lote, TipoRegistro, RFC, ClavePersonal, NombreAfiliado, Movimiento, FechaMovimiento, SueldoMensual, AyudasMensuales,
       QuinqueniosMensual, BaseCotizacionSueldo, BaseCotizacionQuinquenios, DiasLaborados)
    VALUES
      (@CargaId, @EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @LineaNumero, @LineaOriginal,
       @Lote, @TipoRegistro, @RFC, @ClavePersonal, @NombreAfiliado, @Movimiento, @FechaMovimiento, @SueldoMensual, @AyudasMensuales,
       @QuinqueniosMensual, @BaseCotizacionSueldo, @BaseCotizacionQuinquenios, @DiasLaborados)
  `);
}
