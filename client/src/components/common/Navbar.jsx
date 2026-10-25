import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Sunrise,
  Sunset,
  ScanLine
} from 'lucide-react';

export default function Navbar({ onOpenAI, onOpenScanner, unreadAlertsCount = 0 }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsDropdown, setAlertsDropdown] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    transitAPI.getAlerts()
      .then(res => {
        if (res.data?.success) {
          setRecentAlerts(res.data.alerts.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  Greater Noida College Transit
                </span>
                <span className="hidden sm:inline-block rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-100">
                  Live Network
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Campus Bus Management & Route Guidance</p>
            </div>
          </Link>
        </div>

        {/* Center: Dynamic Greeting */}
        <div className="hidden md:flex items-center space-x-2.5 text-xs text-slate-600">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            {new Date().getHours() >= 4 && new Date().getHours() < 12 ? (
              <Sunrise className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            ) : new Date().getHours() >= 12 && new Date().getHours() < 17 ? (
              <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Sunset className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            )}
            <span className="font-semibold text-slate-800">
              {getTimeOfDayGreeting(user?.name || 'Student')}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'}`}>
              {user?.role || 'Guest'}
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Scan Boarding Pass (Conductor / Staff) */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors border border-slate-200"
              title="Scan Student QR Pass (Conductor / Staff)"
            >
              <ScanLine className="h-3.5 w-3.5 text-slate-700" />
              <span className="hidden sm:inline">Scan Pass</span>
            </button>
          )}

          {/* Ask AI Trigger Button */}
          <button
            onClick={onOpenAI}
            className="flex items-center space-x-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
            title="Ask College Bus Assistant"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bus Assistant</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Smart Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setAlertsDropdown(!alertsDropdown)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Transit Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-600" />
              )}
            </button>

            {/* Alerts Dropdown */}
            {alertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-sky-600" />
                    <span>Transit Service Notices</span>
                  </h4>
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsDropdown(false)}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-1">
                  {recentAlerts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">All corridors running on schedule.</p>
                  ) : (
                    recentAlerts.map(alert => (
                      <div key={alert.id || alert._id} className="py-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          {alert.type === 'error' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{alert.title}</p>
                            <p className="text-slate-500 mt-0.5 text-[11px]">{alert.message}</p>
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
                className="flex items-center space-x-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-medium">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50">
                  <div className="p-2 border-b border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/preferences"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      <span>Commute Preferences</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-purple-700 hover:bg-purple-50 transition-colors font-semibold"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white transition-colors"
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
