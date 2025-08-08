import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logEnvironmentStatus } from "@/integrations/supabase/client";

// Simple test component
const TestComponent: React.FC = () => {
  useEffect(() => {
    console.log('🔧 TestComponent mounted');
    console.log('🔧 React version:', React.version);
    console.log('🔧 Environment Variables:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Kryvex Trading Platform</h1>
        <p className="text-muted-foreground">Test Component - React is working!</p>
        <div className="text-sm text-muted-foreground">
          React Version: {React.version}
        </div>
      </div>
    </div>
  );
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
      <Routes>
        <Route path="/" element={<TestComponent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
