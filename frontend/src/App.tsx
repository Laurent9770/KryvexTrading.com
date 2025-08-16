import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SupabaseErrorBoundary from '@/components/SupabaseErrorBoundary';
import SafeComponent from '@/components/SafeComponent';
import NavbarLayout from '@/layouts/NavbarLayout';
import AdminLayout from '@/layouts/AdminLayout';
import NoNavbarLayout from '@/layouts/NoNavbarLayout';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';

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

// Simple environment status function - only in development
const logEnvironmentStatus = () => {
  try {
    // Check if we're in development
    let isDev = false;
    
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
        isDev = true;
      }
    } catch (error) {
      // import.meta not available
    }
    
    if (!isDev && typeof window !== 'undefined' && (window as any).env && (window as any).env.NODE_ENV === 'development') {
      isDev = true;
    }
    
    if (!isDev) return;
    
    console.log('🔍 ENVIRONMENT STATUS:');
    
    // Try import.meta first
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        console.log('NODE_ENV:', import.meta.env.MODE);
        console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Defined ✓' : 'Missing ✗');
        console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Defined ✓' : 'Missing ✗');
        console.log('VITE_API_URL:', import.meta.env.VITE_API_URL ? 'Defined ✓' : 'Missing ✗');
        console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL ? 'Defined ✓' : 'Missing ✗');
        return;
      }
    } catch (error) {
      // import.meta not available
    }
    
    // Fallback to window.env
    if (typeof window !== 'undefined' && (window as any).env) {
      console.log('NODE_ENV:', (window as any).env.NODE_ENV);
      console.log('SUPABASE_URL:', (window as any).env.SUPABASE_URL ? 'Defined ✓' : 'Missing ✗');
      console.log('SUPABASE_ANON_KEY:', (window as any).env.SUPABASE_ANON_KEY ? 'Defined ✓' : 'Missing ✗');
      console.log('BASE_URL:', (window as any).env.BASE_URL);
    }
  } catch (error) {
    console.error('❌ Error logging environment status:', error);
  }
};

// Safe route wrapper component
const SafeRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeComponent componentName="SafeRoute">
      <SupabaseErrorBoundary>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </SupabaseErrorBoundary>
    </SafeComponent>
  );
};

// Protected route component for regular users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect admins to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect non-admins to user dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Lazy load pages with error boundaries - simplified to avoid hook violations
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const Auth = React.lazy(() => import('@/pages/Auth'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const TradingPage = React.lazy(() => import('@/pages/TradingPage'));
const DepositPage = React.lazy(() => import('@/pages/DepositPage'));
const WithdrawalRequestPage = React.lazy(() => import('@/pages/WithdrawalRequestPage'));
const WithdrawPage = React.lazy(() => import('@/pages/WithdrawPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const KYCPage = React.lazy(() => import('@/pages/KYCPage'));
const SupportPage = React.lazy(() => import('@/pages/SupportPage'));
const TradingHistoryPage = React.lazy(() => import('@/pages/TradingHistoryPage'));
const WalletPage = React.lazy(() => import('@/pages/WalletPage'));
const DepositGuidePage = React.lazy(() => import('@/pages/DepositGuidePage'));
const AuthCallback = React.lazy(() => import('@/pages/AuthCallback'));
const LogoutTest = React.lazy(() => import('@/components/LogoutTest'));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Setup global error handler to catch DevTools extension errors
      setupGlobalErrorHandler();
      
      // Log environment status only in development
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
                        <Suspense fallback={<LoadingSpinner size="lg" />}>
                          <LandingPage />
                        </Suspense>
                      </SafeRoute>
                    } />
                    <Route path="/auth" element={
                      <SafeRoute>
                        <Suspense fallback={<LoadingSpinner size="lg" />}>
                          <Auth />
                        </Suspense>
                      </SafeRoute>
                    } />
                    <Route path="/auth/callback" element={
                      <SafeRoute>
                        <Suspense fallback={<LoadingSpinner size="lg" />}>
                          <AuthCallback />
                        </Suspense>
                      </SafeRoute>
                    } />
                    
                    {/* Admin routes with admin layout */}
                    <Route path="/admin" element={
                      <SafeRoute>
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      </SafeRoute>
                    }>
                      <Route index element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <AdminDashboard />
                          </Suspense>
                        </SafeRoute>
                      } />
                    </Route>
                    
                    {/* User routes with navbar layout */}
                    <Route path="/" element={
                      <SafeRoute>
                        <ProtectedRoute>
                          <NavbarLayout />
                        </ProtectedRoute>
                      </SafeRoute>
                    }>
                      <Route path="/dashboard" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <Dashboard />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/trading" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <TradingPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/deposit" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <DepositPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/withdraw" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <WithdrawPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/withdrawal" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <WithdrawalRequestPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/settings" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <SettingsPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/kyc" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <KYCPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/support" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <SupportPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/trading-history" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <TradingHistoryPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/wallet" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <WalletPage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/deposit-guide" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <DepositGuidePage />
                          </Suspense>
                        </SafeRoute>
                      } />
                      <Route path="/logout-test" element={
                        <SafeRoute>
                          <Suspense fallback={<LoadingSpinner size="lg" />}>
                            <LogoutTest />
                          </Suspense>
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
