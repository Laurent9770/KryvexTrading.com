import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';

const LogoutTest: React.FC = () => {
  const { logout, user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    console.log('🔄 Logout button clicked');
    console.log('👤 Current user:', user);
    console.log('🔐 Is authenticated:', isAuthenticated);
    
    try {
      // Test direct Supabase logout
      console.log('🔄 Testing direct Supabase logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Direct Supabase logout error:', error);
      } else {
        console.log('✅ Direct Supabase logout successful');
      }
      
      // Test AuthContext logout
      console.log('🔄 Testing AuthContext logout...');
      logout();
      
    } catch (error) {
      console.error('❌ Logout test error:', error);
    }
  };

  const handleDirectLogout = async () => {
    console.log('🔄 Direct logout button clicked');
    
    try {
      // Clear localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // Clear session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Direct logout error:', error);
      } else {
        console.log('✅ Direct logout successful');
        // Force page reload
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('❌ Direct logout test error:', error);
      // Force page reload anyway
      window.location.href = '/';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Logout Test</h2>
      
      <div className="space-y-2">
        <p><strong>User:</strong> {user?.email || 'None'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
      </div>
      
      <div className="space-y-2">
        <Button onClick={handleLogout} className="w-full">
          Test AuthContext Logout
        </Button>
        
        <Button onClick={handleDirectLogout} variant="outline" className="w-full">
          Test Direct Logout
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Check browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default LogoutTest;
