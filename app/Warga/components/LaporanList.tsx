export default function LaporanList({ laporanList }: { laporanList: any[] }) {
  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2 px-2">Laporan Terkini</h2>
      {laporanList.map((item: any) => (
        <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-hover hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="font-bold text-lg text-slate-800">{item.lokasi}</p>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500">#{item.id.toString().slice(-5)}</span>
          </div>
          <p className="text-sm text-slate-500 mb-3">Oleh: <span className="font-medium text-slate-700">{item.pelapor}</span></p>
          {item.photoUrl && (
            <img src={item.photoUrl} className="w-full h-48 object-cover rounded-xl mb-3 border border-slate-100" alt="Foto Sampah" />
          )}
          <p className="text-slate-600 italic text-sm bg-slate-50 p-3 rounded-lg">"{item.description}"</p>
        </div>
      ))}
    </div>
  );
}