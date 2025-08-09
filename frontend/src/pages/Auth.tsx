import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { AuthTabs } from '@/components/AuthForms';

const Auth: React.FC = () => {
  const navigate = useNavigate();

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