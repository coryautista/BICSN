# Historico aplicacion quincena 2026-06-17

## Contexto

Resumen del ultimo flujo completo ejecutado localmente en el backend BICSN por el puerto `4000`.

## Datos generales

| Dato | Valor |
|---|---|
| Fecha | 2026-06-17 |
| Host | `localhost:4000` |
| PID backend | `58404` |
| Usuario | `1601433E-F36B-1410-80A7-00A5CBF95890` |
| Organica | `04/24` |
| Periodo | `1026` |
| Quincena | `10` |
| Anio | `2026` |
| Bitacora | `20047` |

## 1. Guardado historico de aportaciones

Endpoint ejecutado:

```http
POST /v1/aplicacion-quincenal/guardar-historico-aportaciones-desde-bd
```

Resultado:

```text
HTTP 200
Duracion: 5765 ms
```

Tipos procesados:

```text
ahorro
vivienda
prestaciones
cair
transitorio
guarderias
aguinaldo
```

Registros guardados:

```json
{
  "ahorro": 164,
  "vivienda": 164,
  "prestaciones": 164,
  "cair": 164,
  "transitorio": 0,
  "guarderias": 9,
  "aguinaldo": 0
}
```

## 2. Guardado historico de retenciones

Endpoint ejecutado:

```http
POST /v1/aplicacion-quincenal/guardar-historico-retenciones-desde-bd
```

Resultado:

```text
HTTP 200
Duracion: 3751 ms
```

Procedimientos ejecutados correctamente:

```text
AP_S_PCP
AP_S_VIV
AP_S_HIP_QNA
```

Registros guardados:

```json
{
  "prestamosCortoPlazo": 87,
  "prestamosMedianoPlazo": 23,
  "prestamosHipotecarios": 11
}
```

## 3. Aplicacion de quincena

Endpoint ejecutado:

```http
POST /v1/afiliado/aplicar-bdisssspea-qna
```

Resultado:

```text
HTTP 200
Proceso completado correctamente
Tiempo total: 11197 ms
```

Pasos ejecutados:

```text
AP_G_APLICADO_TIPO -> OK
AP_P_APLICAR tipo C -> OK
AP_P_APLICAR tipo F -> OK
BitacoraAfectacionOrg -> TERMINADO
```

Detalle de ejecuciones:

```json
{
  "obtenerQuincena": {
    "exito": true,
    "duracionMs": 33
  },
  "aplicarC": {
    "exito": true,
    "duracionMs": 6441
  },
  "aplicarF": {
    "exito": true,
    "duracionMs": 4596
  },
  "envioLayout": {
    "exito": true,
    "duracionMs": 0,
    "error": "OMITIDO"
  },
  "actualizarBitacora": {
    "exito": true,
    "duracionMs": 124
  }
}
```

## 4. Actualizacion de bitacora

Registro actualizado:

```text
AfectacionId: 20047
Accion anterior: APLICAR
Accion final: TERMINADO
Registros afectados: 1
```

Endpoint adicional ejecutado:

```http
GET /v1/afiliado/bitacora-afectacion/20047/terminado
```

Resultado:

```text
HTTP 200
Registros afectados: 1
```

## 5. Consulta final de estado

Endpoint ejecutado:

```http
GET /v1/afiliado/bitacora-accion
```

Resultado:

```json
{
  "registroId": "20047",
  "accion": "TERMINADO",
  "anio": 2026,
  "quincena": 10
}
```

## Error anterior resuelto

Antes el proceso fallaba con el siguiente error Firebird:

```text
no permission for EXECUTE access to PROCEDURE FN_AGUINALDO_DIAS_TL
```

En la ultima ejecucion local ese permiso ya no bloqueo el proceso. `AP_P_APLICAR` tipo `C` y tipo `F` terminaron correctamente.

## Conclusion

La aplicacion local de la quincena `1026` para la organica `04/24` fue exitosa.

El proceso quedo en `TERMINADO` en `BitacoraAfectacionOrg`, con historicos de aportaciones y retenciones guardados correctamente.
