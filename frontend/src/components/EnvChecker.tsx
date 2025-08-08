import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const EnvChecker: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  const hasSupabaseUrl = !!supabaseUrl;
  const hasSupabaseKey = !!supabaseAnonKey;
  const isConfigured = hasSupabaseUrl && hasSupabaseKey;

  // Log to console for debugging
  console.log('🔍 Environment Checker Debug:', {
    supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
    supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
    isDev,
    isProd,
    isConfigured
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Environment Configuration</CardTitle>
        <CardDescription>Check your Supabase configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {hasSupabaseUrl ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              VITE_SUPABASE_URL: {hasSupabaseUrl ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasSupabaseKey ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              VITE_SUPABASE_ANON_KEY: {hasSupabaseKey ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              Environment: {isDev ? 'Development' : isProd ? 'Production' : 'Unknown'}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Supabase environment variables are missing. Please check your Render.com environment variables.
            </AlertDescription>
          </Alert>
        )}

        {isConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Supabase is properly configured. If you're still seeing errors, check the browser console.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>To fix missing environment variables:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to your Render.com dashboard</li>
            <li>Navigate to your service settings</li>
            <li>Go to Environment Variables section</li>
            <li>Add these exact variables:</li>
          </ol>
          
          <div className="bg-gray-100 p-2 rounded mt-2">
            <p className="font-mono text-xs">
              VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
            </p>
            <p className="font-mono text-xs break-all">
              VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg
            </p>
          </div>
          
          <div className="mt-2 p-2 bg-blue-50 rounded">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">After adding variables:</span>
            </div>
            <ul className="text-xs mt-1 space-y-1">
              <li>• Click "Manual Deploy" in Render.com</li>
              <li>• Wait for deployment to complete</li>
              <li>• Hard refresh your browser (Ctrl+F5)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvChecker;
