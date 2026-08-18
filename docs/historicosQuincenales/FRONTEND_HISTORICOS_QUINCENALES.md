# Frontend - Historicos Quincenales

## Objetivo

Consultar historicos ya guardados en SQL Server. Este modulo no consulta Firebird.

Base URL backend:

`/v1/historicos-quincenales`

Todos los endpoints requieren Bearer token.

## Reglas Generales

- `periodo` es requerido y usa formato `QQAA`, ejemplo `0626`.
- El backend interpreta `0626` como `quincena=6` y `anio=2026`.
- No se convierte a `2606`; estas tablas SQL Server guardan `quincena` y `anio` separados.
- Si `org0` y `org1` no se envian, el backend los toma del token.
- `org0` y `org1` aceptan 1 a 2 caracteres alfanumericos, ejemplo `04`, `24`, `A2`.
- `page` default: `1`.
- `pageSize` default: `100`, maximo `500`.
- `buscar` es opcional y aplica solo en columnas disponibles del tipo consultado.

## Query Params

| Parametro | Tipo | Requerido | Comentario |
|---|---|---:|---|
| `periodo` | string | si | Formato `QQAA`, ejemplo `0626` |
| `org0` | string | no | Si no viene, se toma del token |
| `org1` | string | no | Si no viene, se toma del token |
| `buscar` | string | no | Busca por nombre/RFC/empleado/interno segun tipo |
| `page` | number | no | Default `1` |
| `pageSize` | number | no | Default `100`, max `500` |

## Respuesta Estandar

```json
{
  "ok": true,
  "data": [],
  "meta": {
    "grupo": "retenciones",
    "tipo": "pcp",
    "tabla": "retenciones.PrestamosCortoPlazoHistorico",
    "org0": "04",
    "org1": "24",
    "periodo": "0626",
    "quincena": 6,
    "anio": 2026,
    "page": 1,
    "pageSize": 100,
    "total": 0,
    "totalPages": 0
  }
}
```

## Aportaciones

### Ahorro

`GET /v1/historicos-quincenales/aportaciones/ahorro?periodo=0626`

Tabla: `aportaciones.IndividualesAhorroHistorico`

### Vivienda

`GET /v1/historicos-quincenales/aportaciones/vivienda?periodo=0626`

Tabla: `aportaciones.IndividualesViviendaHistorico`

### Prestaciones

`GET /v1/historicos-quincenales/aportaciones/prestaciones?periodo=0626`

Tabla: `aportaciones.IndividualesPrestacionesHistorico`

### CAIR

`GET /v1/historicos-quincenales/aportaciones/cair?periodo=0626`

Tabla: `aportaciones.IndividualesCairHistorico`

### Pension Nomina Transitorio

`GET /v1/historicos-quincenales/aportaciones/transitorio?periodo=0626`

Tabla: `aportaciones.PensionNominaTransitorioHistorico`

### Guarderias

`GET /v1/historicos-quincenales/aportaciones/guarderias?periodo=0626`

Tabla: `aportaciones.GuarderiasHistorico`

### Aguinaldo

`GET /v1/historicos-quincenales/aportaciones/aguinaldo?periodo=0626`

Tabla: `aportaciones.AguinaldoHistorico`

### Detalle Aguinaldo

`GET /v1/historicos-quincenales/aportaciones/detalle-aguinaldo?periodo=0626`

Tabla: `aportaciones.DetalleHistoricoAguinaldo`

### Resumen Aportaciones

`GET /v1/historicos-quincenales/aportaciones/resumen?periodo=0626`

Tabla: `aportaciones.ResumenHistorico`

## Retenciones

### Prestamos Corto Plazo

`GET /v1/historicos-quincenales/retenciones/pcp?periodo=0626`

Tabla: `retenciones.PrestamosCortoPlazoHistorico`

### Prestamos Mediano Plazo

`GET /v1/historicos-quincenales/retenciones/pmp?periodo=0626`

Tabla: `retenciones.PrestamosMedianoPlazoHistorico`

### Prestamos Hipotecarios

`GET /v1/historicos-quincenales/retenciones/hip?periodo=0626`

Tabla: `retenciones.PrestamosHipotecariosHistorico`

### Resumen Retenciones

`GET /v1/historicos-quincenales/retenciones/resumen?periodo=0626`

Tabla: `retenciones.ResumenHistorico`

## Ejemplo Usuario Entidad

El frontend solo envia `periodo`; `org0/org1` salen del token.

```http
GET /v1/historicos-quincenales/retenciones/pcp?periodo=0626&page=1&pageSize=100
Authorization: Bearer <token>
```

## Ejemplo Admin

El frontend puede enviar `org0/org1` para consultar otra organica.

```http
GET /v1/historicos-quincenales/retenciones/pcp?periodo=0626&org0=04&org1=24&page=1&pageSize=100
Authorization: Bearer <token>
```

## Ejemplo Con Busqueda

```http
GET /v1/historicos-quincenales/aportaciones/aguinaldo?periodo=0626&buscar=RFC_O_NOMBRE&page=1&pageSize=50
Authorization: Bearer <token>
```

## UI Recomendada

- Crear tabs por grupo: `Aportaciones` y `Retenciones`.
- Dentro de cada grupo, cargar cada tipo bajo demanda.
- Usar `meta.total` para paginacion.
- Mostrar `meta.tabla` solo en modo diagnostico o soporte.
- No mezclar estos endpoints con `/reportes/aplicaciones-qna/*`, porque esos consultan Firebird.
