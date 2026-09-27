'use client';

export function formatRupiah(angka) {
  if (!angka && angka !== 0) return 'Rp 0';
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

export function formatTanggal(tanggal) {
  if (!tanggal) return '-';
  const d = new Date(tanggal);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatBulan(bulan) {
  if (!bulan) return '';
  const [y, m] = bulan.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function getNamaBulan(bulan) {
  const names = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return names[bulan - 1] || '';
}

export function getCurrentBulan() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function parseRupiah(str) {
  return parseInt(str.replace(/[^0-9]/g, '')) || 0;
}
