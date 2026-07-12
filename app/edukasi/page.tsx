"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Leaf, Mail, Instagram, Facebook, MapPin, Phone, Clock, Menu, X } from "lucide-react";

interface EducationPost {
  id: number;
  judul?: string;
  title?: string;
  deskripsi?: string | null;
  content?: string | null;
  media_url?: string;
  media_type?: string;
  mediaUrl?: string;
  mediaType?: string;
}

const getTitle    = (e: EducationPost) => e.judul    || e.title    || "(Tanpa Judul)";
const getDesc     = (e: EducationPost) => e.deskripsi || e.content  || "";
const getMediaUrl = (e: EducationPost) => e.mediaUrl  || e.media_url || "";
const getMediaType= (e: EducationPost) => (e.mediaType || e.media_type || "IMAGE").toUpperCase();

const FALLBACK_IMG = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600";

const NAV_LINKS = ["Tentang", "Edukasi", "Berita", "Galeri"];
const navHref = (item: string) => {
  const key = item.toLowerCase();
  if (key === "berita") return "/berita";
  if (key === "edukasi") return "/edukasi";
  if (key === "galeri") return "/galeri";
  return `/#${key}`;
};

export default function EdukasiListPage() {
  const [items, setItems]     = useState<EducationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
        const BASE = rawBase ? rawBase.replace(/\/$/, "") + "/api" : "/api";
        const res = await axios.get(`${BASE}/edukasi`);
        const raw = res.data;
        const list: EducationPost[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        setItems(list);
      } catch (err) {
        console.error("[edukasi] FETCH ERROR:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const stripHtml = (html?: string) => html?.replace(/<[^>]+>/g, "") ?? "";

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
          background: rgba(6, 78, 59, 0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.08);
        }
        .navbar.top {
          background: transparent;
        }
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
          position: relative;
          min-height: 480px;
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

        /* ── SECTION BASE ── */
        .section { padding: 80px 32px; }
        .section-inner { max-width: 1280px; margin: 0 auto; }
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
        }
        .section-header { margin-bottom: 64px; }
        .section-header.center { text-align: center; }
        .section-header.center .section-eyebrow { justify-content: center; }
        .section-header.center .section-eyebrow::before { display: none; }
        .section-header.center .section-title::after {
          content: '';
          display: block;
          width: 40px;
          height: 3px;
          background: var(--lime);
          border-radius: 3px;
          margin: 16px auto 0;
        }
        .section-header.center .section-subtitle { margin: 0 auto; }

        /* ── EDUKASI GRID ── */
        .edu-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .edu-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          display: flex;
          flex-direction: column;
        }
        .edu-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
          border-color: var(--lime-dim);
        }
        .edu-card-media {
          overflow: hidden;
          height: 240px;
          background: var(--slate-100);
          flex-shrink: 0;
        }
        .edu-card-media img,
        .edu-card-media video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .edu-card:hover .edu-card-media img {
          transform: scale(1.07);
        }
        .edu-card-body {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .card-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--forest);
          background: rgba(13,61,43,0.08);
          padding: 4px 10px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 14px;
          align-self: flex-start;
        }
        .edu-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--slate-900);
          line-height: 1.45;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
          transition: color var(--transition);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .edu-card:hover h3 { color: var(--forest); }
        .edu-card p {
          font-size: 14px;
          color: var(--slate-500);
          line-height: 1.65;
          margin: 0 0 24px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          margin-top: auto;
        }
        .card-link:hover { gap: 10px; color: #0D5C3F; }

        /* ── SECTION FOOTER ROW ── */
        .section-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 48px;
        }
        .btn-section {
          font-size: 14px;
          font-weight: 700;
          padding: 13px 28px;
          border-radius: 12px;
          background: var(--forest);
          color: white;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
        }
        .btn-section:hover {
          background: var(--forest-mid);
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .btn-section svg { transition: transform var(--transition); }
        .btn-section:hover svg { transform: translateX(3px); }

        /* ── EMPTY STATE ── */
        .empty-state {
          text-align: center;
          padding: 64px 32px;
          color: var(--slate-400);
          grid-column: 1 / -1;
        }
        .empty-state svg {
          margin: 0 auto 16px;
          opacity: 0.3;
          display: block;
        }
        .empty-state p {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }

        /* ── SKELETON ── */
        .skeleton {
          background: linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── FOOTER ── */
        .footer {
          background: var(--slate-900);
          color: white;
          padding: 80px 32px 40px;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          gap: 48px;
          margin-bottom: 64px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .footer-logo img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .footer-logo-name {
          font-size: 18px;
          font-weight: 800;
          color: white;
        }
        .footer-logo-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lime);
          margin-top: 2px;
        }
        .footer-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
        }
        .footer-col h4 {
          font-size: 14px;
          font-weight: 800;
          color: white;
          margin: 0 0 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .footer-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-links a {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color var(--transition);
          font-weight: 500;
        }
        .footer-links a:hover { color: var(--lime); }
        .footer-links a svg { opacity: 0.4; transition: opacity var(--transition), transform var(--transition); }
        .footer-links a:hover svg { opacity: 1; transform: translateX(3px); }
        .footer-contact {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .footer-contact li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          line-height: 1.6;
        }
        .footer-contact li svg {
          color: var(--lime);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .footer-socials {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .footer-social {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: all var(--transition);
        }
        .footer-social:hover {
          background: var(--forest-mid);
          color: white;
          border-color: var(--forest-mid);
          transform: translateY(-2px);
        }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-bottom p {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }
        .footer-bottom-links a {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color var(--transition);
        }
        .footer-bottom-links a:hover { color: var(--lime); }

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
        .btn-ghost-green:hover {
          background: var(--slate-100);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .section { padding: 64px 20px; }
          .navbar-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .btn-ghost { display: none; }
          .menu-toggle { display: flex; }
          .hero-inner { padding: 100px 20px 48px; }
          .hero-title { font-size: 36px; }
          .edu-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .hero-ctas { flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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
            <Leaf size={14} /> Edukasi Lingkungan
          </div>
          <h1 className="hero-title">
            Materi <span>Edukasi</span> Lingkungan
          </h1>
          <p className="hero-desc">
            Informasi dan materi pembelajaran seputar lingkungan hidup untuk meningkatkan kesadaran masyarakat dalam menjaga kelestarian alam.
          </p>
        </div>
      </header>

      {/* ── GRID EDUKASI ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Pembelajaran</span>
            <h2 className="section-title">Koleksi <em>Edukasi</em></h2>
            <p className="section-subtitle">
              Berbagai materi edukasi tentang lingkungan hidup yang dapat Anda pelajari untuk mendukung kebersihan dan kelestarian alam.
            </p>
          </div>

          {loading ? (
            <div className="edu-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                  <div className="skeleton" style={{ height: '240px' }} />
                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60px' }} />
                    <div className="skeleton" style={{ height: '20px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>Belum ada materi edukasi tersedia.</p>
            </div>
          ) : (
            <>
              <div className="edu-grid">
                {items.map((edu, i) => {
                  const title     = getTitle(edu);
                  const desc      = getDesc(edu);
                  const mediaUrl  = getMediaUrl(edu);
                  const mediaType = getMediaType(edu);
                  return (
                    <div
                      key={edu.id}
                      className="edu-card animate-fade-up"
                      style={{ animationDelay: `${(i % 6) * 0.1}s` }}
                    >
                      <div className="edu-card-media">
                        {mediaType === 'VIDEO' ? (
                          <video src={mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img
                            src={mediaUrl || FALLBACK_IMG}
                            alt={title}
                            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          />
                        )}
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
                })}
              </div>
              <div className="section-footer">
                <Link href="/#edukasi" className="btn-section">
                  <ArrowLeft size={16} /> Kembali ke Beranda
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

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