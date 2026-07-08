"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  Mail, Instagram, Facebook,
  ArrowRight, ChevronRight,
  MapPin, Phone, Clock, Images,
  X, Eye, ChevronLeft, Menu, Leaf
} from 'lucide-react';

interface GalleryPhoto { id: number; imageUrl: string; caption?: string; }
interface Album { id: number; title: string; description?: string; coverUrl?: string; isSlider?: boolean; photos?: GalleryPhoto[]; createdAt?: string; }
interface EducationPost {
  id: number;
  judul?: string; title?: string;
  deskripsi?: string | null; content?: string | null;
  media_url?: string; media_type?: string;
  mediaUrl?: string; mediaType?: string;
}
interface Post { id: number; title: string; content: string; imageUrl?: string | null; category?: string; slug?: string; createdAt?: string; date?: string; }

const getEduTitle = (e: EducationPost) => e.judul || e.title || '(Tanpa Judul)';
const getEduDesc = (e: EducationPost) => e.deskripsi || e.content || '';
const getEduMediaUrl = (e: EducationPost) => e.mediaUrl || e.media_url || '';
const getEduMediaType = (e: EducationPost) => (e.mediaType || e.media_type || 'IMAGE').toUpperCase();

const PENGUMUMAN_CATEGORIES = ['pengumuman', 'PENGUMUMAN', 'Pengumuman'];
const isPengumuman = (cat?: string) => PENGUMUMAN_CATEGORIES.includes(cat || '');

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [educations, setEducations] = useState<EducationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    eduStatus: string; eduRaw: string; eduCount: number;
    eduError: string; postsStatus: string; postsCount: number;
  }>({ eduStatus: 'pending', eduRaw: '', eduCount: 0, eduError: '', postsStatus: 'pending', postsCount: 0 });

  const [sliderIndex, setSliderIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: GalleryPhoto[]; index: number; } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const rawBase = process.env.NEXT_PUBLIC_API_URL || '';
    const BASE = rawBase ? rawBase.replace(/\/$/, '') + '/api' : '/api';

    try {
      const res = await axios.get(`${BASE}/edukasi`);
      const raw = res.data;
      const list: EducationPost[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setEducations(list.slice(0, 3));
      setDebugInfo(prev => ({ ...prev, eduStatus: 'ok', eduRaw: JSON.stringify(raw, null, 2), eduCount: list.length, eduError: '' }));
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || String(err);
      setDebugInfo(prev => ({ ...prev, eduStatus: 'error', eduError: `${err?.response?.status || ''} ${msg}`, eduRaw: '' }));
    }

    try {
      const res = await axios.get(`${BASE}/posts`);
      const raw = res.data;
      const list: Post[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setPosts(list);
      setDebugInfo(prev => ({ ...prev, postsStatus: 'ok', postsCount: list.length }));
    } catch (err: any) {
      setDebugInfo(prev => ({ ...prev, postsStatus: 'error' }));
    }

    try {
      const res = await axios.get(`${BASE}/galleries/albums`);
      setAlbums(res.data ?? []);
    } catch (err) { }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const sliderAlbums = albums.filter(a => a.isSlider && a.coverUrl);
  useEffect(() => {
    if (sliderAlbums.length <= 1) return;
    const id = setInterval(() => setSliderIndex(p => (p + 1) % sliderAlbums.length), 4000);
    return () => clearInterval(id);
  }, [sliderAlbums.length]);

  const openAlbum = async (album: Album) => {
    setLoadingDetail(true);
    setSelectedAlbum(album);
    try {
      const rawBase = process.env.NEXT_PUBLIC_API_URL || '';
      const BASE = rawBase ? rawBase.replace(/\/$/, '') + '/api' : '/api';
      const res = await axios.get(`${BASE}/galleries/albums/${album.id}`);
      const raw = res.data;
      setSelectedAlbum(raw?.data ?? raw);
    } catch { }
    setLoadingDetail(false);
  };

  const nextPhoto = () => {
    if (!lightbox) return;
    setLightbox({ photos: lightbox.photos, index: (lightbox.index + 1) % lightbox.photos.length });
  };
  const prevPhoto = () => {
    if (!lightbox) return;
    setLightbox({ photos: lightbox.photos, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length });
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) return setLightbox(null);
        if (selectedAlbum) return setSelectedAlbum(null);
      }
      if (lightbox) {
        if (e.key === "ArrowRight") nextPhoto();
        if (e.key === "ArrowLeft") prevPhoto();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [lightbox, selectedAlbum]);

  const beritaPosts = posts.filter(p => !isPengumuman(p.category)).slice(0, 3);
  const pengumumanPosts = posts.filter(p => isPengumuman(p.category)).slice(0, 4);

  const fmtDate = (v?: string) => {
    if (!v) return '';
    try { return new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; }
  };

  const stripHtml = (html?: string) => html?.replace(/<[^>]+>/g, '') ?? '';

  const NAV_LINKS = ['Tentang', 'Edukasi', 'Berita', 'Galeri'];
  const navHref = (item: string) => {
    const key = item.toLowerCase();
    if (key === 'berita') return '/berita';
    if (key === 'edukasi') return '/edukasi';
    if (key === 'galeri') return '/galeri';
    return `#${key}`;
  };

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=500';

  const DebugPanel = () => (
    <div className="col-span-3 my-4 border-2 border-orange-400 rounded-2xl overflow-hidden text-left font-mono text-xs">
      <div className="bg-orange-500 text-white px-4 py-2 font-bold flex items-center justify-between">
        <span>🔍 DEBUG PANEL</span>
        <button onClick={fetchData} className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold hover:bg-orange-50">↺ Retry</button>
      </div>
      <div className="grid grid-cols-2 divide-x divide-orange-200 bg-orange-50">
        <div className="p-3">
          <p className="font-bold text-orange-800 mb-1">Edukasi API</p>
          <p className={`font-bold ${debugInfo.eduStatus === 'ok' ? 'text-green-600' : debugInfo.eduStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
            Status: {debugInfo.eduStatus}
          </p>
          {debugInfo.eduStatus === 'ok' && <p className="text-green-700">Items: {debugInfo.eduCount}</p>}
          {debugInfo.eduError && <p className="text-red-600 mt-1 break-all">Error: {debugInfo.eduError}</p>}
        </div>
        <div className="p-3">
          <p className="font-bold text-orange-800 mb-1">Posts API</p>
          <p className={`font-bold ${debugInfo.postsStatus === 'ok' ? 'text-green-600' : debugInfo.postsStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
            Status: {debugInfo.postsStatus}
          </p>
          {debugInfo.postsStatus === 'ok' && <p className="text-green-700">Items: {debugInfo.postsCount}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --forest: #0D3D2B;
          --forest-mid: #155235;
          --lime: #4ADE80;
          --lime-dim: #86EFAC;
          --cream: #F8FAF7;
          --warm-white: #FFFFFF;
          --slate-900: #0F172A;
          --slate-700: #334155;
          --slate-500: #64748B;
          --slate-200: #E2E8F0;
          --slate-100: #F1F5F9;
          --amber: #F59E0B;
          --font: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 24px;
          --radius-xl: 32px;
          --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(13,61,43,0.08);
          --shadow-hover: 0 8px 32px rgba(13,61,43,0.15);
          --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        html { scroll-behavior: smooth; }
        body { font-family: var(--font); background: var(--cream); color: var(--slate-900); margin: 0; -webkit-font-smoothing: antialiased; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-up  { animation: fadeUp  0.6s ease both; }
        .animate-fade-in  { animation: fadeIn  0.4s ease both; }
        .animate-scale-in { animation: scaleIn 0.5s ease both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }

        /* ── NAVBAR ── */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 76px;
          display: flex;
          align-items: center;
          transition: background var(--transition), box-shadow var(--transition);
        }
        .navbar.scrolled {
          background: rgba(6, 78, 59, 0.95); /* #064E3B dengan transparansi */
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.08);
        }
        .navbar.top {
          background: transparent;
        }
        /* Warna teks dan ikon saat discroll menjadi putih */
        .navbar.scrolled .nav-logo-text h1 {
          color: white;
        }
        .navbar.scrolled .nav-link {
          color: rgba(255,255,255,0.9);
        }
        .navbar.scrolled .nav-link:hover {
          color: white;
          background: rgba(255,255,255,0.15);
        }
        .navbar.scrolled .btn-ghost {
          color: rgba(255,255,255,0.9);
        }
        .navbar.scrolled .btn-ghost:hover {
          color: white;
          background: rgba(255,255,255,0.15);
        }
        .navbar.scrolled .menu-toggle svg {
          color: white !important;
        }
        /* Tombol Lapor (btn-primary) tetap hijau tua dengan teks putih */
        .navbar.scrolled .btn-primary {
          background: var(--forest);
          color: white;
        }
        .navbar.scrolled .btn-primary:hover {
          background: var(--forest-mid);
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo img {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }
        .nav-logo-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.2;
        }
        .nav-logo-text h1 {
          font-size: 15px;
          font-weight: 800;
          color: var(--forest);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .navbar.top .nav-logo-text h1 {
          color: white;
        }
        .nav-logo-text p {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lime);
          margin: 0;
          margin-top: 1px;
        }
        .nav-links {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 10px;
          color: var(--slate-700);
          text-decoration: none;
          transition: all var(--transition);
          position: relative;
        }
        .navbar.top .nav-link {
          color: rgba(255, 255, 255, 0.9);
        }
        .nav-link:hover {
          color: var(--forest);
          background: var(--slate-100);
        }
        .navbar.top .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
        }
        .nav-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
        }
        .btn-ghost {
          font-size: 14px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 10px;
          color: var(--forest);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition);
        }
        .navbar.top .btn-ghost {
          color: rgba(255, 255, 255, 0.9);
        }
        .btn-ghost:hover {
          color: var(--forest);
          background: var(--slate-100);
        }
        .navbar.top .btn-ghost:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
        }
        .btn-primary {
          font-size: 14px;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: 12px;
          background: var(--forest);
          color: white;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition);
        }
        .btn-primary:hover {
          background: var(--forest-mid);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(13, 61, 43, 0.25);
        }
        .menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background var(--transition);
        }
        .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .navbar.scrolled .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* ── HERO ── */
        .hero {
          position: relative; height: 520px;
          display: flex; align-items: center; overflow: hidden;
          background: var(--forest);
        }
        .hero-bg {
          position: absolute; inset: 0;
          background-image: url('https://tobaria.com/wp-content/uploads/2020/07/shutterstock_602246390-1.jpg');
          background-size: cover; background-position: center;
          opacity: 0.35;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(13,61,43,0.92) 0%, rgba(13,61,43,0.6) 50%, rgba(13,61,43,0.3) 100%);
        }
        .hero-inner {
          position: relative; z-index: 2;
          max-width: 1280px; margin: 0 auto; padding: 100px 32px 48px;
          width: 100%;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--lime); margin-bottom: 24px;
          border: 1px solid rgba(74,222,128,0.3);
          padding: 6px 14px; border-radius: 100px;
          background: rgba(74,222,128,0.08);
        }
        .hero-title {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 800; line-height: 1.08; letter-spacing: -0.03em;
          color: white; margin: 0 0 18px; max-width: 680px;
        }
        .hero-title span { color: var(--lime); }
        .hero-desc {
          font-size: clamp(15px, 1.6vw, 17px);
          color: rgba(255,255,255,0.75); line-height: 1.65;
          max-width: 520px; margin: 0 0 32px;
        }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }
        .hero-stats {
          position: absolute; bottom: 0; left: 0; right: 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: grid; grid-template-columns: repeat(3, 1fr);
        }
        .hero-stat {
          padding: 28px 32px;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .hero-stat:last-child { border-right: none; }
        .hero-stat-num { font-size: 32px; font-weight: 800; color: white; line-height: 1; margin-bottom: 4px; }
        .hero-stat-num span { color: var(--lime); }
        .hero-stat-label { font-size: 13px; color: rgba(255,255,255,0.55); font-weight: 500; }

        /* ── SECTION BASE ── */
        .section { padding: 100px 32px; }
        .section-inner { max-width: 1280px; margin: 0 auto; }
        .section-eyebrow {
          font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--forest); display: inline-flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .section-eyebrow::before {
          content: ''; display: block; width: 20px; height: 2px; background: var(--lime); border-radius: 2px;
        }
        .section-title {
          font-size: clamp(32px, 4vw, 48px); font-weight: 800; line-height: 1.12;
          letter-spacing: -0.02em; color: var(--slate-900); margin: 0 0 20px;
        }
        .section-title em { font-style: normal; color: var(--forest); }
        .section-subtitle {
          font-size: 16px; line-height: 1.7; color: var(--slate-500); max-width: 560px;
        }
        .section-header { margin-bottom: 64px; }
        .section-header.center { text-align: center; }
        .section-header.center .section-eyebrow { justify-content: center; }
        .section-header.center .section-eyebrow::before { display: none; }
        .section-header.center .section-title::after {
          content: ''; display: block; width: 40px; height: 3px;
          background: var(--lime); border-radius: 3px; margin: 16px auto 0;
        }
        .section-header.center .section-subtitle { margin: 0 auto; }

        /* ── VISI MISI ── */
        .visi-misi-section { background: var(--cream); }
        .visi-misi-grid { display: grid; grid-template-columns: 380px 1fr; gap: 60px; align-items: start; }
        .kadis-card {
          border-radius: var(--radius-xl); overflow: hidden;
          box-shadow: var(--shadow-card); border: 1px solid var(--slate-200);
          background: white; position: sticky; top: 100px;
        }
        .kadis-img { width: 100%; height: 460px; object-fit: cover; display: block; }
        .kadis-info { padding: 28px 32px; text-align: center; }
        .kadis-role { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--forest); }
        .kadis-dept { font-size: 13px; color: var(--slate-500); margin-top: 4px; font-weight: 500; }
        .kadis-divider { width: 36px; height: 3px; background: var(--lime); border-radius: 3px; margin: 16px auto; }
        .kadis-name { font-size: 22px; font-weight: 800; color: var(--slate-900); letter-spacing: -0.02em; }
        .vm-right { display: flex; flex-direction: column; gap: 24px; }
        .vm-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--forest); padding: 6px 14px; border-radius: 100px;
          background: rgba(13,61,43,0.07); border: 1px solid rgba(13,61,43,0.12);
        }
        .vm-heading { font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: -0.02em; color: var(--slate-900); margin: 0 0 32px; }
        .vm-heading em { font-style: normal; color: var(--forest); }
        .vm-card {
          background: white; border: 1px solid var(--slate-200);
          border-radius: var(--radius-lg); padding: 36px 40px;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition);
        }
        .vm-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
        .vm-card-label {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .vm-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--forest); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 900;
        }
        .vm-card h3 { font-size: 22px; font-weight: 800; color: var(--slate-900); margin: 0; }
        .vm-card p { font-size: 16px; line-height: 1.7; color: var(--slate-600); margin: 0; }
        .misi-list { display: flex; flex-direction: column; gap: 16px; }
        .misi-item { display: flex; align-items: flex-start; gap: 16px; }
        .misi-num {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--forest); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; flex-shrink: 0; margin-top: 2px;
        }
        .misi-text { font-size: 15px; color: var(--slate-600); line-height: 1.65; padding-top: 4px; }

        /* ── TENTANG ── */
        .tentang-section { background: white; }
        .tentang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .tentang-img-wrap {
          border-radius: var(--radius-xl); overflow: hidden;
          box-shadow: var(--shadow-card); border: 1px solid var(--slate-200);
          height: 480px; position: relative;
        }
        .tentang-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .tentang-img-wrap:hover .tentang-img { transform: scale(1.04); }
        .tentang-img-badge {
          position: absolute; bottom: 24px; left: 24px;
          background: white; border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .tentang-img-badge-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--forest); display: flex; align-items: center; justify-content: center;
        }
        .tentang-img-badge p { margin: 0; font-size: 13px; font-weight: 700; color: var(--slate-900); }
        .tentang-img-badge span { font-size: 12px; color: var(--slate-500); font-weight: 500; }
        .tentang-info-list { display: flex; flex-direction: column; gap: 14px; margin-top: 36px; }
        .tentang-info-item {
          display: flex; align-items: center; gap: 16px;
          padding: 18px 20px; border-radius: var(--radius-md);
          background: var(--cream); border: 1px solid var(--slate-200);
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .tentang-info-item:hover { border-color: var(--lime-dim); box-shadow: var(--shadow-card); }
        .tentang-info-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .tentang-info-icon.green { background: rgba(13,61,43,0.1); color: var(--forest); }
        .tentang-info-icon.blue  { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .tentang-info-h { font-size: 15px; font-weight: 700; color: var(--slate-900); margin: 0 0 2px; }
        .tentang-info-p { font-size: 13px; color: var(--slate-500); margin: 0; font-weight: 500; }

        /* ── EDUKASI ── */
        .edukasi-section { background: var(--cream); }
        .edu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .edu-card {
          background: white; border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          overflow: hidden; box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          display: flex; flex-direction: column;
        }
        .edu-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); border-color: var(--lime-dim); }
        .edu-card-media { overflow: hidden; height: 240px; background: var(--slate-100); flex-shrink: 0; }
        .edu-card-media img, .edu-card-media video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .edu-card:hover .edu-card-media img { transform: scale(1.07); }
        .edu-card-body { padding: 28px; flex: 1; display: flex; flex-direction: column; }
        .card-tag {
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--forest); background: rgba(13,61,43,0.08);
          padding: 4px 10px; border-radius: 100px; display: inline-block; margin-bottom: 14px;
        }
        .card-tag.orange { color: #92400E; background: rgba(245,158,11,0.1); }
        .edu-card h3 {
          font-size: 18px; font-weight: 700; color: var(--slate-900);
          line-height: 1.45; margin: 0 0 10px; letter-spacing: -0.01em;
          transition: color var(--transition);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .edu-card:hover h3 { color: var(--forest); }
        .edu-card p {
          font-size: 14px; color: var(--slate-500); line-height: 1.65; margin: 0 0 24px; flex: 1;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-link {
          font-size: 14px; font-weight: 700; color: var(--forest);
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
          transition: gap var(--transition), color var(--transition); margin-top: auto;
        }
        .card-link:hover { gap: 10px; color: #0D5C3F; }

        /* ── SECTION FOOTER ROW ── */
        .section-footer { display: flex; justify-content: flex-end; margin-top: 48px; }
        .btn-section {
          font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 12px;
          background: var(--forest); color: white; border: none; cursor: pointer;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
        }
        .btn-section:hover { background: var(--forest-mid); transform: translateY(-2px); box-shadow: var(--shadow-hover); }
        .btn-section svg { transition: transform var(--transition); }
        .btn-section:hover svg { transform: translateX(3px); }

        /* ── BERITA SECTION ── */
        .berita-section { background: white; }
        .berita-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
        .col-header {
          display: flex; align-items: center; gap: 12px;
          padding-bottom: 20px; border-bottom: 2px solid var(--slate-200);
          margin-bottom: 28px;
        }
        .col-accent { width: 4px; height: 24px; border-radius: 4px; }
        .col-accent.green { background: var(--forest); }
        .col-accent.orange { background: var(--amber); }
        .col-header h3 { font-size: 20px; font-weight: 800; color: var(--slate-900); margin: 0; letter-spacing: -0.01em; }
        /* Featured article */
        .berita-featured {
          border-radius: var(--radius-md); overflow: hidden;
          background: white; border: 1px solid var(--slate-200);
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition);
          text-decoration: none; display: block; margin-bottom: 20px;
        }
        .berita-featured:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
        .berita-featured-img { height: 220px; overflow: hidden; background: var(--slate-100); }
        .berita-featured-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .berita-featured:hover .berita-featured-img img { transform: scale(1.05); }
        .berita-featured-body { padding: 24px; }
        .berita-meta { font-size: 12px; color: var(--slate-400); display: flex; align-items: center; gap: 6px; margin: 8px 0 12px; font-weight: 600; }
        .berita-meta.orange { color: #D97706; }
        .berita-featured h4 { font-size: 17px; font-weight: 700; color: var(--slate-900); line-height: 1.45; margin: 0 0 10px; letter-spacing: -0.01em; }
        .berita-featured p { font-size: 13px; color: var(--slate-500); line-height: 1.65; margin: 0; }
        /* Compact articles */
        .berita-list { display: flex; flex-direction: column; gap: 12px; }
        .berita-item {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 16px; border-radius: var(--radius-sm);
          border: 1px solid transparent;
          text-decoration: none; background: var(--cream);
          transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition), background var(--transition);
        }
        .berita-item:hover { background: white; border-color: var(--slate-200); box-shadow: var(--shadow-card); transform: translateX(4px); }
        .berita-item.orange-hover:hover { border-color: rgba(245,158,11,0.2); }
        .berita-item-img { width: 90px; height: 64px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: var(--slate-100); }
        .berita-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .berita-item:hover .berita-item-img img { transform: scale(1.1); }
        .berita-item h5 { font-size: 14px; font-weight: 700; color: var(--slate-900); line-height: 1.4; margin: 0 0 4px; letter-spacing: -0.01em; }
        .berita-item:hover h5 { color: var(--forest); }
        .berita-item span { font-size: 12px; color: var(--slate-400); font-weight: 600; display: flex; align-items: center; gap: 4px; }

        /* ── GALERI ── */
        .galeri-section { background: var(--cream); }
        .galeri-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .album-card {
          background: white; border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200); overflow: hidden;
          box-shadow: var(--shadow-card); cursor: pointer;
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
        }
        .album-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); border-color: var(--lime-dim); }
        .album-media { height: 260px; overflow: hidden; position: relative; background: var(--slate-100); }
        .album-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .album-card:hover .album-media img { transform: scale(1.06); }
        .album-media-badge {
          position: absolute; top: 16px; left: 16px;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
          border-radius: 100px; padding: 6px 12px;
          font-size: 11px; font-weight: 700; color: white;
          display: flex; align-items: center; gap: 5px;
        }
        .album-body { padding: 24px; }
        .album-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .album-date { font-size: 12px; color: var(--slate-400); font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .album-body h3 { font-size: 18px; font-weight: 700; color: var(--slate-900); line-height: 1.4; margin: 0 0 10px; letter-spacing: -0.01em; }
        .album-card:hover .album-body h3 { color: var(--forest); }
        .album-body p { font-size: 13px; color: var(--slate-500); line-height: 1.65; margin: 0 0 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .album-link { font-size: 13px; font-weight: 700; color: var(--forest); display: flex; align-items: center; gap: 6px; transition: gap var(--transition); }
        .album-card:hover .album-link { gap: 10px; }

        /* ── SLIDER ── */
        .slider-section { position: relative; height: 460px; overflow: hidden; }
        .slider-slide { position: absolute; inset: 0; transition: opacity 1s ease; }
        .slider-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .slider-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(13,61,43,0.88) 0%, rgba(13,61,43,0.4) 60%, transparent 100%); }
        .slider-content { position: absolute; bottom: 48px; left: 60px; }
        .slider-tag { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); margin-bottom: 10px; }
        .slider-content h3 { font-size: 36px; font-weight: 800; color: white; margin: 0 0 12px; letter-spacing: -0.02em; max-width: 560px; }
        .slider-content p { font-size: 15px; color: rgba(255,255,255,0.65); max-width: 480px; margin: 0 0 24px; line-height: 1.6; }
        .slider-dots { position: absolute; bottom: 24px; right: 40px; display: flex; gap: 8px; }
        .slider-dot { height: 6px; border-radius: 6px; background: rgba(255,255,255,0.4); border: none; cursor: pointer; padding: 0; transition: all 0.3s; }
        .slider-dot.active { background: var(--lime); width: 24px; }
        .slider-dot:not(.active) { width: 6px; }

        /* ── ALBUM MODAL ── */
        .album-modal { position: fixed; inset: 0; z-index: 200; background: var(--cream); overflow-y: auto; }
        .album-modal-header {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--slate-200);
          height: 72px; display: flex; align-items: center;
        }
        .album-modal-header-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 32px;
          width: 100%; display: flex; align-items: center; gap: 24px;
        }
        .album-modal-title { flex: 1; text-align: center; }
        .album-modal-title h2 { font-size: 18px; font-weight: 800; color: var(--slate-900); margin: 0; letter-spacing: -0.01em; }
        .album-modal-title p { font-size: 13px; color: var(--slate-500); margin: 4px 0 0; font-weight: 500; }
        .album-modal-desc { max-width: 1280px; margin: 0 auto; padding: 32px 32px 0; }
        .album-modal-desc-box {
          background: white; border: 1px solid var(--slate-200); border-radius: var(--radius-md);
          padding: 28px 32px; box-shadow: var(--shadow-card);
        }
        .album-modal-desc-box h3 { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--forest); margin: 0 0 12px; }
        .album-modal-desc-box p { font-size: 15px; color: var(--slate-600); line-height: 1.7; margin: 0; }
        .album-photos { max-width: 1280px; margin: 0 auto; padding: 40px 32px 60px; }
        .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .photo-item {
          aspect-ratio: 4/3; border-radius: var(--radius-md); overflow: hidden;
          position: relative; cursor: pointer;
          background: var(--slate-100);
          box-shadow: var(--shadow-card); border: 1px solid var(--slate-200);
          transition: transform var(--transition), box-shadow var(--transition);
        }
        .photo-item:hover { transform: scale(1.02); box-shadow: var(--shadow-hover); }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .photo-item:hover img { transform: scale(1.06); }
        .photo-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center;
          transition: background var(--transition);
        }
        .photo-item:hover .photo-overlay { background: rgba(13,61,43,0.4); }
        .photo-eye { opacity: 0; transition: opacity var(--transition); background: white; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: var(--forest); }
        .photo-item:hover .photo-eye { opacity: 1; }
        .photo-count { position: absolute; bottom: 12px; left: 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: var(--lime); opacity: 0; transition: opacity var(--transition); }
        .photo-item:hover .photo-count { opacity: 1; }

        /* ── LIGHTBOX ── */
        .lightbox {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .lightbox-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.1); border: none; cursor: pointer;
          width: 44px; height: 44px; border-radius: 50%; color: white;
          display: flex; align-items: center; justify-content: center;
          transition: background var(--transition);
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.2); }
        .lightbox-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.1); border: none; cursor: pointer;
          width: 52px; height: 52px; border-radius: 50%; color: white;
          display: flex; align-items: center; justify-content: center;
          transition: background var(--transition);
        }
        .lightbox-nav:hover { background: rgba(255,255,255,0.2); }
        .lightbox-nav.left { left: 24px; }
        .lightbox-nav.right { right: 24px; }
        .lightbox-img-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 1000px; width: 100%; }
        .lightbox-img-wrap img { max-height: 78vh; object-fit: contain; border-radius: 12px; }
        .lightbox-caption { text-align: center; }
        .lightbox-caption p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0 0 6px; font-weight: 600; }
        .lightbox-caption span { color: rgba(255,255,255,0.35); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; }

        /* ── FOOTER ── */
        .footer { background: var(--slate-900); color: white; padding: 80px 32px 40px; }
        .footer-inner { max-width: 1280px; margin: 0 auto; }
        .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.5fr; gap: 48px; margin-bottom: 64px; }
        .footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .footer-logo img { width: 40px; height: 40px; object-fit: contain; }
        .footer-logo-name { font-size: 18px; font-weight: 800; color: white; }
        .footer-logo-sub { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); margin-top: 2px; }
        .footer-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; }
        .footer-col h4 {
          font-size: 14px; font-weight: 800; color: white; margin: 0 0 24px;
          padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a {
          font-size: 14px; color: rgba(255,255,255,0.5); text-decoration: none;
          display: flex; align-items: center; gap: 8px;
          transition: color var(--transition); font-weight: 500;
        }
        .footer-links a:hover { color: var(--lime); }
        .footer-links a svg { opacity: 0.4; transition: opacity var(--transition), transform var(--transition); }
        .footer-links a:hover svg { opacity: 1; transform: translateX(3px); }
        .footer-contact { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .footer-contact li { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500; line-height: 1.6; }
        .footer-contact li svg { color: var(--lime); flex-shrink: 0; margin-top: 1px; }
        .footer-socials { display: flex; gap: 10px; margin-top: 24px; }
        .footer-social {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6);
          text-decoration: none; transition: all var(--transition);
        }
        .footer-social:hover { background: var(--forest-mid); color: white; border-color: var(--forest-mid); transform: translateY(-2px); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 32px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .footer-bottom p { font-size: 13px; color: rgba(255,255,255,0.35); margin: 0; }
        .footer-bottom-links { display: flex; gap: 24px; }
        .footer-bottom-links a { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color var(--transition); }
        .footer-bottom-links a:hover { color: var(--lime); }

        /* ── EMPTY / LOADING STATES ── */
        .empty-state { text-align: center; padding: 64px 32px; color: var(--slate-400); }
        .empty-state svg { margin: 0 auto 16px; opacity: 0.3; display: block; }
        .empty-state p { font-size: 15px; font-weight: 600; margin: 0; }
        .skeleton { background: linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .visi-misi-grid { grid-template-columns: 1fr; gap: 40px; }
          .kadis-card { position: static; max-width: 400px; margin: 0 auto; }
          .tentang-grid { grid-template-columns: 1fr; gap: 48px; }
          .tentang-img-wrap { height: 360px; }
          .berita-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .hero-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .section { padding: 64px 20px; }
          .navbar-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .btn-ghost { display: none; }
          .menu-toggle { display: flex; }
          .hero-inner { padding: 90px 20px 220px; }
          .hero-title { font-size: 36px; }
          .hero-stats { position: relative; grid-template-columns: repeat(3, 1fr); background: var(--forest); margin-top: 0; }
          .hero-stat { padding: 20px; }
          .hero-stat-num { font-size: 24px; }
          .edu-grid { grid-template-columns: 1fr; }
          .galeri-grid { grid-template-columns: 1fr; }
          .photos-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
          .slider-content { left: 24px; bottom: 60px; }
          .slider-content h3 { font-size: 24px; }
          .album-modal-header-inner { padding: 0 16px; }
          .album-photos { padding: 24px 16px 40px; }
        }
        @media (max-width: 480px) {
          .hero-ctas { flex-direction: column; }
          .hero-stats { grid-template-columns: repeat(3, 1fr); }
          .photos-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ALBUM MODAL */}
      {selectedAlbum && (
        <div className="album-modal">
          <div className="album-modal-header">
            <div className="album-modal-header-inner">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="btn-primary"
                style={{ gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              >
                <ChevronLeft size={16} />
                <span>Kembali</span>
              </button>
              <div className="album-modal-title">
                <h2>{selectedAlbum.title}</h2>
                <p>
                  {loadingDetail
                    ? 'Memuat foto...'
                    : `${selectedAlbum.photos?.length || 0} foto tersedia`}
                </p>
              </div>
              <div style={{ width: '120px' }} />
            </div>
          </div>

          {selectedAlbum.description && (
            <div className="album-modal-desc">
              <div className="album-modal-desc-box">
                <h3>Deskripsi Kegiatan</h3>
                <p>{selectedAlbum.description}</p>
              </div>
            </div>
          )}

          <div className="album-photos">
            {loadingDetail ? (
              <div className="photos-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '4/3' }} />
                ))}
              </div>
            ) : !selectedAlbum.photos?.length ? (
              <div className="empty-state">
                <Images size={48} />
                <p>Belum ada koleksi foto</p>
              </div>
            ) : (
              <div className="photos-grid">
                {selectedAlbum.photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="photo-item"
                    onClick={() => setLightbox({ photos: selectedAlbum.photos!, index: idx })}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || `Foto ${idx + 1}`}
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                    <div className="photo-overlay">
                      <div className="photo-eye"><Eye size={20} /></div>
                    </div>
                    <span className="photo-count">
                      {String(idx + 1).padStart(2, '0')} / {selectedAlbum.photos!.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIGHTBOX */}
          {lightbox && (
            <div className="lightbox" onClick={() => setLightbox(null)}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={20} /></button>
              {lightbox.photos.length > 1 && (
                <>
                  <button className="lightbox-nav left" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}><ChevronLeft size={24} /></button>
                  <button className="lightbox-nav right" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}><ChevronRight size={24} /></button>
                </>
              )}
              <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
                <img
                  src={lightbox.photos[lightbox.index].imageUrl}
                  alt={lightbox.photos[lightbox.index].caption || ''}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="lightbox-caption">
                  {lightbox.photos[lightbox.index].caption && (
                    <p>{lightbox.photos[lightbox.index].caption}</p>
                  )}
                  <span>{lightbox.index + 1} / {lightbox.photos.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <div className="mobile-menu-header">
            <div className="nav-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo" />
              <div className="nav-logo-text">
                <h1 style={{ color: 'var(--forest)' }}>Dinas Lingkungan Hidup</h1>
                <p>Kabupaten Toba</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--slate-900)" />
            </button>
          </div>
          {NAV_LINKS.map(item => (
            <Link key={item} href={navHref(item)} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {item} <ChevronRight size={18} />
            </Link>
          ))}
          <div style={{ padding: '16px 0', borderTop: '1px solid var(--slate-200)', marginTop: '8px', display: 'flex', gap: '12px' }}>
            <Link href="/login" className="btn-ghost-green" style={{ flex: 1, justifyContent: 'center' }}>Login</Link>
            <Link href="/Warga" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Lapor Sekarang</Link>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : 'top'}`}>
        <div className="navbar-inner">
          <Link href="/" className="nav-logo">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg"
              alt="Logo Kabupaten Toba"
            />
            <div className="nav-logo-text">
              <h1>Dinas Lingkungan Hidup</h1>
              <p>Kabupaten Toba</p>
            </div>
          </Link>
          <div className="nav-links">
            {NAV_LINKS.map((item) => (
              <Link key={item} href={navHref(item)} className="nav-link">
                {item}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">
              Login
            </Link>
            <Link href="/Warga" className="btn-primary">
              <Leaf size={14} />
              Lapor
            </Link>
            <button
              className="menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka Menu"
            >
              <Menu
                size={24}
                color="white"  /* selalu putih agar kontras dengan latar transparan dan hijau gelap */
              />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO - Height adjusted to min-h-[80vh] */}
      <header className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://tobaria.com/wp-content/uploads/2020/07/shutterstock_602246390-1.jpg" className="w-full h-full object-cover" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
        </div>
        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <div className="text-white text-center md:text-left">
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[1.1] tracking-tighter">
              Menjaga <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">Kebersihan Toba</span>
            </h1>
            <p className="text-lg md:text-2xl font-medium opacity-95 mb-12 leading-relaxed max-w-3xl">
              Sinergi pemerintah dan masyarakat dalam mewujudkan lingkungan yang asri, bersih, dan berkelanjutan.
            </p>
          </div>
        </div>
      </header>

      {/* ── VISI MISI ── */}
      <section className="section visi-misi-section">
        <div className="section-inner">
          <div className="visi-misi-grid">
            {/* Kadis Card */}
            <div>
              <div className="kadis-card animate-fade-up">
                <img src="/Kadis.jpeg" alt="Kepala Dinas Lingkungan Hidup Kabupaten Toba" className="kadis-img" />
                <div className="kadis-info">
                  <p className="kadis-role">Kepala Dinas Lingkungan Hidup</p>
                  <p className="kadis-dept">Kabupaten Toba</p>
                  <div className="kadis-divider" />
                  <h3 className="kadis-name">dr. Rajaipan O. Sinurat, M.Kes</h3>
                </div>
              </div>
            </div>
            {/* Visi Misi */}
            <div className="vm-right">
              <div>
                <span className="vm-badge animate-fade-up">
                  <Leaf size={12} /> Visi &amp; Misi
                </span>
                <h2 className="vm-heading animate-fade-up delay-100">
                  TOBA <em>MANTAP</em> 2029
                </h2>
              </div>
              <div className="vm-card animate-fade-up delay-200">
                <div className="vm-card-label">
                  <div className="vm-icon">V</div>
                  <h3>VISI</h3>
                </div>
                <p>Maju Daerahnya, Sejahtera Rakyatnya dan Berkelanjutan Pembangunannya.</p>
              </div>
              <div className="vm-card animate-fade-up delay-300">
                <div className="vm-card-label">
                  <div className="vm-icon">M</div>
                  <h3>MISI</h3>
                </div>
                <div className="misi-list">
                  {[
                    "Membangun Sumber Daya Manusia yang berdaya saing dan berakhlak.",
                    "Membangun Infrastruktur yang terintegrasi dan merata untuk mendukung kemandirian daerah.",
                    "Meningkatkan pembangunan ekonomi masyarakat berbasis potensi daerah.",
                    "Mewujudkan tata kelola pemerintah yang baik dan bersih sebagai pelayan (Parhobas) rakyat.",
                    "Meningkatkan keamanan dan ketertiban.",
                    "Melestarikan nilai budaya dan kearifan lokal."
                  ].map((m, i) => (
                    <div className="misi-item" key={i}>
                      <div className="misi-num">{i + 1}</div>
                      <p className="misi-text">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TENTANG ── */}
      <section id="tentang" className="section tentang-section">
        <div className="section-inner">
          <div className="tentang-grid">
            <div className="tentang-img-wrap animate-fade-up">
              <img src="/KantorDinas.jpeg" className="tentang-img" alt="Kantor Dinas Lingkungan Hidup Kabupaten Toba" />
              <div className="tentang-img-badge">
                <div className="tentang-img-badge-icon">
                  <Leaf size={18} color="white" />
                </div>
                <div>
                  <p>DLH Kabupaten Toba</p>
                  <span>Melayani sejak 2001</span>
                </div>
              </div>
            </div>
            <div className="animate-fade-up delay-200">
              <span className="section-eyebrow">Profil Lembaga</span>
              <h2 className="section-title">
                Dinas Lingkungan Hidup <em>Toba</em>
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--slate-500)', lineHeight: 1.7, marginBottom: '12px' }}>
                Dinas Lingkungan Hidup Toba berkomitmen meningkatkan pembangunan ekonomi yang berkelanjutan berbasis potensi daerah.
              </p>
              <div className="tentang-info-list">
                <div className="tentang-info-item">
                  <div className="tentang-info-icon green"><MapPin size={20} /></div>
                  <div>
                    <p className="tentang-info-h">Cakupan Wilayah</p>
                    <p className="tentang-info-p">9 kecamatan di Kabupaten Toba</p>
                  </div>
                </div>
                <div className="tentang-info-item">
                  <div className="tentang-info-icon blue"><Clock size={20} /></div>
                  <div>
                    <p className="tentang-info-h">Pelayanan 24/7</p>
                    <p className="tentang-info-p">Siaga pelaporan gangguan lingkungan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDUKASI ── */}
      <section id="edukasi" className="section edukasi-section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Pembelajaran</span>
            <h2 className="section-title">Edukasi <em>Lingkungan</em></h2>
            <p className="section-subtitle">Tingkatkan pemahaman tentang kelestarian alam dan kebersihan lingkungan bersama kami.</p>
          </div>
          <div className="edu-grid">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                  <div className="skeleton" style={{ height: '240px' }} />
                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60px' }} />
                    <div className="skeleton" style={{ height: '20px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  </div>
                </div>
              ))
            ) : educations.length > 0 ? (
              educations.map((edu, i) => {
                const title = getEduTitle(edu);
                const desc = getEduDesc(edu);
                const mediaUrl = getEduMediaUrl(edu);
                const mediaType = getEduMediaType(edu);
                return (
                  <div key={edu.id} className="edu-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="edu-card-media">
                      {mediaType === 'VIDEO'
                        ? <video src={mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <img src={mediaUrl || FALLBACK_IMG} alt={title} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                      }
                    </div>
                    <div className="edu-card-body">
                      <span className="card-tag">Edukasi</span>
                      <h3>{title}</h3>
                      <p>{stripHtml(desc)}</p>
                      <Link href={`/edukasi/${edu.id}`} className="card-link">
                        Baca Selengkapnya <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state"><p>Belum ada edukasi tersedia</p></div>
                  <DebugPanel />
                </div>
              </>
            )}
          </div>
          {!loading && educations.length > 0 && (
            <div className="section-footer">
              <Link href="/edukasi" className="btn-section">
                Lihat Semua Edukasi <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── BERITA & PENGUMUMAN ── */}
      <section id="berita" className="section berita-section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Informasi Terkini</span>
            <h2 className="section-title">Berita <em>&amp; Pengumuman</em></h2>
            <p className="section-subtitle">Ikuti perkembangan terbaru seputar lingkungan hidup Kabupaten Toba.</p>
          </div>
          <div className="berita-grid">
            {/* BERITA */}
            <div>
              <div className="col-header">
                <span className="col-accent green" />
                <h3>Berita Portal</h3>
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)}
                </div>
              ) : beritaPosts.length > 0 ? (
                <>
                  <Link href={`/berita/${beritaPosts[0].slug || beritaPosts[0].id}`} className="berita-featured">
                    <div className="berita-featured-img">
                      <img src={beritaPosts[0].imageUrl || FALLBACK_IMG} alt={beritaPosts[0].title} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                    </div>
                    <div className="berita-featured-body">
                      <span className="card-tag">{beritaPosts[0].category || 'Berita'}</span>
                      <h4>{beritaPosts[0].title}</h4>
                      <p className="berita-meta"><Clock size={11} /> {fmtDate(beritaPosts[0].createdAt || beritaPosts[0].date)}</p>
                      <p>{stripHtml(beritaPosts[0].content).substring(0, 140)}...</p>
                    </div>
                  </Link>
                  <div className="berita-list">
                    {beritaPosts.slice(1).map(post => (
                      <Link key={post.id} href={`/berita/${post.slug || post.id}`} className="berita-item">
                        <div className="berita-item-img">
                          <img src={post.imageUrl || FALLBACK_IMG} alt={post.title} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                        </div>
                        <div>
                          <h5>{post.title}</h5>
                          <span><Clock size={11} /> {fmtDate(post.createdAt || post.date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="section-footer">
                    <Link href="/berita" className="btn-section">Lihat Semua Berita <ArrowRight size={15} /></Link>
                  </div>
                </>
              ) : (
                <div className="empty-state"><p>Belum ada berita tersedia.</p></div>
              )}
            </div>

            {/* PENGUMUMAN */}
            <div>
              <div className="col-header">
                <span className="col-accent orange" />
                <h3>Pengumuman Resmi</h3>
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)}
                </div>
              ) : pengumumanPosts.length > 0 ? (
                <>
                  <Link href={`/berita/${pengumumanPosts[0].slug || pengumumanPosts[0].id}`} className="berita-featured">
                    <div className="berita-featured-img">
                      <img src={pengumumanPosts[0].imageUrl || FALLBACK_IMG} alt={pengumumanPosts[0].title} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                    </div>
                    <div className="berita-featured-body">
                      <span className="card-tag orange">{pengumumanPosts[0].category || 'Pengumuman'}</span>
                      <h4>{pengumumanPosts[0].title}</h4>
                      <p className="berita-meta orange"><Clock size={11} /> {fmtDate(pengumumanPosts[0].createdAt || pengumumanPosts[0].date)}</p>
                      <p>{stripHtml(pengumumanPosts[0].content).substring(0, 140)}...</p>
                    </div>
                  </Link>
                  <div className="berita-list">
                    {pengumumanPosts.slice(1).map(post => (
                      <Link key={post.id} href={`/berita/${post.slug || post.id}`} className="berita-item orange-hover">
                        <div className="berita-item-img">
                          <img src={post.imageUrl || FALLBACK_IMG} alt={post.title} onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                        </div>
                        <div>
                          <h5>{post.title}</h5>
                          <span style={{ color: '#D97706' }}><Clock size={11} /> {fmtDate(post.createdAt || post.date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state"><p>Belum ada pengumuman tersedia.</p></div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERI ── */}
      <section id="galeri" className="section galeri-section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Dokumentasi</span>
            <h2 className="section-title">Galeri Kegiatan <em>Lingkungan</em></h2>
            <p className="section-subtitle">Kumpulan momen inspiratif dari berbagai inisiatif keberlanjutan dan aksi kebersihan di lapangan.</p>
          </div>
          <div className="galeri-grid">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                  <div className="skeleton" style={{ height: '260px' }} />
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '50%' }} />
                    <div className="skeleton" style={{ height: '18px' }} />
                  </div>
                </div>
              ))
            ) : albums.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state">
                  <Images size={48} />
                  <p>Belum ada galeri tersedia</p>
                </div>
              </div>
            ) : (
              albums.slice(0, 3).map((album, i) => (
                <div
                  key={album.id}
                  className="album-card animate-fade-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => openAlbum(album)}
                >
                  <div className="album-media">
                    <img
                      src={album.coverUrl || FALLBACK_IMG}
                      alt={album.title}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                    <span className="album-media-badge">
                      <Images size={12} /> {album.photos?.length || 0} Foto
                    </span>
                  </div>
                  <div className="album-body">
                    <div className="album-meta">
                      <span className="card-tag" style={{ margin: 0 }}>Album</span>
                      {album.createdAt && (
                        <span className="album-date">
                          <Clock size={12} />
                          {new Date(album.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3>{album.title}</h3>
                    <p>{album.description || 'Dokumentasi momen inspiratif dari berbagai inisiatif keberlanjutan dan aksi kebersihan.'}</p>
                    <div className="album-link">Lihat Album <ArrowRight size={15} /></div>
                  </div>
                </div>
              ))
            )}
          </div>
          {!loading && albums.length > 0 && (
            <div className="section-footer">
              <Link href="/galeri" className="btn-section">Lihat Semua Galeri <ArrowRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* ── SLIDER ── */}
      {!loading && sliderAlbums.length > 0 && (
        <section className="slider-section">
          {sliderAlbums.map((album, index) => (
            <div key={album.id} className="slider-slide" style={{ opacity: index === sliderIndex ? 1 : 0 }}>
              <img src={album.coverUrl!} alt={album.title} />
              <div className="slider-overlay" />
              <div className="slider-content">
                <p className="slider-tag">Dokumentasi Kegiatan</p>
                <h3>{album.title}</h3>
                {album.description && <p>{album.description}</p>}
                <Link href="/galeri" className="btn-primary-lime" style={{ fontSize: '13px', padding: '10px 20px' }}>
                  <Images size={15} /> Lihat Foto ({album.photos?.length || 0})
                </Link>
              </div>
            </div>
          ))}
          {sliderAlbums.length > 1 && (
            <div className="slider-dots">
              {sliderAlbums.map((_, i) => (
                <button
                  key={i}
                  className={`slider-dot ${i === sliderIndex ? 'active' : ''}`}
                  onClick={() => setSliderIndex(i)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo" />
                <div>
                  <div className="footer-logo-name">DLH TOBA</div>
                  <div className="footer-logo-sub">Kabupaten Toba</div>
                </div>
              </div>
              <p className="footer-desc">Dinas Lingkungan Hidup Kabupaten Toba berkomitmen menjaga kelestarian alam dan kebersihan lingkungan untuk generasi mendatang.</p>
            </div>
            <div className="footer-col">
              <h4>Tautan Cepat</h4>
              <ul className="footer-links">
                {NAV_LINKS.map(item => (
                  <li key={item}>
                    <Link href={navHref(item)}>
                      <ChevronRight size={14} />{item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Sumber Daya</h4>
              <ul className="footer-links">
                {[
                  { name: 'Tugas Pokok dan Fungsi', path: 'https://dislindup.tobakab.go.id/tugas-pokok-dan-fungsi/' },
                  { name: 'RPJMD', path: 'https://dislindup.tobakab.go.id/rpjmd/' },
                  { name: 'RENSTRA', path: 'https://dislindup.tobakab.go.id/renstra/' },
                  { name: 'Struktur Organisasi', path: 'https://dislindup.tobakab.go.id/struktur-organisasi/' }
                ].map(l => (
                  <li key={l.name}><Link href={l.path}><ChevronRight size={14} />{l.name}</Link></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Hubungi Kami</h4>
              <ul className="footer-contact">
                <li><MapPin size={16} />Jl. Hutabulu Mejan No. 14, Sibola Hotangsas, Kec. Balige, Toba, Sumatera Utara</li>
                <li><Phone size={16} />(0632) 123-4567</li>
                <li><Mail size={16} />dislindup@tobakab.go.id</li>
              </ul>
              <div className="footer-socials">
                <a href="#" className="footer-social" aria-label="Facebook"><Facebook size={18} /></a>
                <a href="#" className="footer-social" aria-label="Instagram"><Instagram size={18} /></a>
                <a href="mailto:dislindup@tobakab.go.id" className="footer-social" aria-label="Email"><Mail size={18} /></a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Dinas Lingkungan Hidup Kabupaten Toba</strong>. Seluruh hak cipta dilindungi.</p>
            <div className="footer-bottom-links">
              <Link href="/privasi">Kebijakan Privasi</Link>
              <Link href="/syarat">Syarat &amp; Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}