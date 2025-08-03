import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TradingPage from "./pages/TradingPage";
import FuturesPage from "./pages/FuturesPage";

import WalletPage from "./pages/WalletPage";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import TransferPage from "./pages/TransferPage";
import ConvertPage from "./pages/ConvertPage";
import WithdrawalRequestPage from "./pages/WithdrawalRequestPage";

import MarketPage from "./pages/MarketPage";
import SettingsPage from "./pages/SettingsPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserTradeControlPage from "./pages/UserTradeControlPage";
import TradingHistoryPage from "./pages/TradingHistoryPage";
import KYCVerificationPage from "./pages/KYCVerificationPage";
import NotFound from "./pages/NotFound";
import LiveChatWidget from "@/components/LiveChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const UserOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        
        {/* Protected Routes */}
        <Route path="*" element={
          user ? (
            // Protected Layout with Sidebar - Mobile Responsive
            <div className="flex min-h-screen flex-col lg:flex-row overflow-hidden">
              <Sidebar />
              <MobileNav />
              <main className="flex-1 lg:ml-16 xl:ml-72 transition-all duration-300 overflow-x-hidden">
                <div className="p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-full">
                  <Routes>
                    <Route path="/dashboard" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
                    <Route path="/market" element={<UserOnlyRoute><MarketPage /></UserOnlyRoute>} />
                    <Route path="/trading" element={<UserOnlyRoute><TradingPage /></UserOnlyRoute>} />
                    <Route path="/wallet" element={<UserOnlyRoute><WalletPage /></UserOnlyRoute>} />
                    <Route path="/deposit" element={<UserOnlyRoute><DepositPage /></UserOnlyRoute>} />
                    <Route path="/withdraw" element={<UserOnlyRoute><WithdrawPage /></UserOnlyRoute>} />
                    <Route path="/withdrawal-requests" element={<UserOnlyRoute><WithdrawalRequestPage /></UserOnlyRoute>} />
                    <Route path="/transfer" element={<UserOnlyRoute><TransferPage /></UserOnlyRoute>} />
                    <Route path="/convert" element={<UserOnlyRoute><ConvertPage /></UserOnlyRoute>} />
                    <Route path="/profile" element={<UserOnlyRoute><Navigate to="/settings" replace /></UserOnlyRoute>} />
                    <Route path="/settings" element={<UserOnlyRoute><SettingsPage /></UserOnlyRoute>} />
                    <Route path="/kyc" element={<UserOnlyRoute><KYCVerificationPage /></UserOnlyRoute>} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/trading-control" element={<AdminDashboard />} />
                    <Route path="/admin/trading-control/:userId" element={<UserTradeControlPage />} />
                    <Route path="/trading-history" element={<UserOnlyRoute><TradingHistoryPage /></UserOnlyRoute>} />
                    
                    {/* Legacy trading routes - redirect to main trading page */}
                    <Route path="/futures" element={<Navigate to="/trading" replace />} />
                    <Route path="/options" element={<Navigate to="/trading" replace />} />
                    <Route path="/binary" element={<Navigate to="/trading" replace />} />
                    <Route path="/binary-options" element={<Navigate to="/trading" replace />} />
                    <Route path="/quant" element={<Navigate to="/trading" replace />} />
                    <Route path="/bots" element={<Navigate to="/trading" replace />} />
                    <Route path="/quant-trading" element={<Navigate to="/trading" replace />} />
                    <Route path="/trading-bots" element={<Navigate to="/trading" replace />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          ) : (
            <Navigate to="/auth" />
          )
        } />
      </Routes>
      
      {/* Global Components */}
      {user && <LiveChatWidget />}
      <WhatsAppButton />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
            <LiveChatWidget />
            <WhatsAppButton />
          </TooltipProvider>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
