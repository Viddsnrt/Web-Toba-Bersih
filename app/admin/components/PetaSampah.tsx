"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────
interface Laporan {
  id: string;
  latitude: string | number;
  longitude: string | number;
  description: string;
  photoUrl: string | null;
  status: string;
  jenisSampah: string | null;
  createdAt: string;
  user?: { fullName: string };
  location?: { name: string };
}

interface Polygon {
  id: string;
  name: string;
  code: string;
  center: number[];
  isActive: boolean;
}

interface RuteWaypoint {
  urutan: number;
  nama: string;
  lat: number;
  lng: number;
}

interface RuteJadwal {
  hari: string;
  namaHari: string;
  waypoints: RuteWaypoint[];
}

interface TrukAktif {
  id: string;
  plateNumber: string;
  status: string;
  currentLat: number | null;
  currentLong: number | null;
  lastPing: string | null;
  lastLocation: string | null;
  operator: { id: string; fullName: string; phoneNumber: string | null } | null;
  taskAktif: { status: string; location: string; district: string | null } | null;
  ruteHariIni: RuteJadwal | null;
}

interface TitikJalur {
  lat: number;
  lng: number;
  timestamp: string;
}

interface RingkasanHasil {
  truckId: string;
  plateNumber: string;
  operatorName: string;
  tanggal: string;
  hariKerja: string;
  ringkasan: {
    totalTaskSelesai: number;
    totalVolumeSampahKg: number;
    jarakTempuhKm: number;
    durasiKerjaMenit: number;
    durasiKerjaJam: number;
    waktuMulai: string | null;
    waktuSelesai: string | null;
  };
  detailTask: Array<{
    id: string;
    location: string;
    district: string | null;
    completedAt: string;
    volumeKg: number | null;
    notes: string | null;
    jumlahFoto: number;
  }>;
  jalurAktual: TitikJalur[];
  ruteJadwal: RuteJadwal | null;
}

// ─────────────────────────────────────────────
// KOMPONEN PETA LAPORAN SAMPAH
// ─────────────────────────────────────────────
function TabLaporan() {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [MapComponents, setMapComponents] = useState<any>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setIsClient(true);
    loadLeaflet();
    fetchLaporan();
    fetchPolygons();
  }, []);

  const loadLeaflet = async () => {
    try {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });apiUrl
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
      setMapComponents({ MapContainer, TileLayer, Marker, Popup, L });
    } catch (error) {
      console.error('Error loading Leaflet:', error);
    }
  };

  const fetchLaporan = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/api/laporan`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      let dataArray = [];
      if (res.data?.success && Array.isArray(res.data?.data)) dataArray = res.data.data;
      else if (Array.isArray(res.data)) dataArray = res.data;
      const serialized = dataArray.map((item: any) => ({
        ...item,
        id: item.id?.toString(),
        userId: item.userId?.toString(),
        locationId: item.locationId?.toString() || null,
      }));
      setLaporanList(serialized);
      const kecamatan = serialized
        .map((l: any) => l.location?.name)
        .filter((k: string, i: number, arr: string[]) => k && arr.indexOf(k) === i);
      setKecamatanList(kecamatan);
    } catch (error) {
      console.warn('Error fetching laporan:', error);
      setLaporanList([]);
    }
  };

  const fetchPolygons = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/wilayah/polygons`, { timeout: 5000 })
        .catch(err => { console.warn('Failed polygons:', err.message); return { data: [] }; });
      setPolygons(res.data || []);
    } catch (error) {
      setPolygons([]);
    } finally {
      setLoading(false);
    }
  };

  const parseCoord = (c: string | number): number => typeof c === 'number' ? c : parseFloat(c) || 0;

  const filteredLaporan = laporanList.filter(l =>
    (selectedStatus === 'semua' || l.status === selectedStatus) &&
    (selectedKecamatan === 'semua' || l.location?.name === selectedKecamatan)
  );

  const totalLaporan  = laporanList.length;
  const pendingCount  = laporanList.filter(l => l.status === 'PENDING').length;
  const prosesCount   = laporanList.filter(l => l.status === 'DITINDAKLANJUTI').length;
  const selesaiCount  = laporanList.filter(l => l.status === 'SELESAI').length;

  if (!isClient || !MapComponents) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = MapComponents;

  const getMarkerIcon = (status: string) => {
    const color = status === 'PENDING' ? '#EF4444' :
      status === 'DITINDAKLANJUTI' ? '#3B82F6' :
      status === 'SELESAI' ? '#10B981' : '#6B7280';
    return L.divIcon({
      html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
      className: '', iconSize: [20, 20]
    });
  };

  const getKecamatanIcon = (name: string) => L.divIcon({
    html: `<div style="background-color:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);position:relative"><div style="position:absolute;top:-25px;left:50%;transform:translateX(-50%);background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;color:#1E40AF;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.1)">${name}</div></div>`,
    className: '', iconSize: [16, 16]
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Peta GIS - Titik Laporan Sampah</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600 font-semibold">Total Laporan</p><p className="text-2xl font-bold text-blue-800">{totalLaporan}</p></div>
          <div className="bg-red-50 p-4 rounded-lg"><p className="text-sm text-red-600 font-semibold">Pending</p><p className="text-2xl font-bold text-red-800">{pendingCount}</p></div>
          <div className="bg-yellow-50 p-4 rounded-lg"><p className="text-sm text-yellow-600 font-semibold">Diproses</p><p className="text-2xl font-bold text-yellow-800">{prosesCount}</p></div>
          <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600 font-semibold">Selesai</p><p className="text-2xl font-bold text-green-800">{selesaiCount}</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="semua">Semua Status</option>
              <option value="PENDING">Pending (Merah)</option>
              <option value="DITINDAKLANJUTI">Diproses (Biru)</option>
              <option value="SELESAI">Selesai (Hijau)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kecamatan</label>
            <select value={selectedKecamatan} onChange={e => setSelectedKecamatan(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="semua">Semua Kecamatan</option>
              {kecamatanList.map(kec => <option key={kec} value={kec}>{kec}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-sm text-gray-500">Menampilkan {filteredLaporan.length} dari {totalLaporan} titik</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-[600px] w-full">
          <MapContainer center={[2.3333, 99.0]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {polygons.map(p => {
              if (!p.center || p.center.length !== 2) return null;
              return (
                <Marker key={`kec-${p.id}`} position={[p.center[0], p.center[1]]} icon={getKecamatanIcon(p.name)}>
                  <Popup><div className="p-2"><h3 className="font-bold text-lg">{p.name}</h3><p className="text-sm">Kode: {p.code}</p><p className="text-sm">Status: {p.isActive ? 'Aktif' : 'Nonaktif'}</p><p className="text-sm">Koordinat: {p.center[0].toFixed(4)}, {p.center[1].toFixed(4)}</p></div></Popup>
                </Marker>
              );
            })}
            {filteredLaporan.map(laporan => {
              const lat = parseCoord(laporan.latitude);
              const lng = parseCoord(laporan.longitude);
              if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
              return (
                <Marker key={laporan.id} position={[lat, lng]} icon={getMarkerIcon(laporan.status)}>
                  <Popup>
                    <div className="max-w-xs p-2">
                      <h3 className="font-bold text-lg mb-2">Detail Laporan Masyarakat</h3>
                      {laporan.photoUrl && <img src={laporan.photoUrl} alt="Sampah" className="w-full h-40 object-cover rounded-lg mb-3" />}
                      <div className="space-y-2">
                        {laporan.user?.fullName && <p className="text-sm"><span className="font-semibold">Pelapor:</span> {laporan.user.fullName}</p>}
                        {laporan.location?.name && <p className="text-sm"><span className="font-semibold">Kecamatan:</span> {laporan.location.name}</p>}
                        <p className="text-sm"><span className="font-semibold">Deskripsi:</span> {laporan.description}</p>
                        <p className="text-sm"><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${laporan.status === 'PENDING' ? 'bg-red-100 text-red-800' : laporan.status === 'DITINDAKLANJUTI' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{laporan.status}</span></p>
                        {laporan.jenisSampah && <p className="text-sm"><span className="font-semibold">Jenis:</span> {laporan.jenisSampah}</p>}
                        <p className="text-sm"><span className="font-semibold">Koordinat:</span> {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                        <p className="text-sm"><span className="font-semibold">Waktu:</span> {new Date(laporan.createdAt).toLocaleString('id-ID')}</p>
                      </div>
                      <button onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Buka di Google Maps</button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">Keterangan Marker</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" /><span className="text-xs text-gray-600">Laporan Pending</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" /><span className="text-xs text-gray-600">Sedang Diproses</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" /><span className="text-xs text-gray-600">Selesai</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" /><span className="text-xs text-gray-600">Pusat Kecamatan</span></div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// KOMPONEN TRACKING SUPIR
// ─────────────────────────────────────────────
function TabTracking() {
  const [trukList, setTrukList]             = useState<TrukAktif[]>([]);
  const [selectedTruk, setSelectedTruk]     = useState<TrukAktif | null>(null);
  const [riwayatJalur, setRiwayatJalur]     = useState<TitikJalur[]>([]);
  const [tanggal, setTanggal]               = useState(new Date().toISOString().split('T')[0]);
  const [tampilRuteJadwal, setTampilRuteJadwal] = useState(true);
  const [MapComponents, setMapComponents]   = useState<any>(null);
  const [isClient, setIsClient]             = useState(false);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);
  const [activeTab, setActiveTab]           = useState<'live' | 'rekaman'>('live');
  const [ringkasan, setRingkasan]           = useState<RingkasanHasil | null>(null);
  const [isLoadingRingkasan, setIsLoadingRingkasan] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setIsClient(true);
    loadLeaflet();
    fetchTrukAktif();
    setupSocket();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const loadLeaflet = async () => {
    try {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import('react-leaflet');
      setMapComponents({ MapContainer, TileLayer, Marker, Popup, Polyline, L });
    } catch (error) {
      console.error('Error loading Leaflet:', error);
    }
  };

  const setupSocket = () => {
    const socket = io(apiUrl, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;
    socket.on('truck_location_update', (data: { truckId: string; latitude: number; longitude: number; timestamp: string }) => {
      setTrukList(prev => prev.map(t =>
        t.id === data.truckId
          ? { ...t, currentLat: data.latitude, currentLong: data.longitude, lastPing: data.timestamp }
          : t
      ));
      setSelectedTruk(prev => {
        if (prev?.id === data.truckId) {
          setRiwayatJalur(r => [...r, { lat: data.latitude, lng: data.longitude, timestamp: data.timestamp }]);
        }
        return prev;
      });
    });
    socket.on('truck_status_update', () => { fetchTrukAktif(); });
  };

  const fetchTrukAktif = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/api/admin/tracking/truk-aktif`, {
        headers: { Authorization: ` Bearer ${token}` },
        timeout: 5000
      });
      if (res.data.success) setTrukList(res.data.data);
    } catch (error) {
      console.warn('Gagal fetch truk aktif:', error);
      setTrukList([]);
    }
  };

  const fetchRiwayat = async (truckId: string, tgl: string) => {
    setIsLoadingRiwayat(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${apiUrl}/api/admin/tracking/riwayat/${truckId}?tanggal=${tgl}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      if (res.data.success) setRiwayatJalur(res.data.data.jalur);
    } catch (error) {
      console.warn('Gagal fetch riwayat:', error);
      setRiwayatJalur([]);
    } finally {
      setIsLoadingRiwayat(false);
    }
  };

  const fetchRingkasan = async (truckId: string, tgl: string) => {
    setIsLoadingRingkasan(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${apiUrl}/api/admin/tracking/ringkasan/${truckId}?tanggal=${tgl}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      if (res.data.success) setRingkasan(res.data.data);
    } catch (error) {
      console.warn('Gagal fetch ringkasan:', error);
      setRingkasan(null);
    } finally {
      setIsLoadingRingkasan(false);
    }
  };

  const handlePilihTruk = (truk: TrukAktif) => {
    setSelectedTruk(truk);
    fetchRiwayat(truk.id, tanggal);
    fetchRingkasan(truk.id, tanggal);
  };

  const handleTanggalChange = (tgl: string) => {
    setTanggal(tgl);
    if (selectedTruk) {
      fetchRiwayat(selectedTruk.id, tgl);
      fetchRingkasan(selectedTruk.id, tgl);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      DALAM_PERJALANAN: 'bg-blue-100 text-blue-800',
      BEKERJA: 'bg-green-100 text-green-800',
      TIBA: 'bg-yellow-100 text-yellow-800',
      DITERIMA: 'bg-purple-100 text-purple-800',
      DITUGASKAN: 'bg-gray-100 text-gray-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const formatWaktu = (ts: string) =>
    new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDurasi = (menit: number) => {
    const j = Math.floor(menit / 60);
    const m = menit % 60;
    return j > 0 ? `${j} jam ${m} menit` : `${m} menit`;
  };

  if (!isClient || !MapComponents) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, L } = MapComponents;

  const getTrukIcon = (dipilih: boolean) => L.divIcon({
    html: `<div style="background:${dipilih ? '#16a34a' : '#2563eb'};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px">🚛</div>`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 18]
  });

  const getWaypointIcon = (nomor: number, isTPA: boolean) => L.divIcon({
    html: `<div style="background:${isTPA ? '#7c3aed' : '#f59e0b'};color:white;border-radius:50%;width:22px;height:22px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);font-size:9px;font-weight:bold;display:flex;align-items:center;justify-content:center">${isTPA ? '🏁' : nomor}</div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 11]
  });

  const getAwalIcon = () => L.divIcon({
    html: `<div style="background:#22c55e;color:white;border-radius:50%;width:22px;height:22px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center">A</div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 11]
  });

  const getAkhirIcon = () => L.divIcon({
    html: `<div style="background:#ef4444;color:white;border-radius:50%;width:22px;height:22px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center">Z</div>`,
    className: '', iconSize: [22, 22], iconAnchor: [11, 11]
  });

  const pusatPeta: [number, number] = (() => {
    const ada = trukList.find(t => t.currentLat && t.currentLong);
    return ada ? [ada.currentLat!, ada.currentLong!] : [2.3333, 99.0632];
  })();

  // Rute jadwal aktif (dari truk terpilih atau hari ini)
  const ruteAktif: RuteJadwal | null =
    selectedTruk?.ruteHariIni ||
    (ringkasan?.ruteJadwal ?? null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tracking Supir Real-Time</h2>
            <p className="text-sm text-gray-500 mt-1">{trukList.length} truk aktif terdeteksi</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-700 font-medium">Live</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Tanggal:</label>
              <input type="date" value={tanggal} onChange={e => handleTanggalChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={fetchTrukAktif} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panel Kiri: Daftar Truk */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-sm font-semibold text-gray-600 px-1">Truk Beroperasi</p>
          {trukList.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-4xl mb-2">🚛</p>
              <p className="text-sm text-gray-500">Tidak ada truk aktif saat ini</p>
              <button onClick={fetchTrukAktif} className="mt-3 text-xs text-green-600 hover:underline">Coba refresh</button>
            </div>
          ) : (
            trukList.map(truk => (
              <div key={truk.id} onClick={() => handlePilihTruk(truk)}
                className={`bg-white rounded-xl p-4 cursor-pointer border-2 transition-all hover:shadow-md ${selectedTruk?.id === truk.id ? 'border-green-500 shadow-md' : 'border-transparent hover:border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-xl flex-shrink-0">🚛</div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{truk.plateNumber}</p>
                    <p className="text-xs text-gray-500 truncate">{truk.operator?.fullName || 'Tanpa Operator'}</p>
                  </div>
                </div>
                {truk.taskAktif && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(truk.taskAktif.status)}`}>
                    {truk.taskAktif.status.replace(/_/g, ' ')}
                  </span>
                )}
                {truk.ruteHariIni && (
                  <p className="text-xs text-purple-600 mt-1.5 font-medium">
                    📋 Rute {truk.ruteHariIni.namaHari}: {truk.ruteHariIni.waypoints.length} titik
                  </p>
                )}
                {truk.lastLocation && <p className="text-xs text-gray-400 mt-1 truncate">📍 {truk.lastLocation}</p>}
                {truk.lastPing && <p className="text-xs text-gray-400 mt-0.5">🕐 {formatWaktu(truk.lastPing)}</p>}
                {!truk.currentLat && <p className="text-xs text-orange-500 mt-1.5">⚠ Menunggu sinyal GPS...</p>}
              </div>
            ))
          )}
        </div>

        {/* Panel Kanan: Peta + Rekaman */}
        <div className="lg:col-span-3 space-y-3">
          {/* Sub-tab Live / Rekaman */}
          {selectedTruk && (
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button onClick={() => setActiveTab('live')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                🔴 Live Tracking
              </button>
              <button onClick={() => setActiveTab('rekaman')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'rekaman' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                📋 Rekaman Hasil
              </button>
            </div>
          )}

          {/* Toggle rute jadwal */}
          {ruteAktif && (
            <div className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-purple-700 font-medium">
                  📋 Overlay Rute Jadwal {ruteAktif.namaHari} ({ruteAktif.waypoints.length} titik)
                </span>
              </div>
              <button onClick={() => setTampilRuteJadwal(v => !v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tampilRuteJadwal ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tampilRuteJadwal ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          )}

          {/* PETA */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-[520px]">
              <MapContainer center={pusatPeta} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

                {/* Marker truk aktif */}
                {trukList.map(truk => {
                  if (!truk.currentLat || !truk.currentLong) return null;
                  return (
                    <Marker key={truk.id} position={[truk.currentLat, truk.currentLong]}
                      icon={getTrukIcon(selectedTruk?.id === truk.id)}
                      eventHandlers={{ click: () => handlePilihTruk(truk) }}>
                      <Popup>
                        <div className="p-2 min-w-[180px]">
                          <p className="font-bold text-base mb-1">{truk.plateNumber}</p>
                          <p className="text-sm text-gray-600">{truk.operator?.fullName || 'Tanpa Operator'}</p>
                          {truk.operator?.phoneNumber && <p className="text-xs text-gray-500">{truk.operator.phoneNumber}</p>}
                          {truk.taskAktif && (
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(truk.taskAktif.status)}`}>
                              {truk.taskAktif.status.replace(/_/g, ' ')}
                            </span>
                          )}
                          {truk.lastPing && <p className="text-xs text-gray-400 mt-2">Update: {formatWaktu(truk.lastPing)}</p>}
                          <button onClick={() => handlePilihTruk(truk)}
                            className="mt-3 w-full bg-green-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                            Lihat Jalur & Rekaman
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* ── Rute Jalur Aktual GPS (garis hijau) */}
                {selectedTruk && riwayatJalur.length > 1 && (
                  <Polyline positions={riwayatJalur.map(p => [p.lat, p.lng] as [number, number])}
                    color="#16a34a" weight={3} opacity={0.8} dashArray="8 5" />
                )}
                {selectedTruk && riwayatJalur.length > 0 && (
                  <Marker position={[riwayatJalur[0].lat, riwayatJalur[0].lng]} icon={getAwalIcon()}>
                    <Popup><p className="text-xs font-semibold">Titik Awal Perjalanan</p><p className="text-xs text-gray-500">{new Date(riwayatJalur[0].timestamp).toLocaleTimeString('id-ID')}</p></Popup>
                  </Marker>
                )}
                {selectedTruk && riwayatJalur.length > 1 && (
                  <Marker position={[riwayatJalur[riwayatJalur.length - 1].lat, riwayatJalur[riwayatJalur.length - 1].lng]} icon={getAkhirIcon()}>
                    <Popup><p className="text-xs font-semibold">Posisi Terakhir</p><p className="text-xs text-gray-500">{new Date(riwayatJalur[riwayatJalur.length - 1].timestamp).toLocaleTimeString('id-ID')}</p></Popup>
                  </Marker>
                )}

                {/* ── Overlay Rute Jadwal Tetap (garis ungu + waypoint kuning) */}
                {tampilRuteJadwal && ruteAktif && (
                  <>
                    <Polyline
                      positions={ruteAktif.waypoints.map(w => [w.lat, w.lng] as [number, number])}
                      color="#7c3aed" weight={2} opacity={0.55} dashArray="4 8" />
                    {ruteAktif.waypoints.map((wp, idx) => (
                      <Marker key={`wp-${idx}`} position={[wp.lat, wp.lng]}
                        icon={getWaypointIcon(wp.urutan, wp.nama.toLowerCase().includes('tpa'))}>
                        <Popup>
                          <div className="p-1.5 min-w-[160px]">
                            <p className="text-xs font-bold text-purple-700">Titik {wp.urutan}</p>
                            <p className="text-sm font-semibold mt-1">{wp.nama}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Rute {ruteAktif.namaHari}</p>
                            <a href={`https://www.google.com/maps?q=${wp.lat},${wp.lng}`} target="_blank" rel="noreferrer"
                              className="mt-2 block text-center text-xs text-blue-600 hover:underline">Buka Google Maps</a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Info Jalur Live */}
          {selectedTruk && activeTab === 'live' && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🚛</span>
                    <p className="font-semibold text-gray-800">{selectedTruk.plateNumber}</p>
                    <span className="text-gray-400">—</span>
                    <p className="text-gray-600 text-sm">{selectedTruk.operator?.fullName || 'Tanpa Operator'}</p>
                  </div>
                  {isLoadingRiwayat ? (
                    <p className="text-sm text-gray-400">Memuat riwayat jalur...</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Tanggal {tanggal}: <span className="font-semibold text-green-600">{riwayatJalur.length} titik lokasi</span> tercatat
                      {riwayatJalur.length === 0 && <span className="text-orange-500 ml-1">(belum ada data jalur hari ini)</span>}
                    </p>
                  )}
                  {riwayatJalur.length > 0 && (
                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-gray-400">🟢 Mulai: {new Date(riwayatJalur[0].timestamp).toLocaleTimeString('id-ID')}</p>
                      <p className="text-xs text-gray-400">🔴 Terakhir: {new Date(riwayatJalur[riwayatJalur.length - 1].timestamp).toLocaleTimeString('id-ID')}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setSelectedTruk(null); setRiwayatJalur([]); setRingkasan(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
                  ✕ Tutup
                </button>
              </div>
            </div>
          )}

          {/* ── REKAMAN HASIL KERJA ── */}
          {selectedTruk && activeTab === 'rekaman' && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">📋 Rekaman Hasil Kerja</h3>
                <button onClick={() => fetchRingkasan(selectedTruk.id, tanggal)}
                  className="text-xs text-green-600 hover:underline">
                  🔄 Refresh
                </button>
              </div>

              {isLoadingRingkasan ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                </div>
              ) : ringkasan ? (
                <div className="space-y-4">
                  {/* Ringkasan statistik */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{ringkasan.ringkasan.totalTaskSelesai}</p>
                      <p className="text-xs text-green-600 mt-1">Task Selesai</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{ringkasan.ringkasan.jarakTempuhKm}</p>
                      <p className="text-xs text-blue-600 mt-1">KM Ditempuh</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700">{ringkasan.ringkasan.totalVolumeSampahKg}</p>
                      <p className="text-xs text-yellow-600 mt-1">Kg Sampah</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-700">{ringkasan.ringkasan.durasiKerjaJam}</p>
                      <p className="text-xs text-purple-600 mt-1">Jam Kerja</p>
                    </div>
                  </div>

                  {/* Info waktu */}
                  <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Supir</p>
                      <p className="text-sm font-semibold">{ringkasan.operatorName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hari Kerja</p>
                      <p className="text-sm font-semibold">{ringkasan.hariKerja}</p>
                    </div>
                    {ringkasan.ringkasan.waktuMulai && (
                      <div>
                        <p className="text-xs text-gray-500">Mulai Kerja</p>
                        <p className="text-sm font-semibold">{new Date(ringkasan.ringkasan.waktuMulai).toLocaleTimeString('id-ID')}</p>
                      </div>
                    )}
                    {ringkasan.ringkasan.waktuSelesai && (
                      <div>
                        <p className="text-xs text-gray-500">Selesai Kerja</p>
                        <p className="text-sm font-semibold">{new Date(ringkasan.ringkasan.waktuSelesai).toLocaleTimeString('id-ID')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Durasi Total</p>
                      <p className="text-sm font-semibold">{formatDurasi(ringkasan.ringkasan.durasiKerjaMenit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Titik GPS Tercatat</p>
                      <p className="text-sm font-semibold">{ringkasan.jalurAktual.length} titik</p>
                    </div>
                  </div>

                  {/* Perbandingan rute jadwal */}
                  {ringkasan.ruteJadwal && (
                    <div className="border border-purple-100 rounded-lg p-3">
                      <p className="text-sm font-semibold text-purple-700 mb-2">
                        📋 Rute Jadwal {ringkasan.ruteJadwal.namaHari} — {ringkasan.ruteJadwal.waypoints.length} titik wajib
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {ringkasan.ruteJadwal.waypoints.map((wp, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${wp.nama.toLowerCase().includes('tpa') ? 'bg-purple-600' : 'bg-amber-500'}`}>{wp.urutan}</span>
                            <span>{wp.nama}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detail task selesai */}
                  {ringkasan.detailTask.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Detail Task Diselesaikan</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ringkasan.detailTask.map((task, i) => (
                          <div key={task.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{task.location}</p>
                              {task.district && <p className="text-xs text-gray-500">{task.district}</p>}
                              <div className="flex gap-3 mt-1">
                                {task.volumeKg && <span className="text-xs text-green-600">{task.volumeKg} kg</span>}
                                {task.jumlahFoto > 0 && <span className="text-xs text-blue-500">📷 {task.jumlahFoto} foto</span>}
                                <span className="text-xs text-gray-400">{new Date(task.completedAt).toLocaleTimeString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ringkasan.detailTask.length === 0 && ringkasan.jalurAktual.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm">Belum ada rekaman untuk tanggal {tanggal}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">Tidak ada data rekaman untuk tanggal {tanggal}</p>
                </div>
              )}
            </div>
          )}

          {/* Legend Peta */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Keterangan Peta</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs">🚛</div><span className="text-xs text-gray-600">Truk aktif</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs">🚛</div><span className="text-xs text-gray-600">Truk dipilih</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">A</div><span className="text-xs text-gray-600">Titik awal</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">Z</div><span className="text-xs text-gray-600">Posisi terakhir</span></div>
              <div className="flex items-center gap-2"><div className="w-8 border-t-2 border-dashed border-green-600" /><span className="text-xs text-gray-600">Jalur GPS aktual</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">1</div><span className="text-xs text-gray-600">Titik rute jadwal</span></div>
              <div className="flex items-center gap-2"><div className="w-8 border-t-2 border-dashed border-purple-600" /><span className="text-xs text-gray-600">Rute jadwal tetap</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">🏁</div><span className="text-xs text-gray-600">TPA Pintu Bosi</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// KOMPONEN UTAMA
// ─────────────────────────────────────────────
export default function PetaSampah() {
  const [activeTab, setActiveTab] = useState<'laporan' | 'tracking'>('laporan');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('laporan')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'laporan' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          🗺 Peta Laporan Sampah
        </button>
        <button onClick={() => setActiveTab('tracking')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tracking' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          🚛 Tracking Supir Live
        </button>
      </div>

      {activeTab === 'laporan'  && <TabLaporan />}
      {activeTab === 'tracking' && <TabTracking />}
    </div>
  );
}