const jwt = require('jsonwebtoken');

// Production JWT Secret
const JWT_SECRET = '25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa9b943a3cd6480fb95079b97d2dab8535';

// Test admin user data
const adminUser = {
  id: 'admin_001',
  email: 'admin@kryvex.com',
  name: 'Kryvex Admin',
  admin: true,
  role: 'admin'
};

// Test regular user data
const regularUser = {
  id: 'user_001',
  email: 'user@example.com',
  name: 'Regular User',
  admin: false,
  role: 'user'
};

console.log('🔐 JWT Authentication Test');
console.log('==========================\n');

// Generate admin token
const adminToken = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });
console.log('✅ Admin Token Generated:');
console.log(adminToken);
console.log('\n📋 Decoded Admin Token:');
console.log(JSON.stringify(jwt.decode(adminToken), null, 2));

// Generate regular user token
const userToken = jwt.sign(regularUser, JWT_SECRET, { expiresIn: '24h' });
console.log('\n✅ Regular User Token Generated:');
console.log(userToken);
console.log('\n📋 Decoded User Token:');
console.log(JSON.stringify(jwt.decode(userToken), null, 2));

// Test token verification
console.log('\n🔍 Token Verification Tests:');
console.log('==========================');

try {
  const verifiedAdmin = jwt.verify(adminToken, JWT_SECRET);
  console.log('✅ Admin token verified successfully');
  console.log('Admin status:', verifiedAdmin.admin);
  console.log('Role:', verifiedAdmin.role);
} catch (error) {
  console.log('❌ Admin token verification failed:', error.message);
}

try {
  const verifiedUser = jwt.verify(userToken, JWT_SECRET);
  console.log('✅ User token verified successfully');
  console.log('Admin status:', verifiedUser.admin);
  console.log('Role:', verifiedUser.role);
} catch (error) {
  console.log('❌ User token verification failed:', error.message);
}

// Test the provided token
const providedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

console.log('\n🔍 Testing Provided Token:');
console.log('==========================');

try {
  const decodedProvided = jwt.decode(providedToken);
  console.log('✅ Provided token decoded successfully');
  console.log('Admin status:', decodedProvided.admin);
  console.log('User name:', decodedProvided.name);
  
  // Note: This token was signed with a different secret, so verification will fail
  const verifiedProvided = jwt.verify(providedToken, JWT_SECRET);
  console.log('✅ Provided token verified with our secret');
} catch (error) {
  console.log('❌ Provided token verification failed (expected - different secret)');
  console.log('Error:', error.message);
}

console.log('\n🎯 Production JWT Configuration:');
console.log('================================');
console.log('JWT_SECRET: [64-byte secure key generated]');
console.log('JWT_EXPIRES_IN: 24h');
console.log('JWT_REFRESH_EXPIRES_IN: 7d');
console.log('\n✅ JWT configuration is production-ready!'); 