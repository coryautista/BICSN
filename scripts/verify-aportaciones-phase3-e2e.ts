import assert from 'node:assert/strict';
import type { TipoFondo } from '../src/modules/aportacionesFondos/domain/entities/AportacionFondo.js';
import type {
  NominaDiasContext,
  NominaDiasLaboradosResolver,
  NominaDiasResultado
} from '../src/modules/aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';
import { assertDatabaseEnvironment, DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

type RegistroFirebird = {
  rfc?: string | null;
};

type RepositoryProbe = {
  obtenerOrgPersonalConNombre(org0: string, org1: string): Promise<RegistroFirebird[]>;
  obtenerDiasLaboradosNominaMap(
    rfcs: Array<string | null | undefined>,
    periodo: string,
    org0: string,
    org1: string
  ): Promise<NominaDiasContext>;
  nominaDiasResolver: NominaDiasLaboradosResolver;
};

const PERIODO_HISTORICO = '1126';
const ORG0 = '04';
const ORG1 = '24';
const FONDOS: TipoFondo[] = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [mssql, firebird, aportacionesModule, formulaModule, snapshotModule, aplicacionModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js'),
    import('../src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.js')
  ]);
  assertDatabaseEnvironment(
    'CALIDAD',
    process.env.SQLSERVER_DB ?? '',
    process.env.FIREBIRD_DATABASE ?? ''
  );
  const pool = await mssql.connectDatabase();
  const formulaRepository = new formulaModule.FormulaCalculoRepository(pool);
  const repository = new aportacionesModule.AportacionFondoRepository(formulaRepository);
  const probe = repository as unknown as RepositoryProbe;

  try {
    const periodoVigente = await repository.obtenerPeriodoAplicacion(ORG0, ORG1);
    const periodo = periodoVigente.periodo;
    const registrosFirebird = await probe.obtenerOrgPersonalConNombre(ORG0, ORG1);
    assert.ok(registrosFirebird.length > 0, 'La QNA vigente no devolvió registros Firebird');

    const contexto = await probe.obtenerDiasLaboradosNominaMap(
      registrosFirebird.map((registro) => registro.rfc),
      periodo,
      ORG0,
      ORG1
    );
    assert.equal(contexto.tieneArchivo, true, `FASE3_TXT_VIGENTE_REQUERIDO_${periodo}`);
    assert.ok(contexto.registros.size > 0, `FASE3_TXT_VIGENTE_SIN_REGISTROS_${periodo}`);

    const diasEsperados: NominaDiasResultado[] = registrosFirebird.map((registro) =>
      probe.nominaDiasResolver.resolve(registro.rfc, contexto, true)
    );
    const resumenEsperado = resumir(diasEsperados);
    assert.ok(resumenEsperado.nomina > 0, `FASE3_SIN_COINCIDENCIAS_NOMINA_${periodo}`);

    for (const fondo of FONDOS) {
      const resultado = await repository.obtenerAportacionesIndividuales(
        fondo,
        ORG0,
        ORG1,
        true,
        periodo
      );
      assert.equal(resultado.datos.length, diasEsperados.length, `Cobertura distinta en ${fondo}`);

      resultado.datos.forEach((registro, index) => {
        const esperado = diasEsperados[index];
        assert.equal(registro.dias_laborados, esperado.dias, `Días distintos en ${fondo}, posición ${index}`);
        assert.equal(registro.dias_laborados_origen, esperado.origen, `Origen distinto en ${fondo}, posición ${index}`);

        if (esperado.origen === 'nomina_sin_coincidencia') {
          assert.equal(registro.sueldo_base, 0, `Base no cero sin coincidencia en ${fondo}`);
          assert.equal(registro.total, 0, `Total no cero sin coincidencia en ${fondo}`);
        }
      });

      assert.deepEqual(
        resumir(resultado.datos.map((registro) => ({
          dias: registro.dias_laborados,
          origen: registro.dias_laborados_origen,
          baseCotizacionQuinquenios: registro.base_cotizacion_quinquenios ?? null
        }))),
        resumenEsperado,
        `Distribución distinta en ${fondo}`
      );
    }

    const historicoRepository = new aplicacionModule.AplicacionQuincenalRepository(
      new snapshotModule.SnapshotCalculoV2Repository(pool),
      formulaRepository
    );
    const quincenaHistorica = Number(PERIODO_HISTORICO.slice(0, 2));
    const anioHistorico = 2000 + Number(PERIODO_HISTORICO.slice(2, 4));
    const historico = await historicoRepository.obtenerHistoricoAportaciones(
      ORG0,
      ORG1,
      quincenaHistorica,
      anioHistorico
    );
    const resumenHistorico = Object.fromEntries(
      Object.entries(historico).map(([tipo, rows]) => [tipo, rows.length])
    );
    assert.ok(
      Object.values(resumenHistorico).some((total) => total > 0),
      'El snapshot SQL histórico 1126 no contiene registros'
    );

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      sqlDatabase: QUALITY.sqlDatabase,
      firebirdDatabase: QUALITY.firebirdDatabase,
      periodoVigente: periodo,
      accionVigente: periodoVigente.accion,
      organica: `${ORG0}-${ORG1}`,
      totalFirebird: registrosFirebird.length,
      totalTxtCoincidente: contexto.registros.size,
      ...resumenEsperado,
      historicoSql: {
        periodo: PERIODO_HISTORICO,
        registros: resumenHistorico
      }
    }));
    console.log('APORTACIONES_PHASE3_E2E_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdPool()]);
  }
}

function resumir(registros: NominaDiasResultado[]) {
  return {
    nomina: registros.filter((registro) => registro.origen === 'nomina').length,
    nominaSinCoincidencia: registros.filter((registro) => registro.origen === 'nomina_sin_coincidencia').length,
    default: registros.filter((registro) => registro.origen === 'default').length,
    diasCero: registros.filter((registro) => registro.dias === 0).length,
    diasParciales: registros.filter((registro) => registro.dias > 0 && registro.dias < 15).length,
    diasQuince: registros.filter((registro) => registro.dias === 15).length
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
