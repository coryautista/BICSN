# Plan: Fecha de movimiento y días laborados para AL/BA

## Objetivo

Agregar `fechaMovimiento` a movimientos de afiliados para que altas y bajas permanentes afecten los días laborados de la quincena e inserten/actualicen `dbo.NominaAplicacionQnalDetalle`, permitiendo que los cálculos que usan nómina consideren solo los días trabajados.

## Query SQL Server

```sql
ALTER TABLE afi.Movimiento
ADD fechaMovimiento DATE NULL;
GO
```

## Reglas Confirmadas

- Campo nuevo en BD: `afi.Movimiento.fechaMovimiento`.
- API: `fechaMovimiento`.
- Formato: `YYYY-MM-DD`.
- La fecha capturada cuenta como día laborado.
- Máximo días laborados: `15`.
- Solo afectan `NominaAplicacionQnalDetalle`:
  - Alta: `AL`, `tipoMovimientoId = 1`.
  - Baja permanente: `BA`, `tipoMovimientoId = 2`.
- Cambio sueldo/actualización solo guarda `fechaMovimiento`, no ajusta días laborados.
- El frontend mandará `categoriaPuestoOrgId` en alta.
- Para baja, si no hay categoría, tomar sueldo/orgánica actual desde `AfiliadoOrg`.
- `AyudasMensuales` se guarda en `0` para movimientos AL/BA generados desde captura.
- En actualización/cambio sueldo se guarda `fechaMovimiento` si viene, pero no se crea ni actualiza `NominaAplicacionQnalCarga` ni `NominaAplicacionQnalDetalle`.
- Si ya existe registro en nómina, actualizarlo.
- Llave de actualización:
  - `Anio`
  - `Quincena`
  - `Organica0`
  - `Organica1`
  - `Organica2`
  - `Organica3`
  - `RFC`

## Regla de cálculo de días laborados

### Alta

Calcular desde `fechaMovimiento` hasta fin de quincena, incluyendo `fechaMovimiento`.

Ejemplo primera quincena:

- Periodo: día 1 al 15
- Alta: día 10
- Días: `10,11,12,13,14,15` = `6`

### Baja permanente

Calcular desde inicio de quincena hasta `fechaMovimiento`, incluyendo `fechaMovimiento`.

Ejemplo primera quincena:

- Periodo: día 1 al 15
- Baja: día 10
- Días: `1..10` = `10`

### Quincenas

- Quincena impar:
  - inicio: día `1`
  - fin: día `15`
- Quincena par:
  - inicio: día `16`
  - fin: último día del mes
- Tope final:
  - mínimo `0`
  - máximo `15`

## Cambios Backend

### 1. Movimiento

Archivos:

- `src/modules/movimiento/domain/entities/Movimiento.ts`
- `src/modules/movimiento/movimiento.schemas.ts`
- `src/modules/movimiento/infrastructure/persistence/MovimientoRepository.ts`
- `src/modules/movimiento/movimiento.routes.ts`

Cambios:

- Agregar `fechaMovimiento: string | null`.
- Incluir en `SELECT`.
- Incluir en `INSERT`.
- Incluir en `UPDATE`.
- Regresar en respuestas.

## 2. Afiliado schemas

Archivo:

- `src/modules/afiliado/afiliado.schemas.ts`

Cambios:

- Agregar `fechaMovimiento`.
- Agregar `categoriaPuestoOrgId`.
- `fechaMovimiento` requerido funcionalmente para AL/BA.
- `categoriaPuestoOrgId` requerido funcionalmente para alta.

## 3. Entidad completa

Archivo:

- `src/modules/afiliado/domain/entities/CompleteAfiliado.ts`

Cambios:

- Agregar en `movimiento`:
  - `fechaMovimiento: string | null`
- Agregar en `afiliadoOrg` o input correspondiente:
  - `categoriaPuestoOrgId?: number | null`

## 4. Endpoints de captura

Archivo:

- `src/modules/afiliado/afiliado.routes.ts`

Actualizar:

- `POST /v1/afiliado/complete`
- `POST /v1/afiliado/cambio-sueldo`
- `POST /v1/afiliado/baja-permanente`
- `POST /v1/afiliado/baja-suspension`
- `POST /v1/afiliado/baja-termina-suspension`
- `POST /v1/afiliado/baja-termina-suspension-y-baja`

Cambios:

- Recibir `fechaMovimiento`.
- Recibir `categoriaPuestoOrgId`.
- Pasar `fechaMovimiento` a `movimiento`.
- Para AL/BA, ejecutar sincronización a `NominaAplicacionQnalDetalle`.

## 5. Crear servicio de sincronización nómina

Nuevo servicio sugerido:

- `src/modules/afiliado/infrastructure/services/MovimientoNominaDiasLaboradosService.ts`

Responsabilidades:

- Calcular días laborados.
- Obtener datos de categoría para alta.
- Obtener sueldo/orgánica desde `AfiliadoOrg` para baja si no hay categoría.
- Crear carga sintética si hace falta.
- Insertar o actualizar `NominaAplicacionQnalDetalle`.

## 6. Carga sintética

Tabla:

- `dbo.NominaAplicacionQnalCarga`

Valores sugeridos:

- `ArchivoNombre`: `MOVIMIENTO_AFILIADO`
- `Estatus`: `APLICADA`
- `TotalLineas`: `1`
- `TotalDetalles`: `1`
- `UsuarioRegistro`: usuario autenticado

Debe crearse por periodo/orgánica o por operación, según implementación más simple. Recomendado: una carga por operación para trazabilidad.

## 7. Upsert a NominaAplicacionQnalDetalle

Tabla:

- `dbo.NominaAplicacionQnalDetalle`

Llave:

```sql
Anio = @Anio
AND Quincena = @Quincena
AND Organica0 = @Organica0
AND Organica1 = @Organica1
AND (
  (Organica2 = @Organica2) OR (Organica2 IS NULL AND @Organica2 IS NULL)
)
AND (
  (Organica3 = @Organica3) OR (Organica3 IS NULL AND @Organica3 IS NULL)
)
AND UPPER(LTRIM(RTRIM(RFC))) = UPPER(LTRIM(RTRIM(@RFC)))
```

Campos mínimos:

- `CargaId`
- `EntidadId`
- `Anio`
- `Quincena`
- `Organica0`
- `Organica1`
- `Organica2`
- `Organica3`
- `LineaNumero`
- `LineaOriginal`
- `Lote`
- `TipoRegistro`
- `RFC`
- `ClavePersonal`
- `NombreAfiliado`
- `Movimiento`
- `FechaMovimiento`
- `SueldoMensual`
- `AyudasMensuales`
- `QuinqueniosMensual`
- `BaseCotizacionSueldo`
- `BaseCotizacionQuinquenios`
- `DiasLaborados`

Valores sugeridos:

- `LineaNumero`: `1`
- `LineaOriginal`: JSON generado por backend con movimiento/afiliado/categoría/días
- `Lote`: `MOVIMIENTO`
- `TipoRegistro`: `2`
- `Movimiento`: `AL` o `BA`

## 8. Base de cálculo

Para alta:

- Usar `categoriaPuestoOrgId`.
- Obtener de `afi.CategoriaPuestoOrg`:
  - `IngresoBrutoMensual`
  - `Org0`, `Org1`, `Org2`, `Org3`
  - otros campos necesarios si aplican.

Para baja:

- Si no hay categoría:
  - usar `AfiliadoOrg.sueldo`
  - usar `AfiliadoOrg.quinquenios`
  - usar orgánica actual de `AfiliadoOrg`.

Cálculos:

```txt
BaseCotizacionSueldo = (SueldoMensual / 30) * DiasLaborados
BaseCotizacionQuinquenios = (QuinqueniosMensual / 30) * DiasLaborados
AyudasMensuales = 0
```

Tope:

```txt
DiasLaborados = MIN(15, MAX(0, diasCalculados))
```

## 9. Consultas SQL a actualizar

Agregar `fechaMovimiento` en respuestas:

- `GET /v1/afiliado/obtener-movimientos-quincenales`
- `GET /v1/afiliado/historial-movimientos-quincena`
- repositorio genérico `MovimientoRepository`

Archivos:

- `src/modules/afiliado/application/queries/GetMovimientosQuincenalesQuery.ts`
- `src/modules/afiliado/infrastructure/persistence/AfiliadoRepository.ts`
- `src/modules/movimiento/infrastructure/persistence/MovimientoRepository.ts`

## 10. Documentación frontend

Crear o actualizar:

- `docs/afiliado/FRONTEND_FECHA_MOVIMIENTO_DIAS_LABORADOS.md`

Debe incluir:

- `fechaMovimiento`
- `categoriaPuestoOrgId`
- endpoints afectados
- reglas AL/BA
- respuesta esperada
- efecto en cálculos de nómina

## Validación

Ejecutar:

```bash
npm run build
```

Pruebas manuales recomendadas:

1. Alta con `fechaMovimiento` en mitad de quincena.
2. Verificar inserción en `NominaAplicacionQnalDetalle`.
3. Repetir alta mismo RFC/periodo/orgánica y verificar `UPDATE`, no duplicado.
4. Baja permanente con `fechaMovimiento`.
5. Verificar `DiasLaborados`.
6. Verificar `GET /v1/afiliado/obtener-movimientos-quincenales`.
7. Verificar `GET /v1/afiliado/historial-movimientos-quincena`.
