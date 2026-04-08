"use client";
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Search, MapPin, 
  Users, Building2, Map, X, 
  ToggleLeft, ToggleRight, Filter, ChevronDown,
  Loader2, CircleCheck, Circle, Globe, ChevronLeft, ChevronRight,
  Sparkles, Layers, Target, Home, TreePine, Mountain
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
  center: number[];
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

const getStatusIcon = (isActive: boolean) => {
  return isActive ? ToggleRight : ToggleLeft;
};

export default function ManageWilayah() {
  // State Management
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWilayah, setEditingWilayah] = useState<Wilayah | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
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
    isActive: true
  });

  // Data Fetching
  const fetchWilayah = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/wilayah`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWilayahList(res.data);
    } catch (error) {
      toast.error('Gagal mengambil data wilayah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWilayah();
  }, []);

  // Computed Values
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

  // Pagination
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

  // Event Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingWilayah(null);
    setFormData({
      name: '',
      code: '',
      population: '',
      address: '',
      capacityVolume: '',
      latitude: '',
      longitude: '',
      isActive: true
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
      toast.error(error.response?.data?.error || 'Gagal menyimpan data wilayah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus wilayah ${name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/wilayah/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Wilayah dihapus!');
      fetchWilayah();
    } catch (error) {
      toast.error('Gagal menghapus wilayah');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/wilayah/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status ${name} diubah`);
      fetchWilayah();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Components
  const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg shadow-[#064E3B]/10 border border-[#064E3B]/20 hover:shadow-xl hover:shadow-[#064E3B]/20 transition-all duration-300"
    >
      <div className="flex items-center gap-2">
        <div className={`relative`}>
          <div className={`absolute inset-0 bg-[#064E3B]/20 rounded-lg blur-sm`}></div>
          <div className={`relative bg-gradient-to-br from-[#064E3B] to-[#0B6B4F] p-2 rounded-lg shadow-lg shadow-[#064E3B]/30`}>
            <Icon size={14} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-base font-bold text-slate-800">{value}</p>
            {trend && (
              <span className={`text-[8px] font-medium px-1 py-0.5 rounded-full bg-[#E8F5E9] text-[#064E3B]`}>
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const FilterButton = ({ value, label, icon: Icon, color }: any) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setStatusFilter(value)}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5 ${
        statusFilter === value 
          ? `bg-gradient-to-r from-[#064E3B] to-[#0B6B4F] text-white shadow-md shadow-[#064E3B]/30 ring-2 ring-[#064E3B]/30` 
          : `bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm`
      }`}
    >
      {Icon && <Icon size={10} />}
      {label}
    </motion.button>
  );

  const MobileCard = ({ wilayah, index }: { wilayah: Wilayah; index: number }) => {
    const StatusIcon = getStatusIcon(wilayah.isActive);
    
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -2, scale: 1.01 }}
        className="group bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg shadow-[#064E3B]/10 border border-[#064E3B]/20 hover:shadow-xl hover:shadow-[#064E3B]/20 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-[#064E3B]/20 rounded-lg blur-[2px]"></div>
              <div className="relative w-8 h-8 bg-gradient-to-br from-[#064E3B] to-[#0B6B4F] rounded-lg flex items-center justify-center shadow-lg shadow-[#064E3B]/30">
                <TreePine size={16} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-[#064E3B] transition-colors">
                {wilayah.name}
              </h3>
              <p className="text-[8px] text-slate-400 font-mono">Kode: {wilayah.code || '-'}</p>
            </div>
          </div>
          <ActionButtons wilayah={wilayah} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <InfoChip 
            icon={Users}
            label="PENDUDUK" 
            value={wilayah.population ? formatNumber(wilayah.population) + ' jiwa' : '-'}
            color="emerald"
          />
          <InfoChip 
            icon={Map}
            label="KAPASITAS" 
            value={wilayah.capacityVolume ? formatNumber(wilayah.capacityVolume) + ' m³' : '-'}
            color="amber"
          />
        </div>

        <div className="space-y-1.5">
          <AddressChip address={wilayah.address} />
          <StatusChip wilayah={wilayah} onToggle={toggleStatus} />
        </div>
      </motion.div>
    );
  };

  const InfoChip = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-1.5 border border-slate-100">
      <div className="flex items-center gap-1.5">
        <div className={`p-1 rounded-md bg-[#E8F5E9]`}>
          <Icon size={10} className="text-[#064E3B]" />
        </div>
        <div className="flex-1">
          <p className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-[10px] font-semibold text-slate-700">{value}</p>
        </div>
      </div>
    </div>
  );

  const AddressChip = ({ address }: { address: string | null }) => (
    <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg p-1.5 border border-slate-100 flex items-center gap-1.5">
      <MapPin size={10} className="text-[#064E3B] flex-shrink-0" />
      <span className="text-[9px] text-slate-600 truncate">
        {address || '📍 Alamat tidak tersedia'}
      </span>
    </div>
  );

  const StatusChip = ({ wilayah, onToggle }: { wilayah: Wilayah; onToggle: Function }) => {
    const StatusIcon = getStatusIcon(wilayah.isActive);
    
    return (
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg p-1.5 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Globe size={10} className="text-slate-400" />
          <span className="text-[8px] text-slate-600 font-mono">
            {wilayah.latitude}, {wilayah.longitude}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(wilayah.id, wilayah.isActive, wilayah.name)}
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[8px] font-medium transition-all border ${getStatusStyle(wilayah.isActive)}`}
        >
          <StatusIcon size={8} />
          {wilayah.isActive ? 'Aktif' : 'Nonaktif'}
        </motion.button>
      </div>
    );
  };

  const ActionButtons = ({ wilayah }: { wilayah: Wilayah }) => (
    <div className="flex gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => openEditModal(wilayah)}
        className="p-1 text-slate-400 hover:text-[#064E3B] hover:bg-[#E8F5E9] rounded-md transition-all"
        title="Edit"
      >
        <Edit size={12} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleDelete(wilayah.id, wilayah.name)}
        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
        title="Hapus"
      >
        <Trash2 size={12} />
      </motion.button>
    </div>
  );

  const TableRow = ({ wilayah, index }: { wilayah: Wilayah; index: number }) => {
    const StatusIcon = getStatusIcon(wilayah.isActive);
    
    return (
      <motion.tr
        variants={itemVariants}
        whileHover={{ backgroundColor: 'rgba(6, 78, 59, 0.02)' }}
        className="group transition-colors border-b border-slate-100 last:border-0"
      >
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-[10px] font-mono text-slate-400">#{String(index + 1 + (currentPage - 1) * itemsPerPage).padStart(2, '0')}</span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-[#064E3B]/20 rounded-md blur-[1px]"></div>
              <div className="relative w-6 h-6 bg-gradient-to-br from-[#064E3B] to-[#0B6B4F] rounded-md flex items-center justify-center shadow-md shadow-[#064E3B]/20">
                <TreePine size={10} className="text-white" />
              </div>
            </div>
            <div>
              <div className="font-medium text-xs text-slate-800 group-hover:text-[#064E3B] transition-colors">
                {wilayah.name}
              </div>
              {wilayah.address && (
                <div className="text-[8px] text-slate-400 truncate max-w-[150px]">
                  {wilayah.address}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-[10px] font-mono text-[#064E3B] bg-[#E8F5E9] px-1.5 py-0.5 rounded">
            {wilayah.code || '-'}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Users size={8} className="text-[#064E3B]" />
            <span className="text-[10px] text-slate-700">
              {wilayah.population ? formatNumber(wilayah.population) : '-'}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Map size={8} className="text-amber-500" />
            <span className="text-[10px] text-slate-700">
              {wilayah.capacityVolume ? formatNumber(wilayah.capacityVolume) + ' m³' : '-'}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Target size={8} className="text-slate-400" />
            <span className="text-[8px] font-mono text-slate-600">
              {wilayah.latitude}, {wilayah.longitude}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleStatus(wilayah.id, wilayah.isActive, wilayah.name)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-medium transition-all border ${getStatusStyle(wilayah.isActive)}`}
          >
            <StatusIcon size={8} />
            {wilayah.isActive ? 'Aktif' : 'Nonaktif'}
          </motion.button>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <ActionButtons wilayah={wilayah} />
          </div>
        </td>
      </motion.tr>
    );
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-t border-[#064E3B]/10">
        <div className="text-[10px] text-slate-500">
          Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredWilayah.length)} dari {filteredWilayah.length} data
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-[#E8F5E9] hover:text-[#064E3B] hover:border-[#064E3B]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={14} />
          </motion.button>
          <span className="text-[10px] font-medium text-slate-600 px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-[#E8F5E9] hover:text-[#064E3B] hover:border-[#064E3B]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>
    );
  };

  const ModalForm = () => (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-[#064E3B]/20"
          >
            {/* Modal Header */}
            <div className={`bg-gradient-to-r from-[#064E3B] to-[#0B6B4F] px-4 py-3 flex items-center justify-between sticky top-0`}>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  {editingWilayah ? <Edit size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
                </div>
                <h3 className="text-white text-sm font-semibold">
                  {editingWilayah ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
                </h3>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-lg backdrop-blur-sm"
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Nama Kecamatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="Contoh: Balige"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Kode</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                    placeholder="BLG"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    name="isActive"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Penduduk</label>
                  <input
                    type="number"
                    name="population"
                    value={formData.population}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                    placeholder="45000"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Kapasitas (m³)</label>
                  <input
                    type="number"
                    name="capacityVolume"
                    value={formData.capacityVolume}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                    placeholder="2.3333"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900"
                    placeholder="99.0667"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Alamat</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900 resize-none"
                    placeholder="Jl. Sisingamangaraja No. 1, Balige"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#064E3B] to-[#0B6B4F] text-white py-2.5 px-3 rounded-xl text-xs font-semibold hover:from-[#0B6B4F] hover:to-[#064E3B] transition-all shadow-lg shadow-[#064E3B]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      {editingWilayah ? 'Update Data' : 'Simpan Data'}
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  Batal
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7F4] via-white to-[#E8F5E9] p-3 md:p-4 font-sans">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#064E3B]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0B6B4F]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#064E3B]/5 rounded-full blur-3xl"></div>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#1e293b',
            boxShadow: '0 20px 25px -5px rgba(6, 78, 59, 0.2), 0 10px 10px -5px rgba(0,0,0,0.02)',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid rgba(6, 78, 59, 0.1)',
            backdropFilter: 'blur(8px)',
          }
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="bg-gradient-to-br from-[#064E3B] to-[#0B6B4F] p-2.5 rounded-xl shadow-xl shadow-[#064E3B]/30 relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
              <Mountain size={18} className="text-white relative z-10" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#064E3B] to-[#0B6B4F] bg-clip-text text-transparent">
                Manajemen Wilayah
              </h1>
              <p className="text-[9px] text-slate-400 flex items-center gap-1">
                <Layers size={8} />
                Kelola data kecamatan
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur-sm border border-[#064E3B]/20 rounded-xl text-xs font-medium text-slate-600 hover:bg-white hover:border-[#064E3B]/40 transition-all shadow-sm"
            >
              <Filter size={12} />
              <span>Filter</span>
              <ChevronDown size={10} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#064E3B] to-[#0B6B4F] hover:from-[#0B6B4F] hover:to-[#064E3B] text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-[#064E3B]/30"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tambah Wilayah</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-5 gap-2"
        >
          <StatCard icon={Building2} label="Total Wilayah" value={stats.total} color="emerald" />
          <StatCard icon={CircleCheck} label="Aktif" value={stats.active} color="emerald" />
          <StatCard icon={Circle} label="Nonaktif" value={stats.inactive} color="rose" />
          <StatCard icon={Users} label="Total Penduduk" value={formatNumber(stats.totalPopulation)} color="emerald" />
          <StatCard icon={Map} label="Kapasitas Total" value={formatNumber(stats.totalCapacity) + ' m³'} color="amber" />
        </motion.div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg shadow-[#064E3B]/10 border border-[#064E3B]/20 p-3 mb-4"
      >
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#064E3B]/40" size={14} />
            <input
              type="text"
              placeholder="Cari kecamatan, kode, atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#064E3B]/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 focus:border-[#064E3B] transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#064E3B]/10">
                  <FilterButton value="ALL" label="Semua Status" color="emerald" />
                  <FilterButton value="ACTIVE" label="Aktif" icon={CircleCheck} color="emerald" />
                  <FilterButton value="INACTIVE" label="Nonaktif" icon={Circle} color="rose" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {loading ? (
            <LoadingState />
          ) : filteredWilayah.length === 0 ? (
            <EmptyState searchTerm={searchTerm} />
          ) : (
            paginatedWilayah.map((wilayah, index) => (
              <MobileCard key={wilayah.id} wilayah={wilayah} index={index} />
            ))
          )}
        </motion.div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg shadow-[#064E3B]/10 border border-[#064E3B]/20 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#E8F5E9] to-white border-b border-[#064E3B]/10">
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">No</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Kecamatan</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Kode</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Penduduk</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Kapasitas</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Koordinat</th>
                  <th className="px-3 py-2.5 text-left text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-right text-[8px] font-semibold text-[#064E3B] uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#064E3B]/10">
                {loading ? (
                  <TableLoadingState />
                ) : filteredWilayah.length === 0 ? (
                  <TableEmptyState searchTerm={searchTerm} />
                ) : (
                  paginatedWilayah.map((wilayah, index) => (
                    <TableRow key={wilayah.id} wilayah={wilayah} index={index} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination />
        </motion.div>
      </div>

      {/* Modal */}
      <ModalForm />
    </div>
  );
}

// Helper Components
const LoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center border border-[#064E3B]/20"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="mx-auto text-[#064E3B] mb-3" size={32} />
    </motion.div>
    <p className="text-xs text-slate-500">Memuat data wilayah...</p>
  </motion.div>
);

const EmptyState = ({ searchTerm }: { searchTerm: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center border border-[#064E3B]/20"
  >
    <TreePine size={40} className="mx-auto text-[#064E3B]/30 mb-3" />
    <p className="text-xs font-medium text-slate-600 mb-1">
      {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada data wilayah'}
    </p>
    <p className="text-[9px] text-slate-400">
      {searchTerm ? 'Coba kata kunci lain' : 'Klik tombol Tambah untuk menambah data'}
    </p>
  </motion.div>
);

const TableLoadingState = () => (
  <tr>
    <td colSpan={8} className="px-3 py-8 text-center">
      <Loader2 className="animate-spin mx-auto text-[#064E3B] mb-2" size={24} />
      <p className="text-xs text-slate-500">Memuat data...</p>
    </td>
  </tr>
);

const TableEmptyState = ({ searchTerm }: { searchTerm: string }) => (
  <tr>
    <td colSpan={8} className="px-3 py-8 text-center">
      <TreePine size={32} className="mx-auto text-[#064E3B]/30 mb-2" />
      <p className="text-xs text-slate-500">
        {searchTerm ? 'Tidak ada data yang cocok' : 'Belum ada data wilayah'}
      </p>
    </td>
  </tr>
);