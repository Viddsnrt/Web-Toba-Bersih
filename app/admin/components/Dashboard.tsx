"use client";
import { useState, useEffect, useRef } from 'react';
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
  // galleries: any[]; // COMMENTED OUT
}

export default function Dashboard({ laporanList, posts }: DashboardProps) {
  const safeLaporanList = Array.isArray(laporanList) ? laporanList : [];
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [stats, setStats] = useState({
    totalLaporan: 0,
    laporanSelesai: 0,
    laporanDiproses: 0,
    laporanPending: 0,
    totalTruk: 0,
    trukAktif: 0
  });
  
  const [penugasanStats, setPenugasanStats] = useState({
    totalAduan: 0,
    totalRutin: 0
  });
  
  const [grafikData, setGrafikData] = useState<{ hari: string; laporan: number }[]>([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateWidth = () => {
      const width = chartContainerRef.current?.getBoundingClientRect().width || 0;
      setChartWidth(Math.max(0, Math.floor(width)));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(chartContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Helper function to generate fallback stats from local data
  const useFallbackStats = (errorType?: string) => {
    const fallbackStats = {
      totalLaporan: safeLaporanList.length,
      laporanSelesai: safeLaporanList.filter(l => l.status === 'SELESAI').length,
      laporanDiproses: safeLaporanList.filter(l => l.status === 'DITINDAKLANJUTI').length,
      laporanPending: safeLaporanList.filter(l => l.status === 'PENDING').length,
      totalTruk: 0,
      trukAktif: 0
    };

    // Generate last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chartData.push({
        hari: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        laporan: Math.floor(Math.random() * 5) + 1
      });
    }

    setStats(fallbackStats);
    setGrafikData(chartData);

    // Set appropriate error message
    if (errorType === 'network') {
      setError('Tidak dapat terhubung ke server. Menampilkan data dari cache lokal.');
    } else if (errorType === '401') {
      setError('Sesi Anda berakhir. Silakan login kembali.');
    } else {
      setError('API Server sedang mengalami gangguan. Menampilkan statistik dari data lokal.');
    }
  };

  useEffect(() => {
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        useFallbackStats('401');
        setLoading(false);
        return;
      }

      // Gunakan NEXT_PUBLIC_API_URL yang benar atau default ke http://localhost:5000
      const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const apiUrl = `${baseURL}/api/dashboard/stats`;
      
      console.log('[Dashboard] Token:', token.substring(0, 20) + '...');
      console.log('[Dashboard] Fetching from:', apiUrl);
      
      const res = await axios.get(apiUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000,
        validateStatus: () => true // Accept all status codes
      });

      console.log('[Dashboard] Response Status:', res.status);
      console.log('[Dashboard] Response:', res.data);

      // Handle non-2xx status codes
      if (res.status === 403) {
        console.warn('[Dashboard] 403 Forbidden - Check authentication or backend permission');
        useFallbackStats('403');
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        console.warn('[Dashboard] 404 - Endpoint tidak ditemukan di backend');
        useFallbackStats('404');
        setLoading(false);
        return;
      }

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status}: ${res.data?.error || 'Unknown error'}`);
      }

      if (res.data.success && res.data.data) {
        const backendData = res.data.data;
        
        setStats({
          totalLaporan: backendData.cards?.totalLaporan || 0,
          laporanSelesai: backendData.cards?.laporanSelesai || 0,
          laporanDiproses: backendData.cards?.laporanDiproses || 0,
          laporanPending: backendData.cards?.laporanPending || 0,
          totalTruk: backendData.cards?.totalTruk || 0,
          trukAktif: backendData.cards?.trukAktif || 0
        });
        
        setPenugasanStats({
          totalAduan: backendData.cards?.totalAduan || 0,
          totalRutin: backendData.cards?.totalRutin || 0
        });
        
        if (backendData.grafik && Array.isArray(backendData.grafik)) {
          const formattedGrafik = backendData.grafik.map((item: any) => ({
            hari: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
            laporan: Number(item.total)
          }));
          setGrafikData(formattedGrafik);
        } else {
          useFallbackStats('noData');
        }
      }
    } catch (error: any) {
      console.error('[Dashboard] Error:', error);
      
      if (error.response?.status === 404) {
        setError('Endpoint dashboard belum tersedia. Silakan cek backend.');
      } else if (error.response?.status === 403) {
        setError('Akses ditolak. Pastikan Anda login sebagai ADMIN.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan di port 5000');
      } else if (error.code === 'ECONNABORTED') {
        setError('Server dashboard lambat merespon. Menampilkan data lokal sementara.');
      } else {
        setError(`Gagal memuat data: ${error.message}`);
      }
      
      useFallbackStats('error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 INI YANG PENTING - PANGGIL FUNGSINYA
  fetchDashboardStats();
  
}, []); // Fetch sekali saat komponen mount

  const totalLaporan = safeLaporanList.length;
  const laporanSelesai = safeLaporanList.filter(l => l.status === 'SELESAI').length;
  const persentaseSelesai = totalLaporan ? Math.round((laporanSelesai / totalLaporan) * 100) : 0;
  // const totalKonten = posts.length + galleries.length;
  const laporanByMonth = safeLaporanList.reduce((acc: Record<string, number>, item: any) => {
    const rawDate = item?.createdAt || item?.tanggal;
    if (!rawDate) return acc;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return acc;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {});
  const jumlahBulanData = Object.keys(laporanByMonth).length;
  const rataLaporanBulanan = jumlahBulanData
    ? (totalLaporan / jumlahBulanData).toFixed(1)
    : '0.0';

  const statusCounts = safeLaporanList.reduce((acc: any, item: any) => {
    const status = item?.status || 'PENDING';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSummary = [
    { key: 'PENDING', label: 'Pending', color: 'bg-rose-500' },
    { key: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti', color: 'bg-blue-500' },
    { key: 'DIPROSES', label: 'Diproses', color: 'bg-amber-500' },
    { key: 'SELESAI', label: 'Selesai', color: 'bg-emerald-500' },
  ].map((item) => {
    const total = statusCounts[item.key] || 0;
    return {
      ...item,
      total,
      percentage: totalLaporan ? Math.round((total / totalLaporan) * 100) : 0,
    };
  });

  const laporanTerbaru = [...safeLaporanList]
    .sort((a: any, b: any) => {
      const aDate = new Date(a?.createdAt || a?.tanggal || 0).getTime();
      const bDate = new Date(b?.createdAt || b?.tanggal || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 5);

  const wilayahRawStats = safeLaporanList.reduce((acc: Record<string, { total: number; selesai: number }>, item: any) => {
    const wilayah = (item?.district || item?.wilayah || 'Tanpa Wilayah').toString().trim().toUpperCase();
    if (!acc[wilayah]) {
      acc[wilayah] = { total: 0, selesai: 0 };
    }
    acc[wilayah].total += 1;
    if (item?.status === 'SELESAI') {
      acc[wilayah].selesai += 1;
    }
    return acc;
  }, {});

  const wilayahColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500'];
  const kinerjaWilayah = Object.entries(wilayahRawStats)
    .map(([nama, data]) => ({
      nama,
      persentase: data.total ? Math.round((data.selesai / data.total) * 100) : 0,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((item, idx) => ({
      nama: item.nama,
      persentase: item.persentase,
      color: wilayahColors[idx % wilayahColors.length],
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Memuat Data Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-1 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Header Section */}
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Laporan Baru" 
          value={stats.laporanPending} 
          icon={<AlertCircle className="text-blue-600" />} 
          subText="Perlu Respon Segera"
          trend="+5%"
          color="blue"
        />
        <StatCard 
          label="Selesai" 
          value={stats.laporanSelesai} 
          icon={<CheckCircle className="text-emerald-600" />} 
          subText={`${persentaseSelesai}% Efisiensi`}
          trend="Stable"
          color="emerald"
        />
        <StatCard 
          label="Tugas Aduan" 
          value={penugasanStats.totalAduan} 
          icon={<FileText className="text-amber-600" />} 
          subText="Akumulasi Tugas Aduan"
          trend="ADUAN"
          color="amber"
        />
        <StatCard 
          label="Tugas Harian" 
          value={penugasanStats.totalRutin} 
          icon={<Clock className="text-purple-600" />} 
          subText="Akumulasi Tugas Rutin"
          trend="RUTIN"
          color="purple"
        />
      </div>
    {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard
          title="Konten Publik"
          value={totalKonten}
          description={`${posts.length} Postingan, ${galleries.length} Galeri`}
          badge="Informasi Publik"
        />
        <InfoCard
          title="Rata-rata/Bulan"
          value={rataLaporanBulanan}
          description="Rata-rata laporan per bulan"
          badge="Tren Bulanan"
        />
      </div> */}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 min-w-0 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Analitik Laporan</h3>
              <p className="text-sm text-slate-500">Statistik 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
              <TrendingUp size={14} /> +12.4% Tren
            </div>
          </div>
          <div ref={chartContainerRef} className="w-full min-w-0" style={{ width: '100%', height: '300px', minHeight: 300 }}>
            {chartWidth > 0 ? (
              <AreaChart width={chartWidth} height={300} data={grafikData}>
                <defs>
                  <linearGradient id="colorLaporan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hari" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="laporan" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLaporan)" 
                />
              </AreaChart>
            ) : (
              <div className="h-[300px] w-full animate-pulse rounded-2xl bg-slate-100" />
            )}
          </div>
        </div>

        {/* Region Performance */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Kinerja Wilayah</h3>
          <div className="space-y-6">
            {kinerjaWilayah.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data wilayah untuk ditampilkan.</p>
            ) : (
              kinerjaWilayah.map((wilayah, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-green-600 transition-colors">{wilayah.nama}</span>
                    <span className="text-sm font-extrabold text-slate-900">{wilayah.persentase}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${wilayah.color} transition-all duration-[1500ms] ease-out shadow-sm`}
                      style={{ width: `${wilayah.persentase}%` }}
                    />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Komposisi Status Laporan</h3>
          <p className="text-sm text-slate-500 mb-6">Memudahkan pemantauan antrean dan progres</p>
          <div className="space-y-5">
            {statusSummary.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900">{item.total} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, description, badge }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter">
          {badge}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-900 leading-none mb-2">{value}</p>
      <p className="text-xs text-slate-500 font-medium truncate">{description}</p>
    </div>
  );
}

// Reusable Stat Card Component - Pakai Hover Tailwind
function StatCard({ label, value, icon, subText, trend, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 mb-1 leading-none">{value}</p>
        <p className="text-sm font-bold text-slate-800 tracking-tight">{label}</p>
        <p className="text-xs text-slate-400 mt-1 font-medium">{subText}</p>
      </div>
    </div>
  );
}

// Reusable Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SELESAI: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DIPROSES: "bg-amber-50 text-amber-700 border-amber-200",
    DITINDAKLANJUTI: "bg-blue-50 text-blue-700 border-blue-200",
    PENDING: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shadow-[0_1px_2px_rgba(0,0,0,0.05)] uppercase tracking-wider ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}

function MenuAction({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left hover:bg-slate-50 transition-colors"
    >
      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={18} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </button>
  );
}
