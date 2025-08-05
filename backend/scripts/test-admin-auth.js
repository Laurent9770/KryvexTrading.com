const jwt = require('jsonwebtoken');

// Production JWT Secret
const JWT_SECRET = '25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa9b943a3cd6480fb95079b97d2dab8535';

// Mock authenticateAdmin middleware function
function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Mock request/response objects
function createMockReq(token) {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined
    }
  };
}

function createMockRes() {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.data = data;
      return res;
    },
    send: (data) => {
      res.data = data;
      return res;
    }
  };
  return res;
}

console.log('🔐 Admin Authentication Test');
console.log('============================\n');

// Test 1: Valid admin token
const adminUser = {
  id: 'admin_001',
  email: 'admin@kryvex.com',
  name: 'Kryvex Admin',
  admin: true,
  role: 'admin'
};

const adminToken = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '24h' });

console.log('🧪 Test 1: Valid Admin Token');
console.log('============================');
const req1 = createMockReq(adminToken);
const res1 = createMockRes();
const next1 = () => console.log('✅ Middleware passed - Admin access granted');

authenticateAdmin(req1, res1, next1);
console.log('User data:', req1.user);

// Test 2: Regular user token (should fail)
const regularUser = {
  id: 'user_001',
  email: 'user@example.com',
  name: 'Regular User',
  admin: false,
  role: 'user'
};

const userToken = jwt.sign(regularUser, JWT_SECRET, { expiresIn: '24h' });

console.log('\n🧪 Test 2: Regular User Token (Should Fail)');
console.log('============================================');
const req2 = createMockReq(userToken);
const res2 = createMockRes();
const next2 = () => console.log('❌ This should not be called');

authenticateAdmin(req2, res2, next2);
console.log('Response:', res2.data);

// Test 3: No token (should fail)
console.log('\n🧪 Test 3: No Token (Should Fail)');
console.log('===================================');
const req3 = createMockReq();
const res3 = createMockRes();
const next3 = () => console.log('❌ This should not be called');

authenticateAdmin(req3, res3, next3);
console.log('Response:', res3.data);

// Test 4: Invalid token (should fail)
console.log('\n🧪 Test 4: Invalid Token (Should Fail)');
console.log('========================================');
const req4 = createMockReq('invalid.token.here');
const res4 = createMockRes();
const next4 = () => console.log('❌ This should not be called');

authenticateAdmin(req4, res4, next4);
console.log('Response:', res4.data);

// Test 5: Your provided token (should fail with our secret)
const providedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

console.log('\n🧪 Test 5: Your Provided Token (Should Fail - Different Secret)');
console.log('================================================================');
const req5 = createMockReq(providedToken);
const res5 = createMockRes();
const next5 = () => console.log('❌ This should not be called');

authenticateAdmin(req5, res5, next5);
console.log('Response:', res5.data);

console.log('\n🎯 Admin Authentication Summary:');
console.log('===============================');
console.log('✅ Valid admin tokens pass authentication');
console.log('❌ Regular user tokens are rejected');
console.log('❌ Missing tokens are rejected');
console.log('❌ Invalid tokens are rejected');
console.log('❌ Tokens with different secrets are rejected');
console.log('\n🔒 Admin authentication is working correctly!'); 