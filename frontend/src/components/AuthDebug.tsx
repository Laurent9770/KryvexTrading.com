import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

interface TestResults {
  sessionTest: { success: boolean; error?: string };
  databaseTest: { success: boolean; error?: string };
  isMock: boolean;
}

export const AuthDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSupabaseConnection = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 Testing Supabase connection...')
      
      // Test basic client functionality
      const { data, error } = await supabase.auth.getSession()
      console.log('Session test result:', { data: !!data, error })
      
      // Test database query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      console.log('Database test result:', { 
        hasData: !!profileData, 
        error: profileError,
        isMock: !supabase.auth.getSession || typeof supabase.auth.getSession !== 'function'
      })
      
      setTestResults({
        sessionTest: { success: !error, error: error?.message },
        databaseTest: { success: !profileError, error: profileError?.message },
        isMock: !supabase.auth.getSession || typeof supabase.auth.getSession !== 'function'
      })
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({
        sessionTest: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        databaseTest: { success: false, error: 'Test failed' },
        isMock: true
      })
    } finally {
      setIsLoading(false);
    }
  }

  const testEnvironmentVariables = () => {
    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    };

    console.log('🔧 Environment Variables:', envVars);
    setTestResult(`🔧 Environment check: ${JSON.stringify(envVars, null, 2)}`);
  };

  return (
    <div className="auth-debug p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔧 Auth Debug Panel</h3>
      
      <div className="space-y-4">
        <button
          onClick={testEnvironmentVariables}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Check Environment Variables
        </button>
        
        <button
          onClick={testSupabaseConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Supabase Connection'}
        </button>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <pre className="text-sm text-white whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        {testResults && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h4 className="text-md font-semibold mb-2">🧪 Test Results:</h4>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded ${testResults.isMock ? 'bg-yellow-600' : 'bg-green-600'}`}>
                <strong>Client Type:</strong> {testResults.isMock ? 'Mock Client' : 'Real Supabase Client'}
              </div>
              <div className={`p-2 rounded ${testResults.sessionTest.success ? 'bg-green-600' : 'bg-red-600'}`}>
                <strong>Session Test:</strong> {testResults.sessionTest.success ? '✅ Success' : `❌ Failed: ${testResults.sessionTest.error}`}
              </div>
              <div className={`p-2 rounded ${testResults.databaseTest.success ? 'bg-green-600' : 'bg-red-600'}`}>
                <strong>Database Test:</strong> {testResults.databaseTest.success ? '✅ Success' : `❌ Failed: ${testResults.databaseTest.error}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 