"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, CheckCircle, Clock,
  AlertCircle, TrendingUp, Calendar,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, AreaChart, Area
} from 'recharts';
import axios from 'axios';

interface DashboardProps {
  laporanList: any[];
  posts: any[];
}

// ✅ Generate fallback chart data (7 hari terakhir) dari data laporan lokal
const generateFallbackChart = (laporanList: any[]) => {
  const map = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  for (const item of laporanList) {
    const raw = item?.createdAt || item?.tanggal;
    if (!raw) continue;
    const key = new Date(raw).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([tanggal, total]) => ({
    hari: new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
    laporan: total,
  }));
};

export default function Dashboard({ laporanList, posts }: DashboardProps) {
  const safeLaporanList = Array.isArray(laporanList) ? laporanList : [];
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const [stats, setStats] = useState({
    totalLaporan: 0,
    laporanSelesai: 0,
    laporanDiproses: 0,
    laporanPending: 0,
    totalTruk: 0,
    trukAktif: 0,
  });
  const [penugasanStats, setPenugasanStats] = useState({ totalAduan: 0, totalRutin: 0 });
  const [grafikData, setGrafikData] = useState<{ hari: string; laporan: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ResizeObserver untuk lebar chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const updateWidth = () => {
      const w = chartContainerRef.current?.getBoundingClientRect().width || 0;
      setChartWidth(Math.max(0, Math.floor(w)));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ Fallback: pakai data lokal dari props
  const applyFallback = useCallback((msg: string) => {
    setStats({
      totalLaporan: safeLaporanList.length,
      laporanSelesai: safeLaporanList.filter(l => l.status === 'SELESAI').length,
      laporanDiproses: safeLaporanList.filter(l => l.status === 'DITINDAKLANJUTI').length,
      laporanPending: safeLaporanList.filter(l => l.status === 'PENDING').length,
      totalTruk: 0,
      trukAktif: 0,
    });
    // ✅ FIX: grafik dari data lokal, bukan random
    setGrafikData(generateFallbackChart(safeLaporanList));
    setError(msg);
  }, [safeLaporanList]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token || token === 'undefined' || token === 'null') {
          applyFallback('Sesi Anda berakhir. Silakan login kembali.');
          return;
        }

        const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const res = await axios.get(`${baseURL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
          validateStatus: () => true,
        });

        if (res.status === 404 || res.status === 403) {
          console.warn(`[Dashboard] ${res.status} - pakai fallback`);
          applyFallback(
            res.status === 403
              ? 'Akses ditolak. Pastikan login sebagai ADMIN.'
              : 'Endpoint dashboard belum tersedia, menampilkan data lokal.'
          );
          return;
        }

        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setStats({
            totalLaporan: d.cards?.totalLaporan || 0,
            laporanSelesai: d.cards?.laporanSelesai || 0,
            laporanDiproses: d.cards?.laporanDiproses || 0,
            laporanPending: d.cards?.laporanPending || 0,
            totalTruk: d.cards?.totalTruk || 0,
            trukAktif: d.cards?.trukAktif || 0,
          });
          setPenugasanStats({
            totalAduan: d.cards?.totalAduan || 0,
            totalRutin: d.cards?.totalRutin || 0,
          });

          // ✅ FIX: grafik dari backend jika ada, fallback jika tidak
          if (Array.isArray(d.grafik) && d.grafik.length > 0) {
            setGrafikData(d.grafik.map((item: any) => ({
              hari: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
              laporan: Number(item.total),
            })));
          } else {
            setGrafikData(generateFallbackChart(safeLaporanList));
          }
        } else {
          applyFallback('Data dashboard tidak tersedia, menampilkan data lokal.');
        }
      } catch (err: any) {
        console.error('[Dashboard] Error:', err);
        applyFallback(
          err.code === 'ECONNABORTED'
            ? 'Server lambat merespons. Menampilkan data lokal.'
            : 'Tidak dapat terhubung ke server.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Kalkulasi dari props (untuk komposisi status & kinerja wilayah)
  const totalLaporan = safeLaporanList.length;
  const laporanSelesai = safeLaporanList.filter(l => l.status === 'SELESAI').length;
  const persentaseSelesai = totalLaporan ? Math.round((laporanSelesai / totalLaporan) * 100) : 0;

  const statusCounts = safeLaporanList.reduce((acc: Record<string, number>, item: any) => {
    const s = item?.status || 'PENDING';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusSummary = [
    { key: 'PENDING', label: 'Pending', color: 'bg-rose-500' },
    { key: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti', color: 'bg-blue-500' },
    { key: 'DIPROSES', label: 'Diproses', color: 'bg-amber-500' },
    { key: 'SELESAI', label: 'Selesai', color: 'bg-emerald-500' },
  ].map(item => {
    const total = statusCounts[item.key] || 0;
    return { ...item, total, percentage: totalLaporan ? Math.round((total / totalLaporan) * 100) : 0 };
  });

  const wilayahRawStats = safeLaporanList.reduce(
    (acc: Record<string, { total: number; selesai: number }>, item: any) => {
      const w = (item?.district || item?.wilayah || 'Tanpa Wilayah').toString().trim().toUpperCase();
      if (!acc[w]) acc[w] = { total: 0, selesai: 0 };
      acc[w].total += 1;
      if (item?.status === 'SELESAI') acc[w].selesai += 1;
      return acc;
    }, {}
  );

  const wilayahColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500'];
  const kinerjaWilayah = Object.entries(wilayahRawStats)
    .map(([nama, d]) => ({
      nama,
      persentase: d.total ? Math.round((d.selesai / d.total) * 100) : 0,
      total: d.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((item, idx) => ({ ...item, color: wilayahColors[idx % wilayahColors.length] }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Memuat Data Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-1 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

      {/* Error banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ringkasan Operasional</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            Unduh Laporan
          </button>
          <button className="px-4 py-2 bg-green-600 rounded-xl text-sm font-semibold text-white shadow-md shadow-green-200 hover:bg-green-700 transition-all active:scale-95">
            Kelola Armada
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Laporan Baru" value={stats.laporanPending} icon={<AlertCircle className="text-blue-600" />} subText="Perlu Respon Segera" trend="+5%" color="blue" />
        <StatCard label="Selesai" value={stats.laporanSelesai} icon={<CheckCircle className="text-emerald-600" />} subText={`${persentaseSelesai}% Efisiensi`} trend="Stable" color="emerald" />
        <StatCard label="Tugas Aduan" value={penugasanStats.totalAduan} icon={<FileText className="text-amber-600" />} subText="Akumulasi Tugas Aduan" trend="ADUAN" color="amber" />
        <StatCard label="Tugas Harian" value={penugasanStats.totalRutin} icon={<Clock className="text-purple-600" />} subText="Akumulasi Tugas Rutin" trend="RUTIN" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 min-w-0 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Analitik Laporan</h3>
              <p className="text-sm text-slate-500">Statistik 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
              <TrendingUp size={14} /> Tren
            </div>
          </div>
          {/* ✅ FIX: render chart hanya jika ada data DAN lebar sudah diketahui */}
          <div ref={chartContainerRef} className="w-full min-w-0" style={{ height: '300px' }}>
            {chartWidth > 0 && grafikData.length > 0 ? (
              <AreaChart width={chartWidth} height={300} data={grafikData}>
                <defs>
                  <linearGradient id="colorLaporan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hari" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="laporan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLaporan)" />
              </AreaChart>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-slate-400 text-sm">
                  {grafikData.length === 0 ? 'Belum ada data laporan untuk ditampilkan' : 'Memuat grafik...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Kinerja Wilayah */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Kinerja Wilayah</h3>
          <div className="space-y-6">
            {kinerjaWilayah.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data wilayah untuk ditampilkan.</p>
            ) : (
              kinerjaWilayah.map((w, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">{w.nama}</span>
                    <span className="text-sm font-extrabold text-slate-900">{w.persentase}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full ${w.color} transition-all duration-[1500ms] ease-out`} style={{ width: `${w.persentase}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-slate-500 font-medium">Total Volume</span>
              <span className="text-slate-900 font-bold">{totalLaporan} Unit</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Wilayah Terdata</span>
              <span className="text-slate-900 font-bold">{Object.keys(wilayahRawStats).length} Wilayah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Komposisi Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Komposisi Status Laporan</h3>
          <p className="text-sm text-slate-500 mb-6">Memudahkan pemantauan antrean dan progres</p>
          <div className="space-y-5">
            {statusSummary.map(item => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900">{item.total} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subText, trend, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>{icon}</div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter">{trend}</span>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 mb-1 leading-none">{value}</p>
        <p className="text-sm font-bold text-slate-800 tracking-tight">{label}</p>
        <p className="text-xs text-slate-400 mt-1 font-medium">{subText}</p>
      </div>
    </div>
  );
}
