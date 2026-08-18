# Endpoint AQ_ENTIDADES_RPT_PDF

## Estado

Implementado en backend consultando la tabla Firebird `AQ_ENTIDADES_RPT_PDF`.

## Stored procedure relacionado

SP relacionado con la carga/generacion de datos:

```sql
EXECUTE PROCEDURE AQ_ENTIDADES_RPT_PDF_INSERTA ('CLAVE_ORGANICA_0', 'CLAVE_ORGANICA_1', 'PERIODO');
```

Ejemplo proporcionado:

```sql
EXECUTE PROCEDURE AQ_ENTIDADES_RPT_PDF_INSERTA ('04', '44', '1026');
```

Consulta usada por el endpoint:

```sql
SELECT *
FROM AQ_ENTIDADES_RPT_PDF r
WHERE r.CLAVE_ORGANICA_0 = ?
  AND r.CLAVE_ORGANICA_1 = ?
  AND r.PERIODO = ?
  AND r.STATUS = 'A';
```

## Endpoint implementado

```http
GET /v1/aplicacion-quincenal/entidades-rpt-pdf-inserta?organica0=04&organica1=44&periodo=1026
```

Parametros:

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `organica0` | string | No si viene en token | Clave organica 0. Normalizar con `normalizeClaveOrganica`. |
| `organica1` | string | No si viene en token | Clave organica 1. Normalizar con `normalizeClaveOrganica`. |
| `periodo` | string | Si | Periodo enviado al SP. Ejemplo: `1026`. |

Respuesta propuesta:

```json
{
  "ok": true,
  "data": []
}
```

El endpoint devuelve los registros activos (`STATUS = 'A'`) decodificados como objetos planos (`Record<string, unknown>[]`).

## Archivos modificados

- `src/modules/aplicacionQuincenal/aplicacionQuincenal.schemas.ts`
- `src/modules/aplicacionQuincenal/domain/repositories/IAplicacionQuincenalRepository.ts`
- `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts`
- `src/modules/aplicacionQuincenal/application/queries/GetEntidadesRptPdfInsertaQuery.ts`
- `src/modules/aplicacionQuincenal/aplicacionQuincenal.routes.ts`
- `src/di/container.ts`

## Implementacion realizada

1. Se agrego schema Zod `EntidadesRptPdfInsertaParamsSchema` con `organica0`, `organica1` y `periodo`.
2. Se agrego metodo en `IAplicacionQuincenalRepository`:

```ts
getEntidadesRptPdfInserta(
  organica0: string,
  organica1: string,
  periodo: string
): Promise<Record<string, unknown>[]>;
```

3. Se implemento el metodo en `AplicacionQuincenalRepository` usando Firebird parametrizado:

```ts
const sql = `
  SELECT
    r.CLAVE_ORGANICA_0,
    r.CLAVE_ORGANICA_1,
    r.CLAVE_ORGANICA_2,
    r.CLAVE_ORGANICA_3,
    r.PERIODO,
    r.FECHA_GENERACION,
    r.STATUS
  FROM AQ_ENTIDADES_RPT_PDF r
  WHERE r.CLAVE_ORGANICA_0 = ?
    AND r.CLAVE_ORGANICA_1 = ?
    AND r.PERIODO = ?
    AND r.STATUS = 'A'
`;
```

4. Se decodifican filas con `decodeFirebirdObject`.
5. Se creo `GetEntidadesRptPdfInsertaQuery` en `application/queries`.
6. Se registro `getEntidadesRptPdfInsertaQuery` en `src/di/container.ts`.
7. Se agrego ruta autenticada en `aplicacionQuincenal.routes.ts`.
8. Se usan organicas del token si `organica0`/`organica1` no vienen en query string.

## Validacion pendiente en ambiente

Validacion:

1. Probar directamente en Firebird:

```sql
SELECT
  r.CLAVE_ORGANICA_0,
  r.CLAVE_ORGANICA_1,
  r.CLAVE_ORGANICA_2,
  r.CLAVE_ORGANICA_3,
  r.PERIODO,
  r.FECHA_GENERACION,
  r.STATUS
FROM AQ_ENTIDADES_RPT_PDF r
WHERE r.CLAVE_ORGANICA_0 = '04'
  AND r.CLAVE_ORGANICA_1 = '24'
  AND r.PERIODO = '1026'
  AND r.STATUS = 'A';
```

2. Probar el endpoint con token de admin y con usuario entidad.
