# Frontend: validar aplicacion QNA y obtener aportaciones

## Endpoint

```http
GET /v1/aplicacion-quincenal/validar-aplicacion-qna-aportaciones?periodo=1026
```

Admin puede consultar otra entidad enviando organicas:

```http
GET /v1/aplicacion-quincenal/validar-aplicacion-qna-aportaciones?organica0=04&organica1=44&periodo=1026
```

## Autenticacion

Requiere JWT.

```http
Authorization: Bearer <token>
```

## Reglas de organica

- Si el usuario NO es `admin`, no debe enviar `organica0` ni `organica1`.
- Si el usuario NO es `admin`, el backend usa las organicas del token:
  - `req.user.idOrganica0`
  - `req.user.idOrganica1`
- Si el usuario es `admin`, puede enviar `organica0` y `organica1` en query string.
- Si un usuario no admin envia `organica0` o `organica1`, el backend responde `403`.

## Query params

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `periodo` | string | Si | Periodo en formato `QQAA`. Ejemplo: `1026`. |
| `organica0` | string | Solo admin | Clave organica 0. Ejemplo: `04`. |
| `organica1` | string | Solo admin | Clave organica 1. Ejemplo: `44`. |

## Criterio de aplicacion

El backend considera aplicada una quincena solo si existe un registro en `afec.BitacoraAfectacionOrg` con:

```sql
Entidad = 'AFILIADOS'
Org0 = @organica0
Org1 = @organica1
Quincena = @quincena
Anio = @anio
Accion = 'TERMINADO'
```

Para `periodo=1026`:

- `quincena = 10`
- `anio = 2026`

## Respuesta cuando no esta aplicada

```json
{
  "ok": true,
  "data": {
    "aplicada": false,
    "organica0": "04",
    "organica1": "44",
    "periodo": "1026",
    "quincena": 10,
    "anio": 2026,
    "bitacora": null,
    "parametrosAplicacion": null,
    "aportaciones": null,
    "totales": null
  }
}
```

## Respuesta cuando esta aplicada

```json
{
  "ok": true,
  "data": {
    "aplicada": true,
    "organica0": "04",
    "organica1": "44",
    "periodo": "1026",
    "quincena": 10,
    "anio": 2026,
    "bitacora": {
      "afectacionId": 123,
      "entidad": "AFILIADOS",
      "anio": 2026,
      "quincena": 10,
      "accion": "TERMINADO",
      "organica0": "04",
      "organica1": "44",
      "organica2": null,
      "organica3": null,
      "resultado": "OK",
      "mensaje": "Proceso QNA completado...",
      "usuario": "...",
      "userId": null,
      "appName": "...",
      "ip": "...",
      "userAgent": "...",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "modifiedAt": "2026-01-01T00:00:00.000Z"
    },
    "parametrosAplicacion": {
      "aplicarC": {
        "sp": "AP_P_APLICAR",
        "org0": "04",
        "org1": "44",
        "quincenaC": "1026",
        "quincenaA": "1026",
        "tipo": "C"
      },
      "aplicarF": {
        "sp": "AP_P_APLICAR",
        "org0": "04",
        "org1": "44",
        "quincenaC": "1026",
        "quincenaA": "1026",
        "tipo": "F"
      }
    },
    "aportaciones": {
      "ahorro": [],
      "vivienda": [],
      "prestaciones": [],
      "cair": [],
      "transitorio": [],
      "guarderias": [],
      "aguinaldo": [],
      "detalleAguinaldo": [],
      "resumen": []
    },
    "totales": {
      "ahorro": 0,
      "vivienda": 0,
      "prestaciones": 0,
      "cair": 0,
      "transitorio": 0,
      "guarderias": 0,
      "aguinaldo": 0,
      "detalleAguinaldo": 0,
      "resumen": 0
    }
  }
}
```

## Tablas consultadas

Cuando `aplicada = true`, el backend regresa todos los registros de:

| Propiedad response | Tabla SQL Server |
|--------------------|------------------|
| `aportaciones.ahorro` | `aportaciones.IndividualesAhorroHistorico` |
| `aportaciones.vivienda` | `aportaciones.IndividualesViviendaHistorico` |
| `aportaciones.prestaciones` | `aportaciones.IndividualesPrestacionesHistorico` |
| `aportaciones.cair` | `aportaciones.IndividualesCairHistorico` |
| `aportaciones.transitorio` | `aportaciones.PensionNominaTransitorioHistorico` |
| `aportaciones.guarderias` | `aportaciones.GuarderiasHistorico` |
| `aportaciones.aguinaldo` | `aportaciones.AguinaldoHistorico` |
| `aportaciones.detalleAguinaldo` | `aportaciones.DetalleHistoricoAguinaldo` |
| `aportaciones.resumen` | `aportaciones.ResumenHistorico` |

## Errores esperados

### 400 periodo invalido

```json
{
  "ok": false,
  "error": {
    "code": "PERIODO_INVALIDO",
    "message": "periodo debe tener formato QQAA y quincena válida de 01 a 24."
  }
}
```

### 400 organicas faltantes

```json
{
  "ok": false,
  "error": {
    "code": "MISSING_ORGANICA_KEYS",
    "message": "organica0 y organica1 son requeridas en el token, o en query string para usuarios admin."
  }
}
```

### 403 no admin enviando organicas

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN_ORGANICA_QUERY",
    "message": "Solo usuarios admin pueden enviar organica0/organica1. Use las organicas del token."
  }
}
```

## Ejemplo fetch

```ts
const response = await fetch('/v1/aplicacion-quincenal/validar-aplicacion-qna-aportaciones?periodo=1026', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const result = await response.json();

if (result.ok && result.data.aplicada) {
  console.log(result.data.aportaciones.ahorro);
}
```
