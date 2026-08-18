// Simple test to verify auth module DI resolution
const { container } = require('./dist/di/container.js');

console.log('🔍 Testing Auth Module DI Resolution...\n');

// Test 1: Check if AuthRepository is registered
try {
  const authRepo = container.resolve('authRepo');
  console.log('✅ AuthRepository resolved successfully');
  console.log('   Type:', authRepo.constructor.name);
} catch (error) {
  console.log('❌ AuthRepository resolution failed:', error.message);
}

// Test 2: Check if LoginCommand is registered
try {
  const loginCommand = container.resolve('loginCommand');
  console.log('✅ LoginCommand resolved successfully');
  console.log('   Type:', loginCommand.constructor.name);
} catch (error) {
  console.log('❌ LoginCommand resolution failed:', error.message);
}

// Test 3: Check if RegisterCommand is registered
try {
  const registerCommand = container.resolve('registerCommand');
  console.log('✅ RegisterCommand resolved successfully');
  console.log('   Type:', registerCommand.constructor.name);
} catch (error) {
  console.log('❌ RegisterCommand resolution failed:', error.message);
}

// Test 4: Check if RefreshTokenCommand is registered
try {
  const refreshTokenCommand = container.resolve('refreshTokenCommand');
  console.log('✅ RefreshTokenCommand resolved successfully');
  console.log('   Type:', refreshTokenCommand.constructor.name);
} catch (error) {
  console.log('❌ RefreshTokenCommand resolution failed:', error.message);
}

// Test 5: Check if GetUserByIdQuery is registered
try {
  const getUserByIdQuery = container.resolve('getUserByIdQuery');
  console.log('✅ GetUserByIdQuery resolved successfully');
  console.log('   Type:', getUserByIdQuery.constructor.name);
} catch (error) {
  console.log('❌ GetUserByIdQuery resolution failed:', error.message);
}

console.log('\n🎯 Auth Module DI Resolution Test Complete!');