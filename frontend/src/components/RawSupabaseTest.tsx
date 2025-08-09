import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const RawSupabaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Not tested');
  const [loading, setLoading] = useState(false);

  const testRawSupabase = async () => {
    setLoading(true);
    setTestResult('Testing...');
    
    try {
      console.log('🧪 Starting raw Supabase test...');
      
      // Test 1: Can we import the package?
      const { createClient } = await import('@supabase/supabase-js');
      console.log('✅ Successfully imported @supabase/supabase-js');
      
      // Test 2: Can we call createClient with our credentials?
      const testUrl = 'https://ftkeczodadvtnxofrwps.supabase.co';
      const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';
      
      console.log('🧪 Testing createClient with:', { url: testUrl, keyLength: testKey.length });
      
      const client = createClient(testUrl, testKey);
      console.log('✅ createClient succeeded:', !!client);
      
      // Test 3: Does the client have expected properties?
      const hasAuth = !!client.auth;
      const hasFrom = !!client.from;
      const hasStorage = !!client.storage;
      
      console.log('✅ Client properties:', { hasAuth, hasFrom, hasStorage });
      
      // Test 4: Can we call a basic auth method?
      try {
        const { data, error } = await client.auth.getSession();
        console.log('✅ getSession call succeeded:', { data: !!data, error: !!error });
        setTestResult('✅ All tests passed! Raw Supabase works.');
      } catch (authError: any) {
        console.error('❌ getSession failed:', authError);
        setTestResult(`❌ Auth test failed: ${authError.message}`);
      }
      
    } catch (error: any) {
      console.error('❌ Raw Supabase test failed:', error);
      setTestResult(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🧪 Raw Supabase Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testRawSupabase} 
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Raw Supabase'}
        </Button>
        
        <div className="text-sm">
          <strong>Result:</strong>
          <div className="mt-1">
            <Badge variant={testResult.includes('✅') ? "default" : testResult.includes('❌') ? "destructive" : "secondary"}>
              {testResult}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RawSupabaseTest;
