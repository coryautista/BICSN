# Referencia del Modelo Snapshot QNA Oficial

## Alcance

Este documento describe el contrato de persistencia del Snapshot QNA oficial a partir de `VersionEsquema = 5`.

El modelo conserva evidencia inmutable de los diez dominios sin reconstruir periodos cerrados desde fuentes vivas:

- Ahorro.
- Vivienda.
- Prestaciones.
- CAIR.
- Guarderias.
- Transitorio.
- Aguinaldo.
- PCP.
- PMP.
- HIP.

La aplicacion oficial se acredita mediante una transicion de `liquidacion.QnaProcesoTransicion` a `TERMINADO`. La tabla `liquidacion.QnaSnapshotOficialActual` selecciona el snapshot vigente, pero no sustituye esa evidencia.

## Versiones

| Version | Semantica |
|---:|---|
| 1-4 | Contratos anteriores o reducidos. Pueden no tener proyeccion legible completa. |
| 5 | Proyeccion legible de cuatro fondos y payload completo de seis dominios auxiliares. |

No se actualizan snapshots anteriores a version 5 ni se rellenan columnas nuevas desde SQL Server o Firebird vivos.

## Precision

- Detalle monetario: `DECIMAL(19,6)`, representado como D6 en contratos.
- Totales oficiales: `DECIMAL(19,2)`, representados como A2 en contratos.
- Dias laborados: `DECIMAL(5,2)` entre 0 y 15.
- Hashes: SHA-256 hexadecimal mayusculo de 64 caracteres.
- Ausencia no verificable: `NULL`, nunca cero sintetico.

## Cabecera Oficial

### `liquidacion.QnaSnapshot`

Identifica periodo, organicas, ambiente, revision, formula, carga nominal y `aportaciones.SnapshotCalculoV2` asociados.

Para snapshots nuevos completos:

```text
VersionEsquema = 5
FuentesEsperadas = 10
FuentesCompletas = 10
Estado = COMPLETO
```

Los enlaces de cabecera deben coincidir en periodo, ambito, ambiente, carga y formula con el Snapshot V2.

### `liquidacion.QnaSnapshotFuente`

Contiene exactamente una fila por dominio. Registra estado, fuente, identificador, escala, conteo y hash de fuente.

### `liquidacion.QnaSnapshotTotal`

Conserva totales A2 de componentes, fondos, dominios auxiliares, retenciones y total general. El frontend no recalcula totales oficiales desde paginas de detalle.

## Proyeccion por Empleado

### `liquidacion.QnaSnapshotDetalle`

Conserva las columnas historicas y agrega la proyeccion V5:

| Columna | Tipo | Regla V5 |
|---|---|---|
| `SnapshotCalculoV2DetalleId` | `BIGINT NULL` | Requerido; FK al detalle matematico congelado. |
| `EmpleadoClaveHash` | `CHAR(64) NULL` | Requerido; unico por snapshot cuando no es nulo. |
| `Interno` | `INT NULL` | Requerido para filas V5. |
| `Nombre` | `NVARCHAR(255) NULL` | Nombre exacto mostrado al aplicar. |
| `DiasLaborados` | `DECIMAL(5,2) NULL` | Requerido; rango 0 a 15. |
| `DiasOrigen` | `VARCHAR(40) NULL` | Requerido. |
| `SueldoMensualD6` | `DECIMAL(19,6) NULL` | Requerido. |
| `BaseCotizacionSueldoD6` | `DECIMAL(19,6) NULL` | Nulo si no es verificable. |
| `QuinqueniosMensualD6` | `DECIMAL(19,6) NULL` | Requerido. |
| `BaseCotizacionQuinqueniosD6` | `DECIMAL(19,6) NULL` | Nulo si no es verificable. |
| `CAIRFondoD6` | `DECIMAL(19,6) NULL` | Requerido. |
| `PrestacionesD6` | `DECIMAL(19,6) NULL` | Requerido. |
| `ViviendaD6` | `DECIMAL(19,6) NULL` | Requerido. |
| `GuarderiasD6` | `DECIMAL(19,6) NULL` | Requerido; cero real cuando no hay importe del empleado. |
| `TransitorioD6` | `DECIMAL(19,6) NULL` | Requerido; cero real cuando no hay importe del empleado. |
| `AguinaldoD6` | `DECIMAL(19,6) NULL` | Requerido; cero real cuando no hay importe del empleado. |
| `HashFila` | `CHAR(64) NULL` | Requerido; integridad de la proyeccion. |

Compatibilidad:

- Una fila anterior puede tener todas las columnas V5 en `NULL`.
- Si se informa cualquier columna V5, la fila debe satisfacer `CK_QnaSnapshotDetalle_ProyeccionV5`.
- Las dos bases de cotizacion pueden permanecer nulas dentro de una proyeccion completa.
- `TR_QnaSnapshotDetalle_V5_Completitud` impide la forma legacy cuando la cabecera declara version 5 o posterior.

Integridad:

- `UX_QnaSnapshotDetalle_EmpleadoHash` es unico y filtrado por valor no nulo.
- `UX_QnaSnapshotDetalle_CalculoDetalle` es unico y filtrado por valor no nulo.
- `FK_QnaSnapshotDetalle_SnapshotCalculoV2Detalle` debe estar habilitada y ser confiable.
- `CK_QnaSnapshotDetalle_FAT` conserva `FATD6 = FAAD6 + FAED6`.
- La correspondencia entre el detalle V2 enlazado y el `SnapshotCalculoV2Id` de cabecera se revalida transaccionalmente en el repositorio.

## Filas Auxiliares

### `liquidacion.QnaSnapshotFuenteDetalle`

Cada fila exacta de Guarderias, Transitorio, Aguinaldo, PCP, PMP e HIP se conserva sin agrupar por empleado.

Columnas V5:

| Columna | Tipo | Regla V5 |
|---|---|---|
| `EmpleadoClave` | `NVARCHAR(50) NULL` | Requerida en payload V5. |
| `Rfc` | `NVARCHAR(20) NULL` | Nulo cuando la fuente no lo acredita. |
| `Nombre` | `NVARCHAR(255) NULL` | Nombre exacto mostrado. |
| `PayloadVersion` | `SMALLINT NULL` | `1` para el primer contrato completo. |

La identidad V5 es coherente como conjunto: filas antiguas tienen las cuatro columnas nulas; filas nuevas requieren empleado, nombre y version positiva.

`TR_QnaSnapshotFuenteDetalle_V5_Completitud` exige identidad y `PayloadVersion = 1` cuando la cabecera declara version 5 o posterior.

`PayloadCanonico` contiene todos los campos mostrados por el modal del dominio. El contrato de payload version 1 se fija en la captura unica de fase 5.

### Contrato de captura V1

- Los nombres JSON usan `snake_case` y corresponden a las entidades de dominio vigentes.
- Todos los campos declarados se incluyen; `undefined` se representa como JSON `null`.
- Fechas se convierten a ISO 8601 antes de calcular hashes.
- Valores D6 y proyecciones numericas legacy se conservan simultaneamente.
- El nombre se guarda despues de decodificar y aplicar `trim`, sin textos sustitutos.
- `EmpleadoClave` es exclusivamente el `Interno` convertido a texto.
- El orden se obtiene por hash de clave, hash de payload y ordinal canonico final.
- Filas identicas conservan multiplicidad, hashes iguales y ordenes distintos.
- Una fuente sin filas queda `EMPTY`; no recibe aprobacion `NOT_APPLICABLE` automatica.

Las listas exactas de campos se mantienen en:

```text
src/modules/liquidacionQna/domain/services/QnaAuxiliaryPayloadV1.ts
```

Guarderias resuelve `titular_interno` en la misma consulta Firebird. La consulta rechaza cero o multiples coincidencias de identidad y nunca multiplica recibos mediante un join.

### Fuente HIP

La seleccion entre `AP_S_HIP_QNA` y `AP_S_COMP_QNA` no se acepta desde HTTP. Se deriva de `QNA_HIP_LEGACY_PERIODS`:

```text
QNA_HIP_LEGACY_PERIODS=1526,1626
QNA_HIP_LEGACY_PERIODS=NONE
```

Cada valor usa formato `QQAA`, con quincena entre `01` y `24`. Una configuracion ausente o invalida bloquea la captura.

El valor operativo confirmado es `QNA_HIP_LEGACY_PERIODS=1526,1626`. La captura read-only de `1526` en Desarrollo verifico la seleccion de `AP_S_COMP_QNA`.

## Multiplicidad

Una persona puede tener varias filas, incluso con la misma clave de negocio o payload:

- `UQ_QnaSnapshotFuenteDetalle_Orden` conserva un orden unico por snapshot y dominio.
- `ClaveFilaHash` identifica la clave canonica, pero no es unica.
- `IX_QnaSnapshotFuenteDetalle_Clave` permite localizar claves repetidas.
- La multiplicidad forma parte del conteo y del hash de fuente.

## Canonicalizacion y Hashes

La canonicalizacion vigente:

1. Ordena alfabeticamente las claves de objetos.
2. Conserva el orden de arreglos.
3. Representa valores D6 y A2 como cadenas con escala fija.
4. Representa ausencia verificable como JSON `null`.
5. Calcula SHA-256 sobre JSON UTF-8 y devuelve hexadecimal mayusculo.

Para filas auxiliares, `HashFila` es el hash de `PayloadCanonico`. Para una fuente, el hash incluye cada par `ClaveFilaHash` y `HashFila`; los duplicados no se eliminan.

`QnaSnapshotDetalle.HashFila` usa todos los campos de negocio de `QnaEmployeeDetail`, excepto el propio `hashFila`. Incluye orden, identidad congelada, escala, dias, origen, bases, componentes, fondos, aportaciones auxiliares y retenciones. Excluye `QnaSnapshotDetalleId`, `SnapshotCalculoV2DetalleId`, UUID y fecha de captura. La lista tipada se mantiene en `LiquidacionQna.ts` y el calculo canonico en `LiquidacionQnaContracts.ts`.

Los cuatro fondos usan hashes independientes construidos con su proyeccion canonica por empleado. `captureId` y `capturedAt` no intervienen en hashes semanticos, por lo que una recaptura con los mismos datos reutiliza los mismos snapshots y revision.

## Captura Unica En Memoria

`CaptureQnaTenDomainsQuery` consulta una vez:

- Personal activo, formula y contexto nominal compartidos por los cuatro fondos.
- Guarderias.
- Transitorio.
- Aguinaldo.
- PCP.
- PMP.
- HIP.

`QnaTenDomainCaptureFactory` copia y congela recursivamente el agregado. Despues de retornar no se permite releer ninguna fuente para construir el candidato.

El escritor V5 adquiere el lock de ambito antes de capturar y persiste Snapshot V2, su decision inicial, Snapshot QNA V5, fuentes, totales, proyecciones y payloads dentro de una transaccion SQL Server serializable. Una falla revierte el conjunto completo. Los reintentos con contenido equivalente reutilizan V2, candidato, revision y decisiones.

FAI se consulta una vez mediante `AP_S_FONDOS` durante la captura y se integra por `Interno`. Faltantes, duplicados o identidades adicionales bloquean la captura.

Una fuente `EMPTY` solo puede convertirse a `NOT_APPLICABLE` mediante aprobacion administrativa explicita por dominio, con motivo, evidencia y usuario autenticado. No existe aprobacion automatica por ausencia de filas.

La aprobacion automatica inicial del Snapshot V2 se registra una sola vez. Una aprobacion vigente bajo la politica actual se reutiliza; una decision `OBSERVADO` o una aprobacion bajo una politica desactualizada exige una nueva aprobacion explicita.

## Proyeccion de Retenciones V3

PCP, PMP e HIP se proyectan despues de seleccionar el Snapshot V5 oficial y dentro de la misma transaccion SQL Server. El procedimiento `retenciones.spProyectarRetencionesV3DesdeSnapshotV5` consume exclusivamente `QnaSnapshotFuente`, `QnaSnapshotFuenteDetalle` y `QnaSnapshotTotal`; no consulta Firebird ni acepta filas del cliente.

`retenciones.RetencionHistoricoLoteV3` registra un lote por snapshot y dominio, incluso cuando la fuente esta vacia. Cada fila V3 conserva `Interno`, nombre, payload V1, `ClaveFilaHash`, `HashFila`, fuente, escala, orden y vinculo opcional a `QnaSnapshotDetalle`. Una retencion cuyo `Interno` no pertenece al conjunto de fondos se conserva con marca huerfana.

Las claves y componentes nullable permanecen `null`. Los valores no nulos se validan contra su tipo SQL final antes de proyectar. PCP y PMP usan `total_d6`; HIP usa `cantidad_d6` como importe oficial. Los duplicados se conservan por orden y una reejecucion compara el lote completo antes de responder idempotentemente.

Los procedimientos legacy basados en TVP/body rechazan snapshots V5. Permanecen disponibles solo para `VersionEsquema < 5`.

## Dual-write y Conciliacion Legacy

La promocion V5 proyecta desde evidencia persistida hacia siete historicos de aportaciones, tres historicos de prestamos, `aportaciones.ResumenHistorico` y `conciliacion.RevisionAplicacionHistorico`. No consulta fuentes vivas. El oracle esperado se calcula directamente desde V5 y se compara contra filas legacy mediante conteos, totales normalizados, identidad, multiplicidad y hashes completos.

La politica `QNA-LEGACY-DUAL-WRITE-V1` usa normalizacion `LEGACY-PROJECTION-v1`. Cuando una tabla legacy conserva D2, cada fila V5 se normaliza antes de sumar; la diferencia frente al total A2 original se registra sin ocultarla.

V5 permanece autoritativo. Una divergencia de contenido produce `WARNING` no bloqueante y se devuelve en la respuesta de promocion. Una falla de infraestructura que deja la transaccion SQL no confirmable bloquea la promocion. Las alteraciones externas no se sobrescriben automaticamente: requieren reparacion auditada mediante el rol SQL dedicado.

Los historicos legacy usan una clave reducida. Si otro scope V5 comparte `(Org0, Org1, anio, quincena)`, conserva la primera proyeccion y registra `LEGACY_SCOPE_COLLISION`. Un reemplazo permitido del mismo scope marca la evidencia anterior `SUPERSEDED` y transfiere ownership.

Los modulos firmados y roles dedicados restringen proyeccion y reparacion para principales de privilegio minimo. En Desarrollo, `usrISSSSPEA` es `db_owner`; se acepta y reporta `DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE`, por lo que esa cuenta puede eludir controles de objeto.

## Lectura Oficial Aplicada

Fase 9 publica:

```http
GET /v1/liquidaciones-qna/aplicadas
GET /v1/liquidaciones-qna/aplicada/resumen
GET /v1/liquidaciones-qna/aplicada/detalles/:dominio
```

La evidencia se selecciona por la ultima transicion `QnaProcesoTransicion.EstadoDestino='TERMINADO'` vinculada al snapshot V5. No usa `QnaSnapshotOficialActual`, Firebird, nomina vigente ni historicos legacy como prueba de aplicacion.

Lista y detalle usan `page=1`, `pageSize=100`, maximo `500`; el detalle acepta `buscar` con coincidencia literal, sin distincion de mayusculas o acentos, y orden canonico del snapshot. Los totales A2 permanecen sin filtrar y no se recalculan desde la pagina.

Administradores pueden listar globalmente o enviar scope completo. Otros usuarios leen exclusivamente el scope completo resuelto desde su token. Warnings estructurados son visibles a todos; identificadores completos, hashes, aprobador y evidencia son auditoria administrativa. Los payloads auxiliares V1 se devuelven completos con nulls explicitos.

Fase 9 expone exclusivamente `SNAPSHOT_OFICIAL`. Snapshots V3/V4 y fallback se reservan para fase 10. Un V5 aplicado con integridad rota devuelve error; no se oculta ni reconstruye.

## Inmutabilidad

Los triggers siguientes bloquean `UPDATE` y `DELETE`:

```text
liquidacion.TR_QnaSnapshotDetalle_Inmutable
liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable
```

Una correccion crea una nueva revision; no modifica evidencia persistida.

## Migracion y Verificacion

Archivos oficiales:

```text
database/migrations/20260825_09_add_qna_official_snapshot_projections.sql
database/migrations/20260825_10_verify_qna_official_snapshot_projections.sql
database/migrations/20260826_11_strengthen_retenciones_v3_projection.sql
database/migrations/20260826_12_verify_retenciones_v3_projection.sql
database/migrations/20260826_13_add_qna_phase8_legacy_dual_write.sql
database/migrations/20260826_14_verify_qna_phase8_legacy_dual_write.sql
database/migrations/20260826_15_add_qna_phase9_applied_read_index.sql
database/migrations/20260826_16_verify_qna_phase9_applied_read_index.sql
scripts/migrate-qna-official-projections-desarrollo.ts
scripts/verify-qna-official-projections-desarrollo.ts
```

La migracion es aditiva, idempotente y no modifica filas. Su primera aplicacion se limita a Desarrollo conforme a la matriz obligatoria de bases.

La migracion V5 es requisito previo estricto para desplegar el escritor en cada ambiente. No desplegar esta version de aplicacion en Calidad o Produccion antes de aplicar y verificar `20260825_09_add_qna_official_snapshot_projections.sql` en la base correspondiente.
