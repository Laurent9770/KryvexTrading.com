import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  BarChart3, 
  DollarSign, 
  Lock,
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  LogIn,
  UserPlus
} from 'lucide-react';
import realTimePriceService, { CryptoPrice } from '@/services/realTimePriceService';
import { useEffect, useState } from 'react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cryptoPrices, setCryptoPrices] = useState<Map<string, CryptoPrice>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safe navigation function with error handling
  const safeNavigate = (path: string) => {
    try {
      console.log('🔗 Attempting to navigate to:', path);
      console.log('🔗 Current location:', window.location.pathname);
      console.log('🔗 Navigate function:', typeof navigate);
      
      // Try React Router navigation first
      if (typeof navigate === 'function') {
        navigate(path);
        console.log('✅ React Router navigation successful to:', path);
        
        // Check if URL actually changed after a short delay
        setTimeout(() => {
          console.log('🔗 URL after navigation:', window.location.pathname);
          if (window.location.pathname === path) {
            console.log('✅ URL successfully updated to:', path);
          } else {
            console.warn('⚠️ URL did not update, current path:', window.location.pathname);
          }
        }, 100);
      } else {
        console.warn('⚠️ React Router navigate not available, using window.location');
        window.location.href = path;
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback to window.location if navigate fails
      console.log('🔄 Falling back to window.location.href');
      window.location.href = path;
    }
  };

  // Safe button click handler
  const handleButtonClick = (action: string, path?: string) => {
    try {
      console.log('🖱️ Button clicked:', action);
      console.log('🖱️ Target path:', path);
      console.log('🖱️ Event handler called successfully');
      
      if (path) {
        console.log('🖱️ About to call safeNavigate with path:', path);
        safeNavigate(path);
      } else {
        console.log('🖱️ No path provided for action:', action);
      }
    } catch (error) {
      console.error('❌ Button click error:', error);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      // Subscribe to real-time price updates with error handling
      if (realTimePriceService && typeof realTimePriceService.subscribe === 'function') {
        unsubscribe = realTimePriceService.subscribe((prices) => {
          try {
            setCryptoPrices(prices);
            setIsLoading(false);
          } catch (error) {
            console.error('❌ Error updating crypto prices:', error);
            setError('Failed to load market data');
            setIsLoading(false);
          }
        });
      } else {
        console.warn('⚠️ RealTimePriceService not available');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error subscribing to price service:', error);
      setError('Failed to connect to market data service');
      setIsLoading(false);
    }

    return () => {
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('❌ Error unsubscribing from price service:', error);
      }
    };
  }, []);

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } catch (error) {
      console.error('❌ Error formatting price:', error);
      return '$0.00';
    }
  };

  const formatChange = (change: number) => {
    try {
      const isPositive = change >= 0;
      return (
        <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
          {Math.abs(change).toFixed(2)}%
        </span>
      );
    } catch (error) {
      console.error('❌ Error formatting change:', error);
      return <span className="text-gray-500">0.00%</span>;
    }
  };

  // Safe data access helpers
  const safeMap = (map: Map<string, CryptoPrice>): Map<string, CryptoPrice> => {
    return map instanceof Map ? map : new Map();
  };

  const safePrice = (price: CryptoPrice | undefined): CryptoPrice => {
    return price || {
      symbol: 'N/A',
      price: 0,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: new Date().toISOString()
    };
  };

  // Get safe crypto prices
  const safeCryptoPrices = safeMap(cryptoPrices);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Market Data Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => handleButtonClick('reload')} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Kryvex Trading</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleButtonClick('signIn', '/auth')}
                className="cursor-pointer"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => handleButtonClick('getStarted', '/auth')}
                className="cursor-pointer"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
            🚀 Advanced Trading Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Trade Cryptocurrency with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Confidence</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience professional-grade trading tools, real-time market data, and secure transactions. 
            Join thousands of traders worldwide on Kryvex Trading Platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => handleButtonClick('startTrading', '/auth')} 
              className="text-lg px-8 py-3 cursor-pointer"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Trading Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => handleButtonClick('learnMore', '/auth')} 
              className="text-lg px-8 py-3 cursor-pointer"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Live Market Overview</h2>
            <p className="text-muted-foreground">Real-time cryptocurrency prices and market movements</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from(safeCryptoPrices.entries()).slice(0, 5).map(([symbol, price]) => {
              const safePriceData = safePrice(price);
              return (
                <Card key={symbol} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{safePriceData.symbol}</span>
                    {formatChange(safePriceData.change24h)}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {formatPrice(safePriceData.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Vol: {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(safePriceData.volume24h)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Kryvex Trading?</h2>
            <p className="text-muted-foreground">Professional tools and features designed for serious traders</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Secure Trading</h3>
              <p className="text-muted-foreground">Bank-level security with advanced encryption and secure wallet integration.</p>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">Execute trades instantly with our high-performance trading engine.</p>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Global Access</h3>
              <p className="text-muted-foreground">Trade from anywhere in the world with our mobile-optimized platform.</p>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">Professional charting tools and real-time market analysis.</p>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Community</h3>
              <p className="text-muted-foreground">Join a community of traders and share strategies and insights.</p>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Low Fees</h3>
              <p className="text-muted-foreground">Competitive trading fees with transparent pricing structure.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Trading?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who trust Kryvex Trading Platform for their cryptocurrency trading needs.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => handleButtonClick('createAccount', '/auth')} 
            className="text-lg px-8 py-3 cursor-pointer"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/40">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Kryvex Trading Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
