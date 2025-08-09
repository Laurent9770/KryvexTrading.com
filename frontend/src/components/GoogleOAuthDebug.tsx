import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const GoogleOAuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Check Supabase client
      const client = getSupabaseClient();
      results.supabaseClient = !!client;
      results.supabaseAuth = !!(client && client.auth);

      // Check current session
      if (client?.auth) {
        try {
          const { data: { session }, error } = await client.auth.getSession();
          results.currentSession = !!session;
          results.sessionError = error?.message || null;
          results.userEmail = session?.user?.email || null;
        } catch (error: any) {
          results.sessionError = error.message;
        }
      }

      // Check environment variables
      results.envVars = {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        googleClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      };

      // Test Google OAuth configuration
      if (client?.auth) {
        try {
          // This will fail if Google OAuth isn't configured
          console.log('Testing Google OAuth configuration...');
          // We can't actually test without triggering OAuth, but we can check if the method exists
          results.googleOAuthMethod = typeof client.auth.signInWithOAuth === 'function';
        } catch (error: any) {
          results.googleOAuthError = error.message;
        }
      }

      // Check current URL for OAuth params
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const searchParams = new URLSearchParams(url.search);
      
      results.urlDebug = {
        hasHash: !!url.hash,
        hasSearch: !!url.search,
        accessToken: hashParams.get('access_token'),
        error: searchParams.get('error') || hashParams.get('error'),
        errorDescription: searchParams.get('error_description') || hashParams.get('error_description'),
      };

    } catch (error: any) {
      results.diagnosticError = error.message;
    }

    setDebugInfo(results);
    setIsLoading(false);
  };

  const testGoogleOAuth = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        alert('Supabase client not available');
        return;
      }

      console.log('🔍 Testing Google OAuth...');
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google OAuth test failed:', error);
        alert(`Google OAuth Error: ${error.message}`);
      } else {
        console.log('Google OAuth test initiated:', data);
      }
    } catch (error: any) {
      console.error('Google OAuth test error:', error);
      alert(`Test Error: ${error.message}`);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Google OAuth Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          <Button onClick={testGoogleOAuth} variant="outline">
            Test Google OAuth
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Supabase Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.supabaseClient)}
                  <span>Client Initialized</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.supabaseAuth)}
                  <span>Auth Available</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.currentSession)}
                  <span>Current Session</span>
                </div>
                {debugInfo.userEmail && (
                  <Badge variant="secondary">User: {debugInfo.userEmail}</Badge>
                )}
                {debugInfo.sessionError && (
                  <Badge variant="destructive">Error: {debugInfo.sessionError}</Badge>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Environment</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.envVars.supabaseUrl)}
                  <span>Supabase URL</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.envVars.supabaseKey)}
                  <span>Supabase Key</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.envVars.googleClientId)}
                  <span>Google Client ID</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">OAuth Configuration</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(debugInfo.googleOAuthMethod)}
                <span>Google OAuth Method</span>
              </div>
              {debugInfo.googleOAuthError && (
                <Badge variant="destructive">OAuth Error: {debugInfo.googleOAuthError}</Badge>
              )}
            </div>

            {debugInfo.urlDebug && (
              <div className="space-y-2">
                <h3 className="font-semibold">URL Debug</h3>
                <div className="text-sm space-y-1">
                  <div>Has Hash: {debugInfo.urlDebug.hasHash ? '✅' : '❌'}</div>
                  <div>Has Search: {debugInfo.urlDebug.hasSearch ? '✅' : '❌'}</div>
                  {debugInfo.urlDebug.accessToken && (
                    <Badge variant="secondary">Access Token Present</Badge>
                  )}
                  {debugInfo.urlDebug.error && (
                    <Badge variant="destructive">
                      Error: {debugInfo.urlDebug.error} - {debugInfo.urlDebug.errorDescription}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-semibold">Common Issues:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Google OAuth not enabled in Supabase Dashboard</li>
            <li>Incorrect Google Client ID/Secret in Supabase</li>
            <li>Wrong redirect URLs in Google Console</li>
            <li>Missing environment variables</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthDebug;
