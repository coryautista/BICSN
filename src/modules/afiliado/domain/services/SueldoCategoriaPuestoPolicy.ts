const MOVIMIENTOS_CON_CATEGORIA_PUESTO = new Set(['AL', 'CS']);

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resuelve el parametro SUELDO de DP_EDITA_ENTIDAD.
 *
 * AfiliadoOrg.sueldo conserva el ingreso bruto mensual de CategoriaPuesto.
 * Solo AL y CS envian a Firebird la base de cotizacion; los demas movimientos
 * conservan el sueldo almacenado para no cambiar su comportamiento historico.
 */
export function resolverSueldoFirebirdCategoriaPuesto(
  codigoMovimiento: string,
  ingresoBrutoMensual: number,
  porcentaje: number,
): number {
  if (!Number.isFinite(ingresoBrutoMensual) || ingresoBrutoMensual < 0) {
    throw new Error('SUELDO_CATEGORIA_PUESTO_INVALIDO');
  }

  if (!MOVIMIENTOS_CON_CATEGORIA_PUESTO.has(codigoMovimiento)) {
    return ingresoBrutoMensual;
  }

  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    throw new Error('PORCENTAJE_CATEGORIA_PUESTO_INVALIDO');
  }

  return roundMoney(ingresoBrutoMensual * (porcentaje / 100));
}
