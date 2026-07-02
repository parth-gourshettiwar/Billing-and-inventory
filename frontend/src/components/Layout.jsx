import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Receipt, History, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, Clock, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/sales', label: 'Sales History', icon: History },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Clock_ = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
      <Clock className="h-4 w-4" />
      <span>{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      <span className="text-slate-300">|</span>
      <span className="font-mono">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard', '/products': 'Products', '/customers': 'Customers',
    '/billing': 'Billing', '/sales': 'Sales History', '/reports': 'Reports', '/settings': 'Settings',
  };
  const pageTitle = pageTitles[location.pathname] || 'Showroom';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="bg-blue-600 rounded-xl p-2 shrink-0">
          <Package className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">AutoParts</p>
            <p className="text-slate-400 text-xs">Showroom System</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'}`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-3 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className={`p-3 border-t border-slate-700/50 space-y-1`}>
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-700/40 ${collapsed ? 'justify-center' : ''}`}>
          <div className="bg-blue-500/20 rounded-lg p-1.5 shrink-0">
            <User className="h-3.5 w-3.5 text-blue-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.username || 'Admin'}</p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className={`no-print hidden lg:flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out shrink-0 relative
        ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={14} className="text-slate-600" /> : <ChevronLeft size={14} className="text-slate-600" />}
        </button>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="no-print bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Menu size={20} className="text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-slate-900">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Clock_ />
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-xs">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
