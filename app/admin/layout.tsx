// app/admin/layout.tsx
"use client";
import Sidebar from "./components/Sidebar"; // Sesuaikan path-nya
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Fungsi logout yang nanti dikirim ke Sidebar
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. SIDEBAR: Akan selalu tampil di semua sub-halaman admin */}
      <Sidebar onLogout={handleLogout} />

      {/* 2. KONTEN UTAMA: Area ini yang akan berubah isinya */}
      <main className="flex-1 transition-all duration-300 md:ml-20 lg:ml-72">
        <div className="p-4 md:p-8">
          {children} 
          {/* 'children' di sini adalah isi dari page.tsx folder yang kamu buka */}
        </div>
      </main>
    </div>
  );
}