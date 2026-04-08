"use client";
import { MapPin, Camera, Image as ImageIcon, X, Send, User, Info } from 'lucide-react';

export default function LaporanForm({ 
  form, setForm, loading, gpsStatus, previewUrl, 
  cameraInputRef, fileInputRef, handleImageChange, removeImage, handleSubmit 
}: any) {
  return (
    <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-12">
      <div className="flex items-center gap-2 mb-6 text-green-600 font-bold text-lg">
        <Send size={20} /> Buat Laporan Baru
      </div>
      
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="relative">
          <User className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            className="w-full border-slate-200 border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" 
            placeholder="Nama Lengkap Anda" 
            value={form.pelapor} 
            onChange={e => setForm({...form, pelapor: e.target.value})} 
            required 
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            className="w-full border-slate-200 border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" 
            placeholder="Lokasi (Patokan atau nama jalan)" 
            value={form.lokasi} 
            onChange={e => setForm({...form, lokasi: e.target.value})} 
            required 
          />
        </div>

        <div className="relative">
          <Info className="absolute left-3 top-3 text-slate-400" size={18} />
          <textarea 
            className="w-full border-slate-200 border p-3 pl-10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-28" 
            placeholder="Deskripsi" 
            value={form.deskripsi} 
            onChange={e => setForm({...form, deskripsi: e.target.value})} 
            required 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-green-700 text-white p-3 rounded-xl font-bold text-sm">
            <Camera size={18} /> Kamera
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-blue-700 text-white p-3 rounded-xl font-bold text-sm">
            <ImageIcon size={18} /> Galeri
          </button>
          <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleImageChange} />
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
        </div>

        {previewUrl && (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-slate-100">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg">
              <X size={20} />
            </button>
          </div>
        )}

        <div className={`text-xs font-semibold flex items-center gap-1 ${form.latitude !== 0 ? 'text-green-600' : 'text-orange-500'}`}>
          <MapPin size={14} /> {gpsStatus}
        </div>

        <button type="submit" disabled={loading} className="bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all flex justify-center items-center gap-2">
          {loading ? "Mengirim..." : <><Send size={20} /> Kirim Laporan</>}
        </button>
      </form>
    </section>
  );
}