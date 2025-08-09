import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SupabaseClientTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    const runClientTest = async () => {
      console.log('🧪 Running Supabase Client Test...');
      
      try {
        // Test direct import
        const { supabase, getSupabaseClient } = await import('@/integrations/supabase/client');
        
        const results = {
          directImportClient: !!supabase,
          getClientFunction: !!getSupabaseClient,
          clientHasAuth: !!(supabase && supabase.auth),
          clientFromGetter: null as any,
          getterWorks: false,
          authMethodsAvailable: false
        };

        try {
          const clientFromGetter = getSupabaseClient();
          results.clientFromGetter = !!clientFromGetter;
          results.getterWorks = true;
          results.authMethodsAvailable = !!(clientFromGetter && clientFromGetter.auth && clientFromGetter.auth.signUp);
        } catch (getterError) {
          console.error('❌ getSupabaseClient failed:', getterError);
          results.getterWorks = false;
        }

        console.log('🧪 Client test results:', results);
        setTestResults(results);

      } catch (importError) {
        console.error('❌ Failed to import Supabase client:', importError);
        setTestResults({ error: importError.message });
      }
    };

    runClientTest();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🧪 Supabase Client Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {testResults.error ? (
          <Badge variant="destructive">Import Error: {testResults.error}</Badge>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-sm">Direct Import:</span>
              <Badge variant={testResults.directImportClient ? "default" : "destructive"}>
                {testResults.directImportClient ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Getter Function:</span>
              <Badge variant={testResults.getClientFunction ? "default" : "destructive"}>
                {testResults.getClientFunction ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Client Has Auth:</span>
              <Badge variant={testResults.clientHasAuth ? "default" : "destructive"}>
                {testResults.clientHasAuth ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Getter Works:</span>
              <Badge variant={testResults.getterWorks ? "default" : "destructive"}>
                {testResults.getterWorks ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Auth Methods:</span>
              <Badge variant={testResults.authMethodsAvailable ? "default" : "destructive"}>
                {testResults.authMethodsAvailable ? "✅" : "❌"}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseClientTest;
