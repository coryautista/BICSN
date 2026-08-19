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
