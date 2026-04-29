"use client";
import { 
  Menu, X, Truck, FileText, Archive, Newspaper, Image as ImageIcon, Settings, LogOut, 
  ChevronLeft, LayoutDashboard, User, Database, ChevronDown, 
  ChevronUp, Users, Map, Calendar, ClipboardList, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ penugasan: true, data: true });

  // --- LOGIKA RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsCollapsed(false); 
      } else if (width < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      if (width >= 768) setIsMobileOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isExpanded = isMobileOpen || (isHovered || !isCollapsed);

  const menuConfig = useMemo(() => [
    {
      group: "Menu Utama",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-emerald-400 to-green-600' },
        { id: 'daftar', label: 'Laporan Masuk', icon: FileText, color: 'from-lime-400 to-emerald-600', badge: 3 },
        { id: 'peta-sampah', label: 'Peta Operasional', icon: Map, color: 'from-emerald-500 to-teal-500' },
      ]
    },
    {
      group: "Data dan Operasional",
      id: 'data',
      icon: Database,
      items: [
        { id: 'data-supir', label: 'Data Supir', icon: Users, color: 'from-emerald-300 to-lime-500' },
        { id: 'data-truk', label: 'Data Armada', icon: Truck, color: 'from-emerald-400 to-teal-500' },
        { id: 'data-wilayah', label: 'Data Wilayah', icon: Map, color: 'from-teal-400 to-green-600' },
      ]
    },
    {
      group: "Manajemen Tugas",
      id: 'penugasan', // id group tetap penugasan untuk accordion
      icon: Calendar,
      items: [
        { id: 'tugas-harian', label: 'Tugas Harian', icon: ClipboardList, color: 'from-green-300 to-emerald-500' },
        { id: 'tugas-aduan', label: 'Tugas Aduan', icon: AlertCircle, color: 'from-lime-300 to-green-500' },
      ]
    },
    {
      group: "Konten",
      items: [
        { id: 'berita', label: 'Manajemen Berita', icon: Newspaper, color: 'from-green-500 to-emerald-600' },
      ]
    }
  ], []);

  const NavItem = ({ item, isSub = false }: { item: any; isSub?: boolean }) => {
    const isActive = activeMenu === item.id;
    return (
      <button
        onClick={() => { setActiveMenu(item.id); if(isMobileOpen) setIsMobileOpen(false); }}
        className={`w-full flex items-center group relative transition-all duration-300 rounded-xl mb-1
          ${isExpanded ? 'px-3 py-2' : 'justify-center py-2'} 
          ${isActive ? 'bg-white/10 text-white' : 'text-emerald-200 hover:bg-green-500/10 hover:text-white'}`}
      >
        {isActive && <div className="absolute left-0 w-1 h-5 bg-emerald-400 rounded-r-full" />}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 transition-all ${isActive ? `bg-gradient-to-br ${item.color} text-white shadow-lg shadow-black/20` : 'bg-green-900/50 group-hover:bg-green-800/70'}`}>
            <item.icon size={isSub ? 16 : 18} />
          </div>
          {isExpanded && (
            <div className="flex justify-between items-center w-full min-w-0">
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              {item.badge && <span className="bg-rose-500 text-[10px] px-1.5 py-0.5 rounded-full text-white ml-2">{item.badge}</span>}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      {!isMobileOpen && (
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-[60] md:hidden p-3 bg-green-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside 
        className={`fixed left-0 top-0 h-full z-50 bg-[#064E3B] border-r border-green-700/20 transition-all duration-300 ease-in-out flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isExpanded ? 'w-72' : 'w-20'}`}
        onMouseEnter={() => !isMobileOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="h-20 flex items-center px-4 border-b border-green-700/20 shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-white rounded-xl p-1.5 shrink-0 shadow-inner">
              <img src="/dlh.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {isExpanded && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                <h1 className="text-xs font-black text-white leading-tight uppercase">DLH Kabupaten Toba</h1>
              </div>
            )}
          </div>
          {isExpanded && !isMobileOpen && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }} 
              className="ml-auto p-1.5 text-gray-500 hover:text-white bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className={isCollapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 custom-scrollbar">
          {menuConfig.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.id ? (
                /* Accordion Section */
                <div className="space-y-1">
                  <button 
                    onClick={() => isExpanded && setOpenGroups(p => ({...p, [section.id!]: !p[section.id!]}))}
                    className={`w-full flex items-center py-2 text-emerald-200 hover:text-white transition-colors ${isExpanded ? 'px-3 justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon size={16} />
                      {isExpanded && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">{section.group}</span>}
                    </div>
                    {isExpanded && (openGroups[section.id!] ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </button>
                  {(openGroups[section.id!] || !isExpanded) && (
                    <div className={isExpanded ? "ml-2 border-l border-white/5 pl-2" : ""}>
                      {section.items.map(item => <NavItem key={item.id} item={item} isSub={isExpanded} />)}
                    </div>
                  )}
                </div>
              ) : (
                /* Static Section */
                <div className="space-y-1">
                  {isExpanded && section.group && (
                    <p className="px-3 text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2 mt-4">{section.group}</p>
                  )}
                  {section.items.map(item => <NavItem key={item.id} item={item} />)}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-green-700/20 bg-[#064E3B]/80">
          <div className={`flex flex-col gap-2 ${!isExpanded && 'items-center'}`}>
            {isExpanded && (
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-lg">
                  <User size={14} />
                </div>
                <div className="truncate group">
                  <p className="text-[10px] font-bold text-white uppercase truncate">Admin Toba</p>
                  <p className="text-[9px] text-emerald-200 truncate">Administrator</p>
                </div>
              </div>
            )}
            <button 
              onClick={onLogout} 
              className={`flex items-center gap-3 p-2.5 rounded-xl text-emerald-200 hover:bg-green-500/10 transition-all active:scale-95 ${!isExpanded && 'justify-center'}`}
            >
              <LogOut size={18} />
              {isExpanded && <span className="text-xs font-bold">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(125, 38, 38, 0.05); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
      `}</style>
    </>
  );
}