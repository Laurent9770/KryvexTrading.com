// Admin Dashboard Test Script
// This script tests all admin dashboard tabs to ensure they're properly connected to the backend

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const ADMIN_TOKEN = 'your-admin-jwt-token-here'; // Replace with actual admin token

class AdminDashboardTester {
  constructor() {
    this.results = {
      users: { passed: false, errors: [] },
      kyc: { passed: false, errors: [] },
      deposits: { passed: false, errors: [] },
      withdrawals: { passed: false, errors: [] },
      wallets: { passed: false, errors: [] },
      tradingControl: { passed: false, errors: [] },
      audit: { passed: false, errors: [] },
      notifications: { passed: false, errors: [] }
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  // Test 1: Users Tab
  async testUsersTab() {
    console.log('🧪 Testing Users Tab...');
    
    try {
      // Test 1.1: Get all users
      const users = await this.makeRequest('/api/admin/users');
      console.log(`✅ Users loaded: ${users.data?.length || 0} users`);
      
      // Test 1.2: Get specific user details
      if (users.data && users.data.length > 0) {
        const userId = users.data[0].id;
        const userDetails = await this.makeRequest(`/api/admin/users/${userId}`);
        console.log(`✅ User details loaded for: ${userDetails.data?.email}`);
      }
      
      // Test 1.3: Add funds to user
      if (users.data && users.data.length > 0) {
        const userId = users.data[0].id;
        const addFundsResult = await this.makeRequest(`/api/admin/users/${userId}/fund/add`, {
          method: 'POST',
          body: JSON.stringify({
            asset: 'USDT',
            amount: 100,
            reason: 'Test fund addition'
          })
        });
        console.log(`✅ Funds added: ${addFundsResult.message}`);
      }
      
      // Test 1.4: Remove funds from user
      if (users.data && users.data.length > 0) {
        const userId = users.data[0].id;
        const removeFundsResult = await this.makeRequest(`/api/admin/users/${userId}/fund/remove`, {
          method: 'POST',
          body: JSON.stringify({
            asset: 'USDT',
            amount: 50,
            reason: 'Test fund removal'
          })
        });
        console.log(`✅ Funds removed: ${removeFundsResult.message}`);
      }
      
      this.results.users.passed = true;
      console.log('✅ Users Tab: All tests passed');
      
    } catch (error) {
      this.results.users.errors.push(error.message);
      console.log(`❌ Users Tab: ${error.message}`);
    }
  }

  // Test 2: KYC Tab
  async testKYCTab() {
    console.log('🧪 Testing KYC Tab...');
    
    try {
      // Test 2.1: Get all KYC submissions
      const kycSubmissions = await this.makeRequest('/api/admin/kyc');
      console.log(`✅ KYC submissions loaded: ${kycSubmissions.data?.length || 0} submissions`);
      
      // Test 2.2: Approve KYC submission
      if (kycSubmissions.data && kycSubmissions.data.length > 0) {
        const submissionId = kycSubmissions.data[0].id;
        const approveResult = await this.makeRequest(`/api/admin/kyc/${submissionId}/approve`, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Test approval'
          })
        });
        console.log(`✅ KYC approved: ${approveResult.message}`);
      }
      
      // Test 2.3: Reject KYC submission
      if (kycSubmissions.data && kycSubmissions.data.length > 1) {
        const submissionId = kycSubmissions.data[1].id;
        const rejectResult = await this.makeRequest(`/api/admin/kyc/${submissionId}/reject`, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Test rejection'
          })
        });
        console.log(`✅ KYC rejected: ${rejectResult.message}`);
      }
      
      this.results.kyc.passed = true;
      console.log('✅ KYC Tab: All tests passed');
      
    } catch (error) {
      this.results.kyc.errors.push(error.message);
      console.log(`❌ KYC Tab: ${error.message}`);
    }
  }

  // Test 3: Deposits Tab
  async testDepositsTab() {
    console.log('🧪 Testing Deposits Tab...');
    
    try {
      // Test 3.1: Get all deposits
      const deposits = await this.makeRequest('/api/admin/deposits');
      console.log(`✅ Deposits loaded: ${deposits.data?.length || 0} deposits`);
      
      // Test 3.2: Approve deposit
      if (deposits.data && deposits.data.length > 0) {
        const depositId = deposits.data[0].id;
        const approveResult = await this.makeRequest(`/api/admin/deposits/${depositId}/approve`, {
          method: 'POST'
        });
        console.log(`✅ Deposit approved: ${approveResult.message}`);
      }
      
      // Test 3.3: Reject deposit
      if (deposits.data && deposits.data.length > 1) {
        const depositId = deposits.data[1].id;
        const rejectResult = await this.makeRequest(`/api/admin/deposits/${depositId}/reject`, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Test rejection'
          })
        });
        console.log(`✅ Deposit rejected: ${rejectResult.message}`);
      }
      
      this.results.deposits.passed = true;
      console.log('✅ Deposits Tab: All tests passed');
      
    } catch (error) {
      this.results.deposits.errors.push(error.message);
      console.log(`❌ Deposits Tab: ${error.message}`);
    }
  }

  // Test 4: Withdrawals Tab
  async testWithdrawalsTab() {
    console.log('🧪 Testing Withdrawals Tab...');
    
    try {
      // Test 4.1: Get all withdrawals
      const withdrawals = await this.makeRequest('/api/admin/withdrawals');
      console.log(`✅ Withdrawals loaded: ${withdrawals.data?.length || 0} withdrawals`);
      
      // Test 4.2: Approve withdrawal
      if (withdrawals.data && withdrawals.data.length > 0) {
        const withdrawalId = withdrawals.data[0].id;
        const approveResult = await this.makeRequest(`/api/admin/withdrawals/${withdrawalId}/approve`, {
          method: 'POST'
        });
        console.log(`✅ Withdrawal approved: ${approveResult.message}`);
      }
      
      // Test 4.3: Reject withdrawal
      if (withdrawals.data && withdrawals.data.length > 1) {
        const withdrawalId = withdrawals.data[1].id;
        const rejectResult = await this.makeRequest(`/api/admin/withdrawals/${withdrawalId}/reject`, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Test rejection'
          })
        });
        console.log(`✅ Withdrawal rejected: ${rejectResult.message}`);
      }
      
      this.results.withdrawals.passed = true;
      console.log('✅ Withdrawals Tab: All tests passed');
      
    } catch (error) {
      this.results.withdrawals.errors.push(error.message);
      console.log(`❌ Withdrawals Tab: ${error.message}`);
    }
  }

  // Test 5: Wallets Tab
  async testWalletsTab() {
    console.log('🧪 Testing Wallets Tab...');
    
    try {
      // Test 5.1: Get all wallets
      const wallets = await this.makeRequest('/api/admin/wallets');
      console.log(`✅ Wallets loaded: ${wallets.data?.length || 0} wallets`);
      
      // Test 5.2: Get fund actions
      const fundActions = await this.makeRequest('/api/admin/wallets/fund-actions');
      console.log(`✅ Fund actions loaded: ${fundActions.data?.length || 0} actions`);
      
      this.results.wallets.passed = true;
      console.log('✅ Wallets Tab: All tests passed');
      
    } catch (error) {
      this.results.wallets.errors.push(error.message);
      console.log(`❌ Wallets Tab: ${error.message}`);
    }
  }

  // Test 6: Trading Control Tab
  async testTradingControlTab() {
    console.log('🧪 Testing Trading Control Tab...');
    
    try {
      // Test 6.1: Get all trades
      const trades = await this.makeRequest('/api/admin/trades');
      console.log(`✅ Trades loaded: ${trades.data?.length || 0} trades`);
      
      // Test 6.2: Get trade stats
      const tradeStats = await this.makeRequest('/api/admin/trades/stats');
      console.log(`✅ Trade stats loaded: ${JSON.stringify(tradeStats.data)}`);
      
      // Test 6.3: Set trade override
      const users = await this.makeRequest('/api/admin/users');
      if (users.data && users.data.length > 0) {
        const userId = users.data[0].id;
        const overrideResult = await this.makeRequest('/api/admin/trade-override', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            mode: 'win'
          })
        });
        console.log(`✅ Trade override set: ${overrideResult.message}`);
      }
      
      this.results.tradingControl.passed = true;
      console.log('✅ Trading Control Tab: All tests passed');
      
    } catch (error) {
      this.results.tradingControl.errors.push(error.message);
      console.log(`❌ Trading Control Tab: ${error.message}`);
    }
  }

  // Test 7: Audit Tab
  async testAuditTab() {
    console.log('🧪 Testing Audit Tab...');
    
    try {
      // Test 7.1: Get audit logs
      const auditLogs = await this.makeRequest('/api/admin/audit-logs');
      console.log(`✅ Audit logs loaded: ${auditLogs.data?.length || 0} logs`);
      
      this.results.audit.passed = true;
      console.log('✅ Audit Tab: All tests passed');
      
    } catch (error) {
      this.results.audit.errors.push(error.message);
      console.log(`❌ Audit Tab: ${error.message}`);
    }
  }

  // Test 8: Notifications Tab
  async testNotificationsTab() {
    console.log('🧪 Testing Notifications Tab...');
    
    try {
      // Test 8.1: Send notification to specific user
      const users = await this.makeRequest('/api/admin/users');
      if (users.data && users.data.length > 0) {
        const userId = users.data[0].id;
        const sendResult = await this.makeRequest('/api/admin/notifications/send', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            title: 'Test Notification',
            message: 'This is a test notification from admin',
            type: 'admin'
          })
        });
        console.log(`✅ Notification sent: ${sendResult.message}`);
      }
      
      // Test 8.2: Broadcast notification
      const broadcastResult = await this.makeRequest('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Broadcast',
          message: 'This is a test broadcast from admin',
          type: 'admin'
        })
      });
      console.log(`✅ Broadcast sent: ${broadcastResult.message}`);
      
      this.results.notifications.passed = true;
      console.log('✅ Notifications Tab: All tests passed');
      
    } catch (error) {
      this.results.notifications.errors.push(error.message);
      console.log(`❌ Notifications Tab: ${error.message}`);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Admin Dashboard Tests...\n');
    
    await this.testUsersTab();
    await this.testKYCTab();
    await this.testDepositsTab();
    await this.testWithdrawalsTab();
    await this.testWalletsTab();
    await this.testTradingControlTab();
    await this.testAuditTab();
    await this.testNotificationsTab();
    
    this.printResults();
  }

  // Print test results
  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    Object.entries(this.results).forEach(([tab, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${tab.toUpperCase()}: ${status}`);
      
      if (!result.passed && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`  - Error: ${error}`);
        });
      }
    });
    
    console.log('\n========================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All admin dashboard tabs are working correctly!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminDashboardTester;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const tester = new AdminDashboardTester();
  tester.runAllTests().catch(console.error);
} 