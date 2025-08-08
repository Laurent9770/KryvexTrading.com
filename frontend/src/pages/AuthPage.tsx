import React from 'react';
import { AuthTabs } from '@/components/AuthForms';
import EnvChecker from '@/components/EnvChecker';
import EnvTest from '@/components/EnvTest';

const AuthPage: React.FC = () => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey;

  // If Supabase is not configured, show the environment checker
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="space-y-4">
          <EnvTest />
          <EnvChecker />
        </div>
      </div>
    );
  }

  return <AuthTabs />;
};

export default AuthPage;
