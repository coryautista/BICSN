# BICSN

Node.js 20 + TypeScript project with Fastify and SQL Server connection.

## Features

- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type-safe development
- **SQL Server**: Database connectivity using mssql
- **Pino**: High-performance logging
- **Security**: Built-in helmet and CORS support
- **Environment Configuration**: dotenv for environment variables

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
│   ├── server.ts           # Main server entry point
│   ├── config/
│   │   └── env.ts          # Environment configuration
│   ├── db/
│   │   └── mssql.ts        # SQL Server connection
│   └── plugins/
│       └── logger.ts       # Pino logger plugin
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

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
