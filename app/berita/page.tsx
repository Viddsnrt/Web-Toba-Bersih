"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Clock, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  Newspaper, Menu, X, MapPin, Phone, Mail, Facebook, Instagram, Leaf,
} from 'lucide-react';

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

const PENGUMUMAN_CATEGORIES = ['pengumuman', 'PENGUMUMAN', 'Pengumuman'];
const isPengumuman = (cat?: string) => PENGUMUMAN_CATEGORIES.includes(cat || '');
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=500';

const fmtDate = (v?: string) => {
  if (!v) return '';
  try { return new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return v; }
};
const stripHtml = (html?: string) => html?.replace(/<[^>]+>/g, '') ?? '';

type TabType = 'semua' | 'berita' | 'pengumuman';
const ITEMS_PER_PAGE = 9;

const NAV_LINKS = ['Tentang', 'Edukasi', 'Berita', 'Galeri'];
const navHref = (item: string) => {
  const key = item.toLowerCase();
  if (key === 'berita') return '/berita';
  if (key === 'edukasi') return '/edukasi';
  if (key === 'galeri') return '/galeri';
  return `/#${key}`;
};

export default function BeritaPage() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('semua');
  const [page, setPage]         = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const rawBase = process.env.NEXT_PUBLIC_API_URL || '';
      const BASE = rawBase ? rawBase.replace(/\/$/, '') + '/api' : '/api';
      try {
        const res = await axios.get(`${BASE}/posts`);
        const raw = res.data;
        const list: Post[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setPosts(list);
      } catch (err) {}
      setLoading(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setPage(1); }, [activeTab]);

  const filtered = posts.filter(p => {
    if (activeTab === 'berita') return !isPengumuman(p.category);
    if (activeTab === 'pengumuman') return isPengumuman(p.category);
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const featured   = paginated[0];
  const rest       = paginated.slice(1);

  const beritaCount     = posts.filter(p => !isPengumuman(p.category)).length;
  const pengumumanCount = posts.filter(p =>  isPengumuman(p.category)).length;

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

        /* ── FEATURED CARD ── */
        .featured-card {
          display: block;
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--slate-200);
          overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          margin-bottom: 40px;
          text-decoration: none;
        }
        .featured-card:hover {
          box-shadow: var(--shadow-hover);
          border-color: var(--lime-dim);
        }
        .featured-card-inner {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .featured-card-inner { flex-direction: row; align-items: stretch; }
        }
        .featured-card-img {
          position: relative;
          overflow: hidden;
          background: var(--slate-100);
          height: 260px;
          aspect-ratio: 4 / 3;
        }
        @media (min-width: 768px) {
          .featured-card-img {
            width: 50%;
            height: auto;
            aspect-ratio: unset;
            min-height: 320px;
            max-height: 420px;
          }
        }
        .featured-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 55%;
          transition: transform 0.6s ease;
        }
        .featured-card:hover .featured-card-img img { transform: scale(1.05); }
        .featured-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: var(--forest);
          color: white;
          padding: 6px 14px;
          border-radius: 100px;
        }
        .featured-card-body {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .featured-card-body { width: 50%; }
        }
        .featured-card-body h2 {
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 800;
          color: var(--slate-900);
          line-height: 1.3;
          margin: 0 0 16px;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color var(--transition);
        }
        .featured-card:hover .featured-card-body h2 { color: var(--forest); }
        .featured-card-body p {
          font-size: 15px;
          color: var(--slate-500);
          line-height: 1.7;
          margin: 0 0 24px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .featured-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* ── VARIAN AMBER (Pengumuman) ── */
        .berita-card-tag.tag-amber,
        .featured-badge.badge-amber {
          color: #B45309;
          background: rgba(245,158,11,0.12);
        }
        .berita-meta.meta-amber { color: #B45309; }
        .berita-meta.meta-amber svg { color: #B45309; }

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
        .footer-contact li svg { color: var(--lime); flex-shrink: 0; margin-top: 1px; }
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
          .berita-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
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

          {NAV_LINKS.map(item => (
            <Link
              key={item}
              href={navHref(item)}
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
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
              <Link
                key={item}
                href={navHref(item)}
                className="nav-link"
                style={item === 'Berita' ? { color: 'var(--lime)' } : undefined}
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">Login</Link>
            <Link href="/Warga" className="btn-primary">
              <Leaf size={14} /> Lapor
            </Link>
            <button
              className="menu-toggle"
              aria-label="Buka Menu"
              onClick={() => setMobileMenuOpen(true)}
            >
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
            <Newspaper size={14} /> Pusat Informasi
          </div>
          <h1 className="hero-title">
            Berita &amp; <span>Pengumuman</span>
          </h1>
          <p className="hero-desc">
            Informasi terkini seputar kegiatan, program, dan pengumuman resmi dari Dinas Lingkungan Hidup Kabupaten Toba.
          </p>
        </div>
      </header>

      {/* FILTER TABS (tanpa search bar) */}
      <div className="sticky top-20 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-1">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
         {(['semua', 'berita', 'pengumuman'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-bold text-sm capitalize transition-all ${
                activeTab === tab ? 'text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
              style={
                activeTab === tab
                  ? { background: tab === 'pengumuman' ? '#F59E0B' : 'var(--forest)' }
                  : undefined
              }
            >
              {tab === 'semua' ? 'Semua' : tab === 'berita' ? 'Berita' : 'Pengumuman'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="section" style={{ paddingTop: '48px' }}>
        <div className="section-inner">
          {loading ? (
            <div className="berita-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                  <div className="skeleton" style={{ height: '200px', borderRadius: 0 }} />
                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60px' }} />
                    <div className="skeleton" style={{ height: '20px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Newspaper size={48} />
              <p>Belum ada konten tersedia</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featured && (
                <Link href={`/berita/${featured.slug || featured.id}`} className="featured-card animate-fade-up">
                  <div className="featured-card-inner">
                    <div className="featured-card-img">
                      <img
                        src={featured.imageUrl || FALLBACK_IMG}
                        alt={featured.title}
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <span className={`featured-badge ${isPengumuman(featured.category) ? 'badge-amber' : ''}`}>Utama</span>
                    </div>
                    <div className="featured-card-body">
                      <span className={`berita-card-tag ${isPengumuman(featured.category) ? 'tag-amber' : ''}`}>
                        {featured.category || 'Berita'}
                      </span>
                      <h2>{featured.title}</h2>
                      <p>{stripHtml(featured.content)}</p>
                      <div className="featured-card-footer">
                        <p className={`berita-meta ${isPengumuman(featured.category) ? 'meta-amber' : ''}`} style={{ margin: 0, border: 'none', padding: 0 }}>
                          <Clock size={12} /> {fmtDate(featured.createdAt || featured.date)}
                        </p>
                        <span className="card-link" style={{ marginTop: 0 }}>
                          Baca Selengkapnya <ArrowRight size={15} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid Posts */}
              {rest.length > 0 && (
                <div className="berita-grid">
                  {rest.map((post, i) => (
                    <Link
                      key={post.id}
                      href={`/berita/${post.slug || post.id}`}
                      className="berita-card animate-fade-up"
                      style={{ animationDelay: `${(i % 6) * 0.1}s` }}
                    >
                      <div className="berita-card-img">
                        <img
                          src={post.imageUrl || FALLBACK_IMG}
                          alt={post.title}
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        />
                      </div>
                      <div className="berita-card-body">
                        <span className={`berita-card-tag ${isPengumuman(post.category) ? 'tag-amber' : ''}`}>
                          {post.category || 'Berita'}
                        </span>
                        <h3>{post.title}</h3>
                        <p>{stripHtml(post.content)}</p>
                        <div className={`berita-meta ${isPengumuman(post.category) ? 'meta-amber' : ''}`}>
                          <Clock size={14} /> {fmtDate(post.createdAt || post.date)}
                        </div>
                        <span className="card-link">
                          Baca Selengkapnya <ArrowRight size={15} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
              <p className="footer-desc">
                Dinas Lingkungan Hidup Kabupaten Toba berkomitmen menjaga kelestarian alam dan kebersihan lingkungan untuk generasi mendatang.
              </p>
            </div>
            <div className="footer-col">
              <h4>Tautan Cepat</h4>
              <ul className="footer-links">
                {NAV_LINKS.map((item) => (
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
                ].map((l) => (
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
