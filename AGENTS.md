# BICSN – Guía para agentes

Backend API con **Fastify**, **TypeScript**, **MSSQL** y **Firebird**. Arquitectura por módulos con **CQRS** (Commands/Queries) y **Awilix** para inyección de dependencias.

## Matriz obligatoria de bases

No intercambiar bases SQL Server y Firebird entre ambientes:

| Ambiente | SQL Server | Firebird |
|---|---|---|
| Desarrollo | `SII-ISSSSPEA-DES` | `/db/db/dbRestaura.fdb` |
| Calidad | `SII-ISSSSPEA` | `/db/db/dbQna1426.fdb` |
| Producción | `SII-ISSSSPEA-PROD` | `/db/db/dbQna1326.fdb` |

Antes de scripts de recuperación, migraciones o pruebas cruzadas ejecutar `npm run verify:database:environments`. La explicación operativa está en `DATABASE_ENVIRONMENTS.md` y la matriz reutilizable en `src/config/databaseEnvironments.ts`. No modificar las parejas de los scripts de despliegue sin autorización explícita.

## Skills del proyecto

Usar las skills según el tipo de cambio:

| Situación | Skill |
|-----------|--------|
| Crear o modificar **módulos**, rutas, comandos, consultas, repositorios o registro en el contenedor de BICSN | **bicsn-backend** (`.cursor/skills/bicsn-backend/SKILL.md`) |
| Patrones generales Node/Fastify, manejo de errores, seguridad, buenas prácticas de API | **nodejs-backend-patterns** (`.cursor/skills/nodejs-backend-patterns/SKILL.md`) |
| Trabajar con GPT-5.4 minimizando contexto, costo de tokens y riesgo de tocar archivos incorrectos | **bicsn-token-guard** (`.cursor/skills/bicsn-token-guard/SKILL.md`) |

Para cambios en la estructura de módulos, rutas o DI, seguir siempre la skill **bicsn-backend** para respetar las convenciones del repo (application/domain/infrastructure, Awilix, registro en `routeRegistrar` y `container`).

## Documentación AI / MCP

- Guía central para prompts, contexto, arquitectura AI y trabajo con GPT-5.4: `docs/PROMPTS_AI_PATRONES_CODIGO.md`
- Plantilla MCP local: `.cursor/mcp.json.example`
