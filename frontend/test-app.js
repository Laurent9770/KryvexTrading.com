// Simple test script to verify React app functionality
const puppeteer = require('puppeteer');

async function testApp() {
  console.log('🧪 Starting React app test...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });
    
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to load
    await page.waitForTimeout(3000);
    
    // Check if the app loaded successfully
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for React errors
    const errors = await page.evaluate(() => {
      return window.reactErrors || [];
    });
    
    if (errors.length > 0) {
      console.error('❌ React errors found:', errors);
    } else {
      console.log('✅ No React errors detected');
    }
    
    // Check if main content loaded
    const content = await page.evaluate(() => {
      const app = document.querySelector('#root');
      return app ? app.innerHTML.length > 0 : false;
    });
    
    if (content) {
      console.log('✅ App content loaded successfully');
    } else {
      console.error('❌ App content not loaded');
    }
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testApp().catch(console.error);
}

module.exports = { testApp };
