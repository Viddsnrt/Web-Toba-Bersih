import { Truck, LogOut, Home, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarSupirProps {
  onLogout?: () => void;
}

export default function NavbarSupir({ onLogout }: NavbarSupirProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      router.push('/login');
    }
  };

  return (
    <nav className="bg-[#2D5A27] p-4 flex justify-between items-center shadow-md sticky top-0 z-50 text-white">
      <div className="flex items-center gap-2 ml-4 font-bold text-lg">
        <Truck size={24} /> 
        <span className="hidden sm:inline">Driver CleanCity</span>
      </div>
      
      <div className="flex items-center gap-4 mr-4">
        {/* Notifikasi */}
        <button className="relative p-2 hover:bg-[#3D733D] rounded-xl transition">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Home */}
        <Link href="/" className="p-2 hover:bg-[#3D733D] rounded-xl transition">
          <Home size={20} />
        </Link>

        {/* Profile */}
        <button className="p-2 hover:bg-[#3D733D] rounded-xl transition">
          <User size={20} />
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 p-2 rounded-xl transition flex items-center gap-1"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline text-sm">Keluar</span>
        </button>
      </div>
    </nav>
  );
}