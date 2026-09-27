'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function KategoriPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nama: '', jenis: 'masuk' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'bendahara') { router.push('/dashboard'); return; }
    fetchKategori();
  }, [user, router]);

  const fetchKategori = async () => {
    setLoading(true);
    const res = await fetch('/api/kategori');
    const data = await res.json();
    setKategori(data.data || []);
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm({ nama: '', jenis: 'masuk' }); setError(''); setShowModal(true); };
  const openEdit = (k) => { setEditItem(k); setForm({ nama: k.nama, jenis: k.jenis }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nama.trim()) { setError('Nama kategori wajib diisi'); return; }
    setSaving(true); setError('');
    try {
      const url = editItem ? `/api/kategori/${editItem.id}` : '/api/kategori';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama.trim(), jenis: form.jenis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setShowModal(false);
      fetchKategori();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/kategori/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setDeleteConfirm(null);
    fetchKategori();
  };

  const masukList = kategori.filter(k => k.jenis === 'masuk');
  const keluarList = kategori.filter(k => k.jenis === 'keluar');

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div>
          <h3 style={{fontSize:16, fontWeight:700, color:'var(--primary-dark)'}}>Manajemen Kategori Transaksi</h3>
          <p style={{fontSize:13, color:'var(--text-secondary)'}}>Tambah, edit, atau hapus kategori pemasukan dan pengeluaran</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Kategori</button>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          {[
            { title: '📈 Kategori Pemasukan', items: masukList, jenis: 'masuk', color: 'var(--accent)', bg: '#d5f5e3' },
            { title: '📉 Kategori Pengeluaran', items: keluarList, jenis: 'keluar', color: 'var(--danger)', bg: '#fde8e6' },
          ].map(group => (
            <div key={group.jenis} className="card">
              <div className="card-header" style={{background: group.bg}}>
                <span className="card-title" style={{color: group.color}}>{group.title}</span>
                <span style={{fontSize:12, color: group.color, fontWeight:600}}>{group.items.length} kategori</span>
              </div>
              <div>
                {group.items.length === 0 ? (
                  <div style={{padding:'24px', textAlign:'center', color:'var(--text-muted)', fontSize:13}}>
                    Belum ada kategori. Klik "Tambah Kategori".
                  </div>
                ) : (
                  group.items.map((k, i) => (
                    <div key={k.id} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 16px',
                      borderBottom: i < group.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <span style={{fontSize:18}}>{group.jenis === 'masuk' ? '📥' : '📤'}</span>
                        <span style={{fontSize:13, fontWeight:500}}>{k.nama}</span>
                      </div>
                      <div style={{display:'flex', gap:6}}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(k)}>✏️ Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(k)}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{maxWidth:400}}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? '✏️ Edit Kategori' : '➕ Tambah Kategori'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label className="form-label required">Nama Kategori</label>
                <input type="text" className="form-control" placeholder="cth: Dana Desa"
                  value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label required">Jenis</label>
                <select className="form-control" value={form.jenis} onChange={e => setForm(f => ({...f, jenis: e.target.value}))}>
                  <option value="masuk">📈 Pemasukan</option>
                  <option value="keluar">📉 Pengeluaran</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳...' : editItem ? '💾 Perbarui' : '➕ Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:360}}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Hapus Kategori</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:13}}>Hapus kategori <strong>"{deleteConfirm.nama}"</strong>?</p>
              <div className="alert alert-danger" style={{marginTop:12, marginBottom:0}}>
                ⚠️ Tidak bisa dihapus jika sudah digunakan pada transaksi.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
