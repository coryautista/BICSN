# Checklist de migracion por modulo

## Objetivo

Ejecutar migraciones internas por modulo sin cambiar endpoints, sin optimizar comportamiento y sin mezclar reglas del negocio con refactor estructural.

## Restricciones obligatorias

- no cambiar endpoints
- no cambiar prefijos
- no cambiar shape de respuesta
- no cambiar codigos HTTP sin aprobacion explicita
- no reinterpretar reglas del negocio
- no mezclar optimizacion con migracion

## Uso del checklist

Este checklist debe correrse por cada modulo antes, durante y despues de una migracion.

---

## 1. Preparacion

- [ ] El modulo objetivo esta claramente delimitado.
- [ ] Se identifico si el modulo es legacy o CQRS.
- [ ] Se identificaron rutas publicas del modulo.
- [ ] Se identificaron schemas del modulo.
- [ ] Se identificaron queries, commands, services o repositorios involucrados.
- [ ] Se identifico si usa SQL Server, Firebird o ambos.
- [ ] Se revisaron reglas existentes en `docs/reglas/` si aplican.
- [ ] Si no hay reglas documentadas, se anoto el faltante antes de migrar.

## 2. Contrato congelado

- [ ] Los endpoints actuales quedaron inventariados.
- [ ] El contrato en Swagger fue tomado como referencia.
- [ ] Se confirmo que no se cambiara nombre de ruta.
- [ ] Se confirmo que no se cambiara metodo HTTP.
- [ ] Se confirmo que no se cambiara prefijo.
- [ ] Se confirmo que no se cambiara respuesta publica salvo autorizacion explicita.

## 3. Analisis estructural

- [ ] Se identifico la estructura actual del modulo.
- [ ] Se identifico si usa `.service.ts` legacy.
- [ ] Se identifico si usa `.repo.ts` legacy.
- [ ] Se identifico si ya tiene `domain/`, `application/`, `infrastructure/`.
- [ ] Se identifico si requiere registro en `src/di/container.ts`.
- [ ] Se identifico si requiere registro o cambios en `src/app/routeRegistrar.ts`.

## 4. Reglas separadas

- [ ] Las reglas del negocio no se moveran al plan de migracion.
- [ ] Las reglas tecnicas obligatorias estan identificadas.
- [ ] Las reglas de integracion con Firebird o SQL Server estan identificadas.
- [ ] Las excepciones conocidas del modulo quedaron registradas.

## 5. Diseño de migracion interna

- [ ] Existe una lista minima de archivos a tocar.
- [ ] No se tocara codigo fuera del modulo sin necesidad real.
- [ ] Si se crea `domain/repositories`, la interfaz esta bien delimitada.
- [ ] Si se crean `commands` o `queries`, sus nombres siguen la convencion del repo.
- [ ] Si se mueve logica, se mantiene el contrato externo.
- [ ] Si el modulo depende de DI, el registro nuevo esta previsto.

## 6. Ejecucion tecnica

- [ ] Las rutas existentes siguen apuntando al mismo contrato HTTP.
- [ ] Los schemas se mantienen compatibles.
- [ ] Los commands y queries resuelven correctamente desde DI.
- [ ] Los repositorios quedaron en infraestructura.
- [ ] Los imports rotos fueron corregidos.
- [ ] No quedaron duplicidades innecesarias entre service legacy y CQRS nuevo.
- [ ] No se eliminaron piezas legacy hasta confirmar estabilidad.

## 7. Verificacion funcional

- [ ] El modulo compila o resuelve sin errores obvios.
- [ ] Swagger sigue publicando las rutas esperadas.
- [ ] Los endpoints responden igual a nivel contrato.
- [ ] Los codigos HTTP esperados no cambiaron.
- [ ] Los errores siguen el mismo comportamiento visible para cliente.
- [ ] Si hay Firebird, se reviso serializacion y decoding si aplica.
- [ ] Si hay auth, se revisaron preHandlers y restricciones.

## 8. Limpieza controlada

- [ ] Solo se elimina codigo legacy cuando ya existe reemplazo estable.
- [ ] No quedaron registros viejos sobrantes en DI.
- [ ] No quedaron referencias documentales ambiguas.
- [ ] Se actualizo documentacion si el estado interno del modulo cambio.

## 9. Criterio de salida por modulo

Un modulo se considera migrado cuando:

- mantiene exactamente los mismos endpoints publicados
- mantiene el mismo contrato visible al cliente
- ya no depende de la pieza legacy objetivo
- su estructura interna es mas consistente con el patron del repo
- las reglas asociadas quedaron trazables aparte

## 10. Semaforo de riesgo

### Riesgo bajo

- modulo pequeno
- sin SPs complejos
- sin auth especial
- sin mezcla Firebird/SQL Server

### Riesgo medio

- modulo con varias rutas
- depende de DI central
- usa validaciones o errores propios
- tiene legado parcial

### Riesgo alto

- usa Firebird con SPs sensibles
- mezcla logica tecnica y funcional
- tiene reglas de negocio poco documentadas
- impacta auth, afectacion, afiliado o procesos criticos

## 11. Orden sugerido de aplicacion

1. modulos pequenos con bajo riesgo
2. modulos legacy medianos
3. modulos con integracion sensible
4. modulos criticos del negocio

## 12. Nota final

Si durante la migracion aparece una mejora de performance, simplificacion o posible optimizacion, se documenta aparte y no se ejecuta dentro de la fase de migracion salvo aprobacion explicita.
