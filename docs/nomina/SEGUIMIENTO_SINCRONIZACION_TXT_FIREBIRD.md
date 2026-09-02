# Seguimiento de sincronización TXT de nómina con Firebird

## Estado

| Campo | Valor |
| --- | --- |
| Estado general | `CARGA_1526_CONFIRMADA_DESARROLLO` |
| Ambiente autorizado | `DESARROLLO` |
| SQL Server | `SII-ISSSSPEA-DES` |
| Firebird | `/db/db/dbRestaura.fdb` |
| Calidad | `FUERA_DE_ALCANCE_ACTUAL` |
| Producción | `FUERA_DE_ALCANCE_ACTUAL` |
| Reproceso histórico | `NO_AUTORIZADO` |
| Última actualización | `2026-08-29` |

Este documento registra las decisiones, evidencia, fases, pruebas y puertas de salida para sincronizar la carga TXT de nómina entre SQL Server y Firebird. El plan completo queda documentado, pero por ahora sólo se autoriza su implementación y validación en Desarrollo.

## Objetivo

Al subir un TXT válido de nómina:

1. Validar completamente el archivo antes de alterar datos vigentes.
2. Archivar todos los movimientos del scope, coincidan o no por RFC.
3. Mantener activos exclusivamente los detalles del nuevo TXT.
4. Insertar una sola vez por scope el detalle en `AP_D_ORIGEN_TODOS`.
5. Recalcular y persistir una sola vez por scope el resumen en `AP_D_ORIGEN_RESUMEN`.
6. Confirmar la sincronización entre motores antes de responder `ACEPTADA`.
7. Propagar el `NominaCargaId` confirmado a Snapshot V2 y Snapshot QNA V5.
8. Dejar el detalle confirmado en `STATUS='P'` para que posteriormente pueda consumirlo `AP_DN_APLICAR`.

## Fuera de alcance

- Aplicar cambios en Calidad o Producción.
- Reprocesar cargas, snapshots o aplicaciones históricas.
- Cambiar la matriz oficial de bases de datos.
- Ejecutar `AP_DN_APLICAR` durante el upload.
- Escribir en `AP_D_ORIGEN_ARCHIVO` o cualquier otra tabla Firebird.
- Ejecutar `AP_D_VALIDAR_ARCHIVOTXT`, `AP_D_BORRAR` o `AP_DN_BORRAR`.
- Ejecutar `AP_D_IDENTIFICA_ARCHIVOTXT`; la identificación se resuelve mediante consultas read-only y el detalle se inserta directamente.
- Eliminar, sustituir o actualizar registros Firebird preexistentes.
- Implementar el layout de 35 campos sin un mapping certificado.
- Compensar automáticamente un commit Firebird incierto mediante borrados.
- Sustituir los procedimientos legacy por inserciones directas sin validar equivalencia funcional.

## Reglas confirmadas

### Precedencia del TXT

- El TXT reemplaza la fuente nominal activa del scope.
- Todos los detalles `MOVIMIENTO` se copian a histórico.
- Después de finalizar la carga sólo quedan detalles activos vinculados al TXT.
- Una vez vigente el TXT, no se admiten movimientos posteriores para el mismo scope.

### Validación

- Se acepta únicamente el layout actual de 20 campos.
- El layout de 35 campos se rechaza hasta implementar su orden oficial.
- Los campos monetarios y de fecha opcionales pueden venir vacíos.
- Un valor no vacío con formato monetario o fecha inválidos rechaza toda la carga.
- Un solo error impide cualquier modificación de SQL Server o Firebird vigente.
- No se incluyen RFC, nombres, líneas originales ni otros datos personales en logs técnicos.

### Snapshot y aplicación

- La sincronización TXT debe terminar antes de crear o promover Snapshot V2/V5.
- Con TXT exacto, V2 y V5 conservan el mismo `NominaCargaId`.
- Un TXT sustituido invalida cualquier candidato construido con la carga anterior.
- Un Snapshot oficial bloquea nuevas cargas para ese scope.
- La carga única sólo habilita `AP_DN_APLICAR` después de confirmar que todas las filas nuevas están en `STATUS='P'` y el resumen está conciliado.
- Aplicar QNA con TXT permanece bloqueado si existe cualquier fila N, falta el resumen o los conteos/totales no coinciden.
- `AP_DN_APLICAR` cambia posteriormente las filas preparadas de P a A.
- Sin `NominaCargaId`, Aplicar QNA ejecuta `AP_P_APLICAR` para C y F.
- No existe fallback automático de TXT inválido o sustituido a C/F.

## Regla temporal: carga única sin eliminación

Hasta que exista una decisión funcional y operativa sobre eliminación o reemplazo, Firebird se manejará con estas reglas:

1. Antes de escribir se consulta el scope efectivo en `AP_D_ORIGEN_TODOS`.
2. Antes de escribir se consulta el scope efectivo en `AP_D_ORIGEN_RESUMEN`.
3. Si cualquiera de las dos tablas ya contiene información del scope, la carga se bloquea.
4. No se elimina, actualiza ni sustituye ninguna fila existente.
5. No se ejecuta ningún procedimiento que escriba en tablas distintas de las dos autorizadas.
6. El detalle nuevo se inserta en `AP_D_ORIGEN_TODOS`; su trigger lo deja inicialmente en `STATUS='N'`.
7. El resumen se calcula exclusivamente desde el detalle nuevo y se inserta en `AP_D_ORIGEN_RESUMEN`.
8. Ambas escrituras y sus verificaciones deben ocurrir en una sola transacción Firebird.
9. Si detalle y resumen concilian, las filas nuevas del scope cambian de N a P dentro de la misma transacción.
10. Se verifica que no queden filas N y que el conteo P sea exactamente el esperado.
11. Si falla cualquier fila, resumen, transición o conciliación, se revierte toda la transacción.
12. Una carga confirmada deja ocupado el scope y una segunda carga se rechaza.

Código de conflicto propuesto:

```text
409 NOMINA_FIREBIRD_SCOPE_EXISTENTE
```

La transición N → P queda autorizada exclusivamente para las filas recién insertadas de un scope previamente vacío, después de conciliar detalle y resumen. No autoriza actualizar filas preexistentes.

## Decisiones pendientes sobre eliminación

- Si pueden eliminarse filas `STATUS='N'`.
- Si pueden sustituirse filas `STATUS='P'`.
- Confirmar que las filas `STATUS='A'` serán siempre inmutables.
- Qué evidencia debe conservarse antes de un reemplazo.
- Qué usuario o rol autorizará la eliminación.
- Si el reemplazo usará procedimientos legacy o una operación nueva y acotada.
- Cómo se tratará el scope especial de `ORG0 IN ('01','02')`.

Hasta cerrar estas decisiones, cualquier existencia previa en `AP_D_ORIGEN_TODOS` o `AP_D_ORIGEN_RESUMEN` bloquea la carga.

## Evidencia Firebird de Desarrollo

La inspección se realizó en modo de sólo lectura sobre `/db/db/dbRestaura.fdb`. No se consultaron Calidad ni Producción y no se leyeron datos personales.

### Ciclo de estados

El flujo legacy observado utiliza:

```text
INSERT → STATUS=N
validación y preparación → STATUS=P
AP_DN_APLICAR → STATUS=A
```

### Contrato de estatus

| Estatus | Significado | Quién lo establece | Regla operativa |
| --- | --- | --- | --- |
| `N` | Nuevo, todavía no preparado | Trigger `AP_D_ORIGEN_TODOS_BI0` al insertar | No puede ser consumido por `AP_DN_APLICAR` |
| `P` | Preparado y conciliado | Orquestador backend después de validar detalle y resumen | Único estado permitido antes de ejecutar `AP_DN_APLICAR` |
| `A` | Aplicado | `AP_DN_APLICAR` después de procesar el scope | Histórico inmutable; no eliminar ni reemplazar |

Transiciones permitidas en el alcance actual:

```text
INSERT → N
N → P  sólo para la carga nueva conciliada y dentro de la misma transacción
P → A  exclusivamente mediante AP_DN_APLICAR durante Aplicar QNA
```

Transiciones prohibidas:

```text
A → N
A → P
A → eliminado
P preexistente → reemplazado
N preexistente → reemplazado
```

Conteos agregados encontrados durante la inspección:

| Estado | Filas |
| --- | ---: |
| `A` | 7,076,205 |
| `N` | 61 |
| `P` | 39 |

No se encontraron scopes con mezcla de estados N/P/A. Se encontró un scope P sin resumen, por lo que la existencia de filas P no es evidencia suficiente para permitir `AP_DN_APLICAR`.

### `AP_D_ORIGEN_TODOS`

- Tiene 58 columnas.
- No tiene PK, UK ni FK.
- La idempotencia debe garantizarla la orquestación.
- Los índices principales usan `INTERNO`, `QNA` y orgánicas.
- El trigger `AP_D_ORIGEN_TODOS_BI0` fuerza `STATUS='N'` y registra usuario/fecha de alta.
- `AP_DN_APLICAR` cambia las filas del scope de P a A.

Procedimientos relacionados confirmados:

- `AP_D_IDENTIFICA_ARCHIVOTXT`
- `AP_D_VALIDAR_ARCHIVOTXT`
- `AP_D_ACTUALIZAR_REG_ALL`
- `AP_D_LEER_IDENTIFICADOS`
- `AP_D_ORGANICAS_LISTAS`
- `AP_D_BORRAR`
- `AP_DN_BORRAR`
- `AP_DN_FONDOS`
- `AP_DN_RESUMEN_TXT`
- `AP_DN_RESUMENX`
- `AP_DN_TODOS`
- `AP_DN_APLICAR`

No existe un procedimiento Firebird único que orqueste toda la preparación. La etapa temporal no reproducirá la secuencia legacy completa ni usará procedimientos que escriban otras tablas. Sólo realizará la carga única y conciliada de las dos tablas autorizadas.

### `AP_D_ORIGEN_RESUMEN`

- Tiene 106 columnas.
- Su PK es `(ORG0, ORG1, ORG2, ORG3, PERIODO, TIPO)`.
- La relación con `AP_D_ORIGEN_TODOS` es lógica; no existe FK.
- El trigger `AP_D_ORIGEN_RESUMEN_BI0` asigna fecha y convierte a cero importes nulos.
- `AP_DN_TODOS` inserta o actualiza grupos del resumen.
- `AP_DN_APLICAR` copia información del resumen sin filtrar `ORG2`, `ORG3` ni `TIPO`; antes de aplicar se debe verificar que exista una sola fila funcional para `ORG0 + ORG1 + PERIODO`.

### Scope legacy

- Para `ORG0 IN ('01','02')`, varios procedimientos trabajan por `QNA + ORG0`.
- Para otras entidades trabajan por `QNA + ORG0 + ORG1`.
- Los parámetros `ORG2` y `ORG3` forman parte de contratos y PK, pero no de todos los filtros internos.
- La implementación no debe ampliar ni reducir estos scopes sin una prueba que demuestre equivalencia con los SP legacy.

## Mapping del layout 20

Los índices de esta tabla son humanos, comenzando en 1.

| Campo | Destino actual | Decisión para la nueva implementación |
| ---: | --- | --- |
| 1 | Lote | Conservar y validar |
| 2 | Tipo de registro | Debe ser `2` para detalle |
| 3 | Clave personal | Conservar y validar |
| 4 | RFC | Conservar, normalizar y validar duplicados |
| 5 | Nombre | Conservar y validar |
| 6 | FA afiliado | Conservar y validar moneda |
| 7 | FA entidad | Conservar y validar moneda |
| 8 | EBI afiliado | Conservar y validar moneda |
| 9 | EBI entidad | Conservar y validar moneda |
| 10 | Base de cotización sueldo | Conservar y validar moneda |
| 11 | Base de cotización quinquenios | Conservar y validar moneda |
| 12 | Sueldo mensual | Conservar y validar moneda |
| 13 | PCP | Conservar sujeto a prueba de contrato |
| 14 | Hipotecario | Conservar sujeto a prueba de contrato |
| 15 | Fecha de movimiento | Validar `AAAAMMDD` y calendario real |
| 16 | No certificado | Sólo vacío o cero |
| 17 | CAIR | Mapping certificado para el formato histórico disponible |
| 18 | No certificado | Sólo vacío o cero |
| 19 | No certificado | Sólo vacío o cero |
| 20 | Reservado | Sólo vacío o cero; nunca ignorar un valor no-cero |

La correlación agregada de Desarrollo certificó el campo 17 como CAIR:

| Scope | Registros | Suma campo 17 | Firebird `CAIR` |
| --- | ---: | ---: | ---: |
| 2026/Q12, `04/24/01/01` | 170 | 27,664.66 | 27,664.66 |
| 2026/Q13, `04/24/01/01` | 170 | 27,617.95 | 27,617.95 |
| 2026/Q14, `04/24/01/01` | 169 | 27,523.57 | 27,523.57 |

El mapping actual campo 17 → `DescuentosOtros` queda refutado para estas cargas. El mapping actual campo 18 → `CAIR` no tiene respaldo. No se actualizarán datos históricos; la corrección tendrá vigencia sólo para cargas nuevas.

## Arquitectura propuesta

### Ledger de sincronización

SQL Server registrará un intento durable con estados equivalentes a:

```text
PREPARADA
FIREBIRD_EN_PROGRESO
FIREBIRD_CONFIRMADO
FIREBIRD_REVERTIDO
FIREBIRD_INCIERTO
SQL_FINALIZADO
TERMINADO
```

El ledger debe conservar:

- UUID del intento.
- Scope completo.
- Hash del archivo.
- Conteos y totales esperados.
- Usuario iniciador.
- `CargaId` final.
- Resultado Firebird tipado.
- Evidencia de conciliación.
- Error técnico normalizado.
- Fechas de creación y actualización.

Sólo puede existir una sincronización activa por scope.

### Staging SQL Server

La carga parseada se conserva en staging antes de escribir Firebird:

- No sustituye todavía el TXT vigente.
- No se expone como carga vigente.
- No archiva movimientos todavía.
- Permite finalizar SQL si Firebird confirmó y después falla SQL Server.
- Permite bloquear el scope sin solicitar nuevamente el archivo al usuario.

### Transacción Firebird temporal

Dentro de una transacción Firebird única:

1. Consultar `AP_D_ORIGEN_TODOS` para el scope efectivo.
2. Consultar `AP_D_ORIGEN_RESUMEN` para el mismo scope.
3. Abortar con conflicto si cualquiera contiene filas.
4. Insertar los detalles nuevos exclusivamente en `AP_D_ORIGEN_TODOS`.
   Antes de cada inserción, el RFC debe resolver exactamente una fila activa de `PERSONAL + ORG_PERSONAL` para `ORG0–3`. `INTERNO` y `PLAZAORIGEN` proceden de `PERSONAL.INTERNO` y `PERSONAL.NOEMPLEADO`; `CORG0–3` y `ACTIVO` proceden de `ORG_PERSONAL`.
5. Verificar que todas las filas nuevas quedaron inicialmente en `STATUS='N'`.
6. Verificar que el conteo coincide con staging SQL.
7. Recalcular el resumen exclusivamente desde los detalles nuevos.
8. Insertar una sola fila funcional en `AP_D_ORIGEN_RESUMEN`.
9. Verificar unicidad, conteos y totales a centavos.
10. Actualizar exclusivamente las filas nuevas del scope de N a P.
11. Exigir cero filas N y exactamente el conteo esperado de filas P.
12. Confirmar o revertir toda la transacción.

No se ejecutarán operaciones de eliminación ni `AP_DN_APLICAR` durante el upload. La única actualización permitida es N → P para la carga nueva conciliada.

### Finalización SQL Server

Después de `COMMIT_CONFIRMADO` en Firebird:

1. Adquirir lock SQL serializable del scope.
2. Confirmar que no exista Snapshot oficial.
3. Copiar todos los detalles MOVIMIENTO a histórico.
4. Copiar los detalles del TXT vigente anterior a histórico.
5. Eliminar todos los detalles activos anteriores.
6. Desactivar el TXT anterior.
7. Crear la nueva carga `TXT/APLICADA/EsVigente=1`.
8. Copiar staging a detalle activo.
9. Confirmar que sólo existan filas del nuevo TXT.
10. Confirmar RFC únicos y conteos.
11. Finalizar ledger y limpiar staging.

La respuesta será `ACEPTADA` únicamente después de completar estos pasos.

## Política de fallas

| Falla | Acción |
| --- | --- |
| Parser o validación | Registrar `RECHAZADA`; no tocar Firebird ni carga vigente |
| Firebird no inicia | Mantener staging reintentable |
| Scope existente en cualquiera de las dos tablas | Bloquear con `NOMINA_FIREBIRD_SCOPE_EXISTENTE`; no modificar datos |
| Rollback Firebird confirmado | Mantener SQL vigente; permitir reintento controlado |
| Resultado Firebird incierto | Bloquear scope y exigir resolución administrativa |
| Firebird confirmado y SQL falla | Reanudar SQL desde staging; no repetir Firebird |
| SQL finalizado | Marcar carga aceptada y saga terminada |
| Snapshot oficial existente | Responder `409 NOMINA_TXT_BLOQUEADA_POR_LIQUIDACION_OFICIAL` |

No se intentará restaurar Firebird automáticamente después de un commit confirmado o incierto.

## Fases de Desarrollo

### Fase D0: contrato y baseline

- [x] Crear datos sintéticos anonimizados del layout 20 dentro de pruebas contractuales.
- [x] Congelar validación y reemplazo actual con pruebas contractuales.
- [x] Certificar firmas de los SP involucrados mediante metadata read-only.
- [x] Retirar del alcance temporal las operaciones legacy de eliminación y escritura en terceras tablas.
- [x] Certificar mediante rollback la carga única, resumen y transición controlada N → P usando sólo las dos tablas autorizadas.
- [x] Verificar por source el scope especial de ORG0 01/02.
- [x] Documentar conteos y totales agregados sin PII.

Hallazgo de la prueba anterior:

```text
AP_D_VALIDAR_ARCHIVOTXT: no permission for DELETE access to TABLE AP_D_ORIGEN_TODOS
```

La prueba rollback-only se revirtió y confirmó cero residuos. Ese camino queda descartado porque `AP_D_VALIDAR_ARCHIVOTXT` escribe una tercera tabla e intenta eliminar información. La nueva puerta D0 quedó certificada exclusivamente con inserciones en `AP_D_ORIGEN_TODOS` y `AP_D_ORIGEN_RESUMEN`, transición N → P y sin solicitar permiso DELETE.

La prueba vigente `test:nomina:firebird-sync:desarrollo` certifica detalle P, resumen único y totales dentro de una transacción forzada a rollback. No invoca `AP_D_VALIDAR_ARCHIVOTXT`, `DELETE` ni `AP_DN_APLICAR` y confirma cero residuos.

La carga directa tampoco invoca `AP_D_IDENTIFICA_ARCHIVOTXT`. El cotejo read-only de `PLAZAORIGEN` confirmó que no corresponde a la clave personal del TXT: para QNA 1426, 169/169 filas, y para QNA 1326, 170/170 filas, coinciden con `PERSONAL.NOEMPLEADO` mediante `INTERNO`; ninguna coincide con `AP_D_ORIGEN_TODOS.NOEMPLEADO`.

La integración rollback usa los 167 detalles y el hash del TXT 1526 con un lote futuro sintético `0127`, para no interferir con la carga funcional ya confirmada. Dentro de la misma transacción exige exactamente una fila directa en `AP_D_ORIGEN_RESUMEN`, con `TIPO='AN'` y coincidencia completa de `ORG0–3 + PERIODO`; después verifica por separado cero detalles y cero resúmenes residuales del scope sintético.

El resumen PMP conserva la equivalencia de `AP_DN_TODOS`: sólo agrega `CLASE` 1–5 porque son las únicas categorías con columnas `PMP_EV/GM/AV/ET/CO` en `AP_D_ORIGEN_RESUMEN`. Las clases posteriores existentes en `PRESTAMOS_TIPO_CLASE` no se incorporan a esos cinco grupos, igual que en el procedimiento legacy.

Puerta de salida:

- Secuencia Firebird repetible dentro de una transacción.
- Cero filas N al finalizar preparación.
- Conteo P y resumen exactos.

### Fase D1: parser estricto

- [x] Rechazar layout distinto de 20.
- [x] Conservar números físicos de línea.
- [x] Validar moneda, escala y overflow contra `NUMERIC(12,2)`.
- [x] Validar fechas `AAAAMMDD` y calendario real.
- [x] Permitir vacíos opcionales.
- [x] Rechazar campos no certificados no-cero.
- [x] Corregir campo 17 a CAIR para cargas nuevas.
- [x] Añadir pruebas unitarias sintéticas del parser y command.

Evidencia:

```text
npm run test:nomina:layout20          → NOMINA_LAYOUT20_PARSER_OK
npm run test:nomina:upload-validation → NOMINA_UPLOAD_VALIDATION_OK
npm run build                          → PASS
```

Puerta de salida:

- Ningún archivo inválido llega a persistencia.
- Un error no altera SQL vigente ni Firebird.

### Fase D2: ledger y staging

- [x] Diseñar migración SQL idempotente.
- [x] Crear definición de ledger durable.
- [x] Crear definición de staging de cabecera y detalle.
- [x] Crear unicidad de sincronización activa por scope.
- [x] Añadir estados y restricciones.
- [x] Probar migración dos veces con rollback-only.
- [x] Aplicar migraciones 20/21 en Desarrollo.
- [ ] Añadir consulta administrativa de estado sin PII.

Artefactos preparados exclusivamente para Desarrollo:

- `database/migrations/20260827_20_create_nomina_txt_sync_ledger_staging.sql`
- `database/migrations/20260827_21_verify_nomina_txt_sync_ledger_staging.sql`
- `scripts/migrate-nomina-txt-sync-desarrollo.ts`
- `scripts/test-nomina-txt-sync-migration-desarrollo.ts`

Evidencia:

```text
npm run migrate:nomina:txt-sync:desarrollo
→ NOMINA_TXT_SYNC_MIGRATION_ROLLBACK_DESARROLLO_OK

npm run test:nomina:txt-sync-migration:desarrollo
→ NOMINA_TXT_SYNC_MIGRATION_INTEGRATION_ROLLBACK_OK
```

Las migraciones 20/21 están aplicadas en Desarrollo y verificadas con ejecución idempotente rollback-only. No están incluidas en paquetes de Calidad o Producción.

Puerta de salida:

- Una carga preparada sobrevive a reinicios.
- No pueden competir dos cargas del mismo scope.

### Fase D3: orquestador Firebird

- [x] Implementar servicio Firebird temporal del módulo Nómina.
- [x] Limitar escrituras a `AP_D_ORIGEN_TODOS` y `AP_D_ORIGEN_RESUMEN`.
- [x] Bloquear si el scope ya existe en cualquiera de las dos tablas.
- [x] Ejecutar detalle y resumen dentro de la misma transacción.
- [x] Clasificar commit, rollback, incierto y no iniciado.
- [x] Validar N, resumen, conteos y totales.
- [x] Impedir cualquier eliminación o sustitución.
- [x] Implementar reanudación segura de `FIREBIRD_REVERTIDO`.
- [x] Añadir logs estructurados sin PII.

Puerta de salida:

- Rollback confirmado no deja filas parciales.
- Resultado incierto bloquea el scope.
- Commit confirmado produce detalle P y resumen conciliado.
- Una segunda carga del mismo scope queda bloqueada.

### Fase D4: finalización SQL

- [x] Ajustar el reemplazo actual para archivar todos los movimientos, incluidos RFC ausentes del TXT.
- [x] Archivar TXT anterior.
- [x] Dejar sólo el nuevo TXT en detalle activo.
- [x] Finalizar desde staging de forma idempotente.
- [ ] Corregir estadísticas de carga vigente.
- [ ] Añadir `EntidadId` a la validación de movimientos posteriores.
- [ ] Bloquear snapshots mientras la saga no esté terminada.

Evidencia parcial:

```text
npm run test:nomina:replacement → NOMINA_TXT_REPLACEMENT_CONTRACTS_OK
npm run test:nomina:sql-sync:desarrollo → NOMINA_SQL_SYNC_INTEGRATION_DESARROLLO_OK
```

La integración SQL usa un scope futuro vacío y datos sintéticos; confirma ledger `TERMINADO`, `Activo=0`, carga aplicada, detalle exacto y replay idempotente. Su `finally` elimina exclusivamente los IDs creados, en orden de FK, incluido historial si existiera.

Puerta de salida:

- Detalle activo contiene una sola carga TXT.
- No quedan movimientos activos en el scope.
- SQL puede finalizarse después de una falla simulada.

### Fase D5: integración V2/V5 y AP_DN

- [ ] Exigir saga TXT terminada para capturar/promover.
- [ ] Confirmar `NominaCargaId` idéntico en V2 y V5.
- [ ] Bloquear candidatos creados antes de sustituir TXT.
- [ ] Mantener bloqueo después de Snapshot oficial.
- [ ] Bloquear `AP_DN_APLICAR` si existe cualquier fila N/A, cero detalles o el resumen está ausente/duplicado.
- [ ] Permitir `AP_DN_APLICAR` cuando todo el detalle del scope está en P y existe exactamente un resumen.
- [ ] Verificar rama C/F sin TXT.
- [ ] Confirmar EBI, Línea, REVISA y bitácora sin cambios.

Puerta de salida:

- Nunca se ejecuta DN con TXT distinto al snapshot, con filas N o sin resumen conciliado.
- Nunca se ejecuta C/F como fallback de un TXT inconsistente.

Esta fase queda fuera del commit de sincronización TXT. Los cambios locales de Snapshot V2/V5, selección DN frente a C/F y precheck de `AP_DN_APLICAR` no forman parte de la entrega hasta completar sus pruebas específicas de extremo a extremo.

### Fase D6: cierre de Desarrollo

- [x] Ejecutar `npm run verify:database:environments`.
- [x] Ejecutar build y regresiones del alcance Nómina/QNA.
- [x] Ejecutar migraciones SQL rollback-only.
- [x] Ejecutar pruebas Firebird rollback-only.
- [x] Ejecutar una E2E controlada en Desarrollo.
- [x] Documentar resultados y riesgos residuales.
- [ ] Solicitar autorización separada antes de preparar Calidad.

Evidencia funcional de la carga 1526, scope `04/24/01/01`:

| Componente | Resultado persistido |
| --- | --- |
| Archivo | `15 OC Y FG 2026.txt`, SHA-256 `847A738EE4A8F1DFA66F5BF77CEA39DBD54952A2997A910249C4E6A9746AB8E9` |
| SQL ledger | `SincronizacionId=6`, `TERMINADO`, `COMMIT_CONFIRMADO`, sin error |
| SQL carga | `CargaId=20`, TXT `APLICADA`, vigente, 167 detalles y 167 RFC únicos |
| Firebird detalle | 167 filas, 167 P, 0 N, 0 A |
| Identificación | 167 `PLAZAORIGEN=PERSONAL.NOEMPLEADO` y 167 orgánicas activas `04/24/01/01` |
| Firebird resumen | Una fila `TIPO='AN'` para `04/24/01/01 + 1526` |

La E2E confirma únicamente upload, sincronización Firebird y finalización SQL. No confirma Snapshot V2/V5 ni autoriza `AP_DN_APLICAR`; esos puntos permanecen abiertos en D5. Calidad, Producción y reproceso histórico continúan fuera de alcance.

### Evidencia frontend Entidad

El flujo de carga TXT del frontend Entidad fue ajustado para no ocultar errores detrás del modal de validación:

- Sólo `201 + ok=true + ACEPTADA` cierra el modal y actualiza el estado de carga vigente.
- `422 + RECHAZADA` mantiene el modal abierto y presenta conteos y errores por línea.
- `409`, `503`, timeout y errores de contrato mantienen el modal abierto y muestran el mensaje operativo.
- Una respuesta resuelta que no concilie código HTTP, `ok` y `estado` se rechaza y nunca se presenta como éxito.
- Los textos funcionales existentes de validación, estados y acciones se conservaron.

Archivos modificados:

```text
../../front/Entidad/ISS-F-Entidad/src/services/nomina/aplicacion-qnal-txt.api.ts
../../front/Entidad/ISS-F-Entidad/src/features/archivo-nomina/useArchivoNomina.hooks.ts
../../front/Entidad/ISS-F-Entidad/src/widgets/archivo-nomina/ArchivoNominaWidget.tsx
```

Validación local: `npm run typecheck`, `npm run lint` y `npm run build` correctos. Esta evidencia cubre únicamente el comportamiento frontend y no acredita la ejecución de `AP_DN_APLICAR`.

## Matriz mínima de pruebas

| Caso | Resultado esperado |
| --- | --- |
| Importe con letras | Carga rechazada |
| Importe con overflow | Carga rechazada |
| Importe opcional vacío | Permitido |
| Fecha imposible | Carga rechazada |
| Layout 35 | Carga rechazada |
| Campo 17 válido | Persistido como CAIR en carga nueva |
| Campo 16/18/19/20 no-cero | Carga rechazada |
| RFC duplicado | Carga rechazada |
| TXT con movimientos coincidentes | Todos los movimientos a histórico |
| TXT con movimientos no coincidentes | Todos los movimientos a histórico |
| Scope ya existente en `AP_D_ORIGEN_TODOS` | Carga bloqueada sin cambios |
| Scope ya existente en `AP_D_ORIGEN_RESUMEN` | Carga bloqueada sin cambios |
| Primera carga Firebird válida | Detalle P y resumen único conciliado |
| Falla antes de iniciar Firebird | SQL vigente intacto |
| Falla Firebird con rollback | Sin filas parciales |
| Commit Firebird y falla SQL | Finalización reanudable desde staging |
| Resultado Firebird incierto | Scope bloqueado |
| Resumen inexistente o duplicado | No permitir aplicación |
| TXT sustituido antes de promover | Candidato bloqueado |
| Snapshot oficial | Nueva carga bloqueada |

## Criterios de aceptación de Desarrollo

- El parser no acepta layouts o valores no certificados.
- No se pierden valores no-cero silenciosamente.
- Los movimientos quedan únicamente en histórico después de aceptar el TXT.
- SQL Server conserva una sola carga TXT vigente por scope.
- Firebird conserva el detalle confirmado en estado P antes de aplicar.
- El resumen se deriva del detalle y concilia a centavos.
- Una falla parcial queda representada por un estado durable y recuperable.
- Snapshot V2/V5 sólo usa una sincronización terminada.
- `AP_DN_APLICAR` sólo se habilita cuando la carga exacta está completamente en P y conciliada.
- No se modifican períodos históricos.
- No se realizan operaciones en Calidad ni Producción.

## Riesgos abiertos

| Riesgo | Mitigación prevista |
| --- | --- |
| Orden legacy externo no documentado | Usar una transición N → P acotada al scope nuevo, después de conciliación y sin SPs que escriban otras tablas |
| `AP_D_ORIGEN_TODOS` sin PK | Bloqueo previo de scope, carga única y conciliación |
| Scope especial de ORG0 01/02 | Pruebas específicas y uso exacto de SP legacy |
| Resumen P inexistente | Gate obligatorio antes de AP_DN |
| Resultado Firebird incierto | Ledger, bloqueo y resolución administrativa |
| Campo 16/18/19 no certificado | Rechazar valores no-cero |
| Layout 35 mal interpretado | Rechazarlo por ahora |
| Diferencia histórica de campo 17 | Corregir sólo cargas nuevas y documentar corte |
| Concurrencia con cliente legacy | Lock, detección de cambios y no asumir exclusividad externa |

## Registro de seguimiento

| Fecha | Fase | Estado | Evidencia | Siguiente acción |
| --- | --- | --- | --- | --- |
| 2026-08-27 | Plan | `COMPLETADO` | Decisiones funcionales y alcance Desarrollo confirmados | Iniciar D0 sólo con autorización de implementación |
| 2026-08-27 | Investigación | `COMPLETADO` | Metadata, triggers, SPs, estados N/P/A y mapping histórico inspeccionados read-only | Certificar orden legacy rollback-only |
| 2026-08-27 | D0 | `CAMINO_ANTERIOR_DESCARTADO` | Rollback limpio; `AP_D_VALIDAR_ARCHIVOTXT` intentaba DELETE y escribía fuera de las dos tablas autorizadas | Certificar carga única sin eliminación ni `AP_D_VALIDAR_ARCHIVOTXT` |
| 2026-08-27 | D1 | `COMPLETADO_LOCAL` | Parser layout 20, validación estricta, CAIR campo 17 y pruebas PASS | Mantener regresión durante D2-D5 |
| 2026-08-27 | D2 | `MIGRACION_VALIDADA_NO_APLICADA` | Migración idempotente y prueba integración rollback-only PASS | Aplicar en Desarrollo sólo cuando D3 pueda integrarse |
| 2026-08-27 | D4 | `PARCIAL` | Reemplazo actual archiva TXT y todos los MOVIMIENTO; contrato PASS | Implementar finalización idempotente desde staging después de D3 |
| 2026-08-27 | Reajuste de alcance | `APROBADO` | Sólo `AP_D_ORIGEN_TODOS` y `AP_D_ORIGEN_RESUMEN`; una carga por scope; sin eliminación | Rediseñar D3 para carga única y transición controlada N → P |
| 2026-08-27 | Estatus Firebird | `APROBADO` | La carga conciliada termina en P; `AP_DN_APLICAR` realizará posteriormente P → A | Certificar carga, resumen y N → P mediante rollback-only |
| 2026-08-28 | D0/D3 | `COMPLETADO_DESARROLLO` | Transacción detalle + resumen + N → P certificada rollback-only; cero residuos y sin DELETE | Mantener regresión rollback-only |
| 2026-08-28 | D2 | `APLICADO_DESARROLLO` | Migraciones 20/21 aplicadas y verificador idempotente PASS en `SII-ISSSSPEA-DES` | No promover a otros ambientes sin autorización |
| 2026-08-28 | D4 | `COMPLETADO_DESARROLLO` | Ledger/staging, finalización SQL e idempotencia validados con integración y limpieza por IDs | Monitorear primera carga funcional autorizada |
| 2026-08-28 | D5 | `TRABAJO_LOCAL_NO_INCLUIDO` | Existen cambios locales de gate SQL y precheck Firebird, pero no forman parte del commit de sincronización TXT | Completar y validar D5 antes de integrarlo |
| 2026-08-28 | D6 | `CIERRE_TECNICO_LOCAL` | Ambientes, build, regresiones Nómina/QNA, migración rollback-only, Firebird rollback-only y SQL idempotente PASS | Ejecutar primera carga funcional sólo con archivo/scope autorizado |
| 2026-08-29 | D3 | `CORRECCION_INSERT_DIRECTO` | Identificación read-only por RFC en `PERSONAL + ORG_PERSONAL`; `PLAZAORIGEN=PERSONAL.NOEMPLEADO`; eliminado `AP_D_IDENTIFICA_ARCHIVOTXT` del flujo | Validar carga real 1526 primero mediante rollback-only |
| 2026-08-29 | D3/D4/D6 | `E2E_1526_CONFIRMADA_DESARROLLO` | Ledger 6 terminado, commit Firebird confirmado, carga 20 vigente, 167 detalles P y un resumen AN | Completar D5 con identidad V2/V5 y gate previo a `AP_DN_APLICAR` |
| 2026-08-29 | Frontend Entidad | `ERRORES_MODAL_CORREGIDOS` | `201/ACEPTADA` es el único éxito; `422`, `409`, `503` y timeout permanecen visibles dentro del modal; typecheck, lint y build PASS | Mantener esta regresión al modificar la carga TXT |

## Alcance futuro no autorizado

Después de cerrar Desarrollo se requerirá autorización explícita para cada ambiente:

1. Calidad:
   - Ejecutar la verificación obligatoria de ambientes.
   - Comparar metadata y source de SPs contra Desarrollo.
   - Preparar migraciones y pruebas read-only.
   - Usar exclusivamente una QNA nueva por flujo normal.
2. Producción:
   - Ejecutar preflight separado.
   - Confirmar `SII-ISSSSPEA-PROD` con `/db/db/dbQna1326.fdb`.
   - Desplegar sin reprocesar históricos.
   - Monitorear la primera carga y aplicación.

La existencia de este apartado no autoriza operaciones fuera de Desarrollo.
