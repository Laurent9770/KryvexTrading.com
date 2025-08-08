import React from 'react';
import { Outlet } from 'react-router-dom';

const NoNavbarLayout: React.FC = () => {
  return (
    <div className="no-navbar-layout min-h-screen bg-background">
      <Outlet />
    </div>
  );
};

export default NoNavbarLayout;
