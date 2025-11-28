"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
var jsonwebtoken_1 = require("jsonwebtoken");
var uuid_1 = require("uuid");
var env_js_1 = require("../../../../config/env.js");
var crypto_js_1 = require("./crypto.js");
function signAccessToken(userId, roles, entidades, idOrganica0, idOrganica1, idOrganica2, idOrganica3) {
    var jti = (0, uuid_1.v4)();
    var payload = {
        sub: userId,
        roles: roles,
        entidades: entidades,
        jti: jti,
        iss: env_js_1.env.jwt.iss,
        aud: env_js_1.env.jwt.aud,
        idOrganica0: idOrganica0,
        idOrganica1: idOrganica1,
        idOrganica2: idOrganica2,
        idOrganica3: idOrganica3
    };
    var token = jsonwebtoken_1.default.sign(payload, env_js_1.env.jwt.accessSecret, {
        expiresIn: env_js_1.env.jwt.accessTtl
    });
    var decoded = jsonwebtoken_1.default.decode(token);
    var exp = decoded.exp;
    return { token: token, exp: exp, jti: jti };
}
function generateRefreshToken() {
    var token = (0, crypto_js_1.newRefreshTokenOpaque)();
    var hash = (0, crypto_js_1.sha256)(token);
    var ttlMinutes = env_js_1.env.cookie.refreshTtlMin;
    return { token: token, hash: hash, ttlMinutes: ttlMinutes };
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_js_1.env.jwt.accessSecret);
    }
    catch (error) {
        throw new Error('INVALID_TOKEN');
    }
}
