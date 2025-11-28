"use strict";
/**
 * Custom Error Classes for Domain-Specific Errors
 */
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
exports.BusinessRuleViolationError = exports.InternalError = exports.ExternalServiceError = exports.DatabaseError = exports.BadRequestError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.DomainError = void 0;
exports.toErrorResponse = toErrorResponse;
exports.isDomainError = isDomainError;
exports.getStatusCode = getStatusCode;
var DomainError = /** @class */ (function (_super) {
    __extends(DomainError, _super);
    function DomainError(message, code, statusCode, details) {
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.statusCode = statusCode;
        _this.details = details;
        _this.name = _this.constructor.name;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return DomainError;
}(Error));
exports.DomainError = DomainError;
// 4xx Client Errors
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, details) {
        return _super.call(this, message, 'VALIDATION_ERROR', 400, details) || this;
    }
    return ValidationError;
}(DomainError));
exports.ValidationError = ValidationError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(resource, id) {
        var message = id
            ? "".concat(resource, " with id ").concat(id, " not found")
            : "".concat(resource, " not found");
        return _super.call(this, message, 'NOT_FOUND', 404) || this;
    }
    return NotFoundError;
}(DomainError));
exports.NotFoundError = NotFoundError;
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message) {
        if (message === void 0) { message = 'Unauthorized access'; }
        return _super.call(this, message, 'UNAUTHORIZED', 401) || this;
    }
    return UnauthorizedError;
}(DomainError));
exports.UnauthorizedError = UnauthorizedError;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message) {
        if (message === void 0) { message = 'Access forbidden'; }
        return _super.call(this, message, 'FORBIDDEN', 403) || this;
    }
    return ForbiddenError;
}(DomainError));
exports.ForbiddenError = ForbiddenError;
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(resource, reason) {
        var message = reason
            ? "".concat(resource, ": ").concat(reason)
            : "".concat(resource, " already exists");
        return _super.call(this, message, 'CONFLICT', 409) || this;
    }
    return ConflictError;
}(DomainError));
exports.ConflictError = ConflictError;
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message, details) {
        return _super.call(this, message, 'BAD_REQUEST', 400, details) || this;
    }
    return BadRequestError;
}(DomainError));
exports.BadRequestError = BadRequestError;
// 5xx Server Errors
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message, details) {
        return _super.call(this, message, 'DATABASE_ERROR', 500, details) || this;
    }
    return DatabaseError;
}(DomainError));
exports.DatabaseError = DatabaseError;
var ExternalServiceError = /** @class */ (function (_super) {
    __extends(ExternalServiceError, _super);
    function ExternalServiceError(service, message, details) {
        return _super.call(this, "".concat(service, ": ").concat(message), 'EXTERNAL_SERVICE_ERROR', 503, details) || this;
    }
    return ExternalServiceError;
}(DomainError));
exports.ExternalServiceError = ExternalServiceError;
var InternalError = /** @class */ (function (_super) {
    __extends(InternalError, _super);
    function InternalError(message, details) {
        if (message === void 0) { message = 'Internal server error'; }
        return _super.call(this, message, 'INTERNAL_ERROR', 500, details) || this;
    }
    return InternalError;
}(DomainError));
exports.InternalError = InternalError;
// Business Logic Errors
var BusinessRuleViolationError = /** @class */ (function (_super) {
    __extends(BusinessRuleViolationError, _super);
    function BusinessRuleViolationError(rule, details) {
        return _super.call(this, "Business rule violation: ".concat(rule), 'BUSINESS_RULE_VIOLATION', 422, details) || this;
    }
    return BusinessRuleViolationError;
}(DomainError));
exports.BusinessRuleViolationError = BusinessRuleViolationError;
/**
 * Error Response Builder
 */
function toErrorResponse(error) {
    if (error instanceof DomainError) {
        return {
            ok: false,
            error: __assign({ message: error.message, code: error.code }, (error.details && { details: error.details }))
        };
    }
    // Unknown error - don't leak internal details
    return {
        ok: false,
        error: {
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR'
        }
    };
}
/**
 * Check if error is a known domain error
 */
function isDomainError(error) {
    return error instanceof DomainError;
}
/**
 * Get HTTP status code from error
 */
function getStatusCode(error) {
    if (error instanceof DomainError) {
        return error.statusCode;
    }
    return 500;
}
