# BICSN

API REST construida con Node.js 20, TypeScript y Fastify siguiendo Clean Architecture + DDD + CQRS.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 20.0.0
- npm o yarn
- SQL Server instance
- Firebird database

### Instalación

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd BICSN

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Desarrollo

```bash
npm run dev
```

El servidor iniciará en `http://localhost:4000` (o el puerto especificado en `.env`)

### Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
BICSN/
├── src/
│   ├── server.ts              # Punto de entrada principal
│   ├── app/
│   │   └── routeRegistrar.ts  # Registro centralizado de rutas
│   ├── config/
│   │   └── env.ts             # Configuración de entorno
│   ├── db/
│   │   ├── mssql.ts           # Conexión SQL Server
│   │   ├── firebird.ts        # Conexión Firebird
│   │   └── context.ts         # Contexto de base de datos
│   ├── di/
│   │   └── container.ts       # Contenedor DI (Awilix)
│   ├── modules/               # Módulos de negocio
│   │   ├── auth/              # Autenticación
│   │   ├── afiliado/          # Gestión de afiliados
│   │   ├── reportes/          # Reportes (estructura modular)
│   │   ├── tablero/           # Tablero (estructura modular)
│   │   └── [otros módulos]/
│   ├── plugins/               # Plugins de Fastify
│   └── utils/                 # Utilidades
├── docs/                      # Documentación
│   ├── ARQUITECTURA_PROYECTO.md      # Arquitectura completa
│   ├── ARQUITECTURA_MODULOS_COMPLEJOS.md # Módulos modulares
│   └── [otra documentación]/
└── package.json
```

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Presentation**: Routes, Schemas, Middleware (Fastify, Zod)
- **Application**: Commands & Queries (CQRS)
- **Domain**: Entities, Repository Interfaces, Domain Errors
- **Infrastructure**: Repository Implementations, Database Connections

### Patrones Implementados

- ✅ **Clean Architecture**: Separación en capas
- ✅ **DDD**: Domain-Driven Design
- ✅ **CQRS**: Command Query Responsibility Segregation
- ✅ **Dependency Injection**: Awilix
- ✅ **Repository Pattern**: Abstracción del acceso a datos

**📚 Documentación Completa de Arquitectura:**
Ver [docs/ARQUITECTURA_PROYECTO.md](./docs/ARQUITECTURA_PROYECTO.md) para detalles completos.

## 🗄️ Bases de Datos

El proyecto utiliza **dos bases de datos**:

- **Firebird**: Sistema principal (mayoría de funcionalidad, CRUD completo)
- **SQL Server**: Sistema complementario (datos nuevos que no existen en Firebird)

**Configuración en `.env`**:
```env
# SQL Server
SQLSERVER_SERVER=...
SQLSERVER_DB=...
SQLSERVER_USER=...
SQLSERVER_PASSWORD=...

# Firebird
FIREBIRD_HOST=...
FIREBIRD_DATABASE=...
FIREBIRD_USER=...
FIREBIRD_PASSWORD=...
FIREBIRD_CHARSET=NONE
```

Ver [docs/ARQUITECTURA_PROYECTO.md](./docs/ARQUITECTURA_PROYECTO.md#manejo-de-bases-de-datos) para detalles.

## 📦 Estructura de Módulos

### Módulo Estándar

```
src/modules/[nombreModulo]/
├── domain/              # Entidades, interfaces, errores
├── application/         # Commands & Queries
├── infrastructure/      # Implementaciones
├── [nombre].routes.ts   # Rutas HTTP
└── [nombre].schemas.ts  # Validación
```

### Módulos Modulares

Los módulos grandes (`reportes/`, `tablero/`) usan estructura modular con submódulos.

Ver [docs/ARQUITECTURA_MODULOS_COMPLEJOS.md](./docs/ARQUITECTURA_MODULOS_COMPLEJOS.md) para detalles.

## 🔌 API Endpoints

### Documentación
- `GET /docs` - Swagger UI
- `GET /docs/json` - OpenAPI JSON

### Health Checks
- `GET /health` - Health check básico
- `GET /health/detailed` - Health check detallado
- `GET /health/db` - Health check de base de datos

### Autenticación
- `POST /v1/auth/login` - Login
- `POST /v1/auth/register` - Registro
- `POST /v1/auth/refresh` - Refresh token
- `POST /v1/auth/logout` - Logout

**Nota**: La API usa versionado basado en headers (`Accept-Version`). Ver [docs/INDEX-VERSIONADO.md](./docs/INDEX-VERSIONADO.md) para detalles.

## 🛠️ Tecnologías

- **Fastify**: Web framework
- **TypeScript**: Lenguaje
- **Awilix**: Dependency Injection
- **Zod**: Validación
- **Pino**: Logging
- **JWT**: Autenticación
- **Swagger**: Documentación API

## 📚 Documentación

- [Arquitectura del Proyecto](./docs/ARQUITECTURA_PROYECTO.md) - Arquitectura completa
- [Módulos Modulares](./docs/ARQUITECTURA_MODULOS_COMPLEJOS.md) - Estructura de módulos grandes
- [Sistema de Versionado](./docs/INDEX-VERSIONADO.md) - Versionado de API

## 📝 Licencia

ISC
