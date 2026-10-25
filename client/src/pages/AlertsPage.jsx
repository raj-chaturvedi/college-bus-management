import React, { useState, useEffect } from 'react';
import { transitAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportIncidentModal from '../components/common/ReportIncidentModal';
import {
  Bell,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  Info,
  AlertOctagon
} from 'lucide-react';

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await transitAPI.getAlerts();
      if (res.data?.success) {
        setAlerts(res.data.alerts);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.category === filter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-sky-600" /> Transit Service Notices & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding delays, corridor slowdowns, and schedule modifications across Greater Noida.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Report Issue</span>
          </button>
          <button
            onClick={loadAlerts}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {['ALL', 'DELAY', 'CROWD', 'INCIDENT', 'WEATHER'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === cat
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
          Loading transit notices...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-1.5">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800">No active alerts for this category</p>
          <p className="text-xs text-slate-500">All corridors operating normally.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id || alert._id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex items-start gap-3.5"
            >
              <div className="mt-0.5">
                {alert.type === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Info className="h-5 w-5 text-sky-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {alert.time || 'Live'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReportIncidentModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
      />
    </div>
  );
}
