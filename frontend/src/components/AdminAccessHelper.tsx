import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, LogIn, AlertTriangle } from 'lucide-react';

const AdminAccessHelper: React.FC = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();

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
          <div className="text-center text-xs text-slate-500">
            <p>Contact system administrator for admin access</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-blue-400" />
        </div>
        <CardTitle className="text-white">Admin Access</CardTitle>
        <CardDescription className="text-slate-400">
          Please log in to access admin features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-slate-400">
          <p>Admin credentials are required for access.</p>
          <p className="mt-2">Contact your system administrator.</p>
        </div>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/auth'}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminAccessHelper; 