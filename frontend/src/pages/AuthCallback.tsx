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
        console.log('🔗 Processing OAuth callback with real Supabase client...');
        console.log('Current URL:', window.location.href);
        
        // Check for error parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('❌ OAuth error from URL:', error, errorDescription);
          toast({
            title: "Authentication Error",
            description: errorDescription || error || "OAuth authentication failed",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }
        
        // Try to get the session from the OAuth callback
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          toast({
            title: "Authentication Error",
            description: sessionError.message || "Failed to get session after authentication",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        let refreshData: any = null;
        
        if (!data.session) {
          console.error('❌ No session found after OAuth callback');
          
          // Try to refresh the session
          const refreshResult = await supabase.auth.refreshSession();
          refreshData = refreshResult.data;
          
          if (refreshResult.error || !refreshData?.session) {
            console.error('❌ Session refresh failed:', refreshResult.error);
            toast({
              title: "Authentication Error",
              description: "No valid session found after authentication. Please try again.",
              variant: "destructive"
            });
            navigate('/auth');
            return;
          }
          
          console.log('✅ Session refreshed successfully');
        }

        const user = data.session?.user || refreshData?.session?.user;
        console.log('✅ OAuth authentication successful for:', user?.email);
        
        // Wait a moment for profile creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${user?.email}`,
        });
        
        // Redirect to dashboard
        navigate('/dashboard');

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
        <p className="text-sm text-muted-foreground">Please wait while we verify your credentials...</p>
      </div>
    </div>
  );
};

export default AuthCallback;