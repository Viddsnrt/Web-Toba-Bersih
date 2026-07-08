"use client";

import { useState, useEffect, useMemo } from "react";
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
import AlertDialog, { type AlertType } from "./AlertDialog";

// ============================================================
// INTERFACE & CONSTANTS
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

const formatCoordinate = (coord: any, decimals: number = 5): string | null => {
  if (!coord) return null;
  const num = typeof coord === "string" ? parseFloat(coord) : coord;
  return Number.isFinite(num) ? num.toFixed(decimals) : null;
};

const isOverdue = (item: any): boolean => {
  if (!item.scheduledAt) return false;
  if (item.status === "SELESAI" || item.status === "BEKERJA" || item.status === "LAPORAN_BARU") return false;
  return Date.now() > new Date(item.scheduledAt).getTime();
};

// ============================================================
// TYPES
// ============================================================
interface Penugasan {
  id: string;
  taskNumber?: string;
  status: string;
  location: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  scheduledAt?: string;
  createdAt?: string;
  description?: string;
  notes?: string;
  pelapor?: string;
  rejectionReason?: string | null;
  report?: {
    id: string;
    description?: string;
    jenisSampah?: string;
    pelapor?: string;
    latitude?: number;
    longitude?: number;
  };
  driver?: { id: string; fullName: string };
  truck?: { id: string; plateNumber: string };
  user?: {
    id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
  photoUrl?: string | null;
  locationDetail?: {
    name?: string;
    address?: string;
  };
}

interface Item extends Penugasan {
  isLaporanBaru?: boolean;
}

interface Truk {
  id: string;
  plateNumber: string;
  unitCode?: string | null;
  brand?: string | null;
  truckType?: string | null;
  operatorId?: string | null;
  operator?: { id: string; fullName: string; email?: string; phoneNumber?: string | null } | null;
  driver?: { id: string; fullName: string } | null;
  status: string;
}

interface AlertConfig {
  open: boolean;
  type: AlertType;
  title: string;
  description: string;
  detailText?: string;
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function ManagePenugasan() {
  // ── State ──
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemList, setItemList] = useState<Item[]>([]);
  const [trukList, setTrukList] = useState<Truk[]>([]);
  const [filter, setFilter] = useState({ status: "" });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reportId: "",
    truckId: "",
    driverId: "",
    scheduledAt: "",
    location: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Modal detail laporan
  const [showLaporanDetail, setShowLaporanDetail] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Item | null>(null);

  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    open: false,
    type: "info",
    title: "",
    description: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [pendingDeleteType, setPendingDeleteType] = useState<"penugasan" | "laporan">("penugasan");

  const [showTolakConfirm, setShowTolakConfirm] = useState(false);
  const [pendingTolakId, setPendingTolakId] = useState<string | null>(null);
  const [pendingTolakName, setPendingTolakName] = useState<string>("");
  const [tolakReason, setTolakReason] = useState("");
  const [tolakReasonError, setTolakReasonError] = useState("");

  // ── Helper ──
  const showAlert = (type: AlertType, title: string, description: string, detailText?: string) => {
    setAlertConfig({ open: true, type, title, description, detailText });
  };
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, open: false }));
  const getErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

  const toDateTimeLocalValue = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return toDateTimeLocalValue(now);
  };

  const getDriverFromTruck = (truk: Truk) => {
    if (truk.operator) return { id: truk.operator.id, fullName: truk.operator.fullName };
    if (truk.driver) return { id: truk.driver.id, fullName: truk.driver.fullName };
    return null;
  };
  const getDriverName = (truk: Truk) => getDriverFromTruck(truk)?.fullName ?? "Belum Ada Driver";
  const getDriverId = (truk: Truk) => getDriverFromTruck(truk)?.id ?? "";

  // ── Fetch Data ──
  const fetchData = async () => {
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
        getErrorMessage(error, "Terjadi kesalahan pada server.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  // ── Filter & Pagination ──
  const getEffectiveStatus = (item: Item): string => {
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
      const matchStatus = filter.status ? effectiveStatus === filter.status : true;
      return matchSearch && matchStatus;
    });
  }, [itemList, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

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

  // ── Form Handling ──
  const resetForm = () => {
    setFormData({ reportId: "", truckId: "", driverId: "", scheduledAt: "", location: "" });
    setFormErrors({});
    setIsEditMode(false);
    setEditingId(null);
  };

  const isTruckAvailable = (truckId: string, scheduledAt: string, excludeId?: string): boolean => {
    const sel = new Date(scheduledAt).getTime();
    return !itemList
      .filter((i) => i.status !== "LAPORAN_BARU" && i.truck?.id === truckId && i.scheduledAt && i.id !== excludeId)
      .some((i) => Math.abs(sel - new Date(i.scheduledAt!).getTime()) < 2 * 60 * 60 * 1000);
  };

  const validateForm = (isEdit = false) => {
    const errors: { [key: string]: string } = {};
    if (!formData.truckId) {
      errors.truckId = "Armada harus dipilih";
    } else {
      const t = trukList.find((t) => t.id === formData.truckId);
      if (!t || !getDriverId(t)) errors.truckId = "Armada harus memiliki driver.";
    }
    if (!formData.scheduledAt) {
      errors.scheduledAt = "Jadwal pelaksanaan wajib diisi";
    } else {
      const d = new Date(formData.scheduledAt);
      if (d < new Date()) errors.scheduledAt = "Jadwal tidak boleh kurang dari waktu sekarang";
      else if (
        formData.truckId &&
        !isTruckAvailable(formData.truckId, formData.scheduledAt, isEdit ? editingId || undefined : undefined)
      )
        errors.scheduledAt = "Armada sudah ada penugasan dalam rentang 2 jam.";
    }
    if (!formData.location.trim()) errors.location = "Lokasi penugasan wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openTugaskanModal = (item: Item) => {
    setSelectedItem(item);
    const loc =
      typeof item.location === "string"
        ? item.location
        : (item.location as any)?.name || (item.location as any)?.address || item.description || "";
    setFormData({ reportId: item.report?.id || item.id, truckId: "", driverId: "", scheduledAt: "", location: loc });
    setIsEditMode(false);
    setEditingId(null);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      reportId: item.report?.id || item.id,
      truckId: item.truck?.id || "",
      driverId: item.driver?.id || "",
      scheduledAt: item.scheduledAt ? toDateTimeLocalValue(new Date(item.scheduledAt)) : "",
      location: item.location || "",
    });
    setIsEditMode(true);
    setEditingId(item.id);
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm(isEditMode)) return;
    setSubmitting(true);
    try {
      const payload = {
        reportId: formData.reportId,
        truckId: formData.truckId,
        driverId: formData.driverId,
        scheduledAt: formData.scheduledAt,
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
      setShowModal(false);
      resetForm();
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      showAlert(
        "error",
        isEditMode ? "Gagal memperbarui" : "Gagal membuat penugasan",
        "Terjadi kesalahan saat menyimpan.",
        getErrorMessage(error, "Silakan coba lagi.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete & Tolak ──
  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    const namaTerhapus = pendingDeleteName;
    const tipeTerhapus = pendingDeleteType;
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
    setPendingDeleteType("penugasan");
    setSubmitting(true);
    try {
      if (tipeTerhapus === "laporan") {
        await api.delete(`/laporan/${idToDelete}`);
      } else {
        await api.delete(`/penugasan/${idToDelete}`);
      }
      setSubmitting(false);
      showAlert(
        "success",
        tipeTerhapus === "laporan" ? "Laporan Berhasil Dihapus" : "Penugasan Berhasil Dihapus",
        tipeTerhapus === "laporan"
          ? `Laporan "${namaTerhapus}" telah dihapus secara permanen dari sistem.`
          : `Penugasan "${namaTerhapus}" telah dihapus secara permanen dari sistem.`
      );
      fetchData();
    } catch (error: any) {
      setSubmitting(false);
      showAlert(
        "error",
        "Gagal Menghapus",
        tipeTerhapus === "laporan" ? "Laporan gagal dihapus." : "Penugasan gagal dihapus.",
        getErrorMessage(error, "Silakan coba lagi.")
      );
    }
  };

  const handleTolak = async () => {
    if (!pendingTolakId) return;
    if (!tolakReason.trim()) {
      setTolakReasonError("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/laporan/${pendingTolakId}/tolak`, {
        rejectionReason: tolakReason.trim(),
      });
      showAlert(
        "success",
        "Laporan berhasil ditolak",
        "Status laporan telah diubah menjadi ditolak dan alasan telah dikirim ke pelapor."
      );
      fetchData();
    } catch (error: any) {
      showAlert(
        "error",
        "Gagal menolak laporan",
        "Terjadi kesalahan.",
        getErrorMessage(error, "Silakan coba lagi.")
      );
    } finally {
      setSubmitting(false);
      setShowTolakConfirm(false);
      setPendingTolakId(null);
      setPendingTolakName("");
      setTolakReason("");
      setTolakReasonError("");
    }
  };

  // ── Open Laporan Detail ──
  const openLaporanDetail = (item: Item) => {
    setSelectedLaporan(item);
    setShowLaporanDetail(true);
  };

  // ── Stats ──
  const stats = {
    total: itemList.length,
    laporan_baru: itemList.filter((i) => i.status === "LAPORAN_BARU").length,
    dalam_proses: itemList.filter((i) => i.status === "DITUGASKAN" || i.status === "BEKERJA").length,
    selesai: itemList.filter((i) => i.status === "SELESAI").length,
    driver_aktif: new Set(itemList.filter((i) => i.status !== "LAPORAN_BARU").map((i) => i.driver?.id)).size,
  };

  // ── Status Badge ──
  const StatusBadge = ({ status }: { status: string }) => {
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
  };

  const selectedTruck = trukList.find((t) => t.id === formData.truckId);
  const selectedDriverName = selectedTruck ? getDriverName(selectedTruck) : "";
  const hasDriver = selectedTruck ? !!getDriverId(selectedTruck) : false;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // Container utama dengan background full layar
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-green-50/30 py-6 md:py-10 px-4 md:px-8">
      {/* Inner container dengan max-width dan center */}
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 text-black">
        {/* ── Alerts ── */}
        <AlertDialog
          open={alertConfig.open}
          type={alertConfig.type}
          title={alertConfig.title}
          description={alertConfig.description}
          detailText={alertConfig.detailText}
          onClose={closeAlert}
        />
        <AlertDialog
          open={submitting}
          type="loading"
          title="Mohon Tunggu"
          description="Sedang memproses permintaan Anda ke server..."
          isLoading={true}
          disableBackdropClose={true}
          onClose={() => {}}
        />
        <AlertDialog
          open={showDeleteConfirm}
          type="delete"
          title={pendingDeleteType === "laporan" ? "Hapus Laporan?" : "Hapus Penugasan?"}
          description={
            pendingDeleteName
              ? `${pendingDeleteType === "laporan" ? "Laporan" : "Penugasan"} "${pendingDeleteName}" akan dihapus secara permanen dari sistem.`
              : "Data akan dihapus secara permanen dari sistem."
          }
          buttonText="Hapus"
          showCancelButton={true}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteConfirm(false);
            setPendingDeleteId(null);
            setPendingDeleteName("");
            setPendingDeleteType("penugasan");
          }}
        />

        {/* ── Tolak Confirm Modal ── */}
        <AnimatePresence>
          {showTolakConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900">Tolak Laporan?</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pendingTolakName ? `Laporan "${pendingTolakName}" akan ditolak.` : "Laporan akan ditolak dan statusnya diubah."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTolakConfirm(false);
                      setPendingTolakId(null);
                      setPendingTolakName("");
                      setTolakReason("");
                      setTolakReasonError("");
                    }}
                    className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1 mb-1">
                      Alasan Penolakan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={tolakReason}
                      onChange={(e) => {
                        setTolakReason(e.target.value);
                        if (tolakReasonError) setTolakReasonError("");
                      }}
                      placeholder="Contoh: Foto laporan tidak jelas, lokasi sudah ditangani sebelumnya, dll."
                      className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-2 focus:ring-red-500/20 transition-all resize-none ${
                        tolakReasonError ? "border-red-400" : "border-gray-200 focus:border-red-500"
                      }`}
                    />
                    {tolakReasonError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5 ml-1">
                        <AlertCircle size={14} /> {tolakReasonError}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2 ml-1">Alasan ini akan dikirim langsung ke email pelapor.</p>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTolakConfirm(false);
                      setPendingTolakId(null);
                      setPendingTolakName("");
                      setTolakReason("");
                      setTolakReasonError("");
                    }}
                    className="flex-1 px-6 py-3.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleTolak}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    Ya, Tolak
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Modal Detail Laporan ── */}
        <AnimatePresence>
          {showLaporanDetail && selectedLaporan && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLaporanDetail(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden z-10 flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <FileText size={20} className="text-emerald-700" />
                    </div>
                    <h3 className="font-black text-gray-900 text-lg">Detail Laporan</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1.5 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Laporan Baru
                    </span>
                    <button
                      onClick={() => setShowLaporanDetail(false)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-6">
                  {/* Foto */}
                  {selectedLaporan.photoUrl ? (
                    <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm relative group">
                      <img
                        src={selectedLaporan.photoUrl}
                        alt="Foto laporan"
                        className="w-full h-auto max-h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Tidak ada foto dilampirkan</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5">
                    {/* Pelapor */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                        <User size={14} /> Informasi Pelapor
                      </p>
                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <p className="font-bold text-gray-900 text-base">
                          {selectedLaporan.user?.fullName || selectedLaporan.pelapor || "Anonim"}
                        </p>
                        <div className="flex flex-col gap-1 mt-2">
                          {selectedLaporan.user?.email && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Mail size={14} className="text-gray-400" /> {selectedLaporan.user.email}
                            </p>
                          )}
                          {selectedLaporan.user?.phoneNumber && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" /> {selectedLaporan.user.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alamat / Lokasi */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                        <MapPin size={14} /> Detail Lokasi
                      </p>
                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                          {selectedLaporan.locationDetail?.name ||
                            selectedLaporan.location ||
                            "Lokasi tidak tersedia"}
                        </p>
                        {selectedLaporan.latitude && selectedLaporan.longitude && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                             <MapPin size={12} className="text-blue-500" />
                            <p className="text-xs text-gray-500 font-mono">
                              {formatCoordinate(selectedLaporan.latitude)}, {formatCoordinate(selectedLaporan.longitude)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                        <FileText size={14} /> Deskripsi Laporan
                      </p>
                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedLaporan.description || selectedLaporan.report?.description || "Tidak ada deskripsi"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Jenis Sampah */}
                      {selectedLaporan.report?.jenisSampah && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                            <AlertCircle size={14} /> Jenis Sampah
                          </p>
                          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 h-full flex items-center">
                            <p className="text-sm font-bold text-emerald-800">{selectedLaporan.report.jenisSampah}</p>
                          </div>
                        </div>
                      )}

                      {/* Tanggal Laporan */}
                      {selectedLaporan.createdAt && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 ml-1">
                            <Calendar size={14} /> Waktu Laporan
                          </p>
                          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 h-full flex items-center">
                            <p className="text-sm text-gray-700 font-medium">
                              {new Date(selectedLaporan.createdAt).toLocaleString("id-ID", {
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

                {/* Footer Aksi */}
                <div className="px-6 py-5 border-t border-gray-100 bg-white flex flex-wrap sm:flex-nowrap gap-3">
                  <button
                    onClick={() => setShowLaporanDetail(false)}
                    className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all order-3 sm:order-1"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      setShowLaporanDetail(false);
                      setPendingTolakId(selectedLaporan.id);
                      setPendingTolakName(selectedLaporan.location || "Laporan");
                      setShowTolakConfirm(true);
                    }}
                    className="flex-1 py-3.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all order-2"
                  >
                    Tolak Laporan
                  </button>
                  <button
                    onClick={() => {
                      setShowLaporanDetail(false);
                      openTugaskanModal(selectedLaporan);
                    }}
                    className="flex-[1.5] py-3.5 bg-[#4A6D55] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-900/20 hover:bg-[#3a5643] transition-all order-1 sm:order-3"
                  >
                    Tugaskan Armada
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Header Glassmorphism ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-gray-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <span className="bg-green-50/80 text-[#4A6D55] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase inline-block mb-4 border border-green-100">
                Operasional & Monitoring
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Penugasan Aduan
              </h1>
              <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">
                Distribusi armada dan monitoring laporan masuk secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* ── Bento Grid Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {[
            { label: "Total Tugas", value: stats.total, icon: ClipboardList, color: "text-slate-600", bg: "bg-slate-100/80" },
            { label: "Laporan Baru", value: stats.laporan_baru, icon: FileText, color: "text-red-600", bg: "bg-red-50" },
            { label: "Dalam Proses", value: stats.dalam_proses, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Selesai", value: stats.selesai, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Driver Aktif", value: stats.driver_aktif, icon: User, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-lg p-5 rounded-[24px] border border-gray-100/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                  <s.icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 mb-1">{s.value}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-gray-100/50 p-2 flex flex-col md:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari deskripsi, driver, pelapor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 border border-transparent focus:border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 outline-none text-sm transition-all font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              onChange={(e) => setFilter({ status: e.target.value })}
              className="px-5 py-3.5 rounded-2xl bg-gray-50/50 hover:bg-gray-50 border border-transparent focus:border-gray-200 outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-medium text-gray-700 min-w-[180px] cursor-pointer transition-all"
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
              className="px-5 py-3.5 rounded-2xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-200 hover:text-gray-700 transition-all flex items-center justify-center gap-2"
              title="Muat Ulang"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* ── Table Container ── */}
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
                  <th className="px-6 py-5">Pelapor & Lokasi</th>
                  <th className="px-6 py-5">Deskripsi</th>
                  <th className="px-6 py-5">Driver & Armada</th>
                  <th className="px-6 py-5">Jadwal</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-32 text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-[#4A6D55]" size={36} />
                        <span className="text-sm font-medium">Memuat data penugasan...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-32 text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ClipboardList size={40} className="text-gray-300 mb-2" />
                        Tidak ada data ditemukan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const effectiveStatus = getEffectiveStatus(item);
                    const overdue = effectiveStatus === "TIDAK_DIKERJAKAN";
                    const isLaporanBaru = item.status === "LAPORAN_BARU";
                    const isDitolak = item.status === "DITOLAK";
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors duration-200 group ${overdue ? "bg-orange-50/30" : "hover:bg-gray-50/50"}`}
                      >
                        {/* ── Pelapor ── */}
                        <td className="px-6 py-5 align-top">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                overdue
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-[#DDE9E1] group-hover:text-[#4A6D55]"
                              }`}
                            >
                              <User size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {item.pelapor || item.report?.pelapor || "Anonim"}
                              </p>
                              {formatCoordinate(item.latitude) && formatCoordinate(item.longitude) ? (
                                <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1">
                                  <MapPin size={12} className="shrink-0 mt-0.5" />
                                  <span className="font-mono truncate">
                                    {formatCoordinate(item.latitude)}, {formatCoordinate(item.longitude)}
                                  </span>
                                </p>
                              ) : item.location ? (
                                <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1">
                                  <MapPin size={12} className="shrink-0 mt-0.5" />
                                  <span className="line-clamp-2 leading-tight">{item.location}</span>
                                </p>
                              ) : item.district ? (
                                <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1">
                                  <MapPin size={12} className="shrink-0 mt-0.5" /> {item.district}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* ── Deskripsi ── */}
                        <td className="px-6 py-5 align-top">
                          {item.description || item.report?.description ? (
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                              {item.description || item.report?.description}
                            </p>
                          ) : (
                            <span className="text-xs italic text-gray-400">-</span>
                          )}
                        </td>

                        {/* ── Driver & Armada ── */}
                        <td className="px-6 py-5 align-top">
                          {isLaporanBaru || isDitolak ? (
                            <span className="text-xs italic text-gray-400 font-medium">
                              {isDitolak ? "Laporan Ditolak" : "Belum Ditugaskan"}
                            </span>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-gray-800 truncate">
                                {item.driver?.fullName || "Tanpa Driver"}
                              </p>
                              <span className="inline-flex items-center gap-1.5 bg-gray-100/80 px-2 py-1 rounded-md text-[10px] font-mono font-bold text-gray-600 mt-1.5 border border-gray-200/50">
                                <Truck size={10} /> {item.truck?.plateNumber || "-"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* ── Jadwal ── */}
                        <td className="px-6 py-5 align-top">
                          {item.scheduledAt ? (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Dijadwalkan
                              </p>
                              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Calendar
                                  size={12}
                                  className={`shrink-0 ${overdue ? "text-orange-500" : "text-gray-400"}`}
                                />
                                <span className={overdue ? "text-orange-600" : ""}>
                                  {new Date(item.scheduledAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                {overdue && <AlertTriangle size={12} className="text-orange-500" />}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">-</span>
                          )}
                        </td>

                        {/* ── Status ── */}
                        <td className="px-6 py-5 text-center align-top">
                          <StatusBadge status={effectiveStatus} />
                        </td>

                        {/* ── Aksi ── */}
                        <td className="px-6 py-5 align-top">
                          <div className="flex justify-end items-center gap-2 flex-nowrap whitespace-nowrap">
                            {isLaporanBaru ? (
                              <>
                                <button
                                  onClick={() => openLaporanDetail(item)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors inline-flex border border-transparent hover:border-blue-200"
                                  title="Lihat Detail Laporan"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openTugaskanModal(item)}
                                  className="px-4 py-2 rounded-xl bg-[#4A6D55] text-white text-xs font-bold hover:bg-[#3a5643] transition-all shadow-md shadow-green-900/10"
                                >
                                  Tugaskan
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingTolakId(item.id);
                                    setPendingTolakName(item.location || "Laporan");
                                    setShowTolakConfirm(true);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold transition-all"
                                >
                                  Tolak
                                </button>
                              </>
                            ) : isDitolak ? (
                              <>
                                <button
                                  onClick={() => openLaporanDetail(item)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors inline-flex"
                                  title="Lihat Detail"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingDeleteId(item.id);
                                    setPendingDeleteName(item.location || "Laporan");
                                    setPendingDeleteType("laporan");
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors inline-flex"
                                  title="Hapus Laporan"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors inline-flex"
                                  title="Lihat Detail"
                                >
                                  <Eye size={16} />
                                </button>
                                {item.status !== "SELESAI" && (
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors inline-flex"
                                    title="Edit"
                                  >
                                    <Repeat size={16} />
                                  </button>
                                )}
                                {(item.status === "DITUGASKAN" || item.status === "BEKERJA") && (
                                  <button
                                    onClick={() => {
                                      setPendingDeleteId(item.id);
                                      setPendingDeleteName(item.taskNumber || item.location || "Penugasan");
                                      setPendingDeleteType("penugasan");
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors inline-flex"
                                    title="Hapus"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                <Loader2 className="animate-spin text-[#4A6D55]" size={32} />
                <span className="text-sm font-medium">Memuat data...</span>
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-medium text-sm">Tidak ada data ditemukan.</div>
            ) : (
              paginatedItems.map((item) => {
                const effectiveStatus = getEffectiveStatus(item);
                const overdue = effectiveStatus === "TIDAK_DIKERJAKAN";
                const isLaporanBaru = item.status === "LAPORAN_BARU";
                const isDitolak = item.status === "DITOLAK";
                return (
                  <div key={item.id} className={`p-5 ${overdue ? "bg-orange-50/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            overdue ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <User size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {item.pelapor || item.report?.pelapor || "Anonim"}
                        </span>
                      </div>
                      <StatusBadge status={effectiveStatus} />
                    </div>
                    
                    {item.location && (
                      <p className="text-[11px] text-gray-500 mb-2 flex items-start gap-1.5 bg-gray-50 p-2 rounded-lg">
                        <MapPin size={12} className="shrink-0 mt-0.5 text-gray-400" />
                        <span className="line-clamp-2">{item.location}</span>
                      </p>
                    )}
                    
                    {(item.description || item.report?.description) && (
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        {item.description || item.report?.description}
                      </p>
                    )}
                    
                    {isDitolak && item.rejectionReason && (
                      <div className="bg-red-50 p-2.5 rounded-lg mb-3">
                        <p className="text-[11px] text-red-600 leading-relaxed">
                          <span className="font-bold">Alasan Penolakan: </span>
                          {item.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-500 mb-4 font-medium">
                      {!isLaporanBaru && !isDitolak && item.driver && (
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          <User size={12} /> {item.driver.fullName}
                        </span>
                      )}
                      {!isLaporanBaru && !isDitolak && item.truck && (
                        <span className="flex items-center gap-1 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          <Truck size={12} /> {item.truck.plateNumber}
                        </span>
                      )}
                      {item.scheduledAt && (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${overdue ? "bg-orange-50 text-orange-600 font-bold" : "bg-gray-50 border border-gray-100"}`}>
                          <Calendar size={12} />
                          {new Date(item.scheduledAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {overdue && <AlertTriangle size={12} />}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-nowrap w-full">
                      {isLaporanBaru ? (
                        <>
                          <button
                            onClick={() => openLaporanDetail(item)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 shrink-0"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openTugaskanModal(item)}
                            className="flex-1 py-2.5 rounded-xl bg-[#4A6D55] text-white text-xs font-bold shadow-md shadow-green-900/10 truncate"
                          >
                            Tugaskan
                          </button>
                          <button
                            onClick={() => {
                              setPendingTolakId(item.id);
                              setPendingTolakName(item.location || "Laporan");
                              setShowTolakConfirm(true);
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 truncate"
                          >
                            Tolak
                          </button>
                        </>
                      ) : isDitolak ? (
                        <>
                          <button
                            onClick={() => openLaporanDetail(item)}
                            className="flex-1 p-2.5 flex justify-center items-center gap-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-xs font-bold"
                          >
                            <Eye size={16} /> Detail
                          </button>
                          <button
                            onClick={() => {
                              setPendingDeleteId(item.id);
                              setPendingDeleteName(item.location || "Laporan");
                              setPendingDeleteType("laporan");
                              setShowDeleteConfirm(true);
                            }}
                            className="flex-1 p-2.5 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-xs font-bold"
                          >
                            <Trash2 size={16} /> Hapus
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailModal(true);
                            }}
                            className="flex-1 py-2.5 flex justify-center items-center gap-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-xs font-bold"
                          >
                            <Eye size={14} /> Detail
                          </button>
                          {item.status !== "SELESAI" && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="flex-1 py-2.5 flex justify-center items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 text-xs font-bold"
                            >
                              <Repeat size={14} /> Edit
                            </button>
                          )}
                          {(item.status === "DITUGASKAN" || item.status === "BEKERJA") && (
                            <button
                              onClick={() => {
                                setPendingDeleteId(item.id);
                                setPendingDeleteName(item.taskNumber || item.location || "Penugasan");
                                setPendingDeleteType("penugasan");
                                setShowDeleteConfirm(true);
                              }}
                              className="flex-1 py-2.5 flex justify-center items-center gap-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-xs font-bold"
                            >
                              <Trash2 size={16} /> Hapus
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredItems.length > 0 && (
            <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 font-medium">
                Menampilkan{" "}
                <span className="font-bold text-gray-900">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </span>{" "}
                dari <span className="font-bold text-gray-900">{filteredItems.length}</span> data
              </p>
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200/60 shadow-sm">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center gap-1 px-2 border-x border-gray-100">
                  {pageNumbers.map((page, i) =>
                    page < 0 ? (
                      <span key={`e-${i}`} className="px-2 text-gray-300 text-xs font-bold select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] h-[36px] rounded-xl text-xs font-bold transition-all ${
                          currentPage === page
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
            </div>
          )}
        </div>

        {/* ── Modal Tugaskan / Edit ── */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-none sm:rounded-[32px] shadow-2xl w-full max-w-lg min-h-screen sm:min-h-0 overflow-hidden my-auto border border-gray-100"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="font-extrabold text-lg text-gray-900">{isEditMode ? "Edit Penugasan" : "Buat Penugasan Baru"}</h2>
                    <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-bold">
                      {isEditMode ? "Ubah armada, jadwal, atau lokasi" : "Tentukan armada dan jadwal operasional"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                      setSelectedItem(null);
                    }}
                    className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Armada */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
                      Armada / Truk <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="truckId"
                      value={formData.truckId}
                      onChange={(e) => {
                        const sel = trukList.find((t) => t.id === e.target.value);
                        setFormData({
                          ...formData,
                          truckId: e.target.value,
                          driverId: sel ? getDriverId(sel) : "",
                        });
                        if (formErrors.truckId) setFormErrors({ ...formErrors, truckId: "" });
                      }}
                      className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-bold transition-all text-gray-700 ${
                        formErrors.truckId ? "border-red-400" : "border-gray-200 focus:border-green-500"
                      }`}
                    >
                      <option value="">-- Pilih Armada Operasional --</option>
                      {trukList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.plateNumber}
                          {t.unitCode ? ` (${t.unitCode})` : ""} - {getDriverName(t)}
                          {!getDriverId(t) ? " ⚠️ Tanpa Driver" : ""}
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
                      className={`border rounded-2xl p-5 ${
                        hasDriver ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
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

                  {/* Jadwal */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
                      Jadwal Pelaksanaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleInputChange}
                      min={getCurrentDateTimeLocal()}
                      className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-bold transition-all text-gray-700 ${
                        formErrors.scheduledAt ? "border-red-400" : "border-gray-200 focus:border-green-500"
                      }`}
                    />
                    {formErrors.scheduledAt ? (
                      <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={14} /> {formErrors.scheduledAt}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-400 ml-1 font-medium">
                        * Pastikan jadwal tidak bentrok dalam rentang 2 jam dengan penugasan lain.
                      </p>
                    )}
                  </div>

                  {/* Lokasi */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
                      Lokasi Penugasan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      name="location"
                      rows={3}
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full p-4 bg-gray-50/50 border rounded-2xl outline-none text-sm focus:ring-4 focus:ring-green-500/10 font-medium transition-all text-gray-700 resize-none ${
                        formErrors.location ? "border-red-400" : "border-gray-200 focus:border-green-500"
                      }`}
                      placeholder="Masukkan alamat lengkap lokasi penugasan"
                    />
                    {formErrors.location && (
                      <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1.5 font-medium">
                        <AlertCircle size={14} /> {formErrors.location}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                        setSelectedItem(null);
                      }}
                      className="flex-1 px-6 py-4 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all border border-transparent"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={(!hasDriver && !!formData.truckId) || submitting}
                      className="flex-[2] py-4 bg-[#4A6D55] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 hover:bg-[#3a5643] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                      {isEditMode ? "Simpan Perubahan" : "Konfirmasi Penugasan"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Detail Penugasan Modal ── */}
        {showDetailModal && selectedItem && (
          <PenugasanDetail
            penugasan={selectedItem}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}