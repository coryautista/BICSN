# Frontend: fechaMovimiento y dias laborados AL/BA

## Objetivo

Permitir que altas y bajas permanentes afecten los dias laborados de nomina mediante `dbo.NominaAplicacionQnalDetalle`.

## Endpoints afectados

- `POST /v1/afiliado/complete`
- `POST /v1/afiliado/baja-permanente`
- `POST /v1/afiliado/cambio-sueldo`
- Rutas genericas de `movimiento`
- Consultas de movimientos SQL devuelven `fechaMovimiento`

## Campos nuevos

### Alta

Enviar:

```json
{
  "fechaMovimiento": "2026-04-10",
  "categoriaPuestoOrgId": 123
}
```

Reglas:

- `fechaMovimiento` es requerida.
- `categoriaPuestoOrgId` es requerida.
- Los dias laborados se calculan desde `fechaMovimiento` hasta fin de quincena, incluyendo el dia de alta.
- `SueldoMensual` se toma de `afi.CategoriaPuestoOrg.IngresoBrutoMensual`.
- `AyudasMensuales` se guarda en `0`.

### Baja permanente

Enviar:

```json
{
  "fechaMovimiento": "2026-04-10",
  "categoriaPuestoOrgId": 123
}
```

Reglas:

- `fechaMovimiento` es requerida.
- `categoriaPuestoOrgId` es opcional.
- Si se envia categoria, se usa `IngresoBrutoMensual` y organicas de `CategoriaPuestoOrg`.
- Si no se envia categoria, se usan sueldo, quinquenios y organicas actuales de `AfiliadoOrg`.
- Los dias laborados se calculan desde inicio de quincena hasta `fechaMovimiento`, incluyendo el dia de baja.
- `AyudasMensuales` se guarda en `0`.

### Cambio sueldo / actualizacion

- Puede enviar `fechaMovimiento`.
- No actualiza `NominaAplicacionQnalCarga`.
- No actualiza `NominaAplicacionQnalDetalle`.

## Calculo

```txt
BaseCotizacionSueldo = (SueldoMensual / 30) * DiasLaborados
BaseCotizacionQuinquenios = (QuinqueniosMensual / 30) * DiasLaborados
DiasLaborados = MIN(15, MAX(0, diasCalculados))
```

## DDL manual requerido

```sql
ALTER TABLE afi.Movimiento
ADD fechaMovimiento DATE NULL;
GO
```
