import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Ambil token dari cookie
  const token = request.cookies.get('token')?.value;

  // Halaman yang bisa diakses tanpa login
  const isPublicPage =
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path === '/Warga' ||
    path === '/Warga/register';

  // File statis (gambar, icon, dll)
  const isStaticFile = 
    path.startsWith('/_next') || 
    path.includes('.');

  // Halaman yang butuh login
  const isProtectedPage = 
    path.startsWith('/admin') || 
    path.startsWith('/Supir') ;

  // Kalau file statis atau halaman publik, langsung izinkan
  if (isStaticFile || isPublicPage) {
    return NextResponse.next();
  }

  // Kalau halaman protected dan belum login, redirect ke login
  if (isProtectedPage && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Selain itu, izinkan
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};