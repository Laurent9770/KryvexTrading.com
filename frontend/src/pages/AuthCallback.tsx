import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { httpAuth } from '@/integrations/supabase/httpClient';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔗 Processing OAuth callback with HTTP client...');
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

        // Get OAuth tokens from URL
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in') || urlParams.get('expires_in');
        const tokenType = hashParams.get('token_type') || urlParams.get('token_type') || 'bearer';
        
        console.log('OAuth tokens found:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken,
          expiresIn,
          tokenType 
        });

        if (!accessToken) {
          console.warn('⚠️ No access token found in OAuth callback');
          toast({
            title: "Authentication Error",
            description: "No authentication token received from Google",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        // Calculate expiration time
        const expiresAt = expiresIn ? 
          Math.floor(Date.now() / 1000) + parseInt(expiresIn) : 
          Math.floor(Date.now() / 1000) + 3600; // Default to 1 hour

        // Get user info from Supabase using the access token
        const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';
        
        console.log('🔍 Fetching user info with access token...');
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });

        if (!userResponse.ok) {
          console.error('❌ Failed to get user info:', userResponse.status);
          throw new Error('Failed to get user information');
        }

        const userData = await userResponse.json();
        console.log('✅ User data received:', userData.email);

        // Create session object for our HTTP client
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          token_type: tokenType,
          user: userData
        };

        // Store session in localStorage (same as httpAuth does)
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        console.log('✅ Session stored in localStorage');

        // Verify session is working
        const storedSession = httpAuth.getSession();
        if (storedSession && storedSession.user) {
          console.log('✅ OAuth authentication successful for:', storedSession.user.email);
          toast({
            title: "Welcome!",
            description: `Successfully signed in with Google as ${storedSession.user.email}`,
          });
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          throw new Error('Failed to create session');
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
        <p className="text-muted-foreground">Completing Google authentication...</p>
        <p className="text-sm text-muted-foreground">Processing OAuth tokens...</p>
      </div>
    </div>
  );
};

export default AuthCallback;