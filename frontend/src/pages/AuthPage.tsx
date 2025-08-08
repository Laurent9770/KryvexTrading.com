import React from 'react';
import { AuthTabs } from '@/components/AuthForms';
import EnvChecker from '@/components/EnvChecker';
import EnvTest from '@/components/EnvTest';

const AuthPage: React.FC = () => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey;

  // Simple fallback content
  const fallbackContent = (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Kryvex Trading Platform
        </h1>
        <p className="text-gray-600 mb-4">
          Loading authentication system...
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Supabase URL: {supabaseUrl ? '✅ Set' : '❌ Missing'}
          </p>
          <p className="text-sm text-gray-500">
            Supabase Key: {supabaseAnonKey ? '✅ Set' : '❌ Missing'}
          </p>
        </div>
      </div>
    </div>
  );

  // Try to render the main content, fallback if it fails
  try {
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
  } catch (error) {
    console.error('Error rendering AuthPage:', error);
    return fallbackContent;
  }
};

export default AuthPage;
