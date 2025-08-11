import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SafeComponent from '@/components/SafeComponent';
import NavbarLayout from '@/layouts/NavbarLayout';
import NoNavbarLayout from '@/layouts/NoNavbarLayout';

// Safe lazy loading wrapper with error handling
const safeLazyLoad = (importFunc: () => Promise<any>) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef<any, any>((props, ref) => {
    return (
      <SafeComponent componentName="LazyComponent">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner size="lg" />}>
            <LazyComponent {...props} ref={ref} />
          </Suspense>
        </ErrorBoundary>
      </SafeComponent>
    );
  });
};

// Lazy load pages with error boundaries
const LandingPage = safeLazyLoad(() => import('@/pages/LandingPage'));
const Auth = safeLazyLoad(() => import('@/pages/Auth'));
const Dashboard = safeLazyLoad(() => import('@/pages/Dashboard'));
const AdminDashboard = safeLazyLoad(() => import('@/pages/AdminDashboard'));
const TradingPage = safeLazyLoad(() => import('@/pages/TradingPage'));
const DepositPage = safeLazyLoad(() => import('@/pages/DepositPage'));
const WithdrawalRequestPage = safeLazyLoad(() => import('@/pages/WithdrawalRequestPage'));
const WithdrawPage = safeLazyLoad(() => import('@/pages/WithdrawPage'));
const SettingsPage = safeLazyLoad(() => import('@/pages/SettingsPage'));
const KYCPage = safeLazyLoad(() => import('@/pages/KYCPage'));
const SupportPage = safeLazyLoad(() => import('@/pages/SupportPage'));
const TradingHistoryPage = safeLazyLoad(() => import('@/pages/TradingHistoryPage'));
const WalletPage = safeLazyLoad(() => import('@/pages/WalletPage'));
const AuthCallback = safeLazyLoad(() => import('@/pages/AuthCallback'));

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
  try {
    console.log('🔍 ENVIRONMENT STATUS:');
    console.log('NODE_ENV:', import.meta.env.MODE);
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Defined ✓' : 'Missing ✗');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Defined ✓' : 'Missing ✗');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL ? 'Defined ✓' : 'Missing ✗');
    console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL ? 'Defined ✓' : 'Missing ✗');
  } catch (error) {
    console.error('❌ Error logging environment status:', error);
  }
};

// Safe route wrapper component
const SafeRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeComponent componentName="SafeRoute">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </SafeComponent>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Log environment status
      logEnvironmentStatus();
      
      // Simulate loading time
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('❌ Error in App initialization:', error);
      setError('Failed to initialize application');
      setIsLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Initialization Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <SafeComponent componentName="App">
      <ErrorBoundary>
        <TooltipProvider>
          <LanguageProvider>
            <AuthProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public routes without navbar */}
                    <Route path="/" element={
                      <SafeRoute>
                        <LandingPage />
                      </SafeRoute>
                    } />
                    <Route path="/auth" element={
                      <SafeRoute>
                        <Auth />
                      </SafeRoute>
                    } />
                    <Route path="/auth/callback" element={
                      <SafeRoute>
                        <AuthCallback />
                      </SafeRoute>
                    } />
                    
                    {/* Authenticated routes with navbar */}
                    <Route path="/" element={<NavbarLayout />}>
                      <Route path="/dashboard" element={
                        <SafeRoute>
                          <Dashboard />
                        </SafeRoute>
                      } />
                      <Route path="/admin" element={
                        <SafeRoute>
                          <AdminDashboard />
                        </SafeRoute>
                      } />

                      <Route path="/trading" element={
                        <SafeRoute>
                          <TradingPage />
                        </SafeRoute>
                      } />
                      <Route path="/deposit" element={
                        <SafeRoute>
                          <DepositPage />
                        </SafeRoute>
                      } />
                      <Route path="/withdraw" element={
                        <SafeRoute>
                          <WithdrawPage />
                        </SafeRoute>
                      } />
                      <Route path="/withdrawal" element={
                        <SafeRoute>
                          <WithdrawalRequestPage />
                        </SafeRoute>
                      } />
                                              <Route path="/settings" element={
                          <SafeRoute>
                            <SettingsPage />
                          </SafeRoute>
                        } />
                        <Route path="/kyc" element={
                          <SafeRoute>
                            <KYCPage />
                          </SafeRoute>
                        } />
                        
                        <Route path="/support" element={
                        <SafeRoute>
                          <SupportPage />
                        </SafeRoute>
                      } />
                      <Route path="/history" element={
                        <SafeRoute>
                          <TradingHistoryPage />
                        </SafeRoute>
                      } />
                      <Route path="/wallet" element={
                        <SafeRoute>
                          <WalletPage />
                        </SafeRoute>
                      } />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                  </Routes>
                  <Toaster />
                </div>
              </Router>
            </AuthProvider>
          </LanguageProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </SafeComponent>
  );
}

export default App;
