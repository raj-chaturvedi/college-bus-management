import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Route as RouteIcon, Ticket, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ onOpenAI, onOpenPassModal }) {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Buses', path: '/live-buses', icon: MapPin },
    { label: 'Routes', path: '/routes', icon: RouteIcon },
    { label: 'Pass', path: '/digital-pass', icon: Ticket, action: onOpenPassModal }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (item.action) item.action();
            }}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      {/* Floating Assistant Trigger */}
      <button
        type="button"
        onClick={onOpenAI}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
      >
        <Sparkles className="w-5 h-5 mb-0.5" />
        <span>Ask AI</span>
      </button>
    </nav>
  );
}
