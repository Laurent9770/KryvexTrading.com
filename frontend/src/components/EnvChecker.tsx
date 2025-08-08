import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const EnvChecker: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  const hasSupabaseUrl = !!supabaseUrl;
  const hasSupabaseKey = !!supabaseAnonKey;
  const isConfigured = hasSupabaseUrl && hasSupabaseKey;

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

        <div className="text-xs text-muted-foreground">
          <p>To fix missing environment variables:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to your Render.com dashboard</li>
            <li>Navigate to your service settings</li>
            <li>Add environment variables:</li>
            <li className="ml-4">
              VITE_SUPABASE_URL=https://your-project-id.supabase.co
            </li>
            <li className="ml-4">
              VITE_SUPABASE_ANON_KEY=your-anon-key-here
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvChecker;
