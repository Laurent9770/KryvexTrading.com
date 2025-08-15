import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import walletSyncService from '@/services/walletSyncService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const DatabaseDebugger: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const newResults: TestResult[] = [];

    // Test 1: Check authentication
    try {
      const { data: { session } } = await supabase.auth.getSession();
      newResults.push({
        name: 'Authentication',
        status: session ? 'success' : 'error',
        message: session ? 'User is authenticated' : 'No active session found',
        data: { userId: session?.user?.id, email: session?.user?.email }
      });
    } catch (error) {
      newResults.push({
        name: 'Authentication',
        status: 'error',
        message: `Authentication error: ${error}`,
        data: error
      });
    }

    // Test 2: Check if user exists in database
    if (user?.id) {
      try {
        const { data: userData, error } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        newResults.push({
          name: 'User Wallet Data',
          status: error ? 'error' : userData && userData.length > 0 ? 'success' : 'error',
          message: error ? `Database error: ${error.message}` : 
                   userData && userData.length > 0 ? 'User has wallet data' : 'No wallet data found',
          data: { walletCount: userData?.length || 0, error }
        });
      } catch (error) {
        newResults.push({
          name: 'User Wallet Data',
          status: 'error',
          message: `Failed to check wallet data: ${error}`,
          data: error
        });
      }
    }

    // Test 3: Test sync function
    if (user?.id) {
      try {
        const walletData = await walletSyncService.syncWalletFromDatabase(user.id);
        newResults.push({
          name: 'Sync Function',
          status: 'success',
          message: `Successfully synced ${walletData.length} wallet entries`,
          data: walletData
        });
      } catch (error) {
        newResults.push({
          name: 'Sync Function',
          status: 'error',
          message: `Sync function failed: ${error}`,
          data: error
        });
      }
    }

    // Test 4: Test wallet summary function
    if (user?.id) {
      try {
        const walletSummary = await walletSyncService.getWalletSummary(user.id);
        newResults.push({
          name: 'Wallet Summary',
          status: walletSummary.success ? 'success' : 'error',
          message: walletSummary.success ? 'Successfully got wallet summary' : 'Wallet summary failed',
          data: walletSummary
        });
      } catch (error) {
        newResults.push({
          name: 'Wallet Summary',
          status: 'error',
          message: `Wallet summary failed: ${error}`,
          data: error
        });
      }
    }

    // Test 5: Check RLS policies
    try {
      const { data: policies, error } = await supabase
        .from('user_wallets')
        .select('*')
        .limit(1);

      newResults.push({
        name: 'RLS Policies',
        status: error && error.code === 'PGRST116' ? 'error' : 'success',
        message: error && error.code === 'PGRST116' ? 
                 'RLS policy blocked access - policies may be misconfigured' : 
                 'RLS policies working correctly',
        data: { error: error?.code, message: error?.message }
      });
    } catch (error) {
      newResults.push({
        name: 'RLS Policies',
        status: 'error',
        message: `RLS test failed: ${error}`,
        data: error
      });
    }

    // Test 6: Check function permissions
    try {
      const { data: functionTest, error } = await supabase
        .rpc('is_admin');

      newResults.push({
        name: 'Function Permissions',
        status: error ? 'error' : 'success',
        message: error ? `Function permission error: ${error.message}` : 'Functions accessible',
        data: { error: error?.code, message: error?.message }
      });
    } catch (error) {
      newResults.push({
        name: 'Function Permissions',
        status: 'error',
        message: `Function test failed: ${error}`,
        data: error
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'success':
        return <Badge className="bg-green-500/10 text-green-400">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Database Connection Debugger</h2>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning || !isAuthenticated}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {!isAuthenticated && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-yellow-400">Please log in to run database tests</p>
        </div>
      )}

      {isAuthenticated && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Current User</h3>
            <p className="text-slate-300">ID: {user?.id}</p>
            <p className="text-slate-300">Email: {user?.email}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white">Test Results</h3>
            {results.length === 0 && !isRunning && (
              <p className="text-slate-400">Click "Run Tests" to check database connectivity</p>
            )}
            
            {results.map((result, index) => (
              <div key={index} className="p-4 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-white">{result.name}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-slate-300 text-sm">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-slate-400 text-sm cursor-pointer">View Details</summary>
                    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Total Tests:</span>
                  <span className="text-white ml-2">{results.length}</span>
                </div>
                <div>
                  <span className="text-slate-400">Successful:</span>
                  <span className="text-green-400 ml-2">
                    {results.filter(r => r.status === 'success').length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Failed:</span>
                  <span className="text-red-400 ml-2">
                    {results.filter(r => r.status === 'error').length}
                  </span>
                </div>
              </div>
              
              {results.some(r => r.status === 'error') && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <p className="text-red-400 text-sm">
                    ⚠️ Some tests failed. This indicates database connectivity issues that need to be resolved.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DatabaseDebugger;
