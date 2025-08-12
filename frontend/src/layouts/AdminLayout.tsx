import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AdminMobileNav } from '@/components/AdminMobileNav';

const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users to dashboard
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
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
                <span className="font-bold text-lg">Kryvex Admin</span>
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

        {/* Admin User Info */}
        <div className="flex items-center gap-3 border-b p-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.firstName || "Admin"} />
            <AvatarFallback>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "Admin"
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Administrator
              </p>
            </div>
          )}
        </div>

        {/* Admin Navigation */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-2 p-2">
            <div className="space-y-1">
              <Button
                variant="default"
                className="w-full justify-start gap-3 h-11"
                onClick={() => navigate('/admin')}
              >
                <LayoutDashboard className="h-5 w-5" />
                {!isCollapsed && <span>Admin Dashboard</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Admin Mobile Navigation */}
      <AdminMobileNav />
    </div>
  );
};

export default AdminLayout;
