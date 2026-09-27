'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatRupiah } from '@/lib/utils';
import { Suspense } from 'react';

function InputForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'masuk',
    kategori_id: '',
    jumlah: '',
    jumlahDisplay: '',
    keterangan: '',
  });
  const [buktiFile, setBuktiFile] = useState(null);
  const [existingBukti, setExistingBukti] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isEdit = !!editId;

  useEffect(() => {
    if (user?.role !== 'bendahara') { router.push('/dashboard'); return; }
    fetch('/api/kategori').then(r => r.json()).then(d => setKategori(d.data || []));
  }, [user, router]);

  useEffect(() => {
    if (editId) {
      fetch(`/api/transaksi/${editId}`).then(r => r.json()).then(d => {
        if (d.data) {
          const t = d.data;
          setForm({
            tanggal: t.tanggal,
            jenis: t.jenis,
            kategori_id: t.kategori_id ? String(t.kategori_id) : '',
            jumlah: String(t.jumlah),
            jumlahDisplay: Number(t.jumlah).toLocaleString('id-ID'),
            keterangan: t.keterangan || '',
          });
          if (t.bukti_file) setExistingBukti(t.bukti_file);
        }
      });
    }
  }, [editId]);

  const filteredKategori = kategori.filter(k => k.jenis === form.jenis);

  const handleJumlahChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw) : '';
    setForm(f => ({
      ...f,
      jumlah: String(num),
      jumlahDisplay: num ? num.toLocaleString('id-ID') : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.jumlah || parseInt(form.jumlah) <= 0) {
      setError('Jumlah harus lebih dari 0'); return;
    }
    setLoading(true);

    const fd = new FormData();
    fd.append('tanggal', form.tanggal);
    fd.append('jenis', form.jenis);
    fd.append('kategori_id', form.kategori_id);
    fd.append('jumlah', form.jumlah);
    fd.append('keterangan', form.keterangan);
    if (buktiFile) fd.append('bukti', buktiFile);

    try {
      const url = isEdit ? `/api/transaksi/${editId}` : '/api/transaksi';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setSuccess(isEdit ? '✅ Transaksi berhasil diperbarui!' : '✅ Transaksi berhasil disimpan!');
      if (!isEdit) {
        setForm({ tanggal: new Date().toISOString().split('T')[0], jenis: 'masuk', kategori_id: '', jumlah: '', jumlahDisplay: '', keterangan: '' });
        setBuktiFile(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:600}}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{isEdit ? '✏️ Edit Transaksi' : '➕ Input Transaksi Baru'}</span>
          <a href="/transaksi" className="btn btn-ghost btn-sm">← Kembali</a>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Tanggal Transaksi</label>
                <input type="date" className="form-control" required
                  value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label required">Jenis Transaksi</label>
                <select className="form-control" required
                  value={form.jenis} onChange={e => setForm(f => ({...f, jenis:e.target.value, kategori_id:''}))}>
                  <option value="masuk">📈 Kas Masuk</option>
                  <option value="keluar">📉 Kas Keluar</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-control"
                value={form.kategori_id} onChange={e => setForm(f => ({...f, kategori_id:e.target.value}))}>
                <option value="">— Pilih Kategori —</option>
                {filteredKategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Jumlah (Rupiah)</label>
              <div className="input-group">
                <div className="input-group-prefix">Rp</div>
                <input
                  type="text" className="form-control" required
                  placeholder="0" inputMode="numeric"
                  value={form.jumlahDisplay}
                  onChange={handleJumlahChange}
                />
              </div>
              {form.jumlah && (
                <div className="form-hint">
                  Terbilang: <strong>{formatRupiah(parseInt(form.jumlah))}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <textarea className="form-control" rows={3}
                placeholder="Tulis keterangan transaksi..."
                value={form.keterangan} onChange={e => setForm(f => ({...f, keterangan:e.target.value}))} />
            </div>

            <div className="form-group">
              <label className="form-label">Bukti Transaksi (Foto/PDF)</label>
              {existingBukti && !buktiFile && (
                <div className="upload-preview" style={{marginBottom:8}}>
                  <span>📎</span>
                  <a href={existingBukti} target="_blank" rel="noreferrer" style={{fontSize:12, color:'var(--primary-light)'}}>
                    Lihat bukti yang ada
                  </a>
                </div>
              )}
              <label className="upload-area" htmlFor="bukti-upload">
                <div className="upload-icon">{buktiFile ? '✅' : '📁'}</div>
                <div className="upload-text">
                  {buktiFile ? buktiFile.name : 'Klik untuk pilih file (JPG, PNG, PDF, max 5MB)'}
                </div>
                <input id="bukti-upload" type="file" accept="image/*,.pdf" style={{display:'none'}}
                  onChange={e => setBuktiFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div style={{display:'flex', gap:10, marginTop:20}}>
              <button type="submit" className={`btn btn-lg ${form.jenis === 'masuk' ? 'btn-success' : 'btn-danger'}`} disabled={loading}>
                {loading ? '⏳ Menyimpan...' : isEdit ? '💾 Perbarui Transaksi' : (form.jenis === 'masuk' ? '📈 Simpan Pemasukan' : '📉 Simpan Pengeluaran')}
              </button>
              <a href="/transaksi" className="btn btn-outline btn-lg">Batal</a>
            </div>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="alert alert-info" style={{marginTop:16}}>
        <span>💡</span>
        <div>
          <strong>Tips:</strong> Pastikan semua data transaksi sudah benar sebelum disimpan.
          Bukti transaksi seperti kuitansi atau tanda terima sangat disarankan untuk dilampirkan.
        </div>
      </div>
    </div>
  );
}

export default function InputTransaksiPage() {
  return (
    <Suspense>
      <InputForm />
    </Suspense>
  );
}
