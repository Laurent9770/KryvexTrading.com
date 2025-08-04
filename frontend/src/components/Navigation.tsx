import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Bot, Coins, Bell, User, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import KryvexLogo from "@/components/KryvexLogo";
import WhatsAppButton from "@/components/WhatsAppButton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { getPrice } = useCryptoPrices();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="kucoin-nav fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="kucoin-container flex items-center justify-between">
        {/* Logo */}
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <KryvexLogo size="md" />
        </div>

        {/* Main Navigation */}
        {user ? (
          <div className="hidden lg:flex items-center space-x-8">
            <Button variant="ghost" onClick={() => navigate('/')} className="kucoin-btn-secondary text-sm">
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/market')} className="kucoin-btn-secondary text-sm">
              Markets
            </Button>
            <Button variant="ghost" onClick={() => navigate('/trading')} className="kucoin-btn-secondary text-sm">
              Trading
            </Button>
            <Button variant="ghost" onClick={() => navigate('/bots')} className="kucoin-btn-secondary text-sm">
              <Bot className="w-4 h-4 mr-2" />
              Bots
            </Button>
            {isAdmin && (
              <Badge className="bg-kucoin-red text-white">
                Admin Panel
              </Badge>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#markets" className="text-sm font-medium text-foreground hover:text-kucoin-green transition-colors">
              Markets
            </a>
            <a href="#trading" className="text-sm font-medium text-foreground hover:text-kucoin-green transition-colors">
              Trading
            </a>
            <a href="#features" className="text-sm font-medium text-foreground hover:text-kucoin-green transition-colors">
              Features
            </a>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Live Price Ticker */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            {(() => {
              const btcPrice = getPrice('BTC');
              const ethPrice = getPrice('ETH');
              return (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-xs font-medium">BTC:</span>
                    <span className={`font-semibold ${btcPrice?.isPositive ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                      {btcPrice?.price || '$--'}
                    </span>
                    <span className={`text-xs ${btcPrice?.isPositive ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                      {btcPrice?.change || '--'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-xs font-medium">ETH:</span>
                    <span className={`font-semibold ${ethPrice?.isPositive ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                      {ethPrice?.price || '$--'}
                    </span>
                    <span className={`text-xs ${ethPrice?.isPositive ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                      {ethPrice?.change || '--'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-muted/50">
                <Bell className="w-4 h-4" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-kucoin-red rounded-full animate-pulse"></div>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="kucoin-btn-secondary"
                onClick={() => navigate('/auth')}
              >
                Login
              </Button>
              <Button 
                className="kucoin-btn-primary"
                onClick={() => navigate('/auth')}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;