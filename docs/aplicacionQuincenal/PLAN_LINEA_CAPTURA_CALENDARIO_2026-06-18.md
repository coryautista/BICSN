# Plan linea de captura y calendario 2026-06-18

## Contexto

Se reviso la regla de negocio usada para generar linea de captura por periodo y su relacion con el calendario de pagos (`dbo.EventoCalendario`).

El caso revisado fue ISSSSPEA, organica `04/24`, despues de aplicar localmente la quincena `1026`.

## Avance 2026-06-19

Se aplico el primer ajuste funcional del plan: la generacion desde frontend ya usa el endpoint persistente por periodo y el backend aplica la regla de proxima fecha de pago cuando el pago natural ya vencio.

Archivos backend modificados:

```text
src/modules/reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.ts
src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.ts
```

Archivos frontend modificados:

```text
D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/src/entities/linea-captura/linea-captura.types.ts
D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/src/features/linea-captura/linea-captura.hooks.ts
D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/src/services/linea-captura/linea-captura.types.ts
D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/src/widgets/aportaciones-proceso/resumen-aportaciones-proceso.tsx
```

Validaciones ejecutadas:

```text
Backend: npm run build OK
Frontend: npm run build OK
```

## Decision final para linea de captura

La regla autorizada final es por fecha de alta de la linea de pago:

```text
FechaLimite = primer evento PAGO con fecha >= fecha de alta de la linea de pago.
```

La misma fecha se usa en:

```text
FechaFinVigencia
FechaReferenciaValidacion
FechaLimite
```

El periodo sigue determinando:

```text
Quincena
Anio
FechaInicioPeriodo
FechaFinalPeriodo
```

Pero el periodo ya no determina la fecha limite de la linea de captura. La fecha limite depende de la fecha en que se da de alta/genera la linea y del siguiente evento `PAGO` disponible en calendario.

El boton de frontend ya no debe usar el endpoint anterior:

```http
POST /v1/aplicaciones-qna/linea-captura
```

Ahora usa el endpoint persistente:

```http
POST /v1/aplicaciones-qna/linea-captura-periodo
```

Payload enviado por frontend:

```json
{
  "periodo": "<periodo_qna>",
  "importe": 12345.67
}
```

El `periodo` se toma de `localStorage.periodo_qna`, que a su vez se llena desde:

```http
GET /v1/aplicaciones-qna/periodo-trabajo
```

Decision adicional 2026-06-19:

```text
Si ya existe una linea de captura VIGENTE para la misma organica y periodo,
no se genera una nueva.
Se devuelve la linea ya generada con reutilizada = true.
```

La reutilizacion se hace por:

```text
Org0
Org1
Periodo
Estatus = VIGENTE
```

No se filtra por importe para decidir reutilizacion. Si la linea ya existe para ese periodo, se toma la existente.

No se cancelan lineas anteriores automaticamente en este flujo.

Decision adicional 2026-06-19, ajuste final:

```text
Para lineas nuevas, no se calcula pago natural por fin de quincena.
Siempre se busca el primer PAGO >= fecha de alta de la linea.
```

Correccion aplicada 2026-06-18/19 por zona horaria:

```text
La fecha de alta de la linea debe calcularse con zona America/Mexico_City.
No debe usarse new Date().toISOString().split('T')[0] porque usa UTC y puede adelantar el dia.
```

Registro corregido manualmente en `pagos.LineaCapturaPeriodo`:

```text
LineaCapturaPeriodoId: 1
Periodo: 1026
Org0/Org1: 04/24
Importe: 560153.21
FechaLimite anterior: 2026-07-03
FechaLimite corregida: 2026-06-18
LineaCaptura corregida: 042406264635115
FechaCondensada: 4635
MontoCondensado: 1
DigitoVerificador: 15
```

Avance 2026-06-19, helpers de fecha Mexico:

```text
Se confirmo que el JWT solo trae fechas tecnicas iat/exp.
No se usaran iat/exp como fecha de negocio.
```

Backend:

```text
src/utils/sqlServerDate.ts
```

Funciones agregadas:

```text
getMexicoTodayDateOnly()
formatSqlDateOnly(value)
formatSqlDateTimeMx(value)
```

La generacion de linea de captura usa `getMexicoTodayDateOnly()` para calcular la fecha base de alta de linea en zona `America/Mexico_City`.

Frontend:

```text
D:/Proyectos/Isssspea_v2.0/front/Entidad/ISS-F-Entidad/src/shared/lib/date-mexico.ts
```

Funciones agregadas:

```text
getMexicoToday()
formatDateOnlyMx(value)
formatDateTimeMx(value)
```

El widget de aportaciones usa `formatDateOnlyMx()` para mostrar `FechaLimite` sin convertir `YYYY-MM-DD` con `new Date()`, evitando que se muestre un dia anterior por UTC.

Validaciones:

```text
Backend npm run build OK
Frontend npm run build OK
```

## Pendiente de siguiente fase

Queda pendiente implementar el avance automatico de quincena operativa:

```text
Si hoy > pagoNatural(periodoActual)
y Firebird confirma la siguiente quincena,
crear nueva BitacoraAfectacionOrg con Accion = APLICAR.
```

Rol autorizado para jefe:

```text
JefeDepartamento
```

Endpoints que deben quedar sincronizados en esa fase:

```text
GET /v1/aplicaciones-qna/periodo-trabajo
GET /v1/afiliado/bitacora-accion
```

## Estado actual de ISSSSPEA

Ultima bitacora encontrada para `04/24`:

```text
AfectacionId: 20047
Accion: TERMINADO
Anio: 2026
Quincena: 10
Periodo: 1026
ModifiedAt: 2026-06-17 22:10:59
```

Mientras esta sea la ultima bitacora, el sistema seguira mostrando el periodo `1026`.

## Regla actual implementada

La generacion de linea de captura por periodo usa el primer evento calendario tipo `PAGO` posterior al final del periodo.

Archivos relevantes:

```text
src/modules/reportes/aplicacionesQNA/application/commands/GenerateLineaCapturaPeriodoCommand.ts
src/modules/reportes/aplicacionesQNA/infrastructure/persistence/LineaCapturaPeriodoRepository.ts
```

Consulta actual:

```sql
SELECT TOP 1 CONVERT(VARCHAR(10), fecha, 23) AS fecha
FROM dbo.EventoCalendario
WHERE tipo = 'PAGO'
  AND fecha > @fechaFinalPeriodo
ORDER BY fecha ASC
```

En codigo, la fecha encontrada se usa como:

```text
FechaFinVigencia
FechaReferenciaValidacion
FechaLimite
```

## Calendario real consultado

Eventos `PAGO` encontrados en `dbo.EventoCalendario`:

```text
2026-05-06 PAGO
2026-05-20 PAGO
2026-06-03 PAGO
2026-06-18 PAGO
2026-07-03 PAGO
2026-07-20 PAGO
```

## Periodos y fechas calculadas

El formato de periodo es `QQAA`.

### Periodo 1026

```text
Quincena: 10
Anio: 2026
Rango del periodo: 2026-05-16 al 2026-05-31
Primer PAGO posterior al fin del periodo: 2026-06-03
```

Con la regla actual, la linea de captura de `1026` vence el:

```text
2026-06-03
```

### Periodo 1126

```text
Quincena: 11
Anio: 2026
Rango del periodo: 2026-06-01 al 2026-06-15
Primer PAGO posterior al fin del periodo: 2026-06-18
```

Con la regla actual, la linea de captura de `1126` vence el:

```text
2026-06-18
```

## Conclusion tecnica

La regla implementada actualmente es estricta por periodo:

```text
fecha limite = primer evento PAGO posterior a la fecha final del periodo
```

Por eso, si se genera linea de captura para `1026` despues del `2026-06-03`, la linea queda asociada a una fecha limite ya vencida.

El backend actualmente no bloquea explicitamente ese caso. Solo busca el evento `PAGO` posterior al fin del periodo y genera la referencia.

## Cuando debe pasar de 1026 a 1126

El cambio de periodo no ocurre automaticamente solo por fecha calendario.

Debe existir una nueva bitacora para `04/24` con:

```text
Quincena = 11
Anio = 2026
Accion = APLICAR
```

Mientras la ultima bitacora sea:

```text
Quincena = 10
Accion = TERMINADO
```

el sistema seguira tomando `1026` como periodo vigente para la organica.

## Decision de negocio pendiente

Hay dos reglas posibles. Se debe confirmar cual aplica.

### Opcion 1: regla estricta por calendario del periodo

La linea de captura usa siempre el primer `PAGO` posterior al fin del periodo.

Implicaciones:

```text
1026 vence 2026-06-03
1126 vence 2026-06-18
```

Si se intenta generar una linea para un periodo cuyo `PAGO` ya paso, el backend debe bloquearla con un mensaje claro.

Error propuesto:

```text
PERIODO_PAGO_VENCIDO
```

Mensaje propuesto:

```text
El periodo solicitado ya tiene fecha de pago vencida segun el calendario. Abra la siguiente quincena o solicite autorizacion para pago extemporaneo.
```

### Opcion 2: regla flexible para pagos extemporaneos

Si se genera una linea tarde, usar el primer `PAGO` posterior a la fecha actual, no solo posterior al fin del periodo.

Ejemplo:

```text
Periodo solicitado: 1026
Fecha final del periodo: 2026-05-31
Fecha actual: 2026-06-18
Primer PAGO posterior a hoy: siguiente evento PAGO disponible
```

Esta opcion permite pagos tardios, pero cambia la semantica original de la linea de captura por periodo.

Debe quedar autorizada por negocio/DBA/finanzas antes de implementarse.

## Plan recomendado

1. Mantener la regla actual como base: primer `PAGO` posterior al final del periodo.
2. Agregar validacion para no generar lineas vencidas si la fecha de pago encontrada es menor que la fecha actual.
3. Devolver error explicito `PERIODO_PAGO_VENCIDO` cuando aplique.
4. Mostrar en frontend un mensaje que indique que se debe abrir la siguiente quincena o solicitar pago extemporaneo.
5. Para avanzar de `1026` a `1126`, abrir una nueva afectacion para la organica `04/24` con quincena `11`, anio `2026`, accion `APLICAR`.
6. Si negocio confirma pagos extemporaneos, implementar una bandera o endpoint separado para usar el primer `PAGO` posterior a la fecha actual.

## Validaciones sugeridas

Consultar calendario:

```sql
SELECT CONVERT(varchar(10), fecha, 23) AS fecha, tipo, anio
FROM dbo.EventoCalendario
WHERE tipo = 'PAGO'
  AND fecha BETWEEN '2026-05-01' AND '2026-07-31'
ORDER BY fecha ASC;
```

Consultar ultima bitacora de una organica:

```sql
SELECT TOP 5
  AfectacionId,
  Org0,
  Org1,
  Accion,
  Anio,
  Quincena,
  Resultado,
  CreatedAt,
  ModifiedAt
FROM afec.BitacoraAfectacionOrg
WHERE Entidad = 'AFILIADOS'
  AND Org0 = '04'
  AND Org1 = '24'
ORDER BY ModifiedAt DESC, CreatedAt DESC, AfectacionId DESC;
```

Consultar lineas de captura existentes:

```sql
SELECT TOP 20
  Org0,
  Org1,
  Periodo,
  Quincena,
  Anio,
  Importe,
  LineaCaptura,
  CONVERT(varchar(10), FechaInicioPeriodo, 23) AS FechaInicioPeriodo,
  CONVERT(varchar(10), FechaFinalPeriodo, 23) AS FechaFinalPeriodo,
  CONVERT(varchar(10), FechaLimite, 23) AS FechaLimite,
  Estatus,
  CreatedAt
FROM pagos.LineaCapturaPeriodo
WHERE Org0 = '04'
  AND Org1 = '24'
  AND Periodo IN ('1026', '1126')
ORDER BY CreatedAt DESC;
```
