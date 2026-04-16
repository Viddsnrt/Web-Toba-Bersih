"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Search, Truck, MapPin,
  Phone, User, X, ChevronDown, RefreshCw, 
  CheckCircle2, AlertCircle, LayoutGrid
} from 'lucide-react';

interface Truk {
  id: string;
  plateNumber: string;
  operatorId: string | null;
  operator?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
  } | null;
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE';
  lastLocation: string | null;
  lastPing: string | null;
  currentLat: string | null;
  currentLong: string | null;
  createdAt: string;
}

interface Supir {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
}

export default function ManageTruk() {
  const [trukList, setTrukList] = useState<Truk[]>([]);
  const [supirList, setSupirList] = useState<Supir[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTruk, setEditingTruk] = useState<Truk | null>(null);
  
  const [formData, setFormData] = useState({
    plateNumber: '',
    operatorId: '',
    status: 'AVAILABLE',
    lastLocation: ''
  });

  // --- LOGIC: FETCHING DATA ---
  const fetchTruk = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/truks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // ⚠️ PERBAIKAN: Gunakan .data.data sesuai standar backend kita
      setTrukList(res.data.data || []);
    } catch (error) {
      console.error('Error fetching truk:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupir = async () => {
    try {
      const token = localStorage.getItem('token');
      // ⚠️ PERBAIKAN: URL diganti menjadi /supir-list
      const res = await axios.get('http://localhost:5000/api/admin/supir-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // ⚠️ PERBAIKAN: Gunakan .data.data
      const supirData = res.data.data || [];
      setSupirList(supirData.filter((s: any) => s.isActive));
    } catch (error) {
      console.error('Error fetching supir:', error);
    }
  };

  useEffect(() => {
    fetchTruk();
    fetchSupir();
  }, []);

  // --- LOGIC: HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingTruk(null);
    setFormData({ plateNumber: '', operatorId: '', status: 'AVAILABLE', lastLocation: '' });
    setShowModal(true);
  };

  const openEditModal = (truk: Truk) => {
    setEditingTruk(truk);
    setFormData({
      plateNumber: truk.plateNumber,
      operatorId: truk.operatorId || '',
      status: truk.status,
      lastLocation: truk.lastLocation || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingTruk) {
        await axios.put(`http://localhost:5000/api/admin/truks/${editingTruk.id}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/api/admin/truks', formData, config);
      }

      setShowModal(false);
      fetchTruk();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus unit truk ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/truks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTruk();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Tersedia' };
      case 'BUSY': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Bertugas' };
      case 'MAINTENANCE': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Servis' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  const filteredTruk = trukList.filter(truk => 
    truk.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truk.operator?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truk.lastLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Armada</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <LayoutGrid size={16} /> Pantau unit truk pengangkut sampah secara real-time.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-200 active:scale-95"
        >
          <Plus size={20} />
          <span>Tambah Unit Baru</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Armada', val: trukList.length, color: 'text-gray-600', bg: 'bg-gray-50', icon: Truck },
          { label: 'Tersedia', val: trukList.filter(t => t.status === 'AVAILABLE').length, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
          { label: 'Bertugas', val: trukList.filter(t => t.status === 'BUSY').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: RefreshCw },
          { label: 'Maintenance', val: trukList.filter(t => t.status === 'MAINTENANCE').length, color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500" size={18} />
            <input
              type="text"
              placeholder="Cari nopol, supir, atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none text-gray-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-gray-400">
             <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
             <p>Sinkronisasi data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center w-12">No</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Informasi Truk</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Operator</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTruk.map((truk, idx) => {
                  const status = getStatusBadge(truk.status);
                  return (
                    <tr key={truk.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-5 text-center text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                            <Truck size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none">{truk.plateNumber}</p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-mono tracking-tighter">ID: {truk.id.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {truk.operator ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gray-700">{truk.operator.fullName}</p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Phone size={10} /> {truk.operator.phoneNumber || '-'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${status.bg} ${status.text} ring-black/5`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status.text.replace('text', 'bg')}`}></span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <div className="flex items-center text-sm text-gray-600 font-medium">
                              <MapPin size={14} className="mr-1 text-gray-400" />
                              <span className="truncate max-w-[120px]">{truk.lastLocation || 'Parkir'}</span>
                           </div>
                           <p className="text-[10px] text-gray-400 ml-5">
                              {truk.lastPing ? new Date(truk.lastPing).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                           </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(truk)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(truk.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 scale-100 transition-transform">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{editingTruk ? 'Edit Unit' : 'Registrasi Truk'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Nomor Polisi</label>
                <input name="plateNumber" value={formData.plateNumber} onChange={handleInputChange} placeholder="BK 1234 ABC" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Assign Operator</label>
                <div className="relative">
                  <select name="operatorId" value={formData.operatorId} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 appearance-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-medium text-gray-700">
                    <option value="">Pilih Supir (Opsional)</option>
                    {supirList.map(supir => <option key={supir.id} value={supir.id}>{supir.fullName}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Kondisi Unit</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 appearance-none focus:ring-2 focus:ring-green-500/20 outline-none">
                    <option value="AVAILABLE">Tersedia</option>
                    <option value="BUSY">Bertugas</option>
                    <option value="MAINTENANCE">Servis</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Lokasi Awal</label>
                  <input name="lastLocation" value={formData.lastLocation} onChange={handleInputChange} placeholder="Pool" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all">Batal</button>
                <button type="submit" className="flex- bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95">
                  {editingTruk ? 'Simpan Perubahan' : 'Daftarkan Truk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}