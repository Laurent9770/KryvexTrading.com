import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationDisplayProps {
  email?: string;
  isVisible?: boolean;
}

const EmailVerificationDisplay: React.FC<EmailVerificationDisplayProps> = ({ 
  email, 
  isVisible = false 
}) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>('');
  const { toast } = useToast();

  // Listen for verification codes in console
  useEffect(() => {
    // Override console.log to capture verification codes
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      
      // Check if this is a verification code log
      if (args.length >= 3 && 
          typeof args[0] === 'string' && 
          args[0].includes('🔑') && 
          args[0].includes('Verification code')) {
        const emailArg = args[1];
        const codeArg = args[2];
        
        if (emailArg === email || (email && emailArg && emailArg.toString().includes(email))) {
          setVerificationCode(codeArg?.toString() || '');
          setLastEmail(emailArg?.toString() || '');
          
          // Auto-show code for 30 seconds
          setShowCode(true);
          setTimeout(() => setShowCode(false), 30000);
        }
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, [email]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      toast({
        title: "Code Copied",
        description: "Verification code copied to clipboard",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  if (!isVisible || !verificationCode) {
    return null;
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
          Development: Email Verification
          <Badge variant="secondary" className="text-xs">
            DEMO MODE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          <strong>Note:</strong> In production, this code would be sent to your email.
          For development, it's displayed here.
        </div>
        
        <div className="flex items-center justify-between bg-white border rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Verification Code:</div>
              <div className="text-xs text-gray-500">Sent to: {lastEmail}</div>
            </div>
            
            <div className="flex items-center gap-2">
              {showCode ? (
                <code className="text-lg font-mono font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded">
                  {verificationCode}
                </code>
              ) : (
                <code className="text-lg font-mono font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded">
                  ••••••
                </code>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="h-8 w-8 p-0"
              >
                {showCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="h-8"
            disabled={!showCode}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          Code expires in 10 minutes
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerificationDisplay;
