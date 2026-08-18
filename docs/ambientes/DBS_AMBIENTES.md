# Mapeo de bases de datos por ambiente

Este documento fija el acomodo vigente de bases de datos SQL Server y Firebird para BICSN.

## SQL Server

Servidor:

```text
10.20.1.92
```

Bases detectadas en el servidor:

```text
SII-ISSSSPEA-DES
SII-ISSSSPEA
SII-ISSSSPEA-PROD
```

Uso por ambiente:

| Ambiente | Base SQL Server |
| --- | --- |
| Local / Desarrollo | `SII-ISSSSPEA-DES` |
| Calidad / Capacitacion | `SII-ISSSSPEA` |
| Produccion | `SII-ISSSSPEA-PROD` |

Regla operativa:

- El `.env` local debe apuntar a `SII-ISSSSPEA-DES`.
- El deploy de calidad/capacitacion debe apuntar a `SII-ISSSSPEA`.
- El deploy de produccion debe apuntar a `SII-ISSSSPEA-PROD`.
- No usar `SII-ISSSSPEA-PROD` en local/desarrollo.

## Firebird

Servidor:

```text
10.20.1.9:3050
```

Credenciales operativas actuales:

```text
FIREBIRD_USER=DES
FIREBIRD_ROLE=R_DESARROLLO
```

Uso por ambiente segun deploy actual:

| Ambiente | Base Firebird |
| --- | --- |
| Local / Desarrollo | `/db/db/dbRestaura.fdb` |
| Calidad / Capacitacion | `/db/db/dbQna1426.fdb` |
| Produccion | `/db/db/dbQna1326.fdb` |

Nota:

- En local puede existir una linea comentada hacia una base de QNA; no debe usarse salvo prueba controlada.
- Para deploy, `deploy_bicsn.template.sh` fuerza los valores de Firebird para calidad y produccion.

## Backend desplegado

| Ambiente | URL | Contenedor | SQL Server | Firebird |
| --- | --- | --- | --- | --- |
| Calidad / Capacitacion | `http://10.20.1.92:8080` | `bicsn-des-api` | `SII-ISSSSPEA` | `/db/db/dbQna1426.fdb` |
| Produccion | `http://10.20.1.92:9090` | `bicsn-prod-api` | `SII-ISSSSPEA-PROD` | `/db/db/dbQna1326.fdb` |

## SFTP

Servidor:

```text
10.20.1.17:22
```

Rutas por ambiente:

| Ambiente | FTP_BASE_PATH |
| --- | --- |
| Local / Desarrollo | `/Autodeterminacion/Desarrollo` |
| Calidad / Capacitacion | `/Autodeterminacion/Calidad` |
| Produccion | `/Autodeterminacion/Produccion` |

## Archivos relevantes

```text
.env
.env.example
deploy_bicsn.template.sh
dist-deploy/deploy_bicsn.sh
subir.bat
```

## Reglas de seguridad

- Antes de pruebas locales que modifiquen datos, verificar `SQLSERVER_DB`.
- Local/desarrollo debe usar `SII-ISSSSPEA-DES`.
- Produccion solo debe usarse desde el contenedor de produccion o por tareas explicitamente autorizadas.
- Si se agrega un tercer contenedor real para capacitacion, debe documentarse aqui con puerto, contenedor, SQL Server, Firebird y SFTP.
