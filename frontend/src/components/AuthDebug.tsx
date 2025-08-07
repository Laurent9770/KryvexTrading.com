import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export const AuthDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Test 1: Check if client is initialized
      if (!supabase) {
        setTestResult('❌ Supabase client is null');
        return;
      }

      // Test 2: Check auth methods
      if (!supabase.auth) {
        setTestResult('❌ Supabase auth is not available');
        return;
      }

      // Test 3: Try to get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setTestResult(`❌ Session error: ${sessionError.message}`);
        return;
      }

      // Test 4: Try to sign up a test user
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      console.log('🧪 Testing registration with:', testEmail);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
            phone: '1234567890',
            country: 'United States'
          }
        }
      });

      if (signUpError) {
        setTestResult(`❌ Sign up error: ${signUpError.message}`);
        return;
      }

      if (signUpData.user) {
        setTestResult(`✅ Registration successful! User ID: ${signUpData.user.id}`);
        
        // Clean up: Delete the test user
        setTimeout(async () => {
          try {
            await supabase.auth.signOut();
            console.log('🧹 Cleaned up test user');
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }, 5000);
      } else {
        setTestResult('⚠️ Sign up completed but no user data returned');
      }

    } catch (error) {
      console.error('❌ Test error:', error);
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
      </div>
    </div>
  );
}; 