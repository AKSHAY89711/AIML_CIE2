import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, BarChart3, History, Layers, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { authService } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-healthcare-600 flex items-center justify-center text-white shadow-md shadow-healthcare-600/20 group-hover:bg-healthcare-700 transition">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                HealthDecide <span className="text-xs bg-healthcare-100 text-healthcare-800 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
              </span>
              <span className="text-[11px] text-slate-500 block -mt-0.5">Decision-Support Platform</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/assessment"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/assessment')
                  ? 'bg-healthcare-50 text-healthcare-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-healthcare-600" />
              New Assessment
            </Link>

            <Link
              to="/history"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/history')
                  ? 'bg-healthcare-50 text-healthcare-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 text-slate-500" />
              Assessment History
            </Link>

            <Link
              to="/compare"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/compare')
                  ? 'bg-healthcare-50 text-healthcare-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              Plan Comparison
            </Link>

            <Link
              to="/model-performance"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/model-performance')
                  ? 'bg-healthcare-50 text-healthcare-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Model Performance
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin
              </Link>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-800 block truncate max-w-[140px]">
                    {user?.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-healthcare-600 hover:bg-healthcare-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-healthcare-600/30 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
