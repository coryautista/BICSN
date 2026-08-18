# Solución: Problema de Serialización Fastify - Objetos Vacíos en Respuestas

## Problema

Cuando Fastify serializa objetos que vienen de consultas a Firebird, a veces los objetos aparecen completamente vacíos `{}` en la respuesta JSON, aunque el stored procedure sí retorna datos.

## Síntomas

- El endpoint retorna un array con objetos, pero todos los objetos están vacíos: `[{}, {}, {}]`
- El endpoint retorna un objeto vacío `{}` en lugar de la estructura completa esperada
- Los logs muestran que el stored procedure sí retorna datos y la respuesta se construye correctamente
- El problema ocurre específicamente con datos que vienen de Firebird
- Afecta principalmente a endpoints que retornan arrays de objetos complejos
- **NUEVO**: También afecta respuestas de error (409, 500, etc.) que incluyen datos en la estructura de respuesta

## Causa

Fastify a veces tiene problemas serializando objetos que tienen:
- Referencias circulares
- Getters/setters
- Propiedades no enumerables
- Objetos con prototipos complejos
- Objetos que vienen de librerías externas (como `node-firebird`)

## Solución

La solución es crear una **copia profunda limpia** usando `JSON.parse(JSON.stringify())` y luego serializar manualmente antes de enviar la respuesta.

### Implementación

```typescript
// 1. Obtener los datos del repositorio/query
const movimientos = await query.execute(periodo, pOrg0, pOrg1, userId);

// 2. Crear copia profunda limpia
// Esto elimina cualquier getter/setter, propiedades no enumerables, 
// o referencias problemáticas
const cleanData = JSON.parse(JSON.stringify(movimientos));

// 3. Construir objeto de respuesta
const responseObject = {
  success: true,
  data: cleanData,
  timestamp: new Date().toISOString()
};

// 4. Serializar manualmente ANTES de enviar
// Esto evita que Fastify procese el objeto y pierda datos
const jsonString = JSON.stringify(responseObject);

// 5. Verificar que la serialización manual tenga los datos (opcional, para debugging)
try {
  const verification = JSON.parse(jsonString);
  if (verification.data && verification.data.length > 0) {
    const primerElemento = verification.data[0];
    const keysCount = Object.keys(primerElemento).length;
    
    if (keysCount === 0) {
      console.error('[ENDPOINT] ERROR CRÍTICO: Los datos se perdieron en la serialización manual!');
    } else {
      console.log('[ENDPOINT] Serialización manual exitosa:', {
        dataLength: verification.data.length,
        primerElementoKeys: Object.keys(primerElemento)
      });
    }
  }
} catch (verifyError) {
  console.error('[ENDPOINT] Error al verificar serialización:', verifyError);
}

// 6. Asegurar que el content-type sea JSON explícitamente
reply.type('application/json');

// 7. Enviar el JSON serializado manualmente como string
// Fastify no lo volverá a serializar si ya es un string
return reply.code(200).send(jsonString);
```

## Endpoints que ya usan esta solución

- `/v1/aplicaciones-qna/movimientos` - Movimientos Quincenales
- `/v1/aplicaciones-qna/hip` - Aplicación HIP
- `/v1/aplicaciones-qna/concentrado` - Concentrado
- `/v1/aplicacion-quincenal/AportacionQuincenalResumen` - Aportación Quincenal Resumen
- `/v1/retenciones-por-cobrar/Crear_Int_Moratorio` - Crear Int Moratorio (respuestas 409 con registros existentes)

## Notas Importantes

1. **Siempre usar esta solución** cuando se retornen arrays de objetos complejos desde Firebird
2. **No usar `reply.send()` directamente** con objetos complejos de Firebird
3. **Serializar manualmente** antes de enviar para evitar que Fastify procese el objeto
4. **Verificar la serialización** (opcional) para debugging y detección temprana de problemas
5. **Aplicar también en respuestas de error** (409, 500, etc.) que incluyan datos estructurados en la respuesta

## Caso Específico: Respuestas de Error con Datos

### Problema en `retencionesPorCobrar`

El endpoint `/v1/retenciones-por-cobrar/Crear_Int_Moratorio` retornaba un objeto vacío `{}` en lugar de la estructura completa cuando se intentaba crear registros que ya existían (409 Conflict).

**Síntoma:**
- Los logs del servidor mostraban que la respuesta se construía correctamente con `ok: false`, `error: {...}`, y `registrosExistentes: [...]`
- Postman mostraba solo `{}` en la respuesta

**Causa:**
- Fastify tenía problemas serializando la respuesta de error que incluía un array de objetos complejos en `registrosExistentes`
- Aunque el objeto se construía correctamente, Fastify lo serializaba incorrectamente

**Solución aplicada:**
```typescript
// Limpiar los datos usando JSON para evitar problemas de serialización
const cleanRegistros = JSON.parse(JSON.stringify(registrosExistentes || {}));

const response409 = {
  ok: false,
  error: {
    code: error.code || 'RECORDS_ALREADY_EXIST',
    message: error.message || 'Ya existen registros...',
    timestamp: new Date().toISOString()
  },
  registrosExistentes: cleanRegistros
};

// Serializar manualmente ANTES de enviar
const jsonString = JSON.stringify(response409);
reply.type('application/json');
return reply.code(409).send(jsonString);
```

**Lección aprendida:**
- Esta solución debe aplicarse **también en respuestas de error** que incluyan datos estructurados
- No solo en respuestas exitosas (200, 201)
- Especialmente importante cuando la respuesta incluye arrays de objetos o estructuras complejas

## Referencias en el Código

- `src/modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.ts` - Líneas 880-922 (HIP)
- `src/modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.ts` - Líneas 79-122 (Movimientos)
- `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` - Línea 1287 (Concentrado)
- `src/modules/aplicacionQuincenal/aplicacionQuincenal.routes.ts` - Líneas 122-169 (AportacionQuincenalResumen)
- `src/modules/retencionesPorCobrar/retencionesPorCobrar.routes.ts` - Líneas 319-330 (Crear_Int_Moratorio - respuesta 409)
- `src/modules/retencionesPorCobrar/infrastructure/errorHandler.ts` - Líneas 35-43, 49-57 (Manejo de errores con serialización manual)

## Checklist para Nuevos Endpoints

Antes de crear un nuevo endpoint que retorne datos de Firebird, verificar:

- [ ] ¿El endpoint retorna arrays de objetos complejos?
- [ ] ¿El endpoint retorna respuestas de error (409, 500, etc.) con datos estructurados?
- [ ] ¿Los datos vienen directamente de consultas a Firebird?
- [ ] ¿La respuesta incluye objetos anidados o estructuras complejas?

Si alguna respuesta es **SÍ**, aplicar la solución de serialización manual.

## Fechas de Documentación

- **22 de Diciembre, 2025** - Documentación inicial
- **4 de Enero, 2026** - Actualización: Caso específico de respuestas de error (retencionesPorCobrar)

