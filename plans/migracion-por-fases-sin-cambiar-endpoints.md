# Plan de migracion por fases para BICSN

## Restricciones base

- no cambiar endpoints existentes
- no cambiar prefijos o versionado
- no optimizar comportamiento ni performance dentro de la migracion
- no mezclar reglas del negocio con migracion estructural
- las reglas deben documentarse y gestionarse aparte
- cada fase debe poder ejecutarse y validarse por separado

## Objetivo

Migrar el proyecto por partes hacia una estructura mas mantenible y consistente, sin alterar contratos HTTP existentes, sin tocar rutas publicas y sin mezclar la migracion con cambios funcionales u optimizaciones.

## Principios de trabajo

1. Los endpoints actuales son contrato congelado.
2. La migracion es interna: estructura, consistencia, DI, capas y documentacion.
3. Las reglas del negocio no se reinterpretan durante la migracion.
4. Toda regla especial debe quedar separada de la migracion y documentada como conocimiento de dominio.
5. Cada fase debe terminar con validacion local antes de iniciar la siguiente.

## Fuera de alcance

- cambiar nombres de endpoints
- cambiar rutas publicas
- cambiar shape de respuestas
- cambiar codigos HTTP sin aprobacion explicita
- optimizar queries o stored procedures
- reescribir reglas de negocio existentes
- hacer un refactor global del proyecto en una sola entrega

## Linea base actual

### Fortalezas actuales

- arquitectura base solida: Fastify + TypeScript + CQRS + Awilix
- registro central de rutas y DI
- documentacion tecnica ya existente
- Swagger disponible
- modulos complejos ya identificados

### Riesgos actuales

- `src/di/container.ts` muy centralizado
- `src/app/routeRegistrar.ts` muy centralizado
- conviven modulos CQRS y modulos legacy
- Firebird agrega complejidad de contratos y serializacion
- parte del conocimiento esta distribuido entre codigo y docs

## Regla transversal: manejo separado de reglas

Las reglas del negocio no deben quedar enterradas en el plan de migracion.

Usar como base:

- `docs/reglas/README.md`
- `plans/checklist-migracion-por-modulo.md`

Las reglas deben vivir aparte para que puedan consultarse, validarse y mantenerse sin contaminar los planes de ejecucion.

## Fase 0: Preparacion y congelamiento de contrato

### Objetivo

Definir la base segura para migrar sin romper endpoints.

### Tareas

- inventariar endpoints actuales publicados en Swagger
- confirmar que `/docs` y `/docs/json` son la referencia viva del contrato
- identificar modulos legacy y modulos ya migrados a CQRS
- identificar archivos monoliticos criticos:
  - `src/di/container.ts`
  - `src/app/routeRegistrar.ts`
  - `src/server.ts`
- definir checklist de migracion por modulo

### Entregables

- inventario de modulos por estado
- checklist de migracion
- criterio de endpoint no cambiado

### Criterio de salida

- existe una lista clara de que puede cambiar internamente y que no puede cambiar externamente

## Fase 1: Documentacion estructural y reglas separadas

### Objetivo

Separar documentacion de arquitectura, migracion y reglas de negocio.

### Tareas

- consolidar guia de migracion por modulo
- separar reglas tecnicas de reglas de negocio
- separar reglas de integracion Firebird y SQL Server
- mantener una sola fuente de verdad por tema
- eliminar solo documentacion redundante real, no documentacion util

### Entregables

- mapa de documentacion
- estructura de reglas separada
- guia de migracion por modulo

### Riesgo

- bajo

### Criterio de salida

- ya no hay mezcla entre como migrar y como funciona el negocio

## Fase 2: Estandarizacion del flujo de cambio por modulo

### Objetivo

Hacer que cualquier migracion siga siempre el mismo patron.

### Tareas

- definir plantilla de modulo objetivo:
  - `domain/`
  - `application/`
  - `infrastructure/`
  - `*.routes.ts`
  - `*.schemas.ts`
- definir naming estandar para:
  - repositories
  - commands
  - queries
  - error handlers
- definir checklist fijo por modulo:
  - ruta
  - schema
  - command/query
  - repositorio
  - DI
  - Swagger
  - auth
- definir plantilla de revision antes y despues de migrar

### Entregables

- plantilla de modulo
- checklist operativo
- plantilla de validacion

### Riesgo

- bajo

### Criterio de salida

- cada modulo se puede migrar con el mismo proceso repetible

## Fase 3: Modularizacion documental de DI y rutas

### Objetivo

Reducir el riesgo operativo sin cambiar endpoints.

### Tareas

- diseñar particion logica de `container.ts` por dominio o modulo
- diseñar particion logica de `routeRegistrar.ts` por grupos funcionales
- mantener un ensamblador central, pero no toda la definicion en un solo archivo
- definir orden de carga y responsabilidad por registro

### Nota

En esta fase se diseña y documenta la particion. La implementacion debe hacerse por partes y con validacion por grupo.

### Entregables

- mapa de particion de DI
- mapa de particion de rutas
- plan de ensamblaje central

### Riesgo

- medio

### Criterio de salida

- existe un diseño claro para dividir archivos centrales sin afectar contratos

## Fase 4: Migracion de modulos legacy pequenos o medianos

### Objetivo

Migrar primero modulos legacy de menor riesgo.

### Orden sugerido

1. `organica1/`
2. `organica2/`
3. `organica3/`

### Estado actual

- `organica0` completado
- `organica1` completado
- `organica2` completado
- `organica3` completado
- `organicaCascade` completado
- `personal` completado
- `orgPersonal` completado
- `proceso` completado
- `menu` completado
- `modulo` completado
- `role` completado
- `roleMenu` completado
- `userRole` completado
- `usuarios` completado
- `movimiento` completado
- `tipoMovimiento` completado
- `municipios` completado
- `estados` completado
- `calles` completado
- `colonias` completado
- `codigosPostales` completado
- `categoriaPuestoOrg` completado
- `auditLog` completado
- `info` completado
- `log` completado
- `eventoCalendario` completado
- `afiliadoOrg` completado
- `afiliadosPersonal` completado
- `expediente` completado
- `auth` completado
- `afectacionOrg` completado

### Tareas por modulo

- identificar dependencias reales
- crear interfaces de dominio si faltan
- mover logica a repositorios consistentes
- crear queries y commands sin cambiar rutas
- actualizar resolucion por DI
- mantener schemas y respuestas
- eliminar dependencia de services legacy solo cuando el modulo ya este estable

### Regla critica

La ruta publica y el contrato HTTP deben quedar iguales.

### Entregables

- modulo migrado a CQRS sin cambio de endpoint
- validacion funcional por modulo

### Avance registrado

- familia `organica0/organica1/organica2/organica3` completada sin cambios de endpoint
- `organicaCascade` completado sin cambios de endpoint
- `personal` completado sin cambios de endpoint
- `orgPersonal` completado sin cambios de endpoint
- bloque administrativo `proceso/menu/modulo/role/roleMenu/userRole/usuarios` completado sin cambios de endpoint
- bloque `movimiento/tipoMovimiento/municipios/estados` completado sin cambios de endpoint
- bloque `calles/colonias/codigosPostales/categoriaPuestoOrg` completado sin cambios de endpoint
- bloque `auditLog/info/log/eventoCalendario` completado sin cambios de endpoint
- `afiliadoOrg` y `afiliadosPersonal` completados sin cambios de endpoint
- `expediente` completado sin cambios de endpoint; utilidades FTP quedan en infraestructura sin repo/service legacy en raiz
- `auth` completado sin cambios de endpoint; `AuthTokenService` vive en infraestructura y `auth.repo.ts` queda como shim compatible
- `afectacionOrg` completado sin cambios de endpoint; servicio Firebird acotado queda en infraestructura
- `afiliado.service.ts` extraido desde raiz a `infrastructure/services/AfiliadoService.ts`; queda pendiente retirar `afiliado.repo.ts`
- bloque status/control de `afiliado.repo.ts` extraido a `infrastructure/services/AfiliadoStatusService.ts` con exports compatibles en repo raiz
- funciones especificas de aprobacion/cambio de estado de `afiliado.repo.ts` delegadas a `AfiliadoStatusService`
- funciones acotadas BDIsspea/BitacoraAfectacionOrg de `afiliado.repo.ts` delegadas a `infrastructure/services/AfiliadoBdiSspeaService.ts`
- wrappers Firebird de aplicacion QNA/BDIsspea delegados a `infrastructure/services/AfiliadoBdiSspeaFirebirdService.ts`
- `aplicarBDIsspea` individual delegado a `AfiliadoBdiSspeaService`; queda pendiente el lote masivo
- FASE 1 de `aplicarBDIsspeaLote` delegada parcialmente a `infrastructure/services/AfiliadoBdiSspeaLoteService.ts` para consulta de afiliados elegibles
- actualizacion transaccional inmediata por afiliado dentro de `aplicarBDIsspeaLote` delegada a `AfiliadoBdiSspeaLoteService`
- actualizacion final de `BitacoraAfectacionOrg` en FASE 3 de `aplicarBDIsspeaLote` delegada a `AfiliadoBdiSspeaLoteService`
- rutas de `afiliado` ya no importan dinamicamente `afiliado.repo.ts`; consumen servicios de infraestructura directos
- `getQuincenaAplicacion` delegado a `infrastructure/services/AfiliadoQuincenaService.ts` y comandos QNA/bitacora actualizados para no depender del repo legacy
- `FirebirdMovimientoService` ya no depende de `afiliado.repo.ts`; usa `AfiliadoPersistenceService`
- CRUD base usado por `AfiliadoService` delegado a `AfiliadoPersistenceService`; queda pendiente mover la creacion transaccional compuesta `createAfiliadoAfiliadoOrgMovimiento`
- creacion transaccional compuesta delegada a `AfiliadoCompositeCreationService`
- `aplicarBDIsspeaLote` delegado a `AfiliadoBdiSspeaLoteService`; `AfiliadoRepository` ya no importa `afiliado.repo.ts`
- no quedan imports a `afiliado.repo.js` bajo `src/**/*.ts`
- `afiliado.repo.ts` queda retenido como shim temporal deprecated por decision explicita; no usar en codigo nuevo
- compilacion validada despues de cada migracion con `npm run build`

### Riesgo

- medio

### Criterio de salida

- el modulo ya no depende del service legacy para operar

## Fase 5: Migracion de modulos legacy sensibles

### Objetivo

Migrar modulos con mayor acoplamiento o reglas mas delicadas.

### Orden sugerido

1. `afectacionOrg/`
2. piezas legacy de `afiliado/` relacionadas con Firebird
3. servicios Firebird especializados que hoy mezclan logica tecnica y funcional

### Tareas

- mapear reglas antes de tocar codigo
- documentar procedimientos almacenados involucrados
- separar acceso a datos de la regla operativa
- conservar contratos y secuencias funcionales actuales
- validar errores y serializacion

### Riesgo

- alto

### Criterio de salida

- la logica queda mas clara internamente sin cambiar comportamiento externo

## Fase 6: Consolidacion de integraciones Firebird y SQL Server

### Objetivo

Ordenar la capa de integracion sin optimizar ni reescribir logica de negocio.

### Tareas

- catalogar por modulo que usa Firebird y que usa SQL Server
- separar helpers tecnicos de reglas funcionales
- unificar criterios de timeout, decoding y serializacion
- documentar SPs y su uso real por modulo
- dejar wrappers tecnicos consistentes para nuevo codigo

### No hacer en esta fase

- optimizacion de queries
- rediseño de stored procedures
- cambios de semantica

### Riesgo

- alto

### Criterio de salida

- integraciones mas consistentes y mejor documentadas, sin cambios de contrato

## Fase 7: Verificacion de contratos y endurecimiento

### Objetivo

Asegurar que la migracion no rompio la API.

### Tareas

- validar rutas publicadas en Swagger
- comparar respuestas criticas antes y despues
- revisar codigos HTTP por endpoint sensible
- validar auth, cookies y headers en rutas protegidas
- revisar serializacion en endpoints Firebird sensibles

### Entregables

- matriz de verificacion por modulo
- evidencia de no cambio de endpoints

### Riesgo

- medio

### Criterio de salida

- cada fase migrada tiene evidencia de compatibilidad

## Fase 8: Limpieza final controlada

### Objetivo

Cerrar la migracion sin dejar deuda estructural innecesaria.

### Tareas

- retirar services legacy ya reemplazados
- retirar registros DI obsoletos
- retirar referencias documentales viejas
- actualizar arquitectura real del repo
- mantener historial de decisiones

### Riesgo

- medio

### Criterio de salida

- ya no quedan piezas legacy que estorben la operacion diaria

## Orden recomendado de ejecucion

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6
8. Fase 7
9. Fase 8

## Prioridad real por impacto y riesgo

### Alta prioridad

- Fase 0
- Fase 1
- Fase 2

### Media prioridad

- Fase 3
- Fase 4
- Fase 7

### Alta complejidad

- Fase 5
- Fase 6
- Fase 8

## Criterios de aceptacion global

- ningun endpoint cambia
- ningun path cambia
- ningun prefijo cambia
- ningun contrato publicado en Swagger cambia sin aprobacion explicita
- la migracion no mezcla optimizacion
- las reglas del negocio quedan separadas y documentadas aparte
- cada modulo migrado puede verificarse de forma aislada

## Primer bloque recomendado para arrancar

### Bloque 1

- Fase 0
- Fase 1
- Fase 2

### Resultado esperado del bloque 1

- base documental limpia
- reglas separadas
- checklist claro
- plantilla de migracion estable
- cero riesgo de cambio de endpoint

### Resultado real acumulado hasta ahora

- base documental AI/MCP consolidada
- reglas sensibles de `afectacionOrg` y `afiliado` documentadas
- plantilla de modulo objetivo creada
- inventario inicial de modulos creado
- `organica0`, `organica1`, `organica2` y `organica3` migrados a CQRS real
- `organicaCascade` migrado a CQRS real
- `personal` y `orgPersonal` migrados a CQRS real
- bloque administrativo `proceso/menu/modulo/role/roleMenu/userRole/usuarios` migrado a CQRS real
- bloque `movimiento/tipoMovimiento/municipios/estados` migrado a CQRS real
- bloque `calles/colonias/codigosPostales/categoriaPuestoOrg` migrado a CQRS real
- bloque `auditLog/info/log/eventoCalendario` migrado a CQRS real
- `afiliadoOrg` y `afiliadosPersonal` migrados a CQRS real
- `expediente` migrado a CQRS real
- `auth` migrado a CQRS real
- `afectacionOrg` migrado a CQRS real

## Notas finales

Este plan asume que la prioridad es:

1. estabilidad
2. claridad
3. migracion por partes
4. cero cambio de contrato
5. reglas separadas de la estructura

No asume optimizacion.
No asume rediseño funcional.
No asume reescritura total.
