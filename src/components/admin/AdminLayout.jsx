import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  FolderTree, 
  QrCode, 
  Receipt, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Volume2, 
  VolumeX, 
  BellRing, 
  Menu, 
  X, 
  ExternalLink,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDate } from '../../utils/formatters';

const NAV_ITEMS = [
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag, showBadge: true },
  { path: '/admin/tables', label: 'Table QRs', icon: QrCode },
  { path: '/admin/history', label: 'Order History', icon: History },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { 
    restaurant, 
    orders, 
    soundEnabled, 
    setSoundEnabled, 
    testNotificationSound, 
    activeSlug 
  } = useRestaurant();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected route check
  if (!loading && !isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  // Count orders pending bill generation for kitchen
  const pendingOrdersCount = orders.filter(o => !o.isBilled).length;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-charcoal-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-forest-900 text-white border-r border-forest-800 flex-shrink-0">
        {/* Brand header */}
        <div className="p-4 border-b border-forest-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-700 border border-forest-600 flex items-center justify-center text-gold-400 font-bold overflow-hidden shadow-inner">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-gold-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-bold text-sm text-white truncate leading-tight">
              {restaurant.name}
            </h2>
            <span className="text-[10px] text-forest-200 tracking-wider uppercase font-semibold">
              Admin & Staff Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-forest-700 text-gold-400 shadow-sm border border-forest-600'
                      : 'text-forest-100/80 hover:bg-forest-800/60 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.showBadge && pendingOrdersCount > 0 && (
                  <span className="bg-amber-500 text-charcoal-900 font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Public customer menu preview link */}
        <div className="p-3 border-t border-forest-800/80">
          <Link
            to={`/r/${activeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-forest-800/70 hover:bg-forest-800 text-forest-100 rounded-xl text-xs font-semibold transition border border-forest-700/60"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
              <span>Customer QR Menu</span>
            </span>
            <span className="text-[10px] bg-forest-700 px-1.5 py-0.5 rounded text-gold-400">Live</span>
          </Link>
        </div>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-forest-800/80 bg-forest-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-forest-800 border border-forest-700 flex items-center justify-center text-xs font-bold text-gold-400">
              {user?.displayName?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.displayName || 'Restaurant Staff'}
              </div>
              <div className="text-[10px] text-forest-300 truncate">
                {user?.email || 'admin'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-forest-200 hover:text-rose-400 hover:bg-forest-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between gap-4">
          {/* Mobile hamburger & Restaurant name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-charcoal-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="md:hidden">
              <h1 className="font-serif font-bold text-base leading-tight truncate">
                {restaurant.name}
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-charcoal-700/60">
                Today: {formatDate(new Date())}
              </div>
            </div>
          </div>

          {/* Audio Sound Alert Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Alert Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Order Alert Sound Enabled" : "Sound Muted"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                soundEnabled 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Audio Alerts ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Audio Muted</span>
                </>
              )}
            </button>

            {/* Test Sound Button */}
            <button
              onClick={testNotificationSound}
              title="Test Audio Chime"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-charcoal-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 border border-slate-200"
            >
              <BellRing className="w-3.5 h-3.5 text-forest-700" />
              <span className="hidden sm:inline">Test Sound</span>
            </button>

            {/* Quick Live Orders Link with Badge */}
            <NavLink
              to="/admin/orders"
              className="relative p-2 rounded-xl text-charcoal-700 hover:bg-slate-100 transition"
              title="Live Orders"
            >
              <ShoppingBag className="w-5 h-5 text-forest-700" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-charcoal-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                  {pendingOrdersCount}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex">
            <div className="w-64 bg-forest-900 text-white h-full flex flex-col p-4 shadow-elevated">
              <div className="flex items-center justify-between pb-4 border-b border-forest-800">
                <span className="font-serif font-bold text-base text-gold-400">
                  {restaurant.name}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-forest-800 text-forest-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-forest-700 text-gold-400'
                            : 'text-forest-100 hover:bg-forest-800'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.showBadge && pendingOrdersCount > 0 && (
                        <span className="bg-amber-500 text-charcoal-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}

                <div className="pt-4 border-t border-forest-800">
                  <Link
                    to={`/r/${activeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs text-forest-100 hover:bg-forest-800 rounded-xl font-semibold"
                  >
                    <ExternalLink className="w-4 h-4 text-gold-400" />
                    <span>Customer QR Menu</span>
                  </Link>
                </div>
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-forest-800 text-rose-300 hover:bg-forest-700 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
