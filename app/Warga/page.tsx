
"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import LaporanForm from '@/app/Warga/components/LaporanForm';
import LaporanList from '@/app/Warga/components/LaporanList';
export default function Home() {
  const [form, setForm] = useState({ pelapor: '', lokasi: '', deskripsi: '', latitude: 0, longitude: 0 });
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("Mencari lokasi...");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ambilLokasiOtomatis();
    fetchLaporan();
  }, []);

  const ambilLokasiOtomatis = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          setGpsStatus("✅ Lokasi Anda berhasil dideteksi otomatis");
        },
        (err) => {
          setGpsStatus("⚠️ Gagal akses GPS. Mohon izinkan lokasi.");
        }
      );
    }
  };

  const fetchLaporan = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/laporan');
      setLaporanList(res.data);
    } catch (err) { console.error("Gagal ambil data"); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.latitude === 0) return alert("Harap tunggu lokasi GPS!");
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value.toString()));
    if (selectedImage) formData.append('photo', selectedImage);

    try {
      await axios.post('http://localhost:5000/api/laporan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({ pelapor: '', lokasi: '', deskripsi: '', latitude: 0, longitude: 0 });
      setSelectedImage(null);
      setPreviewUrl(null);
      fetchLaporan();
      alert("✅ Laporan dikirim!");
    } catch (err) {
      alert("❌ Gagal kirim");
    } finally { setLoading(false); }
  };

  return (
    <main className="p-5 md:p-10 bg-[#f8fafc] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-green-700 flex justify-center items-center gap-2">
            <Trash2 size={36} /> CleanCity
          </h1>
          <p className="text-slate-500 mt-2">Laporkan tumpukan sampah liar, wujudkan lingkungan asri.</p>
        </div>

        <LaporanForm 
          form={form} setForm={setForm} loading={loading} gpsStatus={gpsStatus}
          previewUrl={previewUrl} cameraInputRef={cameraInputRef} fileInputRef={fileInputRef}
          handleImageChange={handleImageChange} removeImage={() => setPreviewUrl(null)}
          handleSubmit={handleSubmit}
        />

        <LaporanList laporanList={laporanList} />
      </div>
    </main>
  );
}