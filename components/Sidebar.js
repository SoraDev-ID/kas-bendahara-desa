'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

const ROLE_LABEL = { bendahara: 'Bendahara', kades: 'Kepala Desa', sekdes: 'Sekretaris Desa' };

function NavItem({ href, icon, label, active }) {
  return (
    <Link href={href} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-item-icon">{icon}</span>
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initial = (user.nama || 'U')[0].toUpperCase();

  return (
    <>
      {/* Mobile hamburger */}
      <button className="hamburger" style={{display:'none'}} onClick={() => setOpen(true)} aria-label="Buka menu">
        <span /><span /><span />
      </button>

      <div className={`mobile-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🏛️</div>
            <div>
              <div className="sidebar-title">Kas Desa</div>
              <div className="sidebar-subtitle">Sistem Keuangan Desa</div>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <div className="user-name">{user.nama}</div>
            <div className="user-role">{ROLE_LABEL[user.role] || user.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu Utama</div>
          <NavItem href="/dashboard" icon="📊" label="Dashboard" active={pathname === '/dashboard'} />
          <NavItem href="/transaksi" icon="📋" label="Riwayat Transaksi" active={pathname.startsWith('/transaksi')} />
          <NavItem href="/laporan" icon="📄" label="Laporan Bulanan" active={pathname.startsWith('/laporan')} />
          {user.role === 'bendahara' && (
            <>
              <div className="nav-section-label">Kelola Data</div>
              <NavItem href="/input-transaksi" icon="➕" label="Input Transaksi" active={pathname === '/input-transaksi'} />
              <NavItem href="/kategori" icon="🏷️" label="Kategori" active={pathname.startsWith('/kategori')} />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost" style={{width:'100%', color:'rgba(255,255,255,0.7)', fontSize:'13px'}} onClick={logout}>
            🚪 Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
