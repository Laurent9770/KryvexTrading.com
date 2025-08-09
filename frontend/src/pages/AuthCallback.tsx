import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔗 Processing OAuth callback...');
        
        // Get the current URL
        const url = new URL(window.location.href);
        const urlParams = new URLSearchParams(url.search);
        
        // Check for error in URL params
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
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

        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
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
