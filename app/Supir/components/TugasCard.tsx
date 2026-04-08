import { Navigation, CheckCircle, ImageIcon, MapPin, Calendar, User, Trash2 } from 'lucide-react';

export default function TugasCard({ item, onSelesai }: any) {
  const bukaPeta = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  // Format status dengan warna
  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'DITUGASKAN': { label: 'TUGAS BARU', color: 'bg-orange-100 text-orange-700' },
      'DITERIMA': { label: 'DITERIMA', color: 'bg-blue-100 text-blue-700' },
      'DALAM_PERJALANAN': { label: 'PERJALANAN', color: 'bg-purple-100 text-purple-700' },
      'TIBA': { label: 'TIBA', color: 'bg-yellow-100 text-yellow-700' },
      'BEKERJA': { label: 'BEKERJA', color: 'bg-indigo-100 text-indigo-700' },
      'SELESAI': { label: 'SELESAI', color: 'bg-green-100 text-green-700' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const badge = getStatusBadge(item.status);

  return (
    <div className="bg-white p-5 rounded-[25px] shadow-sm border border-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-black ${badge.color} px-2 py-1 rounded-md uppercase tracking-tighter`}>
          {badge.label}
        </span>
        <p className="text-xs text-slate-400 font-mono">#{item.taskNumber || item.id.toString().slice(-5)}</p>
      </div>

      {/* Lokasi */}
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1">
        <MapPin size={16} className="text-red-500" /> {item.lokasi || item.location}
      </h3>

      {/* Info Pelapor (jika dari aduan) */}
      {item.pelapor && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User size={14} className="text-slate-400" />
          <span>Dilaporkan oleh: <span className="font-semibold">{item.pelapor}</span></span>
        </div>
      )}

      {/* Foto dan Deskripsi */}
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
          {item.fotoLaporan || item.photoUrl ? (
            <img 
              src={item.fotoLaporan || item.photoUrl} 
              className="w-full h-full object-cover" 
              alt="Foto Lokasi" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 text-sm text-slate-600">
          <p className="line-clamp-3 italic">"{item.deskripsi || item.description}"</p>
          {item.jenisSampah && (
            <p className="mt-1 text-xs text-green-600 font-semibold">
              🗑️ {item.jenisSampah}
            </p>
          )}
        </div>
      </div>

      {/* Jadwal */}
      {item.jadwal && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={14} />
          <span>Jadwal: {new Date(item.jadwal).toLocaleString('id-ID')}</span>
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button 
          onClick={() => bukaPeta(
            Number(item.latitude || item.lokasi?.latitude), 
            Number(item.longitude || item.lokasi?.longitude)
          )}
          className="flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-all"
        >
          <Navigation size={18}/> MAPS
        </button>
        <button 
          onClick={onSelesai}
          disabled={item.status === 'SELESAI'}
          className={`flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
            item.status === 'SELESAI' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 shadow-green-100'
          }`}
        >
          <CheckCircle size={18}/> SELESAI
        </button>
      </div>
    </div>
  );
}