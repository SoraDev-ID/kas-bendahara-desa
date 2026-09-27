import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const bulan = searchParams.get('bulan'); // YYYY-MM

  // Hitung total saldo (semua waktu)
  const saldoData = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END), 0) as total_masuk,
      COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END), 0) as total_keluar
    FROM transaksi
  `).get();

  const saldo = saldoData.total_masuk - saldoData.total_keluar;

  // Bulan ini
  const now = new Date();
  const thisBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const bulanTarget = bulan || thisBulan;

  const bulanData = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END), 0) as pemasukan,
      COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END), 0) as pengeluaran
    FROM transaksi
    WHERE strftime('%Y-%m', tanggal) = ?
  `).get(bulanTarget);

  // Tren 6 bulan terakhir
  const tren = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    const data = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END), 0) as masuk,
        COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END), 0) as keluar
      FROM transaksi WHERE strftime('%Y-%m', tanggal) = ?
    `).get(m);
    tren.push({ bulan: label, masuk: data.masuk, keluar: data.keluar });
  }

  // Transaksi terbaru (5)
  const terbaru = db.prepare(`
    SELECT t.*, k.nama as kategori_nama, u.nama as user_nama
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.tanggal DESC, t.created_at DESC LIMIT 5
  `).all();

  return Response.json({
    saldo,
    total_masuk_semua: saldoData.total_masuk,
    total_keluar_semua: saldoData.total_keluar,
    bulan: bulanTarget,
    pemasukan_bulan: bulanData.pemasukan,
    pengeluaran_bulan: bulanData.pengeluaran,
    tren,
    terbaru,
  });
}
