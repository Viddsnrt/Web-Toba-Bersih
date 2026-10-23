"use client";
import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import toast from 'react-hot-toast';

const APK_URL = '/downloads/toba-bersih.apk';
const DISMISS_KEY = 'tobabersih:install-banner-dismissed';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (!/Mobile|Android/i.test(ua)) return 'desktop';
  return 'unknown';
}

export default function PWAInstall() {
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
      return;
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Unregister all old service workers to clear stale cache, then re-register.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      toast.success('Toba Bersih berhasil dipasang! 🎉');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.error('SW register gagal:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDownloadApk = () => {
    window.location.href = APK_URL;
    toast.success('Download dimulai. Buka file .apk lalu instal.');
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Terima kasih! Aplikasi sedang dipasang...');
    } else {
      toast.error('Instalasi dibatalkan');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (isInstalled || dismissed) return null;
  // Only show on mobile (iOS PWA fallback, Android APK). Desktop uses web.
  if (platform === 'desktop' || platform === 'unknown') return null;

  const isAndroid = platform === 'android';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-green-200 p-4 animate-slide-up">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              {isAndroid ? (
                <Smartphone className="text-green-600" size={20} />
              ) : (
                <Download className="text-green-600" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                {isAndroid ? 'Unduh Aplikasi Toba Bersih' : 'Pasang Toba Bersih'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAndroid
                  ? 'Aplikasi mobile dengan notifikasi & tracking real-time'
                  : 'Akses lebih cepat dari home screen'}
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
          >
            Nanti
          </button>
          {isAndroid ? (
            <button
              onClick={handleDownloadApk}
              className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700"
            >
              <span className="inline-flex items-center gap-1">
                <Download size={14} />
                Download
              </span>
            </button>
          ) : (
            <button
              onClick={handlePwaInstall}
              disabled={!deferredPrompt}
              className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              Pasang Sekarang
            </button>
          )}
        </div>
        {isAndroid && (
          <p className="text-[10px] text-slate-400 mt-2">
            Android: buka file .apk setelah download, izinkan &ldquo;install dari sumber tidak dikenal&rdquo;
          </p>
        )}
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
