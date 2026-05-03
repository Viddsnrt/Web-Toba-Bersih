"use client";
import {
  Menu, X, Truck, FileText, LogOut, ChevronLeft,
  LayoutDashboard, Database, ChevronDown, ChevronUp,
  Users, Map, Calendar, ClipboardList, AlertCircle,
  Newspaper, Image as ImageIcon, Settings, Route, GraduationCap
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  href: string;
  badge?: number;
}

interface GroupConfig {
  group: string;
  id: string;
  icon: React.ElementType;
  items: NavItemConfig[];
}

// ✅ Props hanya onLogout — tidak ada activeMenu/setActiveMenu
interface SidebarProps {
  onLogout: () => void;
}

// ─── KOMPONEN ─────────────────────────────────────────────────────────────────
export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'menu-utama': true,
    'data-operasional': false,
    'manajemen-tugas': false,
    'manajemen-konten': false,
    'pengaturan': false,
  });

  // Tutup menu mobile saat resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kunci scroll body saat mobile menu terbuka
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  // ✅ Auto-buka group yang berisi halaman aktif — pakai useEffect di level atas
  const menuConfig: GroupConfig[] = useMemo(() => [
    {
      group: 'Menu Utama',
      id: 'menu-utama',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard, color: 'from-emerald-400 to-green-600',  href: '/admin' },
        { id: 'peta-sampah',  label: 'Peta Operasional',   icon: Map,             color: 'from-emerald-500 to-teal-500',   href: '/admin/PetaSampah' },
      ],
    },
    {
      group: 'Master Data',
      id: 'data-operasional',
      icon: Database,
      items: [
        { id: 'data-supir',      label: 'Data Supir',       icon: Users,     color: 'from-sky-400 to-indigo-600',   href: '/admin/Supir' },
        { id: 'data-truk',       label: 'Data Truk',        icon: Truck,     color: 'from-amber-400 to-orange-600', href: '/admin/Truk' },
        { id: 'data-wilayah',    label: 'Data Wilayah',     icon: Map,       color: 'from-teal-400 to-green-600',   href: '/admin/Wilayah' },
        { id: 'manajemen-rute',  label: 'Manajemen Rute',   icon: Route,     color: 'from-purple-400 to-pink-600',  href: '/admin/ManajemenRute' },
      ],
    },
    {
      group: 'Manajemen Tugas',
      id: 'manajemen-tugas',
      icon: Calendar,
      items: [
        { id: 'tugas-harian', label: 'Tugas Harian', icon: ClipboardList, color: 'from-green-300 to-emerald-500', href: '/admin/Penugasan/tugas-harian' },
        { id: 'tugas-aduan',  label: 'Tugas Aduan',  icon: AlertCircle,   color: 'from-lime-300 to-green-500',   href: '/admin/Penugasan/tugas-aduan' },
      ],
    },
    {
      group: 'Manajemen Konten',
      id: 'manajemen-konten',
      icon: Newspaper,
      items: [
        { id: 'berita',  label: 'Kelola Berita', icon: Newspaper,    color: 'from-green-500 to-emerald-600', href: '/admin/berita' },
        { id: 'galeri',  label: 'Galeri',         icon: ImageIcon,    color: 'from-teal-500 to-emerald-600',  href: '/admin/galeri' },
        { id: 'edukasi', label: 'Edukasi',        icon: GraduationCap, color: 'from-cyan-500 to-blue-600',   href: '/admin/edukasi' },
      ],
    },
    {
      group: 'Pengaturan',
      id: 'pengaturan',
      icon: Settings,
      items: [
        { id: 'pengaturan', label: 'Pengaturan', icon: Settings, color: 'from-slate-500 to-gray-600', href: '/admin/pengaturan' },
      ],
    },
  ], []);

  // ✅ Auto-buka group aktif — benar: useEffect di level komponen, bukan di dalam render
  useEffect(() => {
    menuConfig.forEach((group) => {
      const hasActive = group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
      if (hasActive) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, menuConfig]);

  const isExpanded = !isCollapsed;

  // ── NAV ITEM ───────────────────────────────────────────────────────────────
  const NavItem = ({ item, isSub = false }: { item: NavItemConfig; isSub?: boolean }) => {
    // ✅ Active: exact match untuk /admin, startsWith untuk yang lain
    const isActive = item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link
        href={item.href}
        onClick={() => { if (isMobileOpen) setIsMobileOpen(false); }}
        className={`w-full flex items-center group relative transition-all duration-200 rounded-xl mb-1
          ${isExpanded ? 'px-3 py-2' : 'justify-center py-2'}
          ${isActive ? 'bg-white/10 text-white' : 'text-emerald-200 hover:bg-green-500/10 hover:text-white'}`}
      >
        {isActive && (
          <div className="absolute left-0 w-1 h-5 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
        )}
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className={`p-2 rounded-lg shrink-0 transition-all
            ${isActive
              ? `bg-gradient-to-br ${item.color} text-white shadow-lg shadow-black/20`
              : 'bg-green-900/50 group-hover:bg-green-800/70'}`}
          >
            <item.icon size={isSub ? 15 : 18} />
          </div>
          {isExpanded && (
            <div className="flex justify-between items-center w-full min-w-0">
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
              {item.badge ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                  {item.badge}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </Link>
    );
  };

  // ── GROUP ITEM ─────────────────────────────────────────────────────────────
  // ✅ Tidak ada useEffect di dalam komponen ini — dipindah ke level atas
  const GroupItem = ({ group }: { group: GroupConfig }) => {
    const isOpen = !!openGroups[group.id];
    const hasActiveChild = group.items.some(
      (item) => item.href === '/admin'
        ? pathname === '/admin'
        : pathname === item.href || pathname.startsWith(item.href + '/')
    );

    const toggle = () =>
      setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }));

    return (
      <div className="mb-2">
        <button
          onClick={toggle}
          className={`w-full flex items-center justify-between transition-all duration-200 rounded-xl mb-1
            ${isExpanded ? 'px-3 py-2' : 'justify-center py-2'}
            ${hasActiveChild ? 'text-white' : 'text-emerald-200 hover:bg-green-500/10 hover:text-white'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 transition-all
              ${hasActiveChild ? 'bg-green-800/70' : 'bg-green-900/50'}`}
            >
              <group.icon size={18} />
            </div>
            {isExpanded && (
              <span className="text-sm font-semibold truncate">{group.group}</span>
            )}
          </div>
          {isExpanded && (
            <div className="text-emerald-300 shrink-0 ml-2">
              {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          )}
        </button>

        {/* Accordion */}
        {isExpanded && (
          <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-8 pl-4 border-l border-white/10 space-y-0.5 mt-1">
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} isSub />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Tombol hamburgher mobile */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label="Buka menu"
          className="fixed bottom-6 right-6 md:hidden z-50 p-3 bg-green-600 text-white rounded-full shadow-xl active:scale-95 transition-transform"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Backdrop mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#064E3B' }}
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.3)]
          ${isCollapsed ? 'w-[72px]' : 'w-[280px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 relative flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-green-600 rounded-xl blur opacity-20" />
            <div className="w-11 h-11 bg-white/10 p-1.5 rounded-xl relative">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg"
                alt="Logo DLH Toba"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <h1 className="text-xs font-black text-white leading-tight uppercase truncate">
                DLH Kabupaten Toba
              </h1>
              <p className="text-[9px] font-bold text-emerald-400/80 tracking-wider uppercase">
                Administrator
              </p>
            </div>
          )}

          {/* Tombol tutup mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto md:hidden p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors shrink-0"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>

          {/* Tombol collapse desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-emerald-700 hover:bg-emerald-600 rounded-full p-1 text-white shadow-md transition-all hidden md:flex"
          >
            <ChevronLeft size={13} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          {menuConfig.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}
        </nav>

        {/* Footer logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-emerald-200 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-95
              ${!isExpanded ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {isExpanded && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.25); }
      `}</style>
    </>
  );
}