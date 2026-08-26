# Plan Posterior: Gobernanza de Contexto AI y MCP para BICSN

## Estado

PLANIFICADO. NO BLOQUEA EL HISTORIAL SNAPSHOT OFICIAL.

Este plan es independiente de:

```text
docs/aplicacionQuincenal/PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
```

No debe mezclar cambios financieros, migraciones de liquidacion ni contratos de historial con configuracion AI/MCP.

## Objetivo

Reducir errores causados por:

- Perdida de contexto entre sesiones.
- Documentacion desactualizada.
- Confusion entre Calidad y Produccion.
- Lectura parcial de decisiones arquitectonicas.
- Uso de tablas legacy como si fueran fuente oficial.
- Cambios de contrato sin actualizar Swagger y frontend.
- Herramientas AI con acceso excesivo o destructivo.

## Principio Principal

Un MCP no conserva memoria conversacional por si mismo. Solo expone herramientas y recursos estructurados.

La prioridad debe ser:

```text
Fuentes de verdad
-> decisiones arquitectonicas
-> skills y guardrails
-> verificadores automaticos
-> OpenAPI
-> MCP de solo lectura
-> MCP personalizado si sigue existiendo una necesidad real
```

## Alcance

Incluye:

- Gobernanza documental.
- Fuentes de verdad por dominio.
- Skills locales.
- Plantillas de contexto para agentes.
- Verificadores read-only.
- OpenAPI como contrato vivo.
- Evaluacion de MCP local.

Excluye:

- Implementacion del historial Snapshot.
- Migraciones financieras.
- Cambios de formulas.
- Despliegues de Calidad o Produccion.
- Credenciales dentro del repositorio.

## Recursos Existentes

### Guia de agentes

```text
AGENTS.md
```

Contiene la matriz obligatoria SQL Server/Firebird y las skills del proyecto.

### Guia central AI

```text
docs/PROMPTS_AI_PATRONES_CODIGO.md
```

Contiene arquitectura, manejo de errores, contexto por capas y recomendaciones MCP.

### Skills locales

```text
.cursor/skills/bicsn-backend/SKILL.md
.cursor/skills/nodejs-backend-patterns/SKILL.md
.cursor/skills/bicsn-token-guard/SKILL.md
```

### Plantilla MCP

```text
.cursor/mcp.json.example
```

Actualmente contiene placeholders. No debe convertirse en configuracion activa con secretos versionados.

## Skills a Aplicar

### `bicsn-backend`

Obligatoria para:

- Modulos.
- Rutas.
- Commands y queries.
- Repositorios.
- Awilix.
- Registro de rutas.

### `nodejs-backend-patterns`

Para:

- Fastify.
- Seguridad HTTP.
- Manejo de errores.
- Paginacion y limites.
- Contratos Swagger.

### `bicsn-token-guard`

Para:

- Cargar contexto minimo.
- Buscar antes de leer archivos grandes.
- Evitar cambios en modulos no relacionados.
- Reducir riesgo de tocar ambientes incorrectos.

### `documentation-writer`

Para separar documentos por proposito:

- Plan de implementacion.
- Referencia del modelo.
- Guia operativa.
- Explicacion arquitectonica.

### `architecture-decision-records`

Para decisiones permanentes como:

- Fuente oficial de historial.
- Estrategia dual-write.
- Politica de fallback.
- Saga SQL Server/Firebird.

Una decision aceptada no debe reescribirse para cambiar el pasado; debe ser sustituida por otra decision.

### `mcp-builder`

Usar solamente si se aprueba construir un MCP personalizado despues de completar las fases documentales y de verificacion.

## Fuentes de Verdad Propuestas

Crear un indice:

```text
docs/FUENTES_DE_VERDAD.md
```

Debe mapear cada tema a un unico documento principal:

| Tema | Fuente principal esperada |
|---|---|
| Ambientes | `DATABASE_ENVIRONMENTS.md` |
| Matriz reutilizable | `src/config/databaseEnvironments.ts` |
| Historial Snapshot | `PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md` durante implementacion; ADR y referencia al terminar |
| Modelo Snapshot | `REFERENCIA_MODELO_SNAPSHOT_QNA_OFICIAL.md` |
| Flujo QNA | `FLUJO_TRANSACCIONAL_APLICACION_QNA.md` |
| Quinquenios | `REGLA_QUINQUENIOS_PRESTACIONES_NOMINA.md` |
| Contrato HTTP | `/docs/json` y schemas versionados |
| Liberacion | checklist operativo por crear |

Los documentos secundarios deben enlazar a la fuente principal y no copiar reglas que puedan divergir.

## Paquete Minimo de Contexto por Tipo de Tarea

### Cambio de modulo

```text
AGENTS.md
package.json
SKILL del modulo
archivo objetivo
ruta o schema relacionado
repositorio o command relacionado
```

### Migracion

```text
AGENTS.md
DATABASE_ENVIRONMENTS.md
src/config/databaseEnvironments.ts
migracion anterior relacionada
verificador relacionado
plan/ADR del dominio
```

### Liberacion

```text
AGENTS.md
package.json
subir.bat
empaquetador del ambiente
template de deploy
preflight y postmigration
estado Git
```

### Historial Snapshot

```text
PLAN_BACK_HISTORIAL_SNAPSHOT_OFICIAL.md
DECISION_HISTORIAL_SNAPSHOT_OFICIAL.md
REFERENCIA_MODELO_SNAPSHOT_QNA_OFICIAL.md
FLUJO_TRANSACCIONAL_APLICACION_QNA.md
schemas y rutas liquidacionQna
migraciones Snapshot relevantes
```

## Verificaciones Automaticas Propuestas

### Enlaces documentales

Crear un verificador que falle cuando:

- Un archivo enlazado no existe.
- Una fuente de verdad no esta indexada.
- Dos documentos se declaran simultaneamente fuente principal del mismo tema.

### Estado de planes

Validar que planes activos contengan:

- Estado.
- Fases.
- Criterios de aceptacion.
- Bitacora.
- Fecha.
- Evidencia o motivo de bloqueo.

### Contrato HTTP

Comparar:

- Swagger/OpenAPI.
- Schemas Zod.
- Documento de entrega frontend.
- Ejemplos de respuesta.

### Ambientes

Reutilizar y fortalecer:

```bash
npm run verify:database:environments
```

Los verificadores de base deben ser de solo lectura por defecto.

### Migraciones

Cada migracion debe tener:

- Destino explicito.
- Confirmacion para ejecucion.
- Modo dry-run cuando aplique.
- Verificador posterior.
- Conteos antes/despues cuando corresponda.

## MCP Recomendados Inicialmente

### Filesystem

Solo lectura/escritura acotada al workspace segun la tarea. No permitir acceso al resto del equipo.

### OpenAPI

Solo lectura contra:

```text
http://localhost:4000/docs/json
```

Debe usarse para inspeccionar contratos, no para asumir reglas financieras no documentadas.

### Git

Solo lectura por defecto para estado, diff e historial. Commit/push requieren solicitud explicita.

### SQL Server read-only

Requisitos:

- Usuario dedicado de solo lectura.
- Base explicita.
- Timeout.
- Limite de filas.
- Registro de consultas.
- Sin comandos DDL/DML.

### Firebird read-only

Mismos requisitos, respetando la pareja autorizada del ambiente.

## Evaluacion de un MCP Personalizado `bicsn-context`

No construir en la primera fase.

Evaluar despues si los documentos, skills y verificadores no son suficientes.

Recursos candidatos:

```text
project://architecture
project://database-environments
project://sources-of-truth
project://qna-snapshot-plan
project://qna-snapshot-decision
project://qna-snapshot-schema
project://release-checklist
```

Herramientas candidatas de solo lectura:

```text
bicsn_get_module_context
bicsn_get_database_environment
bicsn_get_endpoint_contract
bicsn_get_active_plan
bicsn_validate_document_links
bicsn_run_readonly_preflight
```

No incluir herramientas de migracion, recuperacion, deploy o escritura en la primera version.

## Seguridad MCP

- Secretos exclusivamente en variables de entorno o almacen seguro.
- No versionar `mcp.json` con credenciales.
- No usar las credenciales actuales de despliegue para MCP.
- Bases de datos con usuarios read-only dedicados.
- Limitar workspace y comandos.
- Marcar herramientas con anotaciones read-only/destructive apropiadas.
- Paginar y limitar respuestas para no cargar tablas completas.
- Registrar ambiente y base en cada salida.
- Rechazar parejas SQL Server/Firebird fuera de matriz.

## Evaluaciones para Agentes

Crear casos verificables que comprueben que otro agente puede responder correctamente:

1. Cual es la pareja de Calidad.
2. Cual es la pareja de Produccion.
3. Que tabla prueba que una QNA termino.
4. Diferencia entre SnapshotCalculoV2 y QnaSnapshot.
5. Cual es la fuente oficial para QNA nuevas.
6. Cuando se usa `HISTORICO_LEGACY`.
7. Que documentos deben actualizarse al cambiar el contrato.
8. Que comandos son read-only antes de liberar.
9. Que archivos no deben usarse como entrypoint.
10. Como detectar una carga TXT sustituida.

Las respuestas deben derivarse de recursos estables, no del estado cambiante de una conversacion.

## Fases

| Fase | Objetivo | Estado |
|---:|---|---|
| 1 | Crear indice de fuentes de verdad | PENDIENTE |
| 2 | Crear ADR y referencias faltantes | PENDIENTE |
| 3 | Revisar y depurar documentos duplicados | PENDIENTE |
| 4 | Crear verificadores de enlaces y planes | PENDIENTE |
| 5 | Validar OpenAPI contra entregas frontend | PENDIENTE |
| 6 | Probar MCP existentes en modo read-only | PENDIENTE |
| 7 | Crear evaluaciones de contexto | PENDIENTE |
| 8 | Decidir si se necesita `bicsn-context` | PENDIENTE |
| 9 | Si se aprueba, implementar MCP TypeScript local | PENDIENTE |
| 10 | Auditar permisos, secretos y resultados | PENDIENTE |

## Criterios para Aprobar un MCP Personalizado

- Problema no resuelto por documentos/skills/verificadores.
- Recursos y herramientas claramente definidos.
- Beneficio medible en evaluaciones.
- Sin secretos versionados.
- Read-only por defecto.
- Ambientes protegidos por matriz.
- Respuestas paginadas y acotadas.
- Pruebas con MCP Inspector.
- Diez evaluaciones independientes y verificables.
- Mantenimiento asignado.

## Criterios de Aceptacion del Plan

- Existe un indice unico de fuentes de verdad.
- Los planes activos tienen bitacora y evidencia.
- Las decisiones permanentes estan en ADR.
- Los contratos HTTP coinciden con OpenAPI.
- Los agentes reciben contexto minimo reproducible.
- Las herramientas de base son read-only.
- No hay credenciales en configuracion versionada.
- Las evaluaciones detectan confusion de ambientes y tablas.
- La decision de crear o no MCP personalizado queda documentada.

## Bitacora

| Fecha | Estado | Cambio | Evidencia | Notas |
|---|---|---|---|---|
| 2026-08-21 | PLANIFICADO | Plan separado creado | Revision de skills, guia AI y plantilla MCP | No bloquea trabajo financiero |

Actualizar esta bitacora solamente cuando se trabaje especificamente en gobernanza AI/MCP.
