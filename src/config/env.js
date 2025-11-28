"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    host: process.env.HOST !== null && process.env.HOST !== void 0 ? process.env.HOST : '0.0.0.0',
    port: Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4000),
    nodeEnv: (_b = process.env.NODE_ENV) !== null && _b !== void 0 ? _b : 'development',
    logLevel: (_c = process.env.LOG_LEVEL) !== null && _c !== void 0 ? _c : 'info',
    sql: {
        user: process.env.SQLSERVER_USER,
        password: process.env.SQLSERVER_PASSWORD,
        server: process.env.SQLSERVER_SERVER,
        database: process.env.SQLSERVER_DB,
        port: Number((_d = process.env.SQLSERVER_PORT) !== null && _d !== void 0 ? _d : 1433),
        options: {
            encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
            trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true'
        },
        pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        accessTtl: (_e = process.env.JWT_ACCESS_TTL) !== null && _e !== void 0 ? _e : '12h',
        iss: (_f = process.env.JWT_ISS) !== null && _f !== void 0 ? _f : 'api',
        aud: (_g = process.env.JWT_AUD) !== null && _g !== void 0 ? _g : 'api-clients'
    },
    cookie: {
        domain: (_h = process.env.COOKIE_DOMAIN) !== null && _h !== void 0 ? _h : 'localhost',
        secure: process.env.COOKIE_SECURE === 'true',
        refreshTtlMin: Number((_j = process.env.REFRESH_TTL_MIN) !== null && _j !== void 0 ? _j : 10080)
    },
    firebird: {
        host: process.env.FIREBIRD_HOST,
        port: Number((_k = process.env.FIREBIRD_PORT) !== null && _k !== void 0 ? _k : 3050),
        database: process.env.FIREBIRD_DATABASE,
        user: process.env.FIREBIRD_USER,
        password: process.env.FIREBIRD_PASSWORD
    },
    ftp: {
        host: (_l = process.env.FTP_HOST) !== null && _l !== void 0 ? _l : 'codigosingular.com',
        port: Number((_m = process.env.FTP_PORT) !== null && _m !== void 0 ? _m : 2222),
        user: (_o = process.env.FTP_USER) !== null && _o !== void 0 ? _o : 'cory',
        password: (_p = process.env.FTP_PASS) !== null && _p !== void 0 ? _p : 'Documentos123'
    }
};
