import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, ChevronRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Seal_of_Toba_Regency_%282020%29.svg"
                alt="Logo"
                width={44}
                height={44}
                unoptimized
              />
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
              {['Tentang', 'Edukasi', 'Berita', 'Galeri'].map((item) => {
                const key = item.toLowerCase();
                const href = key === 'berita' ? '/berita' : key === 'edukasi' ? '/edukasi' : key === 'galeri' ? '/galeri' : `/#${key}`;
                return (
                  <li key={item}>
                    <Link href={href} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 focus-visible:outline-none">
                      <ChevronRight size={14} className="text-slate-600" /> {item}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 relative inline-block">Sumber Daya<span className="absolute -bottom-1.5 left-0 w-8 h-1 bg-green-500 rounded-full" /></h3>
            <ul className="space-y-3">
              {[
                { name: 'Tugas Pokok & Fungsi', path: 'https://dislindup.tobakab.go.id/tugas-pokok-dan-fungsi/' },
                { name: 'Dokumen RPJMD', path: 'https://dislindup.tobakab.go.id/rpjmd/' },
                { name: 'Dokumen RENSTRA', path: 'https://dislindup.tobakab.go.id/renstra/' },
                { name: 'Struktur Organisasi', path: 'https://dislindup.tobakab.go.id/struktur-organisasi/' }
              ].map((l) => (
                <li key={l.name}>
                  <Link href={l.path} className="text-slate-400 hover:text-green-400 text-sm flex items-center gap-2 group">
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />{l.name}
                  </Link>
                </li>
              ))}
            </ul>
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
  );
}
