import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import type { ConnectionPool } from 'mssql';
import { AplicarBDIsspeaLoteCommand } from '../src/modules/afiliado/application/commands/AplicarBDIsspeaLoteCommand.js';
import type { AplicarBDIsspeaLoteResult, IAfiliadoRepository } from '../src/modules/afiliado/domain/repositories/IAfiliadoRepository.js';
import {
  GenerarRevisionMovimientosService,
  RevisionMovimientosGeneracionError,
  RevisionMovimientosQnaNoDisponibleError,
  type RevisionMovimientosQnaRunner
} from '../src/modules/reportes/revision/application/GenerarRevisionMovimientosService.js';
import { crearImportesRevision } from '../src/modules/reportes/revision/domain/Revision.types.js';
import type { RevisionRepository } from '../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js';
import { resolverEntidadIdBitacora } from '../src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaLoteService.js';

function resultadoLote(
  aplicacionMovimientosFinalizada: boolean,
  periodo = '1426'
): AplicarBDIsspeaLoteResult {
  return {
    afiliadosProcesados: [],
    afiliadosCambiadosEstado: 0,
    afiliadosFallidos: 0,
    afiliadosCompletos: 0,
    bitacoraActualizada: aplicacionMovimientosFinalizada ? 1 : 0,
    entidadId: 3,
    organica2: '02',
    organica3: '03',
    periodo,
    aplicacionMovimientosFinalizada,
    resumen: {
      totalEncontrados: 0,
      procesadosExitosamente: 0,
      procesadosConError: 0,
      organica: '04/24'
    }
  };
}

const mssqlPoolFake = {} as ConnectionPool;

assert.equal(resolverEntidadIdBitacora(null), 1);
assert.equal(resolverEntidadIdBitacora(undefined), 1);
assert.equal(resolverEntidadIdBitacora(3), 3);
assert.equal(resolverEntidadIdBitacora('3'), 3);
for (const invalid of ['', 0, -1, 'AFILIADOS']) {
  assert.throws(
    () => resolverEntidadIdBitacora(invalid),
    /BITACORA_APLICAR_ENTIDAD_INVALIDA/
  );
}

function qnaRunnerFake(estado: string | null, eventos: string[] = []): RevisionMovimientosQnaRunner {
  return {
    ejecutar: async (_mssqlPool, scope, trabajo) => {
      eventos.push('begin', 'lock', `estado:${estado ?? 'SIN_PROCESO'}`);
      assert.equal(scope.entidadId, 3);
      assert.equal(scope.anio, 2026);
      assert.equal(scope.quincena, 14);
      try {
        const resultado = await trabajo(estado);
        eventos.push('commit');
        return resultado;
      } catch (error) {
        eventos.push('rollback');
        throw error;
      }
    }
  };
}

function afiliadoRepoFake(resultado: AplicarBDIsspeaLoteResult | Error): IAfiliadoRepository {
  return {
    aplicarBDIsspeaLote: async () => {
      if (resultado instanceof Error) throw resultado;
      return { ...resultado };
    }
  } as IAfiliadoRepository;
}

const diContainer = createContainer({ injectionMode: InjectionMode.CLASSIC });
diContainer.register({
  afiliadoRepo: asValue(afiliadoRepoFake(resultadoLote(false))),
  revisionRepo: asValue({} as RevisionRepository),
  mssqlPool: asValue(mssqlPoolFake),
  revisionMovimientosQnaRunner: asValue(qnaRunnerFake(null)),
  generarRevisionMovimientosService: asClass(GenerarRevisionMovimientosService).scoped(),
  aplicarBDIsspeaLoteCommand: asClass(AplicarBDIsspeaLoteCommand).scoped()
});
assert.ok(diContainer.resolve('aplicarBDIsspeaLoteCommand') instanceof AplicarBDIsspeaLoteCommand);

const calculos: string[] = [];
const importes = crearImportesRevision();
importes.CAIR = 10;
const revisionRepo = {
  calcularSaldoAnterior: async () => {
    calculos.push('1');
    return { importes, registros: 1 };
  },
  calcularAltasBajas: async (_tarea: unknown, movimiento: string) => {
    calculos.push(movimiento);
    return { importes: { ...importes, CAIR: { AL: 30, BA: 40, LB: 50 }[movimiento] }, registros: 1 };
  },
  guardarRevisiones: async (items: Array<{
    tarea: { liquidacionSnapshotId: string | null };
    numeroConcepto: number;
    importes: { CAIR: number };
  }>) => {
    calculos.push(`guardar:${items.map((item) => item.numeroConcepto).join(',')}`);
    assert.ok(items.every((item) => item.tarea.liquidacionSnapshotId === null));
    assert.deepEqual(items.map((item) => item.importes.CAIR), [10, 30, 40, 50]);
    return [
      { operacion: 'INSERT' as const, idRevision: 1 },
      { operacion: 'UPDATE' as const, idRevision: 3, idRevisionHistorico: 30 },
      { operacion: 'SIN_CAMBIOS' as const, idRevision: 4 },
      { operacion: 'INSERT' as const, idRevision: 5 }
    ];
  }
} as unknown as RevisionRepository;

const generador = new GenerarRevisionMovimientosService(revisionRepo, mssqlPoolFake, qnaRunnerFake('OFICIAL', calculos));
const generados = await generador.ejecutar({
  entidadId: 3, org0: '04', org1: '24', org2: '02', org3: '03', periodo: '1426', usuarioId: 'test'
});
assert.deepEqual(calculos, ['begin', 'lock', 'estado:OFICIAL', '1', 'AL', 'BA', 'LB', 'guardar:1,3,4,5', 'commit']);
assert.deepEqual(generados.map((item) => item.numeroConcepto), [1, 3, 4, 5]);
assert.deepEqual(generados.map((item) => item.operacion), ['INSERT', 'UPDATE', 'SIN_CAMBIOS', 'INSERT']);

const eventosEntidadInvalida: string[] = [];
await assert.rejects(
  new GenerarRevisionMovimientosService(
    revisionRepo,
    mssqlPoolFake,
    qnaRunnerFake('OFICIAL', eventosEntidadInvalida)
  ).ejecutar({
    entidadId: 0, org0: '04', org1: '24', org2: '02', org3: '03', periodo: '1426', usuarioId: 'test'
  }),
  (error: unknown) => error instanceof RevisionMovimientosGeneracionError
    && error.cause instanceof Error
    && error.cause.message === 'REVISION_MOVIMIENTOS_ENTIDAD_INVALIDA'
);
assert.deepEqual(eventosEntidadInvalida, []);

for (const rama of ['normal', 'cero', 'ya-finalizada']) {
  const invocaciones: unknown[] = [];
  const command = new AplicarBDIsspeaLoteCommand(afiliadoRepoFake(resultadoLote(true)), {
    ejecutar: async (params: unknown) => {
      invocaciones.push(params);
      return generados;
    }
  } as GenerarRevisionMovimientosService);
  const resultado = await command.execute({ org0: '04', org1: '24', usuarioId: rama });
  assert.equal(invocaciones.length, 1, `REVISA no se invoco en rama ${rama}`);
  assert.deepEqual(invocaciones[0], {
    entidadId: 3, org0: '04', org1: '24', org2: '02', org3: '03', periodo: '1426', usuarioId: rama
  });
  assert.equal(resultado.entidadId, 3);
  assert.deepEqual(resultado.revisionMovimientos?.map((item) => item.numeroConcepto), [1, 3, 4, 5]);
}

for (const estado of ['APLICANDO_FIREBIRD', 'APLICACION_INCIERTA', 'REVISA_PROGRAMADA', 'TERMINADO']) {
  const eventos: string[] = [];
  let calculosBloqueados = 0;
  const servicio = new GenerarRevisionMovimientosService({
    calcularSaldoAnterior: async () => {
      calculosBloqueados += 1;
      return { importes: crearImportesRevision(), registros: 0 };
    }
  } as unknown as RevisionRepository, mssqlPoolFake, qnaRunnerFake(estado, eventos));
  await assert.rejects(
    servicio.ejecutar({
      entidadId: 3, org0: '04', org1: '24', org2: '02', org3: '03', periodo: '1426', usuarioId: 'test'
    }),
    (error: unknown) => error instanceof RevisionMovimientosQnaNoDisponibleError
      && error.code === 'REVISION_MOVIMIENTOS_QNA_NO_DISPONIBLE'
      && error.statusCode === 409
  );
  assert.equal(calculosBloqueados, 0, `No debe calcular en estado ${estado}`);
  assert.deepEqual(eventos, ['begin', 'lock', `estado:${estado}`, 'rollback']);
}

for (const estado of [null, 'OFICIAL', 'FIREBIRD_REVERTIDO', 'FIREBIRD_CONFIRMADO', 'LINEA_CONFIRMADA']) {
  let calculosSeguros = 0;
  const servicio = new GenerarRevisionMovimientosService({
    calcularSaldoAnterior: async () => {
      calculosSeguros += 1;
      return { importes: crearImportesRevision(), registros: 0 };
    },
    calcularAltasBajas: async () => {
      calculosSeguros += 1;
      return { importes: crearImportesRevision(), registros: 0 };
    },
    guardarRevisiones: async () => [1, 3, 4, 5].map((idRevision) => ({
      operacion: 'SIN_CAMBIOS' as const,
      idRevision
    }))
  } as unknown as RevisionRepository, mssqlPoolFake, qnaRunnerFake(estado));
  await servicio.ejecutar({
    entidadId: 3, org0: '04', org1: '24', org2: '02', org3: '03', periodo: '1426', usuarioId: 'test'
  });
  assert.equal(calculosSeguros, 4, `Debe calcular en estado ${estado ?? 'sin proceso'}`);
}

for (const resultado of [resultadoLote(false), new Error('FALLO_BITACORA')]) {
  let invocaciones = 0;
  const command = new AplicarBDIsspeaLoteCommand(afiliadoRepoFake(resultado), {
    ejecutar: async () => {
      invocaciones += 1;
      return [];
    }
  } as unknown as GenerarRevisionMovimientosService);
  if (resultado instanceof Error) await assert.rejects(command.execute({ org0: '04', org1: '24', usuarioId: 'test' }));
  else await command.execute({ org0: '04', org1: '24', usuarioId: 'test' });
  assert.equal(invocaciones, 0);
}

let intento = 0;
const revisionRepoRetry = {
  calcularSaldoAnterior: async () => {
    intento += 1;
    if (intento === 1) throw new Error('FIREBIRD_TEMPORAL');
    return { importes: crearImportesRevision(), registros: 0 };
  },
  calcularAltasBajas: async () => ({ importes: crearImportesRevision(), registros: 0 }),
  guardarRevisiones: async () => [1, 3, 4, 5].map((idRevision) => ({
    operacion: 'SIN_CAMBIOS' as const,
    idRevision
  }))
} as unknown as RevisionRepository;
const eventosRetry: string[] = [];
const commandRetry = new AplicarBDIsspeaLoteCommand(
  afiliadoRepoFake(resultadoLote(true)),
  new GenerarRevisionMovimientosService(revisionRepoRetry, mssqlPoolFake, qnaRunnerFake('OFICIAL', eventosRetry))
);
await assert.rejects(
  commandRetry.execute({ org0: '04', org1: '24', usuarioId: 'test' }),
  (error: unknown) => error instanceof RevisionMovimientosGeneracionError
    && error.code === 'REVISION_MOVIMIENTOS_GENERACION_ERROR'
    && error.cause instanceof Error
    && error.cause.message === 'FIREBIRD_TEMPORAL'
);
assert.deepEqual(eventosRetry, ['begin', 'lock', 'estado:OFICIAL', 'rollback']);
assert.deepEqual(
  (await commandRetry.execute({ org0: '04', org1: '24', usuarioId: 'test' })).revisionMovimientos
    ?.map((item) => item.operacion),
  ['SIN_CAMBIOS', 'SIN_CAMBIOS', 'SIN_CAMBIOS', 'SIN_CAMBIOS']
);
assert.deepEqual(eventosRetry.slice(-4), ['begin', 'lock', 'estado:OFICIAL', 'commit']);

const [loteSource, servicioSource, containerSource, routeSource, workerSource, revisionRepoSource, qnaCommandSource] = await Promise.all([
  readFile(new URL('../src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaLoteService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reportes/revision/application/GenerarRevisionMovimientosService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/di/container.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/afiliado/afiliado.routes.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reportes/revision/application/RevisionWorker.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/afiliado/application/commands/AplicarBDIssspeaQNACommand.ts', import.meta.url), 'utf8')
]);
assert.match(loteSource, /SELECT TOP 1 AfectacionId, EntidadId, Quincena, Anio, Org2, Org3/);
assert.match(loteSource, /Number\.isInteger\(entidadId\)[\s\S]*entidadId <= 0/);
assert.match(loteSource, /String\(row\.Org2 \?\? '01'\)[\s\S]*String\(row\.Org3 \?\? '01'\)/);
assert.match(loteSource, /if \(registrosActualizados !== 1\)[\s\S]*BITACORA_APLICACION_MOVIMIENTOS_NO_ACTUALIZADA/);
assert.match(loteSource, /bitacoraActualizada = bitacoraResult\.registrosActualizados;[\s\S]*if \(bitacoraActualizada !== 1\)[\s\S]*BITACORA_APLICACION_MOVIMIENTOS_NO_ACTUALIZADA/);
assert.doesNotMatch(servicioSource, /\.encolar\(|RevisionTarea[\s\S]*INSERT INTO conciliacion\.RevisionTarea/);
assert.doesNotMatch(servicioSource, /numeroConcepto:\s*(2|6|7|8|9|10|11|12|13|14)/);
assert.match(containerSource, /generarRevisionMovimientosService: asClass\(GenerarRevisionMovimientosService\)\.scoped\(\)/);
assert.match(routeSource, /revisionMovimientos: resultado\.revisionMovimientos \|\| \[\]/);
assert.match(routeSource, /error\.code === "REVISION_MOVIMIENTOS_GENERACION_ERROR"[\s\S]*fail\(error\.message, error\.code\)/);
assert.match(routeSource, /REVISION_MOVIMIENTOS_QNA_NO_DISPONIBLE[\s\S]*code\(409\)/);
assert.match(routeSource, /entidadId: resultado\.entidadId/);
for (const numeroConcepto of [1, 3, 4, 5]) {
  assert.match(workerSource, new RegExp(`numeroConcepto: ${numeroConcepto}`), `El worker QNA debe recalcular el concepto ${numeroConcepto}`);
}
assert.match(revisionRepoSource, /INSERT INTO conciliacion\.RevisionHistorico[\s\S]*UPDATE conciliacion\.Revision/);
assert.match(revisionRepoSource, /operacion: 'SIN_CAMBIOS'/);
assert.match(qnaCommandSource, /scheduleRevisionFromSnapshot/);
assert.doesNotMatch(qnaCommandSource, /aplicarBDIsspeaLote|GenerarRevisionMovimientosService/);

console.log('REVISION_MOVIMIENTOS_OK');
