# Entrega Frontend: Historial de la QNA Aplicada desde Snapshot Oficial

## Estado

IMPLEMENTADO PARA VALIDACION EN DESARROLLO. LIBERACION BLOQUEADA POR AUSENCIA DE EVIDENCIA V5 REAL EN CALIDAD.

El contrato, los endpoints de lectura y la saga recuperable estan estables. El frontend Entidad consume ya lista, resumen y detalle oficiales como piloto de Desarrollo. Esta implementacion no autoriza publicacion en Calidad ni Produccion hasta validar una QNA V5 real `TERMINADO` con `QnaSnapshotDetalle` poblado.

La validacion V5 de Calidad se realizara exclusivamente con Q16 de 2026 para el scope `04/24/01/01`, una vez completada por el flujo normal del sistema. No se usaran ni reprocesaran quincenas anteriores y no se fabricara evidencia para desbloquear frontend.

Fuente de seguimiento backend:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

## Objetivo

Actualizar `/dependencia/aportaciones-proceso-verificacion` para mostrar la evidencia congelada al confirmar y terminar la aplicacion de una QNA, sin consultar fuentes vivas ni recalcular importes oficiales.

## Decisiones Recibidas del Backend

- El historial oficial cubrira los diez dominios de la pantalla.
- La captura se congelara al confirmar `Aplicar`.
- El nombre sera el mostrado por el calculo al congelar.
- Los seis dominios auxiliares conservaran cada fila exacta.
- La QNA consultable debe tener transicion `TERMINADO`.
- Los periodos antiguos utilizaran `HISTORICO_LEGACY` identificado.
- Los importes D6 y A2 se entregaran como string.
- Los totales oficiales no dependen de las filas visibles ni de la pagina actual.
- Las organicas de usuarios entidad se resolveran en backend desde el token.

## Endpoints Esperados

### Periodos aplicados

```http
GET /v1/liquidaciones-qna/aplicadas?page=1&pageSize=100
```

### Resumen

```http
GET /v1/liquidaciones-qna/aplicada/resumen?anio=2026&quincena=15
```

### Detalle por dominio

```http
GET /v1/liquidaciones-qna/aplicada/detalles/:dominio?anio=2026&quincena=15&page=1&pageSize=100&buscar=texto
```

Parametros:

```text
anio
quincena
page
pageSize
buscar
```

`pageSize` usa `100` por defecto y admite hasta `500`. `buscar` es substring literal, case-insensitive y accent-insensitive; `%`, `_` y `[` no funcionan como wildcard. No existe orden configurable: las filas conservan el orden canonico persistido. `:dominio` acepta mayusculas o minusculas y responde con el discriminante canonico en mayusculas.

Administradores pueden listar todos los scopes. Para resumen o detalle pueden enviar `entidadId` y las cuatro organicas; sin scope, multiples coincidencias para el mismo periodo devuelven `409`. Usuarios ordinarios no eligen dependencia: backend resuelve su scope completo desde el token.

Dominios:

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

## Contrato de Fuente

El schema frontend debe ser una union discriminada por:

```text
SNAPSHOT_OFICIAL
SNAPSHOT_OFICIAL_RECONSTRUIDO
HISTORICO_LEGACY
```

### Snapshot oficial

Debe exigir:

- `liquidacionSnapshotId`.
- `snapshotCalculoV2Id`.
- `nominaCargaId`.
- `formulaCalculoVersionId`.
- `precisionPolicy`.
- `revision`.
- `hashContenido`.
- Fecha de creacion.
- Organicas efectivas.
- Fecha de aplicacion tomada de la transicion `TERMINADO`.
- `warnings` estructurados.
- `reconstructionStrategy: null`.

El detalle auxiliar devuelve `payloadCanonico` V1 completo. Hashes, identificador de fuente completo, aprobador y evidencia son exclusivos de respuestas administrativas. Importes e IDs permanecen strings; los totales del resumen no dependen de `buscar` ni de la pagina.

### Snapshot reconstruido

Usa `reconstructionStrategy: SNAPSHOT_V3_V4_PERSISTED_V2_FUNDS`. `snapshotCalculoV2Id`, `nominaCargaId` y `formulaCalculoVersionId` pueden ser `null`. Cuando existe V2, los cuatro fondos provienen de su detalle persistido y validado; sin V2, el backend entrega los fondos no disponibles y `QNA_RECONSTRUIDA_FONDOS_SIN_V2`. Identidad, RFC, nombre, interno y otros campos no acreditados pueden ser `null`. Detalles V3/V4 no validados no enriquecen la respuesta. La UI debe mostrar `advertencias` y no completar nulls desde fuentes actuales.

Una cabecera V4 historica cuyo contenido coincide exactamente con su hash canonico V3 se acepta sin modificar datos y publica `QNA_RECONSTRUIDA_HASH_CANONICO_V3`. Cualquier otra divergencia de hash conserva el bloqueo de integridad.

### Historico legacy

Usa `reconstructionStrategy: LEGACY_EXACT_FULL_SCOPE`. Debe permitir IDs nulos, payload nullable y campos no verificables nulos. La advertencia `LEGACY_REDUCED_ROWS_UNLINKED` indica que las filas historicas usan clave reducida y no tienen enlace de lote al evento `TERMINADO`.

Una fuente legacy sin filas usa estado `ABSENT_UNVERIFIED`, estrategia de total `UNAVAILABLE` y total `null`, aunque exista un agregado historico. El backend informa `QNA_LEGACY_ABSENT_UNVERIFIED` y, cuando aplica, `QNA_LEGACY_AGREGADO_SIN_DETALLE_IGNORADO`. No interpretar ausencia como cero, conjunto vacio verificado ni `NOT_APPLICABLE`.

El resumen incluye objetos paralelos `totales` y `totalStrategies`; el detalle incluye `totalDominioA2` y `totalStrategy`. Las estrategias son `PERSISTED`, `PERSISTED_CAIR_CONTROL_FALLBACK`, `DERIVED_DETAIL` o `UNAVAILABLE`. La UI muestra el valor recibido y su procedencia; no deriva un total cuando backend entrega `null`.

## Reglas Monetarias

- D6: string con exactamente seis decimales.
- A2: string con exactamente dos decimales.
- No convertir importes oficiales a `number` para sumar, comparar o redondear.
- No usar `Math.round`, `toFixed` ni `Number.EPSILON` para decisiones monetarias.
- Mostrar totales recibidos del resumen backend.
- No sumar filas paginadas para obtener totales oficiales.
- Mantener D6 en modelos y exportaciones aunque la UI muestre A2.

## Estado Actual que Debe Sustituirse

El frontend actual:

- Consume historicos legacy.
- Une arreglos y aplica respaldos locales.
- Convierte dinero a `number`.
- Puede derivar sueldo y quinquenio dividiendo valores mensuales.
- Recalcula totales desde filas.
- No soporta paginacion ni busqueda server-side.
- No muestra fuente, IDs y advertencias.
- Lee periodo desde `localStorage` en el widget.
- Bloquea el detalle cuando el monto es cero.

El contrato oficial no debe reutilizar superficialmente `AportacionUnificada`. Debe tener tipos y schemas propios.

## Archivos Frontend Previstos

```text
src/entities/liquidacion-qna-aplicada/liquidacion-qna-aplicada.types.ts
src/services/liquidacion-qna-aplicada/liquidacion-qna-aplicada.api.ts
src/features/liquidacion-qna-aplicada/useLiquidacionQnaAplicada.ts
src/widgets/liquidacion-qna-aplicada/LiquidacionQnaAplicadaWidget.tsx
src/widgets/aportaciones-proceso-verificacion/resumen-proceso-aportaciones-verificacion.tsx
src/widgets/retenciones-cobrar-verificacion/resumen-retenciones-cobrar-verificacion.tsx
src/app/dependencia/aportaciones-proceso-verificacion/page.tsx
src/app/dependencia/retenciones-cobrar-verificacion/page.tsx
```

No revertir cambios ajenos en `.gitignore`, `architecture/` u otros archivos no relacionados.

## Fases Frontend

### Fase 1: Contrato tipado

- Crear schemas Zod oficiales.
- Validar D6 y A2 como string.
- Definir union discriminada por fuente.
- Definir nullability legacy.
- Tipar metadata, totales, advertencias y paginacion.
- Rechazar respuestas que incumplan contrato.

### Fase 2: Servicio

- Usar el cliente HTTP centralizado.
- Consultar periodos, resumen y detalle.
- No enviar organicas para usuario entidad.
- Propagar `status`, `code` y `message` del backend.
- No consultar directamente nomina o historicos para enriquecer.
- No recalcular aportaciones.

### Fase 3: Estado y periodo

- Usar el hook de periodo, no `localStorage` a nivel de modulo.
- No consultar hasta tener un periodo valido.
- Mantener estado de `page`, `pageSize` y `buscar`.
- Reiniciar pagina al cambiar periodo, dominio o busqueda.
- Descartar respuestas obsoletas.
- Mantener metadata y totales independientes del detalle paginado.

### Fase 4: UI

- Mostrar fuente y advertencias.
- Mostrar periodo, IDs, formula, carga y politica.
- Mostrar dias y origen en los cuatro fondos.
- Mostrar sueldo quincenal desde `BaseCotizacionSueldoD6`.
- Mostrar quinquenio quincenal desde `BaseCotizacionQuinqueniosD6`.
- Permitir abrir detalles con monto cero cuando existan filas.
- Usar `pagination.total`, no `detalles.length`, como total global.
- Mantener desplazamiento horizontal y encabezado fijo.

### Fase 5: Dominios auxiliares

- Renderizar cada fila exacta de Guarderias, Transitorio, Aguinaldo, PCP, PMP e HIP.
- No agrupar automaticamente por empleado.
- Conservar identificadores de prestamo, recibo o concepto.

### Fase 6: Exportacion

- Definir si exporta pagina, resultado filtrado o conjunto completo.
- Preferir endpoint backend para exportar el conjunto completo.
- No dejar botones habilitados sin accion.
- Mantener CSV/PDF/TXT alineados con contrato y metadata.

### Fase 7: Responsive y accesibilidad

- Validar 320 px, 768 px y desktop.
- No ocultar dias, origen o advertencias.
- Mantener foco, etiquetas y navegacion de paginacion.

### Fase 8: Pruebas

- Oficial, reconstruido y legacy.
- Quince, parciales y cero dias.
- Detalle existente con total cero.
- Multiples filas por empleado.
- Paginacion, busqueda y cambios rapidos de periodo.
- 401, 403, 404 y error de contrato.
- Totales que no cambian entre paginas.
- Vista movil.

## Columnas Minimas de los Cuatro Fondos

### Ahorro

```text
Interno
Nombre
Sueldo Quincenal
Dias Laborados
Origen
Aportacion Entidad
Aportacion Afiliado
Total
```

### Vivienda

```text
Interno
Nombre
Sueldo Quincenal
Dias Laborados
Origen
Aportacion Vivienda
```

### Prestaciones

```text
Interno
Nombre
Sueldo Quincenal
Quinquenio Quincenal
Dias Laborados
Origen
Aportacion Entidad
Aportacion Afiliado
Total
```

### CAIR

```text
Interno
Nombre
Sueldo Quincenal
Dias Laborados
Origen
Aportacion CAIR
```

No duplicar una columna `Total` cuando el unico componente ya representa el total del fondo.

## Validacion Esperada

```bash
npx prettier --check <archivos>
npx eslint <archivos>
npm run typecheck
npm run build
git diff --check
git diff --cached --check
```

Agregar pruebas automatizadas para schema, servicio, hook y UI antes de marcar la entrega como completada.

## Criterios para Desbloquear Frontend

- Migracion backend aplicada en Calidad.
- `QnaSnapshotDetalle` poblado.
- Payloads auxiliares completos y versionados.
- Endpoint de periodos disponible.
- Endpoint de resumen disponible.
- Endpoint por dominio disponible.
- Contrato Swagger estable.
- Union discriminada y nullability documentadas.
- Totales y paginacion definidos.
- Saga, recuperacion e idempotencia de fase 11 aprobadas.
- Pruebas backend aprobadas.
- Evidencia de una QNA de Calidad consultable sin fuentes vivas.

## Criterios de Aceptacion

- No aparece sueldo mensual como sueldo quincenal.
- Sueldo y quinquenio vienen del snapshot aplicado.
- Dias y origen estan visibles.
- Dinero oficial se conserva como string.
- Totales coinciden con backend y no con una suma local.
- La fuente historica se identifica.
- Los periodos legacy muestran advertencia.
- Se pueden consultar filas con monto cero.
- Paginacion y busqueda no alteran totales.
- TypeScript, lint, build y pruebas pasan.

## Bitacora Frontend

| Fecha | Estado | Commit | Cambio | Pruebas | Notas |
|---|---|---|---|---|---|
| 2026-08-21 | BLOQUEADO | - | Contrato esperado actualizado despues de tercera revision backend | - | Esperar endpoints y Swagger estables |
| 2026-08-26 | BLOQUEADO_CALIDAD | `0f97dce`, `0282e74` | Contrato backend discriminado estabilizado en Desarrollo para V5, V3/V4 y legacy | Contratos, HTTP, integraciones rollback, verificador y planes aprobados | Esperar fases backend 11 y 12; no crear adaptadores temporales |
| 2026-08-27 | BLOQUEADO_CALIDAD | `ff40203`, `c666210` | Saga, recuperacion, idempotencia, Linea y resolucion administrativa estabilizadas en Desarrollo | Firebird fake, HTTP, migracion, SQL rollback, verificador, plan y regresiones aprobados | Esperar validacion integral de fase 12 en Calidad |
| 2026-08-27 | BLOQUEADO_V5_CALIDAD | Pendiente | Lista, resumen y detalle reconstruido validados en Calidad; compatibilidad acotada de hash V3 historico para cabecera V4 | `QNA_PHASE12_APPLIED_INTEGRITY_READONLY_OK`; `QNA_PHASE12_CALIDAD_HTTP_READONLY_OK`; 167 filas y paginacion estable | Falta una QNA V5 real `TERMINADO`; no fabricar ni reprocesar evidencia |
| 2026-08-27 | ESPERA_Q16_CALIDAD | Pendiente | Q16 2026 `04/24/01/01` definida como unica evidencia V5 valida para cerrar fase 12 | Decision operativa documentada; quincenas anteriores excluidas | Esperar que Q16 termine mediante el sistema y ejecutar validacion read-only |
| 2026-08-29 | EN_VALIDACION_DESARROLLO | Frontend `d9d050f` | Aportaciones y retenciones migradas a lista, resumen y detalle oficiales; contratos Zod compartidos, strings monetarios, paginacion, busqueda abortable y exportaciones deshabilitadas | `npm run typecheck`, `npm run lint` y `npm run build` aprobados; 33 paginas generadas | Ejecutar smoke autenticado en Desarrollo; no publicar en Calidad |

Actualizar esta tabla al completar cada fase. No iniciar adaptadores temporales contra contratos backend no estabilizados.
