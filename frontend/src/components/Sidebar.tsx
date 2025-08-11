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
  History,
  Send
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
  requiresAuth?: boolean;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Debug authentication state
  console.log('🔍 Sidebar - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'user:', user?.email);
  
  // Navigation items - only authenticated users and admins
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
    // Authenticated user navigation (default for all users)
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "New",
      shortcut: "D",
      description: "View your portfolio and trading overview",
      requiresAuth: true
    },
    {
      title: "Trading",
      href: "/trading",
      icon: TrendingUp,
      shortcut: "T",
      description: "Advanced trading interface",
      requiresAuth: true
    },
    {
      title: "Wallet",
      href: "/wallet",
      icon: Wallet,
      shortcut: "W",
      description: "Manage your funds and transactions",
      requiresAuth: true
    },
    {
      title: "Trading History",
      href: "/trading-history",
      icon: History,
      shortcut: "H",
      description: "View your trading history",
      requiresAuth: true
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
      title: "Deposit",
      href: "/deposit",
      icon: CircleDollarSign,
      shortcut: "D",
      description: "Deposit funds to your account",
      requiresAuth: true
    },
    {
      title: "Withdraw",
      href: "/withdraw",
      icon: Send,
      shortcut: "W",
      description: "Withdraw funds from your account",
      requiresAuth: true
    },
                    {
                  title: "KYC Verification",
                  href: "/kyc",
                  icon: Shield,
                  shortcut: "K",
                  description: "Complete identity verification",
                  requiresAuth: true
                },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      shortcut: "S",
      description: "Account settings and preferences",
      requiresAuth: true
    }
  ];

  const isActive = (href: string) => location.pathname === href;

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    const handleClick = () => {
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

              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
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
    <div className={cn(
      "flex h-full flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <KryvexLogo className="h-8 w-8" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Trading</span>
              <span className="text-xs text-muted-foreground">Platform</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-3">
          <div className="mb-4">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isAdmin ? "ADMIN" : "TRADING"}
              </h3>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavButton key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isAdmin ? "ADMIN" : "ACCOUNT"}
              </h3>
            )}
            <div className="space-y-1">
              {bottomNavItems.map((item) => (
                <NavButton key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.firstName || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs">
                {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.firstName 
                    ? user.firstName 
                    : user.email?.split('@')[0] || 'User'
                  }
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.kycStatus === 'verified' ? '✅ Verified' : '⏳ Unverified'}
                </p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Sign Out</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}