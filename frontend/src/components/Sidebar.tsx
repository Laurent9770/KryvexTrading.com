import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Bot,
  Activity,
  BarChart3,
  Zap,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Bell,
  Shield,
  Coins,
  Target,
  PieChart,
  Calculator,
  Brain,
  MonitorSpeaker,
  CircleDollarSign,
  Lock,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import KryvexLogo from "@/components/KryvexLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  shortcut?: string;
  description?: string;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();

  // Keyboard shortcuts
  useHotkeys('ctrl+k', () => setShowShortcuts(!showShortcuts));
  useHotkeys('escape', () => setShowShortcuts(false));

  // Different navigation items for admin vs regular users
  const mainNavItems: NavItem[] = isAdmin ? [
    // Admin navigation - simplified and focused on admin tasks
    {
      title: "Admin Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      badge: "Admin",
      shortcut: "D",
      description: "Admin dashboard and user management"
    }
  ] : [
    // Regular user navigation
    {
      title: t('dashboard'),
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "New",
      shortcut: "D",
      description: "View your portfolio and trading overview"
    },
    {
      title: t('trading'),
      href: "/trading",
      icon: TrendingUp,
      shortcut: "T",
      description: "All trading features: Spot, Futures, Options, Binary, Quant, Bots, Staking"
    },
    {
      title: t('market'),
      href: "/market",
      icon: BarChart3,
      shortcut: "M",
      description: "Real-time market data and analysis"
    },
    {
      title: t('wallet'),
      href: "/wallet",
      icon: Wallet,
      shortcut: "W",
      description: "Manage your funds and transactions"
    },
    {
      title: "Trading History",
      href: "/trading-history",
      icon: History,
      shortcut: "H",
      description: "View your complete trading history"
    }
  ];

  const bottomNavItems: NavItem[] = isAdmin ? [
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      shortcut: "S",
      description: "Admin settings and preferences"
    }
  ] : [
    {
      title: t('settings'),
      href: "/settings",
      icon: Settings,
      shortcut: "S",
      description: "Account settings and preferences"
    }
  ];

  // Navigation shortcuts
  mainNavItems.forEach(item => {
    if (item.shortcut) {
      useHotkeys(`ctrl+${item.shortcut.toLowerCase()}`, () => navigate(item.href));
    }
  });
  
  bottomNavItems.forEach(item => {
    if (item.shortcut) {
      useHotkeys(`ctrl+${item.shortcut.toLowerCase()}`, () => navigate(item.href));
    }
  });
  
  // Admin-specific shortcuts
  if (isAdmin) {
    useHotkeys('ctrl+u', () => navigate('/admin')); // Users
    useHotkeys('ctrl+t', () => navigate('/admin')); // Trades
  }

  useHotkeys('ctrl+shift+q', () => logout());

  const isActive = (href: string) => location.pathname === href;

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-11 transition-all duration-200",
              isCollapsed ? "px-2" : "px-3",
              active 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "hover:bg-muted/50 hover:text-foreground",
              "group relative overflow-hidden"
            )}
            onClick={() => navigate(item.href)}
          >
            <Icon className={cn("h-5 w-5 transition-all", active && "scale-110")} />
            {!isCollapsed && (
              <>
                <span className="truncate font-medium">{item.title}</span>
                {item.badge && (
                  <Badge className="ml-auto bg-accent text-accent-foreground">
                    {item.badge}
                  </Badge>
                )}
                {item.shortcut && showShortcuts && (
                  <div className="ml-auto text-xs opacity-60">
                    Ctrl+{item.shortcut}
                  </div>
                )}
              </>
            )}
            {active && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className={cn(!isCollapsed && "hidden")}>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.title}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground">{item.description}</span>
            )}
            {item.shortcut && (
              <div className="text-xs font-mono bg-muted px-1 rounded">
                Ctrl+{item.shortcut}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (!user) return null;

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-16" : "w-72",
        "animate-in slide-in-from-left",
        // Mobile responsive: hide on small screens, show as overlay on medium+
        "hidden md:flex"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={user?.avatar || "/placeholder.svg"} 
                    alt="Profile Picture"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white text-xs">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              <KryvexLogo size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Kryvex</span>
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin Platform" : "Trading Platform"}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 hover:bg-muted/50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide px-3 py-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isAdmin ? "Admin" : "Trading"}
                </span>
              </div>
            )}
            {mainNavItems.map((item) => (
              <NavButton key={item.href} item={item} />
            ))}
          </div>

          {/* Keyboard Shortcuts Toggle */}
          <div className="mt-6 pt-6 border-t border-border/50">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="w-full justify-start gap-3 h-9 text-xs"
              >
                <Keyboard className="h-4 w-4" />
                <span>{showShortcuts ? "Hide" : "Show"} Shortcuts</span>
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="mt-4 space-y-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isAdmin ? "Admin Actions" : "Quick Actions"}
                </span>
              </div>
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs hover:bg-blue-600 hover:text-background transition-all"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Users
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs hover:bg-purple-600 hover:text-background transition-all"
                    onClick={() => navigate('/admin')}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Trades
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs hover:bg-crypto-green hover:text-background transition-all"
                    onClick={() => navigate('/trading')}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Buy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs hover:bg-crypto-red hover:text-background transition-all"
                    onClick={() => navigate('/trading')}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Sell
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-border/50 p-3">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavButton key={item.href} item={item} />
          ))}
          
          {/* Sign Out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10",
                  isCollapsed ? "px-2" : "px-3"
                )}
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && (
                  <>
                    <span className="truncate font-medium">Sign Out</span>
                    {showShortcuts && (
                      <div className="ml-auto text-xs opacity-60">
                        Ctrl+Shift+Q
                      </div>
                    )}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className={cn(!isCollapsed && "hidden")}>
              <div className="flex flex-col gap-1">
                <span className="font-medium">Sign Out</span>
                <div className="text-xs font-mono bg-muted px-1 rounded">
                  Ctrl+Shift+Q
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && !isCollapsed && (
        <div className="absolute bottom-20 left-3 right-3 bg-popover border border-border rounded-lg p-3 shadow-lg animate-in slide-in-from-bottom">
          <div className="text-xs space-y-1">
            <div className="font-semibold mb-2">Keyboard Shortcuts</div>
            <div className="flex justify-between">
              <span>Toggle Sidebar</span>
              <span className="font-mono bg-muted px-1 rounded">Ctrl+B</span>
            </div>
            <div className="flex justify-between">
              <span>Show Shortcuts</span>
              <span className="font-mono bg-muted px-1 rounded">Ctrl+Shift+/</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}