"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, Filter, Loader2, Inbox } from 'lucide-react';
import LaporanCard from './LaporanCard'; // Pastikan path import ini benar
import toast, { Toaster } from 'react-hot-toast';

export default function ManageLaporan() {
  const [laporanList, setLaporanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // --- MENGAMBIL DATA DARI NODE.JS ---
  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/laporan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mengambil array dari res.data.data sesuai format backend kita
      setLaporanList(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data laporan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  // --- MENGUBAH STATUS (PROSES / SELESAI) ---
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/laporan/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(`Status berhasil diubah menjadi ${newStatus}`);
      fetchLaporan(); // Refresh data
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  // --- MENGHAPUS LAPORAN ---
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/laporan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Laporan berhasil dihapus');
      fetchLaporan(); // Refresh data
    } catch (error) {
      toast.error('Gagal menghapus laporan');
    }
  };

  // --- FILTER & PENCARIAN ---
  const filteredLaporan = laporanList.filter((item) => {
    const matchSearch = item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.jenisSampah?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Laporan Masuk</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <FileText size={16} /> Pantau dan tindak lanjuti laporan dari masyarakat.
          </p>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari deskripsi atau jenis sampah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none py-2 pr-4 text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="DIPROSES">Diproses</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
      </div>

      {/* LIST LAPORAN */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
          <p className="font-medium">Memuat data laporan...</p>
        </div>
      ) : filteredLaporan.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
          <Inbox size={60} className="text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-500">Tidak ada laporan</p>
          <p className="text-sm">Belum ada data yang sesuai dengan pencarianmu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLaporan.map((laporan) => (
            <LaporanCard
              key={laporan.id}
              item={laporan}
              showDelete={true}
              onUpdate={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}