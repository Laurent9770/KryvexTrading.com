import React from 'react';
import { AuthTabs } from '@/components/AuthForms';
import EnvChecker from '@/components/EnvChecker';
import EnvTest from '@/components/EnvTest';

const AuthPage: React.FC = () => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey;

  // Always show environment test components first for debugging
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="space-y-4">
        <EnvTest />
        <EnvChecker />
        {isConfigured && (
          <div className="mt-8">
            <AuthTabs />
          </div>
        )}
        {!isConfigured && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Supabase Not Configured
            </h3>
            <p className="text-sm text-yellow-700">
              Please check your Render.com environment variables and redeploy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
