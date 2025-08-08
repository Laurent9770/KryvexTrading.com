import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  ] : user ? [
    // Authenticated user navigation
    {
      title: t('dashboard'),
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "New",
      shortcut: "D",
      description: "View your portfolio and trading overview"
    },
  ] : [
    // Non-authenticated user navigation (view-only)
    {
      title: "Home",
      href: "/",
      icon: LayoutDashboard,
      shortcut: "H",
      description: "Welcome to Kryvex Trading Platform"
    },
    {
      title: "Markets",
      href: "/market",
      icon: BarChart3,
      shortcut: "M",
      description: "Real-time market data and analysis"
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

  const isActive = (href: string) => location.pathname === href;

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    const handleClick = () => {
      // Check if user is authenticated for protected routes
      const protectedRoutes = ['/trading', '/wallet', '/trading-history', '/settings', '/kyc', '/deposit', '/withdraw', '/support', '/dashboard'];
      if (!user && protectedRoutes.includes(item.href)) {
        navigate('/auth');
        return;
      }
      navigate(item.href);
    };
    
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
            onClick={handleClick}
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
              {user && !isAdmin && (
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
                  {isAdmin ? "Admin Platform" : user ? "Trading Platform" : "View Mode"}
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

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="mt-4 space-y-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isAdmin ? "Admin Actions" : "Quick Actions"}
                </span>
              </div>
              {isAdmin ? (
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-9 text-xs"
                    onClick={() => navigate('/admin')}
                  >
                    <User className="h-4 w-4" />
                    <span>User Management</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-9 text-xs"
                    onClick={() => navigate('/admin')}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Trade Monitoring</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-9 text-xs"
                    onClick={() => navigate('/trading')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Start Trading</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-9 text-xs"
                    onClick={() => navigate('/wallet')}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>View Wallet</span>
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
          
          {/* Sign Out / Sign In */}
          {user ? (
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
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn(!isCollapsed && "hidden")}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Sign Out</span>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 text-primary hover:text-primary hover:bg-primary/10",
                    isCollapsed ? "px-2" : "px-3"
                  )}
                  onClick={() => navigate('/auth')}
                >
                  <User className="h-5 w-5" />
                  {!isCollapsed && (
                    <>
                      <span className="truncate font-medium">Sign In</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn(!isCollapsed && "hidden")}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Sign In</span>
                  <span className="text-xs text-muted-foreground">Create account or sign in</span>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}