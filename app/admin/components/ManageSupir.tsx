"use client";

import { useState, useEffect, FormEvent, useMemo, type ReactNode } from "react";
import axios from "axios";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Mail,
  Phone,
  X,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  UserPlus,
  UserCog,
  Lock,
  Eye,
  BadgeCheck,
} from "lucide-react";
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// Types
interface Supir {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt?: string;
}

interface FormData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  isActive: boolean;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

// Constants
const API_BASE_URL = "http://localhost:5000/api/admin";
const INITIAL_FORM_DATA: FormData = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  isActive: true,
};

export default function ManageSupir() {
  // State Management
  const [supirList, setSupirList] = useState<Supir[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [viewingSupir, setViewingSupir] = useState<Supir | null>(null);
  const [editingSupir, setEditingSupir] = useState<Supir | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successDescription, setSuccessDescription] = useState('');
  const [successIcon, setSuccessIcon] = useState<ReactNode>(<CheckCircle2 size={24} />);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [selectedSupirForToggle, setSelectedSupirForToggle] = useState<Supir | null>(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);

  // Data Fetching
  const fetchSupir = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_BASE_URL}/supir-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSupirList(response.data.data || []);
    } catch (error) {
      toast.error("Gagal memuat data supir");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupir();
  }, []);

  // Computed Values
  const stats: Stats = useMemo(
    () => ({
      total: supirList.length,
      active: supirList.filter((s) => s.isActive).length,
      inactive: supirList.filter((s) => !s.isActive).length,
    }),
    [supirList]
  );

  const filteredSupir = useMemo(
    () =>
      supirList.filter(
        (s) =>
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [supirList, searchTerm]
  );

  // Event Handlers
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const url = editingSupir
        ? `${API_BASE_URL}/supir/${editingSupir.id}` 
        : `${API_BASE_URL}/add-operator`;

      if (editingSupir) {
        await axios.put(url, formData, config);
        toast.success("Data berhasil diedit", { icon: "✏️" });
        setSuccessTitle('Data berhasil diedit');
        setSuccessDescription('Perubahan supir berhasil disimpan.');
        setSuccessIcon(<Edit3 size={24} />);
      } else {
        await axios.post(url, formData, config);
        toast.success("Data berhasil ditambahkan", { icon: "✅" });
        setSuccessTitle('Data berhasil ditambahkan');
        setSuccessDescription('Supir baru berhasil ditambahkan ke sistem.');
        setSuccessIcon(<CheckCircle2 size={24} />);
      }

      setShowModal(false);
      setShowSuccessDialog(true);
      fetchSupir();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || (editingSupir ? "Gagal memperbarui data" : "Gagal menambahkan supir")
      );
      console.error("Submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (id: string): void => {
    setPendingDeleteId(id);
    setShowConfirmDialog(true);
  };

  const handleDelete = async (): Promise<void> => {
    if (!pendingDeleteId) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/supir/${pendingDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Supir berhasil dihapus");

      setSuccessTitle('Data berhasil dihapus');
      setSuccessDescription('Data supir telah dihapus secara permanen.');
      setSuccessIcon(<Trash2 size={24} />);
      setShowSuccessDialog(true);

      fetchSupir();

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus supir");
      console.error("Delete error:", error);
    } finally {
      setShowConfirmDialog(false);
      setPendingDeleteId(null);
    }
  };

  const toggleStatus = async (supir: Supir): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      // Menggunakan rute PUT yang sama untuk update status cepat
      await axios.put(
        `${API_BASE_URL}/supir/${supir.id}`,
        { ...supir, isActive: !supir.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        `Supir berhasil ${!supir.isActive ? "diaktifkan" : "dinonaktifkan"}`
      );
      fetchSupir();
    } catch (error) {
      toast.error("Gagal mengubah status");
      console.error("Status toggle error:", error);
    }
  };

  const openModal = (supir?: Supir): void => {
    if (supir) {
      setEditingSupir(supir);
      setFormData({
        fullName: supir.fullName,
        email: supir.email,
        password: "", // Dikosongkan agar admin tidak melihat password lama
        phoneNumber: supir.phoneNumber || "",
        isActive: supir.isActive,
      });
    } else {
      setEditingSupir(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setEditingSupir(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const closeSuccessDialog = (): void => {
    setShowSuccessDialog(false);
  };

  // Render Helpers
  const renderStatsCard = (
    label: string,
    value: number,
    Icon: React.ElementType,
    bgColor: string,
    delay: number
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between"
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-xl shadow-inner text-white`}>
        <Icon size={18} />
      </div>
    </motion.div>
  );

  const renderTableRow = (supir: Supir) => (
    <tr
      key={supir.id}
      className="hover:bg-emerald-50/20 transition-colors duration-200"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center font-bold text-sm shadow-inner">
            {supir.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {supir.fullName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              ID: {supir.id.slice(0, 6)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-slate-600 text-xs">
            <Mail size={12} className="text-emerald-600 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{supir.email}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 text-xs">
            <Phone size={12} className="text-emerald-600 flex-shrink-0" />
            <span>{supir.phoneNumber || "-"}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
onClick={() => openToggleConfirm(supir)}
          className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
            supir.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
          }`}
        >
          {supir.isActive ? "Aktif" : "Nonaktif"}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setViewingSupir(supir)}
            className="p-2 text-white-300 bg-blue-500 rounded-lg transition-all"
            title="Lihat detail supir"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => openModal(supir)}
            className="p-2 text-white-300 bg-yellow-400 rounded-lg transition-all"
            title="Edit supir"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => openDeleteConfirm(supir.id)}
            className="p-2 text-white-300 bg-red-600 rounded-lg transition-all"
            title="Hapus supir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderViewModal = () => (
    <AnimatePresence>
      {viewingSupir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-emerald-100 overflow-hidden"
          >
            <div className="bg-[#064E3B] px-5 py-4 flex justify-between items-center text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BadgeCheck size={18} />
                Detail Akun Supir
              </h3>
              <button
                onClick={() => setViewingSupir(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center font-black text-2xl shadow-inner">
                  {viewingSupir.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{viewingSupir.fullName}</h4>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    viewingSupir.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {viewingSupir.isActive ? "Status: Aktif" : "Status: Nonaktif"}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ID Sistem</p>
                  <p className="text-sm font-mono text-slate-700 mt-0.5">{viewingSupir.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email (Untuk Login Mobile)</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail size={14} className="text-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">{viewingSupir.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nomor Telepon</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone size={14} className="text-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">{viewingSupir.phoneNumber || "Tidak ada nomor"}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingSupir(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderModal = () => (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-emerald-100 overflow-hidden"
          >
            <div className="bg-[#064E3B] px-5 py-4 flex justify-between items-center text-white">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  {editingSupir ? <UserCog size={18} /> : <UserPlus size={18} />}
                  {editingSupir ? "Edit Supir" : "Tambah Supir & Buat Akun"}
                </h3>
                <p className="text-emerald-200/80 text-[10px] mt-0.5">
                  {editingSupir
                    ? "Perbarui informasi supir"
                    : "Akun ini akan digunakan supir untuk login ke aplikasi"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users size={14} />
                  </div>
                  <input
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:border-[#064E3B] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
                    placeholder="Nama lengkap"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:border-[#064E3B] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
                      placeholder="email@domain.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">
                    Telepon
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:border-[#064E3B] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
                      placeholder="081234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">
                  {editingSupir ? "Password Baru (Opsional)" : "Password Aplikasi"} 
                  {!editingSupir && <span className="text-rose-500"> *</span>}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type="password"
                    required={!editingSupir}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:border-[#064E3B] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
                    placeholder={editingSupir ? "Kosongkan jika tidak ingin mengubah sandi" : "Buat sandi login (Min. 6 karakter)"}
                    minLength={editingSupir && formData.password === "" ? 0 : 6}
                  />
                </div>
              </div>

              {editingSupir && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#064E3B] focus:ring-[#064E3B]"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-slate-700">
                    Akun aktif
                  </label>
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#064E3B] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-900/20 hover:bg-[#053f30] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Proses...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>{editingSupir ? "Simpan Perubahan" : "Tambah & Buat Akun"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={showConfirmDialog}
      title="Yakin Hapus Data?"
      description="Semua data supir yang terkait akan dihapus permanen."
      confirmText="Ya"
      cancelText="Batal"
      onConfirm={handleDelete}
      onCancel={() => {
        setShowConfirmDialog(false);
        setPendingDeleteId(null);
      }}
    />
  );

  const openToggleConfirm = (supir: Supir): void => {
  setSelectedSupirForToggle(supir);
  setShowToggleConfirm(true);
};

       const renderToggleConfirmDialog = () => (
  <ConfirmDialog
    open={showToggleConfirm}
    title={
      selectedSupirForToggle?.isActive
        ? "Nonaktifkan Supir?"
        : "Aktifkan Supir?"
    }
    description={
      selectedSupirForToggle?.isActive
        ? "Supir ini tidak akan bisa mengakses aplikasi."
        : "Supir ini akan bisa kembali mengakses aplikasi."
    }
    confirmText="Ya"
    cancelText="Batal"
     onConfirm={() => {
  if (selectedSupirForToggle) {
    toggleStatus(selectedSupirForToggle);
  }
  setShowToggleConfirm(false);
  setSelectedSupirForToggle(null);
}}    onCancel={() => {
      setShowToggleConfirm(false);
      setSelectedSupirForToggle(null);
    }}
  />
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#363636",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "8px 12px",
          },
        }}
      />

      <AlertDialog
        open={showSuccessDialog}
        title={successTitle}
        description={successDescription}
        buttonText="OK"
        icon={successIcon}
        onClose={closeSuccessDialog}
      />

      {renderConfirmDialog()}
      {renderToggleConfirmDialog()}

      <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden bg-white rounded-2xl shadow-md shadow-emerald-900/5 border border-emerald-100/50 p-5"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-900/5 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#064E3B] p-2.5 rounded-xl shadow-lg shadow-emerald-900/20 text-white">
                <Users size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#064E3B] tracking-tight">
                  Manajemen Supir
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Kelola data dan akun akses supir armada Anda
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderStatsCard("Total", stats.total, Users, "bg-[#064E3B]", 0.1)}
          {renderStatsCard("Aktif", stats.active, Activity, "bg-emerald-600", 0.2)}
          {renderStatsCard("Nonaktif", stats.inactive, XCircle, "bg-rose-500", 0.3)}
        </div>

        <div className="flex justify-end mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#064E3B] text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-slate-200 hover:bg-[#053f30] active:scale-95"
          >
            <Plus size={18} />
            Tambah Supir
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredSupir.length} / {supirList.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Informasi
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kontak Login
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-[#064E3B]" size={20} />
                        <p className="text-xs text-slate-500 font-medium">Memuat...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSupir.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-xs text-slate-400 font-medium">
                        {searchTerm ? "Tidak ada hasil" : "Belum ada data"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSupir.map(renderTableRow)
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {renderModal()}
      {renderViewModal()}
    </div>
  );
}