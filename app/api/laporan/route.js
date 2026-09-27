import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bulan = searchParams.get('bulan'); // YYYY-MM, wajib

  if (!bulan) return Response.json({ error: 'Parameter bulan wajib' }, { status: 400 });

  const db = getDb();

  // Saldo awal: semua transaksi sebelum bulan ini
  const [tahun, bln] = bulan.split('-').map(Number);
  const sebelum = new Date(tahun, bln - 1, 1);
  const sebelumStr = sebelum.toISOString().split('T')[0]; // YYYY-MM-01

  const saldoAwalData = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END), 0) as masuk,
      COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END), 0) as keluar
    FROM transaksi WHERE tanggal < ?
  `).get(sebelumStr);
  const saldoAwal = saldoAwalData.masuk - saldoAwalData.keluar;

  // Rincian pemasukan per kategori bulan ini
  const pemasukan = db.prepare(`
    SELECT k.nama as kategori, COALESCE(SUM(t.jumlah), 0) as total, COUNT(*) as jumlah_transaksi
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    WHERE t.jenis = 'masuk' AND strftime('%Y-%m', t.tanggal) = ?
    GROUP BY t.kategori_id, k.nama
    ORDER BY total DESC
  `).all(bulan);

  // Rincian pengeluaran per kategori bulan ini
  const pengeluaran = db.prepare(`
    SELECT k.nama as kategori, COALESCE(SUM(t.jumlah), 0) as total, COUNT(*) as jumlah_transaksi
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    WHERE t.jenis = 'keluar' AND strftime('%Y-%m', t.tanggal) = ?
    GROUP BY t.kategori_id, k.nama
    ORDER BY total DESC
  `).all(bulan);

  // Detail transaksi bulan ini
  const transaksi = db.prepare(`
    SELECT t.*, k.nama as kategori_nama, u.nama as user_nama
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE strftime('%Y-%m', t.tanggal) = ?
    ORDER BY t.tanggal ASC
  `).all(bulan);

  const totalMasuk = pemasukan.reduce((s, r) => s + r.total, 0);
  const totalKeluar = pengeluaran.reduce((s, r) => s + r.total, 0);
  const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

  return Response.json({
    bulan,
    saldo_awal: saldoAwal,
    pemasukan,
    pengeluaran,
    total_masuk: totalMasuk,
    total_keluar: totalKeluar,
    saldo_akhir: saldoAkhir,
    transaksi,
  });
}
