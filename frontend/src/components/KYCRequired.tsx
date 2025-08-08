import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

const KYCRequired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold">KYC Verification Required</CardTitle>
          <CardDescription>
            Complete your identity verification to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div className="text-sm">
                <p className="font-medium text-orange-700">Access Restricted</p>
                <p className="text-orange-600">This feature requires KYC verification</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Why KYC is Required:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Regulatory compliance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Secure transactions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Fraud prevention
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/kyc')} 
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Complete KYC Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Secure & Compliant
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCRequired;
