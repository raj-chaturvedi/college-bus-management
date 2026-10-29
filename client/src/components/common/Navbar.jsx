import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { transitAPI } from '../../services/api';
import { getTimeOfDayGreeting } from '../../utils/greeting';
import {
  Bus,
  Sparkles,
  Bell,
  User,
  LogOut,
  Shield,
  Sliders,
  ChevronDown,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ScanLine
} from 'lucide-react';

export default function Navbar({ onOpenAI, onOpenScanner, unreadAlertsCount = 0 }) {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsDropdown, setAlertsDropdown] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(unreadAlertsCount);

  const fetchAlerts = () => {
    transitAPI.getAlerts()
      .then(res => {
        if (res.data?.success) {
          const list = res.data.alerts || [];
          setRecentAlerts(list.slice(0, 6));
          const activeAlerts = list.filter(a => a.id !== 'alert_normal_ops');
          setUnreadCount(activeAlerts.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();

    const handleIncidentReported = () => {
      fetchAlerts();
    };
    window.addEventListener('transit:incident-reported', handleIncidentReported);
    return () => {
      window.removeEventListener('transit:incident-reported', handleIncidentReported);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0">
          <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-500/20">
              <Bus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                  Greater Noida Transit
                </span>
                <span className="hidden sm:inline-block rounded bg-sky-50 dark:bg-sky-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                  Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">College Bus Management Network</p>
            </div>
          </Link>
        </div>

        {/* Center: Dynamic Greeting */}
        <div className="hidden lg:flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-lg shadow-sm">
            {new Date().getHours() >= 4 && new Date().getHours() < 12 ? (
              <Sunrise className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : new Date().getHours() >= 12 && new Date().getHours() < 17 ? (
              <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            ) : (
              <Sunset className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {getTimeOfDayGreeting(user?.name || 'Student')}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isAdmin ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
              {user?.role || 'Student'}
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-600" />
            )}
          </button>

          {/* Scan Boarding Pass (Conductor / Staff) */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
              title="Scan Student QR Pass (Conductor / Staff)"
            >
              <ScanLine className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              <span className="hidden sm:inline">Scan Pass</span>
            </button>
          )}

          {/* Ask AI Trigger Button */}
          <button
            onClick={onOpenAI}
            className="flex items-center space-x-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
            title="Ask College Bus Assistant"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bus AI</span>
            <span className="sm:hidden text-[11px]">AI</span>
          </button>

          {/* Smart Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => {
                const nextState = !alertsDropdown;
                setAlertsDropdown(nextState);
                if (nextState) setUnreadCount(0);
              }}
              className="relative rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Transit Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {alertsDropdown && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Transit Service Notices</span>
                  </h4>
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsDropdown(false)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-1">
                  {recentAlerts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">All corridors running on schedule.</p>
                  ) : (
                    recentAlerts.map(alert => (
                      <div key={alert.id || alert._id} className="py-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          {alert.type === 'error' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{alert.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-1.5 sm:space-x-2 rounded-xl border border-slate-200 dark:border-slate-700 px-2 sm:px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold text-[10px]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-medium">{user.name ? user.name.split(' ')[0] : user.username}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{user.name || user.username}</p>
                    <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{user.email || 'Student Account'}</p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/preferences"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Commute Preferences</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-semibold"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
