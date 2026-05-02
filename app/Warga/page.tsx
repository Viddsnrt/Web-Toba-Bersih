"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import LaporanForm from '@/app/Warga/components/LaporanForm';
import LaporanList from '@/app/Warga/components/LaporanList';

const api = axios.create({
  headers: {
    'ngrok-skip-browser-warning': 'true', 
  }
});

const BASE_URL_API = 'https://confoundedly-granitic-janetta.ngrok-free.dev'; 

export default function Home() {
  const [form, setForm] = useState({ pelapor: '', lokasi: '', deskripsi: '', latitude: 0, longitude: 0 });
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("Mencari lokasi...");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('2'); // Temporary: hardcode userId
  
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
      // const res = await axios.get('http://localhost:5000/api/laporan');
      // console.log('📦 Response API:', res.data);
           const res = await api.get(`${BASE_URL_API}/api/laporan`);
      console.log('📦 Response API:', res.data);
      
      let dataArray = [];
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        dataArray = res.data.data;
      } else if (Array.isArray(res.data)) {
        dataArray = res.data;
      } else {
        console.warn('Format tidak dikenal:', res.data);
        dataArray = [];
      }
      
      setLaporanList(dataArray);
    } catch (err) { 
      console.error("Gagal ambil data", err);
      setLaporanList([]);
    }
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
    
    // Validasi
    if (form.latitude === 0) {
      return alert("Harap tunggu lokasi GPS!");
    }
    if (!form.deskripsi) {
      return alert("Harap isi deskripsi laporan!");
    }
    
    setLoading(true);

    const formData = new FormData();
    
    // ✅ Kirim sesuai format backend
    formData.append('userId', userId);
    formData.append('latitude', form.latitude.toString());
    formData.append('longitude', form.longitude.toString());
    formData.append('description', form.deskripsi);
    formData.append('jenisSampah', 'CAMPURAN');
    
    // Optional: tambahkan lokasi jika backend mendukung
    if (form.lokasi) {
      formData.append('lokasi', form.lokasi);
    }
    
    if (selectedImage) {
      formData.append('photo', selectedImage);
    }

    // Debug: Log FormData
    console.log('📡 Mengirim data:');
    for (let pair of formData.entries()) {
      console.log(pair[0], ':', pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
    }

    try {
      // const response = await axios.post('http://localhost:5000/api/laporan/create', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
        const response = await api.post(`${BASE_URL_API}/api/laporan/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ Response:', response.data);
      
      // Reset form
      setForm({ pelapor: '', lokasi: '', deskripsi: '', latitude: 0, longitude: 0 });
      setSelectedImage(null);
      setPreviewUrl(null);
      
      // Refresh data
      await fetchLaporan();
      
      alert("✅ Laporan berhasil dikirim!");
    } catch (err: any) {
      console.error("❌ Error:", err);
      console.error("Response data:", err.response?.data);
      
      let errorMessage = "Gagal mengirim laporan";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally { 
      setLoading(false);
    }
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