# Entrega de rendimiento en movimientos de afiliados

## Campo nuevo

`entregaRendimiento` se captura y consulta dentro del objeto `movimiento`.

Valores permitidos:

- `Si`
- `No`
- `null`

El backend acepta `Si`, `SI`, `si`, `Sí`, `sí`, `No`, `NO`, `no` y guarda/responde `Si` o `No`.

## Endpoints de captura

Enviar `entregaRendimiento` en el body de estos endpoints:

- `POST /v1/afiliado/complete`
- `POST /v1/afiliado/cambio-sueldo`
- `POST /v1/afiliado/baja-permanente`
- `POST /v1/afiliado/baja-suspension`
- `POST /v1/afiliado/baja-termina-suspension`
- `POST /v1/afiliado/baja-termina-suspension-y-baja`

Ejemplo:

```json
{
  "entregaRendimiento": "Si"
}
```

El campo es opcional. Si no se envía, se guarda `null`.

## Respuestas

Los endpoints de captura regresan el campo dentro de `data.movimiento`:

```json
{
  "ok": true,
  "data": {
    "movimiento": {
      "id": 123,
      "tipoMovimientoId": 1,
      "observaciones": null,
      "entregaRendimiento": "Si"
    }
  }
}
```

## Endpoints de consulta SQL

También se regresa en:

- `GET /v1/afiliado/obtener-movimientos-quincenales`
- `GET /v1/afiliado/historial-movimientos-quincena`

Ubicación en respuesta:

```json
{
  "movimiento": {
    "entregaRendimiento": "No"
  }
}
```

## UI sugerida

Usar un selector con tres estados:

- Sin seleccionar: `null`
- Si: `Si`
- No: `No`

Evitar enviar booleanos (`true`/`false`), porque el contrato del backend es texto `Si`/`No`.
