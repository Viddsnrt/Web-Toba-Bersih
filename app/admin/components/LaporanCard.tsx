import { Navigation, ImageIcon, Trash2 } from 'lucide-react';

export default function LaporanCard({ item, showDelete, onUpdate, onDelete }: any) {
  const bukaPeta = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="bg-white p-6 rounded-[25px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all">
      <div className="w-full md:w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
        {item.photoUrl ? (
          <img 
            src={item.photoUrl} 
            alt="Sampah" 
            className="w-full h-full object-cover cursor-pointer" 
            onClick={() => window.open(item.photoUrl, '_blank')} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><ImageIcon size={24} /></div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            item.status === 'SELESAI' ? 'bg-green-100 text-green-700' : 
            item.status === 'DITINDAKLANJUTI' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-600'
          }`}>{item.status}</span>
          <p className="text-xs text-slate-400 font-medium">ID: #{item.id.toString().slice(-5)}</p>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">{item.lokasi || "Lokasi Pelaporan"}</h3>
        <p className="text-slate-500 text-sm mb-3">{item.description}</p>
        <button 
          onClick={() => bukaPeta(Number(item.latitude), Number(item.longitude))}
          className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Navigation size={14}/> GOOGLE MAPS
        </button>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {item.status === 'PENDING' && (
          <button onClick={() => onUpdate(item.id, "DITINDAKLANJUTI")} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-blue-700">PROSES</button>
        )}
        {item.status !== 'SELESAI' && (
          <button onClick={() => onUpdate(item.id, "SELESAI")} className="bg-green-600 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-green-700">SELESAI</button>
        )}
        {showDelete && (
          <button onClick={() => onDelete(item.id)} className="bg-red-100 text-red-600 p-3 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
        )}
      </div>
    </div>
  );
}