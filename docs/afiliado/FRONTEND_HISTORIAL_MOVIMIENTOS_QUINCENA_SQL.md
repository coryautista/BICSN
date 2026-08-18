# Histórico de Movimientos por Quincena

## Endpoint

```http
GET /v1/afiliado/historial-movimientos-quincena
```

Consulta SQL Server y devuelve afiliados con `numValidacion = 7`, `afiliadosComplete = 1`, su `AfiliadoOrg`, su `Movimiento` de la quincena y el `TipoMovimiento` relacionado.

## Autenticación

Requiere token Bearer.

Si no se envían `org0` y `org1`, el backend usa las orgánicas del token:

```ts
request.user.idOrganica0
request.user.idOrganica1
```

Las orgánicas aceptan valores alfanuméricos de 1 a 2 caracteres, por ejemplo `04`, `24`, `A2`.

## Query Params

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `periodo` | string | No | Formato `QQAA`, ejemplo `0626`. Si se usa, no es necesario enviar `quincena` ni `anio`. |
| `quincena` | number | No | Quincena `1-24`. Requerida si no se envía `periodo`. |
| `anio` | number | No | Año `2000-2099`. Requerido si no se envía `periodo`. |
| `org0` | string | No | Orgánica nivel 0. Si no viene, se toma del token. |
| `org1` | string | No | Orgánica nivel 1. Si no viene, se toma del token. |
| `buscar` | string | No | Busca por nombre, apellidos, RFC, CURP, noEmpleado o interno. |
| `page` | number | No | Página. Default `1`. |
| `pageSize` | number | No | Registros por página. Default `100`, máximo `500`. |

## Periodo y QuincenaId

El frontend puede enviar `periodo=0626`.

El backend lo interpreta como:

```json
{
  "quincena": 6,
  "anio": 2026,
  "quincenaId": "2026-06"
}
```

`Movimiento.quincenaId` se filtra con formato `YYYY-QQ`.

## Ejemplo de Request

```http
GET /v1/afiliado/historial-movimientos-quincena?periodo=0626&page=1&pageSize=50
Authorization: Bearer <token>
```

Con orgánicas explícitas:

```http
GET /v1/afiliado/historial-movimientos-quincena?periodo=0626&org0=04&org1=24&page=1&pageSize=50
Authorization: Bearer <token>
```

## Respuesta

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "afiliado": {
          "id": 123,
          "folio": 456,
          "apellidoPaterno": "PEREZ",
          "apellidoMaterno": "LOPEZ",
          "nombre": "JUAN",
          "curp": "...",
          "rfc": "...",
          "numeroSeguroSocial": "...",
          "interno": 12345,
          "noEmpleado": "12345",
          "fechaAlta": "2026-03-01",
          "quincenaAplicacion": 6,
          "anioAplicacion": 2026,
          "numValidacion": 7,
          "afiliadosComplete": 1,
          "nombreStatus": "...",
          "statusDescripcion": "...",
          "statusColor": "...",
          "createdAt": "2026-05-19T00:00:00.000Z",
          "updatedAt": "2026-05-19T00:00:00.000Z"
        },
        "afiliadoOrg": {
          "id": 10,
          "afiliadoId": 123,
          "claveOrganica0": "04",
          "claveOrganica1": "24",
          "claveOrganica2": "01",
          "claveOrganica3": "01",
          "interno": 12345,
          "sueldo": 10000,
          "otrasPrestaciones": 0,
          "quinquenios": 0,
          "activo": true,
          "fechaMovAlt": "2026-03-01",
          "aplicar": true,
          "bc": null,
          "porcentaje": null,
          "createdAt": "2026-05-19T00:00:00.000Z",
          "updatedAt": "2026-05-19T00:00:00.000Z"
        },
        "movimiento": {
          "id": 99,
          "quincenaId": "2026-06",
          "tipoMovimientoId": 1,
          "afiliadoId": 123,
          "fecha": "2026-03-01",
          "observaciones": null,
          "folio": "...",
          "estatus": "A",
          "creadoPor": null,
          "creadoPorUid": "...",
          "createdAt": "2026-05-19T00:00:00.000Z"
        },
        "tipoMovimiento": {
          "id": 1,
          "abreviatura": "AL",
          "nombre": "Alta"
        }
      }
    ],
    "meta": {
      "org0": "04",
      "org1": "24",
      "periodo": "0626",
      "quincena": 6,
      "anio": 2026,
      "quincenaId": "2026-06",
      "numValidacion": 7,
      "afiliadosComplete": 1,
      "page": 1,
      "pageSize": 50,
      "total": 123,
      "totalPages": 3
    }
  }
}
```

## Filtros Aplicados por Backend

```sql
ao.claveOrganica0 = @org0
AND ao.claveOrganica1 = @org1
AND a.numValidacion = 7
AND a.afiliadosComplete = 1
AND a.estatus = 1
AND a.quincenaAplicacion = @quincena
AND a.anioAplicacion = @anio
AND m.quincenaId = @quincenaId
```

## Estados HTTP

| Status | Caso |
| --- | --- |
| `200` | Consulta correcta. Puede devolver `items: []`. |
| `400` | Parámetros inválidos, orgánicas faltantes, periodo inválido. |
| `401` | Token ausente o inválido. |
| `500` | Error interno al consultar SQL Server. |
