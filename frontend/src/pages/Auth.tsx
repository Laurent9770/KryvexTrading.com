import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { AuthTabs } from '@/components/AuthForms';
import { useAuth } from '@/contexts/AuthContext';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🔐 Auth component rendered');
  console.log('🔐 Current pathname:', window.location.pathname);
  console.log('🔐 isAuthenticated:', isAuthenticated);
  console.log('🔐 isLoading:', isLoading);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔐 Auth useEffect triggered');
    console.log('🔐 isAuthenticated:', isAuthenticated);
    console.log('🔐 isLoading:', isLoading);
    
    if (isAuthenticated && !isLoading) {
      console.log('🔄 Already authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    console.log('🔐 Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render auth form if already authenticated
  if (isAuthenticated) {
    console.log('🔐 User is authenticated, not rendering auth form');
    return null;
  }

  console.log('🔐 Rendering auth form');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Kryvex Trading</h1>
          </div>
          <p className="text-muted-foreground">Professional cryptocurrency trading platform</p>
        </div>

        <div className="flex justify-center">
          <AuthTabs />
        </div>
      </div>
    </div>
  );
};

export default Auth;