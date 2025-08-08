import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import LiveChatWidget from '@/components/LiveChatWidget';
import WhatsAppButton from '@/components/WhatsAppButton';

const NavbarLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <LiveChatWidget />
      <WhatsAppButton />
    </div>
  );
};

export default NavbarLayout;
