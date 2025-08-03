import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import TradingFeatures from "@/components/TradingFeatures";
import TradingViewTicker from "@/components/TradingViewTicker";
import MarketOverview from "@/components/MarketOverview";
import TradingTypes from "@/components/TradingTypes";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navigation />
      
      {/* Real-time Market Ticker */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm animate-slide-in-from-bottom">
        <TradingViewTicker />
      </div>
      
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <HeroSection />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <StatsSection />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <MarketOverview />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <TradingTypes />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <TradingFeatures />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
