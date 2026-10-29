import React, { useState, useEffect } from 'react';
import { transitAPI } from '../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  ShieldAlert,
  BarChart3,
  Bus,
  Route as RouteIcon,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import useScrollLock from '../utils/useScrollLock';

export default function AdminDashboardPage({ initialTab = 'analytics' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'analytics', 'buses', 'routes', 'stops', 'drivers', 'users'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Data
  const [analytics, setAnalytics] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusCapacity, setNewBusCapacity] = useState(50);
  const [newBusPlate, setNewBusPlate] = useState('');
  const [newBusRoute, setNewBusRoute] = useState('');
  const [newBusDriver, setNewBusDriver] = useState('');

  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  const [newStopCode, setNewStopCode] = useState('');
  const [newStopLat, setNewStopLat] = useState('28.4744');
  const [newStopLng, setNewStopLng] = useState('77.5040');
  const [newStopZone, setNewStopZone] = useState('Knowledge Park');

  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState('');

  // Quick edit occupancy modal
  const [editingOccupancyBus, setEditingOccupancyBus] = useState(null);
  const [editPassengerCount, setEditPassengerCount] = useState(30);

  useScrollLock(Boolean(showAddBusModal || showAddStopModal || showAddDriverModal || editingOccupancyBus));

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [anRes, bRes, rRes, sRes, dRes, uRes] = await Promise.all([
        transitAPI.getAnalytics(),
        transitAPI.getBuses(),
        transitAPI.getRoutes(),
        transitAPI.getStops(),
        transitAPI.getDrivers(),
        transitAPI.getUsers()
      ]);

      if (anRes.data?.success) setAnalytics(anRes.data);
      if (bRes.data?.success) setBuses(bRes.data.buses);
      if (rRes.data?.success) setRoutes(rRes.data.routes);
      if (sRes.data?.success) setStops(sRes.data.stops);
      if (dRes.data?.success) setDrivers(dRes.data.drivers);
      if (uRes.data?.success) setUsers(uRes.data.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Bus CRUD
  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      const res = await transitAPI.createBus({
        busNumber: newBusNumber,
        capacity: Number(newBusCapacity),
        plateNumber: newBusPlate || `UP-16-CB-${Math.floor(1000 + Math.random() * 9000)}`,
        route: newBusRoute || null,
        driver: newBusDriver || null,
        status: 'active'
      });
      if (res.data?.success) {
        setShowAddBusModal(false);
        setNewBusNumber('');
        setNewBusPlate('');
        fetchAllAdminData();
      }
    } catch (err) {
      alert('Error creating bus: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this bus?')) return;
    try {
      await transitAPI.deleteBus(id);
      fetchAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateOccupancy = async (e) => {
    e.preventDefault();
    if (!editingOccupancyBus) return;
    try {
      await transitAPI.updateOccupancy(editingOccupancyBus._id, {
        currentPassengers: Number(editPassengerCount),
        capacity: editingOccupancyBus.capacity
      });
      setEditingOccupancyBus(null);
      fetchAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Stop CRUD
  const handleCreateStop = async (e) => {
    e.preventDefault();
    try {
      const res = await transitAPI.createStop({
        name: newStopName,
        code: newStopCode,
        latitude: Number(newStopLat),
        longitude: Number(newStopLng),
        zone: newStopZone
      });
      if (res.data?.success) {
        setShowAddStopModal(false);
        setNewStopName('');
        setNewStopCode('');
        fetchAllAdminData();
      }
    } catch (err) {
      alert('Error adding stop: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteStop = async (id) => {
    if (!window.confirm('Delete this stop station?')) return;
    try {
      await transitAPI.deleteStop(id);
      fetchAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Driver CRUD
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await transitAPI.createDriver({
        name: newDriverName,
        phone: newDriverPhone,
        licenseNumber: newDriverLicense
      });
      if (res.data?.success) {
        setShowAddDriverModal(false);
        setNewDriverName('');
        setNewDriverPhone('');
        setNewDriverLicense('');
        fetchAllAdminData();
      }
    } catch (err) {
      alert('Error adding driver: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Remove driver from registry?')) return;
    try {
      await transitAPI.deleteDriver(id);
      fetchAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // User Status Toggle
  const handleToggleUserStatus = async (user) => {
    try {
      await transitAPI.toggleUserStatus(user._id, { isActive: !user.isActive });
      fetchAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const stats = analytics?.stats || {
    totalBuses: buses.length,
    activeBuses: buses.filter(b => b.status === 'active').length,
    totalStudents: 142,
    activeRoutes: routes.length,
    averageOccupancy: 61,
    peakHour: '08:30 AM',
    averageDelayMinutes: 2.1,
    averageReliability: 93
  };

  const charts = analytics?.charts || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide border border-slate-200">
              GREATER NOIDA TRANSIT AUTHORITY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-brand-600" /> Transport Operations & Fleet Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fleet tracking, corridor utilization, stop coverage, driver assignments, and student access control.
          </p>
        </div>

        <button
          onClick={fetchAllAdminData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Top Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Buses</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalBuses}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Fleet</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.activeBuses}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Students</span>
          <p className="text-xl font-bold text-brand-600 mt-1">{stats.totalStudents}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Routes</span>
          <p className="text-xl font-bold text-slate-800 mt-1">{stats.activeRoutes}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg Occupancy</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{stats.averageOccupancy}%</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Peak Hour</span>
          <p className="text-sm font-bold text-rose-600 mt-1 font-mono">{stats.peakHour}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg Delay</span>
          <p className="text-xl font-bold text-slate-700 mt-1">{stats.averageDelayMinutes}m</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Reliability</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.averageReliability}%</p>
        </div>
      </div>

      {/* Navigation Tabs (Prioritized per user specification) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'analytics', label: 'Overview', icon: BarChart3 },
          { id: 'buses', label: `Buses (${buses.length})`, icon: Bus },
          { id: 'routes', label: `Routes (${routes.length})`, icon: RouteIcon },
          { id: 'stops', label: `Stops (${stops.length})`, icon: MapPin },
          { id: 'drivers', label: `Drivers (${drivers.length})`, icon: Users },
          { id: 'users', label: `Students & Accounts (${users.length})`, icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Occupancy by Hour */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Average Fleet Occupancy by Hour
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Identifies morning (8:00 AM) and evening (4:30 PM) campus surge peaks
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.occupancyByHour || []}>
                    <defs>
                      <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" textAnchor="end" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" unit="%" tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="occupancy" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#occGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Searches by Hour */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student Route Searches by Hour
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Student route recommendation queries plotted over the operating day
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.searchesByHour || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="searches" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Bus Utilization */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bus Utilization & Passenger Volume
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Active passenger loads compared across all operating college buses
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.mostUsedBuses || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="busNumber" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="passengers" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Route Performance */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Route Reliability Index (%)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Percentage of on-time trip arrivals across major Greater Noida college routes
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.mostPopularRoutes || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" unit="%" domain={[70, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="reliability" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUS MANAGEMENT */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Fleet Management Registry
            </h2>
            <button
              onClick={() => setShowAddBusModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Bus
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-4">Bus Identifier</th>
                  <th className="p-4">Assigned Route</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Live Passengers</th>
                  <th className="p-4">Occupancy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {buses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{bus.busNumber}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{bus.plateNumber}</div>
                    </td>
                    <td className="p-4">{bus.route?.name || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="p-4">{bus.driver?.name || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="p-4 text-slate-600">
                      {bus.currentPassengers} / {bus.capacity} seats
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        bus.crowdLevel === 'LOW'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : bus.crowdLevel === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {bus.occupancyPercentage}% ({bus.crowdLevel})
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {bus.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingOccupancyBus(bus);
                            setEditPassengerCount(bus.currentPassengers);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors"
                        >
                          Update Crowd
                        </button>
                        <button
                          onClick={() => handleDeleteBus(bus._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Decommission Bus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTE MANAGEMENT */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Active Corridors & Line Allocations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(r => (
              <div key={r._id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold text-white shadow-xs" style={{ backgroundColor: r.color || '#0284c7' }}>
                      {r.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{r.name}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{r.distance} km • {r.estimatedTime} min</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Stations in Corridor: </span>
                  {(r.stops || []).map(s => s.stop?.name || 'Stop').join(' → ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STOP MANAGEMENT */}
      {activeTab === 'stops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Greater Noida Bus Stop Stations ({stops.length})
            </h2>
            <button
              onClick={() => setShowAddStopModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Stop
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stops.map(st => (
              <div key={st._id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-brand-700 font-mono border border-slate-200">
                      {st.code}
                    </span>
                    <span>{st.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Zone: {st.zone}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {st.latitude?.toFixed(4)}, {st.longitude?.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteStop(st._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Stop"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Licensed Drivers & Staff ({drivers.length})
            </h2>
            <button
              onClick={() => setShowAddDriverModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="h-4 w-4" /> Register Driver
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(d => (
              <div key={d._id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ★ {d.safetyRating || '4.9'}
                  </span>
                </div>
                <p className="text-slate-500">Phone: {d.phone}</p>
                <p className="text-slate-500 font-mono text-[11px]">License: {d.licenseNumber}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Experience: {d.experienceYears || 5} yrs</span>
                  <button
                    onClick={() => handleDeleteDriver(d._id)}
                    className="text-slate-400 hover:text-rose-600 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Student & Staff Access Control ({users.length})
          </h2>
          <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Default Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600">{u.preferences?.mode || 'BALANCED'}</td>
                    <td className="p-4">
                      <span className={`text-[11px] font-semibold ${u.isActive !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {u.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          u.isActive !== false
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Bus */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Fleet Bus</h3>
              <button onClick={() => setShowAddBusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBus} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Bus Number (e.g., Bus 14)</label>
                <input
                  type="text"
                  required
                  value={newBusNumber}
                  onChange={e => setNewBusNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  placeholder="Bus 14"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Plate Number</label>
                <input
                  type="text"
                  value={newBusPlate}
                  onChange={e => setNewBusPlate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  placeholder="UP-16-CB-2025"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Passenger Capacity</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={newBusCapacity}
                  onChange={e => setNewBusCapacity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assign Route</label>
                <select
                  value={newBusRoute}
                  onChange={e => setNewBusRoute(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                >
                  <option value="">Unassigned</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 font-semibold text-white"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Stop */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create New Bus Stop Station</h3>
              <button onClick={() => setShowAddStopModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStop} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Stop Station Name</label>
                <input
                  type="text"
                  required
                  value={newStopName}
                  onChange={e => setNewStopName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  placeholder="Knowledge Park III North Gate"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Code (3-4 Letters)</label>
                <input
                  type="text"
                  required
                  value={newStopCode}
                  onChange={e => setNewStopCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  placeholder="KPN"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStopLat}
                    onChange={e => setNewStopLat(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStopLng}
                    onChange={e => setNewStopLng(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Greater Noida Zone</label>
                <select
                  value={newStopZone}
                  onChange={e => setNewStopZone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-hidden"
                >
                  <option value="Knowledge Park">Knowledge Park</option>
                  <option value="Pari Chowk Hub">Pari Chowk Hub</option>
                  <option value="Alpha-Beta Corridor">Alpha-Beta Corridor</option>
                  <option value="Techzone / IT Parks">Techzone / IT Parks</option>
                  <option value="Greater Noida West">Greater Noida West</option>
                  <option value="Sector 62 Corridor">Sector 62 Corridor</option>
                  <option value="Delta-Gamma Metro">Delta-Gamma Metro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 font-semibold text-white"
                >
                  Create Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Occupancy */}
      {editingOccupancyBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Update Live Passenger Load: {editingOccupancyBus.busNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Capacity: {editingOccupancyBus.capacity} passengers. Simulates turnstile telemetry broadcast.
            </p>
            <form onSubmit={handleUpdateOccupancy} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Current Boarded Passengers
                </label>
                <input
                  type="number"
                  min="0"
                  max={editingOccupancyBus.capacity}
                  value={editPassengerCount}
                  onChange={e => setEditPassengerCount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:bg-white focus:border-brand-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  New Occupancy: {Math.round((editPassengerCount / editingOccupancyBus.capacity) * 100)}%
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOccupancyBus(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 font-semibold text-xs text-white"
                >
                  Save & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
