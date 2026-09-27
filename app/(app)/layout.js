'use client';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transaksi': 'Riwayat Transaksi',
  '/input-transaksi': 'Input Transaksi',
  '/laporan': 'Laporan Bulanan',
  '/kategori': 'Manajemen Kategori',
};

function AppShell({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)'}}>
        <div className="loader"><div className="spinner" /></div>
      </div>
    );
  }

  if (!user) return null;

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'Kas Desa';
  const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-date">{now}</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>
              🏡 Desa Makmur Jaya
            </span>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
