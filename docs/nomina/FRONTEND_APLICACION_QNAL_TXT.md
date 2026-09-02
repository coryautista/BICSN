# Frontend - Aplicacion Quincenal TXT

## Endpoints

Todos requieren Bearer token.

El backend valida `anio` y `quincena` contra Firebird usando el SP `AP_G_APLICADO_TIPO` con las organicas resueltas para el usuario.

Parametros que el backend toma del token:

| Claim | Uso |
|---|---|
| `sub` | Se guarda como `UsuarioRegistro` en `NominaAplicacionQnalCarga` |
| `entidades` | Define si el usuario debe usar organicas del token |
| `idOrganica0` | Organica 0 del usuario |
| `idOrganica1` | Organica 1 del usuario |
| `idOrganica2` | Organica 2 del usuario |
| `idOrganica3` | Organica 3 del usuario |

El token actual no incluye `entidadId`; si el frontend no lo envia, el backend usa `entidadId=1` por defecto.

### Cargar TXT

`POST /v1/nomina/aplicacion-qnal-txt/cargar`

Content-Type: `multipart/form-data`

Campos:

| Campo | Tipo | Requerido |
|---|---|---:|
| `file` | archivo `.txt` | si |
| `entidadId` | number | no, default `1` |
| `anio` | number | si |
| `quincena` | number 1-24 | si |
| `organica0` | string | solo usuarios no entidad |
| `organica1` | string | solo usuarios no entidad |
| `organica2` | string | solo usuarios no entidad |
| `organica3` | string | solo usuarios no entidad |

Para usuarios entidad, el backend toma `organica0-3` desde el token o usuario autenticado. El frontend no debe enviarlas en ese caso.

Para usuarios no entidad/admin, el frontend puede enviar `organica0-3` en el formulario. Si no las envia, el backend intenta usar las organicas del token como respaldo.

Respuesta aceptada: `201`

```json
{
  "ok": true,
  "data": {
    "cargaId": "4",
    "estado": "ACEPTADA",
    "totalRegistros": 162,
    "totalErrores": 0,
    "errores": []
  }
}
```

Respuesta rechazada por validacion: `422`

```json
{
  "ok": false,
  "data": {
    "cargaId": 124,
    "estado": "RECHAZADA",
    "totalRegistros": 162,
    "totalErrores": 1,
    "errores": [
      {
        "numeroLinea": 0,
        "campo": "anio/quincena",
        "mensaje": "La carga corresponde a 2026/7, pero la quincena vigente es 2026/8."
      }
    ]
  }
}
```

Errores operativos: `409` o `503`

```json
{
  "ok": false,
  "error": {
    "code": "NOMINA_FIREBIRD_SCOPE_EXISTENTE",
    "message": "NOMINA_FIREBIRD_SCOPE_EXISTENTE"
  }
}
```

- `409` representa un conflicto conocido, por ejemplo un scope Firebird ocupado o una liquidacion oficial que ya bloquea el reemplazo.
- `503` representa una falla de sincronizacion con Firebird. No confirma la carga y nunca debe interpretarse como exito.
- El frontend debe conservar y mostrar `error.message` cuando el backend lo proporcione.
- Un timeout, una respuesta malformada o cualquier estado distinto de `201` y `422` se trata como error de envio.

### Consultar Registros Vigentes

`GET /v1/nomina/aplicacion-qnal-txt/registros`

Uso: consulta los registros vigentes ya cargados para una combinacion de `entidadId`, `anio`, `quincena` y organicas.

Query params:

| Parametro | Tipo | Requerido |
|---|---|---:|
| `entidadId` | number | no, default `1` |
| `anio` | number | si |
| `quincena` | number 1-24 | si |
| `organica0` | string | solo usuarios no entidad |
| `organica1` | string | solo usuarios no entidad |
| `organica2` | string | solo usuarios no entidad |
| `organica3` | string | solo usuarios no entidad |
| `buscar` | string | no |
| `page` | number | no, default 1 |
| `pageSize` | number | no, default 50, max 200 |

`buscar` filtra por `RFC`, `ClavePersonal` o `NombreAfiliado`.

Para usuarios entidad, la consulta usa las organicas del token. Para usuarios no entidad/admin, la consulta usa las organicas enviadas en query params; si no se envian, intenta usar las organicas del token como respaldo.

Ejemplo usuario entidad:

```http
GET /v1/nomina/aplicacion-qnal-txt/registros?entidadId=1&anio=2026&quincena=7&page=1&pageSize=50
Authorization: Bearer <token>
```

Tambien valido para usuario entidad, usando `entidadId=1` por defecto:

```http
GET /v1/nomina/aplicacion-qnal-txt/registros?anio=2026&quincena=7&page=1&pageSize=50
Authorization: Bearer <token>
```

Ejemplo usuario no entidad/admin:

```http
GET /v1/nomina/aplicacion-qnal-txt/registros?entidadId=1&anio=2026&quincena=7&organica0=04&organica1=24&organica2=01&organica3=01&page=1&pageSize=50
Authorization: Bearer <token>
```

Ejemplo con busqueda:

```http
GET /v1/nomina/aplicacion-qnal-txt/registros?entidadId=1&anio=2026&quincena=7&buscar=RFC_O_NOMBRE&page=1&pageSize=20
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "ok": true,
  "data": [
    {
      "Id": "1",
      "CargaId": "4",
      "EntidadId": 1,
      "Anio": 2026,
      "Quincena": 7,
      "Organica0": "04",
      "Organica1": "24",
      "Organica2": "01",
      "Organica3": "01",
      "LineaNumero": 2,
      "Lote": "...",
      "TipoRegistro": "2",
      "ClavePersonal": "...",
      "RFC": "...",
      "NombreAfiliado": "...",
      "BaseCotizacionSueldo": 0,
      "BaseCotizacionQuinquenios": 0,
      "SueldoMensual": 0,
      "DiasLaborados": 0,
      "AportacionAfiliadoFondoAhorro": 0,
      "AportacionEntidadFondoAhorro": 0,
      "AportacionAfiliadoEBI": 0,
      "AportacionEntidadEBI": 0,
      "FechaRegistro": "2026-05-19T05:52:04.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 162,
    "totalPages": 4
  }
}
```

Notas de respuesta:

- Los nombres de propiedades vienen como columnas SQL Server.
- `LineaOriginal` puede venir en la respuesta y sirve para auditoria; no es necesario mostrarlo en tablas normales.
- Para grillas, se recomienda mostrar al menos `ClavePersonal`, `RFC`, `NombreAfiliado`, `SueldoMensual`, `BaseCotizacionSueldo`, `DiasLaborados` y aportaciones/descuentos principales.

## Notas De UI

- Antes de cargar, pedir `anio` y `quincena`. `entidadId` es opcional y por defecto es `1`.
- Pedir `organica0-3` solo para usuarios no entidad/admin cuando necesiten consultar una organica distinta a la de su token.
- El usuario ejecutor no se manda desde frontend; el backend lo toma del token y lo guarda en `UsuarioRegistro` de `NominaAplicacionQnalCarga`.
- El frontend no debe calcular ni inferir la quincena vigente; el backend la valida contra Firebird.
- El modal de validacion se cierra unicamente con `201`, `ok=true` y `data.estado=ACEPTADA`.
- Mostrar `data.errores` dentro del modal cuando el backend responda `422`; el modal permanece abierto.
- Mostrar dentro del mismo modal el mensaje operativo recibido con `409`, `503` o timeout; el modal permanece abierto y permite reintentar o cerrar.
- El resultado aceptado se presenta fuera del modal después de confirmar la carga.
- Una respuesta `201` o `422` cuyo cuerpo no coincida con su estado esperado se trata como error y no modifica el estado visual de carga vigente.
- Una carga aceptada reemplaza los registros vigentes del mismo filtro.
- Una carga rechazada no modifica registros vigentes.
- El backend rellena organicas de 1 digito con cero a la izquierda.

Implementacion vigente en Frontend Entidad:

```text
src/services/nomina/aplicacion-qnal-txt.api.ts
src/features/archivo-nomina/useArchivoNomina.hooks.ts
src/widgets/archivo-nomina/ArchivoNominaWidget.tsx
```

## Prueba Real Ejecutada

Archivo: `docs/nomina/07 OC Y FG 2026.txt`

Usuario: `capturistaISSSSPEA`

Token usado por backend:

- `UsuarioRegistro`: `1601433E-F36B-1410-80A7-00A5CBF95890`
- `organica0`: `04`
- `organica1`: `24`
- `organica2`: `01`
- `organica3`: `01`

Formulario enviado:

| Campo | Valor |
|---|---|
| `file` | `07 OC Y FG 2026.txt` |
| `entidadId` | `1` opcional |
| `anio` | `2026` |
| `quincena` | `7` |

Resultado:

```json
{
  "ok": true,
  "data": {
    "cargaId": "4",
    "estado": "ACEPTADA",
    "totalRegistros": 162,
    "totalErrores": 0,
    "errores": []
  }
}
```
