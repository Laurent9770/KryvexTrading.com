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
import { Zap } from "lucide-react";
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
  
  // If user is admin, don't show the regular sidebar - they should use AdminLayout
  if (isAdmin) {
    return null;
  }
  
  // Navigation items - show all options for authenticated users
  const mainNavItems: NavItem[] = [
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

  const bottomNavItems: NavItem[] = [
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

  // Always show sidebar for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Kryvex</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar} alt={user?.firstName || "User"} />
          <AvatarFallback>
            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || "User"
              }
            </p>
            <p className="text-xs text-muted-foreground truncate">
              User
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2 p-2">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavButton key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t p-2">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavButton key={item.href} item={item} />
          ))}
        </div>
        
        {/* Logout Button */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}