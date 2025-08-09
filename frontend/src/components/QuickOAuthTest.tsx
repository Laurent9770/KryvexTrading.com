import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QuickOAuthTest: React.FC = () => {
  const { toast } = useToast();

  const testGoogleOAuth = async () => {
    try {
      console.log('🔍 Testing Google OAuth...');
      console.log('Supabase client:', !!supabase);
      console.log('Supabase auth:', !!supabase?.auth);
      
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase client or auth not available');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log('OAuth result:', { data, error });

      if (error) {
        console.error('❌ Google OAuth Error:', error);
        toast({
          title: "Google OAuth Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ Google OAuth initiated successfully');
        toast({
          title: "Success!",
          description: "Google OAuth initiated - check if redirect happens",
        });
      }
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testClientStatus = () => {
    console.log('🔍 Client Status Test:');
    console.log('Supabase client exists:', !!supabase);
    console.log('Supabase auth exists:', !!supabase?.auth);
    console.log('Client constructor name:', supabase?.constructor?.name);
    console.log('Auth methods available:', {
      signInWithOAuth: typeof supabase?.auth?.signInWithOAuth,
      getSession: typeof supabase?.auth?.getSession,
      signOut: typeof supabase?.auth?.signOut
    });

    toast({
      title: "Client Status",
      description: `Client: ${!!supabase}, Auth: ${!!supabase?.auth}`,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Quick OAuth Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testClientStatus} variant="outline" className="w-full">
          Test Client Status
        </Button>
        <Button onClick={testGoogleOAuth} className="w-full">
          Test Google OAuth
        </Button>
        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickOAuthTest;
