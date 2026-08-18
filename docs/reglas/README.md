# Reglas del proyecto BICSN

## Objetivo

Separar las reglas del negocio y las reglas tecnicas de los planes de migracion para que el proyecto pueda evolucionar por fases sin cambiar endpoints ni reinterpretar comportamiento existente.

## Principio base

La migracion estructural no debe mezclar:

- reglas del negocio
- contratos HTTP
- optimizaciones
- decisiones tecnicas transversales

Las reglas deben vivir aparte para que puedan consultarse, validarse y mantenerse sin contaminar los planes de ejecucion.

## Estructura recomendada

```text
docs/reglas/
  README.md
  negocio/
  tecnicas/
  integraciones/
```

## Tipos de reglas

### 1. Reglas de negocio

Usar para:

- validaciones funcionales
- condiciones de alta, baja o actualizacion
- restricciones por rol
- secuencias obligatorias del proceso
- criterios de rechazo o bloqueo

Ubicacion sugerida:

- `docs/reglas/negocio/<modulo>.md`

### 2. Reglas tecnicas

Usar para:

- serializacion obligatoria
- timeouts conocidos
- padding de claves
- convenciones de DI
- restricciones de infraestructura

Ubicacion sugerida:

- `docs/reglas/tecnicas/<tema>.md`

### 3. Reglas de integracion

Usar para:

- contratos con Firebird
- contratos con SQL Server
- procedimientos almacenados sensibles
- dependencias externas
- mapeos o transforms obligatorios

Ubicacion sugerida:

- `docs/reglas/integraciones/<sistema-o-modulo>.md`

## Plantilla minima por regla

Cada regla debe documentarse con esta estructura:

```md
# Nombre de la regla

## Tipo
Negocio | Tecnica | Integracion

## Modulo
Modulo o modulos afectados

## Objetivo
Que protege o garantiza esta regla

## Descripcion
Regla exacta sin ambiguedad

## Entradas
Parametros, contexto, token, datos o condiciones necesarias

## Salida esperada
Comportamiento esperado del sistema

## Restricciones
Que no debe cambiarse sin aprobacion explicita

## Evidencia en codigo
Archivos, clases, rutas, SPs o funciones relacionadas

## Riesgo de tocarla
Bajo | Medio | Alto

## Notas
Casos especiales o excepciones conocidas
```

## Reglas de uso

1. No meter reglas de negocio dentro de planes de migracion.
2. No meter decisiones de arquitectura dentro de reglas de negocio.
3. No documentar una regla si solo es una hipotesis; debe tener evidencia.
4. Si una regla afecta un endpoint existente, marcarla como contrato sensible.
5. Si una regla depende de Firebird o de un SP, enlazar evidencia tecnica directa.

## Contratos sensibles

Las siguientes categorias deben tratarse como sensibles y no deben cambiarse durante la migracion sin aprobacion explicita:

- endpoints publicados
- shape de respuestas
- codigos HTTP
- validaciones de autenticacion y autorizacion
- orden operativo de procesos de negocio
- reglas asociadas a SPs legacy o flujos de afiliado

## Relacion con la migracion

La migracion debe usar estas reglas como referencia, pero no redefinirlas.

Orden correcto:

1. identificar la regla
2. documentarla si no existe
3. migrar la estructura interna respetando la regla
4. verificar que el comportamiento no cambio

## Primeras recomendaciones para poblar esta carpeta

1. `docs/reglas/tecnicas/serializacion-fastify.md`
2. `docs/reglas/integraciones/firebird-procedimientos.md`
3. `docs/reglas/negocio/afectacion-org.md`
4. `docs/reglas/negocio/afiliado.md`

## Resultado esperado

Con esta separacion:

- los planes quedan enfocados en ejecucion
- las reglas quedan trazables
- se reduce el riesgo de romper el proyecto por interpretaciones ambiguas
- GPT-5.4 puede trabajar con menos contexto y mas precision
