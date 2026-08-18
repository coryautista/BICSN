# Relación de bases por ambiente

Esta matriz es obligatoria. No combinar una base SQL Server con un archivo Firebird de otro ambiente.

| Ambiente | SQL Server | Firebird | Participa en `deploy_bicsn.template.sh` |
|---|---|---|---|
| Desarrollo | `SII-ISSSSPEA-DES` | `/db/db/dbRestaura.fdb` | No |
| Calidad | `SII-ISSSSPEA` | `/db/db/dbQna1426.fdb` | Sí, mediante `DEV_DIR` / `bicsn-des` |
| Producción | `SII-ISSSSPEA-PROD` | `/db/db/dbQna1326.fdb` | Sí, mediante `PROD_DIR` / `bicsn-prod` |

## Reglas

1. Desarrollo no participa en el script de despliegue de Calidad y Producción.
2. En el script de despliegue, los nombres `DEV_DIR`, `bicsn-des` y `bicsn-des-api` representan Calidad; no representan la base de Desarrollo.
3. Los valores de las parejas en los scripts de despliegue no deben modificarse sin autorización explícita.
4. Las pruebas que consultan SQL Server y Firebird en la misma ejecución deben validar primero que la pareja pertenece al mismo ambiente.
5. Los históricos se leen desde el SQL Server de su ambiente. No deben reconstruirse con un Firebird de otro ambiente.
6. Antes de recuperaciones, migraciones o pruebas cruzadas ejecutar:

```bash
npm run verify:database:environments
```

La matriz reutilizable por código se encuentra en `src/config/databaseEnvironments.ts`.

## Despliegue

El despliegue no copia las bases. Configura dos instancias del backend:

- Calidad: `SII-ISSSSPEA` + `/db/db/dbQna1426.fdb`, puerto externo `8080`.
- Producción: `SII-ISSSSPEA-PROD` + `/db/db/dbQna1326.fdb`, puerto externo `9090`.

La pareja de Desarrollo se configura localmente y queda fuera de ese despliegue.

El contenido existente en `dist-deploy/BICSN` es un artefacto generado y puede quedar atrás respecto al código fuente. Antes de un nuevo despliegue debe generarse un artefacto fresco; no se debe promover automáticamente el paquete anterior.

Para una publicación exclusiva de Calidad se usa `npm run package:deploy:calidad` y `deploy_calidad.template.sh`. Este flujo solo reconstruye `bicsn-des-api`, preserva el `.env` remoto y fija la pareja de Calidad. El segundo argumento controla `SNAPSHOT_CALCULO_V2_SHADOW_ENABLED`, el tercero `SNAPSHOT_CALCULO_V2_READ_ENABLED` y el cuarto `SNAPSHOT_CALCULO_V2_OFFICIAL_READ_ENABLED`; los tres usan `false` por defecto. No reinicia ni modifica `bicsn-prod-api`.

## Prueba histórica 1426

La última QNA aplicada disponible para pruebas históricas de Calidad es `1426`. Se valida en sombra con:

```bash
npm run shadow:aportaciones:1426
```

El comando fija y valida la pareja de Calidad, consulta únicamente en modo lectura y compara históricos SQL, Línea de Pago, snapshot REVISA y `AP_S_FONDOS` de `dbQna1426.fdb`.

La E2E de Fase 3 es un gate estricto: `npm run verify:aportaciones:phase3:e2e` falla mientras la QNA vigente no tenga un TXT aceptado con coincidencias. La ausencia del TXT no se reporta como prueba aprobada.
