# ADR: Historial de la QNA Aplicada desde Snapshot Oficial

## Estado

ACEPTADA

Fecha: 2026-08-25.

## Contexto

La pantalla `/dependencia/aportaciones-proceso` combina cuatro fondos y seis dominios auxiliares. Antes de esta decision, la aplicacion de una QNA podia consultar esas fuentes varias veces para guardar historicos, construir snapshots, preparar la liquidacion y aplicar movimientos en Firebird.

Las fuentes pueden cambiar entre consultas. Los historicos legacy tampoco conservan de forma uniforme la carga nominal, formula, dias, bases, identidad mostrada, filas auxiliares y hashes necesarios para reproducir exactamente lo confirmado.

SQL Server y Firebird participan en la aplicacion, pero no existe una transaccion distribuida entre ambas bases. La solucion debe conservar evidencia aun cuando Firebird falle o su resultado sea incierto.

## Impulsores de la Decision

- Reproducir los diez dominios sin consultar fuentes vivas.
- Vincular la evidencia con la QNA que realmente alcanzo `TERMINADO`.
- Conservar identidad, dias, bases, formula, carga, politica y totales.
- Evitar mezclar revisiones o cargas nominales.
- Conservar cada prestamo, recibo o concepto como fila independiente.
- Mantener compatibilidad de lectura para periodos antiguos.
- Permitir recuperacion idempotente entre SQL Server y Firebird.
- Impedir consultas cruzadas entre dependencias.

## Opciones Consideradas

### Historicos legacy como unica fuente

Ventajas:

- Ya existen tablas y lectores.
- Menor cambio inicial.

Desventajas:

- Escritura `REPLACE`, sin revisiones inmutables.
- Enlaces incompletos con formula y carga.
- Cobertura insuficiente de dias, bases y payloads.
- Retenciones V3 no quedan representadas por el lector legacy.

### Reconstruccion bajo demanda desde fuentes vivas

Ventajas:

- Reduce almacenamiento adicional.
- Reutiliza consultas actuales.

Desventajas:

- No garantiza el estado confirmado.
- Una carga o fuente posterior puede cambiar el resultado.
- No constituye evidencia historica inmutable.

### Snapshot oficial capturado una vez con dual-write temporal

Ventajas:

- Evidencia inmutable y vinculada a formula, carga y proceso.
- Reproduccion sin fuentes vivas.
- Conciliacion controlada contra el comportamiento legacy.
- Transicion gradual para periodos antiguos y consumidores existentes.

Desventajas:

- Aumenta temporalmente la complejidad de escritura.
- Requiere proyecciones legibles y payloads completos.
- Exige una saga explicita para SQL Server y Firebird.

## Decision

Se adopta un Snapshot oficial capturado una sola vez por el backend al confirmar `Aplicar`.

La fuente oficial para QNA nuevas sera:

```text
liquidacion.QnaProceso
  -> liquidacion.QnaProcesoTransicion (EstadoDestino = TERMINADO)
  -> liquidacion.QnaSnapshot
     -> liquidacion.QnaSnapshotTotal
     -> liquidacion.QnaSnapshotDetalle
     -> liquidacion.QnaSnapshotFuente
     -> liquidacion.QnaSnapshotFuenteDetalle
     -> aportaciones.SnapshotCalculoV2
        -> aportaciones.SnapshotCalculoV2Detalle
```

`QnaSnapshotOficialActual` valida la seleccion del snapshot, pero no prueba por si solo que la aplicacion termino. Las lecturas oficiales deben comprobar una transicion a `TERMINADO` asociada al snapshot.

La captura incluye:

```text
AHORRO
VIVIENDA
PRESTACIONES
CAIR
GUARDERIAS
TRANSITORIO
AGUINALDO
PCP
PMP
HIP
```

Se conservaran el nombre mostrado, identidad, dias, origen, bases, formula, carga nominal, politica monetaria, filas auxiliares exactas, totales y hashes.

Durante la transicion se mantendra dual-write hacia el Snapshot oficial y los historicos legacy. Los periodos antiguos se devolveran como `HISTORICO_LEGACY`. Los snapshots oficiales anteriores sin proyeccion completa podran devolverse como `SNAPSHOT_OFICIAL_RECONSTRUIDO`, siempre con estrategia y advertencias.

Los datos no verificables se representaran con `null` y advertencias. No se inventaran ceros.

## Consistencia entre SQL Server y Firebird

La aplicacion se implementara como una saga recuperable, no como una transaccion distribuida.

Estados objetivo:

```text
CALCULADO
APROBADO
OFICIAL
APLICANDO_FIREBIRD
FIREBIRD_CONFIRMADO
LINEA_CONFIRMADA
REVISA_PROGRAMADA
TERMINADO
```

Ante un fallo se conserva el snapshot y el estado alcanzado. Los reintentos deben ser idempotentes y no deben crear otro snapshot silenciosamente. Cuando no pueda confirmarse el resultado de Firebird se utilizara `APLICACION_INCIERTA`.

## Autorizacion

- El ambito de usuarios entidad se resolvera exclusivamente desde el token.
- Las organicas enviadas externamente por una entidad no seran confiables.
- Los ambitos externos requeriran un rol administrativo explicito.
- Captura, promocion y lectura utilizaran la misma politica central.

## Consecuencias Positivas

- La evidencia aplicada puede auditarse sin fuentes vivas.
- Los totales oficiales no dependen de paginas o recalculos frontend.
- Se preservan formula, carga y politica utilizadas.
- Los fallos entre bases pueden recuperarse de forma controlada.
- Los periodos legacy permanecen consultables e identificados.

## Consecuencias Negativas

- Dual-write incrementa temporalmente el costo operativo.
- El esquema requiere nuevas columnas, restricciones y payloads versionados.
- La aplicacion necesita mas estados y pruebas de recuperacion.
- El frontend debe adoptar contratos nuevos y no puede reutilizar superficialmente sus modelos legacy.

## Riesgos y Controles

| Riesgo | Control |
|---|---|
| Snapshot seleccionado pero no aplicado | Exigir transicion `TERMINADO` |
| Carga nominal sustituida | Validacion dentro de promocion y antes de aplicar |
| Resultado Firebird incierto | Estado `APLICACION_INCIERTA` y reintento idempotente |
| Diferencias con legacy | Dual-write y conciliacion por dominio |
| Exposicion entre dependencias | Politica central basada en token |
| Campo no verificable | `null` y advertencia explicita |

## Criterios para Retirar el Dual-write

1. Conciliacion completa en Calidad.
2. Ausencia de diferencias no explicadas.
3. Lectura oficial validada por frontend.
4. Recuperacion e idempotencia probadas.
5. Autorizacion validada.
6. Aprobacion operativa explicita.

Retirar el dual-write no implica eliminar las tablas legacy.

## Alternativas Rechazadas

- Usar exclusivamente los historicos legacy.
- Reconstruir periodos aplicados desde fuentes vivas.
- Considerar `QnaSnapshotOficialActual` como prueba suficiente de aplicacion.
- Agrupar filas auxiliares solamente por empleado.
- Sustituir datos desconocidos por cero.
- Intentar simular una transaccion distribuida sin soporte real entre motores.

## Plan de Implementacion

La ejecucion se controla desde:

```text
docs/aplicacionQuincenal/SEGUIMIENTO_HISTORIAL_SNAPSHOT_OFICIAL.md
```

El detalle tecnico permanece en:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

La implementacion avanzara por autorizacion, invariantes, quinquenio, migracion, captura unica, persistencia, retenciones, dual-write, endpoints, fallback, saga, Calidad, retiro de dual-write y Produccion.

## Documentos Relacionados

- `PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md`
- `FRONTEND_HISTORIAL_SNAPSHOT_OFICIAL.md`
- `FLUJO_TRANSACCIONAL_APLICACION_QNA.md`
- `REGLA_QUINQUENIOS_PRESTACIONES_NOMINA.md`
- `DATABASE_ENVIRONMENTS.md`
