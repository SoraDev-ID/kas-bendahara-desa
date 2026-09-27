'use client';
import { useEffect, useState, useRef } from 'react';
import { formatRupiah, getCurrentBulan, formatBulan } from '@/lib/utils';

export default function LaporanPage() {
  const [bulan, setBulan] = useState(getCurrentBulan());
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  const fetchLaporan = async () => {
    setLoading(true);
    const res = await fetch(`/api/laporan?bulan=${bulan}`);
    const data = await res.json();
    setLaporan(data);
    setLoading(false);
  };

  useEffect(() => { fetchLaporan(); }, [bulan]);

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const el = printRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Laporan-Kas-Desa-${bulan}.pdf`);
  };

  const desa = 'Desa Makmur Jaya';
  const kec = 'Kecamatan Sejahtera';

  return (
    <div>
      {/* Controls */}
      <div className="card no-print" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'16px'}}>
          <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
            <div>
              <label className="form-label" style={{marginBottom:4}}>Pilih Bulan</label>
              <input type="month" className="form-control" value={bulan} onChange={e => setBulan(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={fetchLaporan} disabled={loading}>
              {loading ? '⏳ Memuat...' : '🔄 Tampilkan'}
            </button>
            <button className="btn btn-outline" onClick={handlePrint}>
              🖨️ Print
            </button>
            <button className="btn btn-success" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : laporan ? (
        <div ref={printRef}>
          {/* Header Laporan */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-body" style={{textAlign:'center', padding:'24px'}}>
              <div style={{fontSize:11, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>
                PEMERINTAH DESA
              </div>
              <h2 style={{fontSize:20, fontWeight:800, color:'var(--primary-dark)', marginBottom:4}}>
                {desa.toUpperCase()}
              </h2>
              <div style={{fontSize:13, color:'var(--text-secondary)', marginBottom:16}}>{kec}</div>
              <div style={{height:2, background:'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius:2, margin:'0 auto', maxWidth:300}} />
              <div style={{marginTop:16}}>
                <div style={{fontSize:15, fontWeight:700, color:'var(--text)'}}>LAPORAN KEUANGAN KAS DESA</div>
                <div style={{fontSize:14, color:'var(--text-secondary)', marginTop:4}}>
                  Periode: <strong>{formatBulan(laporan.bulan)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16}}>
            {[
              { label: 'Saldo Awal', value: laporan.saldo_awal, color: 'var(--primary)', icon: '🏦' },
              { label: 'Total Pemasukan', value: laporan.total_masuk, color: 'var(--accent)', icon: '📈' },
              { label: 'Total Pengeluaran', value: laporan.total_keluar, color: 'var(--danger)', icon: '📉' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="card-body" style={{padding:'16px', textAlign:'center'}}>
                  <div style={{fontSize:22, marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:11, color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:18, fontWeight:800, color:s.color}}>{formatRupiah(s.value)}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
            {/* Rincian Pemasukan */}
            <div className="card">
              <div className="card-header" style={{background:'#d5f5e3'}}>
                <span className="card-title" style={{color:'var(--accent)'}}>📈 Rincian Pemasukan</span>
              </div>
              <div className="table-wrapper">
                {laporan.pemasukan.length === 0 ? (
                  <div style={{padding:'20px', textAlign:'center', color:'var(--text-muted)', fontSize:13}}>Tidak ada pemasukan bulan ini</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Transaksi</th>
                        <th className="text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laporan.pemasukan.map((row, i) => (
                        <tr key={i}>
                          <td>{row.kategori || 'Lain-lain'}</td>
                          <td className="text-center">{row.jumlah_transaksi}x</td>
                          <td className="text-right text-masuk fw-bold">{formatRupiah(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td colSpan={2} style={{textAlign:'right'}}>Total</td>
                        <td className="text-right text-masuk fw-bold">{formatRupiah(laporan.total_masuk)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Rincian Pengeluaran */}
            <div className="card">
              <div className="card-header" style={{background:'#fde8e6'}}>
                <span className="card-title" style={{color:'var(--danger)'}}>📉 Rincian Pengeluaran</span>
              </div>
              <div className="table-wrapper">
                {laporan.pengeluaran.length === 0 ? (
                  <div style={{padding:'20px', textAlign:'center', color:'var(--text-muted)', fontSize:13}}>Tidak ada pengeluaran bulan ini</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Transaksi</th>
                        <th className="text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laporan.pengeluaran.map((row, i) => (
                        <tr key={i}>
                          <td>{row.kategori || 'Lain-lain'}</td>
                          <td className="text-center">{row.jumlah_transaksi}x</td>
                          <td className="text-right text-keluar fw-bold">{formatRupiah(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td colSpan={2} style={{textAlign:'right'}}>Total</td>
                        <td className="text-right text-keluar fw-bold">{formatRupiah(laporan.total_keluar)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Saldo Akhir */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-body">
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <tbody>
                  {[
                    { label: 'Saldo Awal', value: laporan.saldo_awal, color: 'var(--text)' },
                    { label: '(+) Total Pemasukan', value: laporan.total_masuk, color: 'var(--accent)' },
                    { label: '(-) Total Pengeluaran', value: laporan.total_keluar, color: 'var(--danger)' },
                  ].map(row => (
                    <tr key={row.label}>
                      <td style={{padding:'8px 0', fontSize:13, color:'var(--text-secondary)'}}>{row.label}</td>
                      <td style={{padding:'8px 0', textAlign:'right', fontWeight:600, color:row.color, fontSize:14}}>{formatRupiah(row.value)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{padding:'4px 0'}}>
                      <div style={{height:2, background:'var(--border)', margin:'4px 0'}} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{padding:'10px 0', fontSize:15, fontWeight:700}}>💰 Saldo Akhir</td>
                    <td style={{padding:'10px 0', textAlign:'right', fontWeight:800, fontSize:20, color: laporan.saldo_akhir >= 0 ? 'var(--primary)' : 'var(--danger)'}}>
                      {formatRupiah(laporan.saldo_akhir)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Transaksi */}
          {laporan.transaksi.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">📋 Detail Transaksi Bulan {formatBulan(laporan.bulan)}</span>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Kategori</th>
                      <th>Jenis</th>
                      <th className="text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.transaksi.map((t, i) => (
                      <tr key={t.id}>
                        <td style={{color:'var(--text-secondary)'}}>{i + 1}</td>
                        <td style={{whiteSpace:'nowrap'}}>
                          {new Date(t.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}
                        </td>
                        <td>{t.keterangan || '-'}</td>
                        <td style={{fontSize:12}}>{t.kategori_nama || '-'}</td>
                        <td><span className={`badge badge-${t.jenis}`}>{t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
                        <td className={`text-right fw-bold text-${t.jenis}`}>{formatRupiah(t.jumlah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tanda Tangan */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-body">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, textAlign:'center'}}>
                {[
                  { title: 'Mengetahui,', jabatan: 'Kepala Desa', nama: '____________________' },
                  { title: 'Bendahara Desa,', jabatan: '', nama: '____________________' },
                ].map((ttd, i) => (
                  <div key={i}>
                    <p style={{fontSize:13, marginBottom:60}}>{ttd.title}</p>
                    <p style={{fontSize:13, fontWeight:700, borderTop:'1px solid var(--text)', paddingTop:8, display:'inline-block', minWidth:140}}>
                      {ttd.nama}
                    </p>
                    <p style={{fontSize:11, color:'var(--text-secondary)', marginTop:4}}>{ttd.jabatan}</p>
                  </div>
                ))}
              </div>
              <div style={{textAlign:'center', marginTop:12, fontSize:11, color:'var(--text-muted)'}}>
                Dicetak pada: {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
