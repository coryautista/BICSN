# Arquitectura de Módulos Complejos - Estructura Modular

## 📋 Resumen Ejecutivo

Este documento justifica y documenta la estructura modular utilizada en los módulos **`reportes/`** y **`tablero/`**, que difieren de la estructura estándar de módulos del proyecto BICSN debido a su complejidad y tamaño.

---

## 🎯 Justificación de la Estructura Modular

### Problema Identificado

Los módulos `reportes/` y `tablero/` son excepcionalmente grandes y contienen múltiples dominios de negocio relacionados pero independientes. Si se implementaran con la estructura estándar, resultarían en:

- **Archivos extremadamente grandes** (miles de líneas)
- **Dificultad de mantenimiento** y navegación
- **Alto acoplamiento** entre funcionalidades no relacionadas
- **Problemas de rendimiento** en IDEs y herramientas de desarrollo
- **Dificultad para trabajo en equipo** (conflictos de merge frecuentes)

### Solución: Estructura Modular

Se implementó una **estructura modular** que agrupa funcionalidades relacionadas en submódulos independientes, cada uno siguiendo la arquitectura Clean Architecture + DDD del proyecto.

---

## 📁 Módulo: `reportes/`

### Estructura Actual

```
src/modules/reportes/
├── reportes.routes.ts          # Router principal que registra submódulos
├── reportes.service.ts         # Servicio orquestador general
├── reportes.schemas.ts         # Esquemas compartidos
├── domain/                     # Dominio general de reportes
├── application/                # Casos de uso generales
├── infrastructure/             # Infraestructura general
│
├── afiliados/                  # Submódulo: Reportes de Afiliados
│   ├── afiliados.routes.ts
│   ├── afiliados.schemas.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── aplicacionesQNA/            # Submódulo: Aplicaciones Quincenales
│   ├── aplicacionesQNA.routes.ts
│   ├── aplicacionesQNA.schemas.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
└── CAIR/                       # Submódulo: Reportes CAIR
    ├── CAIR.routes.ts
    ├── CAIR.schemas.ts
    ├── domain/
    ├── application/
    └── infrastructure/
```

### Características

1. **Router Principal**: `reportes.routes.ts` actúa como punto de entrada que registra todos los submódulos
2. **Submódulos Independientes**: Cada submódulo tiene su propia estructura Clean Architecture completa
3. **Endpoints Resultantes**:
   - `/v1/reportes/mensual` - Reporte general
   - `/v1/reportes/movimientos` - Movimientos generales
   - `/v1/reportes/aplicaciones-qna/movimientos` - Submódulo aplicacionesQNA
   - `/v1/reportes/cair/estado-cuenta` - Submódulo CAIR
   - `/v1/reportes/afiliados/historial-movimientos-quin` - Submódulo afiliados
4. **Patrón Moderno**: Usa **Commands/Queries** (CQRS) en lugar de Services legacy

### Justificación Específica

- **`afiliados/`**: Contiene 2 queries complejas con stored procedures específicos
- **`aplicacionesQNA/`**: Contiene 6 queries diferentes para aplicaciones quincenales
- **`CAIR/`**: Módulo especializado con 2 queries para el sistema CAIR
- **Raíz**: Funcionalidades generales compartidas entre todos los reportes

**Tamaño estimado sin modularización**: ~3000+ líneas en un solo archivo de rutas

---

## 📁 Módulo: `tablero/`

### Estructura Actual

```
src/modules/tablero/
├── eje/                        # Submódulo: Ejes Estratégicos
├── programa/                   # Submódulo: Programas
├── linea-estrategica/          # Submódulo: Líneas Estratégicas
├── indicador/                  # Submódulo: Indicadores
├── indicador-anual/            # Submódulo: Indicadores Anuales
├── dimension/                  # Submódulo: Dimensiones
├── unidad-medida/              # Submódulo: Unidades de Medida
└── dependencia/                # Submódulo: Dependencias
```

### Características

1. **Submódulos Completamente Independientes**: Cada submódulo es registrado directamente en `routeRegistrar.ts`
2. **Rutas Definidas en Submódulos**: Cada submódulo define sus propias rutas
3. **Endpoints Resultantes**:
   - `/v1/ejes` - Gestión de ejes
   - `/v1/programas` - Gestión de programas
   - `/v1/indicadores` - Gestión de indicadores
   - ... etc
4. **Patrón Legacy**: Usa **Services** en lugar de Commands/Queries (patrón más antiguo)
5. **Relaciones entre Submódulos**: Los submódulos pueden tener dependencias entre sí

### Justificación Específica

El módulo `tablero/` representa un **sistema de gestión de indicadores estratégicos** con 8 entidades principales. Cada entidad tiene su propio CRUD completo y relaciones complejas entre entidades.

**Tamaño estimado sin modularización**: ~8000+ líneas distribuidas en múltiples archivos

---

## 🔗 Relaciones entre Submódulos

### Dependencias Permisibles

Los submódulos pueden tener dependencias entre sí cuando representan relaciones de dominio:

**Ejemplo: `tablero/programa/` depende de `tablero/eje/` y `tablero/linea-estrategica/`**

```typescript
// ✅ PERMITIDO: Importar errores de dominio relacionados
import { EjeNotFoundError } from '../eje/domain/errors.js';
import { LineaEstrategicaNotFoundError } from '../linea-estrategica/domain/errors.js';
```

### Dependencias NO Permitidas

```typescript
// ❌ NO PERMITIDO: Importar servicios de otros submódulos directamente
import { EjeService } from '../eje/eje.service.js';  // ❌

// ❌ NO PERMITIDO: Importar repositorios de otros submódulos
import { EjeRepository } from '../eje/infrastructure/EjeRepository.js';  // ❌
```

---

## 📊 Comparación: Estructura Estándar vs Modular

| Aspecto | Estructura Estándar | Estructura Modular |
|---------|-------------------|-------------------|
| **Tamaño del módulo** | Pequeño-Mediano (< 1000 líneas) | Grande (> 2000 líneas) |
| **Dominios de negocio** | 1 dominio principal | Múltiples dominios relacionados |
| **Archivos de rutas** | 1 archivo `*.routes.ts` | 1 router principal + N submódulos O N submódulos independientes |
| **Mantenibilidad** | Alta | Alta (mejorada por organización) |
| **Trabajo en equipo** | Bajo riesgo de conflictos | Bajo riesgo (archivos separados) |

---

## ✅ Cuándo Usar Estructura Modular

### Usar Estructura Modular cuando:

1. ✅ El módulo tiene **más de 2000 líneas** de código
2. ✅ Contiene **múltiples dominios de negocio** relacionados pero independientes
3. ✅ Tiene **más de 5-7 endpoints** principales diferentes
4. ✅ Las funcionalidades pueden agruparse **lógicamente** en submódulos
5. ✅ Múltiples desarrolladores trabajarán en el módulo **simultáneamente**

### Usar Estructura Estándar cuando:

1. ✅ El módulo es **pequeño o mediano** (< 1000 líneas)
2. ✅ Tiene un **dominio de negocio único** y bien definido
3. ✅ Tiene **pocos endpoints** (< 10 rutas)
4. ✅ La funcionalidad es **cohesiva** y no se beneficia de separación

---

## 🔧 Patrones de Implementación

### Patrón 1: Router Principal (como `reportes/`)

```typescript
// reportes.routes.ts
export async function reportesRoutes(fastify: FastifyInstance) {
  // Registrar submódulos
  await fastify.register(submodulo1Routes, { prefix: '/submodulo1' });
  await fastify.register(submodulo2Routes, { prefix: '/submodulo2' });
  
  // Rutas generales del módulo
  fastify.get('/general', ...);
}
```

**Usar cuando**: Los submódulos comparten funcionalidades comunes o hay rutas generales del módulo.

### Patrón 2: Registro Directo (como `tablero/`)

```typescript
// En routeRegistrar.ts
{
  plugin: submodulo1Routes,
  prefix: '/v1',
  options: { group: ROUTE_GROUPS.MODULO }
}
```

**Usar cuando**: Los submódulos son completamente independientes y no comparten funcionalidades.

---

## 📝 Convenciones y Reglas

### Nomenclatura

- **Submódulos**: Usar nombres descriptivos en `kebab-case` o `camelCase`
- **Archivos de rutas**: `[nombreSubmodulo].routes.ts`
- **Prefijos de rutas**: Coincidir con el nombre del submódulo

### Estructura de Submódulos

Cada submódulo DEBE seguir la estructura Clean Architecture completa.

### Registro en DI Container

Cada submódulo debe registrar sus dependencias en `src/di/container.ts`.

---

## 🎯 Beneficios de la Estructura Modular

1. **Mantenibilidad Mejorada**
2. **Escalabilidad**
3. **Trabajo en Equipo**
4. **Testabilidad**
5. **Rendimiento de Desarrollo**

---

## ⚠️ Desventajas y Consideraciones

1. **Complejidad Inicial**
2. **Duplicación Potencial**
3. **Navegación**

**Mitigación**: Documentación clara y convenciones bien definidas.

---

## 📚 Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- Documentación del proyecto: [ARQUITECTURA_PROYECTO.md](./ARQUITECTURA_PROYECTO.md)

---

## ✅ Checklist para Nuevos Módulos Modulares

Al crear un nuevo módulo modular, verificar:

- [ ] El módulo justifica la estructura modular (> 2000 líneas o múltiples dominios)
- [ ] Cada submódulo sigue la estructura Clean Architecture
- [ ] Los submódulos están registrados correctamente en `routeRegistrar.ts`
- [ ] Las dependencias están registradas en `container.ts`
- [ ] Los prefijos de rutas son consistentes y descriptivos
- [ ] Existe documentación del módulo (README.md si es necesario)
- [ ] Los errores están manejados consistentemente
- [ ] Los esquemas de validación están definidos
- [ ] Las relaciones entre submódulos están documentadas
- [ ] Solo se importan errores de dominio entre submódulos (no servicios/repositorios)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

