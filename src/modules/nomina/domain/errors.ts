export class NominaCargaInconsistenteError extends Error {
  constructor(public readonly reason: 'RFC_DUPLICADO' | 'MULTIPLES_CARGAS_BASE') {
    super(`NOMINA_CARGA_INCONSISTENTE:${reason}`);
    this.name = 'NominaCargaInconsistenteError';
  }
}

export class NominaCargaBloqueadaError extends Error {
  constructor() {
    super('NOMINA_TXT_BLOQUEADA_POR_LIQUIDACION_OFICIAL');
    this.name = 'NominaCargaBloqueadaError';
  }
}

export class NominaTxtSyncError extends Error {
  constructor(public readonly code: string, public readonly statusCode: 409 | 503 | 500, message = code) {
    super(message);
    this.name = 'NominaTxtSyncError';
  }
}
