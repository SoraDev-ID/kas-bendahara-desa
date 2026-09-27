'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { formatRupiah } from '@/lib/utils';

function CatatanModal({ transaksi, onClose, onSave }) {
  const [catatan, setCatatan] = useState(transaksi?.catatan_sekdes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/transaksi/${transaksi.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catatan_sekdes: catatan }),
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:420}}>
        <div className="modal-header">
          <span className="modal-title">📝 Tambah Catatan / Approval</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:12}}>
            Transaksi: <strong>{transaksi?.keterangan || '-'}</strong> — {formatRupiah(transaksi?.jumlah)}
          </p>
          <div className="form-group">
            <label className="form-label">Catatan Sekretaris</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Tulis catatan atau keterangan approval..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-success" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : '✅ Simpan Catatan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ transaksi, onClose, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/transaksi/${transaksi.id}`, { method: 'DELETE' });
    setLoading(false);
    onDelete();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:380}}>
        <div className="modal-header">
          <span className="modal-title">🗑️ Hapus Transaksi</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:13}}>
            Apakah Anda yakin ingin menghapus transaksi ini?
          </p>
          <div style={{background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'12px', marginTop:12}}>
            <div style={{fontWeight:600}}>{transaksi?.keterangan || '(tanpa keterangan)'}</div>
            <div style={{color:'var(--text-secondary)', fontSize:12, marginTop:4}}>
              {formatRupiah(transaksi?.jumlah)} • {new Date(transaksi?.tanggal).toLocaleDateString('id-ID')}
            </div>
          </div>
          <div className="alert alert-danger" style={{marginTop:12, marginBottom:0}}>
            ⚠️ Tindakan ini tidak bisa dibatalkan.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? '⏳...' : '🗑️ Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  const { user } = useAuth();
  const [transaksi, setTransaksi] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ jenis: '', kategori_id: '', search: '', bulan: '' });
  const [catatanModal, setCatatanModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.jenis) params.set('jenis', filter.jenis);
    if (filter.kategori_id) params.set('kategori_id', filter.kategori_id);
    if (filter.search) params.set('search', filter.search);
    if (filter.bulan) params.set('bulan', filter.bulan);
    const res = await fetch(`/api/transaksi?${params}`);
    const data = await res.json();
    setTransaksi(data.data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetch('/api/kategori').then(r => r.json()).then(d => setKategori(d.data || []));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMasuk = transaksi.filter(t => t.jenis === 'masuk').reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = transaksi.filter(t => t.jenis === 'keluar').reduce((s, t) => s + t.jumlah, 0);

  return (
    <div>
      {/* Filter */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{paddingTop:16, paddingBottom:16}}>
          <div className="filter-bar">
            <div style={{flex:1, minWidth:200}}>
              <label className="form-label" style={{marginBottom:4}}>Cari</label>
              <input
                type="text" className="form-control" placeholder="🔍 Cari keterangan atau kategori..."
                value={filter.search} onChange={e => setFilter(f => ({...f, search:e.target.value}))}
              />
            </div>
            <div>
              <label className="form-label" style={{marginBottom:4}}>Bulan</label>
              <input type="month" className="form-control" value={filter.bulan} onChange={e => setFilter(f => ({...f, bulan:e.target.value}))} />
            </div>
            <div>
              <label className="form-label" style={{marginBottom:4}}>Jenis</label>
              <select className="form-control" value={filter.jenis} onChange={e => setFilter(f => ({...f, jenis:e.target.value}))}>
                <option value="">Semua Jenis</option>
                <option value="masuk">📈 Masuk</option>
                <option value="keluar">📉 Keluar</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:4}}>Kategori</label>
              <select className="form-control" value={filter.kategori_id} onChange={e => setFilter(f => ({...f, kategori_id:e.target.value}))}>
                <option value="">Semua Kategori</option>
                {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost" style={{alignSelf:'flex-end'}} onClick={() => setFilter({jenis:'',kategori_id:'',search:'',bulan:''})}>
              ↩ Reset
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20}}>
        {[
          { label: 'Total Ditampilkan', value: transaksi.length, suffix: ' transaksi', color: 'var(--text)', icon: '📋' },
          { label: 'Total Masuk', value: formatRupiah(totalMasuk), color: 'var(--accent)', icon: '📈' },
          { label: 'Total Keluar', value: formatRupiah(totalKeluar), color: 'var(--danger)', icon: '📉' },
        ].map(s => (
          <div key={s.label} style={{background:'var(--bg-card)', borderRadius:'var(--radius-sm)', padding:'12px 16px', border:'1px solid var(--border-light)'}}>
            <div style={{fontSize:11, color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', marginBottom:4}}>{s.icon} {s.label}</div>
            <div style={{fontSize:16, fontWeight:700, color:s.color}}>{s.value}{s.suffix}</div>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Daftar Transaksi ({transaksi.length})</span>
          {user?.role === 'bendahara' && (
            <a href="/input-transaksi" className="btn btn-primary btn-sm">➕ Input Baru</a>
          )}
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loader"><div className="spinner" /></div>
          ) : transaksi.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">Tidak ada transaksi</div>
              <div className="empty-sub">Coba ubah filter atau tambahkan transaksi baru</div>
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
                  <th>Oleh</th>
                  <th>Catatan</th>
                  {(user?.role === 'bendahara' || user?.role === 'sekdes') && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {transaksi.map(t => (
                  <tr key={t.id}>
                    <td style={{whiteSpace:'nowrap'}}>
                      {new Date(t.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}
                    </td>
                    <td style={{maxWidth:180}}>
                      <div>{t.keterangan || '-'}</div>
                      {t.bukti_file && (
                        <a href={t.bukti_file} target="_blank" rel="noreferrer" style={{fontSize:11, color:'var(--primary-light)'}}>
                          📎 Lihat bukti
                        </a>
                      )}
                    </td>
                    <td><span style={{fontSize:12}}>{t.kategori_nama || '-'}</span></td>
                    <td><span className={`badge badge-${t.jenis}`}>{t.jenis === 'masuk' ? '📈 Masuk' : '📉 Keluar'}</span></td>
                    <td className={`text-right fw-bold text-${t.jenis}`}>{formatRupiah(t.jumlah)}</td>
                    <td style={{fontSize:12, color:'var(--text-secondary)'}}>{t.user_nama}</td>
                    <td style={{maxWidth:150}}>
                      {t.catatan_sekdes ? (
                        <div>
                          <span style={{fontSize:11, color:'var(--accent)'}}>✅ {t.approver_nama}</span>
                          <div style={{fontSize:11, color:'var(--text-secondary)', marginTop:2}}>{t.catatan_sekdes}</div>
                        </div>
                      ) : <span style={{fontSize:11, color:'var(--text-muted)'}}>-</span>}
                    </td>
                    {(user?.role === 'bendahara' || user?.role === 'sekdes') && (
                      <td>
                        <div style={{display:'flex', gap:4}}>
                          {user?.role === 'sekdes' && (
                            <button className="btn btn-sm btn-warning" onClick={() => setCatatanModal(t)} title="Tambah catatan">
                              📝
                            </button>
                          )}
                          {user?.role === 'bendahara' && t.user_id === user?.id && (
                            <>
                              <a href={`/input-transaksi?edit=${t.id}`} className="btn btn-sm btn-outline" title="Edit">✏️</a>
                              <button className="btn btn-sm btn-danger" onClick={() => setDeleteModal(t)} title="Hapus">🗑️</button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-footer">
                  <td colSpan={4} style={{textAlign:'right', fontWeight:700}}>Subtotal:</td>
                  <td className="text-right">
                    <div className="text-masuk">{formatRupiah(totalMasuk)}</div>
                    <div className="text-keluar">{formatRupiah(totalKeluar)}</div>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {catatanModal && (
        <CatatanModal
          transaksi={catatanModal}
          onClose={() => setCatatanModal(null)}
          onSave={fetchData}
        />
      )}
      {deleteModal && (
        <DeleteModal
          transaksi={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDelete={fetchData}
        />
      )}
    </div>
  );
}
