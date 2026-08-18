export class NominaCargaInconsistenteError extends Error {
  constructor(public readonly reason: 'RFC_DUPLICADO' | 'MULTIPLES_CARGAS_BASE') {
    super(`NOMINA_CARGA_INCONSISTENTE:${reason}`);
    this.name = 'NominaCargaInconsistenteError';
  }
}
