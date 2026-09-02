# Seguimiento operativo REVISA: movimientos y QNA

## Objetivo

Conservar el contexto operativo del ciclo dual de REVISA para los conceptos 1, 3, 4 y 5: una primera generación al finalizar la aplicación de movimientos y una segunda generación dentro del worker posterior a la aplicación QNA.

La implementación local es la fuente de verdad para el estado de este documento. `IMPLEMENTADO_LOCAL` significa que el código y las pruebas aisladas existen en el repositorio; no implica despliegue, migración aplicada ni prueba contra SQL Server o Firebird reales.

## Decisiones vigentes

- La aplicación de movimientos y la aplicación QNA son procesos separados.
- La primera generación ocurre cuando la aplicación de movimientos queda finalizada, incluso si la QNA no tenía movimientos elegibles.
- La primera generación calcula únicamente los conceptos 1, 3, 4 y 5.
- La primera generación no crea ni reclama una fila en `conciliacion.RevisionTarea`.
- La aplicación QNA no aplica movimientos de afiliados.
- Después de QNA, el worker persistente calcula el reporte automático completo y vuelve a calcular 1, 3, 4 y 5 con las mismas fuentes y fórmulas.
- Ambas generaciones usan la persistencia vigente de `conciliacion.Revision` y `conciliacion.RevisionHistorico`.
- La primera captura parcial no representa un reporte REVISA completo.
- El frontend Entidad ejecuta esta primera generación de forma silenciosa al aplicar o finalizar movimientos; no muestra conceptos ni resultados REVISA.
- El reporte REVISA se consulta y presenta únicamente en el frontend Administrador.
- El frontend Entidad no registra ruta, widget, servicio ni contratos visuales REVISA; la antigua ruta directa `/dependencia/revision` fue retirada por no tener navegación ni consumidores activos.

## No alcance

- Cambiar fuentes, filtros o fórmulas de los conceptos.
- Incorporar `AP_S_MINIMOS`.
- Activar los conceptos 15 y 16 o incluir `LPF`.
- Aplicar movimientos durante la aplicación QNA.
- Crear una tarea REVISA durante la primera generación.
- Reprocesar períodos históricos.
- Definir o implementar la exportación oficial del reporte.
- Corregir automáticamente diferencias históricas, incluida la diferencia `FAT` de `0.04`.

## Flujo en dos momentos

### Momento 1: finalización de movimientos

```text
POST /v1/afiliado/aplicar-bdisssspea-lote
-> resolver QNA y orgánica completa desde BitacoraAfectacionOrg
-> aplicar los movimientos elegibles
-> finalizar la aplicación de movimientos
-> calcular conceptos 1, 3, 4 y 5
-> guardar INSERT, UPDATE o SIN_CAMBIOS
-> responder revisionMovimientos
```

Este momento es síncrono respecto de la respuesta del endpoint. `GenerarRevisionMovimientosService` construye un contexto de revisión sin tarea persistente y guarda los cuatro conceptos en una sola transacción SQL Server.

Entidad conserva el mismo endpoint y la misma acción. Cuando existen aprobados muestra `APLICAR MOVIMIENTOS`; cuando no hay aprobados pendientes muestra `FINALIZAR MOVIMIENTOS`. La respuesta puede incluir `revisionMovimientos`, pero Entidad no la presenta al usuario.

### Regla de cero movimientos

Si no existen afiliados o movimientos elegibles, la bitácora de aplicación de movimientos se finaliza mediante la rama sin procesamiento. Esto incluye una lista vacía, sólo cancelados, sólo aplicados o una mezcla sin aprobados pendientes. Cuando esa finalización es efectiva, se ejecuta de todos modos la primera generación de los conceptos 1, 3, 4 y 5.

El frontend Entidad permite `FINALIZAR MOVIMIENTOS` en esos casos siempre que la bitácora aún no esté finalizada y todos los registros estén en estados permitidos. No se crea un botón, endpoint ni etapa adicional.

Los conceptos 3, 4 y 5 se persisten con los nueve fondos en `0.00` cuando su condición no devuelve registros. El concepto 1 conserva su propia regla de saldo anterior y puede fallar si falta el antecedente requerido.

### Momento 2: aplicación QNA y worker

```text
aplicación QNA independiente
-> COMMIT Firebird
-> generar o reutilizar Línea de Pago
-> programar o reutilizar RevisionTarea
-> responder sin esperar REVISA
-> worker calcula el reporte automático completo
-> worker vuelve a calcular conceptos 1, 3, 4 y 5
-> guardar INSERT, UPDATE o SIN_CAMBIOS
```

La aplicación QNA ejecuta sus procedimientos de QNA, pero no crea, recupera ni aplica movimientos de afiliados. El worker posterior reconcilia las filas 1, 3, 4 y 5 que pueden existir desde el primer momento y completa los demás conceptos automáticos activos.

## Conceptos 1, 3, 4 y 5

Las fuentes y fórmulas se mantienen sin cambios:

| Concepto | Nombre | Fuente o filtro |
| ---: | --- | --- |
| 1 | Saldo anterior | Concepto 12 activo del período anterior y misma orgánica completa. |
| 3 | Alta o reingreso | `AP_G_FONDOS_ALTBAJ(org0, org1, periodo)` con `CVE_MOVIMIENTO = 'AL'`. |
| 4 | Baja | `AP_G_FONDOS_ALTBAJ(org0, org1, periodo)` con `CVE_MOVIMIENTO = 'BA'`. |
| 5 | Suspensión y baja | `AP_G_FONDOS_ALTBAJ(org0, org1, periodo)` con `CVE_MOVIMIENTO = 'LB'`. |

La clave persistida usa `Organica0` a `Organica3`, período y catálogo. Existe una asimetría pendiente: `AP_G_FONDOS_ALTBAJ` recibe y filtra por orgánicas 0 y 1, mientras la fila REVISA se identifica por orgánicas 0 a 3. No se corrige ni se compensa dentro de este alcance.

## Persistencia e histórico

Para cada concepto, el guardado produce:

| Operación | Comportamiento |
| --- | --- |
| `INSERT` | Crea la fila vigente; no crea histórico. |
| `UPDATE` | Copia primero la versión vigente a `conciliacion.RevisionHistorico` y actualiza la fila. |
| `SIN_CAMBIOS` | Conserva la fila vigente; no actualiza ni crea histórico cuando coinciden importes, estatus activo, usuario y, cuando aplica, snapshot. |

Los cuatro guardados de la primera generación se ejecutan en una sola transacción SQL Server. El worker usa la misma operación transaccional para los conceptos automáticos calculados en su ejecución.

La primera generación toma el mismo `acquireQnaScopeLock` exclusivo de la aplicación QNA, usando `EntidadId`, año, quincena y orgánicas 0-3. La transacción `SERIALIZABLE` que posee el applock permanece abierta durante los cálculos Firebird y el guardado de las cuatro revisiones. Antes de calcular consulta el último estado de `QnaProcesoTransicion` del proceso más reciente del scope: permite ausencia de proceso, `OFICIAL`, `FIREBIRD_REVERTIDO`, `FIREBIRD_CONFIRMADO` y `LINEA_CONFIRMADA`; bloquea `APLICANDO_FIREBIRD`, `APLICACION_INCIERTA`, `REVISA_PROGRAMADA` y `TERMINADO` con `REVISION_MOVIMIENTOS_QNA_NO_DISPONIBLE` (HTTP 409), sin calcular ni guardar. En los dos últimos estados el worker QNA ya es autoritativo y no debe ser sobrescrito por una reparación tardía de movimientos.

## Recuperación idempotente

- Si la generación de 1/3/4/5 falla después de finalizar movimientos, el endpoint devuelve `REVISION_MOVIMIENTOS_GENERACION_ERROR`.
- Una repetición del endpoint detecta que los movimientos ya estaban finalizados y vuelve a ejecutar la generación sin reaplicar los movimientos, siempre que REVISA QNA todavía no esté programada o terminada.
- La repetición converge mediante `INSERT`, `UPDATE` o `SIN_CAMBIOS`; este último exige coincidencia de importes, estatus, usuario y snapshot cuando aplica.
- La primera generación no tiene reintentos en `RevisionTarea`; su recuperación depende de repetir explícitamente la operación de movimientos.
- El worker posterior conserva su tarea persistente, reclamación exclusiva, recuperación de posesión vencida y máximo de tres intentos.
- La programación del worker se reutiliza por orgánica completa y período; no autoriza reproceso histórico general.

## Archivos de implementación

```text
src/modules/afiliado/afiliado.routes.ts
src/modules/afiliado/application/commands/AplicarBDIsspeaLoteCommand.ts
src/modules/afiliado/domain/repositories/IAfiliadoRepository.ts
src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaLoteService.ts
src/modules/reportes/revision/application/GenerarRevisionMovimientosService.ts
src/modules/reportes/revision/application/RevisionWorker.ts
src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.ts
src/di/container.ts
scripts/test-revision-movimientos.ts
scripts/test-revision-movimientos-integration-desarrollo.ts
scripts/verify-revision-movimientos-desarrollo.ts
../../front/Entidad/ISS-F-Entidad/src/widgets/dependencia/autorizacion/resumen-autorizacion.tsx
```

Archivos residuales retirados del frontend Entidad:

```text
../../front/Entidad/ISS-F-Entidad/src/app/dependencia/revision/page.tsx
../../front/Entidad/ISS-F-Entidad/src/widgets/revision/RevisionWidget.tsx
../../front/Entidad/ISS-F-Entidad/src/services/revision/revision.api.ts
../../front/Entidad/ISS-F-Entidad/src/entities/revision/revision.types.ts
```

La eliminación se limita a la presentación no navegable de Entidad. No elimina endpoints, comandos, persistencia, tareas ni worker REVISA del backend.

## Fases y checklist

| Fase | Estado real | Evidencia local o pendiente |
| --- | --- | --- |
| Separar movimientos de QNA | `IMPLEMENTADO_LOCAL` | La aplicación de movimientos usa su comando en lote; la saga QNA no aplica movimientos. |
| Finalizar la rama de cero movimientos | `IMPLEMENTADO_LOCAL` | La rama sin elegibles actualiza la bitácora y devuelve finalización efectiva. |
| Habilitar cierre desde Entidad sin aprobados pendientes | `IMPLEMENTADO_LOCAL` | `FINALIZAR MOVIMIENTOS` permanece disponible con lista vacía, cancelados o aplicados, sin agregar botones ni endpoints. |
| Mantener REVISA silencioso en Entidad | `IMPLEMENTADO_LOCAL` | Entidad ignora `revisionMovimientos`; el reporte se presenta únicamente en Administrador. |
| Retirar módulo visual residual de Entidad | `IMPLEMENTADO_LOCAL` | Eliminadas la ruta `/dependencia/revision`, su widget, servicio y contratos exclusivos; no existían enlaces ni consumidores activos. |
| Resolver comando con Awilix `CLASSIC` | `PASS_LOCAL` | Se eliminó la colisión que renombraba el parámetro a `revisionMovimientosQnaRunner2`; la prueba construye el comando mediante un contenedor Awilix real. |
| Compatibilidad `EntidadId` de bitácora legacy | `PASS_LOCAL` | Sólo `NULL` o ausente se resuelve como `EntidadId=1`; valores presentes inválidos continúan bloqueados. |
| Generar conceptos 1/3/4/5 al finalizar movimientos | `IMPLEMENTADO_LOCAL` | Servicio dedicado invocado por `AplicarBDIsspeaLoteCommand`. |
| Omitir tarea en la primera generación | `IMPLEMENTADO_LOCAL` | El servicio no invoca `encolar` ni inserta `RevisionTarea`. |
| Reconciliar 1/3/4/5 en el worker | `IMPLEMENTADO_LOCAL` | `RevisionWorker` conserva esos conceptos dentro del cálculo completo. |
| Persistencia e histórico idempotentes | `IMPLEMENTADO_LOCAL` | Guardado transaccional compartido con `INSERT`, `UPDATE` y `SIN_CAMBIOS`. |
| Exponer contexto en respuesta de movimientos | `IMPLEMENTADO_LOCAL` | Respuesta incluye `EntidadId`, finalización, orgánicas 2/3 y resultados de revisión. |
| Excluir carrera con aplicación QNA y worker | `IMPLEMENTADO_LOCAL` | Applock durante cálculo/guardado; estados Firebird activos/inciertos y REVISA ya programada/terminada responden 409. |
| Prueba aislada automatizada | `IMPLEMENTADO_LOCAL` | Existe `npm run test:revision:movimientos`. |
| Build y prueba aislada en este seguimiento | `PASS_LOCAL` | `npm run build` y `npm run test:revision:movimientos` correctos. |
| Regresiones REVISA y QNA | `PASS_LOCAL` | Concepto 2/días, FTP opcional, estado FTP, concepto 13/AP_DN y phase11 correctos. |
| Prueba con SQL Server y Firebird reales | `PASS_DESARROLLO` | Además de la prueba rollback-only, el endpoint funcional finalizó `04/24/01/01`, QNA `1526`, aplicó 4 movimientos y persistió REVISA 1/3/4/5. |
| Despliegue en Desarrollo, Calidad o Producción | `NO_AFIRMADO` | Este documento no acredita despliegues. |

## Pruebas y comandos

Prueba aislada del ciclo de movimientos:

```bash
npm run test:revision:movimientos
```

Compilación general, si se requiere validar el estado local del backend:

```bash
npm run build
```

Antes de cualquier prueba cruzada o con bases reales:

```bash
npm run verify:database:environments
```

Integración rollback-only en Desarrollo:

```bash
npm run test:revision:movimientos:desarrollo
```

Verificación read-only posterior a la aplicación funcional:

```bash
npm run verify:revision:movimientos:desarrollo -- 04 24 2026 15
```

Validación documental y de formato ejecutada para este cambio:

```bash
git diff --check -- docs
```

La integración de Desarrollo no aplica movimientos ni QNA, no ejecuta `DELETE` y configura Firebird en modo de solo lectura. Las escrituras REVISA de prueba se ejecutan en una única transacción SQL Server con aislamiento `SERIALIZABLE`; al finalizar se ejecuta `ROLLBACK` y se comprueba que los conteos de revisión e histórico regresen exactamente a su línea base.

Evidencia local del 2026-08-28:

```text
npm run build                                      PASS
npm run test:revision:movimientos                  REVISION_MOVIMIENTOS_OK
npm run test:revision:concepto2:dias               REVISION_CONCEPTO2_DIAS_OK
npm run test:revision:ftp:opcional                 REVISION_FTP_OPCIONAL_OK
npm run test:revision:estado:ftp:opcional          REVISION_ESTADO_FTP_OPCIONAL_OK
npm run test:revision:concept13:ap-dn              REVISION_CONCEPT13_AP_DN_CONTRACTS_OK
npm run test:qna:phase11                           PASS
npm run test:revision:movimientos:desarrollo       REVISION_MOVIMIENTOS_INTEGRATION_ROLLBACK_DESARROLLO_OK
npm run verify:revision:movimientos:desarrollo     REVISION_MOVIMIENTOS_DESARROLLO_VERIFICADA
git diff --check                                   PASS
```

### Incidente de resolución DI del 2026-08-29

La primera solicitud funcional de `POST /v1/afiliado/aplicar-bdisssspea-lote` fue rechazada antes de ejecutar el comando porque Awilix no pudo resolver `revisionMovimientosQnaRunner2`. En `InjectionMode.CLASSIC`, la constante exportada y el parámetro del constructor compartían nombre; la transformación de TypeScript renombró el parámetro a `revisionMovimientosQnaRunner2`, mientras el contenedor registraba `revisionMovimientosQnaRunner`.

La constante se renombró a `defaultRevisionMovimientosQnaRunner` y la clave DI permaneció como `revisionMovimientosQnaRunner`. El JavaScript compilado conserva ahora ese nombre exacto en el constructor. `npm run test:revision:movimientos` incluye una resolución del comando mediante Awilix para prevenir la regresión. La solicitud fallida no alcanzó `AplicarBDIsspeaLoteCommand.execute()` y no aplicó movimientos ni generó REVISA.

La siguiente solicitud alcanzó el comando, pero se detuvo en `getBitacoraAplicarQna` porque la fila legacy no tenía `EntidadId`. Antes de REVISA, Aplicar movimientos no necesitaba ese identificador; ahora forma parte del scope exacto compartido con Aplicar QNA y su applock. Para conservar el comportamiento de Entidad, una bitácora con `EntidadId IS NULL` se interpreta como la entidad legacy predeterminada `1`. No se sustituyen valores presentes: cero, negativos, texto o vacío producen `BITACORA_APLICAR_ENTIDAD_INVALIDA`. Esta solicitud también falló antes de consultar elegibles o migrar movimientos.

Después de ambas correcciones se completó la aplicación funcional en Desarrollo para `EntidadId=1`, orgánica `04/24/01/01`, QNA `1526`. La verificación read-only confirmó una bitácora finalizada con total `4`, aplicados `4`, cancelados `0`; no quedaron aprobados pendientes y existen activas las cuatro filas REVISA 1, 3, 4 y 5.

## Riesgos

- Una falla de Firebird al calcular altas y bajas puede ocurrir después de que la aplicación de movimientos ya quedó finalizada; la recuperación exige repetir el endpoint.
- La primera generación es parcial y síncrona. Tratarla como reporte completo puede mostrar datos incompletos antes del worker.
- El concepto 1 depende del concepto 12 anterior; un antecedente faltante impide guardar los cuatro conceptos por la atomicidad del lote.
- `AP_G_FONDOS_ALTBAJ` trabaja con orgánicas 0/1, pero REVISA persiste por orgánicas 0-3; esta asimetría puede requerir decisión funcional.
- La persistencia y los cálculos 1/3/4/5 tienen evidencia rollback-only con SQL Server y Firebird reales de Desarrollo. La exclusión concurrente y los estados permitidos/bloqueados continúan cubiertos sólo por la prueba aislada con runner transaccional falso.
- La aplicación funcional acredita el comportamiento del endpoint y el `COMMIT` de movimientos en Desarrollo. Todavía no acredita la reconciliación posterior a Aplicar QNA ni el reporte REVISA completo del worker.

## Pendientes REVISA

- Definir la participación funcional de `AP_S_MINIMOS`; actualmente está excluido.
- Confirmar la diferencia histórica `FAT` de `0.04` respecto de `FAA + FAE`.
- Definir la exportación oficial y si corresponde a frontend o backend.
- Mantener `LPF` excluido hasta autorización funcional.
- Mantener inactivos los conceptos 15 y 16 para evitar duplicidad con el concepto 13 consolidado.
- Resolver la asimetría entre la fuente `AP_G_FONDOS_ALTBAJ` por orgánicas 0/1 y la clave REVISA por orgánicas 0-3.
- No reprocesar períodos históricos sin autorización, alcance y fuentes completas.
- Ejecutar validación end-to-end con una QNA controlada y bases reales antes de afirmar disponibilidad operativa.
