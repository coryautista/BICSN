# BICSN

Node.js 20 + TypeScript project with Fastify and SQL Server connection.

## Features

- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type-safe development
- **SQL Server**: Database connectivity using mssql
- **Firebird**: Additional database support
- **Pino**: High-performance logging
- **Security**: Built-in helmet and CORS support
- **Environment Configuration**: dotenv for environment variables
- **Clean Architecture**: CQRS, Repository Pattern, Dependency Injection
- **API Versioning**: Header-based versioning system (Accept-Version)
- **Authentication**: JWT-based auth with Argon2 password hashing
- **Swagger/OpenAPI**: Auto-generated API documentation

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- SQL Server instance

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BICSN
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your SQL Server configuration:
- `DB_SERVER`: SQL Server hostname/IP
- `DB_DATABASE`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_PORT`: SQL Server port (default: 1433)
- `DB_ENCRYPT`: Enable encryption (true/false)
- `DB_TRUST_SERVER_CERTIFICATE`: Trust server certificate (true/false)

## Development

Run the development server with hot-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

The compiled files will be in the `dist/` directory.

## Production

Start the production server:
```bash
npm start
```

## Project Structure

```
BICSN/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── config/
│   │   └── env.ts             # Environment configuration
│   ├── db/
│   │   ├── mssql.ts           # SQL Server connection
│   │   ├── firebird.ts        # Firebird connection
│   │   └── context.ts         # Database context
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication module
│   │   │   ├── application/   # Commands & Queries (CQRS)
│   │   │   ├── domain/        # Entities & Repository interfaces
│   │   │   ├── infrastructure/# Repository implementations
│   │   │   ├── auth.routes.ts # Routes v1.0.0
│   │   │   └── auth.routes.v2.ts # Routes v2.0.0 (versionadas)
│   │   ├── usuarios/          # User management
│   │   └── [otros módulos]/   # Other feature modules
│   ├── plugins/
│   │   ├── logger.ts          # Pino logger plugin
│   │   ├── requestLogger.ts   # Request logging
│   │   └── versioning.ts      # API versioning plugin
│   └── utils/
│       ├── versioning.ts      # Versioning utilities
│       ├── http.ts            # HTTP helpers
│       └── audit.ts           # Audit logging
├── docs/                      # Documentation
│   ├── INDEX-VERSIONADO.md    # Versioning index
│   ├── VERSIONADO.md          # Versioning guide
│   ├── ARQUITECTURA-VERSIONADO.md # Architecture diagrams
│   ├── TEST-VERSIONADO.md     # Testing guide
│   └── EJEMPLOS-CLIENTE-VERSIONADO.md # Client examples
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## API Endpoints

### Documentation
- `GET /docs` - Swagger UI (Interactive API documentation)
- `GET /docs/json` - OpenAPI JSON specification

### Health & Info
- `GET /health` - Basic health check (uptime, timestamp)
- `GET /health/detailed` - Detailed health check (databases, dependencies, system metrics)
- `GET /health/db` - Database-specific health check
- `GET /v1/info` - Server information

**📚 Documentación de Health Checks:**
Ver [HEALTH-CHECKS.md](./HEALTH-CHECKS.md) para guías completas de monitoreo, alertas e integración.

### Authentication (Versionado)
- `POST /v1/auth/login` - User login
  - **v1.0.0** (default): Basic login response
  - **v2.0.0** (with `Accept-Version: 2.0.0`): Enhanced response with metadata
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - User logout

### API Versioning

Este proyecto implementa versionado de API usando el header `Accept-Version`.

**Ejemplo - Login v1.0.0 (default):**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"usernameOrEmail":"admin","password":"***"}'
```

**Ejemplo - Login v2.0.0 (con metadata):**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/v1/auth/login" `
  -Method POST `
  -Headers @{
    "Content-Type"="application/json"
    "Accept-Version"="2.0.0"
  } `
  -Body '{"usernameOrEmail":"admin","password":"***"}'
```

**📚 Documentación Completa de Versionado:**
Ver [INDEX-VERSIONADO.md](./INDEX-VERSIONADO.md) para guías completas, ejemplos y arquitectura.

## Dependencies

### Production
- `fastify` - Web framework
- `fastify-helmet` - Security headers
- `fastify-cors` - CORS support
- `mssql` - SQL Server client
- `dotenv` - Environment variables
- `pino` - Logger

### Development
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot-reload
- `@types/node` - Node.js type definitions
- `pino-pretty` - Pretty logging for development

## License

ISC
