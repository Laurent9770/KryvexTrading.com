import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const EnvTest: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Log to console for debugging
  console.log('🔍 Environment Test:', {
    supabaseUrl: supabaseUrl || 'undefined',
    supabaseAnonKey: supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'undefined',
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD
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
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Production: {import.meta.env.PROD ? 'Yes' : 'No'}</p>
        </div>

        {!isConfigured && (
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>To fix this:</strong></p>
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
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">After adding variables:</span>
              </div>
              <ul className="text-xs mt-1 space-y-1">
                <li>• Click "Manual Deploy" in Render.com</li>
                <li>• Select "Clear build cache & deploy"</li>
                <li>• Wait for deployment to complete</li>
                <li>• Hard refresh your browser (Ctrl+F5)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvTest;
