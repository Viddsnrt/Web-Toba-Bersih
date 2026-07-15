"use client";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Leaf,
  Mail,
  Instagram,
  Facebook,
  MapPin,
  Phone,
  Menu,
  ChevronRight as ChevronRightIcon,
  Calendar,
} from "lucide-react";

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
  createdAt?: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800";

const NAV_LINKS = ["Tentang", "Edukasi", "Berita", "Galeri"];
const navHref = (item: string) => {
  const key = item.toLowerCase();
  if (key === "berita") return "/berita";
  if (key === "edukasi") return "/edukasi";
  if (key === "galeri") return "/galeri";
  return `/#${key}`;
};

const fmtDate = (v?: string) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return v;
  }
};

export default function GaleriPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detail album
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lightbox
  const [lightbox, setLightbox] = useState<{
    photos: GalleryPhoto[];
    index: number;
  } | null>(null);

  // ── SCROLL NAVBAR ──
  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── FETCH ALBUMS ──
  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      try {
        const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
        const BASE = rawBase ? rawBase.replace(/\/$/, "") + "/api" : "/api";
        const res = await axios.get(`${BASE}/galleries/albums`);
        const raw = res.data;
        const list: Album[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        setAlbums(list);
      } catch (err) {
        console.error("[galeri] FETCH ERROR:", err);
      }
      setLoading(false);
    };
    fetchAlbums();
  }, []);

  // ── FETCH ALBUM DETAIL ──
  const openAlbum = async (album: Album) => {
    setLoadingDetail(true);
    setSelectedAlbum(album);
    try {
      const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
      const BASE = rawBase ? rawBase.replace(/\/$/, "") + "/api" : "/api";
      const res = await axios.get(`${BASE}/galleries/albums/${album.id}`);
      const raw = res.data;
      setSelectedAlbum(raw?.data ?? raw);
    } catch {
      // fallback
    }
    setLoadingDetail(false);
  };

  // ── KEYBOARD SHORTCUT ──
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

  const nextPhoto = () => {
    if (!lightbox) return;
    setLightbox({
      photos: lightbox.photos,
      index: (lightbox.index + 1) % lightbox.photos.length,
    });
  };
  const prevPhoto = () => {
    if (!lightbox) return;
    setLightbox({
      photos: lightbox.photos,
      index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length,
    });
  };

  // ── RENDER DETAIL ALBUM ──────────────────────────────────────────────
  if (selectedAlbum) {
    const photos = selectedAlbum.photos || [];
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: var(--font); background: var(--cream); color: var(--slate-900); margin: 0; -webkit-font-smoothing: antialiased; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .animate-fade-up  { animation: fadeUp  0.6s ease both; }
          .animate-fade-in  { animation: fadeIn  0.4s ease both; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }

          /* ── NAVBAR DETAIL ── */
          .navbar-detail {
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
          .navbar-detail.scrolled {
            background: rgba(6, 78, 59, 0.95);
            backdrop-filter: blur(16px);
            box-shadow: 0 1px 0 rgba(255,255,255,0.08);
          }
          .navbar-detail.top {
            background: transparent;
          }
          .navbar-detail.scrolled .nav-logo-text h1 {
            color: white;
          }
          .navbar-detail.scrolled .btn-back {
            color: rgba(255,255,255,0.9);
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.15);
          }
          .navbar-detail.scrolled .btn-back:hover {
            background: rgba(255,255,255,0.2);
            color: white;
          }
          .navbar-detail.top .btn-back {
            color: rgba(255,255,255,0.9);
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.15);
          }
          .navbar-detail.top .btn-back:hover {
            background: rgba(255,255,255,0.2);
            color: white;
          }
          .navbar-detail.top .nav-logo-text h1 {
            color: white;
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
          .nav-logo-text p {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--lime);
            margin: 0;
            margin-top: 1px;
          }
          .btn-back {
            font-size: 14px;
            font-weight: 700;
            padding: 10px 22px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.2);
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all var(--transition);
            background: rgba(255,255,255,0.1);
            color: white;
          }
          .btn-back:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-1px);
          }

          /* ── HERO DETAIL ── */
          .hero-detail {
            position: relative;
            min-height: 320px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
            background: var(--forest);
          }
          .hero-detail-bg {
            position: absolute;
            inset: 0;
            background-image: url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1600');
            background-size: cover;
            background-position: center;
            opacity: 0.25;
          }
          .hero-detail-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(13,61,43,0.9) 0%, rgba(13,61,43,0.4) 60%, rgba(13,61,43,0.2) 100%);
          }
          .hero-detail-inner {
            position: relative;
            z-index: 2;
            max-width: 1280px;
            margin: 0 auto;
            padding: 100px 32px 40px;
            width: 100%;
          }
          .hero-detail-breadcrumb {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255,255,255,0.5);
            margin-bottom: 16px;
            flex-wrap: wrap;
          }
          .hero-detail-breadcrumb a {
            color: rgba(255,255,255,0.6);
            text-decoration: none;
            transition: color var(--transition);
          }
          .hero-detail-breadcrumb a:hover {
            color: var(--lime);
          }
          .hero-detail-title {
            font-size: clamp(32px, 4vw, 48px);
            font-weight: 800;
            line-height: 1.12;
            letter-spacing: -0.02em;
            color: white;
            margin: 0 0 12px;
          }
          .hero-detail-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            font-size: 14px;
            color: rgba(255,255,255,0.7);
            font-weight: 500;
          }
          .hero-detail-meta span {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .hero-detail-meta svg {
            color: var(--lime);
            width: 16px;
            height: 16px;
          }

          /* ── DESKRIPSI ── */
          .desc-section {
            max-width: 1280px;
            margin: 0 auto;
            padding: 40px 32px 0;
          }
          .desc-card {
            background: white;
            border: 1px solid var(--slate-200);
            border-radius: var(--radius-lg);
            padding: 28px 32px;
            box-shadow: var(--shadow-card);
          }
          .desc-card p {
            font-size: 15px;
            line-height: 1.7;
            color: var(--slate-700);
            margin: 0;
            white-space: pre-line;
          }

          /* ── GRID FOTO ── */
          .photo-grid-section {
            max-width: 1280px;
            margin: 0 auto;
            padding: 40px 32px 80px;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .photo-card {
            position: relative;
            aspect-ratio: 4/3;
            cursor: pointer;
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: var(--slate-100);
            border: 1px solid var(--slate-200);
            transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          }
          .photo-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--shadow-hover);
            border-color: var(--lime-dim);
          }
          .photo-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .photo-card:hover img {
            transform: scale(1.08);
          }
          .photo-card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(13,61,43,0.85) 0%, rgba(13,61,43,0.1) 60%, transparent 100%);
            opacity: 0;
            transition: opacity var(--transition);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px;
          }
          .photo-card:hover .photo-card-overlay {
            opacity: 1;
          }
          .photo-card-overlay p {
            color: white;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 6px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-shadow: 0 1px 4px rgba(0,0,0,0.3);
          }
          .photo-card-overlay .photo-index {
            color: rgba(255,255,255,0.7);
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .photo-card-overlay .photo-index span {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(4px);
            padding: 2px 12px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            color: white;
          }
          .photo-card .badge-count {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(13,61,43,0.85);
            backdrop-filter: blur(4px);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 14px;
            border-radius: 100px;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 1px solid rgba(255,255,255,0.1);
          }

          /* ── LOADING SKELETON ── */
          .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .skeleton {
            aspect-ratio: 4/3;
            border-radius: var(--radius-lg);
            background: linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* ── EMPTY ── */
          .empty-photo {
            text-align: center;
            padding: 80px 20px;
            background: white;
            border-radius: var(--radius-lg);
            border: 2px dashed var(--slate-200);
            color: var(--slate-400);
            grid-column: 1 / -1;
          }
          .empty-photo svg {
            margin: 0 auto 16px;
            opacity: 0.4;
            display: block;
          }
          .empty-photo p {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }

          /* ── LIGHTBOX ── */
          .lightbox-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.92);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            animation: fadeIn 0.3s ease;
          }
          .lightbox-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 90vw;
            max-height: 90vh;
            gap: 16px;
          }
          .lightbox-content img {
            max-height: 75vh;
            object-fit: contain;
            border-radius: var(--radius-md);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          }
          .lightbox-caption {
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            padding: 12px 24px;
            border-radius: 12px;
            text-align: center;
            color: white;
            font-size: 14px;
            font-weight: 500;
            max-width: 600px;
            width: 100%;
          }
          .lightbox-caption .counter {
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            font-weight: 600;
            margin-top: 4px;
          }
          .lightbox-close {
            position: absolute;
            top: 24px;
            right: 24px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.7);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition);
          }
          .lightbox-close:hover {
            background: rgba(255,255,255,0.2);
            color: white;
          }
          .lightbox-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.7);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition);
          }
          .lightbox-nav:hover {
            background: rgba(255,255,255,0.2);
            color: white;
          }
          .lightbox-nav.prev { left: 24px; }
          .lightbox-nav.next { right: 24px; }

          /* ── RESPONSIVE ── */
          @media (max-width: 1024px) {
            .photo-grid, .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 768px) {
            .navbar-inner { padding: 0 20px; }
            .hero-detail-inner { padding: 80px 20px 32px; }
            .desc-section { padding: 32px 20px 0; }
            .photo-grid-section { padding: 32px 20px 60px; }
            .photo-grid, .skeleton-grid { grid-template-columns: 1fr; gap: 16px; }
            .hero-detail-title { font-size: 28px; }
            .desc-card { padding: 20px; }
            .lightbox-nav { width: 40px; height: 40px; }
            .lightbox-nav.prev { left: 12px; }
            .lightbox-nav.next { right: 12px; }
            .lightbox-close { top: 12px; right: 12px; width: 40px; height: 40px; }
          }
          @media (max-width: 480px) {
            .hero-detail-title { font-size: 24px; }
            .hero-detail-meta { font-size: 12px; gap: 12px; }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          }
        `}</style>

        {/* ── NAVBAR DETAIL ── */}
        <nav className={`navbar-detail ${isScrolled ? 'scrolled' : 'top'}`}>
          <div className="navbar-inner">
            <Link href="/" className="nav-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo Kabupaten Toba" />
              <div className="nav-logo-text">
                <h1>Dinas Lingkungan Hidup</h1>
                <p>Kabupaten Toba</p>
              </div>
            </Link>
            <button onClick={() => setSelectedAlbum(null)} className="btn-back">
              <ArrowLeft size={16} /> Kembali ke Galeri
            </button>
          </div>
        </nav>

        {/* ── HERO DETAIL ── */}
        <header className="hero-detail">
          <div className="hero-detail-bg" />
          <div className="hero-detail-overlay" />
          <div className="hero-detail-inner">
            <div className="hero-detail-breadcrumb">
              <Link href="/">Beranda</Link>
              <ChevronRightIcon size={12} />
              <Link href="/galeri">Galeri</Link>
              <ChevronRightIcon size={12} />
              <span className="text-white/80">{selectedAlbum.title}</span>
            </div>
            <h1 className="hero-detail-title">{selectedAlbum.title}</h1>
            <div className="hero-detail-meta">
              <span>
                <Calendar size={16} />
                {selectedAlbum.createdAt ? fmtDate(selectedAlbum.createdAt) : 'Tanggal tidak tersedia'}
              </span>
              <span>
                <Images size={16} />
                {photos.length} foto
              </span>
            </div>
          </div>
        </header>

        {/* ── DESKRIPSI ── */}
        {selectedAlbum.description && (
          <div className="desc-section">
            <div className="desc-card animate-fade-up">
              <p>{selectedAlbum.description}</p>
            </div>
          </div>
        )}

        {/* ── GRID FOTO ── */}
        <div className="photo-grid-section">
          {loadingDetail ? (
            <div className="skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="empty-photo">
              <Images size={56} />
              <p>Belum ada foto dalam album ini</p>
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setLightbox({ photos, index: idx })}
                  className="photo-card animate-fade-up"
                  style={{ animationDelay: `${(idx % 9) * 0.06}s` }}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || `Foto ${idx + 1}`}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                  <div className="photo-card-overlay">
                    {photo.caption && <p>{photo.caption}</p>}
                    <div className="photo-index">
                      <span>Foto {idx + 1} / {photos.length}</span>
                    </div>
                  </div>
                  <div className="badge-count">
                    <Eye size={12} /> Lihat
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── LIGHTBOX ── */}
        {lightbox && (
          <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>
              <X size={24} />
            </button>
            {lightbox.photos.length > 1 && (
              <>
                <button
                  className="lightbox-nav prev"
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  className="lightbox-nav next"
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightbox.photos[lightbox.index].imageUrl}
                alt={lightbox.photos[lightbox.index].caption || ''}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
              />
              <div className="lightbox-caption">
                {lightbox.photos[lightbox.index].caption && (
                  <div>{lightbox.photos[lightbox.index].caption}</div>
                )}
                <div className="counter">{lightbox.index + 1} / {lightbox.photos.length}</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── RENDER LIST ALBUM ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
          --font: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 24px;
          --radius-xl: 32px;
          --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(13,61,43,0.08);
          --shadow-hover: 0 8px 32px rgba(13,61,43,0.15);
          --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { box-sizing: border-box; }
        body { font-family: var(--font); background: var(--cream); color: var(--slate-900); margin: 0; -webkit-font-smoothing: antialiased; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-up  { animation: fadeUp  0.6s ease both; }
        .animate-fade-in  { animation: fadeIn  0.4s ease both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

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
          background: rgba(6, 78, 59, 0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.08);
        }
        .navbar.top { background: transparent; }
        .navbar.scrolled .nav-logo-text h1 { color: white; }
        .navbar.scrolled .nav-link { color: rgba(255,255,255,0.9); }
        .navbar.scrolled .nav-link:hover { color: white; background: rgba(255,255,255,0.15); }
        .navbar.scrolled .btn-ghost { color: rgba(255,255,255,0.9); }
        .navbar.scrolled .btn-ghost:hover { color: white; background: rgba(255,255,255,0.15); }
        .navbar.scrolled .menu-toggle svg { color: white !important; }
        .navbar.scrolled .btn-primary { background: var(--forest); color: white; }
        .navbar.scrolled .btn-primary:hover { background: var(--forest-mid); }

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
        .navbar.top .nav-logo-text h1 { color: white; }
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
        }
        .navbar.top .nav-link { color: rgba(255,255,255,0.9); }
        .nav-link:hover { color: var(--forest); background: var(--slate-100); }
        .navbar.top .nav-link:hover { color: white; background: rgba(255,255,255,0.15); }

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
        .navbar.top .btn-ghost { color: rgba(255,255,255,0.9); }
        .btn-ghost:hover { color: var(--forest); background: var(--slate-100); }
        .navbar.top .btn-ghost:hover { color: white; background: rgba(255,255,255,0.15); }

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
        .menu-toggle:hover { background: rgba(255,255,255,0.1); }

        /* ── MOBILE MENU ── */
        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: white;
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--slate-200);
          margin-bottom: 12px;
        }
        .mobile-nav-link {
          font-size: 18px;
          font-weight: 700;
          color: var(--slate-900);
          text-decoration: none;
          padding: 14px 0;
          border-bottom: 1px solid var(--slate-100);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-ghost-green {
          font-size: 14px;
          font-weight: 700;
          padding: 12px;
          border-radius: 12px;
          background: var(--cream);
          color: var(--forest);
          border: 1px solid var(--slate-200);
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition);
        }
        .btn-ghost-green:hover { background: var(--slate-100); }

        /* ── HERO ── */
        .hero {
          position: relative;
          min-height: 380px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: var(--forest);
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1600');
          background-size: cover;
          background-position: center;
          opacity: 0.35;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(13,61,43,0.92) 0%, rgba(13,61,43,0.6) 50%, rgba(13,61,43,0.3) 100%);
        }
        .hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 120px 32px 64px;
          width: 100%;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lime);
          margin-bottom: 24px;
          border: 1px solid rgba(74,222,128,0.3);
          padding: 6px 14px;
          border-radius: 100px;
          background: rgba(74,222,128,0.08);
        }
        .hero-title {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: white;
          margin: 0 0 18px;
          max-width: 680px;
        }
        .hero-title span { color: var(--lime); }
        .hero-desc {
          font-size: clamp(15px, 1.6vw, 17px);
          color: rgba(255,255,255,0.75);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 0 32px;
        }

        /* ── SECTION ── */
        .section {
          padding: 80px 32px;
          background: var(--cream);
        }
        .section-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .section-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--forest);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .section-eyebrow::before {
          content: '';
          display: block;
          width: 20px;
          height: 2px;
          background: var(--lime);
          border-radius: 2px;
        }
        .section-header.center .section-eyebrow::before { display: none; }
        .section-title {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: var(--slate-900);
          margin: 0 0 20px;
        }
        .section-title em { font-style: normal; color: var(--forest); }
        .section-subtitle {
          font-size: 16px;
          line-height: 1.7;
          color: var(--slate-500);
          max-width: 560px;
          margin: 0 auto;
        }
        .section-header.center .section-title::after {
          content: '';
          display: block;
          width: 40px;
          height: 3px;
          background: var(--lime);
          border-radius: 3px;
          margin: 16px auto 0;
        }

        /* ── GRID ALBUM ── */
        .album-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .album-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .album-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-hover);
          border-color: var(--lime-dim);
        }
        .album-card-img {
          height: 200px;
          overflow: hidden;
          background: var(--slate-100);
          flex-shrink: 0;
          position: relative;
        }
        .album-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .album-card:hover .album-card-img img {
          transform: scale(1.08);
        }
        .album-card-img .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(13,61,43,0.9);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 14px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .album-card-img .badge svg {
          width: 14px;
          height: 14px;
        }
        .album-card-img .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
          opacity: 0;
          transition: opacity var(--transition);
        }
        .album-card:hover .album-card-img .overlay {
          opacity: 1;
        }
        .album-card-body {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .album-card-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--forest);
          background: rgba(13,61,43,0.08);
          padding: 4px 12px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 12px;
          align-self: flex-start;
        }
        .album-card h3 {
          font-size: 19px;
          font-weight: 700;
          color: var(--slate-900);
          line-height: 1.4;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
          transition: color var(--transition);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .album-card:hover h3 { color: var(--forest); }
        .album-card p {
          font-size: 14px;
          color: var(--slate-500);
          line-height: 1.6;
          margin: 0 0 16px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .album-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--slate-500);
          margin-top: auto;
          border-top: 1px solid var(--slate-200);
          padding-top: 14px;
        }
        .album-meta svg {
          width: 14px;
          height: 14px;
          color: var(--forest);
        }
        .card-link {
          font-size: 14px;
          font-weight: 700;
          color: var(--forest);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: gap var(--transition), color var(--transition);
          margin-top: 12px;
        }
        .card-link:hover { gap: 12px; color: #0D5C3F; }

        /* ── LOADING ── */
        .spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 80px 0;
        }
        .spinner div {
          width: 48px;
          height: 48px;
          border: 4px solid var(--slate-200);
          border-top-color: var(--forest);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── EMPTY ── */
        .empty-state {
          text-align: center;
          padding: 80px 32px;
          background: white;
          border-radius: var(--radius-lg);
          border: 2px dashed var(--slate-200);
          color: var(--slate-400);
        }
        .empty-state svg { margin: 0 auto 16px; opacity: 0.4; display: block; }
        .empty-state p { font-size: 16px; font-weight: 600; margin: 0; }
        .empty-state span { font-size: 14px; color: var(--slate-500); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .album-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .section { padding: 64px 20px; }
          .navbar-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .btn-ghost { display: none; }
          .menu-toggle { display: flex; }
          .hero-inner { padding: 100px 20px 48px; }
          .hero-title { font-size: 36px; }
          .album-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 28px; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── MOBILE MENU ── */}
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
          {NAV_LINKS.map((item) => (
            <Link key={item} href={navHref(item)} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {item} <ChevronRightIcon size={18} />
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
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg" alt="Logo Kabupaten Toba" />
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
            <Link href="/login" className="btn-ghost">Login</Link>
            <Link href="/Warga" className="btn-primary">
              <Leaf size={14} /> Lapor
            </Link>
            <button className="menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Buka Menu">
              <Menu size={24} color="white" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <Images size={14} /> Dokumentasi
          </div>
          <h1 className="hero-title">
            Galeri <span>Kegiatan</span>
          </h1>
          <p className="hero-desc">
            Dokumentasi kegiatan dan program Dinas Lingkungan Hidup Kabupaten Toba dalam menjaga kelestarian alam dan kebersihan lingkungan.
          </p>
        </div>
      </header>

      {/* ── SECTION GALERI ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Album</span>
            <h2 className="section-title">Koleksi <em>Foto</em></h2>
            <p className="section-subtitle">
              Berbagai momen kegiatan lingkungan hidup yang didokumentasikan dalam album-album berikut.
            </p>
          </div>

          {loading ? (
            <div className="spinner"><div /></div>
          ) : albums.length === 0 ? (
            <div className="empty-state">
              <Images size={56} />
              <p>Belum ada album yang ditambahkan</p>
              <span>Pantau terus galeri ini untuk melihat dokumentasi kegiatan terbaru</span>
            </div>
          ) : (
            <>
              <div className="album-grid">
                {albums.map((album, i) => (
                  <div
                    key={album.id}
                    onClick={() => openAlbum(album)}
                    className="album-card animate-fade-up"
                    style={{ animationDelay: `${(i % 6) * 0.08}s` }}
                  >
                    <div className="album-card-img">
                      <img
                        src={album.coverUrl || FALLBACK_IMG}
                        alt={album.title}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <div className="overlay" />
                      <span className="badge">
                        <Images size={12} /> {album.photos?.length || 0}
                      </span>
                    </div>
                    <div className="album-card-body">
                      <span className="album-card-tag">Album</span>
                      <h3>{album.title}</h3>
                      <p>{album.description || 'Dokumentasi kegiatan lingkungan hidup.'}</p>
                      <div className="album-meta">
                        <Clock size={14} />
                        <span>{album.createdAt ? fmtDate(album.createdAt) : 'Tanggal tidak tersedia'}</span>
                      </div>
                      <span className="card-link">
                        Lihat Album <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-12">
                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-white rounded-xl font-bold text-sm transition-all hover:bg-forest-mid hover:shadow-lg active:scale-95">
                  <ArrowLeft size={16} /> Kembali ke Beranda
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}