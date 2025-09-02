import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, Users, TicketCheck, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const Layout: React.FC = () => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navItems = [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />
  }, {
    name: 'Assets',
    path: '/assets',
    icon: <Monitor className="w-5 h-5" />,
    adminOnly: true
  }, {
    name: 'Employees',
    path: '/employees',
    icon: <Users className="w-5 h-5" />,
    adminOnly: true
  }, {
    name: 'Tickets',
    path: '/tickets',
    icon: <TicketCheck className="w-5 h-5" />
  }];
  return <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md bg-white shadow-md">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-white shadow-lg ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">
              IT Asset Manager
            </h1>
            <div className="mt-2 text-sm text-gray-600">
              <div className="font-semibold">{user?.company}</div>
              <div>
                {user?.role === 'admin' ? 'Administrator' : `${user?.team} - ${user?.name}`}
              </div>
            </div>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map(item => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            return <button key={item.path} onClick={() => {
              navigate(item.path);
              setSidebarOpen(false);
            }} className="flex items-center w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>;
          })}
          </nav>
          <div className="p-4 border-t">
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {user?.company} IT Asset Management
            </h2>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>;
};
export default Layout;