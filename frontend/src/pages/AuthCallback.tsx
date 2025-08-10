import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/lib/supabaseClient';

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

        // For mock client, create a mock user from the OAuth data
        console.log('🔍 Creating mock user from OAuth callback...');
        
        // Create a mock user object
        const userData = {
          id: 'mock-oauth-user-' + Date.now(),
          email: 'mock-oauth-user@example.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_metadata: {
            full_name: 'Google User',
            avatar_url: '',
            provider: 'google'
          },
          app_metadata: {
            provider: 'google',
            providers: ['google']
          },
          aud: 'authenticated',
          role: 'authenticated'
        };
        
        console.log('✅ Mock user data created:', userData.email);

        // Create session object for our mock client
        const session = {
          access_token: accessToken || 'mock-oauth-token',
          refresh_token: refreshToken || 'mock-refresh-token',
          expires_at: expiresAt,
          token_type: tokenType,
          user: userData
        };

        // Store session in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        console.log('✅ Mock session stored in localStorage');

        // Trigger a storage event to notify other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'supabase.auth.token',
          newValue: JSON.stringify(session)
        }));

        // Also dispatch a custom event for immediate auth state update
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { user: userData, session }
        }));

        console.log('✅ OAuth authentication successful for:', userData.email);
        toast({
          title: "Welcome!",
          description: `Successfully signed in with Google as ${userData.email}`,
        });
        
        // Add a small delay to ensure state updates, then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);

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