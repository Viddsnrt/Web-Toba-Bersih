"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Bell, Settings, Calendar, Search, User } from 'lucide-react';

// Import Komponen
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LaporanCard from './components/LaporanCard';
import LoginForm from './components/LoginForm';
import ManagePosts from './components/ManagePosts';
import ManageGalleries from './components/ManageGalleries';
import ManageSupir from './components/ManageSupir';
import ManageTruk from './components/ManageTruk';
import PetaSampah from './components/PetaSampah';
import ManageWilayah from './components/ManageWilayah';
import ManagePenugasan from './components/ManagePenugasan';
import ManageLaporan from './components/ManageLaporan';

// --- API Instance ---
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminPage() {
  // --- States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [data, setData] = useState({ laporan: [], posts: [], galleries: [] });
  const [loading, setLoading] = useState({ login: false, data: false });

  // --- Helpers ---
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  }, []);

  // --- Data Fetching ---
  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(prev => ({ ...prev, data: true }));
    try {
      const [laporan, posts, galleries] = await Promise.all([
        api.get('/laporan'), api.get('/posts'), api.get('/galleries/albums')
      ]);
      setData({ laporan: laporan.data, posts: posts.data, galleries: galleries.data });
    } catch (err: any) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  }, [isLoggedIn, handleLogout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // --- Auth Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, login: true }));
    try {
      const res = await api.post('/auth/login', {
        email: credentials.username, password: credentials.password
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
      }
    } catch (err) {
      alert("Kredensial salah atau server bermasalah.");
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // --- View Logic ---
  const renderActiveContent = () => {
    if (loading.data) return <div className="flex justify-center p-20 animate-pulse text-gray-400">Memuat data operasional...</div>;

    switch (activeMenu) {
      case 'dashboard': return <Dashboard laporanList={data.laporan} posts={data.posts} galleries={data.galleries} />;
      case 'peta-sampah': return <PetaSampah />;
      
      // 🔥 PERUBAHAN UTAMA: Memisahkan penugasan dengan mengirimkan 'taskType'
      case 'tugas-harian': return <ManagePenugasan taskType="RUTIN" />;
      case 'tugas-aduan': return <ManagePenugasan taskType="ADUAN" />;
      
      case 'daftar': return <ManageLaporan />; 
      case 'data-supir': return <ManageSupir />;
      case 'data-truk': return <ManageTruk />;
      case 'data-wilayah': return <ManageWilayah />;
      case 'berita': return <ManagePosts posts={data.posts} onPostsUpdate={fetchAllData} />;
      case 'galeri': return <ManageGalleries galleries={data.galleries} onGalleriesUpdate={fetchAllData} />;
      default: return <Dashboard laporanList={data.laporan} posts={data.posts} galleries={data.galleries} />;
    }
  };

  if (!isLoggedIn) return <LoginForm credentials={credentials} setCredentials={setCredentials} onLogin={handleLogin} loading={loading.login} />;

  // 🔥 Update array header
  const menuWithOwnHeader = ['daftar', 'data-supir', 'data-truk', 'data-wilayah', 'tugas-harian', 'tugas-aduan'];

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex">
      {/* Sidebar tetap di kiri */}
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onLogout={handleLogout} />

      <main className="flex-1 md:ml-72 transition-all duration-300">
        <header className="p-8">
          <div className="bg-gradient-to-r from-[#DDE9E1] to-[#E8F1EB] rounded-[24px] p-8 shadow-sm border border-white/50 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <span className="bg-white/60 text-[#4A6D55] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase inline-block mb-3">
                Overview Panel
              </span>
              <h1 className="text-3xl font-extrabold text-[#1A2E35] tracking-tight">
                Selamat Datang, Admin!
              </h1>
              <p className="text-[#5B7078] mt-2 font-medium">
                Sistem Manajemen Kebersihan Terintegrasi Kota Medan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white px-5 py-2.5 rounded-2xl flex items-center shadow-sm space-x-3 border border-gray-100">
                <div className="p-1.5 bg-green-50 rounded-lg">
                  <Calendar className="text-green-600 w-4 h-4" />
                </div>
                <span className="font-bold text-[#344854] text-sm">{formattedDate}</span>
              </div>

              <div className="flex items-center bg-white/40 p-1.5 rounded-2xl border border-white/60">
                <button className="p-2.5 text-[#5B7078] hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2.5 text-[#5B7078] hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="hidden lg:block h-12 w-[1.5px] bg-[#C5D7CC]/50 mx-2"></div>

              <div className="flex items-center bg-white pl-4 pr-2 py-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-right mr-3">
                  <p className="text-sm font-bold text-[#1A2E35]">Admin </p>
                  <p className="text-[10px] font-bold text-green-600 uppercase">Supervisor</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#2D4A53] flex items-center justify-center text-white shadow-inner">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="px-8 pb-12">
          <div className={menuWithOwnHeader.includes(activeMenu) ? "" : "bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 min-h-[60vh]"}>
             {!menuWithOwnHeader.includes(activeMenu) && (
               <div className="mb-8 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#1A2E35] capitalize">
                    {activeMenu.replace('-', ' ')}
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Cari data..." 
                      className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-100 w-64"
                    />
                  </div>
               </div>
             )}
             {renderActiveContent()}
          </div>
        </section>
      </main>
    </div>
  );
}