import React, { useState, useEffect } from 'react';
import { transitAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  History,
  Trash2,
  Plus,
  Bus,
  Route as RouteIcon,
  Navigation,
  ArrowRight,
  Clock,
  X
} from 'lucide-react';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);

  // Add favorite modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemType, setItemType] = useState('route');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [label, setLabel] = useState('');

  const loadData = async () => {
    try {
      const [favRes, histRes, rRes, bRes, sRes] = await Promise.all([
        transitAPI.getFavorites(),
        transitAPI.getHistory(),
        transitAPI.getRoutes(),
        transitAPI.getBuses(),
        transitAPI.getStops()
      ]);
      if (favRes.data?.success) setFavorites(favRes.data.favorites);
      if (histRes.data?.success) setHistory(histRes.data.history);
      if (rRes.data?.success) {
        setRoutes(rRes.data.routes);
        if (rRes.data.routes[0]) setSelectedRouteId(rRes.data.routes[0]._id);
      }
      if (bRes.data?.success) {
        setBuses(bRes.data.buses);
        if (bRes.data.buses[0]) setSelectedBusId(bRes.data.buses[0]._id);
      }
      if (sRes.data?.success) setStops(sRes.data.stops);
    } catch (err) {
      console.error('Failed to load favorites and history:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFavorite = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        itemType,
        routeId: itemType === 'route' ? selectedRouteId : null,
        busId: itemType === 'bus' ? selectedBusId : null,
        label: label || (itemType === 'route' ? 'My Daily Route' : 'My Daily Bus')
      };
      const res = await transitAPI.addFavorite(payload);
      if (res.data?.success) {
        setShowAddModal(false);
        setLabel('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save favorite');
    }
  };

  const handleDeleteFavorite = async (id) => {
    try {
      const res = await transitAPI.deleteFavorite(id);
      if (res.data?.success) {
        setFavorites(favorites.filter(f => f._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-sky-600" /> Pinned Commutes & Search History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick access to your saved daily lines and recent route search logs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white transition-colors w-fit shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Save Commute</span>
        </button>
      </div>

      {/* Pinned Favorites Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Bookmark className="h-4 w-4 text-amber-600" /> Pinned Lines ({favorites.length})
        </h2>

        {favorites.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white border border-slate-200">
            <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No favorite routes or buses saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {favorites.map((fav) => (
              <div
                key={fav._id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                    {fav.itemType === 'bus' ? <Bus className="h-4 w-4" /> : <RouteIcon className="h-4 w-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {fav.itemType}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{fav.label}</h4>
                    <p className="text-[11px] text-slate-500">
                      {fav.route?.name || fav.bus?.busNumber || 'Greater Noida Route'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFavorite(fav._id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove from favorites"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Log Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <History className="h-4 w-4 text-sky-600" /> Recent Search History ({history.length})
        </h2>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white border border-slate-200">
            <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No search logs recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((trip) => (
              <div
                key={trip._id}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-sky-700">
                    <Navigation className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <span>{trip.source?.name || 'Origin'}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span>{trip.destination?.name || 'Destination'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bus: {trip.bus?.busNumber || 'Suggested Service'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{trip.travelTime || 20}m travel</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Favorite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Save Pinned Commute</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddFavorite} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commute Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Daily Morning Class, Evening Return"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Item Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemType('route')}
                    className={`py-1.5 px-3 rounded-lg border font-semibold ${
                      itemType === 'route'
                        ? 'bg-sky-50 border-sky-600 text-sky-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Transit Corridor
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('bus')}
                    className={`py-1.5 px-3 rounded-lg border font-semibold ${
                      itemType === 'bus'
                        ? 'bg-sky-50 border-sky-600 text-sky-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Specific Bus
                  </button>
                </div>
              </div>

              {itemType === 'route' ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Route</label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  >
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Bus</label>
                  <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  >
                    {buses.map((b) => (
                      <option key={b._id} value={b._id}>{b.busNumber}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  Save Favorite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
