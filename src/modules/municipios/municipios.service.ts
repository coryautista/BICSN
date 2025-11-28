
// Legacy service functions have been migrated to use DI pattern
// Routes now use Commands and Queries directly via req.diScope.resolve()
// This file can be removed in the future if no legacy code depends on it