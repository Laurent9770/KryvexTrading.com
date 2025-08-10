import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const ViewOnlyDashboard = React.lazy(() => import('@/pages/ViewOnlyDashboard'));
const TradingPage = React.lazy(() => import('@/pages/TradingPage'));
const DepositPage = React.lazy(() => import('@/pages/DepositPage'));
const WithdrawalRequestPage = React.lazy(() => import('@/pages/WithdrawalRequestPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const KYCPage = React.lazy(() => import('@/pages/KYCPage'));
const SupportPage = React.lazy(() => import('@/pages/SupportPage'));
const TradingHistoryPage = React.lazy(() => import('@/pages/TradingHistoryPage'));
const WalletPage = React.lazy(() => import('@/pages/WalletPage'));
const AuthCallback = React.lazy(() => import('@/pages/AuthCallback'));

// Loading Spinner Component
const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12"
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Simple environment status function
const logEnvironmentStatus = () => {
  console.log('🔍 ENVIRONMENT STATUS:');
  console.log('NODE_ENV:', import.meta.env.MODE);
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Defined ✓' : 'Missing ✗');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Defined ✓' : 'Missing ✗');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL ? 'Defined ✓' : 'Missing ✗');
  console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL ? 'Defined ✓' : 'Missing ✗');
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Log environment status
    logEnvironmentStatus();
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/view-only" element={<ViewOnlyDashboard />} />
                  <Route path="/trading" element={<TradingPage />} />
                  <Route path="/deposit" element={<DepositPage />} />
                  <Route path="/withdrawal" element={<WithdrawalRequestPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/kyc" element={<KYCPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/history" element={<TradingHistoryPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
