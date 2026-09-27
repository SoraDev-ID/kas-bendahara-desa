'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { formatRupiah } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', boxShadow:'var(--shadow)'}}>
        <p style={{fontWeight:700, marginBottom:6, fontSize:13}}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{color:p.fill, fontSize:12, marginBottom:2}}>
            {p.name === 'masuk' ? '📈 Masuk' : '📉 Keluar'}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!data) return <div className="alert alert-danger">Gagal memuat data</div>;

  const saldoPositif = data.saldo >= 0;

  return (
    <div>
      {/* Greeting */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:20, fontWeight:700, color:'var(--primary-dark)', marginBottom:4}}>
          Selamat datang, {user?.nama}! 👋
        </h2>
        <p style={{fontSize:13, color:'var(--text-secondary)'}}>
          Berikut adalah ringkasan keuangan kas desa.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className={`stat-card saldo`}>
          <div className="stat-icon">💰</div>
          <div className="stat-label">Saldo Kas Saat Ini</div>
          <div className={`stat-value ${saldoPositif ? 'saldo-value' : 'keluar-value'}`}>
            {formatRupiah(data.saldo)}
          </div>
          <div className="stat-sub">Total akumulasi semua transaksi</div>
        </div>
        <div className="stat-card masuk">
          <div className="stat-icon">📈</div>
          <div className="stat-label">Pemasukan Bulan Ini</div>
          <div className="stat-value masuk-value">{formatRupiah(data.pemasukan_bulan)}</div>
          <div className="stat-sub">{new Date().toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</div>
        </div>
        <div className="stat-card keluar">
          <div className="stat-icon">📉</div>
          <div className="stat-label">Pengeluaran Bulan Ini</div>
          <div className="stat-value keluar-value">{formatRupiah(data.pengeluaran_bulan)}</div>
          <div className="stat-sub">{new Date().toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24}}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Tren Kas 6 Bulan Terakhir</span>
          </div>
          <div className="card-body" style={{padding:'16px'}}>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tren} margin={{top:5, right:10, bottom:5, left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="bulan" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:10}} tickFormatter={v => v >= 1e6 ? (v/1e6).toFixed(0)+'jt' : v >= 1e3 ? (v/1e3).toFixed(0)+'rb' : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => v === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} />
                  <Bar dataKey="masuk" fill="#1e8449" radius={[4,4,0,0]} />
                  <Bar dataKey="keluar" fill="#c0392b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">💼 Ringkasan Keseluruhan</span>
          </div>
          <div className="card-body">
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                { label: 'Total Pemasukan', value: data.total_masuk_semua, color: 'var(--accent)', icon: '📈' },
                { label: 'Total Pengeluaran', value: data.total_keluar_semua, color: 'var(--danger)', icon: '📉' },
                { label: 'Saldo Bersih', value: data.saldo, color: data.saldo >= 0 ? 'var(--primary)' : 'var(--danger)', icon: '💰' },
              ].map(item => (
                <div key={item.label} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--radius-sm)',
                }}>
                  <span style={{fontSize:13, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:8}}>
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span style={{fontWeight:700, color:item.color, fontSize:14}}>{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🕐 Transaksi Terbaru</span>
          <a href="/transaksi" className="btn btn-outline btn-sm">Lihat Semua</a>
        </div>
        <div className="table-wrapper">
          {data.terbaru.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">Belum ada transaksi</div>
              <div className="empty-sub">Input transaksi pertama dari menu Input Transaksi</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th>Jenis</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.terbaru.map(t => (
                  <tr key={t.id}>
                    <td style={{whiteSpace:'nowrap'}}>
                      {new Date(t.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}
                    </td>
                    <td style={{maxWidth:200}}>{t.keterangan || '-'}</td>
                    <td>{t.kategori_nama || '-'}</td>
                    <td><span className={`badge badge-${t.jenis}`}>{t.jenis === 'masuk' ? '📈 Masuk' : '📉 Keluar'}</span></td>
                    <td className={`text-right fw-bold text-${t.jenis}`}>{formatRupiah(t.jumlah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
