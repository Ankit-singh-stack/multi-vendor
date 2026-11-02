import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { roleMenus } from './Sidebar';
import DashboardHeader from './DashboardHeader';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const menu = roleMenus[user?.role] || [];

  const active =
    menu
      .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
      .sort((a, b) => b.to.length - a.to.length)[0] || null;

  const title = active?.label || 'Dashboard';
  const subtitle = `${ROLE_LABELS[user?.role] || 'MarketSphere'} workspace`;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <DashboardHeader title={title} subtitle={subtitle} onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
