export class CatalogoPorcentajeFondoNotFoundError extends Error {
  constructor(message = 'Registro de porcentaje de fondo no encontrado') {
    super(message);
    this.name = 'CatalogoPorcentajeFondoNotFoundError';
  }
}

export class CatalogoPorcentajeFondoConflictError extends Error {
  constructor(message = 'Ya existe un porcentaje para ese fondo y año de vigencia') {
    super(message);
    this.name = 'CatalogoPorcentajeFondoConflictError';
  }
}
