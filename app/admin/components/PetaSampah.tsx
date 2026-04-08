"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Laporan {
  id: string;
  latitude: string | number;
  longitude: string | number;
  description: string;
  photoUrl: string | null;
  status: string;
  jenisSampah: string | null;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

interface Polygon {
  id: string;
  name: string;
  code: string;
  center: number[];
  isActive: boolean;
}

export default function PetaSampah() {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // State untuk komponen peta (di-load secara dinamis)
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamic import semua komponen Leaflet
    const loadLeaflet = async () => {
      try {
        // Import leaflet CSS
        await import('leaflet/dist/leaflet.css');
        
        // Import L dari leaflet
        const L = (await import('leaflet')).default;
        
        // Fix icon marker untuk Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        
        // Import komponen react-leaflet
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        
        // Simpan komponen ke state
        setMapComponents({ MapContainer, TileLayer, Marker, Popup, L });
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };
    
    loadLeaflet();
    fetchLaporan();
    fetchPolygons();
  }, []);

  const fetchLaporan = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/laporan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLaporanList(res.data);
      
      // Ambil daftar kecamatan unik dari data
      const kecamatan = res.data
        .map((l: any) => l.lokasi?.split(',')[0].trim())
        .filter((k: string, i: number, arr: string[]) => k && arr.indexOf(k) === i);
      setKecamatanList(kecamatan);
      
    } catch (error) {
      console.error('Error fetching laporan:', error);
    }
  };

  const fetchPolygons = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/wilayah/polygons');
      setPolygons(res.data);
    } catch (error) {
      console.error('Error fetching polygons:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseCoordinate = (coord: string | number): number => {
    if (typeof coord === 'number') return coord;
    return parseFloat(coord) || 0;
  };

  // Filter laporan
  const filteredLaporan = laporanList.filter(laporan => {
    const statusMatch = selectedStatus === 'semua' || laporan.status === selectedStatus;
    const kecamatanMatch = selectedKecamatan === 'semua' || 
      (laporan.description?.includes(selectedKecamatan) || false);
    return statusMatch && kecamatanMatch;
  });

  // Hitung statistik
  const totalLaporan = laporanList.length;
  const pendingCount = laporanList.filter(l => l.status === 'PENDING').length;
  const prosesCount = laporanList.filter(l => l.status === 'DITINDAKLANJUTI').length;
  const selesaiCount = laporanList.filter(l => l.status === 'SELESAI').length;

  // Tampilkan loading
  if (!isClient || !MapComponents) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = MapComponents;

  // Fungsi untuk membuat marker dengan warna
  const getMarkerIcon = (status: string) => {
    const color = status === 'PENDING' ? '#EF4444' : 
                  status === 'DITINDAKLANJUTI' ? '#3B82F6' : 
                  status === 'SELESAI' ? '#10B981' : '#6B7280';

    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>`,
      className: '',
      iconSize: [20, 20]
    });
  };

  // Fungsi untuk membuat marker kecamatan
  const getKecamatanIcon = (name: string) => {
    return L.divIcon({
      html: `<div style="
        background-color: #3B82F6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        position: relative;
      "><div style="
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        color: #1E40AF;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">${name}</div></div>`,
      className: '',
      iconSize: [16, 16]
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Peta GIS - Titik Sampah</h2>
        
        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold">Total Laporan</p>
            <p className="text-2xl font-bold text-blue-800">{totalLaporan}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-semibold">Pending</p>
            <p className="text-2xl font-bold text-red-800">{pendingCount}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-semibold">Diproses</p>
            <p className="text-2xl font-bold text-yellow-800">{prosesCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-semibold">Selesai</p>
            <p className="text-2xl font-bold text-green-800">{selesaiCount}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="semua">Semua Status</option>
              <option value="PENDING">Pending (Merah)</option>
              <option value="DITINDAKLANJUTI">Diproses (Biru)</option>
              <option value="SELESAI">Selesai (Hijau)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kecamatan</label>
            <select 
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="semua">Semua Kecamatan</option>
              {kecamatanList.map(kec => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <span className="text-sm text-gray-500">
              Menampilkan {filteredLaporan.length} dari {totalLaporan} titik
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-[600px] w-full">
          <MapContainer
            center={[2.3333, 99.0]}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Marker Kecamatan */}
            {polygons.map((polygon) => {
              if (!polygon.center || polygon.center.length !== 2) return null;
              return (
                <Marker
                  key={`kec-${polygon.id}`}
                  position={[polygon.center[0], polygon.center[1]]}
                  icon={getKecamatanIcon(polygon.name)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">{polygon.name}</h3>
                      <p className="text-sm">Kode: {polygon.code}</p>
                      <p className="text-sm">Status: {polygon.isActive ? 'Aktif' : 'Nonaktif'}</p>
                      <p className="text-sm">Koordinat: {polygon.center[0].toFixed(4)}, {polygon.center[1].toFixed(4)}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Marker Laporan Sampah */}
            {filteredLaporan.map((laporan) => {
              const lat = parseCoordinate(laporan.latitude);
              const lng = parseCoordinate(laporan.longitude);
              
              if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
              
              return (
                <Marker
                  key={laporan.id}
                  position={[lat, lng]}
                  icon={getMarkerIcon(laporan.status)}
                >
                  <Popup>
                    <div className="max-w-xs p-2">
                      <h3 className="font-bold text-lg mb-2">Detail Laporan</h3>
                      
                      {laporan.photoUrl && (
                        <img 
                          src={laporan.photoUrl} 
                          alt="Sampah" 
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-semibold">Deskripsi:</span> {laporan.description}
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-semibold">Status:</span>{' '}
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            laporan.status === 'PENDING' ? 'bg-red-100 text-red-800' :
                            laporan.status === 'DITINDAKLANJUTI' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {laporan.status}
                          </span>
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-semibold">Koordinat:</span> {lat.toFixed(4)}, {lng.toFixed(4)}
                        </p>
                        
                        <p className="text-sm">
                          <span className="font-semibold">Waktu:</span> {new Date(laporan.createdAt).toLocaleString('id-ID')}
                        </p>
                        
                        {laporan.jenisSampah && (
                          <p className="text-sm">
                            <span className="font-semibold">Jenis:</span> {laporan.jenisSampah}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')}
                        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        Buka di Google Maps
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}