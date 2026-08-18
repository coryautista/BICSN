# Días Laborados Desde Nómina TXT

## Parámetro

Los endpoints de aportaciones aceptan el parámetro opcional:

```http
usarDiasLaboradosNomina=1
```

Solo el valor exacto `1` activa la búsqueda en nómina TXT. Si el parámetro no viene o viene con cualquier otro valor (`0`, `false`, vacío, etc.), el backend usa siempre `15` días.

## Endpoints

```http
GET /v1/aportacionesFondos/individuales/ahorro?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/individuales/vivienda?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/individuales/prestaciones?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/individuales/cair?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/individuales/aguinaldo?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/pension-nomina-transitorio?usarDiasLaboradosNomina=1
GET /v1/aportacionesFondos/aportacion-guarderias?usarDiasLaboradosNomina=1
```

También se puede combinar con orgánicas explícitas cuando el usuario tiene permiso:

```http
GET /v1/aportacionesFondos/individuales/ahorro?clave_organica_0=04&clave_organica_1=24&usarDiasLaboradosNomina=1
```

## Campos Nuevos

Cada registro incluye:

```json
{
  "dias_laborados": 15,
  "dias_laborados_origen": "default"
}
```

Cuando se encuentra el RFC en la nómina TXT:

```json
{
  "dias_laborados": 12.5,
  "dias_laborados_origen": "nomina"
}
```

Valores posibles de `dias_laborados_origen`:

| Valor | Significado |
| --- | --- |
| `nomina` | Se encontró `DiasLaborados` en `NominaAplicacionQnalDetalle`. |
| `default` | Se usó el valor fijo `15`. |

## Regla Default

El backend usa `15` días cuando:

- No se envía `usarDiasLaboradosNomina`.
- Se envía con un valor distinto a `1`.
- No hay RFC en el registro.
- No existe coincidencia en la nómina TXT.
- `DiasLaborados` viene nulo, cero o inválido.

## Búsqueda En Nómina

Cuando `usarDiasLaboradosNomina=1`, el backend busca en SQL Server:

```sql
dbo.NominaAplicacionQnalDetalle
```

Filtros usados:

```sql
Anio = @anio
AND Quincena = @quincena
AND Organica0 = @org0
AND Organica1 = @org1
AND RFC IN (...)
AND DiasLaborados IS NOT NULL
```

El periodo se toma de la bitácora de aplicación del endpoint y tiene formato `QQAA`.

Ejemplo:

```text
0626 -> quincena 6, año 2026
```

## Impacto En Cálculos

Los endpoints de fórmula sí recalculan con `dias_laborados`:

```http
/individuales/ahorro
/individuales/vivienda
/individuales/prestaciones
/individuales/cair
```

Sin parámetro, siguen usando `15` días como antes.

Los endpoints Firebird no recalculan importes; solo agregan los campos de control:

```http
/individuales/aguinaldo
/pension-nomina-transitorio
/aportacion-guarderias
```

## Ejemplo De Respuesta

```json
{
  "ok": true,
  "data": {
    "tipo": "ahorro",
    "datos": [
      {
        "interno": 12345,
        "nombre": "JUAN PEREZ",
        "sueldo": 10000,
        "sueldo_base": 6250,
        "afae": 156.25,
        "afaa": 312.5,
        "total": 468.75,
        "tipo": "ahorro",
        "dias_laborados": 18.75,
        "dias_laborados_origen": "nomina"
      }
    ]
  }
}
```
