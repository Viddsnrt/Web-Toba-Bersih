"use client";
import { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, Leaf, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  credentials: { username: string; password: string };
  setCredentials: (creds: { username: string; password: string }) => void;
  onLogin: (e: React.FormEvent) => void;
  loading?: boolean;
}

export default function LoginForm({ credentials, setCredentials, onLogin, loading = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F0] flex items-center justify-center p-6 font-sans">
      {/* Container Utama - Meniru kode pertama */}
      <div className="bg-white w-full max-w-[880px] flex flex-col md:flex-row rounded-[1.5rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* SISI KIRI: Brand Identity (Sama dengan style DLH) */}
        <div className="w-full md:w-1/2 bg-[#1B4332] flex flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* Efek Dekorasi Background (Opsional) */}
        <div className="relative z-10 flex flex-col items-center">
            {/* Area Logo PNG */}
            <div className="mb-6 flex justify-center">
               <div className="w-50 h-50 md:w-54 md:h-54 ">
                <img 
                  src="/dlh.png" 
                  alt="Logo DLH" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback jika gambar tidak ditemukan
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback Icon jika img error */}
                <Leaf className="text-[#40916C] w-full h-full hidden img-error:block" />
              </div>
            </div>

           <div className="space-y-3">
              <h1 className="text-white text-xl font-black tracking-[0.1em] uppercase leading-none">
                DINAS Lingkungan Hidup
              </h1>
              <h2 className="text-[#74C69D] text-xl font-medium tracking-[0.1em] uppercase">
                Kabupaten Toba
              </h2>
              </div>
          </div>
        </div>


        {/* SISI KANAN: Form Login */}
        <div className="w-full md:w-1/2 p-10 md:p-14 bg-white flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#1B4332] tracking-tight">Login Admin</h3>
            <p className="text-gray-400 text-sm mt-2">Masuk untuk mengelola data sistem</p>
          </div>

          <form onSubmit={onLogin} className="space-y-6">
            {/* Input Email/Username */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Administrator</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1B4332] transition-colors" size={18} />
                <input
                  type="email"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B4332]/10 focus:border-[#1B4332] focus:bg-white outline-none text-sm transition-all"
                  placeholder="admin@dlh.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1B4332] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B4332]/10 focus:border-[#1B4332] focus:bg-white outline-none text-sm transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#1B4332] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#2d5a44] active:scale-[0.98] transition-all shadow-xl shadow-[#1B4332]/20 flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>MASUK DASHBOARD</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Card */}
          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col items-center space-y-4">
            
          </div>
        </div>
      </div>
    </div>
  );
}