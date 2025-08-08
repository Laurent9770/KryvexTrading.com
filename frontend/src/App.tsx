import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ViewOnlyDashboard from "@/pages/ViewOnlyDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logEnvironmentStatus } from "@/integrations/supabase/client";

// Simple ProtectedRoute component with error handling
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user } = useAuth();
    return user ? <>{children}</> : <Navigate to="/auth" />;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    return <Navigate to="/auth" />;
  }
};

// View-only route component with error handling
const ViewOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user } = useAuth();
    return <>{children}</>;
  } catch (error) {
    console.error('ViewOnlyRoute error:', error);
    return <>{children}</>;
  }
};

const AppContent: React.FC = () => {
  useEffect(() => {
    console.log('🚀 Kryvex Trading App Starting...')
    try {
      logEnvironmentStatus()
    } catch (error) {
      console.warn('Failed to log environment status:', error)
    }
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* View-Only Routes (for non-authenticated users) */}
            <Route path="/" element={<ViewOnlyRoute><ViewOnlyDashboard /></ViewOnlyRoute>} />
            
            {/* Redirect to dashboard for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthProvider>
            <LanguageProvider>
              <AppContent />
              <Toaster />
              <Sonner />
            </LanguageProvider>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </BrowserRouter>
  );
};

export default App;
