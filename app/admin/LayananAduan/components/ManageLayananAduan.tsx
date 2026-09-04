"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Trash2,
  Search,
  User,
  RefreshCw,
  Repeat,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  Calendar,
  Truck,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Mail,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PenugasanDetail from "./PenugasanDetail";
import AlertDialog, { type AlertType } from "../../components/AlertDialog";

// ============================================================
// KONSTANTA & UTILITY
// ============================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") + "/api"
  : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {} as any;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const ITEMS_PER_PAGE = 12;

// ============================================================
// KONSTANTA OPERASIONAL
// ============================================================
const OPERATIONAL_START = 8;   // 08:00
const OPERATIONAL_END = 17;  // 17:00

const isOperationalHours = (date: Date): boolean => {
  const hourWIB = parseInt(
    date.toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false })
  );
  return hourWIB >= OPERATIONAL_START && hourWIB < OPERATIONAL_END;
};

const formatCoordinate = (coord: any, decimals: number = 5): string | null => {
  if (!coord) return null;
  const num = typeof coord === "string" ? parseFloat(coord) : coord;
  return Number.isFinite(num) ? num.toFixed(decimals) : null;
};

const isOverdue = (item: any): boolean => {
  if (!item.scheduledAt) return false;
  if (["SELESAI", "BEKERJA", "LAPORAN_BARU"].includes(item.status)) return false;
  return Date.now() > new Date(item.scheduledAt).getTime();
};

const getDriverFromTruck = (truk: any) => {
  if (truk.operator) return { id: truk.operator.id, fullName: truk.operator.fullName };
  if (truk.driver) return { id: truk.driver.id, fullName: truk.driver.fullName };
  return null;
};
const toDateTimeLocalValue = (date: Date) => {
  const wibString = date.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }); // "YYYY-MM-DD HH:mm:ss"
  return wibString.slice(0, 16).replace(" ", "T");
};

const getCurrentDateTimeLocal = () => {
  return toDateTimeLocalValue(new Date());
};

const toISOWithWIBOffset = (localDateTimeStr: string): string | null => {
  if (!localDateTimeStr) return null;
  return `${localDateTimeStr}:00+07:00`;
};

// ============================================================
// CUSTOM HOOK: usePenugasan
// ============================================================
function usePenugasan() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemList, setItemList] = useState<any[]>([]);
  const [trukList, setTrukList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [alert, setAlert] = useState<{ open: boolean; type: AlertType; title: string; description: string; detailText?: string }>({
    open: false,
    type: "info",
    title: "",
    description: "",
  });

  const showAlert = useCallback(
    (type: AlertType, title: string, description: string, detailText?: string) => {
      setAlert({ open: true, type, title, description, detailText });
    },
    []
  );

  const closeAlert = useCallback(() => setAlert((prev) => ({ ...prev, open: false })), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [penugasanRes, laporanRes, trukRes] = await Promise.all([
        api.get("/penugasan?type=ADUAN"),
        api.get("/laporan"),
        api.get("/admin/truks"),
      ]);

      const penugasanData = (penugasanRes.data.data || []).map((item: any) => ({
        ...item,
        scheduledAt: item.scheduledAt ?? item.scheduled_at ?? null,
      }));
      const assigned = new Set(penugasanData.map((p: any) => p.report?.id).filter(Boolean));

      const laporanBaru = (laporanRes.data.data || [])
        .filter((item: any) =>
          (item.status === "LAPORAN_BARU" || item.status === "PENDING" || item.status === "DITOLAK") &&
          !assigned.has(item.id)
        )
        .map((item: any) => ({
          id: item.id,
          status: item.status === "DITOLAK" ? "DITOLAK" : "LAPORAN_BARU",
          isLaporanBaru: item.status !== "DITOLAK",
          taskNumber: null,
          location:
            typeof item.location === "string"
              ? item.location
              : item.location?.name || item.description || "Lokasi tidak tersedia",
          latitude: item.latitude || item.koordinat?.latitude,
          longitude: item.longitude || item.koordinat?.longitude,
          district: item.jenisSampah,
          description: item.description,
          rejectionReason: item.rejectionReason || null,
          pelapor: item.pelapor,
          createdAt: item.createdAt,
          photoUrl: item.photoUrl || null,
          user: item.user || null,
          locationDetail: item.location || null,
          report: {
            id: item.id,
            description: item.description,
            jenisSampah: item.jenisSampah,
            pelapor: item.pelapor,
            latitude: item.latitude || item.koordinat?.latitude,
            longitude: item.longitude || item.koordinat?.longitude,
          },
        }));

      const combined = [...laporanBaru, ...penugasanData];
      const seen = new Set<string>();
      const deduplicated = combined.filter((item: any) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      setItemList(deduplicated);
      setTrukList(trukRes.data.data || []);
      setCurrentPage(1);
    } catch (error: any) {
      showAlert(
        "error",
        "Gagal memuat data",
        "Data penugasan tidak bisa dimuat.",
        error?.response?.data?.message || "Terjadi kesalahan pada server."
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEffectiveStatus = (item: any): string => {
    if (item.status === "DITUGASKAN" && isOverdue(item)) return "TIDAK_DIKERJAKAN";
    return item.status;
  };

  const filteredItems = useMemo(() => {
    return itemList.filter((item) => {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (item.location || "").toLowerCase().includes(s) ||
        (item.description || "").toLowerCase().includes(s) ||
        (item.driver?.fullName || "").toLowerCase().includes(s) ||
        (item.pelapor || "").toLowerCase().includes(s) ||
        (item.taskNumber || "").toLowerCase().includes(s);
      const effectiveStatus = getEffectiveStatus(item);
      const matchStatus = filterStatus ? effectiveStatus === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [itemList, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const stats = useMemo(() => ({
    total: itemList.length,
    laporan_baru: itemList.filter((i) => i.status === "LAPORAN_BARU").length,
    dalam_proses: itemList.filter((i) => i.status === "DITUGASKAN" || i.status === "BEKERJA").length,
    selesai: itemList.filter((i) => i.status === "SELESAI").length,
    driver_aktif: new Set(itemList.filter((i) => i.status !== "LAPORAN_BARU").map((i) => i.driver?.id)).size,
  }), [itemList]);

  const isTruckAvailable = (truckId: string, scheduledAt: string, excludeId?: string): boolean => {
    const sel = new Date(scheduledAt).getTime();
    return !itemList
      .filter((i) => i.status !== "LAPORAN_BARU" && i.truck?.id === truckId && i.scheduledAt && i.id !== excludeId)
      .some((i) => Math.abs(sel - new Date(i.scheduledAt!).getTime()) < 2 * 60 * 60 * 1000);
  };

  return {
    loading,
    submitting,
    setSubmitting,
    itemList,
    trukList,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filterStatus,
    setFilterStatus,
    filteredItems,
    totalPages,
    paginatedItems,
    stats,
    alert,
    showAlert,
    closeAlert,
    fetchData,
    isTruckAvailable,
    getEffectiveStatus,
    getDriverFromTruck,
    toDateTimeLocalValue,
    getCurrentDateTimeLocal,
  };
}

// ============================================================
// KOMPONEN PEMBANTU (UI)
// ============================================================
function StatsCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3 sm:gap-4 hover:shadow-md transition-all">
      <div className={`p-3 rounded-xl ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    LAPORAN_BARU: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-600/10", dot: "bg-red-500" },
    DITUGASKAN: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-600/10", dot: "bg-blue-500" },
    BEKERJA: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/10", dot: "bg-amber-500" },
    SELESAI: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/10", dot: "bg-emerald-500" },
    DITOLAK: { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-600/10", dot: "bg-slate-400" },
    TIDAK_DIKERJAKAN: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-600/10", dot: "bg-orange-500" },
  };
  const style = styles[status] || styles.DITUGASKAN;
  const label = status === "TIDAK_DIKERJAKAN" ? "Tidak Dikerjakan" : status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ring-inset whitespace-nowrap ${style.bg} ${style.text} ${style.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
}

// ── Modal Tugaskan / Edit ──
function TugaskanModal({
  open,
  onClose,
  isEdit,
  selectedItem,
  formData,
  setFormData,
  formErrors,
  trukList,
  submitting,
  onSubmit,
  isTruckAvailable,
  getDriverFromTruck,
  getCurrentDateTimeLocal,
}: any) {
  const selectedTruck = trukList.find((t: any) => t.id === formData.truckId);
  const selectedDriverName = selectedTruck ? getDriverFromTruck(selectedTruck)?.fullName ?? "Belum Ada Driver" : "";
  const hasDriver = selectedTruck ? !!getDriverFromTruck(selectedTruck) : false;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "truckId") {
      const sel = trukList.find((t: any) => t.id === value);
      setFormData({
        ...formData,
        truckId: value,
        driverId: sel ? getDriverFromTruck(sel)?.id || "" : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-none sm:rounded-[32px] shadow-2xl w-full max-w-lg min-h-screen sm:min-h-0 overflow-hidden my-auto border border-gray-100"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-gray-900">{isEdit ? "Edit Penugasan" : "Buat Penugasan Baru"}</h2>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold">
              {isEdit ? "Ubah armada, jadwal, atau lokasi" : "Tentukan armada dan jadwal operasional"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors self-end sm:self-auto">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
              Armada / Truk <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="truckId"
              value={formData.truckId}
              onChange={handleChange}
              className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-bold transition-all text-gray-700 ${formErrors.truckId ? "border-red-400" : "border-gray-200 focus:border-green-500"
                }`}
            >
              <option value="">-- Pilih Armada Operasional --</option>
              {trukList.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.plateNumber}
                  {t.unitCode ? ` (${t.unitCode})` : ""} - {getDriverFromTruck(t)?.fullName ?? "Tanpa Driver"}
                  {!getDriverFromTruck(t) ? " ⚠️" : ""}
                </option>
              ))}
            </select>
            {formErrors.truckId && (
              <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {formErrors.truckId}
              </p>
            )}
          </div>

          {formData.truckId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl p-5 ${hasDriver ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
                }`}
            >
              {hasDriver ? (
                <>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Driver Terpilih
                  </p>
                  <p className="text-base font-black text-emerald-900 mt-1">{selectedDriverName}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Armada Tanpa Driver
                  </p>
                  <p className="text-xs text-amber-800 mt-2 font-medium leading-relaxed">
                    Armada ini belum memiliki driver yang terhubung. Silakan assign driver terlebih dahulu di menu Manajemen Armada.
                  </p>
                </>
              )}
            </motion.div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
              Jadwal Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
              min={getCurrentDateTimeLocal()}
              className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-bold transition-all text-gray-700 ${formErrors.scheduledAt ? "border-red-400" : "border-gray-200 focus:border-green-500"
                }`}
            />
            {formErrors.scheduledAt ? (
              <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {formErrors.scheduledAt}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-gray-400 ml-1 font-medium">
                * Jam operasional: {OPERATIONAL_START.toString().padStart(2, '0')}:00 - {OPERATIONAL_END.toString().padStart(2, '0')}:00 WIB.
                Pastikan jadwal tidak bentrok dalam rentang 2 jam dengan penugasan lain.
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
              Deskripsi Laporan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              name="location"
              rows={3}
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-medium transition-all text-gray-700 resize-none ${formErrors.location ? "border-red-400" : "border-gray-200 focus:border-green-500"
                }`}
              placeholder="Masukkan alamat lengkap lokasi penugasan"
            />
            {formErrors.location && (
              <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {formErrors.location}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-6 py-4 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all border border-transparent"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={(!hasDriver && !!formData.truckId) || submitting}
              className="w-full sm:flex-[2] py-4 bg-[#4A6D55] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 hover:bg-[#3a5643] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Konfirmasi Penugasan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Modal Detail Laporan ──
function DetailLaporanModal({ open, onClose, laporan }: any) {
  if (!open || !laporan) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <FileText size={20} className="text-emerald-700" />
            </div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg">Detail Laporan</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1.5 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Laporan Baru
            </span>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {laporan.photoUrl ? (
            <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm relative group">
              <img src={laporan.photoUrl} alt="Foto laporan" className="w-full h-auto max-h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Tidak ada foto dilampirkan</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                <User size={14} /> Informasi Pelapor
              </p>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <p className="font-bold text-gray-900 text-base">{laporan.user?.fullName || laporan.pelapor || "Anonim"}</p>
                <div className="flex flex-col gap-1 mt-2">
                  {laporan.user?.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" /> {laporan.user.email}
                    </p>
                  )}
                  {laporan.user?.phoneNumber && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" /> {laporan.user.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                <MapPin size={14} /> Detail Lokasi
              </p>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  {laporan.locationDetail?.name || laporan.location || "Lokasi tidak tersedia"}
                </p>
                {laporan.latitude && laporan.longitude && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <MapPin size={12} className="text-blue-500" />
                    <p className="text-xs text-gray-500 font-mono">
                      {formatCoordinate(laporan.latitude)}, {formatCoordinate(laporan.longitude)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                <FileText size={14} /> Deskripsi Laporan
              </p>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {laporan.description || laporan.report?.description || "Tidak ada deskripsi"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {laporan.report?.jenisSampah && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                    <AlertCircle size={14} /> Jenis Sampah
                  </p>
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 h-full flex items-center">
                    <p className="text-sm font-bold text-emerald-800">{laporan.report.jenisSampah}</p>
                  </div>
                </div>
              )}
              {laporan.createdAt && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                    <Calendar size={14} /> Waktu Laporan
                  </p>
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 h-full flex items-center">
                    <p className="text-sm text-gray-700 font-medium">
                      {new Date(laporan.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 bg-white flex flex-wrap sm:flex-nowrap gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all order-3 sm:order-1">
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal Delete Confirm ──
function DeleteConfirmModal({ open, onClose, onConfirm, type, name }: any) {
  if (!open) return null;
  return (
    <AlertDialog
      open={open}
      type="delete"
      title={type === "laporan" ? "Hapus Laporan?" : "Hapus Penugasan?"}
      description={
        name
          ? `${type === "laporan" ? "Laporan" : "Penugasan"} "${name}" akan dihapus secara permanen dari sistem.`
          : "Data akan dihapus secara permanen dari sistem."
      }
      buttonText="Hapus"
      showCancelButton={true}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

// ── Modal Tolak Confirm ──
function TolakConfirmModal({ open, onClose, onConfirm, name, reason, setReason, error, setError, submitting }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-gray-900">Tolak Laporan?</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {name ? `Laporan "${name}" akan ditolak.` : "Laporan akan ditolak dan statusnya diubah."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1 mb-1">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Contoh: Foto laporan tidak jelas, lokasi sudah ditangani sebelumnya, dll."
              className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-2 focus:ring-red-500/20 transition-all resize-none ${error ? "border-red-400" : "border-gray-200 focus:border-red-500"
                }`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5 ml-1">
                <AlertCircle size={14} /> {error}
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-2 ml-1">Alasan ini akan dikirim langsung ke email pelapor.</p>
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 px-6 py-3.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="w-full sm:flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
          >
            Ya, Tolak
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tabel dan Paginasi ──
function Pagination({ currentPage, totalPages, setCurrentPage }: any) {
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    for (let i = start; i <= end; i++) range.push(i);
    if (start > 1) range.unshift(-1, 1);
    if (end < totalPages) range.push(-2, totalPages);
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 bg-white p-1 rounded-2xl border border-gray-200/60 shadow-sm">
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex flex-wrap items-center gap-1 px-2 border-x border-gray-100">
        {pageNumbers.map((page, i) =>
          page < 0 ? (
            <span key={`e-${i}`} className="px-2 text-gray-300 text-xs font-bold select-none">…</span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[32px] sm:min-w-[36px] h-[32px] sm:h-[36px] rounded-xl text-[11px] sm:text-xs font-bold transition-all ${currentPage === page
                  ? "bg-[#4A6D55] text-white shadow-md shadow-green-900/10"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function ManagePenugasan() {
  const {
    loading,
    submitting,
    setSubmitting,
    trukList,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filterStatus,
    setFilterStatus,
    filteredItems,
    totalPages,
    paginatedItems,
    stats,
    alert,
    showAlert,
    closeAlert,
    fetchData,
    isTruckAvailable,
    getEffectiveStatus,
    getDriverFromTruck,
    getCurrentDateTimeLocal,
  } = usePenugasan();

  // State lokal untuk modal
  const [showTugaskanModal, setShowTugaskanModal] = useState(false);
  const [showDetailLaporan, setShowDetailLaporan] = useState(false);
  const [showDetailPenugasan, setShowDetailPenugasan] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTolakConfirm, setShowTolakConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ reportId: "", truckId: "", driverId: "", scheduledAt: "", location: "" });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [deleteType, setDeleteType] = useState<"penugasan" | "laporan">("penugasan");
  const [deleteName, setDeleteName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [tolakName, setTolakName] = useState("");
  const [tolakReason, setTolakReason] = useState("");
  const [tolakError, setTolakError] = useState("");

  // Reset form
  const resetForm = () => {
    setFormData({ reportId: "", truckId: "", driverId: "", scheduledAt: "", location: "" });
    setFormErrors({});
    setIsEditMode(false);
    setEditingId(null);
  };

  // Validasi form (tanpa pengecekan jam operasional, karena kita handle di submit)
  const validateForm = (isEdit = false) => {
    const errors: { [key: string]: string } = {};
    if (!formData.truckId) {
      errors.truckId = "Armada harus dipilih";
    } else {
      const t = trukList.find((t) => t.id === formData.truckId);
      if (!t || !getDriverFromTruck(t)) errors.truckId = "Armada harus memiliki driver.";
    }
    if (!formData.scheduledAt) {
      errors.scheduledAt = "Jadwal pelaksanaan wajib diisi";
    } else {
      const d = new Date(formData.scheduledAt);
      if (d < new Date()) {
        errors.scheduledAt = "Jadwal tidak boleh kurang dari waktu sekarang";
      } else if (
        formData.truckId &&
        !isTruckAvailable(formData.truckId, formData.scheduledAt, isEdit ? editingId || undefined : undefined)
      ) {
        errors.scheduledAt = "Armada sudah ada penugasan dalam rentang 2 jam.";
      }
    }
    if (!formData.location.trim()) errors.location = "Lokasi penugasan wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler buka modal tugaskan
  const openTugaskan = (item: any, edit = false) => {
    setSelectedItem(item);
    const loc =
      typeof item.location === "string"
        ? item.location
        : item.location?.name || item.location?.address || item.description || "";
    setFormData({
      reportId: item.report?.id || item.id,
      truckId: edit ? item.truck?.id || "" : "",
      driverId: edit ? item.driver?.id || "" : "",
      scheduledAt: edit && item.scheduledAt ? toDateTimeLocalValue(new Date(item.scheduledAt)) : "",
      location: loc,
    });
    setIsEditMode(edit);
    setEditingId(edit ? item.id : null);
    setFormErrors({});
    setShowTugaskanModal(true);
  };

  // Submit penugasan dengan pengecekan jam operasional
  const handleSubmitTugaskan = async (e: any) => {
    e.preventDefault();

    // ═══ CEK JAM OPERASIONAL ═══
    if (formData.scheduledAt) {
      const d = new Date(toISOWithWIBOffset(formData.scheduledAt)!);
      if (!isOperationalHours(d)) {
        showAlert(
          "warning",
          "Di Luar Jam Operasional",
          `Jadwal yang dipilih (${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}) berada di luar jam operasional (${OPERATIONAL_START.toString().padStart(2, '0')}:00 - ${OPERATIONAL_END.toString().padStart(2, '0')}:00 WIB).`,
          "Silakan pilih jam operasional yang tersedia."
        );
        return;
      }
    }

    if (!validateForm(isEditMode)) return;
    setSubmitting(true);
    try {
      const payload = {
        reportId: formData.reportId,
        truckId: formData.truckId,
        driverId: formData.driverId,
        scheduledAt: toISOWithWIBOffset(formData.scheduledAt),
        location: formData.location.trim(),
        district: selectedItem?.district || null,
        description: selectedItem?.description || null,
        notes: "",
      };
      if (isEditMode && editingId) {
        await api.put(`/penugasan/${editingId}`, payload);
        showAlert("success", "Penugasan berhasil diperbarui", "Data penugasan telah diubah.");
      } else {
        await api.post("/penugasan/aduan", payload);
        showAlert("success", "Penugasan berhasil dibuat", "Laporan aduan telah ditugaskan ke armada.");
      }
      setShowTugaskanModal(false);
      resetForm();
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      showAlert(
        "error",
        isEditMode ? "Gagal memperbarui" : "Gagal membuat penugasan",
        "Terjadi kesalahan saat menyimpan.",
        error?.response?.data?.message || "Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus
  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      if (deleteType === "laporan") {
        await api.delete(`/laporan/${deleteId}`);
      } else {
        await api.delete(`/penugasan/${deleteId}`);
      }
      showAlert(
        "success",
        deleteType === "laporan" ? "Laporan Berhasil Dihapus" : "Penugasan Berhasil Dihapus",
        `${deleteType === "laporan" ? "Laporan" : "Penugasan"} "${deleteName}" telah dihapus secara permanen.`
      );
      fetchData();
    } catch (error: any) {
      showAlert(
        "error",
        "Gagal Menghapus",
        `${deleteType === "laporan" ? "Laporan" : "Penugasan"} gagal dihapus.`,
        error?.response?.data?.message || "Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  // Tolak
  const handleTolak = async () => {
    if (!tolakId) return;
    if (!tolakReason.trim()) {
      setTolakError("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/laporan/${tolakId}/tolak`, { rejectionReason: tolakReason.trim() });
      showAlert("success", "Laporan berhasil ditolak", "Status laporan telah diubah menjadi ditolak dan alasan telah dikirim ke pelapor.");
      fetchData();
    } catch (error: any) {
      showAlert("error", "Gagal menolak laporan", "Terjadi kesalahan.", error?.response?.data?.message || "Silakan coba lagi.");
    } finally {
      setSubmitting(false);
      setShowTolakConfirm(false);
      setTolakId(null);
      setTolakName("");
      setTolakReason("");
      setTolakError("");
    }
  };

  // Render item baris (digunakan di tabel dan card)
  const renderRowActions = (item: any) => {
    const effectiveStatus = getEffectiveStatus(item);
    const isLaporanBaru = item.status === "LAPORAN_BARU";
    const isDitolak = item.status === "DITOLAK";

    if (isLaporanBaru) {
      return (
        <>
          <button onClick={() => { setSelectedItem(item); setShowDetailLaporan(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            <Eye size={16} />
          </button>
          <button onClick={() => openTugaskan(item, false)} className="px-4 py-2 rounded-xl bg-[#4A6D55] text-white text-xs font-bold hover:bg-[#3a5643] transition-all shadow-md shadow-green-900/10">
            Tugaskan
          </button>
          <button onClick={() => { setTolakId(item.id); setTolakName(item.location || "Laporan"); setShowTolakConfirm(true); }} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold transition-all">
            Tolak
          </button>
        </>
      );
    }
    if (isDitolak) {
      return (
        <>
          <button onClick={() => { setSelectedItem(item); setShowDetailLaporan(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
            <Eye size={16} />
          </button>
          <button onClick={() => { setDeleteId(item.id); setDeleteName(item.location || "Laporan"); setDeleteType("laporan"); setShowDeleteConfirm(true); }} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 size={16} />
          </button>
        </>
      );
    }
    return (
      <>
        <button onClick={() => { setSelectedItem(item); setShowDetailPenugasan(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
          <Eye size={16} />
        </button>
        {item.status !== "SELESAI" && (
          <button onClick={() => openTugaskan(item, true)} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors">
            <Repeat size={16} />
          </button>
        )}
        {(item.status === "DITUGASKAN" || item.status === "BEKERJA") && (
          <button onClick={() => { setDeleteId(item.id); setDeleteName(item.taskNumber || item.location || "Penugasan"); setDeleteType("penugasan"); setShowDeleteConfirm(true); }} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 text-black">
      {/* Alert Dialog */}
      <AlertDialog
        open={alert.open}
        type={alert.type}
        title={alert.title}
        description={alert.description}
        detailText={alert.detailText}
        onClose={closeAlert}
      />
      <AlertDialog
        open={submitting}
        type="loading"
        title="Mohon Tunggu"
        description="Sedang memproses permintaan Anda ke server..."
        isLoading={true}
        disableBackdropClose={true}
        onClose={() => { }}
      />

      {/* Delete Confirm */}
      <DeleteConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        type={deleteType}
        name={deleteName}
      />

      {/* Tolak Confirm */}
      <TolakConfirmModal
        open={showTolakConfirm}
        onClose={() => setShowTolakConfirm(false)}
        onConfirm={handleTolak}
        name={tolakName}
        reason={tolakReason}
        setReason={setTolakReason}
        error={tolakError}
        setError={setTolakError}
        submitting={submitting}
      />

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#DDE9E1] to-[#E8F1EB] rounded-[24px] p-5 sm:p-6 md:p-8 shadow-sm border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
          <div>
            <span className="bg-white/60 text-[#4A6D55] px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-medium tracking-wider uppercase inline-block mb-2 md:mb-3">
              Operasional & Monitoring
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A2E35] tracking-tight uppercase">Penugasan Aduan</h1>
            <p className="text-sm md:text-base text-[#5B7078] mt-1 md:mt-2 font-medium">Distribusi armada dan monitoring laporan masuk secara real-time.</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: "Total Tugas", value: stats.total, icon: ClipboardList, color: "text-slate-600", bg: "bg-slate-100/80" },
          { label: "Laporan Baru", value: stats.laporan_baru, icon: FileText, color: "text-red-600", bg: "bg-red-50" },
          { label: "Dalam Proses", value: stats.dalam_proses, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Selesai", value: stats.selesai, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Driver Aktif", value: stats.driver_aktif, icon: User, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <StatsCard key={i} {...s} />
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-200/80 p-3 flex flex-col md:flex-row gap-3 items-stretch">
        {/* Bagian Pencarian */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari deskripsi, driver, pelapor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/70 border border-gray-200/60 focus:border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none text-sm transition-all font-medium placeholder:text-gray-400"
          />
        </div>

        {/* Bagian Filter & Tombol Refresh */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-gray-50/70 border border-gray-200/60 focus:border-gray-300 outline-none text-sm focus:ring-2 focus:ring-green-500/20 font-medium text-gray-700 min-w-[140px] sm:min-w-[180px] cursor-pointer transition-all"
          >
            <option value="">Semua Status</option>
            <option value="LAPORAN_BARU">Laporan Baru</option>
            <option value="DITUGASKAN">Ditugaskan</option>
            <option value="BEKERJA">Bekerja</option>
            <option value="SELESAI">Selesai</option>
            <option value="TIDAK_DIKERJAKAN">Tidak Dikerjakan</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
          <button
            onClick={fetchData}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-gray-100/80 text-gray-600 font-bold hover:bg-gray-200 hover:text-gray-800 transition-all flex items-center justify-center gap-2 border border-gray-200/60"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-sm border border-gray-100/80 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Pelapor & Lokasi</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Deskripsi</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Driver & Armada</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Jadwal</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 sm:py-32 text-gray-400"><Loader2 className="animate-spin text-[#4A6D55] mx-auto" size={36} /><span className="block mt-3 text-sm font-medium">Memuat data penugasan...</span></td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 sm:py-32 text-gray-400 font-medium"><ClipboardList size={40} className="mx-auto text-gray-300 mb-2" />Tidak ada data ditemukan.</td></tr>
              ) : (
                paginatedItems.map((item) => {
                  const effectiveStatus = getEffectiveStatus(item);
                  const overdue = effectiveStatus === "TIDAK_DIKERJAKAN";
                  const isLaporanBaru = item.status === "LAPORAN_BARU";
                  const isDitolak = item.status === "DITOLAK";
                  return (
                    <tr key={item.id} className={`transition-colors duration-200 group ${overdue ? "bg-orange-50/30" : "hover:bg-gray-50/50"}`}>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 align-top">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${overdue ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500 group-hover:bg-[#DDE9E1] group-hover:text-[#4A6D55]"}`}>
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{item.pelapor || item.report?.pelapor || "Anonim"}</p>
                            {formatCoordinate(item.latitude) && formatCoordinate(item.longitude) ? (
                              <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1"><MapPin size={12} className="shrink-0 mt-0.5" /><span className="font-mono truncate">{formatCoordinate(item.latitude)}, {formatCoordinate(item.longitude)}</span></p>
                            ) : item.location ? (
                              <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1"><MapPin size={12} className="shrink-0 mt-0.5" /><span className="line-clamp-2 leading-tight">{item.location}</span></p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 align-top">{item.description || item.report?.description ? <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{item.description || item.report?.description}</p> : <span className="text-xs italic text-gray-400">-</span>}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 align-top">
                        {isLaporanBaru || isDitolak ? <span className="text-xs italic text-gray-400 font-medium">{isDitolak ? "Laporan Ditolak" : "Belum Ditugaskan"}</span> : (
                          <div><p className="text-sm font-bold text-gray-800 truncate">{item.driver?.fullName || "Tanpa Driver"}</p><span className="inline-flex items-center gap-1.5 bg-gray-100/80 px-2 py-1 rounded-md text-[10px] font-mono font-bold text-gray-600 mt-1.5 border border-gray-200/50"><Truck size={10} /> {item.truck?.plateNumber || "-"}</span></div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 align-top">
                        {item.scheduledAt ? (
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dijadwalkan</p><p className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Calendar size={12} className={`shrink-0 ${overdue ? "text-orange-500" : "text-gray-400"}`} /><span className={overdue ? "text-orange-600" : ""}>{new Date(item.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>{overdue && <AlertTriangle size={12} className="text-orange-500" />}</p></div>
                        ) : <span className="text-xs italic text-gray-400">-</span>}
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center align-top"><StatusBadge status={effectiveStatus} /></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 align-top"><div className="flex justify-end items-center gap-2 flex-nowrap whitespace-nowrap">{renderRowActions(item)}</div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-400"><Loader2 className="animate-spin text-[#4A6D55]" size={32} /><span className="text-sm font-medium">Memuat data...</span></div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-medium text-sm">Tidak ada data ditemukan.</div>
          ) : (
            paginatedItems.map((item) => {
              const effectiveStatus = getEffectiveStatus(item);
              const overdue = effectiveStatus === "TIDAK_DIKERJAKAN";
              const isLaporanBaru = item.status === "LAPORAN_BARU";
              const isDitolak = item.status === "DITOLAK";
              return (
                <div key={item.id} className={`p-4 sm:p-5 ${overdue ? "bg-orange-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${overdue ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}><User size={16} /></div>
                      <span className="text-sm font-bold text-gray-900 truncate">{item.pelapor || item.report?.pelapor || "Anonim"}</span>
                    </div>
                    <StatusBadge status={effectiveStatus} />
                  </div>
                  {item.location && <p className="text-[11px] text-gray-500 mb-2 flex items-start gap-1.5 bg-gray-50 p-2 rounded-lg"><MapPin size={12} className="shrink-0 mt-0.5 text-gray-400" /><span className="line-clamp-2">{item.location}</span></p>}
                  {(item.description || item.report?.description) && <p className="text-xs text-gray-600 mb-3 leading-relaxed">{item.description || item.report?.description}</p>}
                  {isDitolak && item.rejectionReason && <div className="bg-red-50 p-2.5 rounded-lg mb-3"><p className="text-[11px] text-red-600 leading-relaxed"><span className="font-bold">Alasan Penolakan: </span>{item.rejectionReason}</p></div>}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-500 mb-4 font-medium">
                    {!isLaporanBaru && !isDitolak && item.driver && <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><User size={12} /> {item.driver.fullName}</span>}
                    {!isLaporanBaru && !isDitolak && item.truck && <span className="flex items-center gap-1 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><Truck size={12} /> {item.truck.plateNumber}</span>}
                    {item.scheduledAt && <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${overdue ? "bg-orange-50 text-orange-600 font-bold" : "bg-gray-50 border border-gray-100"}`}><Calendar size={12} />{new Date(item.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} {overdue && <AlertTriangle size={12} />}</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap w-full">{renderRowActions(item)}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredItems.length > 0 && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> dari <span className="font-bold text-gray-900">{filteredItems.length}</span> data
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
          </div>
        )}
      </div>

      {/* ── Modal Tugaskan ── */}
      <TugaskanModal
        open={showTugaskanModal}
        onClose={() => { setShowTugaskanModal(false); resetForm(); setSelectedItem(null); }}
        isEdit={isEditMode}
        selectedItem={selectedItem}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        trukList={trukList}
        submitting={submitting}
        onSubmit={handleSubmitTugaskan}
        isTruckAvailable={isTruckAvailable}
        getDriverFromTruck={getDriverFromTruck}
        getCurrentDateTimeLocal={getCurrentDateTimeLocal}
      />

      {/* ── Modal Detail Laporan ── */}
      <DetailLaporanModal
        open={showDetailLaporan}
        onClose={() => setShowDetailLaporan(false)}
        laporan={selectedItem}
      />

      {/* ── Modal Detail Penugasan ── */}
      {showDetailPenugasan && selectedItem && (
        <PenugasanDetail
          penugasan={selectedItem}
          onClose={() => { setShowDetailPenugasan(false); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}