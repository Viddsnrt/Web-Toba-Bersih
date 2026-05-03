"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Search, MapPin, 
  Users, Building2, Map, X, 
  ToggleLeft, ToggleRight, Filter, ChevronDown,
  Loader2, CircleCheck, Circle, Globe, ChevronLeft, ChevronRight,
  Sparkles, Layers, Target, Home, TreePine, Mountain,
  Eye // 🔥 TAMBAHAN: Import icon Eye untuk tombol lihat detail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface Wilayah {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  population: number | null;
  address: string | null;
  capacityVolume: number | null;
  latitude: string;
  longitude: string;
  radius: number | null; 
  center?: number[];
  createdAt: string;
}

interface FormData {
  name: string;
  code: string;
  population: string;
  address: string;
  capacityVolume: string;
  latitude: string;
  longitude: string;
  radius: string; 
  isActive: boolean;
}

// Constants
const API_BASE_URL = 'http://localhost:5000/api/admin';
const PRIMARY_COLOR = '#064E3B';
const COLORS = {
  primary: 'emerald',
  primaryGradient: 'from-[#064E3B] to-[#0B6B4F]',
  primaryLight: 'from-[#E8F5E9] to-[#C8E6C9]',
  secondary: 'slate',
  success: 'emerald',
  danger: 'rose',
  warning: 'amber',
  info: 'purple'
} as const;

// Helper Functions
const formatNumber = (num: number): string => {
  return num.toLocaleString('id-ID');
};

const getStatusStyle = (isActive: boolean) => {
  return isActive 
    ? 'bg-[#E8F5E9] text-[#064E3B] border-[#A5D6A7] hover:bg-[#C8E6C9] ring-[#064E3B]/20' 
    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 ring-rose-600/20';
};

export default function ManageWilayah() {
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWilayah, setEditingWilayah] = useState<Wilayah | null>(null);
  
  // 🔥 TAMBAHAN: State untuk modal View Detail
  const [viewingWilayah, setViewingWilayah] = useState<Wilayah | null>(null); 
  
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    population: '',
    address: '',
    capacityVolume: '',
    latitude: '',
    longitude: '',
    radius: '', 
    isActive: true
  });

  const fetchWilayah = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/wilayah`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWilayahList(res.data.data || res.data); 
    } catch (error) {
      toast.error('Gagal mengambil data wilayah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWilayah();
  }, []);

  const filteredWilayah = useMemo(() => {
    return wilayahList
      .filter(wilayah => 
        wilayah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wilayah.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wilayah.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(wilayah => {
        if (statusFilter === 'ALL') return true;
        return statusFilter === 'ACTIVE' ? wilayah.isActive : !wilayah.isActive;
      });
  }, [wilayahList, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredWilayah.length / itemsPerPage);
  const paginatedWilayah = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWilayah.slice(start, start + itemsPerPage);
  }, [filteredWilayah, currentPage, itemsPerPage]);

  const stats = useMemo(() => ({
    total: wilayahList.length,
    active: wilayahList.filter(w => w.isActive).length,
    inactive: wilayahList.filter(w => !w.isActive).length,
    totalPopulation: wilayahList.reduce((sum, w) => sum + (w.population || 0), 0),
    totalCapacity: wilayahList.reduce((sum, w) => sum + (w.capacityVolume || 0), 0)
  }), [wilayahList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingWilayah(null);
    setFormData({
      name: '', code: '', population: '', address: '',
      capacityVolume: '', latitude: '', longitude: '', radius: '', isActive: true
    });
    setShowModal(true);
  };

  const openEditModal = (wilayah: Wilayah) => {
    setEditingWilayah(wilayah);
    setFormData({
      name: wilayah.name,
      code: wilayah.code || '',
      population: wilayah.population?.toString() || '',
      address: wilayah.address || '',
      capacityVolume: wilayah.capacityVolume?.toString() || '',
      latitude: wilayah.latitude,
      longitude: wilayah.longitude,
      radius: wilayah.radius?.toString() || '',
      isActive: wilayah.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const dataToSend = {
        ...formData,
        population: formData.population ? parseInt(formData.population) : null,
        capacityVolume: formData.capacityVolume ? parseInt(formData.capacityVolume) : null,
        radius: formData.radius ? parseInt(formData.radius) : 5000, 
      };

      if (editingWilayah) {
        await axios.put(`${API_BASE_URL}/wilayah/${editingWilayah.id}`, dataToSend, config);
        toast.success('Data wilayah berhasil diperbarui!');
      } else {
        await axios.post(`${API_BASE_URL}/wilayah`, dataToSend, config);
        toast.success('Wilayah baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchWilayah();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data wilayah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus wilayah ${name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/wilayah/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Wilayah dihapus!');
      fetchWilayah();
    } catch (error) {
      toast.error('Gagal menghapus wilayah');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/wilayah/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` }});
      toast.success(`Status ${name} diubah`);
      fetchWilayah();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  // --- SUB COMPONENTS ---
  const StatCard = ({ icon: Icon, label, value }: any) => (
    <motion.div variants={itemVariants} className="bg-white/90 rounded-xl p-3 shadow-lg border border-[#064E3B]/20">
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-[#064E3B] to-[#0B6B4F] p-2 rounded-lg"><Icon size={14} className="text-white" /></div>
        <div><p className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</p><p className="text-base font-bold text-slate-800">{value}</p></div>
      </div>
    </motion.div>
  );

  const FilterButton = ({ value, label }: any) => (
    <button onClick={() => setStatusFilter(value)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium ${statusFilter === value ? 'bg-[#064E3B] text-white' : 'bg-white text-slate-600 border'}`}>
      {label}
    </button>
  );

  const TableRow = ({ wilayah, index }: any) => (
    <motion.tr variants={itemVariants} className="group transition-colors border-b border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2"><span className="text-[10px] font-mono text-slate-400">#{index + 1}</span></td>
      <td className="px-3 py-2"><div className="font-medium text-xs text-slate-800">{wilayah.name}</div></td>
      <td className="px-3 py-2"><span className="text-[10px] bg-[#E8F5E9] text-[#064E3B] px-1.5 py-0.5 rounded">{wilayah.code || '-'}</span></td>
      <td className="px-3 py-2"><span className="text-[10px] text-slate-700">{wilayah.population ? formatNumber(wilayah.population) : '-'}</span></td>
      <td className="px-3 py-2"><span className="text-[10px] text-slate-700">{wilayah.capacityVolume ? formatNumber(wilayah.capacityVolume) + ' m³' : '-'}</span></td>
      <td className="px-3 py-2">
        <div className="flex flex-col">
           <span className="text-[8px] font-mono text-slate-600">{wilayah.latitude}, {wilayah.longitude}</span>
           <span className="text-[8px] text-emerald-600 font-bold">Rad: {wilayah.radius || 5000} m</span>
        </div>
      </td>
      <td className="px-3 py-2"><button onClick={() => toggleStatus(wilayah.id, wilayah.isActive, wilayah.name)} className={`px-2 py-1 rounded-md text-[8px] ${getStatusStyle(wilayah.isActive)}`}>{wilayah.isActive ? 'Aktif' : 'Nonaktif'}</button></td>
      <td className="px-3 py-2">
        {/* 🔥 PERBAIKAN: Menambahkan tombol VIEW (Mata) di sini */}
        <div className="flex gap-1 justify-end">
          <button onClick={() => setViewingWilayah(wilayah)} className="p-2 text-white-300 bg-blue-500 rounded-lg transition-all" title="Lihat Detail"><Eye size={12}/></button>
          <button onClick={() => openEditModal(wilayah)} className="p-2 text-white-300 bg-yellow-500 rounded-lg transition-all" title="Edit"><Edit size={12}/></button>
          <button onClick={() => handleDelete(wilayah.id, wilayah.name)} className="p-2 text-white-300 bg-red-500 rounded-lg transition-all" title="Hapus"><Trash2 size={12}/></button>
        </div>
      </td>
    </motion.tr>
  );

  // 🔥 TAMBAHAN BARU: Modal untuk View Detail
  const renderViewModal = () => {
    if (!viewingWilayah) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-emerald-100 overflow-hidden"
          >
            <div className="bg-[#064E3B] px-5 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MapPin size={18} />
                Detail Kecamatan
              </h3>
              <button
                onClick={() => setViewingWilayah(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center shadow-inner">
                  <MapPin size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800">{viewingWilayah.name}</h4>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    viewingWilayah.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {viewingWilayah.isActive ? "Status: Aktif" : "Status: Nonaktif"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100 grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kode Referensi</p>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">{viewingWilayah.code || '-'}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Users size={12}/> Populasi</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {viewingWilayah.population ? formatNumber(viewingWilayah.population) : '-'} Jiwa
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Map size={12}/> Kapasitas Sampah</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {viewingWilayah.capacityVolume ? formatNumber(viewingWilayah.capacityVolume) : '-'} m³
                  </p>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Globe size={12}/> Titik Pusat (Koordinat GPS)</p>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">Lat: {viewingWilayah.latitude}</p>
                  <p className="text-sm font-mono text-slate-700">Long: {viewingWilayah.longitude}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Target size={12}/> Radius Cakupan Laporan (Geofence)</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">{viewingWilayah.radius || 5000} Meter</p>
                </div>
              </div>

              <button
                onClick={() => setViewingWilayah(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Tutup Panel
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7F4] via-white to-[#E8F5E9] p-4 font-sans">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#064E3B]">Manajemen Wilayah</h1>
          <p className="text-xs text-slate-500">Kelola 9 Kecamatan Cakupan TobaBersih</p>
        </div>
        <button onClick={openCreateModal} className="bg-[#064E3B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-900/20 hover:bg-[#053f30] transition-all">
          <Plus size={14} /> Tambah Wilayah
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Building2} label="Total Wilayah" value={stats.total} />
        <StatCard icon={CircleCheck} label="Aktif" value={stats.active} />
        <StatCard icon={Circle} label="Nonaktif" value={stats.inactive} />
        <StatCard icon={Users} label="Total Penduduk" value={formatNumber(stats.totalPopulation)} />
        <StatCard icon={Map} label="Kapasitas (m³)" value={formatNumber(stats.totalCapacity)} />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input type="text" placeholder="Cari kecamatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>
          <FilterButton value="ALL" label="Semua" />
          <FilterButton value="ACTIVE" label="Aktif" />
          <FilterButton value="INACTIVE" label="Nonaktif" />
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-[#E8F5E9]/50">
            <tr>
              <th className="p-3 text-[10px] text-[#064E3B]">No</th>
              <th className="p-3 text-[10px] text-[#064E3B]">Kecamatan</th>
              <th className="p-3 text-[10px] text-[#064E3B]">Kode</th>
                <th className="p-3 text-[10px] text-[#064E3B]">Penduduk</th>
                <th className="p-3 text-[10px] text-[#064E3B]">Kapasitas</th>
              <th className="p-3 text-[10px] text-[#064E3B]">Lokasi & Radius</th>
              <th className="p-3 text-[10px] text-[#064E3B]">Status</th>
              <th className="p-3 text-[10px] text-[#064E3B] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedWilayah.map((wilayah, idx) => <TableRow key={wilayah.id} wilayah={wilayah} index={idx} />)}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW DETAIL (MATA) */}
      {renderViewModal()}

      {/* MODAL FORM TAMBAH / EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="bg-[#064E3B] px-5 py-4 flex justify-between rounded-t-2xl">
              <h3 className="text-white text-sm font-bold">{editingWilayah ? 'Edit Wilayah' : 'Tambah Wilayah'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-emerald-200 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kecamatan</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-2.5 mt-1 bg-slate-50 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                  <input name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="2.3333" className="w-full p-2.5 mt-1 bg-slate-50 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                  <input name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="99.0667" className="w-full p-2.5 mt-1 bg-slate-50 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="col-span-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <label className="text-[10px] font-bold text-[#064E3B] uppercase flex items-center gap-2">
                    <Target size={12}/> Radius Cakupan Laporan (Meter)
                  </label>
                  <p className="text-[9px] text-emerald-600 mb-2">Tentukan seberapa jauh laporan warga masih diterima dari titik pusat kecamatan ini.</p>
                  <input type="number" name="radius" value={formData.radius} onChange={handleInputChange} placeholder="Contoh: 5000 (untuk 5 Kilometer)" required className="w-full p-2.5 bg-white border border-emerald-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#064E3B] text-white py-3 rounded-xl text-xs font-bold mt-4 hover:bg-[#053f30] disabled:opacity-70 transition-all flex justify-center items-center gap-2">
                {submitting && <Loader2 className="animate-spin" size={14} />}
                {submitting ? 'Menyimpan...' : 'Simpan Data Wilayah'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}