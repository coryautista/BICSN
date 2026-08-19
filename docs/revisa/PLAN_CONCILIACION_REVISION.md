# Seguimiento de conciliación REVISA

## Objetivo

Reemplazar gradualmente la estructura `EstadoCuentaAhorroHistorico` por un modelo simple que genere un registro por concepto, orgánica y quincena en SQL Server.

El cálculo de REVISA se ejecutará en segundo plano después de que la aplicación QNA haya completado correctamente el `COMMIT` de Firebird y la generación de la Línea de Pago. El servicio de aplicación QNA no esperará a que termine REVISA.

## Estado actual

### Completado manualmente en SQL Server

- Creación de `reportes.catalogoRevision`.
- Creación del esquema `conciliacion`.
- Creación de `conciliacion.Revision`.
- Creación de `conciliacion.RevisionHistorico`.
- Alta de los 12 conceptos iniciales.
- Alta del saldo actual base para la orgánica `04-24-01-01`, período `1426`.
- Creación de `conciliacion.RevisionTarea`.
- Activación de los conceptos 7 y 10.
- Configuración manual del concepto 14 con el nombre `Ajustes` y estado activo.

### Implementado en BICSN

- Repositorio para consultar el catálogo y guardar la revisión vigente.
- Respaldo transaccional de ajustes en `RevisionHistorico`.
- Worker interno persistente con un máximo de tres intentos.
- Reclamación SQL Server con bloqueo de fila para evitar procesamiento simultáneo.
- Recuperación y reclamación periódica de tareas con posesión vencida por más de treinta minutos.
- Integración posterior a la generación o reutilización exitosa de Línea de Pago.
- Cobertura de Línea de Pago automática y recuperación manual.
- Reporte JSON de éxito o error en SFTP.
- Cálculo de los conceptos automáticos 1 al 13, 15 y 16; el concepto 14 queda fuera del worker.
- Captura administrativa del concepto 14 sin reprocesar los conceptos automáticos.
- Normalización del concepto 6 a la QNA par inmediata siguiente cuando la QNA solicitada es impar.
- Cálculo del concepto 12 mediante `AP_G_SALDO_FONDO(org0, org1, periodo)`.
- Aplicación anual de los conceptos 8 y 11 exclusivamente en período `01`; en `02-24` se guardan en cero sin consultar Firebird.
- Cierre ordenado del worker ante `SIGINT` y `SIGTERM`.

### Pendiente funcional

- Migración de columnas de usuario a `UNIQUEIDENTIFIER` donde todavía son texto.

## Modelo de datos

### `reportes.catalogoRevision`

Catálogo de filas que componen el reporte REVISA.

Campos:

| Campo | Uso |
| --- | --- |
| `idcatalogoRevision` | Llave primaria del concepto. |
| `numeroConcepto` | Número único y orden funcional del concepto. |
| `Concepto` | Nombre visible. |
| `Descripcion` | Descripción opcional. |
| `activo` | Indica si debe procesarse. |

### Catálogo actual

| Número | Concepto |
| ---: | --- |
| 1 | Saldo anterior |
| 2 | Aplicación quincenal |
| 3 | Alta o reingreso |
| 4 | Baja |
| 5 | Suspensión y baja |
| 6 | Traspaso |
| 7 | Capital Constitutivo |
| 8 | Devolución de intereses a activos |
| 9 | Devolución de intereses a licencias |
| 10 | Capitalización de intereses a licencias |
| 11 | Capitalización de intereses a activos |
| 12 | Saldo actual |
| 13 | Liberación de PCP con fondo de Ahorro |
| 14 | Ajustes |
| 15 | Liberación de PMP con fondo de Ahorro |
| 16 | Liberación de HIP con fondo de Ahorro |

### `conciliacion.Revision`

Mantiene el cálculo vigente. Debe existir una fila por cada concepto automático activo para cada combinación de orgánica y período, incluso cuando todos sus importes sean cero. El concepto 14 es opcional y solo tiene fila cuando un administrador captura Ajustes.

Llave funcional única:

```text
Organica0 + Organica1 + Organica2 + Organica3 + Periodo + IdCatalogoRevision
```

Fondos manejados actualmente por Entidad y REVISA:

```text
CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
```

El campo `Usuario` conserva el UUID de `auth.[user].id`, no el nombre del usuario. Actualmente la columna es `NVARCHAR(100)`; se recomienda migrarla posteriormente a `UNIQUEIDENTIFIER` y agregar una llave foránea hacia `auth.[user](id)`.

### `conciliacion.RevisionHistorico`

Es una bitácora de ajustes a `conciliacion.Revision`. No es fuente de cálculo para REVISA.

Reglas:

1. Si la fila vigente no existe, se inserta en `Revision` y no se crea histórico.
2. Si existe y cambia algún importe, estatus o usuario, primero se copia la versión vigente a `RevisionHistorico` y después se actualiza `Revision`.
3. Si no hay cambios, no se actualiza la fila ni se crea histórico.
4. El respaldo y la actualización deben ejecutarse dentro de la misma transacción SQL Server.

Por cada concepto, el resultado del guardado será uno de estos estados:

```text
INSERT
UPDATE
SIN_CAMBIOS
```

### Captura administrativa de Ajustes

El concepto 14 no se calcula en el worker. El proyecto Administrador realiza el cálculo para el cuadre visual y envía los nueve importes consolidados mediante:

```http
PUT /v1/reportes/revision/ajustes
```

La operación requiere rol `admin` y un reporte REVISA existente con tarea `COMPLETADA`. La primera captura inserta la fila; las capturas posteriores reutilizan la transacción e histórico de `conciliacion.Revision`. Ajustes no modifica el Saldo actual ni vuelve a consultar las fuentes de los conceptos automáticos.

En la presentación del proyecto Administrador, los conceptos automáticos 1 a 13, 15 y 16 se muestran primero, seguidos por las filas derivadas Total y Diferencia, y finalmente por Ajustes. La Diferencia se obtiene por fondo como `Total - Saldo actual`. Total y Diferencia no se almacenan en BICSN. Ajustes acepta importes positivos, negativos o cero y no recalcula automáticamente ninguna de esas filas.

### Reproceso histórico de liberaciones

El script `scripts/reprocess-revision-pcp.ts` divide los reportes completados que anteriormente concentraban `LFA`, `LFM` y `LFP` en el concepto 13. Solo recalcula y guarda los conceptos 13, 15 y 16; no reencola el worker ni modifica los conceptos 1 a 12 o 14.

La ejecución es previsualización por defecto:

```bash
npm run reprocess:revision:pcp -- --database=NOMBRE_BD --firebird=RUTA_FDB
```

Para aplicar cambios se requiere confirmar explícitamente el nombre de la base y agregar `--execute`:

```bash
npm run reprocess:revision:pcp -- --database=NOMBRE_BD --firebird=RUTA_FDB --execute
```

Toda ejecución con `--execute` exige además filtros explícitos de período y orgánica completa:

```bash
npm run reprocess:revision:pcp -- --database=NOMBRE_BD --firebird=RUTA_FDB --periodo=1426 --org0=04 --org1=24 --org2=01 --org3=01 --execute
```

El script valida tanto el nombre de SQL Server como la ruta Firebird antes de consultar o guardar. En previsualización muestra importes actuales, importes calculados y la operación prevista. El guardado es transaccional por reporte. El valor agregado anterior del concepto 13 se conserva en `conciliacion.RevisionHistorico`; 15 y 16 se insertan o actualizan de forma idempotente.

Los conceptos 8 y 11 tienen periodicidad anual y solo consultan `RENDIMIENTOS_ANUALES` cuando el período comienza con `01`. Los conceptos 9 y 10 no comparten esta restricción. Para períodos `02-24`, 8 y 11 se persisten en cero con una fuente de trazabilidad `NO_APLICA`, evitando repetir los mismos rendimientos cada quincena.

## Registro base aplicado

Registro insertado en `conciliacion.Revision`:

| Campo | Valor |
| --- | --- |
| `IdRevision` | `1` |
| Orgánica | `04-24-01-01` |
| Período | `1426` |
| Concepto | `12`, Saldo actual |
| `CAIR` | `3,360,944.75` |
| `FRA` | `6,923,970.00` |
| `FRE` | `39,029,597.06` |
| `FH` | `586,116.07` |
| `FV` | `2,930,575.60` |
| `FAA` | `3,434,527.57` |
| `FAE` | `1,716,908.51` |
| `FAT` | `5,151,436.12` |
| `FAI` | `106,237.00` |
| Estatus | `A` |
| Usuario UUID | `1601433E-F36B-1410-80A7-00A5CBF95890` |
| Fecha alta | `2026-08-03 10:15:38` |

`FAT` se conserva con el importe oficial de origen. Existe una diferencia de `0.04` respecto de `FAA + FAE`; queda pendiente confirmar si corresponde a redondeo o a una fuente distinta.

## Regla del concepto 1: Saldo anterior

El saldo anterior de una QNA se obtiene del concepto 12, Saldo actual, del período inmediatamente anterior y de la misma orgánica.

Ejemplo:

```text
Concepto 1 de 1526 = Concepto 12 de 1426
Orgánica origen y destino = 04-24-01-01
```

Se copian los nueve fondos desde `conciliacion.Revision`:

```text
CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
```

El período anterior debe calcularse por número de quincena y año, no restando directamente el texto `QQAA`:

```text
1526 -> 1426
0126 -> 2425
```

`RevisionHistorico` no se consulta para obtener el saldo anterior.

## Regla del concepto 2: Aplicación quincenal

La fuente del worker es `conciliacion.RevisionAplicacionHistorico`. El snapshot se crea antes de aplicar Firebird con:

```sql
SELECT *
FROM AP_S_FONDOS(org0, org1, periodo);
```

El snapshot conserva las sumatorias de los campos directos:

| Fondo en `Revision` | Campo de `AP_S_FONDOS` |
| --- | --- |
| `CAIR` | `SUM(SARE)` |
| `FRA` | `SUM(FRA)` |
| `FRE` | `SUM(FRE)` |
| `FH` | `SUM(FHE)` |
| `FV` | `SUM(FVE)` |
| `FAA` | `SUM(FAA)` |
| `FAE` | `SUM(FAE)` |
| `FAT` | `SUM(FAT)` |
| `FAI` | `SUM(FAI)` |

No se usan los grupos `SSARE...SFAI` ni `TSARE...TFAI`. Después de aplicar QNA, REVISA lee únicamente SQL Server; si falta el snapshot, la tarea falla de forma controlada.

`AP_S_MINIMOS` queda pendiente de validación. La especificación recibida lo indicó como `AP_S_MINIMOS(org0, org1, periodo)`, pero la firma real de Firebird acepta únicamente `org0` y `org1`, y obtiene la QNA vigente internamente. No participará en ningún cálculo hasta confirmar su uso funcional.

La referencia técnica completa se mantiene en [`CONCEPTOS_REVISION.md`](./CONCEPTOS_REVISION.md).

## Reglas confirmadas de los conceptos 6 y 12

El concepto 6 utiliza `AP_G_FONDOS_REINGRESO_ORD(periodo)`. El período tiene formato `QQAA`; cuando `QQ` es impar, el procedimiento se consulta con la QNA par inmediata siguiente, conservando el año. El resultado se registra en el período REVISA original.

```text
0126 -> consulta 0226
1526 -> consulta 1626
1626 -> consulta 1626
```

El concepto 12 utiliza:

```sql
SELECT *
FROM AP_G_SALDO_FONDO(org0, org1, periodo);
```

Se suman todos los registros devueltos con el siguiente mapeo:

| Fondo en `Revision` | Campo de `AP_G_SALDO_FONDO` |
| --- | --- |
| `CAIR` | `SUM(SSARE)` |
| `FRA` | `SUM(SFRA)` |
| `FRE` | `SUM(SFRE)` |
| `FH` | `SUM(SFHE)` |
| `FV` | `SUM(SFVE)` |
| `FAA` | `SUM(SFAA)` |
| `FAE` | `SUM(SFAE)` |
| `FAT` | `SUM(SFAT)` |
| `FAI` | `SUM(SFAI)` |

Si el procedimiento no devuelve registros, los nueve fondos se guardan en `0.00`.

## Flujo asíncrono

Punto de integración confirmado en `AplicarBDIssspeaQNACommand`:

```text
Firebird COMMIT
-> generar Línea de Pago correctamente
-> registrar tarea REVISA como PENDIENTE
-> actualizar BitacoraAfectacionOrg a TERMINADO
-> continuar el flujo normal de Aplicación QNA
-> responder sin esperar el cálculo REVISA
-> worker procesa REVISA en segundo plano
```

Si falla la Línea de Pago, no se programa REVISA. La recuperación de Línea de Pago deberá programar REVISA cuando la línea se genere correctamente, evitando duplicados por orgánica y período.

No debe implementarse únicamente con `setImmediate`, `queueMicrotask` o una promesa sin esperar, porque una interrupción del proceso perdería el trabajo. Se requiere una tarea persistente en SQL Server.

## Tarea persistente implementada

Tabla:

```text
conciliacion.RevisionTarea
```

Datos mínimos:

| Campo | Uso |
| --- | --- |
| `IdRevisionTarea` | Llave primaria. |
| `Organica0` a `Organica3` | Orgánica procesada. |
| `Periodo` | QNA en formato `QQAA`. |
| `UsuarioId` | UUID que originó la aplicación. |
| `Estatus` | `PENDIENTE`, `PROCESANDO`, `COMPLETADA` o `ERROR`. |
| `Intentos` | Número de intentos realizados. |
| `FechaAlta` | Momento de programación. |
| `FechaInicio` | Inicio del último intento. |
| `FechaFin` | Fin del último intento. |
| `Error` | Mensaje controlado del último error. |
| `RutaReporteFtp` | Ruta del JSON de trazabilidad. |
| `ClaimToken` | Identificador del intento que posee la tarea. |
| `ProximoIntento` | Momento mínimo para ejecutar el siguiente reintento. |

Debe impedirse la ejecución simultánea de dos tareas para la misma orgánica y período.

La tarea se programa de forma idempotente. Una segunda generación o recuperación de la misma Línea de Pago reutiliza la tarea existente. Si la tarea estaba en error terminal, una nueva solicitud explícita de Línea de Pago la habilita nuevamente desde cero.

El worker incrementa `Intentos` al reclamarla y asigna un `ClaimToken`. Las operaciones de finalización o error exigen ese mismo token para impedir que una instancia vencida sobrescriba el trabajo de otra. Los reintentos usan espera persistente: diez segundos después del primer fallo y un minuto después del segundo; en el tercero queda en `ERROR`.

Los conceptos activos se consultan del catálogo, se calculan y se guardan juntos en una sola transacción SQL Server. Un concepto inactivo se omite; si falla un concepto activo, no queda un reporte aplicado parcialmente.

## Reporte de trazabilidad SFTP

Se reutilizará `ftpService.uploadText()`.

Ruta propuesta:

```text
{FTP_BASE_PATH}/REVISA/{periodo}/REVISA_{org0}{org1}{org2}{org3}_{periodo}_{timestamp}_{resultado}.json
```

Ejemplo:

```text
/Autodeterminacion/Produccion/REVISA/1426/REVISA_04240101_1426_20260803_101538_OK.json
```

Contenido mínimo:

- Identificador de tarea.
- Período y orgánica.
- UUID del usuario.
- Fechas de inicio y fin.
- Resultado general.
- Duración total.
- Resultado de cada concepto: `INSERT`, `UPDATE`, `SIN_CAMBIOS` o `ERROR`.
- Fuente, parámetros, duración y cantidad de registros origen por concepto.
- Importes calculados por fondo.
- `IdRevision` afectado.
- `IdRevisionHistorico` cuando exista un ajuste.
- Importes anteriores y nuevos cuando ocurra un ajuste.
- Errores y advertencias controlados.

No se guardarán datos personales ni registros completos de afiliados en el reporte SFTP.

## Contrato de cálculo por concepto

Cada lógica recibirá:

```text
Organica0, Organica1, Organica2, Organica3, Periodo, UsuarioId
```

Cada lógica devolverá:

```text
CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
```

Plantilla para documentar los conceptos pendientes:

```text
Número de concepto:
Nombre:
SP, tabla o consulta fuente:
Parámetros:
Columnas origen:
Regla para CAIR:
Regla para FRA:
Regla para FRE:
Regla para FH:
Regla para FV:
Regla para FAA:
Regla para FAE:
Regla para FAT:
Regla para FAI:
Regla cuando no existen registros:
Estatus esperado:
```

## Plan vivo: concepto 2 con días de nómina y precisión monetaria

### Control

| Campo | Valor |
|---|---|
| Estado general | `EN_PROGRESO` |
| Fecha de inicio | `2026-08-15` |
| Alcance | Aplicación QNA, históricos, Línea de Pago y concepto 2 REVISA |
| Política monetaria objetivo | `MXN-DETAIL6-AGG2-TRUNC-v1` |
| Estrategia | Implementación gradual con modo sombra y feature flags |
| Regla de históricos cerrados | Auditar sin sobrescribir automáticamente |
| Documento relacionado | `POLITICA_PRECISION_MONETARIA_DETAIL6_AGG2_TRUNC_V1.md` |

Este apartado es la fuente de seguimiento del cambio. Cada fase debe actualizar su estado, evidencia, decisiones, fecha y resultado antes de iniciar la siguiente.

### Estados de fase

| Estado | Significado |
|---|---|
| `PENDIENTE` | No iniciada |
| `EN_PROGRESO` | Trabajo activo sin gate aprobado |
| `BLOQUEADA` | Requiere decisión o dependencia externa |
| `VALIDACION` | Implementada en sombra o Calidad |
| `COMPLETADA` | Gate aprobado y evidencia registrada |
| `CANCELADA` | Retirada por decisión documentada |

### Decisiones normativas aprobadas

| Tema | Regla aprobada |
|---|---|
| QNA sin TXT | Usar 15 días y registrar `SIN_ARCHIVO_DEFAULT_15` |
| QNA con TXT y trabajador coincidente | Usar `DiasLaborados` de la carga seleccionada |
| QNA con TXT y trabajador ausente | Usar 0 días; las bases proporcionales quedan en cero |
| QNA con TXT y días nulos o cero | Usar 0 días; las bases proporcionales quedan en cero |
| Días fuera de `0..15` | Rechazar la liquidación |
| Ajustes individuales Firebird | Conservarlos separados de la base proporcional |
| Vivienda | Separar `FH=0.0035` y `FV=0.0140` sobre sueldo proporcional |
| Prestaciones FRA | Sueldo proporcional por `0.0450` más ajustes individuales |
| Prestaciones FRE | Sueldo proporcional por `0.2225`, otras prestaciones y quinquenios por `0.2675`, más ajustes individuales |
| FAI/FAR | Conservar rendimiento y ajustes Firebird; no modificar por días laborados |
| Fuente oficial | Cálculo backend con nómina, Firebird, tasas y fórmula versionada |
| Históricos | Guardar importes calculados con los días aplicados |
| Línea de Pago | Consumir los históricos ajustados |
| REVISA concepto 2 | Consumir el mismo snapshot ajustado |
| Periodos cerrados | Auditar; corregir solo con autorización y fuente completa |
| Detalle monetario | D6, seis decimales |
| Agregado monetario | A2, dos decimales |
| Finalización A2 | Truncamiento hacia cero |
| Aritmética oficial | Decimal exacta o fixed-point; no `number` |
| Vigencia de fórmula | Anual, con versiones adicionales por quincena cuando cambien tasas |
| Alta de versión | Completa y `ACTIVA` en una sola transacción; no existe estado borrador |
| Año sin cambios | Clonar explícitamente la última versión al nuevo año |
| Resolución histórica | Exigir versión activa del año y QNA; sin fallback a otro año |

### Invariantes de compatibilidad

- No cambiar conceptos REVISA distintos del 2 como parte de este plan.
- No cambiar fórmulas de retenciones PCP, PMP o HIP.
- No cambiar los procedimientos de aplicación Firebird.
- No cambiar la captura administrativa del concepto 14.
- No recalcular una QNA durante la ejecución del worker REVISA.
- No recalcular históricos cerrados con nómina o tasas vigentes actuales.
- No romper el contrato actual de `GET /v1/reportes/revision`.
- No activar precisión y días de nómina en el mismo corte productivo.
- Una falla de fuente nunca se convierte en cero ni autoriza un `REPLACE` vacío.
- Cero días anula únicamente componentes proporcionales; no elimina rendimiento ni ajustes Firebird.

### Regla monetaria objetivo

Los importes por trabajador conservan seis decimales. No se finalizan a dos antes de agregarse.

```text
fuentes exactas
-> bases proporcionales D6
-> componentes de aportación D6
-> total individual D6
-> suma exacta de detalles D6
-> total de fondo T2
-> agregados padre A2
```

Definiciones:

```text
T6(x) = sign(x) * floor(abs(x) * 1_000_000) / 1_000_000
T2(x) = sign(x) * floor(abs(x) * 100) / 100
```

Ejemplo que no debe implementarse:

```text
T2(1.239999) + T2(1.239999) = 2.46
```

Resultado correcto:

```text
T2(1.239999 + 1.239999) = T2(2.479998) = 2.47
```

La presentación puede mostrar dos decimales, pero las sumas oficiales nunca usan los valores visuales.

### Arquitectura objetivo

```text
Nómina seleccionada + Firebird + tasas versionadas
                       |
                       v
             Liquidación única de QNA
                       |
          +------------+-------------+
          |                          |
          v                          v
Detalle histórico D6        Encabezados oficiales A2
          |                          |
          +------------+-------------+
                       |
             Snapshot oficial QNA
                 /             \
                v               v
        Línea de Pago     REVISA concepto 2
```

REVISA continúa siendo lector del snapshot. No consulta nómina, tasas o fuentes mutables durante el procesamiento asíncrono.

### Modelo de datos objetivo

Ampliaciones aditivas propuestas para `conciliacion.RevisionAplicacionHistorico`:

```text
NominaCargaId
UsaDiasNomina
FormulaVersion
PrecisionPolicy
RegistrosNomina
RegistrosSinCoincidencia
RegistrosDiasCero
RegistrosFallback15
EstadoCompletitud
HashDetalle
```

Nueva tabla propuesta:

```text
conciliacion.RevisionAplicacionDetalleHistorico
```

El detalle debe conservar como mínimo:

```text
IdRevisionAplicacionHistorico
Interno
RFC normalizado o protegido
NominaCargaId
NominaDetalleId
DiasLaborados
OrigenDias
SueldoMensual
SueldoProporcional
OtrasPrestacionesAplicadas
BaseCotizacionQuinquenios
QuinqueniosAplicados
CatalogoPorcentajeFondoId
PorcentajePatron
PorcentajeAfiliado
CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI
EstadoFuente
FormulaVersion
FechaAlta
```

No se guardan nombres u otros datos personales cuando no son necesarios para auditoría.

### Feature flags

| Flag | Propósito | Estado inicial |
|---|---|---|
| `APORTACIONES_DIAS_NOMINA_V2` | Nueva resolución determinista de días | `false` |
| `APORTACIONES_DECIMAL_V1` | Aritmética D6/A2 con truncamiento | `false` |
| `LINEA_PAGO_SNAPSHOT_V2` | Línea consume snapshot oficial | `false` |
| `REVISION_CONCEPTO2_SNAPSHOT_V2` | Concepto 2 consume snapshot ajustado | `false` |

Cada flag se activa después de aprobar el gate de su fase. El rollback consiste en desactivar el flag sin eliminar evidencia escrita en sombra.

## Seguimiento por fases

| Fase | Nombre | Estado | Gate principal |
|---:|---|---|---|
| 0 | Línea base y contratos reales | `COMPLETADA` | Fuentes, contratos, fórmula y fixture verificados |
| 1 | Kernel monetario decimal | `COMPLETADA` | Kernel D6/A2, fórmula anual y pruebas de precisión verificados |
| 2 | Selección determinista de nómina | `COMPLETADA` | Selección e integridad verificadas en tres BD |
| 3 | Resolución de días V2 | `IMPLEMENTADA_PENDIENTE_E2E` | Precedencia TXT, movimiento y default implementada; falta validación con una QNA completa de Calidad |
| 4 | Snapshot detallado y doble escritura | `IMPLEMENTADA_EN_SOMBRA` | Snapshot V2, detalle, hash, revisiones y decisiones oficiales disponibles; falta promoverlo como fuente operativa |
| 5 | Protección contra reemplazos incompletos | `VALIDACION` | Guardado transaccional y pruebas unitarias disponibles; faltan pruebas de falla reales por fuente |
| 6 | Históricos y Línea de Pago | `PARCIAL` | Históricos participan en la transacción; Línea de Pago todavía no está vinculada mediante `SnapshotId` |
| 7 | REVISA concepto 2 | `PARCIAL` | Días y montos ajustados disponibles; el worker aún consume `RevisionAplicacionHistorico` y no el Snapshot V2 oficial |
| 8 | Frontend e históricos congelados | `BACKEND_IMPLEMENTADO` | Consulta y decisiones disponibles; falta cerrar frontend y definir la exportación oficial |
| 9 | Rollout productivo | `PENDIENTE` | Primera QNA productiva conciliada |
| 10 | Auditoría de periodos cerrados | `PENDIENTE` | Informe sin sobreescrituras automáticas |

## Fase 0: línea base y contratos reales

### Objetivo

Obtener evidencia suficiente para implementar sin inferir contratos de SQL Server, Firebird, nómina o fondos REVISA.

### Actividades

- Extraer DDL real de tablas, índices, TVP y SP productivos.
- Identificar la carga de nómina mediante entidad, orgánica completa, periodo y `CargaId`.
- Confirmar cardinalidad y duplicados por RFC.
- Capturar una QNA con trabajadores de días parciales.
- Comparar pantalla, históricos, Línea de Pago, `AP_S_FONDOS` y concepto 2.
- Confirmar el mapeo de los nueve fondos.
- Resolver específicamente `FH`, `FV` y `FAI/FAR`.
- Congelar la fórmula actual de Prestaciones como versión sin modificarla.
- Registrar porcentajes e identificadores de catálogo usados.
- Crear golden files de entrada y salida sin datos personales.

### Evidencia inicial registrada

Para `04-24/1426`:

```text
RevisionAplicacionHistorico.RegistrosOrigen = 169
Nómina vigente encontrada actualmente = 1 registro
Días del único registro vigente = 15
RFC duplicados vigentes = 0
```

La nómina vigente no permite reconstruir `1426`. Ese periodo queda clasificado como `FUENTE_NOMINA_INCOMPLETA` hasta localizar una carga o respaldo completo.

Comparación parcial de históricos `aportaciones` contra el snapshot `AP_S_FONDOS` de `1426`:

| Fondo | Histórico SQL D6 | Snapshot REVISA A2 |
|---|---:|---:|
| CAIR | `27,536.299600` | `27,536.45` |
| FRA | `61,956.674100` | `61,956.55` |
| FRE | `318,153.127294` | `318,153.05` |
| Vivienda (`FH + FV`) | `24,094.262197` | `24,094.15` |
| FAA | `68,840.749000` | `68,840.85` |
| FAE | `34,420.374500` | `34,420.17` |
| FAT | `103,261.123500` | `103,261.02` |

La diferencia restante de Vivienda y la composición especial de `FAI` impiden activar el nuevo snapshot como oficial hasta obtener aprobación funcional.

### Contratos reales extraídos

La consulta de metadata se ejecutó en modo lectura sobre `SII-ISSSSPEA` el `2026-08-15`.

- Existen los ocho TVP V2 de encabezado y detalle para Ahorro, Vivienda, Prestaciones y CAIR.
- Los importes de todos los TVP son `DECIMAL(19,6)`.
- Los TVP actuales no reciben `CargaId`, RFC, días laborados, origen de días, tasa o versión de fórmula.
- Los cuatro SP reciben `@Lotes`, `@Detalle` y `@Modo NVARCHAR(10)`.
- Los cuatro SP contienen una ruta `DELETE`; Ahorro y Prestaciones también contienen `MERGE`.
- La ruta TypeScript invoca los SP con `@Modo='REPLACE'`.
- `RevisionAplicacionHistorico` conserva los nueve fondos en `DECIMAL(19,2)`.

La definición de Firebird de `AP_S_FONDOS`, `FONDOS_ACT_CALC` y `FONDOS_ACT_IND` también fue extraída en modo lectura.

### Fórmula Firebird confirmada

`AP_S_FONDOS` calcula por trabajador:

```text
base = FONDOS_ACT_CALC(0, sueldo, otrasPrestaciones, quinquenios)
ajuste = FONDOS_ACT_IND(interno, org0, org1)

CAIR = base.SARE + ajuste.SARE
FRA  = base.FRA  + ajuste.FRA
FRE  = base.FRE  + ajuste.FRE
FH   = base.FHE  + ajuste.FH
FV   = base.FVE  + ajuste.FV
FAA  = base.FAA  + ajuste.FAA
FAE  = base.FAE  + ajuste.FAE
FAT  = base.FAT  + ajuste.FAT
FAI  = rendimientoFA + ajuste.FAI
```

Para una quincena normal, `FONDOS_ACT_CALC` divide sueldo, otras prestaciones y quinquenios entre dos:

```text
SQ  = sueldo / 2
OPQ = otrasPrestaciones / 2
QQ  = quinquenios / 2

CAIR = SQ * 0.0200
FRA  = SQ * 0.0450
FRE  = SQ * 0.2225 + OPQ * 0.2675 + QQ * 0.2675
FH   = SQ * 0.0035
FV   = SQ * 0.0140
FAA  = SQ * 0.0500
FAE  = SQ * 0.0250
FAT  = FAA + FAE
```

Las tasas actuales de SQL Server son:

| Tipo SQL | Patrón | Afiliado | Correspondencia Firebird |
|---|---:|---:|---|
| CAIR | `0.0200` | N/A | `SARE=0.0200` |
| Ahorro | `0.0250` | `0.0500` | `FAE=0.0250`, `FAA=0.0500` |
| Vivienda | `0.0175` | N/A | `FH=0.0035` + `FV=0.0140` |
| Prestaciones | `0.2225` | `0.0450` | `FRE` base y `FRA` |

La tasa SQL de Vivienda combina dos fondos REVISA. Por ello el histórico SQL no puede separarlos después de guardarse; el nuevo detalle debe calcular y congelar `FH` y `FV` por separado.

La fórmula activa de Prestaciones todavía no es equivalente a Firebird: el backend aplica `0.2225` a otras prestaciones, mientras Firebird aplica `0.2675`. Los quinquenios sí usan `0.2675` en ambos cálculos activos.

`FAI/FAR` no es una aportación proporcional a días. En quincenas pares, `AP_S_FONDOS` calcula un rendimiento redondeado a pesos enteros a partir del saldo anterior, `INTERES_APLICAR` y la TIIE mensual; después agrega movimientos individuales y PCP. En quincenas impares el rendimiento base es cero, pero los ajustes individuales pueden permanecer. Debe conservarse como componente de fuente Firebird hasta que negocio apruebe otra regla.

### Avance de actividades de Fase 0

| Actividad | Estado | Evidencia |
|---|---|---|
| Flujo backend completo | `COMPLETADA` | Rutas, repositorios, worker y Línea trazados |
| Contratos TVP/SP | `COMPLETADA` | Baseline completo y paridad verificada en tres BD |
| Fuente `AP_S_FONDOS` | `COMPLETADA` | Definiciones Firebird extraídas |
| Mapeo técnico de nueve fondos | `COMPLETADA` | Fórmulas base y ajustes identificados |
| Aprobación funcional de fondos | `COMPLETADA` | Vivienda separada, FAI conservado y Prestaciones Firebird aprobadas |
| Fórmula anual SQL | `COMPLETADA_TRES_BD` | Desarrollo, Calidad y Producción con contratos y parámetros idénticos |
| QNA completa con días parciales | `SELECCIONADA_SOLO_LECTURA` | `1126`, carga `15`, 169 registros y 11 días parciales |
| Golden files sin datos personales | `COMPLETADA` | Fixture reproducible con 13 casos anonimizados de `1126` |
| Fórmula única de Prestaciones | `COMPLETADA` | Se aprobó replicar la fórmula Firebird |

### QNA seleccionada para pruebas en sombra

Se seleccionó `04-24-01-01 / 1126`, carga de nómina `15`.

| Evidencia | Resultado |
|---|---:|
| Estado de carga | `APLICADA` |
| Registros de nómina | `169` |
| RFC únicos en nómina | `169` |
| Registros Firebird | `169` |
| RFC únicos Firebird | `169` |
| Coincidencias RFC | `168` |
| Solo en nómina | `1` |
| Solo en Firebird | `1` |
| Días 12 | `1` |
| Días 13 | `3` |
| Días 14 | `7` |
| Días 15 | `158` |
| Días cero o nulos en archivo | `0` |
| Bitácora | `TERMINADO / OK` |
| Snapshot concepto 2 | No existe para `1126` |

El afiliado presente únicamente en Firebird permite probar la regla `NOMINA_SIN_COINCIDENCIA`: cero días y bases proporcionales en cero. Los ajustes externos y `FAI/FAR` se mantienen conforme a su fuente.

La QNA está cerrada, por lo que su uso queda limitado a consultas, golden tests y modo sombra. No se permite ejecutar `REPLACE`, crear un snapshot oficial ni sobrescribir históricos.

Línea base de históricos SQL para `1126`:

| Fondo | Registros | Total detalle D6 | Total resumen D6 |
|---|---:|---:|---:|
| Ahorro | `169` | `103,038.390000` | `103,038.460000` |
| Prestaciones | `169` | `378,830.100000` | `378,830.220000` |
| Vivienda | `169` | `24,042.090000` | `24,042.310000` |
| CAIR | `169` | `27,477.070000` | `27,476.920000` |

Línea base Firebird `AP_S_FONDOS('04','24','1126')`:

| Fondo | Total A2 |
|---|---:|
| CAIR | `27,536.45` |
| FRA | `61,956.55` |
| FRE | `318,153.05` |
| FH | `4,818.87` |
| FV | `19,275.28` |
| FAA | `68,840.85` |
| FAE | `34,420.17` |
| FAT | `103,261.02` |
| FAI | `0.00` |

Las diferencias entre detalle, resumen y Firebird son parte de la línea base; no deben corregirse antes de ejecutar el cálculo candidato D6/A2.

### Golden fixture anonimizado

Artefactos:

```text
scripts/generate-aportaciones-1126-golden.ts
scripts/fixtures/aportaciones/periodo-1126.golden.json
```

Regeneración de solo lectura:

```bash
npm run golden:aportaciones:1126
```

El fixture contiene:

- La fórmula anual activa y sus 15 parámetros.
- Cobertura agregada entre nómina y Firebird.
- Once casos con días parciales.
- Un caso `NOMINA_SIN_COINCIDENCIA`.
- Un caso `NOMINA_SIN_AFILIADO_FIREBIRD`.
- Líneas base de detalle histórico, resumen y `AP_S_FONDOS`.
- Importes como cadenas decimales para no perder escala durante las pruebas.

El generador no escribe en SQL Server o Firebird. No exporta RFC, nombres, internos, líneas originales u otros identificadores personales. Los casos usan alias `PARTIAL_nnn`, `MISSING_PAYROLL_nnn` y `MISSING_FIREBIRD_nnn`.

Los valores `legacyFirebird` y `baselines` son controles del comportamiento anterior; todavía no representan el resultado esperado del cálculo candidato D6/A2. Ese resultado se agregará al implementar el kernel monetario de la Fase 1.

### Archivos bajo análisis

```text
src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts
src/modules/aplicacionQuincenal/aplicacionQuincenal.routes.ts
src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts
src/modules/historicosQuincenales/infrastructure/persistence/HistoricosQuincenalesRepository.ts
src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.ts
src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.ts
src/modules/reportes/revision/application/RevisionWorker.ts
```

### Bloqueadores abiertos

| Id | Bloqueador | Acción requerida | Estado |
|---|---|---|---|
| D-01 | `FH` no existe separado en históricos SQL | Aprobado `SQ * 0.0035` más ajustes individuales | `RESUELTO` |
| D-02 | Vivienda SQL combina `FH + FV` | Aprobada separación `0.0035 + 0.0140` en el nuevo detalle | `RESUELTO` |
| D-03 | `FAI/FAR` no depende directamente de días | Aprobado conservar rendimiento y ajustes desde Firebird | `RESUELTO` |
| D-04 | Fórmula AFPE activa difiere de Firebird y documentación | Aprobado replicar Firebird para FRA/FRE | `RESUELTO` |
| D-05 | DDL productivo de SP/TVP no versionado | Baseline completo de TVP, SP, tablas e índices generado | `RESUELTO` |
| D-06 | Porcentaje vigente no resuelto por periodo | Catálogo anual activo y paridad verificada en las tres BD | `RESUELTO` |
| D-07 | Línea de Pago usa `Math.round` | Sustituir por agregado A2 compartido en Fase 6 | `IDENTIFICADO` |
| D-08 | Plantillas contienen credenciales sensibles | Rotar credenciales y moverlas a variables/secret store | `CRITICO_ABIERTO` |
| D-09 | Mapeo de BD podía invertir Desarrollo y Calidad | Matriz única y verificador automático; despliegue sin cambios | `RESUELTO` |

### Baseline de contratos históricos

Artefactos:

```text
scripts/snapshot-aportaciones-historico-contracts.ts
scripts/fixtures/aportaciones/historico-contracts.golden.json
```

Regeneración y validación de paridad:

```bash
npm run snapshot:historico:contracts
```

El baseline conserva únicamente metadata y definiciones SQL, sin filas de negocio. Incluye:

- Ocho tipos de tabla TVP V2 y todas sus columnas.
- Cuatro procedimientos de guardado histórico y sus definiciones completas.
- Parámetros de los cuatro procedimientos.
- Cinco tablas históricas y todas sus columnas.
- Índices de las tablas históricas.

Resultado en los tres ambientes:

| Ambiente | TVP | SP | Tablas | Hash |
|---|---:|---:|---:|---|
| Desarrollo | `8` | `4` | `5` | `FE828C86D0DFFEE6F9C4EDD06A756E393C59B94CB0AC0F231C0E2CCA658A2151` |
| Calidad | `8` | `4` | `5` | `FE828C86D0DFFEE6F9C4EDD06A756E393C59B94CB0AC0F231C0E2CCA658A2151` |
| Producción | `8` | `4` | `5` | `FE828C86D0DFFEE6F9C4EDD06A756E393C59B94CB0AC0F231C0E2CCA658A2151` |

El comando falla con `HISTORICO_CONTRACT_PARITY_FAILED` si un ambiente difiere.

### Paquete SQL de fórmula versionada

Preparado el `2026-08-15` y ejecutado manualmente en la base configurada `SII-ISSSSPEA`:

```text
database/migrations/20260815_create_formula_calculo_version.sql
database/migrations/20260815_verify_formula_calculo_version.sql
database/migrations/20260815_rollback_formula_calculo_version.sql
```

El script principal:

- Crea `aportaciones.FormulaCalculoVersion`.
- Crea `aportaciones.FormulaCalculoParametro`.
- Registra `APORTACIONES-NOMINA/2026/V1`, QNA `01-24`, en estado `ACTIVA`.
- Registra 15 parámetros con `DECIMAL(19,9)`.
- Es idempotente y rechaza diferencias silenciosas.
- No usa `MERGE`.
- No incluye `USE`; la BD debe seleccionarse manualmente.
- No modifica `CatalogoPorcentajeFondo`, históricos, Línea o REVISA.
- Crea `aportaciones.spObtenerFormulaCalculoPeriodo`.
- Crea `aportaciones.spClonarFormulaCalculoVersion`.
- Permite clonar al siguiente año o crear una versión desde una QNA específica.
- Recibe cambios de parámetros mediante JSON y activa la versión atómicamente.

No existe estado `BORRADOR`. Una nueva versión se crea con sus 15 parámetros y queda `ACTIVA` dentro de la misma transacción. Si falla una validación, se revierte por completo. El rollback requiere confirmación explícita y rechaza snapshots asociados.

### Evidencia de instalación SQL

Verificación de solo lectura ejecutada después de la instalación manual:

| Campo | Resultado |
|---|---|
| Base de datos | `SII-ISSSSPEA` |
| `FormulaCalculoVersionId` | `1` |
| Clave | `APORTACIONES-NOMINA` |
| Año | `2026` |
| Versión | `1` |
| Vigencia | QNA `01-24` |
| Estado | `ACTIVA` |
| Política | `MXN-DETAIL6-AGG2-TRUNC-v1` |
| Parámetros | `15` |
| Fecha alta SQL | `2026-08-16 05:07:55.721` |

El procedimiento `aportaciones.spObtenerFormulaCalculoPeriodo` resolvió la misma versión para las QNA `01` y `24`. No se encontraron faltantes ni traslapes. El intento de rollback quedó bloqueado antes de modificar datos porque `@ConfirmarEliminacionActiva=0`, que es el comportamiento de seguridad esperado.

### Paridad entre ambientes

Mapa validado:

| Ambiente | Base de datos | Fórmula | Parámetros |
|---|---|---|---:|
| Desarrollo | `SII-ISSSSPEA-DES` | `2026/V1`, QNA `01-24`, `ACTIVA` | `15` |
| Calidad | `SII-ISSSSPEA` | `2026/V1`, QNA `01-24`, `ACTIVA` | `15` |
| Producción | `SII-ISSSSPEA-PROD` | `2026/V1`, QNA `01-24`, `ACTIVA` | `15` |

Huellas SHA-256 idénticas:

| Contrato | SHA-256 |
|---|---|
| Esquema de tablas | `D758B3CA3CAB8BFB2CD0BC86B0842CAC27DD446E0049D3E3734975AF512609F5` |
| Procedimientos | `676EB2F85803A05CD0981E9BAC3C1000C172523218DF9C3124098853D2407F54` |
| Fórmula y parámetros | `CFA25426C1F14DCE9B28D816C8CA2C2BF86530FD3B9CA95E45484887285B0717` |

Verificación reproducible de solo lectura:

```bash
npm run verify:formula:databases
```

El comando falla con `DATABASE_PARITY_FAILED` si cualquiera de los tres contratos difiere. Los IDs, usuarios y fechas de auditoría se excluyen deliberadamente de la huella funcional.

Ejemplo para copiar 2026 a 2027 sin cambiar tasas:

```sql
EXEC aportaciones.spClonarFormulaCalculoVersion
  @FormulaOrigenId = 1,
  @AnioDestino = 2027,
  @QuincenaDesde = 1,
  @CambiosJson = NULL,
  @Usuario = N'usuario';
```

Ejemplo de cambio a partir de la QNA 13 del mismo año:

```sql
EXEC aportaciones.spClonarFormulaCalculoVersion
  @FormulaOrigenId = 1,
  @AnioDestino = 2026,
  @QuincenaDesde = 13,
  @CambiosJson = N'[{"clave":"FH_SUELDO","valor":0.004000000}]',
  @Usuario = N'usuario';
```

### Gate de salida

La Fase 0 solo se marca `COMPLETADA` cuando:

- Los nueve fondos tienen fuente y fórmula aprobadas.
- Se conoce el DDL productivo real.
- Existe una QNA de prueba con nómina completa y días parciales.
- Se aprueba la fórmula congelada de Prestaciones para este rollout.
- Se aprueba la política monetaria para modo sombra.

### Rollback

No aplica: la fase es diagnóstica y no modifica cálculos productivos.

## Fase 1: kernel monetario decimal

### Objetivo

Implementar aritmética decimal exacta D6/A2 sin decidir todavía importes oficiales.

### Actividades

- Crear tipos `Money6`, `Rate6` y `Aggregate2`.
- Implementar `T6`, `T2`, suma, multiplicación y división exactas.
- Evitar `number`, `Math.round`, `Number.EPSILON` y `toFixed` en decisiones monetarias.
- Normalizar `-0.000000` y `-0.00` a cero.
- Ejecutar cálculo actual y candidato en paralelo.
- Registrar diferencias sin cambiar respuestas ni persistencia.

### Pruebas mínimas

- Valores positivos y negativos.
- Fronteras de truncamiento.
- Multiplicación por tasas de seis decimales.
- División sueldo/30 por días fraccionarios.
- Suma de miles de detalles sin deriva.
- `FAT = FAA + FAE`.
- Agregados padre como suma de hijos A2.

### Implementación realizada

Archivos de dominio e infraestructura:

```text
src/modules/aportacionesFondos/domain/entities/FormulaCalculo.ts
src/modules/aportacionesFondos/domain/repositories/IFormulaCalculoRepository.ts
src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.ts
src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.ts
```

Características del lector:

- Resuelve por clave, año y QNA; no usa IDs fijos.
- Ejecuta `aportaciones.spObtenerFormulaCalculoPeriodo`.
- Recupera `DECIMAL(19,9)` como texto para evitar IEEE-754.
- Exige exactamente las 15 claves conocidas.
- Rechaza claves faltantes, duplicadas o desconocidas.
- Traduce ausencia, traslape y errores SQL a errores de dominio.
- Está registrado en Awilix como `formulaCalculoRepo`.

Características del kernel:

- Usa `bigint` con escala interna 9.
- No usa `number`, `Math.round`, `Number.EPSILON` o `toFixed` para decisiones monetarias.
- Finaliza bases y componentes individuales en D6.
- Suma detalles D6 antes de finalizar agregados A2.
- Trunca hacia cero en positivos y negativos.
- Normaliza cero negativo.
- Calcula CAIR, FRA, FRE, FH, FV, FAA, FAE y FAT.
- No calcula ni modifica `FAI/FAR`; permanece como fuente externa Firebird.

Pruebas ejecutables:

```bash
npm run test:aportaciones:phase1
npm run verify:formula:repository
```

Resultados:

```text
APORTACIONES_PHASE1_TESTS_OK
SII-ISSSSPEA: FORMULA_REPOSITORY_OK
SII-ISSSSPEA-DES: FORMULA_REPOSITORY_OK
SII-ISSSSPEA-PROD: FORMULA_REPOSITORY_OK
```

El primer caso parcial de `1126` produjo:

| Campo | D6 |
|---|---:|
| Sueldo proporcional | `4,688.044000` |
| CAIR | `93.760880` |
| FRA | `210.961980` |
| FRE | `1,043.089790` |
| FH | `16.408154` |
| FV | `65.632616` |
| FAA | `234.402200` |
| FAE | `117.201100` |
| FAT | `351.603300` |

La prueba también confirma que `1.239999 + 1.239999` genera agregado `2.47`, no `2.46`, y que `-123.459999` finaliza como `-123.45`.

Esta implementación todavía no se invoca desde rutas productivas y no modifica respuestas, históricos, Línea o REVISA.

### Ejecución sombra sobre fixture

Artefactos:

```text
scripts/run-aportaciones-1126-shadow.ts
scripts/fixtures/aportaciones/periodo-1126.shadow.json
```

Ejecución:

```bash
npm run shadow:aportaciones:1126
```

Resultado:

```text
totalCases = 13
calculated = 12
skippedNoFirebirdBase = 1
APORTACIONES_1126_SHADOW_OK
```

Los once trabajadores parciales y el caso `NOMINA_SIN_COINCIDENCIA` fueron calculados con el kernel. El registro presente solo en nómina quedó explícitamente como `SKIPPED_NO_FIREBIRD_BASE`; no se convirtió en cero ni en un cálculo incompleto.

El reporte presenta candidato D6, legado Firebird A2 y diferencia diagnóstica. Los valores legados por trabajador pueden incluir ajustes externos acumulados, por lo que la diferencia no se interpreta automáticamente como corrección. No se escribieron datos ni se invocaron rutas productivas.

### Gate de salida

Golden tests y diferencias de sombra aprobados por responsables funcional y técnico.

### Rollback

Mantener `APORTACIONES_DECIMAL_V1=false`.

## Fase 2: selección determinista de nómina

### Objetivo

Resolver una única carga de nómina por liquidación.

### Actividades

- Seleccionar por entidad, año, quincena y orgánica 0–3.
- Resolver el `CargaId` aceptado y vigente.
- Identificar un `CargaId` TXT base y contabilizar movimientos complementarios por separado.
- Normalizar RFC.
- Rechazar RFC duplicados dentro de la carga.
- Retirar dependencia frontend de la primera página de 200 filas.
- Exponer metadata de carga y cobertura sin datos personales.

### Diseño implementado

La tabla de cargas distingue:

```text
TipoCarga = TXT | MOVIMIENTO
EsVigente = 0 | 1
```

Solo puede existir una carga `TXT/APLICADA/EsVigente=1` por entidad, año, QNA y orgánica 0–3. Los movimientos de afiliado quedan como `MOVIMIENTO/EsVigente=0` y pueden complementar filas vigentes sin sustituir la identidad de la carga TXT base.

Migraciones manuales:

```text
database/migrations/20260816_add_nomina_carga_tipo_vigente.sql
database/migrations/20260816_verify_nomina_carga_tipo_vigente.sql
```

La migración:

- Clasifica cargas históricas TXT y movimientos.
- Marca como vigente la última carga TXT aplicada de cada ámbito.
- Crea un índice único filtrado para una sola carga TXT vigente.
- Agrega `RfcNormalizado` como columna calculada persistida.
- Crea unicidad de RFC normalizado por ámbito.
- Agrega índices de selección y cobertura.

El backend:

- Desactiva la carga TXT anterior dentro de la transacción de reemplazo.
- Registra cargas nuevas con tipo y vigencia explícitos.
- Registra movimientos como complementarios, nunca como carga TXT base.
- Rechaza RFC duplicados durante la carga antes de escribir detalles.
- Serializa la búsqueda de movimientos con `UPDLOCK, HOLDLOCK`.
- Lee carga y estadísticas en una sola sentencia SQL.
- Filtra por entidad, año, QNA y orgánicas 0–3.
- Reporta registros base, complementarios, cargas presentes, cobertura de RFC y distribución de días.

Endpoint nuevo:

```http
GET /v1/nomina/aplicacion-qnal-txt/carga-vigente
```

La respuesta usa `{ ok: true, data: null }` cuando no existe TXT. Si detecta múltiples cargas base o RFC duplicados devuelve `409 NOMINA_CARGA_INCONSISTENTE`. No expone registros personales y no depende de paginación.

Verificación posterior a la migración:

```bash
npm run verify:nomina:selection
```

Este comando finalizó correctamente en los tres ambientes:

```text
SII-ISSSSPEA: NOMINA_SELECTION_OK scopes=4
SII-ISSSSPEA-DES: NOMINA_SELECTION_OK scopes=2
SII-ISSSSPEA-PROD: NOMINA_SELECTION_OK scopes=3
```

### Orden obligatorio de despliegue

1. Reejecutar `20260815_create_formula_calculo_version.sql` en las tres BD para actualizar los procedimientos corregidos.
2. Ejecutar `20260815_verify_formula_calculo_version.sql` en las tres BD.
3. Ejecutar `20260816_add_nomina_carga_tipo_vigente.sql` en las tres BD.
4. Ejecutar `20260816_verify_nomina_carga_tipo_vigente.sql` en las tres BD.
5. Ejecutar `npm run verify:formula:databases`.
6. Ejecutar `npm run verify:nomina:selection`.
7. Desplegar el backend únicamente después de que todos los gates sean correctos.

### Revisión de Fases 0 a 2

| Fase | Veredicto técnico | Evidencia | Pendiente |
|---:|---|---|---|
| 0 | `PASS` | Fórmula y contratos con paridad en tres BD | Ninguno para este gate |
| 1 | `PASS_VALIDACION` | Build, golden tests, lector en tres BD y sombra correctos | Aprobación funcional de diferencias |
| 2 | `PASS` | Código, SQL, DI, endpoint e integridad verificados en tres BD | Ninguno para este gate |

Correcciones incorporadas durante la revisión:

- Las migraciones relevantes dejaron de estar ocultas por `.gitignore`.
- La clonación de fórmula rechaza cualquier intervalo activo que se traslape.
- El SP de fórmula devuelve tasas como texto decimal D9.
- El repositorio consume metadata y parámetros de una misma ejecución del SP.
- La fórmula valida política, cobertura, unidades y relaciones entre días.
- La carga vigente y sus estadísticas se leen bajo transacción `SERIALIZABLE`.
- La migración configura los `SET` requeridos por columnas calculadas persistidas.
- RFC queda protegido por validación de carga, bloqueo serializable e índice único por ámbito.
- Golden fixtures solicitan importes como texto tanto en SQL Server como en Firebird.
- El ejecutor sombra comprueba cobertura, cero por ausencia, `FAT=FAA+FAE` y un caso golden completo.
- El rollback de fórmula rechaza versiones descendientes.

Riesgos transversales no resueltos:

- Las plantillas de ambiente y despliegue contienen credenciales que deben rotarse y moverse a un mecanismo de secretos.
- El despliegue debe validar explícitamente el mapeo Desarrollo, Calidad y Producción antes de iniciar el backend.

### Gate de salida

Cada liquidación identifica una carga única o declara explícitamente que no existe TXT.

### Rollback

La selección nueva permanece en sombra; el cálculo actual sigue activo.

## Fase 3: resolución de días V2

### Objetivo

Aplicar las reglas aprobadas de días sin cambiar aún Línea de Pago o REVISA.

### Actividades

- Diferenciar ausencia global de TXT y ausencia individual.
- Conservar `DiasLaborados=0` como cero.
- Asignar cero a sus bases proporcionales cuando existe TXT y el trabajador falta.
- Mantener 15 solo cuando no existe archivo para la QNA.
- Rechazar días fuera de `0..15`.
- Aplicar `BaseCotizacionQuinquenios` del TXT.
- Conservar por separado rendimiento y ajustes Firebird no proporcionales.
- Registrar origen y cobertura.
- Comparar días usados por pantalla y guardado histórico.

### Responsabilidad de validación del TXT

La coincidencia entre el TXT y la plantilla vigente se valida únicamente en el frontend existente. No se duplican esas reglas en el backend:

- Un RFC de plantilla ausente en el TXT bloquea actualmente el envío desde el frontend.
- Un RFC extra del TXT no bloquea y se omite antes del envío.
- RFC inválidos, RFC duplicados y errores de layout bloquean el envío.
- El backend conserva sus validaciones técnicas actuales, pero no agrega una comparación contra plantilla o Firebird.

La resolución de días no agrega un nuevo bloqueo de carga. Opera sobre el TXT que ya fue aceptado y distingue ausencia global del archivo de ausencia individual defensiva.

### Frontera temporal de fuentes

- Firebird se usa únicamente para la QNA vigente o la última QNA reportada por `afec.BitacoraAfectacionOrg`.
- Una QNA anterior se consulta exclusivamente desde los históricos SQL Server ya almacenados.
- Los históricos no se enriquecen con PERSONAL, ORG_PERSONAL, salarios, RFC o categorías vigentes de Firebird.
- Si el histórico SQL no conserva un dato, no se reconstruye con fuentes actuales; su ampliación corresponde al snapshot detallado de la Fase 4.

### Implementación V2

- La ruta opt-in `usarDiasLaboradosNomina=1` selecciona las cargas `TXT/APLICADA/EsVigente=1` que cubren la consulta Firebird solicitada.
- Cada carga conserva su ámbito completo entidad, año, QNA y orgánicas 0–3; consultas agregadas por orgánicas 0–1 unen únicamente sus `CargaId` vigentes.
- Los detalles se consultan exclusivamente por esos `CargaId`; movimientos y cargas reemplazadas no participan.
- Un RFC repetido entre cargas TXT vigentes detiene el cálculo para evitar una selección ambigua; esta protección no modifica ni duplica la validación frontend de cada archivo.
- Sin carga TXT vigente se conserva `15/default`.
- Con carga TXT, `DiasLaborados=0` o nulo se conserva como cero con origen `nomina`.
- Con carga TXT y RFC sin coincidencia se usa cero con origen `nomina_sin_coincidencia`.
- Valores fuera de `0..15` detienen el cálculo.
- `BaseCotizacionQuinquenios` se conserva desde el mismo detalle TXT seleccionado.
- El comportamiento previo permanece cuando no se solicita `usarDiasLaboradosNomina=1`.

### Gate de salida

Pantalla, cálculo en sombra y detalle candidato usan los mismos días por trabajador.

### Rollback

Mantener `APORTACIONES_DIAS_NOMINA_V2=false`.

## Fase 4: snapshot detallado y doble escritura

### Objetivo

Congelar fuentes, días, tasas, fórmula, detalle D6 y agregados A2.

### Actividades

- Crear migración aditiva.
- Guardar detalle y encabezado en una transacción.
- Conservar los históricos actuales durante doble escritura.
- Validar que detalle y encabezado concilien.
- Guardar hash, estado de completitud y versión.
- Bloquear reemplazos después del cierre.

### Gate de salida

Snapshot candidato e históricos actuales concilian o sus diferencias están aprobadas.

### Rollback

Detener doble escritura; no eliminar snapshots ya creados.

## Fase 5: protección contra reemplazos incompletos

### Objetivo

Evitar pérdida de históricos por errores convertidos en arreglos vacíos.

### Actividades

- Retirar `.catch(() => null)` de fuentes obligatorias.
- Usar `Promise.allSettled` con clasificación de fuentes.
- Abortar ante una fuente requerida fallida.
- Prohibir `REPLACE` vacío causado por error.
- Diferenciar cero válido, no aplicable, faltante y error.
- No crear snapshot si la liquidación está incompleta.

### Gate de salida

Pruebas de falla demuestran que ningún histórico vigente cambia.

### Rollback

No aplica como comportamiento: no se permite restaurar el reemplazo silencioso.

## Fase 6: históricos y Línea de Pago

### Objetivo

Usar montos ajustados por días como fuente compartida de históricos y Línea de Pago.

### Actividades

- Persistir históricos desde la liquidación única.
- Vincular Línea de Pago con `SnapshotId`.
- No cambiar fórmulas propias de Línea.
- Verificar totales por fondo y gran total A2.
- Activar primero en Calidad.

### Gate de salida

Línea de Pago coincide exactamente con el snapshot oficial.

### Rollback

Desactivar `LINEA_PAGO_SNAPSHOT_V2`; conservar evidencia del snapshot.

## Fase 7: REVISA concepto 2

### Objetivo

Hacer que concepto 2 copie el snapshot oficial ajustado.

### Actividades

- Mantener al worker como lector.
- Guardar `SnapshotId` en la tarea o fuente REVISA.
- No consultar nómina, Firebird o tasas durante el worker.
- Conservar contrato HTTP actual.
- Incluir versión y estado de fuente en trazabilidad SFTP.

### Gate de salida

Los nueve fondos del concepto 2 coinciden con el snapshot oficial A2.

### Rollback

Desactivar `REVISION_CONCEPTO2_SNAPSHOT_V2` antes de programar nuevas tareas.

## Fase 8: frontend e históricos congelados

### Objetivo

Mostrar la evidencia usada al aplicar la QNA sin consultar fuentes vigentes.

### Actividades

- Mostrar días congelados y su origen.
- Mostrar carga y versión de fórmula.
- Mostrar cobertura y faltantes en cero.
- No enriquecer históricos con la nómina vigente.
- Mantener `fai` como campo técnico y `FAR` como etiqueta visual.
- Aplicar D6 en exportaciones de detalle y A2 en resultados.

### Gate de salida

Pantalla, histórico y exportaciones muestran el mismo snapshot.

### Rollback

Ocultar metadata aditiva sin cambiar el contrato monetario previo.

## Fase 9: rollout productivo

### Orden obligatorio

1. Desarrollo en sombra.
2. Calidad con doble escritura.
3. QNA completa con días parciales.
4. Aprobación de diferencias.
5. Activación de días V2.
6. Validación de una QNA.
7. Activación decimal D6/A2.
8. Validación de Línea de Pago.
9. Activación del snapshot para concepto 2.
10. Producción por orgánica controlada.

### Gate de salida

Primera QNA productiva conciliada entre detalle, históricos, Línea y REVISA.

## Fase 10: auditoría de periodos cerrados

### Objetivo

Identificar diferencias históricas sin reconstruir con fuentes actuales incompletas.

### Clasificación

```text
RECONSTRUIBLE
FUENTE_INCOMPLETA
SIN_NOMINA_HISTORICA
DIFERENCIA_REQUIERE_AUTORIZACION
NO_RECONSTRUIBLE
```

### Reglas

- No sobrescribir automáticamente.
- No usar porcentajes vigentes actuales.
- No usar nómina vigente como si fuera histórica.
- Generar informe de diferencias.
- Corregir solo mediante proceso autorizado e histórico.

## Matriz de pruebas obligatorias

| Caso | Resultado esperado |
|---|---|
| Sin TXT | 15 días, origen explícito, resultado compatible |
| TXT completo | Días de carga seleccionada |
| Trabajador ausente | 0 días y bases proporcionales en cero; ajustes externos conservados |
| Días cero | 0 días y bases proporcionales en cero; ajustes externos conservados |
| Días nulos | 0 días y bases proporcionales en cero; ajustes externos conservados |
| Días parciales | Base proporcional D6 |
| Días fuera de rango | Liquidación rechazada |
| RFC duplicado | Liquidación rechazada |
| Carga de otra orgánica | No seleccionada |
| Carga reemplazada | Nueva versión candidata |
| Reemplazo después del cierre | Rechazado |
| Falla Firebird | Sin `REPLACE`, sin snapshot |
| Detalle vs encabezado | Diferencia cero |
| FAA + FAE | Igual a FAT |
| Línea vs snapshot | Diferencia cero |
| Concepto 2 vs snapshot | Diferencia cero |
| Reintento | Mismo hash e importes |
| Valor negativo | Truncamiento hacia cero correcto |
| Exportación | Coincide con snapshot |

## Bitácora de avance

| Fecha | Fase | Cambio | Evidencia | Resultado |
|---|---:|---|---|---|
| 2026-08-15 | 0 | Creación del plan vivo y registro de línea base | Este documento | `EN_PROGRESO` |
| 2026-08-15 | 0 | Trazado de nómina, históricos, Línea y concepto 2 | Referencias de repositorios registradas | `COMPLETADO` |
| 2026-08-15 | 0 | Extracción de metadata real de ocho TVP y cuatro SP | Consulta de catálogo `SII-ISSSSPEA` | `PARCIAL` |
| 2026-08-15 | 0 | Extracción de `AP_S_FONDOS`, `FONDOS_ACT_CALC` y `FONDOS_ACT_IND` | Metadata Firebird en modo lectura | `COMPLETADO` |
| 2026-08-15 | 0 | Explicación técnica de `FH`, `FV` y `FAI` | Fórmulas y tasas documentadas | `PENDIENTE_APROBACION_FUNCIONAL` |
| 2026-08-15 | 0 | Aprobación funcional de Vivienda, FAI/FAR y Prestaciones | Decisiones normativas actualizadas | `COMPLETADO` |
| 2026-08-15 | 0 | Preparación del catálogo SQL versionado | Scripts de creación, verificación y rollback | `PENDIENTE_EJECUCION_MANUAL` |
| 2026-08-15 | 0 | Sustitución por versionado anual activo sin borradores | Resolución y clonación transaccional incluidas | `PENDIENTE_EJECUCION_MANUAL` |
| 2026-08-15 | 0 | Verificación de instalación anual activa | `SII-ISSSSPEA`, versión `2026/V1`, 15 parámetros | `COMPLETADO` |
| 2026-08-15 | 0 | Selección de QNA para pruebas en sombra | `1126`, carga `15`, 11 parciales y una ausencia en nómina | `COMPLETADO_SOLO_LECTURA` |
| 2026-08-15 | 0 | Generación de golden fixture anonimizado | 13 casos, fórmula activa y líneas base | `COMPLETADO` |
| 2026-08-15 | 0 | Verificación de paridad entre tres BD | Tres huellas SHA-256 coincidentes | `COMPLETADO` |
| 2026-08-15 | 0 | Versionado de contratos históricos | 8 TVP, 4 SP y 5 tablas idénticos en tres BD | `COMPLETADO` |
| 2026-08-15 | 0 | Cierre del gate de Fase 0 | Todos los criterios de salida documentados | `COMPLETADO` |
| 2026-08-15 | 1 | Implementación del lector de fórmula anual | Repositorio validado en tres BD | `COMPLETADO` |
| 2026-08-15 | 1 | Implementación del kernel D6/A2 | Pruebas de precisión y caso parcial `1126` | `VALIDACION` |
| 2026-08-15 | 1 | Ejecución sombra anonimizada | 12 calculados y 1 omitido por falta de base Firebird | `VALIDACION` |
| 2026-08-15 | 2 | Implementación de selección determinista | Tipo, vigencia, unicidad, endpoint y DI | `PENDIENTE_SQL` |
| 2026-08-15 | 0-2 | Revisión regresiva | Build, fórmula, contratos, kernel y sombra correctos | `COMPLETADO_CON_BLOQUEO_SQL` |
| 2026-08-15 | 0-2 | Corrección de hallazgos de revisión | Atomicidad, traslapes, RFC, D9, fixtures y rollback | `COMPLETADO` |
| 2026-08-16 | 2 | Migración de clasificación y vigencia de nómina | Desarrollo, Calidad y Producción | `COMPLETADO` |
| 2026-08-16 | 2 | Verificación determinista de carga | Ámbitos `4/2/3`, sin inconsistencias | `COMPLETADO` |
| 2026-08-16 | 0-2 | Revisión regresiva final | Fórmula, contratos, kernel, repositorio, sombra y build | `PASS` |
| 2026-08-16 | 3 | Resolución de días por carga TXT vigente | Pruebas de default, cero, nulo, ausencia y rango | `VALIDACION` |
| 2026-08-16 | 3 | E2E de frontera temporal | QNA vigente `1526`: 169 Firebird/default; histórico `1126`: 169 por fondo desde SQL | `PASS_PARCIAL_SIN_TXT_VIGENTE` |
| 2026-08-16 | 0-3 | Corrección de matriz de ambientes | Matriz y guard automático; despliegue sin cambios | `COMPLETADO` |
| 2026-08-16 | 0 | Revalidación por ambiente | Fórmula, repositorio y contratos históricos con paridad en tres bases | `PASS` |
| 2026-08-16 | 1 | Regeneración golden `1126` | Calidad explícita, SQL y Firebird registrados, 13 casos anonimizados | `PASS_VALIDACION` |
| 2026-08-16 | 2 | Revalidación de carga vigente | Desarrollo `2`, Calidad `4`, Producción `3` ámbitos | `PASS` |
| 2026-08-16 | 3 | E2E estricta fijada a Calidad | `1526` sin TXT; gate detuvo el cálculo con `FASE3_TXT_VIGENTE_REQUERIDO_1526` | `BLOQUEO_ESPERADO_SIN_TXT` |
| 2026-08-16 | 4 | Sombra histórica `1426` | Línea vigente, REVISA=Firebird congelado y candidato SQL calculado | `VALIDACION_REDONDEO` |
| 2026-08-17 | 1 | Política monetaria definitiva | `MXN-DETAIL6-AGG2-TRUNC-v1`, detalle D6 y agregados A2 | `COMPLETADO` |
| 2026-08-17 | 4 | Snapshot V2 aditivo | Encabezado, detalle, hash, revisiones, consulta y persistencia transaccional | `IMPLEMENTADO_EN_SOMBRA` |
| 2026-08-17 | 4-8 | Decisiones oficiales de Snapshot V2 | Bandeja, aceptación, rechazo, historial y selección oficial | `IMPLEMENTADO_CALIDAD` |
| 2026-08-17 | 3 | Resolución de días por movimientos | Origen `movimiento`, reglas AL/BA/LB y precedencia `TXT -> movimiento -> default` | `IMPLEMENTADO_PENDIENTE_E2E` |
| 2026-08-17 | 3 | Separación de cargas TXT y MOVIMIENTO | TXT no elimina ni modifica movimientos; movimientos no alteran detalles TXT | `IMPLEMENTADO` |
| 2026-08-17 | 7 | Concepto 2 REVISA `1426` | Nueve fondos corregidos, versión previa preservada en `RevisionHistorico` | `COMPLETADO_CALIDAD` |
| 2026-08-17 | 7 | FTP REVISA opcional | Cálculo persistido se considera completado aunque falle la trazabilidad FTP | `COMPLETADO` |
| 2026-08-18 | 3-8 | Regresión local | Build y pruebas de movimientos, concepto 2, FTP y fases Snapshot 1, 3-8 | `PASS` |

## Próxima acción autorizada

Cerrar la integración operativa sin publicar todavía:

1. Ejecutar en Calidad una prueba E2E de una QNA vigente que cubra movimiento sin TXT, carga TXT posterior, días parciales, ausencia y cero.
2. Confirmar la precedencia `TXT -> movimiento -> default` en aportaciones, históricos, Snapshot V2 y concepto 2.
3. Promover una revisión de Snapshot V2 como fuente oficial después de aprobar la conciliación entre detalle D6 y encabezado A2.
4. Vincular Línea de Pago con `SnapshotId` y exigir diferencia cero contra el snapshot oficial.
5. Cambiar REVISA concepto 2 para consumir el Snapshot V2 oficial, guardar su `SnapshotId` e incluir versión y origen en la trazabilidad.
6. Definir si la exportación oficial REVISA se genera en frontend o backend.
7. Mantener Producción sin cambios hasta completar una QNA de Calidad conciliada entre detalle, históricos, Línea de Pago y REVISA.

La política `FAT = FAA + FAE` y `MXN-DETAIL6-AGG2-TRUNC-v1` se consideran resueltas. El origen `movimiento` es válido cuando no existe TXT; un TXT vigente válido siempre tiene precedencia. No se reconstruyen periodos históricos con fuentes actuales de Firebird.
