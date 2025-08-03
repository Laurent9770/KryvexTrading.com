import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BarChart3,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KryvexLogo from "@/components/KryvexLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "New"
    },
    {
      title: t('trading'),
      href: "/trading",
      icon: TrendingUp
    },
    {
      title: t('market'),
      href: "/market",
      icon: BarChart3
    },
    {
      title: t('wallet'),
      href: "/wallet",
      icon: Wallet
    },
    {
      title: "Trading History",
      href: "/trading-history",
      icon: History
    },
    {
      title: t('settings'),
      href: "/settings",
      icon: Settings
    }
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-card/95 backdrop-blur-xl border border-border/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
          <SheetDescription className="sr-only">Navigation menu for mobile devices</SheetDescription>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={user?.avatar || "/placeholder.svg"} 
                      alt="Profile Picture"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white text-sm">
                      {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Kryvex</span>
                    <span className="text-xs text-muted-foreground">Trading Platform</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-sm",
                        active && "bg-primary/10 text-primary"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge className="bg-accent text-accent-foreground">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Admin Panel - Only visible to admins */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-sm"
                    onClick={() => handleNavigation('/admin')}
                  >
                    <Shield className="h-5 w-5" />
                    <span className="flex-1 text-left">Admin</span>
                  </Button>
                </div>
              )}

              {/* Sign Out */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="flex-1 text-left">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 