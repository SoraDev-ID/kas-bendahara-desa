import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const jenis = searchParams.get('jenis');

  const db = getDb();
  let query = 'SELECT * FROM kategori WHERE 1=1';
  const params = [];
  if (jenis) { query += ' AND jenis = ?'; params.push(jenis); }
  query += ' ORDER BY jenis, nama';

  const rows = db.prepare(query).all(...params);
  return Response.json({ data: rows });
}

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'bendahara') return Response.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { nama, jenis } = await request.json();
  if (!nama || !jenis) return Response.json({ error: 'Nama dan jenis wajib diisi' }, { status: 400 });

  const db = getDb();
  const result = db.prepare('INSERT INTO kategori (nama, jenis) VALUES (?, ?)').run(nama, jenis);
  return Response.json({ data: { id: result.lastInsertRowid, nama, jenis } }, { status: 201 });
}
