export class CatalogoMotivoBajaNotFoundError extends Error {
  constructor(message = 'Motivo de baja no encontrado') {
    super(message);
    this.name = 'CatalogoMotivoBajaNotFoundError';
  }
}

export class CatalogoMotivoBajaConflictError extends Error {
  constructor(message = 'Ya existe un motivo de baja con la misma clave') {
    super(message);
    this.name = 'CatalogoMotivoBajaConflictError';
  }
}
