import sql, { type ConnectionPool, type Transaction } from 'mssql';
import { acquireQnaScopeLock, type QnaLockScope } from '../../../../db/qnaScopeLock.js';
import type { ImportesRevision, RevisionTarea } from '../domain/Revision.types.js';
import type {
  GuardarRevisionResultado,
  RevisionRepository
} from '../infrastructure/persistence/RevisionRepository.js';

export interface GenerarRevisionMovimientosParams {
  entidadId: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  periodo: string;
  usuarioId: string;
}

export interface GenerarRevisionMovimientosResultado extends GuardarRevisionResultado {
  numeroConcepto: 1 | 3 | 4 | 5;
}

export class RevisionMovimientosGeneracionError extends Error {
  readonly code = 'REVISION_MOVIMIENTOS_GENERACION_ERROR';

  constructor(cause: unknown) {
    super('REVISION_MOVIMIENTOS_GENERACION_ERROR', { cause });
    this.name = 'RevisionMovimientosGeneracionError';
  }
}

export class RevisionMovimientosQnaNoDisponibleError extends Error {
  readonly code = 'REVISION_MOVIMIENTOS_QNA_NO_DISPONIBLE';
  readonly statusCode = 409;

  constructor() {
    super('REVISION_MOVIMIENTOS_QNA_NO_DISPONIBLE');
    this.name = 'RevisionMovimientosQnaNoDisponibleError';
  }
}

export interface RevisionMovimientosQnaRunner {
  ejecutar<T>(
    mssqlPool: ConnectionPool,
    scope: QnaLockScope,
    trabajo: (estadoQna: string | null) => Promise<T>
  ): Promise<T>;
}

const ESTADOS_QNA_SEGUROS = new Set([
  'OFICIAL',
  'FIREBIRD_REVERTIDO',
  'FIREBIRD_CONFIRMADO',
  'LINEA_CONFIRMADA'
]);

async function rollbackSilencioso(transaction: Transaction): Promise<void> {
  try {
    await transaction.rollback();
  } catch {
    // Conserva el error que causó el rollback.
  }
}

export const defaultRevisionMovimientosQnaRunner: RevisionMovimientosQnaRunner = {
  async ejecutar<T>(
    mssqlPool: ConnectionPool,
    scope: QnaLockScope,
    trabajo: (estadoQna: string | null) => Promise<T>
  ): Promise<T> {
    const transaction = new sql.Transaction(mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      await acquireQnaScopeLock(transaction, scope);
      const resultado = await new sql.Request(transaction)
        .input('entidadId', sql.Int, scope.entidadId)
        .input('anio', sql.SmallInt, scope.anio)
        .input('quincena', sql.TinyInt, scope.quincena)
        .input('organica0', sql.VarChar(30), scope.organica0)
        .input('organica1', sql.VarChar(30), scope.organica1)
        .input('organica2', sql.VarChar(30), scope.organica2)
        .input('organica3', sql.VarChar(30), scope.organica3)
        .query(`
          SELECT TOP (1)
            (SELECT TOP (1) t.EstadoDestino
             FROM liquidacion.QnaProcesoTransicion t WITH (UPDLOCK, HOLDLOCK)
             WHERE t.QnaProcesoId = p.QnaProcesoId
             ORDER BY t.FechaCreacion DESC, t.QnaProcesoTransicionId DESC) AS EstadoActual
          FROM liquidacion.QnaProceso p WITH (UPDLOCK, HOLDLOCK)
          WHERE p.EntidadId = @entidadId AND p.Anio = @anio AND p.Quincena = @quincena
            AND p.Organica0 = @organica0 AND p.Organica1 = @organica1
            AND p.Organica2 = @organica2 AND p.Organica3 = @organica3
          ORDER BY p.QnaProcesoId DESC;
        `);
      const estado = resultado.recordset.length === 0
        ? null
        : String(resultado.recordset[0].EstadoActual ?? 'OFICIAL').trim().toUpperCase();
      const resultadoTrabajo = await trabajo(estado);
      await transaction.commit();
      return resultadoTrabajo;
    } catch (error) {
      await rollbackSilencioso(transaction);
      throw error;
    }
  }
};

export class GenerarRevisionMovimientosService {
  constructor(
    private revisionRepo: RevisionRepository,
    private mssqlPool: ConnectionPool,
    private revisionMovimientosQnaRunner: RevisionMovimientosQnaRunner
  ) {}

  async ejecutar(params: GenerarRevisionMovimientosParams): Promise<GenerarRevisionMovimientosResultado[]> {
    const tarea: RevisionTarea = {
      idRevisionTarea: 0,
      org0: params.org0,
      org1: params.org1,
      org2: params.org2,
      org3: params.org3,
      periodo: params.periodo,
      usuarioId: params.usuarioId,
      intentos: 0,
      claimToken: '',
      liquidacionSnapshotId: null
    };

    try {
      if (!Number.isInteger(params.entidadId) || params.entidadId <= 0) {
        throw new Error('REVISION_MOVIMIENTOS_ENTIDAD_INVALIDA');
      }
      if (!/^\d{4}$/.test(params.periodo)) {
        throw new Error('REVISION_MOVIMIENTOS_PERIODO_INVALIDO');
      }
      const quincena = Number(params.periodo.slice(0, 2));
      const anio = 2000 + Number(params.periodo.slice(2));
      if (quincena < 1 || quincena > 24) {
        throw new Error('REVISION_MOVIMIENTOS_PERIODO_INVALIDO');
      }

      return await this.revisionMovimientosQnaRunner.ejecutar(this.mssqlPool, {
        entidadId: params.entidadId,
        anio,
        quincena,
        organica0: params.org0,
        organica1: params.org1,
        organica2: params.org2,
        organica3: params.org3
      }, async (estadoQna) => {
        if (estadoQna !== null && !ESTADOS_QNA_SEGUROS.has(estadoQna)) {
          throw new RevisionMovimientosQnaNoDisponibleError();
        }
        const calculados: Array<{ numeroConcepto: 1 | 3 | 4 | 5; importes: ImportesRevision }> = [];
        const saldoAnterior = await this.revisionRepo.calcularSaldoAnterior(tarea);
        calculados.push({ numeroConcepto: 1, importes: saldoAnterior.importes });

        for (const [numeroConcepto, movimiento] of [[3, 'AL'], [4, 'BA'], [5, 'LB']] as const) {
          const calculo = await this.revisionRepo.calcularAltasBajas(tarea, movimiento);
          calculados.push({ numeroConcepto, importes: calculo.importes });
        }

        const guardados = await this.revisionRepo.guardarRevisiones(calculados.map((calculo) => ({
          tarea,
          numeroConcepto: calculo.numeroConcepto,
          importes: calculo.importes
        })));

        return calculados.map((calculo, index) => ({
          numeroConcepto: calculo.numeroConcepto,
          ...guardados[index]
        }));
      });
    } catch (error) {
      if (error instanceof RevisionMovimientosQnaNoDisponibleError) throw error;
      if (error instanceof RevisionMovimientosGeneracionError) throw error;
      throw new RevisionMovimientosGeneracionError(error);
    }
  }
}
