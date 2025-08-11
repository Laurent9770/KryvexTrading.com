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
        
        // Use Supabase's built-in OAuth callback handling
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message || "Failed to complete authentication",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        if (!data.session) {
          console.error('❌ No session found after OAuth callback');
          toast({
            title: "Authentication Error",
            description: "No valid session found after authentication",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        const user = data.session.user;
        console.log('✅ OAuth authentication successful for:', user.email);
        
        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${user.email}`,
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