# Plan Backend: Historial de la QNA Aplicada desde Snapshot Oficial

## Estado

PLANIFICADO. IMPLEMENTACION PENDIENTE.

Este documento es la fuente de seguimiento del backend para conservar y consultar la informacion exacta capturada al confirmar la aplicacion de una QNA.

No autoriza migraciones, despliegues, reprocesos ni cambios en periodos cerrados. Cada operacion sobre bases debe respetar `DATABASE_ENVIRONMENTS.md` y ejecutar primero `npm run verify:database:environments`.

## Objetivo

Para cada QNA nueva, conservar una evidencia oficial, inmutable y consultable de toda la pantalla `/dependencia/aportaciones-proceso`:

- Ahorro.
- Vivienda.
- Prestaciones Economicas.
- CAIR.
- Guarderias.
- Transitorio.
- Aguinaldo.
- Retenciones PCP.
- Retenciones PMP.
- Retenciones HIP.
- Identidad mostrada.
- Dias y bases usados.
- Formula, carga nominal y politica monetaria.
- Totales oficiales.
- Snapshot que realmente llego al estado `TERMINADO`.

## Decisiones Cerradas

| Tema | Decision |
|---|---|
| Alcance | Conservar toda la pantalla de aportaciones y retenciones |
| Momento de congelacion | Al confirmar `Aplicar` |
| Significado de exactitud | Datos capturados una sola vez por el backend al confirmar; no el estado previo de una pantalla que pudo permanecer abierta |
| Detalle auxiliar | Conservar cada fila exacta; no agrupar solamente por empleado |
| Nombre | Congelar el nombre mostrado por el calculo |
| Fuente oficial nueva | `liquidacion.QnaSnapshot` y sus detalles |
| Evidencia de aplicacion | Transicion `QnaProcesoTransicion.EstadoDestino = 'TERMINADO'` asociada al snapshot |
| Puntero oficial | `QnaSnapshotOficialActual` valida seleccion, pero por si solo no prueba aplicacion terminada |
| Periodos antiguos | Fallback identificado como `HISTORICO_LEGACY` |
| Transicion | Dual-write temporal: snapshot oficial mas tablas legacy |
| Datos no verificables | Devolver `null` y advertencia; nunca inventar cero |
| Frontend | Permanece bloqueado hasta estabilizar contrato y endpoints backend |

Cambiar una decision cerrada requiere actualizar este plan y registrar la razon antes de implementar.

## Situacion Actual

Existen tres modelos historicos superpuestos.

### Historicos legacy

Tablas principales:

```text
aportaciones.IndividualesAhorroHistorico
aportaciones.IndividualesViviendaHistorico
aportaciones.IndividualesPrestacionesHistorico
aportaciones.IndividualesCairHistorico
aportaciones.PensionNominaTransitorioHistorico
aportaciones.GuarderiasHistorico
aportaciones.AguinaldoHistorico
retenciones.PrestamosCortoPlazoHistorico
retenciones.PrestamosMedianoPlazoHistorico
retenciones.PrestamosHipotecariosHistorico
```

Ventajas:

- Contienen identidad legible.
- Los endpoints historicos actuales ya los consumen.

Limitaciones:

- Se guardan con estrategia `REPLACE`.
- No representan varias revisiones inmutables.
- No estan vinculados de forma completa a formula, carga nominal y snapshot oficial.
- No conservan todos los dias y bases requeridos para reproducir la pantalla.
- Existen diferencias entre DDL versionado y esquema desplegado.
- El lector legacy de retenciones no consume las tablas V3 vinculadas al snapshot.

### Snapshot de calculo V2

```text
aportaciones.SnapshotCalculoV2
aportaciones.SnapshotCalculoV2Detalle
aportaciones.SnapshotCalculoV2Decision
```

Ventajas:

- Es inmutable y versionado.
- Conserva formula, carga nominal, politica, hashes y totales.
- Conserva por empleado dias, origen, bases y componentes D6 de los cuatro fondos.

Limitaciones:

- `SnapshotCalculoV2Detalle` conserva `EmpleadoClaveHash`, no interno, RFC y nombre legibles.
- No contiene las filas completas de los seis dominios auxiliares.
- `BaseCotizacionQuinqueniosD6` puede quedar nulo por la precedencia actual de nombres.

### Snapshot de liquidacion QNA

```text
liquidacion.QnaSnapshot
liquidacion.QnaSnapshotFuente
liquidacion.QnaSnapshotTotal
liquidacion.QnaSnapshotFuenteDetalle
liquidacion.QnaSnapshotDetalle
liquidacion.QnaSnapshotDecision
liquidacion.QnaSnapshotOficialActual
liquidacion.QnaProcesoTransicion
```

Ventajas:

- Representa candidato, decision, seleccion y proceso de aplicacion.
- `QnaSnapshotTotal` ya conserva totales A2 de los diez dominios.
- `QnaSnapshotFuenteDetalle` conserva filas canonicas de seis dominios.
- Retenciones V3 se vinculan a `LiquidacionSnapshotId`.

Limitaciones:

- `QnaSnapshotDetalle` existe, pero no se llena ni se consulta.
- Las filas canonicas auxiliares guardan un payload reducido, insuficiente para reproducir los modales.
- La pantalla, historicos, candidato y retenciones se consultan varias veces durante la aplicacion.
- Lo persistido puede diferir de una lectura anterior si las fuentes cambian entre consultas.

## Flujo Actual que Debe Sustituirse

```text
Pantalla consulta datos vivos
  -> guardar historicos vuelve a consultar aportaciones
  -> SnapshotCalculoV2 congela cuatro fondos
  -> liquidacion vuelve a consultar seis dominios
  -> historico V3 vuelve a consultar retenciones
  -> Firebird ejecuta la aplicacion
```

El objetivo es una captura unica al confirmar:

```text
Confirmar Aplicar
  -> bloquear ambito
  -> consultar una sola vez los diez dominios
  -> construir evidencia completa en memoria
  -> persistir snapshot, detalles, totales y dual-write
  -> validar y promover
  -> aplicar en Firebird mediante saga recuperable
  -> marcar TERMINADO
```

## Fuente de Verdad Objetivo

Para una QNA nueva aplicada:

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

`QnaSnapshotOficialActual` debe coincidir durante la aplicacion, pero las consultas historicas de una QNA aplicada deben comprobar la transicion `TERMINADO`.

## Responsabilidad de las Tablas

### `liquidacion.QnaSnapshot`

Cabecera inmutable:

- Periodo y organicas completas.
- Ambiente.
- Revision.
- Formula.
- Carga nominal.
- Politica monetaria.
- Version de esquema.
- Hash del contenido.
- Usuario y fecha.

### `liquidacion.QnaSnapshotTotal`

Totales oficiales A2:

- Hojas `CAIR`, `FRA`, `FRE`, `FH`, `FV`, `FAA`, `FAE`, `FAT`, `FAI`.
- Fondos `AHORRO`, `VIVIENDA`, `PRESTACIONES`, `CAIR_FONDO`.
- Guarderias, Transitorio y Aguinaldo.
- PCP, PMP e HIP.
- Total de aportaciones.
- Total de retenciones.
- Total general.

El frontend no debe recalcular estos totales desde filas paginadas.

### `liquidacion.QnaSnapshotDetalle`

Proyeccion legible de los cuatro fondos por empleado. Debe ampliarse mediante migracion idempotente con, al menos:

```text
SnapshotCalculoV2DetalleId
EmpleadoClaveHash
Interno
Nombre
DiasLaborados
DiasOrigen
SueldoMensualD6
BaseCotizacionSueldoD6
QuinqueniosMensualD6
BaseCotizacionQuinqueniosD6
CAIRFondoD6
PrestacionesD6
ViviendaD6
GuarderiasD6
TransitorioD6
AguinaldoD6
HashFila
```

Los campos existentes de RFC, componentes de fondos y retenciones se conservan.

Restricciones objetivo:

```text
UNIQUE (LiquidacionSnapshotId, EmpleadoClaveHash)
UNIQUE (LiquidacionSnapshotId, SnapshotCalculoV2DetalleId)
FK a aportaciones.SnapshotCalculoV2Detalle
CHECK de DiasLaborados
CHECK de FAT = FAA + FAE
CHECK de hashes
```

### `liquidacion.QnaSnapshotFuenteDetalle`

Conserva cada fila exacta de:

```text
GUARDERIAS
TRANSITORIO
AGUINALDO
PCP
PMP
HIP
```

Debe ampliar su contrato con:

```text
EmpleadoClave
Rfc
Nombre
PayloadVersion
```

`PayloadCanonico` debe contener todos los campos mostrados en el modal correspondiente. Una persona puede tener varias filas por prestamo, recibo o concepto.

### `aportaciones.SnapshotCalculoV2Detalle`

Continua siendo evidencia matematica anonimizada de los cuatro fondos. No se utilizara como unica fuente de identidad legible.

### Historicos legacy

Se mantienen durante dual-write y para periodos antiguos. No seran fuente oficial de QNA nuevas una vez completada la transicion.

## Invariantes Obligatorias

Antes de promover y nuevamente antes de aplicar:

1. `QnaSnapshot` y `SnapshotCalculoV2` pertenecen al mismo periodo y ambito.
2. Ambos referencian la misma carga nominal y formula.
3. La carga TXT continua `APLICADA` y `EsVigente = 1`.
4. Conteos y hashes coinciden.
5. Los diez dominios tienen evidencia completa, vacia aprobada o no aplicable aprobada.
6. Los totales A2 coinciden con la agregacion oficial D6.
7. El usuario tiene acceso al ambito.
8. No existe otra aplicacion concurrente del mismo ambito.
9. La validacion final ocurre dentro de la transaccion de promocion, no solamente en el command orquestador.

Error requerido para carga sustituida:

```text
QNA_NOMINA_CARGA_DESACTUALIZADA
```

## Autorizacion

- Usuarios entidad: organicas resueltas exclusivamente desde el token.
- No aceptar ni confiar en organicas externas enviadas por una entidad.
- Ambitos externos: requieren rol administrativo explicito.
- No tratar automaticamente a todo usuario no entidad como administrador.
- Centralizar la resolucion en una unica politica reutilizable.
- Probar 401, 403 y aislamiento entre dependencias.

## Regla de Quinquenio

Corregir y probar esta precedencia en `SnapshotCalculoV2Factory`:

```text
1. quinquenios_aplicado_d6
2. quinquenios_d6 transformado por el flujo estandar
3. BaseCotizacionQuinquenios de la carga congelada
4. null cuando no sea verificable
```

No sustituir un valor desconocido por cero.

## Consistencia SQL Server y Firebird

No existe una transaccion distribuida entre ambas bases. La aplicacion se modela como saga recuperable:

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

Ante fallo:

- Conservar snapshot y estado alcanzado.
- No crear otro snapshot silenciosamente.
- Permitir reintento idempotente segun el estado.
- Usar `APLICACION_INCIERTA` cuando no pueda confirmarse el resultado Firebird.
- Registrar transiciones y motivo.

## Endpoints Planeados

### Periodos aplicados disponibles

```http
GET /liquidaciones-qna/aplicadas
```

Lista procesos `TERMINADO` accesibles para el usuario.

### Resumen aplicado

```http
GET /liquidaciones-qna/aplicada/resumen?anio=2026&quincena=15
```

Devuelve metadata, fuente, estado, IDs, totales oficiales y advertencias.

### Detalle por dominio

```http
GET /liquidaciones-qna/aplicada/detalles/:dominio
```

Parametros:

```text
anio
quincena
page
pageSize
buscar
```

Dominios permitidos:

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

Requisitos:

- Orden estable.
- `pageSize` limitado.
- Busqueda normalizada y parametrizada.
- Importes D6 y A2 enviados como string.
- Totales independientes de la pagina.
- No exponer otra dependencia.

## Contrato por Fuente

La respuesta debe ser una union discriminada.

### `SNAPSHOT_OFICIAL`

IDs, formula, carga, politica, revision y hash son obligatorios.

### `SNAPSHOT_OFICIAL_RECONSTRUIDO`

IDs oficiales obligatorios, estrategia y advertencias obligatorias. Solo para snapshots previos sin proyeccion completa.

### `HISTORICO_LEGACY`

IDs de snapshot pueden ser nulos. Debe indicar campos no verificables y no mezclar el historico con una carga vigente posterior.

Metadata comun recomendada:

```text
fuente
periodo
organicasEfectivas
liquidacionSnapshotId
snapshotCalculoV2Id
nominaCargaId
formulaCalculoVersionId
precisionPolicy
revision
hashContenido
fechaCreacion
warnings
reconstructionStrategy
```

## Dual-write Temporal

Durante una liberacion controlada:

```text
Snapshot oficial nuevo + historicos legacy
```

Comparar por periodo y dominio:

- Conteos.
- Empleados.
- Totales A2.
- Importes D6.
- Hashes cuando sea posible.

Criterio para retirar escritura legacy en QNA nuevas:

1. Conciliacion completa en Calidad.
2. Sin diferencias no explicadas.
3. Lectura oficial validada por frontend.
4. Recuperacion e idempotencia probadas.
5. Autorizacion validada.
6. Aprobacion operativa explicita.

No eliminar tablas legacy al retirar su escritura.

## Fases de Implementacion

| Fase | Objetivo | Estado |
|---:|---|---|
| 0 | Confirmar decisiones y actualizar documentos | PLANIFICADA |
| 1 | Centralizar autorizacion y ambito | PENDIENTE |
| 2 | Validar carga, formula y enlaces dentro de promocion | PENDIENTE |
| 3 | Corregir precedencia de quinquenio | PENDIENTE |
| 4 | Crear migracion de proyecciones y restricciones | PENDIENTE |
| 5 | Implementar captura unica de diez dominios | PENDIENTE |
| 6 | Poblar detalles, payloads, hashes y totales | PENDIENTE |
| 7 | Fortalecer retenciones V3 por identidad/hash | PENDIENTE |
| 8 | Activar dual-write y conciliacion | PENDIENTE |
| 9 | Implementar endpoints de lectura aplicada | PENDIENTE |
| 10 | Implementar fallback legacy identificado | PENDIENTE |
| 11 | Probar saga, recuperacion e idempotencia | PENDIENTE |
| 12 | Validar en Calidad y entregar contrato frontend | PENDIENTE |
| 13 | Retirar dual-write para QNA nuevas | PENDIENTE |
| 14 | Liberar en Produccion | PENDIENTE |

## Pruebas Obligatorias

- Dos confirmaciones simultaneas.
- Carga TXT sustituida antes de promover.
- Carga TXT sustituida antes de aplicar.
- Fallo Firebird despues de promover.
- Reintento despues de `APLICACION_INCIERTA`.
- Snapshot promovido pero no terminado.
- Snapshot terminado y posteriormente reemplazado.
- Empleado con cero, dias parciales y quince dias.
- Quinquenio proveniente de cada nivel de precedencia.
- Nombre congelado igual al mostrado.
- Multiples prestamos y recibos por empleado.
- Alteracion de hash o conteo.
- Totales D6 y A2.
- Paginacion y busqueda estable.
- 401, 403 y acceso cruzado.
- Snapshot antiguo sin proyeccion.
- Fallback legacy sin carga verificable.
- Idempotencia de creacion, promocion y lectura.

## Documentacion que Debe Mantenerse Alineada

### Seguimiento

Este archivo:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

### Decision arquitectonica

Crear antes de implementar la migracion:

```text
docs/aplicacionQuincenal/DECISION_HISTORIAL_SNAPSHOT_OFICIAL.md
```

Debe registrar contexto, alternativas, decision, consecuencias, dual-write, fallback y limitacion transaccional SQL Server/Firebird.

### Referencia del modelo

Crear junto con la migracion:

```text
docs/aplicacionQuincenal/REFERENCIA_MODELO_SNAPSHOT_QNA_OFICIAL.md
```

Debe documentar tablas, columnas, PK/FK, indices, granularidad, D6/A2, hashes, payloads y estados.

### Flujo transaccional

Actualizar al implementar captura unica y saga:

```text
docs/aplicacionQuincenal/FLUJO_TRANSACCIONAL_APLICACION_QNA.md
```

### Regla de quinquenios

Actualizar al corregir precedencia:

```text
docs/aplicacionQuincenal/REGLA_QUINQUENIOS_PRESTACIONES_NOMINA.md
```

### Entrega frontend

Actualizar cuando el contrato backend sea estable:

```text
docs/aplicacionQuincenal/FRONTEND_HISTORIAL_SNAPSHOT_OFICIAL.md
```

## Regla de Cierre de Fase

Cada fase debe terminar en este orden:

1. Implementar.
2. Ejecutar pruebas.
3. Registrar evidencia.
4. Actualizar estado y bitacora de este plan.
5. Actualizar referencia si cambio el esquema o contrato.
6. Actualizar Swagger si cambio HTTP.
7. Ejecutar `git diff --check` y revisar cambios.
8. Continuar con la fase siguiente.

Compilar no es evidencia suficiente para marcar una fase como completada.

## Criterios de Aceptacion Final

- La evidencia corresponde al snapshot que llego a `TERMINADO`.
- Los diez dominios pueden reproducirse sin consultar fuentes vivas.
- El nombre coincide con el mostrado al congelar.
- Dias, bases, formula y carga estan congelados.
- Totales coinciden con `QnaSnapshotTotal`.
- No se recalculan totales oficiales desde una pagina.
- No se mezcla una revision con datos de otra carga.
- El historial legacy queda identificado.
- La autorizacion impide consultas cruzadas.
- La saga es recuperable e idempotente.
- Documentacion, Swagger y codigo coinciden.
- Dual-write fue conciliado antes de retirarse.

## Bitacora de Seguimiento

| Fecha | Fase | Estado | Commit | Pruebas/Evidencia | Notas |
|---|---:|---|---|---|---|
| 2026-08-21 | 0 | PLANIFICADA | - | Tercera revision documental | Decisiones de alcance, captura, legacy y detalle cerradas |
| 2026-08-21 | Prerrequisito | COMPLETADO_EN_DESARROLLO | - | `QNA_V3_DESARROLLO_MIGRATION_OK`; `QNA_V3_DESARROLLO_SCHEMA_ALIGNED_OK`; build y siete pruebas de liberacion OK | `SII-ISSSSPEA-DES` alineada con Produccion en 91 tablas, columnas, objetos programables, relaciones, indices estables y triggers; formula V3 activa |
| 2026-08-21 | Prerrequisito | COMPLETADO_EN_CALIDAD | - | `QNA_SNAPSHOT_FK_CALIDAD_MIGRATION_OK`; `QNA_V3_CALIDAD_SCHEMA_ALIGNED_OK`; `APORTACIONES_OFFICIAL_1526_CALIDAD_OK`; build y contratos de liquidacion OK | Creada y validada `liquidacion.FK_QnaSnapshot_SnapshotCalculoV2`; tres FK habilitadas y confiables, cero huerfanos; Calidad alineada con Produccion en 91 tablas y columnas |

Actualizar esta tabla despues de cada cambio relevante. No marcar una fase como completada sin evidencia y referencia al commit correspondiente.
