"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Instagram, Facebook, ArrowRight, ChevronRight,
    MapPin, Phone, Clock, Images, X, Eye, ChevronLeft, Menu, Leaf,
    Users, Target, Award
} from 'lucide-react';

// ==========================================
// 1. INTERFACES & UTILS
// ==========================================
interface GalleryPhoto { id: number; imageUrl: string; caption?: string; }
interface Album { id: number; title: string; description?: string; coverUrl?: string; photos?: GalleryPhoto[]; }
interface EducationPost { id: number; judul?: string; title?: string; deskripsi?: string | null; content?: string | null; mediaUrl?: string; media_url?: string; }
interface Post { id: number; title: string; content: string; imageUrl?: string | null; category?: string; slug?: string; createdAt?: string; date?: string; }

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=500';
const NAV_LINKS = ['Tentang', 'Edukasi', 'Berita', 'Galeri'];

const getEduTitle = (e: EducationPost) => e.judul || e.title || '(Tanpa Judul)';
const getEduDesc = (e: EducationPost) => e.deskripsi || e.content || '';
const getEduMediaUrl = (e: EducationPost) => e.mediaUrl || e.media_url || FALLBACK_IMG;
const isPengumuman = (cat?: string) => ['pengumuman', 'PENGUMUMAN', 'Pengumuman'].includes(cat || '');
const stripHtml = (html?: string) => html?.replace(/<[^>]+>/g, '') ?? '';
const fmtDate = (v?: string) => {
    if (!v) return '';
    try { return new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; }
};
const navHref = (item: string) => ['berita', 'edukasi', 'galeri'].includes(item.toLowerCase()) ? `/${item.toLowerCase()}` : `#${item.toLowerCase()}`;

// ==========================================
// 2. CUSTOM HOOKS
// ==========================================
const useHomeData = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [educations, setEducations] = useState<EducationPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const rawBase = process.env.NEXT_PUBLIC_API_URL || '';
            const BASE = rawBase ? rawBase.replace(/\/$/, '') + '/api' : '/api';

            try {
                const [resEdu, resPosts, resAlbums] = await Promise.all([
                    axios.get(`${BASE}/edukasi`).catch(() => ({ data: [] })),
                    axios.get(`${BASE}/posts`).catch(() => ({ data: [] })),
                    axios.get(`${BASE}/galleries/albums`).catch(() => ({ data: [] }))
                ]);

                setEducations((Array.isArray(resEdu.data) ? resEdu.data : (resEdu.data?.data ?? [])).slice(0, 3));
                setPosts(Array.isArray(resPosts.data) ? resPosts.data : (resPosts.data?.data ?? []));
                setAlbums(resAlbums.data ?? []);
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { posts, albums, educations, loading };
};

// ==========================================
// 3. ANIMATION VARIANTS
// ==========================================
const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

// ==========================================
// 4. SUB-COMPONENTS
// ==========================================
const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 py-3 shadow-md' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo Toba" width={40} height={40} className="transition-transform group-hover:scale-105" unoptimized />
                        <div className="flex flex-col">
                            <h1 className="font-bold text-sm tracking-tight transition-colors text-white">Dinas Lingkungan Hidup</h1>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Kabupaten Toba</p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-2">
                        {NAV_LINKS.map((item) => (
                            <Link key={item} href={navHref(item)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 text-white/90 hover:text-white hover:bg-white/10">
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 text-white hover:bg-white/10">Login</Link>
                        <Link href="/Warga" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500">
                            <Leaf size={16} /> Lapor
                        </Link>
                    </div>

                    <button aria-label="Menu" className="md:hidden p-2 rounded-lg transition-colors text-white bg-white/10 backdrop-blur-sm hover:bg-white/20" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[60] bg-white flex flex-col">
                        <div className="p-6 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <Image src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo" width={40} height={40} unoptimized />
                                <h1 className="font-bold text-emerald-900 text-sm">DLH Toba</h1>
                            </div>
                            <button aria-label="Tutup Menu" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-900" /></button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {NAV_LINKS.map(item => (
                                <Link key={item} href={navHref(item)} onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-700 flex justify-between items-center border-b border-slate-50 pb-4 hover:text-emerald-600 transition-colors">
                                    {item} <ChevronRight size={18} className="text-slate-300" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const HeroSection = () => (
    <header className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <Image src="https://www.chubb.com/content/dam/chubb-sites/chubb/global/images/things/green-forest-trees-1280x528.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg" alt="Background Toba" fill className="object-cover" unoptimized priority />
            <div className="absolute inset-0 bg-slate-900/70" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 w-full flex flex-col items-start justify-start text-left mt-16">
  <motion.div
    initial="hidden"
    animate="visible"
    variants={staggerContainer}
    className="flex flex-col items-start"
  >
    <motion.span
      variants={fadeUp}
      className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-6"
    >
      Pemerintah Kabupaten Toba
    </motion.span>
    <motion.h1
      variants={fadeUp}
      className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.2] tracking-tight"
    >
      Menjaga <span className="text-emerald-400">Kelestarian Lingkungan</span>{" "}
      Toba
    </motion.h1>
    <motion.p
      variants={fadeUp}
      className="text-lg text-slate-200 mb-10 leading-relaxed max-w-2xl"
    >
      Sinergi pemerintah dan masyarakat dalam mewujudkan lingkungan yang asri,
      bersih, dan berkelanjutan untuk generasi mendatang.
    </motion.p>
  </motion.div>
</div>
    </header>
);

const BentoSection = () => (
    <section id="tentang" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold tracking-widest text-xs uppercase mb-2 block">Profil & Landasan</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Toba <span className="text-emerald-600">Mantap</span> 2029</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Visi dan misi pembangunan Kabupaten Toba menuju daerah maju, sejahtera, dan berkelanjutan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Tentang DLH */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 shadow-sm flex flex-col items-start"
            >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 mb-5">
                    <Award size={24} />
                </div>
                <h3 className="text-emerald-900 text-xl font-bold mb-3">Tentang DLH Toba</h3>
                <p className="text-emerald-800 text-sm leading-relaxed flex-1">
                    Dinas Lingkungan Hidup Kabupaten Toba berkomitmen mewujudkan tata kelola lingkungan
                    yang berkelanjutan, melindungi ekosistem Danau Toba, dan meningkatkan kualitas hidup masyarakat.
                </p>
            </motion.div>

            {/* Card 2: Visi */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-start"
            >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 mb-5">
                    <Target size={24} />
                </div>
                <h3 className="text-slate-900 text-xl font-bold mb-3">Visi Utama</h3>
                <p className="text-slate-700 text-base font-semibold leading-relaxed flex-1">
                    "Maju Daerahnya, Sejahtera Rakyatnya dan Berkelanjutan Pembangunannya."
                </p>
            </motion.div>

            {/* Card 3: Misi */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-start"
            >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 mb-5">
                    <MapPin size={24} />
                </div>
                <h3 className="text-slate-900 text-xl font-bold mb-3">Misi Kami</h3>
                <ul className="space-y-2.5 flex-1">
                    {[
                        "SDM berdaya saing & berakhlak",
                        "Infrastruktur terintegrasi & merata",
                        "Ekonomi berbasis potensi daerah",
                        "Tata kelola pemerintah yang bersih (Parhobas)",
                        "Keamanan & ketertiban terjaga",
                        "Pelestarian nilai budaya lokal"
                    ].map((misi, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span>{misi}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>
        </div>
    </section>
);

// ==========================================
// 5. MAIN PAGE
// ==========================================
export default function HomePage() {
    const { posts, albums, educations, loading } = useHomeData();

    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [lightbox, setLightbox] = useState<{ photos: GalleryPhoto[]; index: number; } | null>(null);

    const beritaPosts = posts.filter(p => !isPengumuman(p.category)).slice(0, 3);
    const pengumumanPosts = posts.filter(p => isPengumuman(p.category)).slice(0, 4);

    // Handlers
    const nextPhoto = () => lightbox && setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length });
    const prevPhoto = () => lightbox && setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length });

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") lightbox ? setLightbox(null) : setSelectedAlbum(null);
            if (lightbox) {
                if (e.key === "ArrowRight") nextPhoto();
                if (e.key === "ArrowLeft") prevPhoto();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightbox]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <BentoSection />

            {/* --- BERITA & PENGUMUMAN --- */}
            <section id="berita" className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-emerald-600 font-semibold tracking-widest text-xs uppercase mb-2 block">Pusat Informasi</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Berita & Pengumuman</h2>
                        <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Informasi terkini seputar kegiatan dan kebijakan Dinas Lingkungan Hidup Kabupaten Toba.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Berita */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-xl font-bold text-slate-900">Berita Portal</h3>
                            </div>
                            {loading ? (
                                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
                            ) : beritaPosts.length > 0 ? (
                                <div className="flex flex-col gap-4 flex-1">
                                    {beritaPosts.map((post) => (
                                        <Link href={`/berita/${post.slug || post.id}`} key={post.id} className="group flex flex-col sm:flex-row gap-5 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500">
                                            <div className="w-full sm:w-32 h-48 sm:h-28 shrink-0 rounded-xl overflow-hidden relative bg-slate-100">
                                                <Image src={post.imageUrl || FALLBACK_IMG} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                            </div>
                                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                                <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1 block">{post.category || 'Berita'}</span>
                                                <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-2 leading-tight">{post.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-auto">
                                                    <Clock size={12} /> {fmtDate(post.createdAt || post.date)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link href="/berita" className="mt-4 inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors w-max text-sm px-4">
                                        Lihat Semua Berita <ArrowRight size={14} />
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Belum ada berita.</p>
                            )}
                        </div>

                        {/* Pengumuman */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-xl font-bold text-slate-900">Pengumuman Terbaru</h3>
                            </div>
                            {loading ? (
                                <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
                            ) : pengumumanPosts.length > 0 ? (
                                <div className="flex flex-col gap-3 flex-1">
                                    {pengumumanPosts.map(post => (
                                        <Link href={`/berita/${post.slug || post.id}`} key={post.id} className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors flex gap-4 focus-visible:ring-2 focus-visible:ring-amber-500 items-center">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                <Leaf size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors mb-1 line-clamp-2 leading-tight text-sm">{post.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <Clock size={12} /> {fmtDate(post.createdAt || post.date)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Belum ada pengumuman.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EDUKASI --- */}
            <section id="edukasi" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div>
                            <span className="text-emerald-600 font-semibold tracking-widest text-xs uppercase mb-2 block">Pembelajaran</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Edukasi <span className="text-emerald-600">Lingkungan</span></h2>
                            <p className="text-slate-500 mt-2 max-w-2xl">Materi edukasi untuk meningkatkan kesadaran dan kepedulian terhadap lingkungan.</p>
                        </div>
                        <Link href="/edukasi" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 rounded-lg text-slate-700 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm">
                            Lihat Semua Edukasi <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-[350px] bg-slate-200 animate-pulse rounded-2xl" />)
                        ) : educations.length > 0 ? (
                            educations.map((edu, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    key={edu.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        <Image src={getEduMediaUrl(edu)} alt={getEduTitle(edu)} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                        <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                                            Materi Edukasi
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">{getEduTitle(edu)}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">{stripHtml(getEduDesc(edu))}</p>
                                        <Link href={`/edukasi/${edu.id}`} className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm transition-colors mt-auto hover:text-emerald-700 focus-visible:outline-none">
                                            Baca Selengkapnya <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-slate-500 italic col-span-3 text-center py-12">Belum ada materi edukasi.</p>
                        )}
                    </div>
                    <div className="mt-8 md:hidden text-center">
                        <Link href="/edukasi" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-700 font-semibold w-full sm:w-auto">
                            Lihat Semua Edukasi <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- GALERI --- */}
            <section id="galeri" className="py-24 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div>
                            <span className="text-emerald-600 font-semibold tracking-widest text-xs uppercase mb-2 block">Dokumentasi</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Galeri <span className="text-emerald-600">Kegiatan</span></h2>
                            <p className="text-slate-500 mt-2 max-w-2xl">Dokumentasi kegiatan dan program Dinas Lingkungan Hidup Kabupaten Toba.</p>
                        </div>
                        <Link href="/galeri" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 rounded-lg text-slate-700 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm">
                            Lihat Semua Galeri <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-[350px] bg-slate-100 animate-pulse rounded-2xl" />)
                        ) : albums.slice(0, 3).length > 0 ? (
                            albums.slice(0, 3).map((album, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    key={album.id}
                                    onClick={() => setSelectedAlbum(album)}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Buka album ${album.title}`}
                                >
                                    <div className="aspect-video relative overflow-hidden bg-slate-100">
                                        <Image src={album.coverUrl || FALLBACK_IMG} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Images size={12} /> {album.photos?.length || 0} Foto
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">{album.title}</h3>
                                        {album.description && (
                                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">{album.description}</p>
                                        )}
                                        <div className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm transition-colors mt-auto group-hover:gap-3">
                                            Lihat Album <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-slate-500 italic col-span-3 text-center py-12">Belum ada album galeri.</p>
                        )}
                    </div>

                    <div className="mt-8 md:hidden text-center">
                        <Link href="/galeri" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-700 font-semibold w-full sm:w-auto">
                            Lihat Semua Galeri <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <Image src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo" width={44} height={44} unoptimized />
                                <div>
                                    <h3 className="text-white font-bold text-lg tracking-tight">DLH TOBA</h3>
                                    <p className="text-emerald-500 text-[10px] font-semibold tracking-widest uppercase">Kabupaten Toba</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">Mewujudkan lingkungan hidup yang asri, bersih, dan berkelanjutan untuk masyarakat Toba yang sejahtera.</p>
                            <div className="flex gap-3">
  {[
    { Icon: Facebook, href: 'https://www.facebook.com/share/1DyWuusTwD/?mibextid=wwXIfr' },
    { Icon: Instagram, href: 'https://www.instagram.com/dlh_kab.toba?igsh=aGI5NjhyYW5zOXQ4' },
    { Icon: Mail, href: 'mailto:dlhtoba@gmail.com' }
  ].map(({ Icon, href }, idx) => (
    <a
      key={idx}
      href={href}
      aria-label="Social Link"
      className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <Icon size={18} />
    </a>
  ))}
</div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-6 text-sm tracking-wider">Navigasi Utama</h4>
                            <ul className="space-y-3.5">
                                {NAV_LINKS.map(item => (
                                    <li key={item}><Link href={navHref(item)} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 focus-visible:outline-none"><ChevronRight size={14} className="text-slate-600" /> {item}</Link></li>
                                ))}
                            </ul>
                        </div>

                  
                        <div>
              <h3 className="font-bold text-lg mb-6 relative inline-block">Sumber Daya<span className="absolute -bottom-1.5 left-0 w-8 h-1 bg-green-500 rounded-full" /></h3>
              <ul className="space-y-3">{
                [ 
                  { name: 'Tugas Pokok & Fungsi', path: 'https://dislindup.tobakab.go.id/tugas-pokok-dan-fungsi/' },
                  { name: 'Dokumen RPJMD', path: 'https://dislindup.tobakab.go.id/rpjmd/' },
                  { name: 'Dokumen RENSTRA', path: 'https://dislindup.tobakab.go.id/renstra/' },                
                  { name: 'Struktur Organisasi', path: 'https://dislindup.tobakab.go.id/struktur-organisasi/' }
                ].map(l => <li key={l.name}><Link href={l.path} className="text-slate-400 hover:text-green-400 text-sm flex items-center gap-2 group"><ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />{l.name}</Link></li>)
              }</ul>
            </div>

                        <div>
                            <h4 className="text-white font-semibold mb-6 text-sm tracking-wider">Hubungi Kami</h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-start gap-3"><MapPin size={18} className="text-slate-500 shrink-0 mt-0.5" /> <span className="text-slate-400">Jl. Hutabulu Mejan No. 14, Sibola Hotangsas, Balige, Toba, Sumatera Utara</span></li>
                                <li className="flex items-center gap-3"><Mail size={18} className="text-slate-500 shrink-0" /> <span className="text-slate-400">dlhtoba@gmail.com</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">© 2026 <strong className="text-slate-300">Dinas Lingkungan Hidup Kabupaten Toba</strong>. All rights reserved.</p>
                        <div className="flex gap-6 text-sm font-medium">
                            <Link href="#" className="text-slate-500 hover:text-emerald-400 transition-colors focus-visible:outline-none">Kebijakan Privasi</Link>
                            <Link href="#" className="text-slate-500 hover:text-emerald-400 transition-colors focus-visible:outline-none">Syarat Ketentuan</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- LIGHTBOX & MODALS --- */}
            <AnimatePresence>
                {selectedAlbum && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
                        <div className="sticky top-0 z-[110] bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                            <button onClick={() => setSelectedAlbum(null)} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500">
                                <ChevronLeft size={18} /> Kembali
                            </button>
                            <div className="text-center hidden sm:block">
                                <h2 className="font-bold text-slate-900">{selectedAlbum.title}</h2>
                                <p className="text-xs text-slate-500 font-medium">{selectedAlbum.photos?.length || 0} foto</p>
                            </div>
                            <div className="w-[100px] hidden sm:block" />
                            <div className="sm:hidden">
                                <h2 className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{selectedAlbum.title}</h2>
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-6 py-12">
                            {selectedAlbum.description && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 mb-10 max-w-3xl mx-auto text-center">
                                    <p className="text-slate-600 leading-relaxed text-sm">{selectedAlbum.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {selectedAlbum.photos?.map((photo, idx) => (
                                    <div key={photo.id} onClick={() => setLightbox({ photos: selectedAlbum.photos!, index: idx })} className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer border border-slate-200 bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500" tabIndex={0} role="button">
                                        <Image src={photo.imageUrl} alt={photo.caption || ''} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                            <div className="w-10 h-10 bg-white shadow-sm rounded-full text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Eye size={18} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-4">
                        <button aria-label="Tutup" onClick={() => setLightbox(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white z-10">
                            <X size={20} />
                        </button>
                        {lightbox.photos.length > 1 && (
                            <>
                                <button aria-label="Sebelumnya" onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white z-10"><ChevronLeft size={24} /></button>
                                <button aria-label="Selanjutnya" onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors focus-visible:ring-2 focus-visible:ring-white z-10"><ChevronRight size={24} /></button>
                            </>
                        )}
                        <div className="flex flex-col items-center max-w-5xl w-full">
                            <div className="relative w-full max-h-[80vh] flex justify-center">
                                <img src={lightbox.photos[lightbox.index].imageUrl} className="max-h-[80vh] object-contain rounded-lg" alt={lightbox.photos[lightbox.index].caption || 'Foto Galeri'} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                            </div>
                            <div className="mt-4 text-center text-white">
                                {lightbox.photos[lightbox.index].caption && <p className="text-base font-medium mb-1">{lightbox.photos[lightbox.index].caption}</p>}
                                <p className="text-slate-400 font-semibold text-xs tracking-widest">{lightbox.index + 1} / {lightbox.photos.length}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}