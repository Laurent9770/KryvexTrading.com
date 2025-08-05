const https = require('https');

console.log('🔍 Testing Render Deployment Status');
console.log('===================================\n');

const endpoints = [
  {
    name: 'Backend Health Check',
    url: 'https://kryvextrading-com.onrender.com/api/health',
    expected: 'healthy'
  },
  {
    name: 'Backend Root',
    url: 'https://kryvextrading-com.onrender.com/',
    expected: 'Not found'
  },
  {
    name: 'Frontend Root',
    url: 'https://kryvex-frontend.onrender.com/',
    expected: 'HTML'
  },
  {
    name: 'Frontend Admin',
    url: 'https://kryvex-frontend.onrender.com/admin',
    expected: 'HTML'
  }
];

async function testEndpoint(name, url, expected) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const status = res.statusCode;
        const contentType = res.headers['content-type'] || '';
        const isSuccess = status >= 200 && status < 300;
        const hasExpectedContent = data.includes(expected) || contentType.includes('text/html');
        
        console.log(`${name}:`);
        console.log(`  URL: ${url}`);
        console.log(`  Status: ${status}`);
        console.log(`  Content-Type: ${contentType}`);
        console.log(`  Success: ${isSuccess ? '✅' : '❌'}`);
        console.log(`  Expected Content: ${hasExpectedContent ? '✅' : '❌'}`);
        console.log(`  Response Length: ${data.length} bytes`);
        console.log('');
        
        resolve({ name, status, isSuccess, hasExpectedContent });
      });
    });
    
    req.on('error', (error) => {
      console.log(`${name}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Error: ${error.message}`);
      console.log(`  Success: ❌`);
      console.log('');
      resolve({ name, status: 0, isSuccess: false, hasExpectedContent: false });
    });
    
    req.setTimeout(10000, () => {
      console.log(`${name}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Error: Timeout`);
      console.log(`  Success: ❌`);
      console.log('');
      req.destroy();
      resolve({ name, status: 0, isSuccess: false, hasExpectedContent: false });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing all endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url, endpoint.expected);
    results.push(result);
  }
  
  console.log('📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.isSuccess);
  const failed = results.filter(r => !r.isSuccess);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failed.forEach(f => console.log(`  - ${f.name}`));
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Working Endpoints:');
    successful.forEach(s => console.log(`  - ${s.name}`));
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('===============');
  
  if (failed.length > 0) {
    console.log('1. Check Render deployment logs');
    console.log('2. Verify environment variables are set');
    console.log('3. Ensure build process completed successfully');
    console.log('4. Check if services are running');
  } else {
    console.log('✅ All endpoints are working!');
    console.log('🚀 Your deployment is successful!');
  }
}

runTests(); 