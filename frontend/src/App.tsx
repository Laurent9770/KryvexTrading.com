import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NoNavbarLayout from "@/layouts/NoNavbarLayout";
import NavbarLayout from "@/layouts/NavbarLayout";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import TradingPage from "@/pages/TradingPage";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import KYCPage from "@/pages/KYCPage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import WithdrawalRequestPage from "@/pages/WithdrawalRequestPage";
import WalletPage from "@/pages/WalletPage";
import TradingHistoryPage from "@/pages/TradingHistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import SupportPage from "@/pages/SupportPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import { logEnvironmentStatus } from "@/integrations/supabase/client";

// Simple ProtectedRoute component with error handling
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user, isAuthenticated } = useAuth();
    return isAuthenticated && user ? <>{children}</> : <Navigate to="/auth" />;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    return <Navigate to="/auth" />;
  }
};

// KYC Optional Route component (KYC restrictions removed)
const KYCOptionalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { isAuthenticated } = useAuth();
    
    // If not authenticated, redirect to auth
    if (!isAuthenticated) {
      return <Navigate to="/auth" />;
    }
    
    // KYC restrictions removed - all authenticated users have access
    return <>{children}</>;
  } catch (error) {
    console.error('KYCOptionalRoute error:', error);
    return <Navigate to="/auth" />;
  }
};

// Main app content with proper routing
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Kryvex Trading Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES - No Navbar */}
      <Route element={<NoNavbarLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* PROTECTED ROUTES - With Navbar */}
      <Route element={<NavbarLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trading" element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />

        <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/trading-history" element={<ProtectedRoute><TradingHistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        
        {/* Previously KYC Required Routes - Now Optional */}
        <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
        <Route path="/withdrawal-request" element={<ProtectedRoute><WithdrawalRequestPage /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    logEnvironmentStatus();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AppContent />

              <Toaster />
              <Sonner />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
