"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Footer from "../components/Footer";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Calendar,
  Leaf,
  Mail,
  Instagram,
  Facebook,
  MapPin,
  Phone,
  Menu,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  category?: string;
  slug?: string;
  createdAt?: string;
  date?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const stripHtml = (html?: string) => html?.replace(/<[^>]+>/g, "") ?? "";
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

export default function BeritaPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
    const BASE = rawBase ? rawBase.replace(/\/$/, "") + "/api" : "/api";

    try {
      const res = await axios.get(`${BASE}/posts`);
      const allPosts = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const beritaPosts = allPosts.filter((p: Post) => {
        const cat = p.category || "";
        return !["pengumuman", "PENGUMUMAN", "Pengumuman"].includes(cat);
      });
      setPosts(beritaPosts);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

        /* ── GRID BERITA ── */
        .berita-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .berita-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          display: flex;
          flex-direction: column;
        }
        .berita-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
          border-color: var(--lime-dim);
        }
        .berita-card-img {
          height: 200px;
          overflow: hidden;
          background: var(--slate-100);
          flex-shrink: 0;
        }
        .berita-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .berita-card:hover .berita-card-img img {
          transform: scale(1.07);
        }
        .berita-card-body {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .berita-card-tag {
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
        .berita-card h3 {
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
        .berita-card:hover h3 { color: var(--forest); }
        .berita-card p {
          font-size: 14px;
          color: var(--slate-500);
          line-height: 1.65;
          margin: 0 0 16px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .berita-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--slate-500);
          margin-bottom: 16px;
          border-top: 1px solid var(--slate-200);
          padding-top: 14px;
        }
        .berita-meta svg {
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
          margin-top: auto;
        }
        .card-link:hover { gap: 10px; color: #0D5C3F; }

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

        /* ── EMPTY STATE ── */
        .empty-state {
          text-align: center;
          padding: 64px 32px;
          color: var(--slate-400);
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

        /* ── SECTION FOOTER ── */
        .section-footer {
          display: flex;
          justify-content: center;
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

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
        }
        @media (max-width: 768px) {
          .section { padding: 64px 20px; }
          .navbar-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .btn-ghost { display: none; }
          .menu-toggle { display: flex; }
          .hero-inner { padding: 100px 20px 48px; }
          .hero-title { font-size: 36px; }
          .berita-grid { grid-template-columns: 1fr; }
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
            <Leaf size={14} /> Berita Terkini
          </div>
          <h1 className="hero-title">
            Berita <span>Lingkungan</span>
          </h1>
          <p className="hero-desc">
            Dapatkan informasi terkini tentang kegiatan dan inisiatif Dinas Lingkungan Hidup Kabupaten Toba dalam menjaga kelestarian alam.
          </p>
        </div>
      </header>

      {/* ── SECTION BERITA ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header center">
            <span className="section-eyebrow">Informasi</span>
            <h2 className="section-title">Berita <em>Terbaru</em></h2>
            <p className="section-subtitle">
              Berbagai kegiatan, program, dan kebijakan terkait lingkungan hidup di Kabupaten Toba.
            </p>
          </div>

          {loading ? (
            <div className="spinner">
              <div />
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>Belum ada berita tersedia.</p>
            </div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="berita-grid"
              >
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    variants={fadeUp}
                    className="berita-card"
                  >
                    <div className="berita-card-img">
                      <img
                        src={post.imageUrl || FALLBACK_IMG}
                        alt={post.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                    </div>
                    <div className="berita-card-body">
                      <span className="berita-card-tag">Berita</span>
                      <h3>{post.title}</h3>
                      <p>{stripHtml(post.content)}</p>
                      <div className="berita-meta">
                        <Calendar size={14} />
                        <span>{fmtDate(post.createdAt)}</span>
                      </div>
                      <Link
                        href={`/berita/${post.slug || post.id}`}
                        className="card-link"
                      >
                        Baca Selengkapnya <ArrowRight size={15} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <div className="section-footer">
                <Link href="/#berita" className="btn-section">
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