"use client";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  Leaf,
  Mail,
  Instagram,
  Facebook,
  MapPin,
  Phone,
  Menu,
  X,
  Share2,
  Twitter,
  MessageCircle,
} from "lucide-react";

interface Author {
  id?: number;
  fullName?: string;
  name?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  images?: string[];
  category?: string;
  slug?: string;
  createdAt?: string;
  date?: string;
  author?: string | Author | null;
  views?: number;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800";

const resolveAuthor = (a?: string | Author | null): string => {
  if (!a) return "";
  if (typeof a === "string") return a;
  if (typeof a === "object") return a.fullName || a.name || "";
  return String(a);
};

const fmtDate = (v?: string) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return v;
  }
};

const fmtDateShort = (v?: string) => {
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

const NAV_LINKS = ["Tentang", "Edukasi", "Berita", "Galeri"];
const navHref = (item: string) => {
  const key = item.toLowerCase();
  if (key === "berita") return "/berita";
  if (key === "edukasi") return "/edukasi";
  if (key === "galeri") return "/galeri";
  return `/#${key}`;
};

// ✅ Judul panjang otomatis pakai ukuran font lebih kecil supaya
// tidak jatuh ke banyak baris (5 baris → jadi 2-3 baris).
const titleSizeClass = (title: string) => {
  const len = title?.length || 0;
  if (len > 85) return "is-long";
  if (len > 55) return "is-medium";
  return "";
};

// ─── Collage Hero (FIXED) ──────────────────────────────────────
// ✅ Perbaikan:
//   1. object-contain → object-cover, supaya foto memenuhi kotak
//      tanpa menyisakan ruang kosong / background abu-abu.
//   2. Kasus 2 foto: dulu hanya menampilkan list[0], sekarang
//      kedua foto benar-benar ditampilkan berdampingan.
//   3. Semua kotak konsisten pakai helper ImgBox agar seragam
//      dengan pola yang sudah dipakai di halaman Edukasi.
function CollageHero({ imgs }: { imgs: string[] }) {
  const list = imgs.slice(0, 5);
  const count = list.length;

  const ImgBox = ({ src }: { src: string }) => (
    <div className="w-full h-full overflow-hidden">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_IMG;
        }}
      />
    </div>
  );

  if (count === 0) {
    return (
      <div className="w-full overflow-hidden" style={{ height: 420 }}>
        <ImgBox src={FALLBACK_IMG} />
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="w-full overflow-hidden" style={{ height: 420 }}>
        <ImgBox src={list[0]} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5" style={{ height: 420 }}>
        {list.map((src, i) => (
          <ImgBox key={i} src={src} />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5" style={{ height: 380 }}>
        <ImgBox src={list[0]} />
        <div className="grid grid-rows-2 gap-0.5">
          {list.slice(1).map((src, i) => (
            <ImgBox key={i} src={src} />
          ))}
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5" style={{ height: 380 }}>
        {list.map((src, i) => (
          <ImgBox key={i} src={src} />
        ))}
      </div>
    );
  }

  // 5 gambar
  return (
    <div
      className="grid gap-0.5"
      style={{
        height: 400,
        gridTemplateColumns: "2fr 1fr 1fr",
        gridTemplateRows: "60% 40%",
      }}
    >
      <div style={{ gridRow: "1 / 2", gridColumn: "1 / 2" }}>
        <ImgBox src={list[0]} />
      </div>
      <div style={{ gridRow: "1 / 2", gridColumn: "2 / 3" }}>
        <ImgBox src={list[1]} />
      </div>
      <div style={{ gridRow: "1 / 2", gridColumn: "3 / 4" }}>
        <ImgBox src={list[2]} />
      </div>
      <div style={{ gridRow: "2 / 3", gridColumn: "1 / 2" }}>
        <ImgBox src={list[3]} />
      </div>
      <div style={{ gridRow: "2 / 3", gridColumn: "2 / 4" }}>
        <ImgBox src={list[4]} />
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────
export default function BeritaDetailPage() {
  const params = useParams();
  const slugOrId = params?.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!slugOrId) return;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const load = async () => {
      setLoading(true);
      try {
        const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
        const BASE = rawBase ? rawBase.replace(/\/$/, "") + "/api" : "/api";

        let single: Post | null = null;

        try {
          const res = await axios.get(`${BASE}/posts/${slugOrId}`);
          const raw = res.data;
          single = raw?.data ?? raw;
        } catch {
          const allRes = await axios.get(`${BASE}/posts`);
          const allList: Post[] = Array.isArray(allRes.data)
            ? allRes.data
            : allRes.data?.data ?? [];
          single =
            allList.find(
              (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId
            ) ?? null;
        }

        if (single) {
          setPost(single);
          const allRes = await axios.get(`${BASE}/posts`);
          const allList: Post[] = Array.isArray(allRes.data)
            ? allRes.data
            : allRes.data?.data ?? [];
          setRecentPosts(allList.filter((p) => p.id !== single!.id).slice(0, 7));
          setRelatedPosts(
            allList
              .filter((p) => p.id !== single!.id && p.category === single!.category)
              .slice(0, 3)
          );
        }
      } catch (err) {
        console.error("[BeritaDetail] Error:", err);
      }
      setLoading(false);
    };

    load();
  }, [slugOrId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F8FAF7; margin: 0; }
          .skeleton {
            background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 12px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div className="min-h-screen pt-28 px-6" style={{ background: "#F8FAF7" }}>
          <div className="max-w-6xl mx-auto animate-pulse space-y-6">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-80 rounded-3xl" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-4" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F8FAF7" }}
      >
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-xl font-bold text-slate-700 mb-4">
            Berita tidak ditemukan
          </p>
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: "#0D3D2B", color: "white" }}
          >
            <ArrowLeft size={16} /> Kembali ke Berita
          </Link>
        </div>
      </div>
    );
  }

  const title = post.title;
  const authorName = resolveAuthor(post.author);
  const dateStr = (post as any).createdAt || post.date;
  const collageImgs: string[] = post.images?.length
    ? post.images
    : post.imageUrl
    ? [post.imageUrl]
    : [FALLBACK_IMG];

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    currentUrl
  )}`;
  const twShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    post.title
  )}&url=${encodeURIComponent(currentUrl)}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(
    post.title + " " + currentUrl
  )}`;

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
          --slate-800: #1E293B;
          --slate-700: #334155;
          --slate-600: #475569;
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

        /* ── HERO DETAIL ── */
        .hero-detail {
          position: relative;
          padding: 100px 32px 48px;
          background: var(--forest);
          overflow: hidden;
        }
        .hero-detail-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1600');
          background-size: cover;
          background-position: center;
          opacity: 0.15;
        }
        .hero-detail-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(13,61,43,0.9) 0%, rgba(13,61,43,0.4) 100%);
        }
        .hero-detail-inner {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 24px;
        }
        .breadcrumb a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color var(--transition);
        }
        .breadcrumb a:hover { color: white; }
        .breadcrumb svg { color: rgba(255,255,255,0.3); }
        .hero-detail-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--lime);
          background: rgba(74,222,128,0.12);
          padding: 4px 14px;
          border-radius: 100px;
          margin-bottom: 16px;
        }
        .hero-detail-title {
          font-size: clamp(28px, 3.6vw, 52px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: white;
          max-width: 1000px;
          margin: 0 0 16px;
        }
        .hero-detail-title.is-long {
          font-size: clamp(28px, 3.4vw, 44px);
        }
        .hero-detail-title.is-medium {
          font-size: clamp(30px, 3.8vw, 46px);
        }
        .hero-detail-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 500;
        }
        .hero-detail-meta svg { color: var(--lime); }

        /* ── MAIN CONTENT ── */
        .detail-section {
          padding: 64px 32px 80px;
          background: var(--cream);
        }
        .detail-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 48px;
        }
        .detail-article {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }
        .detail-media {
          width: 100%;
          max-height: 420px;
          overflow: hidden;
          background: var(--slate-100);
        }
        .detail-body {
          padding: 40px;
        }

        /* ── PROSE STYLING ── */
        .detail-body .prose {
          font-family: var(--font);
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--slate-800);
          max-width: 100%;
        }
        .detail-body .prose p {
          margin: 0 0 1.25rem 0;
        }
        .detail-body .prose h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--forest);
          margin: 2.5rem 0 1rem 0;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .detail-body .prose h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--forest-mid);
          margin: 2rem 0 0.75rem 0;
          line-height: 1.4;
        }
        .detail-body .prose h4 {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--slate-700);
          margin: 1.5rem 0 0.5rem 0;
        }
        .detail-body .prose ul {
          list-style: disc;
          padding-left: 1.75rem;
          margin: 0 0 1.25rem 0;
        }
        .detail-body .prose ol {
          list-style: decimal;
          padding-left: 1.75rem;
          margin: 0 0 1.25rem 0;
        }
        .detail-body .prose li {
          margin-bottom: 0.5rem;
        }
        .detail-body .prose li > ul,
        .detail-body .prose li > ol {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .detail-body .prose blockquote {
          border-left: 4px solid var(--lime);
          padding: 0.75rem 1.5rem;
          margin: 1.5rem 0;
          background: var(--cream);
          border-radius: var(--radius-sm);
          font-style: italic;
          color: var(--slate-600);
        }
        .detail-body .prose blockquote p {
          margin: 0;
        }
        .detail-body .prose strong {
          font-weight: 700;
          color: var(--slate-900);
        }
        .detail-body .prose a {
          color: var(--forest);
          text-decoration: underline;
          font-weight: 500;
        }
        .detail-body .prose a:hover {
          color: var(--forest-mid);
        }
        .detail-body .prose img {
          max-width: 100%;
          border-radius: var(--radius-md);
          margin: 1.5rem 0;
          box-shadow: var(--shadow-card);
        }
        .detail-body .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.95rem;
        }
        .detail-body .prose table th,
        .detail-body .prose table td {
          border: 1px solid var(--slate-200);
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .detail-body .prose table th {
          background: var(--slate-100);
          font-weight: 700;
          color: var(--slate-700);
        }
        .detail-body .prose table tr:nth-child(even) {
          background: var(--cream);
        }
        .detail-body .prose hr {
          border: 0;
          border-top: 2px solid var(--slate-200);
          margin: 2.5rem 0;
        }

        .detail-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
          padding: 12px 24px;
          background: var(--forest);
          color: white;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all var(--transition);
        }
        .detail-back:hover {
          background: var(--forest-mid);
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .detail-back svg { transition: transform var(--transition); }
        .detail-back:hover svg { transform: translateX(-3px); }

        /* ── SIDEBAR ── */
        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .sidebar-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--slate-200);
          padding: 28px;
          box-shadow: var(--shadow-card);
          position: sticky;
          top: 100px;
        }
        .sidebar-card h3 {
          font-size: 16px;
          font-weight: 800;
          color: var(--slate-900);
          margin: 0 0 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--slate-200);
        }
        .sidebar-item {
          display: flex;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid var(--slate-100);
          transition: background var(--transition);
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: inherit;
        }
        .sidebar-item:last-child { border-bottom: none; }
        .sidebar-item:hover { background: var(--cream); }
        .sidebar-item-img {
          width: 72px;
          height: 56px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--slate-100);
        }
        .sidebar-item-img img,
        .sidebar-item-img video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition);
        }
        .sidebar-item:hover .sidebar-item-img img {
          transform: scale(1.05);
        }
        .sidebar-item-content {
          flex: 1;
        }
        .sidebar-item-content h5 {
          font-size: 14px;
          font-weight: 700;
          color: var(--slate-900);
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sidebar-item-content span {
          font-size: 12px;
          font-weight: 700;
          color: var(--forest);
        }
        .sidebar-all-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px 20px;
          background: var(--forest);
          color: white;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          transition: all var(--transition);
        }
        .sidebar-all-link:hover {
          background: var(--forest-mid);
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        .sidebar-all-link svg { transition: transform var(--transition); }
        .sidebar-all-link:hover svg { transform: translateX(3px); }

        /* ── SHARE BUTTONS ── */
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          transition: all var(--transition);
          border: none;
          cursor: pointer;
        }
        .share-btn:hover { transform: translateY(-2px); }
        .share-btn-facebook { background: #1877F2; color: white; }
        .share-btn-facebook:hover { background: #0d65d9; }
        .share-btn-twitter { background: #000000; color: white; }
        .share-btn-twitter:hover { background: #1a1a1a; }
        .share-btn-wa { background: #25D366; color: white; }
        .share-btn-wa:hover { background: #1da851; }
        .share-btn-copy { background: var(--slate-100); color: var(--slate-700); }
        .share-btn-copy:hover { background: var(--slate-200); }
        .share-btn-copy.copied { background: var(--lime); color: white; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .detail-inner { grid-template-columns: 1fr; gap: 32px; }
          .detail-sidebar { order: -1; }
          .sidebar-card { position: static; }
        }
        @media (max-width: 768px) {
          .navbar-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .btn-ghost { display: none; }
          .menu-toggle { display: flex; }
          .hero-detail { padding: 80px 20px 32px; }
          .detail-section { padding: 40px 20px; }
          .detail-body { padding: 24px; }
          .share-buttons { flex-wrap: wrap; }
        }
        @media (max-width: 480px) {
          .hero-detail-title { font-size: 28px; }
          .detail-body { padding: 20px; }
          .detail-body .prose { font-size: 1rem; }
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

      {/* ── HERO DETAIL ── */}
      <header className="hero-detail">
        <div className="hero-detail-bg" />
        <div className="hero-detail-overlay" />
        <div className="hero-detail-inner">
          <nav className="breadcrumb">
            <Link href="/">Beranda</Link>
            <ChevronRight size={14} />
            <Link href="/berita">Berita</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{title}</span>
          </nav>
          <span className="hero-detail-tag">
            <Leaf size={12} style={{ display: 'inline', marginRight: 6 }} />
            Berita Terkini
          </span>
          <h1 className={`hero-detail-title animate-fade-up delay-100 ${titleSizeClass(title)}`}>{title}</h1>
          <div className="hero-detail-meta animate-fade-up delay-200">
            <Clock size={16} />
            <span>{fmtDate(dateStr)}</span>
            {authorName && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Oleh <span style={{ color: 'white', fontWeight: 600 }}>{authorName}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <section className="detail-section">
        <div className="detail-inner">
          {/* Artikel */}
          <article className="detail-article animate-fade-up delay-100">
            <div className="detail-media">
              <CollageHero imgs={collageImgs} />
            </div>
            <div className="detail-body">
              {/* Category badge */}
              {post.category && (
                <span
                  className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-5"
                  style={{
                    background: 'rgba(13,61,43,0.08)',
                    color: 'var(--forest)',
                  }}
                >
                  {post.category}
                </span>
              )}

              {/* Content */}
              {post.content?.trim().startsWith("<") ? (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <div className="prose">
                  {post.content
                    ?.split("\n")
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              )}

              {/* Share buttons */}
              <div className="mt-10 pt-6 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Share2 size={16} /> Bagikan artikel ini:
                </p>
                <div className="flex flex-wrap gap-2 share-buttons">
                  <a
                    href={fbShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-btn-facebook"
                  >
                    <Facebook size={14} /> Facebook
                  </a>
                  <a
                    href={twShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-btn-twitter"
                  >
                    <Twitter size={14} /> Twitter
                  </a>
                  <a
                    href={waShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-btn-wa"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <button
                    onClick={handleCopy}
                    className={`share-btn share-btn-copy ${copied ? 'copied' : ''}`}
                  >
                    {copied ? '✓ Tersalin!' : '🔗 Salin Link'}
                  </button>
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b-2 border-lime-500">
                    Berita Terkait
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {relatedPosts.map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/berita/${rp.slug || rp.id}`}
                        className="group rounded-xl overflow-hidden border border-slate-200 hover:border-lime-300 hover:shadow-md transition-all"
                      >
                        <div className="h-40 overflow-hidden bg-slate-100">
                          <img
                            src={rp.imageUrl || FALLBACK_IMG}
                            alt={rp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_IMG;
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                            <Clock size={11} />
                            {fmtDateShort((rp as any).createdAt || rp.date)}
                          </p>
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-forest transition-colors line-clamp-2 leading-snug">
                            {rp.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back button */}
              <div className="flex justify-end mt-8">
                <Link
                  href="/berita"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest text-white rounded-xl font-semibold text-sm transition-all hover:bg-forest-mid hover:-translate-y-0.5 hover:shadow-md"
                >
                  <ArrowLeft size={16} />
                  Kembali ke semua berita
                </Link>
              </div>
            </div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="detail-sidebar animate-fade-up delay-200">
            <div className="sidebar-card">
              <h3>Berita Terkini</h3>
              {recentPosts.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>Tidak ada berita lain</p>
              ) : (
                <>
                  {recentPosts.slice(0, 6).map((rp) => {
                    const isActive = rp.id === post.id;
                    const rpDate = (rp as any).createdAt || rp.date;
                    return (
                      <Link
                        key={rp.id}
                        href={`/berita/${rp.slug || rp.id}`}
                        className={`sidebar-item ${isActive ? 'bg-cream' : ''}`}
                        style={{
                          background: isActive ? 'var(--cream)' : 'transparent',
                          borderColor: isActive ? 'var(--lime-dim)' : 'var(--slate-100)',
                        }}
                      >
                        <div className="sidebar-item-img">
                          <img
                            src={rp.imageUrl || FALLBACK_IMG}
                            alt={rp.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_IMG;
                            }}
                          />
                        </div>
                        <div className="sidebar-item-content">
                          <h5 style={{ color: isActive ? 'var(--forest)' : 'var(--slate-900)' }}>
                            {rp.title}
                          </h5>
                          <span>{fmtDateShort(rpDate)}</span>
                        </div>
                      </Link>
                    );
                  })}
                  <Link href="/berita" className="sidebar-all-link">
                    Lihat Semua Berita <ChevronRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </>
  );
}