import sql, { type Transaction } from 'mssql';

export interface QnaLockScope {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
}

export class QnaScopeLockError extends Error {
  readonly code = 'QNA_SCOPE_BUSY';
  readonly statusCode = 409;

  constructor(readonly lockResult: number) {
    super('Otra operación está modificando el mismo ámbito quincenal. Intente nuevamente.');
    this.name = 'QnaScopeLockError';
  }
}

export function buildQnaScopeLockResource(scope: QnaLockScope): string {
  return [
    'BICSN:QNA',
    scope.entidadId,
    scope.anio,
    scope.quincena,
    scope.organica0,
    scope.organica1,
    scope.organica2,
    scope.organica3,
  ].join(':');
}

export async function acquireQnaScopeLock(transaction: Transaction, scope: QnaLockScope, lockTimeoutMs = 15000): Promise<void> {
  const result = await new sql.Request(transaction)
    .input('LockResource', sql.NVarChar(255), buildQnaScopeLockResource(scope))
    .input('LockTimeout', sql.Int, lockTimeoutMs)
    .query(`
      DECLARE @LockResult INT;
      EXEC @LockResult = sys.sp_getapplock
        @Resource = @LockResource,
        @LockMode = 'Exclusive',
        @LockOwner = 'Transaction',
        @LockTimeout = @LockTimeout;
      SELECT @LockResult AS LockResult;
    `);
  const lockResult = Number(result.recordset[0]?.LockResult);
  if (!Number.isInteger(lockResult) || lockResult < 0) {
    throw new QnaScopeLockError(lockResult);
  }
}
