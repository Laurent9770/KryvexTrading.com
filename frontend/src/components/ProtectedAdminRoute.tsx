import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has admin privileges
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-slate-400">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-slate-400">
              <p>This area is restricted to administrators only.</p>
              <p className="mt-2">
                Current user: <span className="text-white">{user?.email}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute; 