import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import Dashboard from "@/pages/Dashboard";
import TradingPage from "@/pages/TradingPage";
import Auth from "@/pages/Auth";
import KYCPage from "@/pages/KYCPage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import WithdrawalRequestPage from "@/pages/WithdrawalRequestPage";
import MarketPage from "@/pages/MarketPage";
import WalletPage from "@/pages/WalletPage";
import TradingHistoryPage from "@/pages/TradingHistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import LiveChatWidget from "@/components/LiveChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";
import ErrorBoundary from "@/components/ErrorBoundary";

// Simple ProtectedRoute component - Updated for deployment
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

function AppContent() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trading" element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />
            <Route path="/market" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/trading-history" element={<ProtectedRoute><TradingHistoryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
            <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
            <Route path="/withdrawal-request" element={<ProtectedRoute><WithdrawalRequestPage /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            
            {/* Redirect to dashboard for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <LanguageProvider>
              <AppContent />
              <Toaster />
              <Sonner />
              <LiveChatWidget />
              <WhatsAppButton />
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
