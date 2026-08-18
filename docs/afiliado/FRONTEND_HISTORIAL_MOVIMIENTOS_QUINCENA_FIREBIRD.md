# Histórico de Movimientos por Quincena Firebird

## Endpoint

```http
GET /v1/afiliado/historial-movimientos-quincena-firebird
```

Consulta los movimientos del periodo para la orgánica consultada en Firebird.

## Fuente de datos

- `HISTORIAL_MOVIMIENTOS_QUIN_IND(periodo, org0, org1)` para los movimientos.
- `PERSONAL` para datos de persona por `INTERNO`.
- `ORG_PERSONAL` para datos orgánicos por `INTERNO + ORG0 + ORG1 + ORG2 + ORG3` del movimiento.

## Autenticación

Requiere token Bearer. Si `org0` y `org1` no se envían, se toman del token:

```ts
request.user.idOrganica0
request.user.idOrganica1
```

## Query Params

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `periodo` | string | Sí | Formato `QQAA`, ejemplo `0526`. |
| `org0` | string | No | Orgánica nivel 0. Si no viene, se toma del token. |
| `org1` | string | No | Orgánica nivel 1. Si no viene, se toma del token. |
| `buscar` | string | No | Busca por interno, nombre, noEmpleado, RFC, clave o nombre de movimiento. |
| `page` | number | No | Página. Default `1`. |
| `pageSize` | number | No | Registros por página. Default `100`, máximo `500`. |

## Ejemplo

```http
GET /v1/afiliado/historial-movimientos-quincena-firebird?periodo=0526&page=1&pageSize=50
Authorization: Bearer <token>
```

Con orgánica explícita:

```http
GET /v1/afiliado/historial-movimientos-quincena-firebird?periodo=0526&org0=04&org1=24&page=1&pageSize=50
Authorization: Bearer <token>
```

## Respuesta

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "persona": {
          "interno": 12345,
          "curp": "...",
          "rfc": "...",
          "noempleado": "...",
          "nombre": "JUAN",
          "apellidoPaterno": "PEREZ",
          "apellidoMaterno": "LOPEZ",
          "fechaNacimiento": "1980-01-01",
          "seguroSocial": "...",
          "sexo": "H",
          "estadoCivil": "S",
          "fechaAlta": "2026-01-01",
          "email": null,
          "celular": null,
          "expediente": null,
          "fullname": "JUAN PEREZ LOPEZ"
        },
        "orgPersonal": {
          "interno": 12345,
          "claveOrganica0": "04",
          "claveOrganica1": "24",
          "claveOrganica2": "01",
          "claveOrganica3": "01",
          "sueldo": 10000,
          "otrasPrestaciones": 0,
          "quinquenios": 0,
          "activo": "A",
          "fechaMovAlt": "2026-01-01",
          "orgs1": null,
          "orgs2": null,
          "orgs3": null,
          "orgs": null,
          "dSueldo": null,
          "dOtrasPrestaciones": null,
          "dQuinquenios": null,
          "aplicar": null,
          "bc": "B",
          "porcentaje": 100
        },
        "historial": {
          "interno": 12345,
          "consecutivo": 1,
          "cveMovimiento": "AL",
          "nomMovimiento": "ALTA",
          "nombre": "JUAN PEREZ LOPEZ",
          "noEmpleado": "...",
          "rfc": "...",
          "sA": 0,
          "opA": 0,
          "qA": 0,
          "sN": 10000,
          "opN": 0,
          "qN": 0,
          "retroactivas": 0,
          "sR": 0,
          "opR": 0,
          "qR": 0,
          "org0": "04",
          "org1": "24",
          "org2": "01",
          "org3": "01",
          "nOrg0": "...",
          "nOrg1": "...",
          "nOrg2": "...",
          "nOrg3": "...",
          "usuario": "...",
          "fRealm": "..."
        }
      }
    ],
    "meta": {
      "source": "firebird",
      "procedure": "HISTORIAL_MOVIMIENTOS_QUIN_IND",
      "org0": "04",
      "org1": "24",
      "periodo": "0526",
      "page": 1,
      "pageSize": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## Notas

- `items` contiene solo movimientos del `periodo` y la orgánica consultada.
- Si no hay datos, responde `200` con `items: []`.
- La paginación se aplica sobre el resultado del procedimiento Firebird.
