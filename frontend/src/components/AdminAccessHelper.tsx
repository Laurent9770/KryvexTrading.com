import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, LogIn } from 'lucide-react';

const AdminAccessHelper: React.FC = () => {
  const { login, isAuthenticated, isAdmin, user } = useAuth();

  const handleAdminLogin = async () => {
    try {
      await login('admin@kryvex.com', 'Kryvex.@123', true);
    } catch (error) {
      console.error('Admin login failed:', error);
    }
  };

  if (isAuthenticated && isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <CardTitle className="text-white">Admin Access Granted</CardTitle>
          <CardDescription className="text-slate-400">
            You are logged in as an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-slate-400">
            <p>Current user: <span className="text-white">{user?.email}</span></p>
            <p className="mt-2">You can now access the admin dashboard.</p>
          </div>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => window.location.href = '/admin'}
          >
            <Shield className="w-4 h-4 mr-2" />
            Go to Admin Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated && !isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-yellow-400" />
          </div>
          <CardTitle className="text-white">Regular User</CardTitle>
          <CardDescription className="text-slate-400">
            You are logged in as a regular user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-slate-400">
            <p>Current user: <span className="text-white">{user?.email}</span></p>
            <p className="mt-2">To access admin features, you need admin credentials.</p>
          </div>
          <Button 
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleAdminLogin}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login as Admin
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <CardTitle className="text-white">Admin Access Helper</CardTitle>
        <CardDescription className="text-slate-400">
          Quick admin login for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-slate-400">
          <p>Admin Credentials:</p>
          <p className="text-white font-mono text-xs mt-1">Email: admin@kryvex.com</p>
          <p className="text-white font-mono text-xs">Password: Kryvex.@123</p>
        </div>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleAdminLogin}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Login as Admin
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminAccessHelper; 