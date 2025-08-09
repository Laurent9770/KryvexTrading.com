import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Bug } from 'lucide-react';
import { AuthTabs } from '@/components/AuthForms';
import GoogleOAuthDebug from '@/components/GoogleOAuthDebug';
import QuickOAuthTest from '@/components/QuickOAuthTest';
import SupabaseClientTest from '@/components/SupabaseClientTest';
import RawSupabaseTest from '@/components/RawSupabaseTest';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="ml-4"
            >
              <Bug className="w-4 h-4" />
              Debug
            </Button>
          </div>
          <p className="text-muted-foreground">Professional cryptocurrency trading platform</p>
        </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="flex justify-center">
        <AuthTabs />
      </div>

      <div className="flex justify-center">
        <QuickOAuthTest />
      </div>

      <div className="flex justify-center">
        <SupabaseClientTest />
      </div>

      <div className="flex justify-center">
        <RawSupabaseTest />
      </div>

      {showDebug && (
        <div>
          <GoogleOAuthDebug />
        </div>
      )}
    </div>
      </div>
    </div>
  );
};

export default Auth;