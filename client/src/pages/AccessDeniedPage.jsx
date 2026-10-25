import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="h-3 w-3" />
            <span>Access Denied</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrator Privileges Required
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as <strong className="text-slate-900">{user?.name}</strong> with role <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{user?.role || 'student'}</span>.
            This area requires administrative authorization to view fleet telemetry, driver assignments, and transit configurations.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link
            to="/dashboard"
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Student Dashboard</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            <span>Sign In with Administrator Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
