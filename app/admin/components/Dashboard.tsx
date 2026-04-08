"use client";
import { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, Clock, Truck, 
  AlertCircle, MapPin, TrendingUp, 
  Calendar as CalendarIcon, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import axios from 'axios';

interface DashboardProps {
  laporanList: any[];
  posts: any[];
  galleries: any[];
}

export default function Dashboard({ laporanList, posts, galleries }: DashboardProps) {
  const [stats, setStats] = useState({
    totalLaporan: 0,
    laporanSelesai: 0,
    laporanDiproses: 0,
    laporanPending: 0,
    totalTruk: 0,
    trukAktif: 0
  });
  
  const [grafikData, setGrafikData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setStats(res.data.data.cards);
          const formattedGrafik = res.data.data.grafik.map((item: any) => ({
            hari: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
            laporan: Number(item.total)
          }));
          setGrafikData(formattedGrafik);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const totalLaporan = laporanList.length;
  const laporanSelesai = laporanList.filter(l => l.status === 'SELESAI').length;
  const persentaseSelesai = totalLaporan ? Math.round((laporanSelesai / totalLaporan) * 100) : 0;

  const kinerjaWilayah = [
    { nama: 'BALIGE', persentase: 92, color: 'bg-emerald-500' },
    { nama: 'LAGUBOTI', persentase: 78, color: 'bg-blue-500' },
    { nama: 'PORSEA', persentase: 65, color: 'bg-amber-500' },
  ];

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
            <CalendarIcon size={16} /> 
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
          label="Dalam Proses" 
          value={stats.laporanDiproses} 
          icon={<Clock className="text-amber-600" />} 
          subText="Sedang Ditangani"
          trend="-2%"
          color="amber"
        />
        <StatCard 
          label="Armada Aktif" 
          value={`${stats.trukAktif}/${stats.totalTruk}`} 
          icon={<Truck className="text-purple-600" />} 
          subText="Unit Beroperasi"
          trend="Optimal"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Analitik Laporan</h3>
              <p className="text-sm text-slate-500">Statistik 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
              <TrendingUp size={14} /> +12.4% Tren
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grafikData}>
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Performance */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Kinerja Wilayah</h3>
          <div className="space-y-6">
            {kinerjaWilayah.map((wilayah, idx) => (
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
            ))}
          </div>

          <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-slate-500 font-medium">Total Volume</span>
              <span className="text-slate-900 font-bold">{totalLaporan} Unit</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Response Time</span>
              <span className="text-slate-900 font-bold">~45 Menit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Laporan Masuk Terbaru</h3>
          <button className="text-green-600 text-sm font-bold flex items-center gap-1 hover:translate-x-1 transition-transform">
            Lihat Semua <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto px-8 pb-8">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                <th className="pb-4">Jenis Laporan</th>
                <th className="pb-4">Lokasi</th>
                <th className="pb-4">Tanggal</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {laporanList.slice(0, 5).map((laporan: any) => (
                <tr key={laporan.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                        <FileText size={16} />
                      </div>
                      <span className="font-bold text-slate-700">{laporan.jenis_sampah || 'Umum'}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {laporan.lokasi || 'Balige'}
                    </div>
                  </td>
                  <td className="py-4 text-slate-500">
                    {new Date(laporan.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-4">
                    <StatusBadge status={laporan.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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