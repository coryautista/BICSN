# Líneas de Captura

Este documento describe el endpoint anterior de generación en memoria y los endpoints nuevos para generar/consultar línea de captura persistida por período.

Todas las rutas requieren `Authorization: Bearer <token>`.

## 1. Endpoint Anterior

`POST /v1/aplicaciones-qna/linea-captura`

Genera una línea de captura en memoria. No guarda en `pagos.LineaCapturaPeriodo`.

### Entrada

Body:

```json
{
  "importe": 1250.75,
  "idOrg0": "04",
  "idOrg1": "44"
}
```

Parámetros:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `importe` | number | Sí | Importe total con centavos. |
| `idOrg0` | string | No | Orgánica nivel 0. Si no se envía, se toma del token. |
| `idOrg1` | string | No | Orgánica nivel 1. Si no se envía, se toma del token. |

Reglas:

- `idOrg0` e `idOrg1` aceptan 1 o 2 caracteres alfanuméricos.
- `fechaLimite` se calcula como fecha actual + 5 días.
- `referencia4` se genera como `idOrg0 + idOrg1`.
- No persiste datos en SQL Server.

### Salida

Respuesta `200`:

```json
{
  "success": true,
  "data": {
    "lineaCaptura": "044406264605723",
    "referencia4": "0444",
    "fechaLimite": "2026-06-09",
    "importe": 1250.75,
    "fechaCondensada": "4609",
    "montoCondensado": 7,
    "digitoVerificador": "23"
  },
  "timestamp": "2026-06-04T18:00:00.000Z"
}
```

Campos de salida:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lineaCaptura` | string | Referencia SPEI de 15 posiciones. |
| `referencia4` | string | Primeras 4 posiciones, formadas por orgánica 0 + orgánica 1. |
| `fechaLimite` | string | Fecha límite calculada como hoy + 5 días. |
| `importe` | number | Importe usado para generar la referencia. |
| `fechaCondensada` | string | Fecha condensada usada en la referencia. |
| `montoCondensado` | number | Monto condensado usado en la referencia. |
| `digitoVerificador` | string | Dígito verificador Base 97. |

## 2. Recuperar una Línea Pendiente

`POST /v1/aplicaciones-qna/linea-captura-periodo`

Este endpoint es de recuperación. La aplicación QNA genera la línea automáticamente después del `COMMIT` Firebird y antes de marcar la bitácora `TERMINADO`. El frontend solo usa este `POST` cuando la bitácora conserva `Accion = APLICAR` y reporta `Resultado = PENDIENTE`.

### Entrada

Body para usuario no admin:

```json
{
  "periodo": "1026"
}
```

Body para admin:

```json
{
  "periodo": "1026",
  "idOrg0": "04",
  "idOrg1": "44"
}
```

Parámetros:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `periodo` | string | Sí | Período en formato `QQAA`, ejemplo `1026`. |
| `idOrg0` | string | Solo admin | Orgánica nivel 0. Usuarios no admin no deben enviarla. |
| `idOrg1` | string | Solo admin | Orgánica nivel 1. Usuarios no admin no deben enviarla. |

Reglas:

- Usuarios no admin usan `idOrganica0` e `idOrganica1` del token.
- Si un usuario no admin envía `idOrg0` o `idOrg1`, responde `403 FORBIDDEN_ORGANICA_QUERY`.
- Admin puede enviar `idOrg0` e `idOrg1`; si no los envía, se intenta usar el token.
- `periodo` se interpreta como `QQAA`; ejemplo `1026` equivale a quincena 10 del año 2026.
- El importe se calcula exclusivamente desde los históricos SQL Server; el frontend no lo envía.
- Solo se permite cuando la bitácora está en `APLICAR/PENDIENTE` o para recuperar una línea faltante de una QNA `TERMINADO`.
- Al recuperar correctamente una línea pendiente, el backend cambia la bitácora a `TERMINADO`.
- La fecha final del período se calcula con la quincena.
- La vigencia se determina con el primer `dbo.EventoCalendario` donde `tipo = 'PAGO'` y `fecha > fechaFinalPeriodo`.
- Si no existe evento `PAGO` posterior, responde `400 PAGO_EVENT_NOT_FOUND`.
- La línea se reutiliza si ya existe una fila `VIGENTE` por `Org0`, `Org1`, `Periodo` e `Importe`.

### Salida

Respuesta `201` si se creó una línea nueva.

Respuesta `200` si se reutilizó una línea vigente.

```json
{
  "success": true,
  "data": {
    "lineaCapturaPeriodoId": 1,
    "org0": "04",
    "org1": "44",
    "periodo": "1026",
    "quincena": 10,
    "anio": 2026,
    "importe": 1250.75,
    "lineaCaptura": "044406264605723",
    "referencia4": "0444",
    "fechaInicioPeriodo": "2026-05-16",
    "fechaFinalPeriodo": "2026-05-31",
    "fechaInicioVigencia": "2026-06-04",
    "fechaFinVigencia": "2026-06-05",
    "fechaReferenciaValidacion": "2026-06-05",
    "tipoReferenciaValidacion": "PAGO",
    "fechaLimite": "2026-06-05",
    "fechaCondensada": "4605",
    "montoCondensado": 7,
    "digitoVerificador": "23",
    "usuarioId": "1601433E-F36B-1410-80A7-00A5CBF95890",
    "estatus": "VIGENTE",
    "reutilizada": false,
    "createdAt": "2026-06-04T18:00:00.000Z",
    "updatedAt": null
  },
  "timestamp": "2026-06-04T18:00:00.000Z"
}
```

Campos de salida:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lineaCapturaPeriodoId` | number | Id de la fila en `pagos.LineaCapturaPeriodo`. |
| `org0` | string | Orgánica nivel 0 usada. |
| `org1` | string | Orgánica nivel 1 usada. |
| `periodo` | string | Período `QQAA`. |
| `quincena` | number | Quincena derivada del período. |
| `anio` | number | Año derivado del período. |
| `importe` | number | Importe usado para generar o reutilizar la línea. |
| `lineaCaptura` | string | Referencia SPEI de 15 posiciones. |
| `referencia4` | string | Orgánica 0 + orgánica 1. |
| `fechaInicioPeriodo` | string | Fecha inicial calculada del período. |
| `fechaFinalPeriodo` | string | Fecha final calculada del período. |
| `fechaInicioVigencia` | string | Fecha en que inicia la vigencia. |
| `fechaFinVigencia` | string | Fecha del evento `PAGO` que cierra vigencia. |
| `fechaReferenciaValidacion` | string | Misma fecha del evento `PAGO` usado para validar. |
| `tipoReferenciaValidacion` | string | Valor fijo `PAGO`. |
| `fechaLimite` | string | Fecha límite usada para generar la línea. |
| `fechaCondensada` | string | Fecha condensada usada en la referencia. |
| `montoCondensado` | number | Monto condensado usado en la referencia. |
| `digitoVerificador` | string | Dígito verificador Base 97. |
| `usuarioId` | string/null | Usuario que generó la línea. |
| `estatus` | string | Estatus de la línea, normalmente `VIGENTE`. |
| `reutilizada` | boolean | `true` si ya existía; `false` si se creó. |
| `createdAt` | string/null | Fecha de creación en SQL Server. |
| `updatedAt` | string/null | Fecha de última actualización, si aplica. |

## 3. Consultar Vigente por Período

`GET /v1/aplicaciones-qna/linea-captura-periodo`

Consulta una línea de captura `VIGENTE` por período y orgánica.

### Entrada

Usuario no admin:

```http
GET /v1/aplicaciones-qna/linea-captura-periodo?periodo=1026
```

Admin:

```http
GET /v1/aplicaciones-qna/linea-captura-periodo?periodo=1026&org0=04&org1=44
```

Query params:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `periodo` | string | Sí | Período en formato `QQAA`, ejemplo `1026`. |
| `org0` | string | Solo admin | Orgánica nivel 0. |
| `org1` | string | Solo admin | Orgánica nivel 1. |

Reglas:

- Usuarios no admin no deben enviar `org0` ni `org1`; se usan las orgánicas del token.
- Si un usuario no admin envía `org0` u `org1`, responde `403 FORBIDDEN_ORGANICA_QUERY`.
- Usuarios admin deben enviar `org0` y `org1`.
- Esta consulta no recibe `importe`.

### Salida

Respuesta `200` con línea vigente:

```json
{
  "success": true,
  "data": {
    "lineaCapturaPeriodoId": 1,
    "org0": "04",
    "org1": "44",
    "periodo": "1026",
    "quincena": 10,
    "anio": 2026,
    "importe": 1250.75,
    "lineaCaptura": "044406264605723",
    "referencia4": "0444",
    "fechaInicioPeriodo": "2026-05-16",
    "fechaFinalPeriodo": "2026-05-31",
    "fechaInicioVigencia": "2026-06-04",
    "fechaFinVigencia": "2026-06-05",
    "fechaReferenciaValidacion": "2026-06-05",
    "tipoReferenciaValidacion": "PAGO",
    "fechaLimite": "2026-06-05",
    "fechaCondensada": "4605",
    "montoCondensado": 7,
    "digitoVerificador": "23",
    "usuarioId": "1601433E-F36B-1410-80A7-00A5CBF95890",
    "estatus": "VIGENTE",
    "reutilizada": true,
    "createdAt": "2026-06-04T18:00:00.000Z",
    "updatedAt": null
  },
  "timestamp": "2026-06-04T18:00:00.000Z"
}
```

Si no existe línea vigente:

```json
{
  "success": true,
  "data": null,
  "timestamp": "2026-06-04T18:00:00.000Z"
}
```

## Errores Relevantes

| Código | HTTP | Descripción |
|--------|------|-------------|
| `VALIDATION_ERROR` | 400 | Body o query inválido. |
| `MISSING_ORGANICA_KEYS` | 400 | No fue posible resolver orgánicas o admin no envió `org0/org1` en consulta. |
| `PERIODO_INVALIDO` | 400 | Período inválido o quincena fuera de `01` a `24`. |
| `PAGO_EVENT_NOT_FOUND` | 400 | No existe evento `PAGO` posterior al final del período. |
| `FORBIDDEN_ORGANICA_QUERY` | 403 | Usuario no admin envió orgánicas en la solicitud. |
