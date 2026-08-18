# Inventario inicial de modulos para Fase 0

## Objetivo

Tener una fotografia inicial del estado de migracion de los modulos antes de ejecutar cambios por fases.

Este inventario sirve para:

- identificar modulos ya alineados con CQRS
- detectar modulos hibridos que mezclan piezas nuevas y legacy
- priorizar el orden de migracion
- congelar el contrato antes de tocar estructura interna

## Alcance

El inventario se construyo revisando:

- estructura de `src/modules/`
- presencia de `application/commands` y `application/queries`
- presencia de archivos `*.service.ts`
- presencia de archivos `*.repo.ts`
- documentacion existente en `docs/ARQUITECTURA_PROYECTO.md`

## Criterios de clasificacion

### CQRS

Modulo con `application/` activa y sin archivos legacy directos `*.service.ts` o `*.repo.ts` en la raiz del modulo.

### Hibrido

Modulo que ya tiene `commands` y `queries`, pero sigue conservando `*.service.ts`, `*.repo.ts` o ambos.

### Legacy

Modulo que depende principalmente de `service` o `repo` sin estructura CQRS utilizable.

### Modular CQRS

Caso especial para modulos contenedores como `tablero/`, donde la raiz no tiene `application/`, pero los submodulos si estan migrados.

## Resumen ejecutivo

- modulos totalmente CQRS identificados inicialmente: 4
- modulos modulares CQRS identificados: 2
- modulos hibridos identificados inicialmente: 31
- modulos legacy puros identificados en esta lectura inicial: 0

## Estado actualizado despues del primer bloque de ejecucion

- `organica0` migrado a CQRS real
- `organica1` migrado a CQRS real
- `organica2` migrado a CQRS real
- `organica3` migrado a CQRS real
- `organicaCascade` migrado a CQRS real
- `personal` migrado a CQRS real
- `orgPersonal` migrado a CQRS real
- `proceso` migrado a CQRS real
- `menu` migrado a CQRS real
- `modulo` migrado a CQRS real
- `role` migrado a CQRS real
- `roleMenu` migrado a CQRS real
- `userRole` migrado a CQRS real
- `usuarios` migrado a CQRS real
- `movimiento` migrado a CQRS real
- `tipoMovimiento` migrado a CQRS real
- `municipios` migrado a CQRS real
- `estados` migrado a CQRS real
- `calles` migrado a CQRS real
- `colonias` migrado a CQRS real
- `codigosPostales` migrado a CQRS real
- `categoriaPuestoOrg` migrado a CQRS real
- `auditLog` migrado a CQRS real
- `info` migrado a CQRS real
- `log` migrado a CQRS real
- `eventoCalendario` migrado a CQRS real
- `afiliadoOrg` migrado a CQRS real
- `afiliadosPersonal` migrado a CQRS real
- `expediente` migrado a CQRS real
- `auth` migrado a CQRS real
- `afectacionOrg` migrado a CQRS real

Esto significa que el inventario inicial ya no refleja el estado actual de esos modulos. Se conserva como fotografia de arranque, pero el estado operativo vigente debe considerar esos avances.

## Modulos totalmente CQRS

| Modulo | Observacion |
|--------|-------------|
| `aplicacionQuincenal` | usa queries y estructura por capas sin service o repo legacy en raiz |
| `aportacionesFondos` | modulo de consultas CQRS, sin service legacy en raiz |
| `CAIR` | consultas encapsuladas con estructura CQRS |
| `organica0` | migrado; el listado principal ya usa query/repositorio moderno y no quedan `service/repo` legacy en raiz |
| `organica1` | migrado; la query dinamica ya usa repositorio moderno y no quedan `service/repo` legacy en raiz |
| `organica2` | migrado; listados, update, delete y query dinamica ya usan CQRS sin `service/repo` legacy en raiz |
| `organica3` | migrado; listados y query dinamica ya usan CQRS sin `service/repo` legacy en raiz |
| `organicaCascade` | migrado; todas las rutas usan queries CQRS y no quedan `service/repo` legacy en raiz |
| `orgPersonal` | migrado; repositorio moderno absorbio el legacy y la integracion cruzada con `aportacionesFondos` sigue operativa |
| `personal` | migrado; repositorio moderno absorbio el legacy sin cambios de endpoint |
| `proceso` | migrado; operaba por CQRS y se retiraron archivos legacy redundantes |
| `menu` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `modulo` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `role` | migrado; flujo de roles usa CQRS/repositorio moderno sin legacy en raiz |
| `roleMenu` | migrado; asignacion de menus por rol usa CQRS/repositorio moderno sin legacy en raiz |
| `userRole` | migrado; relacion usuario-rol usa CQRS/repositorio moderno sin legacy en raiz |
| `usuarios` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `movimiento` | migrado; rutas usan CQRS y el repo raiz queda como shim compatible para consumidores de `afiliado` |
| `tipoMovimiento` | migrado; rutas usan CQRS y el repo raiz queda como shim compatible para consumidores Firebird de `afiliado` |
| `municipios` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `estados` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `calles` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `colonias` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `codigosPostales` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `categoriaPuestoOrg` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `auditLog` | migrado; consulta de auditoria usa query/repositorio moderno sin legacy en raiz |
| `info` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `log` | migrado; rutas usan commands/queries sobre repositorio moderno sin service legacy en raiz |
| `eventoCalendario` | migrado; rutas y repositorio moderno operan por CQRS sin legacy en raiz |
| `afiliadoOrg` | migrado; rutas usan CQRS y el repo raiz queda como shim compatible para consumidores de `afiliado` |
| `afiliadosPersonal` | migrado; rutas y repositorio Firebird moderno operan por CQRS sin legacy en raiz |
| `expediente` | migrado; rutas usan CQRS y utilidades FTP viven en infraestructura sin service/repo legacy en raiz |
| `auth` | migrado; token service vive en infraestructura y el repo raiz queda como shim compatible para middleware/consumidores existentes |
| `afectacionOrg` | migrado; rutas usan CQRS y servicio Firebird acotado vive en infraestructura sin service/repo legacy en raiz |
| `retencionesPorCobrar` | commands y queries claros, sin service legacy en raiz |

## Modulos modulares CQRS

| Modulo | Observacion |
|--------|-------------|
| `reportes` | raiz y submodulos (`afiliados`, `aplicacionesQNA`, `CAIR`) orientados a queries CQRS |
| `tablero` | submodulos `eje`, `dimension`, `unidad-medida`, `dependencia`, `linea-estrategica`, `programa`, `indicador`, `indicador-anual` ya usan commands y queries |

## Modulos hibridos

Estos modulos ya tienen estructura CQRS parcial, pero aun conservan piezas legacy. Son la zona principal de migracion controlada.

| Modulo | Senal hibrida principal |
|--------|--------------------------|
| `afiliado` | sin consumidores internos de `afiliado.repo.ts`; el archivo queda como shim temporal deprecated, mientras rutas, quincena, status/control, BDIsspea/bitacora, wrappers Firebird, CRUD base, FirebirdMovimientoService, creacion compuesta y lote masivo usan infraestructura |

## Modulos con mayor prioridad de atencion

### Prioridad alta

| Modulo | Motivo |
|--------|--------|
| `afiliado` | modulo sensible por reglas, Firebird y multiples imports dinamicos al repo raiz; status/control ya delegado a `AfiliadoStatusService` |

### Prioridad media

| Modulo | Motivo |
|--------|--------|
| `afiliado` | modulo sensible por reglas y Firebird; requiere migracion dedicada |

### Migraciones ya completadas

| Modulo | Resultado |
|--------|-----------|
| `organica0` | migrado a CQRS real sin cambios de endpoint |
| `organica1` | migrado a CQRS real sin cambios de endpoint |
| `organica2` | migrado a CQRS real sin cambios de endpoint |
| `organica3` | migrado a CQRS real sin cambios de endpoint |
| `organicaCascade` | migrado a CQRS real sin cambios de endpoint |
| `personal` | migrado a CQRS real sin cambios de endpoint |
| `orgPersonal` | migrado a CQRS real sin cambios de endpoint |
| `proceso` | migrado a CQRS real sin cambios de endpoint |
| `menu` | migrado a CQRS real sin cambios de endpoint |
| `modulo` | migrado a CQRS real sin cambios de endpoint |
| `role` | migrado a CQRS real sin cambios de endpoint |
| `roleMenu` | migrado a CQRS real sin cambios de endpoint |
| `userRole` | migrado a CQRS real sin cambios de endpoint |
| `usuarios` | migrado a CQRS real sin cambios de endpoint |
| `movimiento` | migrado a CQRS real sin cambios de endpoint; shim de compatibilidad para `afiliado` |
| `tipoMovimiento` | migrado a CQRS real sin cambios de endpoint; shim de compatibilidad para `afiliado` |
| `municipios` | migrado a CQRS real sin cambios de endpoint |
| `estados` | migrado a CQRS real sin cambios de endpoint |
| `calles` | migrado a CQRS real sin cambios de endpoint |
| `colonias` | migrado a CQRS real sin cambios de endpoint |
| `codigosPostales` | migrado a CQRS real sin cambios de endpoint |
| `categoriaPuestoOrg` | migrado a CQRS real sin cambios de endpoint |
| `auditLog` | migrado a CQRS real sin cambios de endpoint |
| `info` | migrado a CQRS real sin cambios de endpoint |
| `log` | migrado a CQRS real sin cambios de endpoint |
| `eventoCalendario` | migrado a CQRS real sin cambios de endpoint |
| `afiliadoOrg` | migrado a CQRS real sin cambios de endpoint; shim de compatibilidad para `afiliado` |
| `afiliadosPersonal` | migrado a CQRS real sin cambios de endpoint |
| `expediente` | migrado a CQRS real sin cambios de endpoint |
| `auth` | migrado a CQRS real sin cambios de endpoint; shim de compatibilidad para consumidores existentes |
| `afectacionOrg` | migrado a CQRS real sin cambios de endpoint |

### Prioridad controlada posterior

| Grupo | Modulos |
|-------|---------|
| catalogos y administracion | pendiente de definir despues de especiales |
| geografia y catalogos secundarios | completado bloque principal (`estados`, `municipios`, `calles`, `colonias`, `codigosPostales`) |
| modulos especiales | completados |

## Riesgos detectados desde Fase 0

1. La mayoria del backend no es legacy puro, sino hibrido.
2. Migrar un modulo no significa solo crear commands y queries; en muchos casos tambien hay que retirar dependencias legacy sin romper rutas.
3. `afectacionOrg` y `afiliado` requieren cuidado extra por mezcla de reglas e integraciones Firebird.
4. `tablero` y `reportes` no deben usarse como ejemplo de raiz estandar porque son modulos contenedores.
5. `container.ts` y `routeRegistrar.ts` seguiran siendo puntos de riesgo transversal en cualquier fase.

## Recomendacion operativa para arrancar

### Bloque recomendado 1

1. documentar reglas de `afectacionOrg`
2. documentar reglas de `afiliado`
3. cerrar plantillas de modulo objetivo
4. migrar `organica1` [completado]
5. migrar `organica2` [completado]
6. migrar `organica3` [completado]

### Bloque recomendado 2

1. evitar nuevos imports a `afiliado.repo.ts`; queda solo como shim temporal deprecated
2. validar contratos de modulos completados con pruebas funcionales/API
3. retirar `afiliado.repo.ts` en una fase posterior si no hay consumidores externos/documentales

## Nota de avance

La familia `organica0/organica1/organica2/organica3`, `organicaCascade`, `personal`, `orgPersonal`, el bloque administrativo `proceso/menu/modulo/role/roleMenu/userRole/usuarios`, el bloque `movimiento/tipoMovimiento/municipios/estados`, el bloque `calles/colonias/codigosPostales/categoriaPuestoOrg`, el bloque `auditLog/info/log/eventoCalendario`, `afiliadoOrg/afiliadosPersonal`, `expediente`, `auth` y `afectacionOrg` ya fueron cerrados durante la ejecucion inicial. El pendiente estructural principal es `afiliado` por sensibilidad de negocio e integraciones Firebird.

## Uso de este inventario

Este documento no reemplaza el checklist por modulo.

Usar en conjunto con:

- `plans/migracion-por-fases-sin-cambiar-endpoints.md`
- `plans/checklist-migracion-por-modulo.md`
- `docs/reglas/README.md`

## Nota final

Este es un inventario inicial de ejecucion. Puede ajustarse cuando se confirme en detalle cada modulo, pero ya es suficiente para operar Fase 0 sin depender solo de percepcion o memoria del repo.
