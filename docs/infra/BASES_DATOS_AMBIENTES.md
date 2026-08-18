# Bases de Datos por Ambiente

## Resumen

| Ambiente | API | SQL Server | Firebird | SFTP base |
|---|---:|---|---|---|
| Local / Desarrollo | `http://localhost:4000` | `SII-ISSSSPEA-DES` | `/db/db/dbRestaura.fdb` | `/Autodeterminacion/Desarrollo` |
| Calidad | `http://10.20.1.92:8080` | `SII-ISSSSPEA` | `/db/db/dbQna0926.fdb` | `/Autodeterminacion/Calidad` |
| Produccion | `http://10.20.1.92:9090` | `SII-ISSSSPEA-PROD` | `/db/db/dbQna1026.fdb` | `/Autodeterminacion/Produccion` |

## Local / Desarrollo

Configuracion esperada en `.env` local:

```env
PORT=4000
NODE_ENV=development
SQLSERVER_DB=SII-ISSSSPEA-DES
FIREBIRD_DATABASE=/db/db/dbRestaura.fdb
FTP_BASE_PATH=/Autodeterminacion/Desarrollo
```

## Calidad

El deploy remoto levanta el contenedor de Calidad con Docker Compose.

```env
PORT=8080
NODE_ENV=production
SQLSERVER_DB=SII-ISSSSPEA
FIREBIRD_DATABASE=/db/db/dbQna0926.fdb
FTP_BASE_PATH=/Autodeterminacion/Calidad
```

Contenedor:

```txt
bicsn-des-api
```

URL:

```txt
http://10.20.1.92:8080
```

Verificar variables dentro del contenedor:

```bash
echo Desarroll0. | sudo -S docker exec bicsn-des-api sh -lc 'printenv SQLSERVER_DB; printenv FIREBIRD_DATABASE; printenv FTP_BASE_PATH'
```

## Produccion

El deploy remoto levanta el contenedor de Produccion con Docker Compose.

```env
PORT=8080
NODE_ENV=production
SQLSERVER_DB=SII-ISSSSPEA-PROD
FIREBIRD_DATABASE=/db/db/dbQna1026.fdb
FTP_BASE_PATH=/Autodeterminacion/Produccion
```

Contenedor:

```txt
bicsn-prod-api
```

URL:

```txt
http://10.20.1.92:9090
```

Verificar variables dentro del contenedor:

```bash
echo Desarroll0. | sudo -S docker exec bicsn-prod-api sh -lc 'printenv SQLSERVER_DB; printenv FIREBIRD_DATABASE; printenv FTP_BASE_PATH'
```

## Firebird

Estos valores son comunes para los tres ambientes; cambia solo `FIREBIRD_DATABASE`.

| Variable | Valor |
|---|---|
| `FIREBIRD_HOST` | `10.20.1.9` |
| `FIREBIRD_PORT` | `3050` |
| `FIREBIRD_USER` | `DES` |
| `FIREBIRD_ROLE` | `Desarrollo` |

## SFTP

Estos valores son comunes para los tres ambientes; cambia solo `FTP_BASE_PATH`.

| Variable | Valor |
|---|---|
| `FTP_HOST` | `10.20.1.17` |
| `FTP_PORT` | `22` |
| `FTP_USER` | `Des` |

Los expedientes se guardan en:

```txt
{FTP_BASE_PATH}/expedientes/{CURP}/{timestamp}_{filename}
```

## Validacion

Calidad:

```bash
curl http://10.20.1.92:8080/health
curl http://10.20.1.92:8080/health/detailed
```

Produccion:

```bash
curl http://10.20.1.92:9090/health
curl http://10.20.1.92:9090/health/detailed
```

Ver contenedores activos:

```bash
echo Desarroll0. | sudo -S docker ps --filter name=bicsn --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

## Deploy

El deploy se ejecuta con:

```bat
subir.bat
```

La plantilla que fuerza las bases por ambiente es:

```txt
deploy_bicsn.template.sh
```

No editar directamente `dist-deploy/deploy_bicsn.sh`; se genera desde `deploy_bicsn.template.sh` durante la publicacion.
