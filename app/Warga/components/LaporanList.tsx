"use client";

export default function LaporanList({ laporanList }: { laporanList: any[] }) {
  
  // CEK 1: Pastikan array
  if (!Array.isArray(laporanList)) {
    console.error('LaporanList Error: laporanList bukan array!', laporanList);
    return (
      <div className="grid gap-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2 px-2">Laporan Terkini</h2>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
          <p className="text-red-600 font-semibold">⚠️ Error Memuat Data</p>
          <p className="text-sm text-red-500 mt-2">Silakan muat ulang halaman</p>
        </div>
      </div>
    );
  }

  // CEK 2: Jika kosong
  if (laporanList.length === 0) {
    return (
      <div className="grid gap-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2 px-2">Laporan Terkini</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="py-12">
            <div className="text-6xl mb-4">🗑️</div>
            <p className="text-slate-500 font-medium">Belum Ada Laporan</p>
            <p className="text-sm text-slate-400 mt-2">Jadilah yang pertama melaporkan sampah liar</p>
          </div>
        </div>
      </div>
    );
  }

  // RENDER NORMAL
  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-slate-800">Laporan Terkini</h2>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {laporanList.length} Laporan
        </span>
      </div>
      
      {laporanList.map((item: any) => (
        <div 
          key={item.id} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200"
        >
          <div className="flex justify-between items-start mb-2">
            {/* ✅ Gunakan item.lokasi? Tampaknya tidak ada field lokasi */}
            <p className="font-bold text-lg text-slate-800">
              {item.locationId ? `Lokasi ID: ${item.locationId}` : 'Lokasi tidak tersedia'}
            </p>
            <div className="flex gap-2">
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                item.status === 'SELESAI' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {item.status}
              </span>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500">
                #{item.id.toString().slice(-5)}
              </span>
            </div>
          </div>
          
          {/* ✅ Nama pelapor dari user.fullName */}
          <p className="text-sm text-slate-500 mb-3">
            Oleh: <span className="font-medium text-slate-700">{item.user?.fullName || 'Anonim'}</span>
          </p>
          
          {/* ✅ Foto */}
          {item.photoUrl && (
            <img 
              src={item.photoUrl} 
              className="w-full h-48 object-cover rounded-xl mb-3 border border-slate-100" 
              alt="Foto Sampah" 
            />
          )}
          
          {/* ✅ Deskripsi (field 'description') */}
          <p className="text-slate-600 italic text-sm bg-slate-50 p-3 rounded-lg border-l-4 border-green-300">
            "{item.description || 'Tidak ada deskripsi'}"
          </p>
          
          {/* ✅ Info tambahan: jenis sampah & waktu */}
          <div className="mt-3 text-xs text-slate-400 flex justify-between">
            <span>Jenis: {item.jenisSampah || 'Tidak disebutkan'}</span>
            <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}