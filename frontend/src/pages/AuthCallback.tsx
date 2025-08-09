import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase, getSupabaseClient } from '@/integrations/supabase/client';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔗 Processing OAuth callback...');
        console.log('Current URL:', window.location.href);
        console.log('URL hash:', window.location.hash);
        console.log('URL search:', window.location.search);
        
        // Get the current URL
        const url = new URL(window.location.href);
        const urlParams = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        
        // Check for error in URL params (both search and hash)
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          toast({
            title: "Authentication Error",
            description: errorDescription || "Failed to authenticate with Google",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        // Check if we have access token in hash (common for OAuth)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        console.log('OAuth tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

        // Get the session from Supabase
        const client = getSupabaseClient();
        if (!client) {
          console.error('❌ Supabase client not available');
          toast({
            title: "Configuration Error",
            description: "Authentication service is not available",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          toast({
            title: "Authentication Error",
            description: "Failed to retrieve authentication session",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        if (session && session.user) {
          console.log('✅ OAuth authentication successful');
          toast({
            title: "Welcome!",
            description: `Successfully signed in with Google as ${session.user.email}`,
          });
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          console.warn('⚠️ No session found after OAuth callback');
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue",
            variant: "destructive"
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication",
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
