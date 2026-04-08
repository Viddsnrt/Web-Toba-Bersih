"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Trash2, Camera, Newspaper, Mail, Instagram, Facebook, ArrowRight, ChevronRight, ChevronLeft, MapPin, Phone, Clock, ShieldCheck, Leaf, Users, X, Images } from 'lucide-react';

interface GalleryPhoto {
  id: number;
  imageUrl: string;
  caption?: string;
}

interface Album {
  id: number;
  title: string;
  description?: string;
  coverUrl?: string;
  isSlider?: boolean;
  photos?: GalleryPhoto[];
}

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsRes, albumsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/posts'),
          axios.get('http://localhost:5000/api/galleries/albums'),
        ]);
        setPosts(postsRes.data.slice(0, 3));
        setAlbums(albumsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sliderAlbums = albums.filter(a => a.isSlider && a.coverUrl);

  useEffect(() => {
    if (sliderAlbums.length <= 1) return;
    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % sliderAlbums.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderAlbums.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxPhoto) setLightboxPhoto(null);
        else if (selectedAlbum) setSelectedAlbum(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxPhoto, selectedAlbum]);

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.scrollWidth / albums.length;
      carouselRef.current.scrollBy({
        left: dir === 'left' ? -itemWidth : itemWidth,
        behavior: 'smooth'
      });
    }
  };

  const AlbumCard = ({ album }: { album: Album }) => (
    <div className="group cursor-pointer" onClick={() => setSelectedAlbum(album)}>
      <div className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative">
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=300'; }}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Images size={40} className="text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-4">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white">
            <p className="text-xs font-bold text-green-400 mb-1">{album.photos?.length || 0} foto</p>
            <p className="font-semibold text-sm line-clamp-1">{album.title}</p>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Images size={10} /> {album.photos?.length || 0}
        </div>
      </div>
      <p className="mt-2 text-sm text-center text-gray-600 font-medium line-clamp-1">{album.title}</p>
    </div>
  );

  // ── HALAMAN DETAIL ALBUM ─────────────────────────────────────────
  if (selectedAlbum) {
    const photos = selectedAlbum.photos || [];
    return (
      <div className="min-h-screen bg-gray-50">

        {/* Header sticky */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-semibold text-sm transition-colors"
            >
              <ChevronLeft size={20} /> Kembali ke Galeri
            </button>
            <div className="text-center">
              <h1 className="text-base font-bold text-gray-900">{selectedAlbum.title}</h1>
              <p className="text-xs text-gray-400">{photos.length} foto</p>
            </div>
            <div className="w-32" />
          </div>
        </div>

        {/* Konten foto */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {photos.length === 0 ? (
            <div className="text-center py-20">
              <Images size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Album ini belum memiliki foto</p>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="mt-4 text-green-600 font-semibold text-sm hover:underline"
              >
                Kembali
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">{selectedAlbum.title}</h2>
                {selectedAlbum.description && (
                  <p className="text-gray-500 text-sm mt-1">{selectedAlbum.description}</p>
                )}
              </div>

              {/* Grid foto — foto pertama 2x lebih besar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-100
                      ${index === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}
                    `}
                    onClick={() => setLightboxPhoto(photo.imageUrl)}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Error'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium line-clamp-2">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10">
              <X size={24} />
            </button>
            <img
              src={lightboxPhoto}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ── HALAMAN UTAMA ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white selection:bg-green-100 selection:text-green-900">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
              <img src="/dlh.png" alt="Logo DLH Toba" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <h1 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight">Dinas Lingkungan Hidup</h1>
              <p className="text-[10px] md:text-xs text-green-600 font-bold tracking-widest uppercase">Kabupaten Toba</p>
            </div>
          </div>
          <div className="hidden lg:flex gap-8 font-semibold text-slate-600">
            {['Tentang', 'Berita', 'Galeri', 'Visi', 'Kontak'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="hover:text-green-600 transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-slate-600 hover:text-green-600 font-bold px-4">Login</Link>
            <Link href="/login" className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95">Lapor!</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative min-h-[85vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000" className="w-full h-full object-cover scale-105 animate-slow-zoom" alt="Background Toba" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
              Menjaga Kebersihan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Tanah Toba</span>
            </h1>
            <p className="text-lg md:text-xl font-medium opacity-90 mb-10 leading-relaxed max-w-xl">
              Sinergi pemerintah dan masyarakat dalam mewujudkan lingkungan yang asri, bersih, dan berkelanjutan untuk generasi mendatang.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-2">
                Pelajari Program <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* TENTANG */}
      <section id="tentang" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 right-12 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100">
                <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800" className="rounded-[1.5rem] w-full h-[400px] object-cover" alt="Environmental" />
              </div>
            </div>
            <div>
              <span className="text-green-600 font-bold tracking-[0.2em] text-xs uppercase">Profil Lembaga</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-8">About <span className="text-green-600 underline decoration-green-200 underline-offset-8">DLH Toba</span></h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                DLH Toba berkomitmen memberikan layanan terbaik melalui inovasi pengelolaan lingkungan. Kami mengintegrasikan teknologi modern dengan kearifan lokal untuk menjaga ekosistem Danau Toba.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><MapPin size={24}/></div>
                  <div><h4 className="font-bold text-slate-800">Cakupan Wilayah</h4><p className="text-sm text-slate-500">Seluruh kecamatan di Kabupaten Toba</p></div>
                </div>
                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Clock size={24}/></div>
                  <div><h4 className="font-bold text-slate-800">Pelayanan 24/7</h4><p className="text-sm text-slate-500">Siaga pelaporan gangguan lingkungan</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISI MISI */}
      <section id="visi" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">Arah Strategis Kami</h2>
            <div className="h-1.5 w-24 bg-green-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="group bg-slate-900 p-10 rounded-[2.5rem] text-white hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-500">
              <span className="text-6xl font-black opacity-20 group-hover:opacity-40 transition-opacity italic">Visi</span>
              <p className="text-2xl font-medium leading-relaxed mt-4 italic text-green-50">
                "Mewujudkan Kabupaten Toba yang asri dan berkelanjutan melalui tata kelola lingkungan yang cerdas dan partisipatif."
              </p>
            </div>
            <div className="bg-green-50 p-10 rounded-[2.5rem] border border-green-100">
              <span className="text-xs font-black text-green-600 uppercase tracking-widest">Misi Kami</span>
              <h3 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Langkah Nyata</h3>
              <div className="space-y-4">
                {["Transformasi pengolahan sampah berbasis komunitas", "Restorasi ekosistem hutan dan daerah aliran sungai", "Edukasi digital sadar lingkungan untuk milenial"].map((misi, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                      <ChevronRight size={14} className="text-white" />
                    </div>
                    <p className="text-slate-700 font-medium">{misi}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BERITA */}
      <section id="berita" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-green-600 font-bold tracking-widest text-sm">INFORMASI TERKINI</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">Berita <span className="text-green-600">Terbaru</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-100 animate-pulse">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-6 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.map((post: any) => (
                <div key={post.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="h-48 bg-slate-200 overflow-hidden">
                    <img src={post.imageUrl || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=500"} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{post.category || 'BERITA'}</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-2 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-3 mb-4">{post.content}</p>
                    <Link href={`/berita/${post.slug || post.id}`} className="flex items-center gap-2 text-green-600 font-bold text-sm hover:gap-3 transition-all">
                      Baca Selengkapnya <ArrowRight size={16}/>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-500">Belum ada berita</div>
            )}
          </div>
        </div>
      </section>

      {/* GALERI */}
      <section id="galeri" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-green-600 font-bold tracking-widest text-sm">DOKUMENTASI</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">Galeri <span className="text-green-600">Kegiatan</span></h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Belum ada galeri</div>
          ) : albums.length <= 4 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {albums.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-6 -translate-x-5 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-green-50 transition-colors border border-slate-100"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>

              <div
                ref={carouselRef}
                className="grid grid-flow-col auto-cols-[calc(25%-18px)] gap-6 overflow-x-auto scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {albums.map(album => (
                  <div key={album.id}>
                    <AlbumCard album={album} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-6 translate-x-5 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-green-50 transition-colors border border-slate-100"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SLIDER */}
      {!loading && sliderAlbums.length > 0 && (
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-slate-900">
          {sliderAlbums.map((album, index) => (
            <div key={album.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === sliderIndex ? 'opacity-100' : 'opacity-0'}`}>
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">Dokumentasi Kegiatan</p>
                <h3 className="text-3xl md:text-4xl font-black mb-2">{album.title}</h3>
                {album.description && <p className="text-white/70 text-sm max-w-md">{album.description}</p>}
                <button
                  onClick={() => setSelectedAlbum(album)}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  <Images size={16} /> Lihat Foto ({album.photos?.length || 0})
                </button>
              </div>
            </div>
          ))}
          {sliderAlbums.length > 1 && (
            <div className="absolute bottom-6 right-10 flex gap-2">
              {sliderAlbums.map((_, i) => (
                <button key={i} onClick={() => setSliderIndex(i)} className={`h-2.5 rounded-full transition-all ${i === sliderIndex ? 'bg-green-400 w-6' : 'bg-white/50 w-2.5'}`} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer id="kontak" className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Trash2 className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">DLH Toba</span>
              </div>
              <p className="text-slate-400 text-sm">Dinas Lingkungan Hidup Kabupaten Toba berkomitmen untuk menjaga kelestarian alam dan kebersihan lingkungan.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Tautan Cepat</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#tentang" className="hover:text-green-400">Tentang</Link></li>
                <li><Link href="#berita" className="hover:text-green-400">Berita</Link></li>
                <li><Link href="#galeri" className="hover:text-green-400">Galeri</Link></li>
                <li><Link href="#visi" className="hover:text-green-400">Visi Misi</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Sumber Daya</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/perda" className="hover:text-green-400">Perda Lingkungan</Link></li>
                <li><Link href="/jadwal" className="hover:text-green-400">Jadwal Angkut</Link></li>
                <li><Link href="/laporan" className="hover:text-green-400">Laporan Tahunan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Kontak</h3>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin size={18} className="text-green-500 flex-shrink-0 mt-1" />
                  <span>Jl. Sisingamangaraja No. 12, Balige, Toba 22312</span>
                </li>
                <li className="flex items-center gap-2"><Phone size={18} className="text-green-500" /><span>(0632) 123-4567</span></li>
                <li className="flex items-center gap-2"><Mail size={18} className="text-green-500" /><span>dlh@tobakab.go.id</span></li>
              </ul>
              <div className="flex gap-4 mt-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-green-600 transition"><Facebook size={18} /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-green-600 transition"><Instagram size={18} /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-green-600 transition"><Mail size={18} /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-1 text-center text-slate-200 text-sm">
            <p>© 2024 Dinas Lingkungan Hidup Kabupaten Toba. Seluruh hak cipta dilindungi.</p>
            <p className="mt-2">
              <Link href="/privasi" className="hover:text-green-400 mx-2">Kebijakan Privasi</Link> •
              <Link href="/syarat" className="hover:text-green-400 mx-2">Syarat & Ketentuan</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}