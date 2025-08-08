import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import TradingPage from "@/pages/TradingPage";
import ViewOnlyTradingPage from "@/pages/ViewOnlyTradingPage";
import Auth from "@/pages/Auth";
import KYCPage from "@/pages/KYCPage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import WithdrawalRequestPage from "@/pages/WithdrawalRequestPage";
import WalletPage from "@/pages/WalletPage";
import TradingHistoryPage from "@/pages/TradingHistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import SupportPage from "@/pages/SupportPage";
import ViewOnlyDashboard from "@/pages/ViewOnlyDashboard";
import ViewOnlyMarketPage from "@/pages/ViewOnlyMarketPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import LiveChatWidget from "@/components/LiveChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logEnvironmentStatus } from "@/integrations/supabase/client";

// Simple ProtectedRoute component with error handling
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user, isAuthenticated } = useAuth();
    return isAuthenticated && user ? <>{children}</> : <Navigate to="/" />;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    return <Navigate to="/" />;
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

// Trading route that shows view-only for non-authenticated users
const TradingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user, isAuthenticated } = useAuth();
    
    // If not authenticated, show view-only trading page
    if (!isAuthenticated) {
      return <ViewOnlyTradingPage />;
    }
    
    // If authenticated but KYC pending, show view-only with KYC prompt
    if (user?.kycStatus === 'pending' || user?.kycStatus === 'unverified') {
      return <ViewOnlyTradingPage />;
    }
    
    // If authenticated and KYC verified, show full trading page
    return <>{children}</>;
  } catch (error) {
    console.error('TradingRoute error:', error);
    return <ViewOnlyTradingPage />;
  }
};

// Withdraw route that requires KYC verification
const WithdrawRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { user, isAuthenticated } = useAuth();
    
    // If not authenticated, redirect to auth
    if (!isAuthenticated) {
      return <Navigate to="/auth" />;
    }
    
    // If KYC not verified, redirect to KYC page
    if (user?.kycStatus === 'pending' || user?.kycStatus === 'unverified') {
      return <Navigate to="/kyc" />;
    }
    
    // If KYC rejected, show error and redirect to KYC
    if (user?.kycStatus === 'rejected') {
      return <Navigate to="/kyc" />;
    }
    
    // If KYC verified, allow access
    return <>{children}</>;
  } catch (error) {
    console.error('WithdrawRoute error:', error);
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

  // If not authenticated, show landing page or auth page based on route
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/trading" element={<ViewOnlyTradingPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <LiveChatWidget />
        <WhatsAppButton />
      </>
    );
  }

  // If authenticated, show the main app with sidebar
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trading" element={<TradingRoute><TradingPage /></TradingRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
            <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
            <Route path="/withdraw" element={<WithdrawRoute><WithdrawPage /></WithdrawRoute>} />
            <Route path="/withdrawal-request" element={<WithdrawRoute><WithdrawalRequestPage /></WithdrawRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/trading-history" element={<ProtectedRoute><TradingHistoryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
      <MobileNav />
      <LiveChatWidget />
      <WhatsAppButton />
    </div>
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
