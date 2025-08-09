import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Code, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DevVerificationCodeDisplayProps {
  isVisible?: boolean;
}

const DevVerificationCodeDisplay: React.FC<DevVerificationCodeDisplayProps> = ({ 
  isVisible = true 
}) => {
  const [lastCode, setLastCode] = useState<string>('');
  const [lastEmail, setLastEmail] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [timestamp, setTimestamp] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const handleVerificationEvent = (event: any) => {
      const { email, code, verificationId } = event.detail;
      setLastCode(code);
      setLastEmail(email);
      setTimestamp(new Date().toLocaleTimeString());
      setShowCode(true);
      
      // Show toast notification
      toast({
        title: "📧 Verification Code Generated",
        description: `Code: ${code} (Check console for details)`,
        duration: 8000,
      });
      
      // Auto-hide after 30 seconds
      setTimeout(() => setShowCode(false), 30000);
    };

    // Also listen to console logs to catch verification codes
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      
      // Check if this is a verification code log
      if (args.length >= 3 && 
          typeof args[0] === 'string' && 
          args[0].includes('🔑') && 
          args[0].includes('Verification code')) {
        const email = args[1];
        const code = args[2];
        
        setLastCode(code?.toString() || '');
        setLastEmail(email?.toString() || '');
        setTimestamp(new Date().toLocaleTimeString());
        setShowCode(true);
        
        toast({
          title: "📧 Verification Code Generated",
          description: `Code: ${code} (From console capture)`,
          duration: 8000,
        });
        
        setTimeout(() => setShowCode(false), 30000);
      }
    };

    window.addEventListener('email-verification-code', handleVerificationEvent);
    
    return () => {
      window.removeEventListener('email-verification-code', handleVerificationEvent);
      console.log = originalLog;
    };
  }, [toast]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lastCode);
      toast({
        title: "Copied!",
        description: "Verification code copied to clipboard",
        duration: 2000
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = lastCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied!",
        description: "Verification code copied to clipboard",
        duration: 2000
      });
    }
  };

  if (!isVisible || !lastCode) {
    return null;
  }

  return (
    <Card className="mt-4 border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                <Code className="w-3 h-3 mr-1" />
                DEVELOPMENT MODE
              </Badge>
              <span className="text-xs text-amber-600">Generated at {timestamp}</span>
            </div>
            
            <p className="text-sm text-amber-800 mb-3">
              <strong>Email Verification Code:</strong> In production, this would be sent to{' '}
              <code className="bg-amber-100 px-1 rounded text-xs">{lastEmail}</code>. 
              For development, use the code below:
            </p>
            
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-3">
              <div className="flex-1">
                {showCode ? (
                  <code className="text-lg font-mono font-bold text-amber-700 select-all">
                    {lastCode}
                  </code>
                ) : (
                  <code className="text-lg font-mono font-bold text-gray-400">
                    ••••••
                  </code>
                )}
              </div>
              
              <div className="flex items-center gap-1">
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevVerificationCodeDisplay;
