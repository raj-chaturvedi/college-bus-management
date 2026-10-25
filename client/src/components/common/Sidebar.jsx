import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Route as RouteIcon,
  Bell,
  Bookmark,
  Sliders,
  Shield,
  Bus,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ onOpenAI }) {
  const { isAdmin } = useAuth();

  const studentNavItems = [
    { label: 'Find Route & Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Bus Tracking', path: '/live-buses', icon: MapPin },
    { label: 'Corridors & Routes', path: '/routes', icon: RouteIcon },
    { label: 'Saved & History', path: '/saved', icon: Bookmark },
    { label: 'Service Alerts', path: '/alerts', icon: Bell },
    { label: 'Commute Preferences', path: '/preferences', icon: Sliders }
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Transit Navigation
          </p>
          <nav className="space-y-1">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        {isAdmin && (
          <div>
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Fleet Administration
            </p>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-800 font-semibold'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/50'
                  }`
                }
              >
                <Shield className="h-4 w-4 text-purple-600" />
                <span>Admin Operations</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* College Bus Assistant Sidebar Action */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-sky-600 text-white flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Bus Assistant</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Ask questions about arrival times, crowds, or reasons behind route suggestions.
        </p>
        <button
          onClick={onOpenAI}
          className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-sky-700 border border-slate-200 transition-colors"
        >
          Open Assistant
        </button>
      </div>
    </aside>
  );
}
