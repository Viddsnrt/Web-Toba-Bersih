
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Plus, Trash2, Edit3, MapPin, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Save, X, GripVertical,
  Navigation, Truck, Calendar, CheckCircle, AlertCircle,
  ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface Waypoint {
  id: string;
  routeId: string;
  order: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteTemplate {
  id: string;
  truckId: string;
  dayOfWeek: string;
  name: string;
  isActive: boolean;
  truck: { id: string; plateNumber: string };
  waypoints: Waypoint[];
  totalWaypoint: number;
}

interface TrukItem {
  id: string;
  plateNumber: string;
}

const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
const HARI_COLOR: Record<string, string> = {
  SENIN: 'bg-blue-100 text-blue-700 border-blue-200',
  SELASA: 'bg-purple-100 text-purple-700 border-purple-200',
  RABU: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  KAMIS: 'bg-amber-100 text-amber-700 border-amber-200',
  JUMAT: 'bg-rose-100 text-rose-700 border-rose-200',
  SABTU: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  MINGGU: 'bg-orange-100 text-orange-700 border-orange-200',
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Sub-komponen: Peta Leaflet Inline ──────────────────────
function PetaWaypoint({
  waypoints,
  onMapClick,
  selectedIdx,
}: {
  waypoints: Waypoint[];
  onMapClick: (lat: number, lng: number) => void;
  selectedIdx: number | null;
}) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [2.3333, 99.0632],
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      (mapRef.current as any)._L = L;
      setIsReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // Update marker & garis ketika waypoints berubah
  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    const map = mapRef.current;
    const L = map._L;

    // Hapus marker lama
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (lineRef.current) { lineRef.current.remove(); lineRef.current = null; }

    if (waypoints.length === 0) return;

    const latlngs: [number, number][] = [];

    waypoints.forEach((wp, idx) => {
      const isTPA = wp.name.toLowerCase().includes('tpa');
      const isSelected = idx === selectedIdx;
      const bg = isTPA ? '#7c3aed' : isSelected ? '#ef4444' : '#f59e0b';

      const icon = L.divIcon({
        html: `<div style="background:${bg};color:white;border-radius:50%;width:26px;height:26px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:10px;font-weight:bold;display:flex;align-items:center;justify-content:center">${isTPA ? '🏁' : wp.order}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([wp.latitude, wp.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${wp.order}. ${wp.name}</b><br/><small>${wp.latitude.toFixed(5)}, ${wp.longitude.toFixed(5)}</small>`);

      markersRef.current.push(marker);
      latlngs.push([wp.latitude, wp.longitude]);
    });

    if (latlngs.length > 1) {
      lineRef.current = L.polyline(latlngs, {
        color: '#7c3aed',
        weight: 2.5,
        opacity: 0.7,
        dashArray: '6 6',
      }).addTo(map);
    }

    // Zoom ke bounds semua waypoint
    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
    }
  }, [waypoints, selectedIdx, isReady]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={containerRef} style={{ height: '340px', width: '100%' }} />
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 shadow border border-slate-100">
        🖱 Klik peta untuk tambah titik
      </div>
    </div>
  );
}

// ─── Komponen Utama ──────────────────────────────────────────
export default function ManajemenRute() {
  const [ruteList, setRuteList] = useState<RouteTemplate[]>([]);
  const [trukList, setTrukList] = useState<TrukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal Buat Rute
  const [showModalRute, setShowModalRute] = useState(false);
  const [formRute, setFormRute] = useState({ truckId: '', dayOfWeek: '', name: '' });

  // Editing Waypoint state
  const [editingRuteId, setEditingRuteId] = useState<string | null>(null);
  const [localWaypoints, setLocalWaypoints] = useState<Waypoint[]>([]);
  const [selectedWpIdx, setSelectedWpIdx] = useState<number | null>(null);
  const [wpForm, setWpForm] = useState({ name: '', latitude: '', longitude: '' });
  const [savingWp, setSavingWp] = useState(false);

  // Filter
  const [filterTruk, setFilterTruk] = useState('');
  const [filterHari, setFilterHari] = useState('');

  const token = () => localStorage.getItem('token');

  // ── Fetch ────────────────────────────────────────────────
  const fetchRute = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterTruk) params.truckId = filterTruk;
      if (filterHari) params.hari = filterHari;

      const res = await axios.get(`${API}/api/rute`, {
        headers: { Authorization: `Bearer ${token()}` },
        params,
      });
      setRuteList(res.data.data || []);
    } catch (e) {
      toast.error('Gagal memuat data rute');
    } finally {
      setLoading(false);
    }
  }, [filterTruk, filterHari]);

const fetchTruk = async () => {
  try {
    const res = await axios.get(`${API}/api/admin/truks`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    setTrukList(res.data.data || []);
  } catch (err) {
    console.error('Gagal fetch truk:', err);
  }
};

  useEffect(() => { fetchRute(); fetchTruk(); }, [fetchRute]);

  // ── Buat Rute ────────────────────────────────────────────
  const handleBuatRute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRute.truckId || !formRute.dayOfWeek || !formRute.name) {
      toast.error('Semua field wajib diisi');
      return;
    }
    try {
      await axios.post(`${API}/api/rute`, formRute, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success('Rute berhasil dibuat!');
      setShowModalRute(false);
      setFormRute({ truckId: '', dayOfWeek: '', name: '' });
      fetchRute();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat rute');
    }
  };

  // ── Toggle Aktif ─────────────────────────────────────────
  const handleToggle = async (ruteId: string) => {
    try {
      await axios.patch(`${API}/api/rute/${ruteId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      fetchRute();
    } catch {
      toast.error('Gagal mengubah status rute');
    }
  };

  // ── Hapus Rute ───────────────────────────────────────────
  const handleHapusRute = async (ruteId: string, name: string) => {
    if (!confirm(`Hapus rute "${name}"? Semua waypoint akan ikut terhapus.`)) return;
    try {
      await axios.delete(`${API}/api/rute/${ruteId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success('Rute dihapus');
      fetchRute();
    } catch {
      toast.error('Gagal menghapus rute');
    }
  };

  // ── Buka editor waypoint untuk suatu rute ────────────────
  const openWaypointEditor = (rute: RouteTemplate) => {
    setEditingRuteId(rute.id);
    setLocalWaypoints([...rute.waypoints]);
    setSelectedWpIdx(null);
    setWpForm({ name: '', latitude: '', longitude: '' });
    setExpandedId(rute.id);
  };

  // ── Klik peta → isi form lat/lng otomatis ───────────────
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setWpForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  }, []);

  // ── Tambah waypoint lokal (belum save ke server) ─────────
  const handleTambahWpLokal = () => {
    if (!wpForm.name || !wpForm.latitude || !wpForm.longitude) {
      toast.error('Nama, Latitude, dan Longitude wajib diisi');
      return;
    }
    const newWp: Waypoint = {
      id: `temp-${Date.now()}`,
      routeId: editingRuteId!,
      order: localWaypoints.length + 1,
      name: wpForm.name,
      latitude: parseFloat(wpForm.latitude),
      longitude: parseFloat(wpForm.longitude),
    };
    setLocalWaypoints(prev => [...prev, newWp]);
    setWpForm({ name: '', latitude: '', longitude: '' });
    setSelectedWpIdx(localWaypoints.length); // select yang baru
  };

  // ── Hapus waypoint lokal ─────────────────────────────────
  const handleHapusWpLokal = (idx: number) => {
    setLocalWaypoints(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.map((wp, i) => ({ ...wp, order: i + 1 }));
    });
    setSelectedWpIdx(null);
  };

  // ── Pindah urutan ────────────────────────────────────────
  const moveWp = (idx: number, dir: 'up' | 'down') => {
    setLocalWaypoints(prev => {
      const arr = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr.map((wp, i) => ({ ...wp, order: i + 1 }));
    });
    setSelectedWpIdx(dir === 'up' ? idx - 1 : idx + 1);
  };

  // ── Simpan semua waypoint ke server (bulk) ───────────────
  const handleSimpanWaypoints = async () => {
    if (!editingRuteId) return;
    setSavingWp(true);
    try {
      await axios.post(
        `${API}/api/rute/${editingRuteId}/waypoint`,
        {
          bulk: localWaypoints.map(wp => ({
            name: wp.name,
            latitude: wp.latitude,
            longitude: wp.longitude,
            order: wp.order,
          })),
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      toast.success('Waypoint berhasil disimpan!');
      setEditingRuteId(null);
      fetchRute();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan waypoint');
    } finally {
      setSavingWp(false);
    }
  };

  // ── Filtered list ────────────────────────────────────────
  const filtered = ruteList.filter(r => {
    if (filterTruk && r.truckId !== filterTruk) return false;
    if (filterHari && r.dayOfWeek !== filterHari) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 antialiased pb-24 font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-violet-600 shadow-lg shadow-violet-200">
              <Navigation className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Manajemen Rute Truk</h1>
              <p className="text-xs text-slate-400 mt-0.5">{ruteList.length} rute terdaftar</p>
            </div>
          </div>
          <button
            onClick={() => setShowModalRute(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-200 transition-all"
          >
            <Plus size={18} /> Buat Rute Baru
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-5">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Filter:
          </div>
          <select
            value={filterTruk}
            onChange={e => setFilterTruk(e.target.value)}
            className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-semibold outline-none border border-slate-100 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          >
            <option value="">Semua Truk</option>
            {trukList.map(t => (
              <option key={t.id} value={t.id}>{t.plateNumber}</option>
            ))}
          </select>
          <select
            value={filterHari}
            onChange={e => setFilterHari(e.target.value)}
            className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-semibold outline-none border border-slate-100 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          >
            <option value="">Semua Hari</option>
            {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button
            onClick={fetchRute}
            className="ml-auto p-2.5 bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 rounded-xl border border-slate-100 transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Belum ada rute terdaftar</p>
            <p className="text-slate-400 text-sm mt-1">Klik "Buat Rute Baru" untuk memulai</p>
          </div>
        )}

        {/* Rute Cards */}
        {!loading && filtered.map(rute => {
          const isExpanded = expandedId === rute.id;
          const isEditing  = editingRuteId === rute.id;

          return (
            <div
              key={rute.id}
              className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
                isExpanded ? 'border-violet-200 shadow-md' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="px-6 py-4 flex items-center gap-4">
                {/* Toggle expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rute.id)}
                  className="text-slate-400 hover:text-violet-600 transition"
                >
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {/* Badge hari */}
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${HARI_COLOR[rute.dayOfWeek] || 'bg-slate-100 text-slate-600'}`}>
                  {rute.dayOfWeek}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 truncate">{rute.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Truck size={12} /> {rute.truck.plateNumber}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> {rute.totalWaypoint ?? rute.waypoints.length} titik
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${rute.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {rute.isActive ? '● Aktif' : '○ Nonaktif'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openWaypointEditor(rute)}
                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition"
                    title="Edit Waypoint"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    onClick={() => handleToggle(rute.id)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Toggle Aktif"
                  >
                    {rute.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                  </button>
                  <button
                    onClick={() => handleHapusRute(rute.id, rute.name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Hapus Rute"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {/* Expanded: daftar waypoint (view mode) */}
              {isExpanded && !isEditing && (
                <div className="px-6 pb-5 border-t border-slate-50">
                  {rute.waypoints.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-slate-400 text-sm font-semibold">Belum ada waypoint</p>
                      <button
                        onClick={() => openWaypointEditor(rute)}
                        className="mt-3 text-xs text-violet-600 font-bold hover:underline"
                      >
                        + Tambah Waypoint
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {rute.waypoints.map((wp, idx) => {
                        const isTPA = wp.name.toLowerCase().includes('tpa');
                        return (
                          <div
                            key={wp.id}
                            className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100"
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${isTPA ? 'bg-violet-600' : 'bg-amber-500'}`}>
                              {isTPA ? '🏁' : wp.order}
                            </span>
                            <span className="text-sm font-semibold text-slate-700 flex-1">{wp.name}</span>
                            <span className="text-xs text-slate-400 font-mono">{wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}</span>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => openWaypointEditor(rute)}
                        className="mt-2 w-full py-2 text-xs text-violet-600 font-bold border border-dashed border-violet-200 rounded-xl hover:bg-violet-50 transition"
                      >
                        ✏ Edit Waypoint
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded: MODE EDIT WAYPOINT */}
              {isExpanded && isEditing && (
                <div className="border-t border-slate-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Kiri: Peta */}
                    <div className="p-5 border-r border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Peta Rute</p>
                      <PetaWaypoint
                        waypoints={localWaypoints}
                        onMapClick={handleMapClick}
                        selectedIdx={selectedWpIdx}
                      />

                      {/* Form tambah waypoint */}
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tambah Titik Baru</p>
                        <input
                          type="text"
                          placeholder="Nama lokasi (cth: Simpang Sibulele)"
                          value={wpForm.name}
                          onChange={e => setWpForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="Latitude"
                            value={wpForm.latitude}
                            onChange={e => setWpForm(p => ({ ...p, latitude: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                          />
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="Longitude"
                            value={wpForm.longitude}
                            onChange={e => setWpForm(p => ({ ...p, longitude: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          💡 Klik peta di atas untuk mengisi koordinat otomatis
                        </p>
                        <button
                          onClick={handleTambahWpLokal}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition"
                        >
                          <Plus size={16} /> Tambah ke Daftar
                        </button>
                      </div>
                    </div>

                    {/* Kanan: Daftar Waypoint (drag & reorder) */}
                    <div className="p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Daftar Waypoint ({localWaypoints.length})
                        </p>
                        {localWaypoints.length > 0 && (
                          <span className="text-[11px] text-slate-400">Gunakan ↑↓ untuk urutkan</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-1">
                        {localWaypoints.length === 0 && (
                          <div className="text-center py-10">
                            <MapPin className="mx-auto text-slate-200 mb-2" size={32} />
                            <p className="text-sm text-slate-400">Klik peta atau isi form untuk menambah titik</p>
                          </div>
                        )}
                        {localWaypoints.map((wp, idx) => {
                          const isTPA = wp.name.toLowerCase().includes('tpa');
                          return (
                            <div
                              key={wp.id}
                              onClick={() => setSelectedWpIdx(idx)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                selectedWpIdx === idx
                                  ? 'border-violet-400 bg-violet-50'
                                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                              }`}
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 ${isTPA ? 'bg-violet-600' : 'bg-amber-500'}`}>
                                {isTPA ? '🏁' : wp.order}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{wp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}</p>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={e => { e.stopPropagation(); moveWp(idx, 'up'); }}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); moveWp(idx, 'down'); }}
                                  disabled={idx === localWaypoints.length - 1}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); handleHapusWpLokal(idx); }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tombol Simpan / Batal */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={handleSimpanWaypoints}
                          disabled={savingWp}
                          className="flex-[2] flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-violet-700 text-white text-sm font-black rounded-xl shadow transition disabled:opacity-60"
                        >
                          {savingWp ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {savingWp ? 'Menyimpan...' : 'Simpan Semua Waypoint'}
                        </button>
                        <button
                          onClick={() => { setEditingRuteId(null); setLocalWaypoints([]); }}
                          className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Modal Buat Rute */}
      {showModalRute && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Buat Rute Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Waypoint bisa ditambah setelah rute dibuat</p>
              </div>
              <button onClick={() => setShowModalRute(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleBuatRute} className="p-7 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Truk</label>
               <select
  value={formRute.truckId}
  onChange={e => {
    const truk = trukList.find(t => t.id === e.target.value);
    setFormRute(prev => ({
      ...prev,
      truckId: e.target.value,
      name: truk && prev.dayOfWeek ? `Rute ${truk.plateNumber} - ${prev.dayOfWeek}` : prev.name,
    }));
  }}
  required
  className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-violet-500 rounded-2xl text-sm font-bold outline-none transition"
>
  <option value="">-- Pilih Truk --</option>
  {trukList.map(t => (
    <option key={t.id} value={t.id}>{t.plateNumber}</option>
  ))}
</select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hari Operasional</label>
                <div className="grid grid-cols-4 gap-2">
                  {HARI_LIST.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        const truk = trukList.find(t => t.id === formRute.truckId);
                        setFormRute(p => ({
                          ...p,
                          dayOfWeek: h,
                          name: truk ? `Rute ${truk.plateNumber} - ${h}` : p.name,
                        }));
                      }}
                      className={`py-2 text-xs font-black rounded-xl border-2 transition ${
                        formRute.dayOfWeek === h
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {h.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nama Rute</label>
                <input
                  type="text"
                  value={formRute.name}
                  onChange={e => setFormRute(p => ({ ...p, name: e.target.value }))}
                  placeholder="Cth: Rute BB 8160 E - Senin"
                  required
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-violet-500 rounded-2xl text-sm font-bold outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl shadow-lg shadow-violet-200 transition"
              >
                Buat Rute
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}