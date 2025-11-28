"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutFailedError = exports.TokenRefreshFailedError = exports.LoginFailedError = exports.RegistrationFailedError = exports.SuspiciousActivityError = exports.RateLimitExceededError = exports.AuthTimeoutError = exports.AuthConnectionError = exports.AuthSystemError = exports.UnauthorizedAccessError = exports.InsufficientPermissionsError = exports.MissingTokenError = exports.RevokedTokenError = exports.ExpiredTokenError = exports.InvalidTokenError = exports.AccountDisabledError = exports.AccountLockedError = exports.UserNotFoundError = exports.InvalidCredentialsError = exports.InvalidEmailFormatError = exports.WeakPasswordError = exports.InvalidRegistrationDataError = exports.UserAlreadyExistsError = void 0;
var errors_js_1 = require("../../../utils/errors.js");
// Errores de registro de usuarios
var UserAlreadyExistsError = /** @class */ (function (_super) {
    __extends(UserAlreadyExistsError, _super);
    function UserAlreadyExistsError(identifier, field, details) {
        if (field === void 0) { field = 'username'; }
        return _super.call(this, 'USER_ALREADY_EXISTS', "Ya existe un usuario con ".concat(field, ": ").concat(identifier), __assign({ identifier: identifier, field: field }, details)) || this;
    }
    return UserAlreadyExistsError;
}(errors_js_1.DomainError));
exports.UserAlreadyExistsError = UserAlreadyExistsError;
var InvalidRegistrationDataError = /** @class */ (function (_super) {
    __extends(InvalidRegistrationDataError, _super);
    function InvalidRegistrationDataError(message, details) {
        if (message === void 0) { message = 'Datos de registro inválidos'; }
        return _super.call(this, 'INVALID_REGISTRATION_DATA', message, details) || this;
    }
    return InvalidRegistrationDataError;
}(errors_js_1.DomainError));
exports.InvalidRegistrationDataError = InvalidRegistrationDataError;
var WeakPasswordError = /** @class */ (function (_super) {
    __extends(WeakPasswordError, _super);
    function WeakPasswordError(details) {
        return _super.call(this, 'WEAK_PASSWORD', 'La contraseña no cumple con los requisitos de seguridad', details) || this;
    }
    return WeakPasswordError;
}(errors_js_1.DomainError));
exports.WeakPasswordError = WeakPasswordError;
var InvalidEmailFormatError = /** @class */ (function (_super) {
    __extends(InvalidEmailFormatError, _super);
    function InvalidEmailFormatError(email, details) {
        return _super.call(this, 'INVALID_EMAIL_FORMAT', "Formato de email inv\u00E1lido: ".concat(email), __assign({ email: email }, details)) || this;
    }
    return InvalidEmailFormatError;
}(errors_js_1.DomainError));
exports.InvalidEmailFormatError = InvalidEmailFormatError;
// Errores de autenticación y login
var InvalidCredentialsError = /** @class */ (function (_super) {
    __extends(InvalidCredentialsError, _super);
    function InvalidCredentialsError(details) {
        return _super.call(this, 'INVALID_CREDENTIALS', 'Credenciales de acceso inválidas', details) || this;
    }
    return InvalidCredentialsError;
}(errors_js_1.DomainError));
exports.InvalidCredentialsError = InvalidCredentialsError;
var UserNotFoundError = /** @class */ (function (_super) {
    __extends(UserNotFoundError, _super);
    function UserNotFoundError(identifier, details) {
        return _super.call(this, 'USER_NOT_FOUND', "Usuario no encontrado: ".concat(identifier), __assign({ identifier: identifier }, details)) || this;
    }
    return UserNotFoundError;
}(errors_js_1.DomainError));
exports.UserNotFoundError = UserNotFoundError;
var AccountLockedError = /** @class */ (function (_super) {
    __extends(AccountLockedError, _super);
    function AccountLockedError(userId, lockoutEnd, details) {
        return _super.call(this, 'ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos de acceso', __assign({ userId: userId, lockoutEnd: lockoutEnd === null || lockoutEnd === void 0 ? void 0 : lockoutEnd.toISOString() }, details)) || this;
    }
    return AccountLockedError;
}(errors_js_1.DomainError));
exports.AccountLockedError = AccountLockedError;
var AccountDisabledError = /** @class */ (function (_super) {
    __extends(AccountDisabledError, _super);
    function AccountDisabledError(userId, details) {
        return _super.call(this, 'ACCOUNT_DISABLED', 'Cuenta de usuario deshabilitada', __assign({ userId: userId }, details)) || this;
    }
    return AccountDisabledError;
}(errors_js_1.DomainError));
exports.AccountDisabledError = AccountDisabledError;
// Errores de tokens JWT
var InvalidTokenError = /** @class */ (function (_super) {
    __extends(InvalidTokenError, _super);
    function InvalidTokenError(tokenType, details) {
        if (tokenType === void 0) { tokenType = 'token'; }
        return _super.call(this, 'INVALID_TOKEN', "".concat(tokenType, " inv\u00E1lido o malformado"), __assign({ tokenType: tokenType }, details)) || this;
    }
    return InvalidTokenError;
}(errors_js_1.DomainError));
exports.InvalidTokenError = InvalidTokenError;
var ExpiredTokenError = /** @class */ (function (_super) {
    __extends(ExpiredTokenError, _super);
    function ExpiredTokenError(tokenType, details) {
        if (tokenType === void 0) { tokenType = 'token'; }
        return _super.call(this, 'EXPIRED_TOKEN', "".concat(tokenType, " expirado"), __assign({ tokenType: tokenType }, details)) || this;
    }
    return ExpiredTokenError;
}(errors_js_1.DomainError));
exports.ExpiredTokenError = ExpiredTokenError;
var RevokedTokenError = /** @class */ (function (_super) {
    __extends(RevokedTokenError, _super);
    function RevokedTokenError(tokenType, jti, details) {
        if (tokenType === void 0) { tokenType = 'token'; }
        return _super.call(this, 'REVOKED_TOKEN', "".concat(tokenType, " revocado"), __assign({ tokenType: tokenType, jti: jti }, details)) || this;
    }
    return RevokedTokenError;
}(errors_js_1.DomainError));
exports.RevokedTokenError = RevokedTokenError;
var MissingTokenError = /** @class */ (function (_super) {
    __extends(MissingTokenError, _super);
    function MissingTokenError(tokenType, details) {
        if (tokenType === void 0) { tokenType = 'token'; }
        return _super.call(this, 'MISSING_TOKEN', "".concat(tokenType, " requerido pero no proporcionado"), __assign({ tokenType: tokenType }, details)) || this;
    }
    return MissingTokenError;
}(errors_js_1.DomainError));
exports.MissingTokenError = MissingTokenError;
// Errores de permisos y autorización
var InsufficientPermissionsError = /** @class */ (function (_super) {
    __extends(InsufficientPermissionsError, _super);
    function InsufficientPermissionsError(requiredRoles, userRoles, details) {
        return _super.call(this, 'INSUFFICIENT_PERMISSIONS', 'Permisos insuficientes para realizar esta acción', __assign({ requiredRoles: requiredRoles, userRoles: userRoles }, details)) || this;
    }
    return InsufficientPermissionsError;
}(errors_js_1.DomainError));
exports.InsufficientPermissionsError = InsufficientPermissionsError;
var UnauthorizedAccessError = /** @class */ (function (_super) {
    __extends(UnauthorizedAccessError, _super);
    function UnauthorizedAccessError(resource, details) {
        return _super.call(this, 'UNAUTHORIZED_ACCESS', "Acceso no autorizado".concat(resource ? " a: ".concat(resource) : ''), __assign({ resource: resource }, details)) || this;
    }
    return UnauthorizedAccessError;
}(errors_js_1.DomainError));
exports.UnauthorizedAccessError = UnauthorizedAccessError;
// Errores de sistema y seguridad
var AuthSystemError = /** @class */ (function (_super) {
    __extends(AuthSystemError, _super);
    function AuthSystemError(message, details) {
        if (message === void 0) { message = 'Error interno del sistema de autenticación'; }
        return _super.call(this, 'AUTH_SYSTEM_ERROR', message, details) || this;
    }
    return AuthSystemError;
}(errors_js_1.DomainError));
exports.AuthSystemError = AuthSystemError;
var AuthConnectionError = /** @class */ (function (_super) {
    __extends(AuthConnectionError, _super);
    function AuthConnectionError(message, details) {
        if (message === void 0) { message = 'Error de conexión con el sistema de autenticación'; }
        return _super.call(this, 'AUTH_CONNECTION_ERROR', message, details) || this;
    }
    return AuthConnectionError;
}(errors_js_1.DomainError));
exports.AuthConnectionError = AuthConnectionError;
var AuthTimeoutError = /** @class */ (function (_super) {
    __extends(AuthTimeoutError, _super);
    function AuthTimeoutError(operation, timeoutMs, details) {
        return _super.call(this, 'AUTH_TIMEOUT', "Timeout en operaci\u00F3n de autenticaci\u00F3n ".concat(operation, " despu\u00E9s de ").concat(timeoutMs, "ms"), __assign({ operation: operation, timeoutMs: timeoutMs }, details)) || this;
    }
    return AuthTimeoutError;
}(errors_js_1.DomainError));
exports.AuthTimeoutError = AuthTimeoutError;
var RateLimitExceededError = /** @class */ (function (_super) {
    __extends(RateLimitExceededError, _super);
    function RateLimitExceededError(identifier, limit, windowMs, details) {
        return _super.call(this, 'RATE_LIMIT_EXCEEDED', "L\u00EDmite de solicitudes excedido para ".concat(identifier, ". M\u00E1ximo ").concat(limit, " solicitudes por ").concat(windowMs, "ms"), __assign({ identifier: identifier, limit: limit, windowMs: windowMs }, details)) || this;
    }
    return RateLimitExceededError;
}(errors_js_1.DomainError));
exports.RateLimitExceededError = RateLimitExceededError;
var SuspiciousActivityError = /** @class */ (function (_super) {
    __extends(SuspiciousActivityError, _super);
    function SuspiciousActivityError(activity, userId, ip, details) {
        return _super.call(this, 'SUSPICIOUS_ACTIVITY', "Actividad sospechosa detectada: ".concat(activity), __assign({ activity: activity, userId: userId, ip: ip }, details)) || this;
    }
    return SuspiciousActivityError;
}(errors_js_1.DomainError));
exports.SuspiciousActivityError = SuspiciousActivityError;
// Errores específicos de operaciones
var RegistrationFailedError = /** @class */ (function (_super) {
    __extends(RegistrationFailedError, _super);
    function RegistrationFailedError(reason, details) {
        return _super.call(this, 'REGISTRATION_FAILED', "Registro de usuario fallido: ".concat(reason), __assign({ reason: reason }, details)) || this;
    }
    return RegistrationFailedError;
}(errors_js_1.DomainError));
exports.RegistrationFailedError = RegistrationFailedError;
var LoginFailedError = /** @class */ (function (_super) {
    __extends(LoginFailedError, _super);
    function LoginFailedError(reason, details) {
        return _super.call(this, 'LOGIN_FAILED', "Inicio de sesi\u00F3n fallido: ".concat(reason), __assign({ reason: reason }, details)) || this;
    }
    return LoginFailedError;
}(errors_js_1.DomainError));
exports.LoginFailedError = LoginFailedError;
var TokenRefreshFailedError = /** @class */ (function (_super) {
    __extends(TokenRefreshFailedError, _super);
    function TokenRefreshFailedError(reason, details) {
        return _super.call(this, 'TOKEN_REFRESH_FAILED', "Refresco de token fallido: ".concat(reason), __assign({ reason: reason }, details)) || this;
    }
    return TokenRefreshFailedError;
}(errors_js_1.DomainError));
exports.TokenRefreshFailedError = TokenRefreshFailedError;
var LogoutFailedError = /** @class */ (function (_super) {
    __extends(LogoutFailedError, _super);
    function LogoutFailedError(reason, details) {
        return _super.call(this, 'LOGOUT_FAILED', "Cierre de sesi\u00F3n fallido: ".concat(reason), __assign({ reason: reason }, details)) || this;
    }
    return LogoutFailedError;
}(errors_js_1.DomainError));
exports.LogoutFailedError = LogoutFailedError;
