import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

const SupabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results: any = {};

      // Test 1: Environment Variables
      results.envVars = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
          `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET',
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      };

      // Test 2: Supabase Client
      try {
        results.clientTest = {
          hasClient: !!supabase,
          clientType: typeof supabase,
          hasAuth: !!supabase?.auth,
          hasFrom: !!supabase?.from
        };
      } catch (error) {
        results.clientTest = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Basic Query
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        results.queryTest = {
          success: !error,
          error: error?.message,
          data: data
        };
      } catch (error) {
        results.queryTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: Auth Test
      try {
        const { data, error } = await supabase.auth.getSession();
        results.authTest = {
          success: !error,
          error: error?.message,
          hasSession: !!data?.session
        };
      } catch (error) {
        results.authTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return <div className="p-4">Running Supabase connection tests...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Supabase Connection Test</h2>
      
      <div className="space-y-4">
        <div className="border rounded p-3">
          <h3 className="font-semibold">Environment Variables</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(testResults.envVars, null, 2)}
          </pre>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold">Supabase Client</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(testResults.clientTest, null, 2)}
          </pre>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold">Database Query Test</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(testResults.queryTest, null, 2)}
          </pre>
        </div>

        <div className="border rounded p-3">
          <h3 className="font-semibold">Authentication Test</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(testResults.authTest, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;
