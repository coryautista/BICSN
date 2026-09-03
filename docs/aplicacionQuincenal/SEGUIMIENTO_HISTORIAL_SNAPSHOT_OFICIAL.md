# Seguimiento: Historial de la QNA Aplicada desde Snapshot Oficial

## Proposito

Este documento es el tablero ejecutivo del trabajo pendiente para conservar y consultar la evidencia oficial de `/dependencia/aportaciones-proceso`.

El detalle tecnico, las decisiones y los criterios obligatorios permanecen en:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

Este tablero no sustituye el plan tecnico ni autoriza migraciones, reprocesos, cambios en periodos cerrados o despliegues.

## Estado General

```text
FASES_0_A_11_COMPLETADAS
FASE_12_PENDIENTE
```

Ultima actualizacion: 2026-08-26.

## Resultado Esperado

Para cada QNA nueva aplicada, reproducir sin fuentes vivas los diez dominios congelados al confirmar `Aplicar`, comprobando que el snapshot consultado sea el que alcanzo `TERMINADO`.

## Prerrequisitos Completados

- Desarrollo alineado con Produccion en 91 tablas y esquema QNA V3.
- Calidad alineada con Produccion y FK de `QnaSnapshot` corregida.
- Formula monetaria V3 activa.
- Calidad y Produccion publicadas y saludables el 2026-08-21.
- Scripts protegidos de migracion y verificacion versionados en `3f51713`.
- Plan backend y entrega frontend versionados en `3f51713`.

## Ruta Critica Backend

| Fase | Entregable verificable | Estado | Dependencia |
|---:|---|---|---|
| 0 | Decisiones, ADR, tablero y linea base documental | COMPLETADA | Prerrequisitos completados |
| 1 | Politica central de autorizacion y ambito | COMPLETADA | Fase 0 |
| 2 | Invariantes transaccionales de promocion | COMPLETADA | Fase 1 |
| 3 | Precedencia correcta de quinquenio | COMPLETADA | Fase 2 |
| 4 | Migracion idempotente de proyecciones y restricciones | COMPLETADA | Fase 3 |
| 5 | Captura unica en memoria de diez dominios | COMPLETADA | Fase 4 |
| 6 | Detalles, payloads, hashes y totales persistidos | COMPLETADA | Fase 5 |
| 7 | Retenciones V3 completas por identidad y hash | COMPLETADA | Fase 6 |
| 8 | Dual-write y conciliacion automatizada | COMPLETADA | Fase 7 |
| 9 | Endpoints oficiales de periodos, resumen y detalle | COMPLETADA | Fase 8 |
| 10 | Fuentes discriminadas y fallback legacy | COMPLETADA | Fase 9 |
| 11 | Saga, recuperacion e idempotencia verificadas | COMPLETADA | Fase 10 |
| 12 | Evidencia integral en Calidad y contrato frontend | EN_PROGRESO | Fase 11 |
| 13 | Retiro autorizado de escritura legacy para QNA nuevas | COMPLETADA | Fase 12 (evidencia parcial) y aprobacion operativa 2026-09-02 |
| 14 | Migracion y liberacion controlada en Produccion | PENDIENTE | Fase 13 |

## Fase Actual: 12

Objetivo: validar la evidencia integral en Calidad y entregar el contrato frontend.

Evidencia parcial del 2026-08-27: migraciones `09` a `17` aplicadas y reaplicadas idempotentemente en Calidad; health, Swagger y smoke autenticado read-only aprobados para lista, resumen y detalle. El unico periodo disponible es `1526`, fuente `SNAPSHOT_OFICIAL_RECONSTRUIDO`, con diez dominios y 167 filas de fondo. La cabecera V4 conserva un hash canonico V3 verificable y se publica con `QNA_RECONSTRUIDA_HASH_CANONICO_V3`, sin modificar la evidencia. Las lecturas restauran `READ COMMITTED` al liberar conexiones y el worker REVISA fuerza ese aislamiento al reclamar con `READPAST`; varios ciclos posteriores no reprodujeron SQL 650. La fase permanece abierta porque Calidad no contiene una QNA V5 real `TERMINADO` y `QnaSnapshotDetalle` sigue sin filas.

Decision operativa para Calidad: la evidencia V5 pendiente se obtendra exclusivamente con la Q16 de 2026, scope `04/24/01/01`, mediante el flujo normal del sistema. No se permite usar, reabrir ni reprocesar Q12, Q13, Q14 o Q15, ni insertar o corregir manualmente snapshots, transiciones, bitacoras o detalles para satisfacer la puerta. Al registrar esta decision, Q16 conserva `APLICAR` pero todavia no tiene una carga TXT vigente; la operacion debe esperar a que el sistema complete ese prerrequisito.

Despues de que el sistema termine Q16 se ejecutaran solamente verificaciones de Calidad: confirmar Snapshot V2 aprobado, QNA V5 oficial, diez fuentes completas, `QnaSnapshotDetalle` poblado, proceso y bitacora `TERMINADO`, Linea y REVISA concluidos, y smoke autenticado de lista, resumen y detalle sin consultar fuentes vivas.

## Evidencia de la Fase 11

- [x] Revalidar snapshot, carga vigente, formula, V2, fuentes, hashes, conteos, totales y bitacora exacta antes de iniciar Firebird y bajo el lock del scope completo.
- [x] Persistir intentos, eventos, claims, leases y resoluciones en un ledger SQL Server vinculado al snapshot, proceso y `AfectacionId` exacto.
- [x] Clasificar la transaccion Firebird como commit confirmado, rollback confirmado, resultado incierto o no iniciada, sin inferencias por texto de error.
- [x] Renovar claims Firebird y de recuperacion con reloj SQL Server y bloquear ejecuciones concurrentes.
- [x] Reanudar idempotentemente desde `FIREBIRD_CONFIRMADO`, `LINEA_CONFIRMADA`, `REVISA_PROGRAMADA` y `TERMINADO` sin consultar ni reejecutar Firebird.
- [x] Separar Linea de Pago y REVISA para persistir cada estado inmediatamente despues de su efecto.
- [x] Resolver `APLICACION_INCIERTA` solo mediante administrador, `intentoUuid`, scope completo, motivo y evidencia; no usar marcadores ni DDL Firebird.
- [x] Mantener la decision administrativa confirmada aunque la recuperacion SQL posterior quede pendiente.
- [x] Aplicar autorizacion de cuatro niveles al endpoint de aplicacion y al de resolucion manual.
- [x] Integrar `POST /linea-captura-periodo` con la misma saga, sin transiciones directas ni creacion automatica de la siguiente QNA.
- [x] Aplicar y reaplicar la migracion `20260826_17` exclusivamente en Desarrollo; probar dry-run transaccional y reparacion de esquema parcial.
- [x] Aprobar build, pruebas puras con Firebird fake, HTTP, integracion SQL rollback-only, verificador fuerte, plan y regresiones de fases 8 a 10.
- [x] Confirmar cero procedimientos C/F/EBI reales ejecutados durante las pruebas y registrar los commits funcionales `ff40203` y `c666210`.

## Evidencia de la Fase 10

- [x] Publicar la union discriminada `SNAPSHOT_OFICIAL`, `SNAPSHOT_OFICIAL_RECONSTRUIDO` e `HISTORICO_LEGACY` en los tres endpoints.
- [x] Aplicar precedencia V5 sobre V3/V4 y legacy sin ocultar una transicion `TERMINADO` corrupta, nula, no soportada o de otro scope.
- [x] Reconstruir V3/V4 desde evidencia persistida; usar exclusivamente el detalle matematico V2 validado cuando exista y dejar fondos no disponibles cuando falte.
- [x] Conservar campos no verificables como `null` y emitir estrategias y advertencias estructuradas.
- [x] Exigir evidencia legacy `TERMINADO`, `OrgNivel=3`, resultado exitoso, scope inequivoco y ausencia de ownership V5.
- [x] Marcar historicos reducidos no enlazados al lote y dominios sin filas como `ABSENT_UNVERIFIED`.
- [x] Distinguir totales `PERSISTED`, `PERSISTED_CAIR_CONTROL_FALLBACK`, `DERIVED_DETAIL` y `UNAVAILABLE` sin aritmetica monetaria binaria.
- [x] Validar colisiones y ambiguedad sobre el filtro completo antes de paginar; validar hashes y semantica en la pagina solicitada.
- [x] Usar `OPENJSON` para lotes de hasta 500 elementos y ejecutar lecturas mixtas secuencialmente dentro de una sola transaccion SQL Server.
- [x] Auditar lecturas administrativas globales o exactas sin registrar payload, PII ni texto de busqueda.
- [x] Aprobar contratos, HTTP, integraciones rollback de fases 9 y 10, verificador, planes reales y pagina mixta V5/V4/legacy.
- [x] Confirmar que no fue necesaria una migracion adicional y registrar los commits funcionales `0f97dce` y `0282e74`.

## Evidencia de la Fase 9

- [x] Seleccionar evidencia aplicada exclusivamente por la ultima transicion V5 `TERMINADO`.
- [x] Implementar lista global admin y scope exacto para usuarios no administrativos.
- [x] Implementar resumen con metadata, fuentes, warnings y totales oficiales.
- [x] Implementar detalle discriminado para los diez dominios.
- [x] Conservar A2/D6 e IDs como strings de escala fija.
- [x] Exponer payload auxiliar V1 completo y redactar auditoria para usuarios ordinarios.
- [x] Aplicar paginacion 100, maximo 500, busqueda literal CI/AI y orden canonico.
- [x] Validar hashes, fuentes, totales y enlaces V2 en lecturas exhaustivas.
- [x] Publicar Swagger para respuestas y errores 400/401/403/404/409/500.
- [x] Aplicar y reaplicar el indice `TERMINADO` exclusivamente en Desarrollo.
- [x] Aprobar verificador, plan de ejecucion, contratos, HTTP e integracion rollback.
- [x] Registrar el commit funcional `1078beb`.

## Evidencia de la Fase 8

- [x] Inventariar las firmas reales de los 12 almacenes legacy en Desarrollo.
- [x] Proyectar siete aportaciones, tres retenciones, resumen y REVISA desde evidencia V5.
- [x] Construir oracle esperado independiente y hashes completos con orden V5.
- [x] Aplicar normalizacion versionada `LEGACY-PROJECTION-v1` para columnas D2.
- [x] Registrar conciliacion exacta por dominio, conteos, totales, hashes y diferencias.
- [x] Propagar `COMPLETE`, `WARNING` o `ERROR` en la respuesta de promocion.
- [x] Conservar la primera proyeccion ante colision de scope reducido y devolver `WARNING`.
- [x] Marcar `SUPERSEDED` y transferir ownership en reemplazos permitidos.
- [x] Preservar cero filas para dominios no aplicables, sin registros sinteticos.
- [x] Proteger proyeccion y reparacion mediante roles y modulos firmados.
- [x] Verificar reparacion auditada, alteracion externa, retries y rollback explicito.
- [x] Aplicar y reaplicar la migracion exclusivamente en Desarrollo sin modificar filas.
- [x] Registrar el commit funcional `2d70bdc`.

Riesgo aceptado: el principal runtime actual `usrISSSSPEA` pertenece a `db_owner`; el verificador reporta `DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE`. Los controles firmados protegen principales de privilegio minimo, pero no pueden restringir a un propietario de base.

## Evidencia de la Fase 7

- [x] Proyectar PCP, PMP e HIP desde `QnaSnapshotFuenteDetalle`, sin relectura Firebird.
- [x] Usar `Interno` como identidad y conservar numero de empleado solo dentro del payload.
- [x] Persistir payload V1, clave, hash, fuente, escala y ocurrencia exacta.
- [x] Preservar duplicados por `Orden` y permitir `ClaveFilaHash` repetido.
- [x] Conservar claves y componentes nullable sin sustituirlos por cero.
- [x] Validar rangos `INT`, `SMALLINT` y `DECIMAL(19,6)` antes de proyectar.
- [x] Registrar lotes compartidos, incluidos dominios vacios.
- [x] Conservar retenciones fuera del conjunto de fondos con marca huerfana.
- [x] Mantener `cantidad_d6` como importe oficial HIP y validar el procedimiento configurado.
- [x] Restringir la escritura basada en body a snapshots legacy en TypeScript y SQL.
- [x] Verificar reintentos exactos, incluso por otro administrador, y rollback total.
- [x] Aplicar y reaplicar la migracion exclusivamente en Desarrollo sin modificar filas.
- [x] Registrar el commit funcional `2e61284`.

## Evidencia de la Fase 6

- [x] Capturar FAI una vez mediante `AP_S_FONDOS` y exigir igualdad exacta de `Interno`.
- [x] Construir Snapshot V2 y Snapshot QNA V5 desde el mismo agregado congelado.
- [x] Persistir ambos snapshots, detalles, payloads, hashes y totales en una transaccion serializable.
- [x] Vincular cada `QnaSnapshotDetalle` con su `SnapshotCalculoV2Detalle`.
- [x] Calcular hashes independientes para Ahorro, Vivienda, Prestaciones y CAIR.
- [x] Excluir UUID, fecha de captura e IDs SQL de los hashes semanticos.
- [x] Reagrupar evidencia auxiliar por `EmpleadoClave` y validarla contra cada proyeccion.
- [x] Exigir aprobacion administrativa explicita para convertir `EMPTY` en `NOT_APPLICABLE`.
- [x] Aprobar Snapshot V2 una sola vez y bloquear reemplazo automatico de `OBSERVADO`.
- [x] Verificar reintentos idempotentes y rollback total en Desarrollo.
- [x] Registrar el commit funcional `1b484ed`.

## Evidencia de la Fase 5

- [x] Compartir una lectura de personal, formula y nomina entre los cuatro fondos.
- [x] Consultar una vez cada uno de los seis dominios auxiliares.
- [x] Resolver identidad exclusivamente por `Interno` y bloquear identidades ambiguas.
- [x] Congelar el nombre final mostrado, sin sustitutos y con limite de 255 caracteres.
- [x] Definir payload V1 completo en `snake_case`, con fechas ISO, nulls y D6.
- [x] Preservar filas repetidas, multiplicidad, hashes y orden canonico.
- [x] Congelar recursivamente el agregado y prohibir relecturas posteriores.
- [x] Dejar fuentes vacias como `EMPTY` sin aprobacion automatica.
- [x] Retirar la seleccion HIP del contrato HTTP y validar estrictamente su configuracion.
- [x] Aprobar build, pruebas puras, orquestacion y revision sin bloqueos.
- [x] Confirmar `QNA_HIP_LEGACY_PERIODS=1526,1626` como valor operativo.
- [x] Ejecutar una captura read-only en Desarrollo con cero snapshots creados.
- [x] Registrar los commits `3970da8` y `6327e70`.

## Evidencia de la Fase 4

- [x] Confirmar `VersionEsquema = 5`, tipos de identidad y compatibilidad nullable.
- [x] Agregar 17 columnas de proyeccion y cuatro columnas de payload/identidad.
- [x] Crear FK confiable, unicidades filtradas y checks de dias, hashes y completitud V5.
- [x] Permitir filas auxiliares repetidas sin perder orden, conteo ni hash.
- [x] Aplicar exclusivamente en `SII-ISSSSPEA-DES` sin modificar filas.
- [x] Reaplicar la migracion para comprobar idempotencia.
- [x] Aprobar verificador read-only, build y contratos afectados.
- [x] Crear `REFERENCIA_MODELO_SNAPSHOT_QNA_OFICIAL.md`.
- [x] Registrar el commit funcional `612d791`.

## Evidencia de la Fase 3

- [x] Priorizar `quinquenios_aplicado_d6` sin confundir cero con ausencia.
- [x] Transformar `quinquenios_d6` mensual mediante la regla quincenal estandar y precision D6.
- [x] Usar `BaseCotizacionQuinquenios` solo desde el `nominaCargaId` congelado cuando faltan los niveles anteriores.
- [x] Persistir `null` cuando el valor no puede verificarse.
- [x] Probar los cuatro niveles, redondeo D6 y cero real.
- [x] Aprobar build, calculo oficial, contratos de Liquidacion QNA y suite previa de Snapshot V2.
- [x] Registrar el commit funcional `3641588`.

## Evidencia de la Fase 2

### Alcance Confirmado

- [x] Mapear creacion, aprobacion y promocion actuales.
- [x] Confirmar que las diez fuentes y la decision se revalidan dentro de la transaccion.
- [x] Detectar que carga, formula y Snapshot V2 no se revalidan durante la promocion.
- [x] Detectar ausencia de `QNA_NOMINA_CARGA_DESACTUALIZADA`.
- [x] Detectar ausencia de un application lock comun por ambito.
- [x] Adquirir `sp_getapplock` transaccional por periodo y organicas.
- [x] Comparar periodo, ambito y ambiente entre snapshots.
- [x] Exigir la misma carga nominal y formula.
- [x] Exigir carga `TXT`, `APLICADA` y `EsVigente = 1`.
- [x] Revalidar conteos, hashes y totales persistidos.
- [x] Emitir `QNA_NOMINA_CARGA_DESACTUALIZADA` ante sustitucion.
- [x] Probar exclusión transaccional entre promociones y sustituciones.

La prueba transaccional read-only `npm run test:liquidacion-qna:scope-lock` fue ejecutada correctamente en Desarrollo el 2026-08-25 y termino con `QNA_SCOPE_LOCK_INTEGRATION_DESARROLLO_OK`.

## Fases Cerradas

### Fase 1: Autorizacion y Ambito

- [x] Politica central `OrganicaScopePolicy`.
- [x] Clasificacion de entidad independiente del orden de roles.
- [x] Organicas de entidad obtenidas exclusivamente del token.
- [x] Ambito externo restringido al rol `admin`.
- [x] Liquidacion QNA protegida por la politica central.
- [x] Ocho consultas operativas de aportaciones protegidas por la politica central.
- [x] Errores `401` y `403` comprobados.
- [x] Build y contratos de aportaciones y liquidacion aprobados.
- [x] Commit funcional `08bfae1`.

### Fase 0: Linea Base Documental

Objetivo: establecer una linea base documental y operativa revisable antes de modificar el flujo financiero.

### Lista de Cierre

- [x] Confirmar alcance de diez dominios.
- [x] Confirmar congelacion al seleccionar `Aplicar`.
- [x] Confirmar que `TERMINADO` prueba la aplicacion oficial.
- [x] Confirmar dual-write temporal y fallback `HISTORICO_LEGACY`.
- [x] Alinear Desarrollo y Calidad con el esquema QNA V3 de Produccion.
- [x] Versionar los ejecutores protegidos de migracion y verificacion.
- [x] Crear el ADR `DECISION_HISTORIAL_SNAPSHOT_OFICIAL.md`.
- [x] Crear este tablero ejecutivo.
- [x] Clasificar los cambios locales ajenos a la fase.
- [x] Revisar el diff documental final.
- [x] Crear un commit exclusivo de fase 0 con referencia en las bitacoras.

### Politica sobre Scripts Operativos

Los siguientes archivos se conservan versionados como herramientas permanentes de diagnostico y recuperacion controlada:

```text
scripts/migrate-qna-v3-desarrollo.ts
scripts/verify-qna-v3-desarrollo.ts
scripts/migrate-qna-snapshot-fk-calidad.ts
scripts/verify-qna-v3-calidad.ts
```

Reglas:

- Los scripts de migracion deben exigir ambiente y confirmacion explicita.
- Los verificadores deben ser read-only.
- No se agregan a un flujo automatico de despliegue salvo decision posterior.
- No se reutilizan contra otro ambiente cambiando nombres manualmente.
- Toda operacion cruzada comienza con `npm run verify:database:environments`.

### Cambios Locales Fuera de Alcance

Al iniciar la fase 0 existen modificaciones independientes en:

```text
.env.example
.gitignore
Dockerfile
deploy_bicsn.template.sh
```

No deben incluirse, revertirse ni ajustarse como parte de esta fase. Requieren una revision y entrega separadas de configuracion/despliegue.

## Evidencia de la Fase 0

- Fase 0 marcada `COMPLETADA` en este tablero y en el plan principal.
- ADR aceptado y versionado.
- Diff de fase 0 sin cambios ajenos.
- Commit de fase 0 registrado en ambas bitacoras.
- No existen decisiones abiertas sobre alcance, fuente oficial o evidencia `TERMINADO`.

## Puerta para Desbloquear Frontend

El piloto frontend fue implementado el 2026-08-29 exclusivamente para validacion en Desarrollo. Esto no cierra la puerta de liberacion ni autoriza despliegue en Calidad o Produccion.

- [x] Migracion de proyecciones aplicada en Calidad.
- [ ] `QnaSnapshotDetalle` poblado por una QNA V5 real `TERMINADO`.
- [ ] Payloads auxiliares V5 completos y versionados validados en Calidad.
- [x] Los tres endpoints oficiales disponibles.
- [x] Swagger estable.
- [x] Totales, paginacion y union discriminada documentados.
- [x] Una QNA reconstruida de Calidad consultable sin fuentes vivas.
- [x] Saga, recuperacion e idempotencia de fase 11 aprobadas.
- [x] Pruebas backend obligatorias aprobadas.

## Riesgos Activos

| Riesgo | Control requerido | Estado |
|---|---|---|
| Lecturas repetidas producen evidencias distintas | Captura unica de diez dominios | CONTROLADO |
| SQL Server y Firebird no comparten transaccion | Saga recuperable, ledger SQL y resolucion manual con evidencia | CONTROLADO |
| Acceso cruzado entre dependencias | Politica central de ambito | CONTROLADO |
| Campos historicos no verificables | `null`, advertencias y fuente discriminada | CONTROLADO |
| Diferencias entre snapshot oficial y legacy | Dual-write y conciliacion con WARNING | CONTROLADO |
| Principal runtime con `db_owner` puede eludir aislamiento SQL | Migrar a principal de privilegio minimo | ACEPTADO |
| Cambios locales ajenos mezclados con la fase | Commit selectivo y revision de diff | CONTROLADO |

## Registro de Avance

| Fecha | Fase | Estado | Evidencia | Siguiente paso |
|---|---:|---|---|---|
| 2026-08-21 | Prerrequisito | COMPLETADO | Desarrollo y Calidad alineados; publicaciones saludables | Establecer fase 0 |
| 2026-08-21 | Linea base | COMPLETADO | Commit `3f51713` | Crear ADR y tablero |
| 2026-08-25 | 0 | COMPLETADA | Commit `e7a3327`; ADR y tablero creados; scripts clasificados; `git diff --check` aprobado | Iniciar fase 1 |
| 2026-08-25 | 1 | COMPLETADA | Commit `08bfae1`; `ORGANICA_SCOPE_POLICY_TESTS_OK`; build y contratos aprobados | Iniciar fase 2 |
| 2026-08-25 | 2 | EN_PROGRESO | Flujo de promocion e invariantes auditados | Implementar validacion final y lock transaccional |
| 2026-08-25 | 2 | EN_PROGRESO | Commit `837a691`; build y pruebas puras aprobados; prueba SQL bloqueada por conectividad | Ejecutar `test:liquidacion-qna:scope-lock` en Desarrollo |
| 2026-08-25 | 2 | COMPLETADA | `QNA_SCOPE_LOCK_INTEGRATION_DESARROLLO_OK`; build y seis suites afectadas OK | Iniciar fase 3 |
| 2026-08-25 | 3 | EN_PROGRESO | `SNAPSHOT_QUINQUENIO_PRECEDENCE_TESTS_OK`; build, calculo oficial, Liquidacion QNA y Snapshot V2 OK | Registrar commit exclusivo de cierre |
| 2026-08-25 | 3 | COMPLETADA | Commit `3641588`; precedencia, D6, cero real y ausencia verificadas | Iniciar fase 4 |
| 2026-08-25 | 4 | EN_PROGRESO | Migracion aplicada y reaplicada; `QNA_OFFICIAL_PROJECTIONS_DESARROLLO_VERIFY_OK`; cero filas modificadas | Revisar diff y registrar commit funcional |
| 2026-08-25 | 4 | COMPLETADA | Commit `612d791`; esquema V5 verificado e idempotente en Desarrollo; revision sin bloqueos | Iniciar fase 5 |
| 2026-08-25 | 5 | EN_PROGRESO | Captura unica, payload V1, identidad por interno e inmutabilidad probados; revision sin bloqueos | Confirmar politica HIP y validar captura read-only en Desarrollo |
| 2026-08-26 | 5 | COMPLETADA | Commits `3970da8` y `6327e70`; `QNA_TEN_DOMAIN_CAPTURE_DESARROLLO_READONLY_OK`; politica HIP `1526,1626`; Snapshot antes/despues en cero | Iniciar fase 6 |
| 2026-08-26 | 6 | COMPLETADA | Commit `1b484ed`; `QNA_V5_WRITER_INTEGRATION_DESARROLLO_ROLLBACK_OK`; 169 proyecciones, reintento idempotente y rollback completo; revision sin bloqueos altos | Iniciar fase 7 |
| 2026-08-26 | 7 | COMPLETADA | Commit `2e61284`; migracion idempotente, verificador fuerte e integracion rollback de retenciones V3 aprobados; cero filas modificadas o retenidas | Iniciar fase 8 |
| 2026-08-26 | 8 | COMPLETADA | Commit `2d70bdc`; dual-write y conciliacion exacta aplicados y reaplicados en Desarrollo; colision, reemplazo, HIP legacy, normalizacion y seguridad verificados | Iniciar fase 9 |
| 2026-08-26 | 9 | COMPLETADA | Commit `1078beb`; endpoints aplicados V5, Swagger, autorizacion, integridad, indice y plan verificados; integracion rollback sin fuentes vivas | Iniciar fase 10 |
| 2026-08-26 | 10 | COMPLETADA | Commits `0f97dce` y `0282e74`; union discriminada, precedencia V5/V3-V4/legacy por scope, ausencia legacy, precision exacta, auditoria admin, plan global y pagina mixta aprobados en Desarrollo | Iniciar fase 11 |
| 2026-08-27 | 11 | COMPLETADA | Commits `ff40203` y `c666210`; ledger SQL, claims, resultado Firebird tipado, recuperacion resumible, resolucion manual, ruta de Linea unificada, migracion idempotente e integracion rollback aprobados | Iniciar fase 12 en Calidad con autorizacion independiente |
| 2026-08-27 | 12 | EN_PROGRESO | Migraciones `09` a `17` idempotentes; `QNA_PHASE12_APPLIED_INTEGRITY_READONLY_OK`; `QNA_PHASE12_CALIDAD_HTTP_READONLY_OK`; lista, resumen y detalle autenticados `200`; 167 filas, paginacion estable y REVISA sin SQL 650 | Obtener una QNA V5 real `TERMINADO` mediante operacion autorizada; no fabricar ni reprocesar evidencia |
| 2026-08-27 | 12 | ESPERA_OPERATIVA_Q16 | Decision: usar exclusivamente Q16 2026 `04/24/01/01` mediante el sistema; quincenas anteriores descartadas; Q16 aun sin carga TXT vigente | Esperar terminacion normal de Q16 y ejecutar verificaciones read-only de Calidad |
| 2026-08-27 | 13 | PREPARACION_VALIDADA_NO_ACTIVA | Interruptor seguro y prueba real rollback-only aprobados en Desarrollo: promoción V5 `DISABLED`, nueve stores retirables en cero, modo activo de fase 8 sin regresiones y conteos finales intactos | Mantener `QNA_LEGACY_DUAL_WRITE_ENABLED=true` en todos los ambientes; no iniciar ni cerrar fase 13 hasta completar fase 12 y obtener aprobacion operativa |
| 2026-08-27 | 13 | PREPARACION_BLINDADA_NO_ACTIVA | Desactivacion fuera de Desarrollo protegida por confirmacion exacta de base; health, template y preflight mantienen visibilidad y valor seguro | Esperar cierre de fase 12 y aprobacion operativa antes de activar |
| 2026-08-27 | 14 | PREPARACION_READONLY | Produccion inventariada sin escrituras: Firebird disponible, pero faltan objetos V5 de migraciones `09` a `17`; paquete futuro alineado con manifest y dual-write activo | No aplicar migraciones ni publicar hasta completar fases 12 y 13 |
| 2026-08-29 | Frontend | EN_VALIDACION_DESARROLLO | Pantallas Entidad de aportaciones y retenciones consumen snapshots aplicados con contratos Zod, totales oficiales, busqueda y paginacion server-side; exportaciones pendientes deshabilitadas | Ejecutar smoke autenticado en Desarrollo; mantener bloqueada la liberacion en Calidad |
| 2026-09-02 | 11 | REVALIDADA | `QNA_PHASE11_INTEGRATION_DESARROLLO_OK`; `QNA_PHASE11_MIGRATION_REPAIR_DESARROLLO_OK`; `QNA_PHASE11_STATE_VERIFIER_DESARROLLO_OK` sin resoluciones manuales pendientes; plan-checker aprobado | Cerrar fase 13 con la aprobacion operativa otorgada el 2026-09-02 |
| 2026-09-02 | 12 | AVANCE_CALIDAD | Migraciones `09` a `23` aplicadas con ensayo rollback en Calidad (`SII-ISSSSPEA`); preflight sin objetos/columnas/artefactos faltantes; `QNA_PHASE12_APPLIED_INTEGRITY_READONLY_OK`; repositorio lee Q15/2026 V4 reconstruida (10 fuentes, 167 registros, esquema OpenAPI valido) y Q16/2026 V4 en Produccion | La puerta de QNA V5 real `TERMINADO` en Calidad sigue abierta hasta operar Q16 con TXT vigente mediante el sistema |
| 2026-09-02 | 13 | COMPLETADA | `QNA_PHASE13_DUAL_WRITE_TOGGLE_OK`; integracion disabled en Desarrollo con rollback: promocion V5 `DISABLED`, nueve stores retirables en cero, retenciones V3 proyectadas (PCP 89, PMP 22) y conteos globales intactos; regresion activa fase 8 sin cambios. Politica vigente: `QNA_LEGACY_DUAL_WRITE_ENABLED=true` en Calidad y Produccion; desactivacion fuera de Desarrollo exige confirmacion exacta de base | Fase 14: paquete y migracion de Produccion ejecutados el 2026-09-01; pendiente operational runbook de retiro definitivo de stores legacy |

## Regla de Actualizacion

Después de cada fase:

1. Registrar pruebas y evidencia.
2. Actualizar el estado en este tablero.
3. Actualizar el plan tecnico.
4. Registrar el commit correspondiente.
5. Actualizar la referencia de modelo o Swagger cuando aplique.
6. No iniciar la fase siguiente si existe una puerta de salida incumplida.
