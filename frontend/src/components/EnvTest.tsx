import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

const EnvTest: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Log to console for debugging
  console.log('🔍 Environment Test:', {
    supabaseUrl: supabaseUrl || 'undefined',
    supabaseAnonKey: supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'undefined',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });

  const hasUrl = !!supabaseUrl;
  const hasKey = !!supabaseAnonKey;
  const isConfigured = hasUrl && hasKey;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Environment Variables Test</CardTitle>
        <CardDescription>Checking if Supabase credentials are loaded</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {hasUrl ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              VITE_SUPABASE_URL: {hasUrl ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasKey ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              VITE_SUPABASE_ANON_KEY: {hasKey ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Environment variables are missing. Please add them to Render.com and redeploy.
            </AlertDescription>
          </Alert>
        )}

        {isConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Environment variables are loaded correctly! The Supabase client should work now.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Debug Info:</strong></p>
          <p>URL: {supabaseUrl || 'undefined'}</p>
          <p>Key Length: {supabaseAnonKey ? supabaseAnonKey.length : 0} characters</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvTest;
