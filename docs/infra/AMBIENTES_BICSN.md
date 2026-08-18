# Ambientes BICSN

Esta guia alinea la configuracion de API, SQL Server, Firebird y SFTP por ambiente.

## Matriz de ambientes

| Ambiente | API | SQL Server | Firebird | SFTP base |
|---|---:|---|---|---|
| Local / Desarrollo | 4000 | SII-ISSSSPEA-DES | /db/db/dbRestaura.fdb | /Autodeterminacion/Desarrollo |
| Calidad | 8080 | SII-ISSSSPEA | /db/db/dbQna0926.fdb | /Autodeterminacion/Calidad |
| Produccion | 9090 | SII-ISSSSPEA-PROD | /db/db/dbQna1026.fdb | /Autodeterminacion/Produccion |

## SFTP expedientes

El backend usa SFTP mediante `ssh2-sftp-client`. Por compatibilidad historica, las variables siguen usando el prefijo `FTP_`.

| Variable | Valor base |
|---|---|
| FTP_HOST | 10.20.1.17 |
| FTP_PORT | 22 |
| FTP_USER | Des |
| FTP_PASS | sy?FAWI1 |

Los archivos de expediente se guardan bajo:

```txt
{FTP_BASE_PATH}/expedientes/{CURP}/{timestamp}_{filename}
```

## Local / Desarrollo

Configuracion esperada en `.env` local:

```env
PORT=4000
SQLSERVER_DB=SII-ISSSSPEA-DES
FIREBIRD_DATABASE=/db/db/dbRestaura.fdb
FTP_HOST=10.20.1.17
FTP_PORT=22
FTP_USER=Des
FTP_PASS=sy?FAWI1
FTP_BASE_PATH=/Autodeterminacion/Desarrollo
```

## Calidad

El deploy remoto genera la configuracion de Calidad en `/home/administrador/back/privado/desarrollo/.env`.

```env
PORT=8080
SQLSERVER_DB=SII-ISSSSPEA
FIREBIRD_DATABASE=/db/db/dbQna0926.fdb
FTP_HOST=10.20.1.17
FTP_PORT=22
FTP_USER=Des
FTP_PASS=sy?FAWI1
FTP_BASE_PATH=/Autodeterminacion/Calidad
```

## Produccion

El deploy remoto genera la configuracion de Produccion en `/home/administrador/back/privado/produccion/.env`.

```env
PORT=8080
SQLSERVER_DB=SII-ISSSSPEA-PROD
FIREBIRD_DATABASE=/db/db/dbQna1026.fdb
FTP_HOST=10.20.1.17
FTP_PORT=22
FTP_USER=Des
FTP_PASS=sy?FAWI1
FTP_BASE_PATH=/Autodeterminacion/Produccion
```

El contenedor de Produccion expone `PORT=8080` internamente y Docker publica el servicio en el puerto `9090` del servidor.

## Publicacion

`subir.bat` llama a `generar_rar.bat`. La logica de publicacion esta en `generar_rar.bat` y en `deploy_bicsn.template.sh`.

Flujo:

1. `generar_rar.bat` empaqueta el backend.
2. Genera `dist-deploy/deploy_bicsn.sh` desde `deploy_bicsn.template.sh`.
3. Sube el RAR y el script remoto al servidor `10.20.1.92`.
4. Ejecuta el deploy remoto.
5. El script remoto levanta Calidad y Produccion con Docker Compose.

No editar directamente `dist-deploy/deploy_bicsn.sh`; es un artefacto generado.
