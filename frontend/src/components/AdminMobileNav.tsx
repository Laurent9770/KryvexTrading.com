import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KryvexLogo from "@/components/KryvexLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsOpen(false);
  };

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
          <SheetTitle className="sr-only">Admin Mobile Navigation</SheetTitle>
          <SheetDescription className="sr-only">Admin navigation menu for mobile devices</SheetDescription>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KryvexLogo className="h-8 w-8" />
                  <div>
                    <h2 className="font-semibold text-foreground">Kryvex Admin</h2>
                    <p className="text-xs text-muted-foreground">Administration Panel</p>
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

            {/* Admin User Info */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.firstName || "Admin"} />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "Admin"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Administrator
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Navigation */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-2">
                <Button
                  variant="default"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleNavigation('/admin')}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">Admin Dashboard</span>
                </Button>
              </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
