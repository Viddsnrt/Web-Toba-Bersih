"use client";
import { useState, useRef } from "react";
import { Camera, CheckCircle, X, Upload } from "lucide-react";

interface FormSelesaiProps {
  tugas: any;
  onSubmit: (data: { volume: number; photo: File | null }) => void;
  onCancel: () => void;
}

export default function FormSelesai({ tugas, onSubmit, onCancel }: FormSelesaiProps) {
  const [volume, setVolume] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!volume || Number(volume) <= 0) {
      alert("Volume sampah harus diisi dengan benar!");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ 
        volume: Number(volume), 
        photo 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-[30px] shadow-xl border border-slate-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-black text-lg">Selesaikan Tugas</h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Info Tugas */}
      <div className="bg-slate-50 p-4 rounded-2xl mb-6">
        <p className="text-sm font-semibold text-slate-800">{tugas.lokasi || tugas.location}</p>
        <p className="text-xs text-slate-500 mt-1">{tugas.deskripsi || tugas.description}</p>
      </div>

      {/* Input Volume */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Volume Sampah (KG) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full text-3xl font-bold text-center border-2 border-slate-200 rounded-2xl p-4 focus:border-green-500 outline-none"
          placeholder="0.0"
        />
      </div>

      {/* Upload Foto */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Foto Bukti (opsional)
        </label>
        
        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 py-6 rounded-2xl font-bold hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-300"
          >
            <Camera size={24} /> 
            <span>Ambil / Pilih Foto</span>
          </button>
        ) : (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-2xl"
            />
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          ref={fileRef}
          onChange={handlePhotoChange}
        />
        <p className="text-xs text-slate-400 mt-2">
          * Foto akan digunakan sebagai bukti penyelesaian tugas
        </p>
      </div>

      {/* Tombol Aksi */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="py-4 rounded-2xl bg-slate-200 font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !volume}
          className="py-4 rounded-2xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} /> 
              <span>SELESAI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}