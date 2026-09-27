import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function PUT(request, { params }) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'bendahara') return Response.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await params;
  const { nama, jenis } = await request.json();
  const db = getDb();
  db.prepare('UPDATE kategori SET nama=?, jenis=? WHERE id=?').run(nama, jenis, id);
  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'bendahara') return Response.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  // Cek apakah kategori sedang digunakan
  const used = db.prepare('SELECT COUNT(*) as c FROM transaksi WHERE kategori_id = ?').get(id);
  if (used.c > 0) return Response.json({ error: 'Kategori sedang digunakan, tidak bisa dihapus' }, { status: 400 });

  db.prepare('DELETE FROM kategori WHERE id=?').run(id);
  return Response.json({ ok: true });
}
