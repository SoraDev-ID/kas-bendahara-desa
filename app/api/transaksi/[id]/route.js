import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { unlink } from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function GET(request, { params }) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const transaksi = db.prepare(`
    SELECT t.*, k.nama as kategori_nama, u.nama as user_nama, s.nama as approver_nama
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users s ON t.approved_by = s.id
    WHERE t.id = ?
  `).get(id);

  if (!transaksi) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return Response.json({ data: transaksi });
}

export async function PUT(request, { params }) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM transaksi WHERE id = ?').get(id);
  if (!existing) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });

  // Sekdes bisa tambah catatan/approval
  if (user.role === 'sekdes') {
    const { catatan_sekdes } = await request.json();
    db.prepare(`
      UPDATE transaksi SET catatan_sekdes = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(catatan_sekdes || null, user.id, id);
    return Response.json({ ok: true });
  }

  // Bendahara bisa edit transaksi miliknya
  if (user.role !== 'bendahara') return Response.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (existing.user_id !== user.id) return Response.json({ error: 'Hanya bisa edit transaksi milik sendiri' }, { status: 403 });

  const formData = await request.formData();
  const tanggal = formData.get('tanggal') || existing.tanggal;
  const jenis = formData.get('jenis') || existing.jenis;
  const kategori_id = formData.get('kategori_id') || existing.kategori_id;
  const jumlah = parseInt(formData.get('jumlah') || existing.jumlah);
  const keterangan = formData.get('keterangan') ?? existing.keterangan;
  const buktiFile = formData.get('bukti');

  let bukti_file = existing.bukti_file;
  if (buktiFile && buktiFile.size > 0) {
    // Hapus file lama
    if (existing.bukti_file && !existing.bukti_file.startsWith('data:')) {
      try {
        await unlink(path.join(process.cwd(), 'public', existing.bukti_file));
      } catch (_) {}
    }
    try {
      const ext = buktiFile.name.split('.').pop();
      const filename = `bukti_${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const { mkdirSync } = require('fs');
      mkdirSync(uploadDir, { recursive: true });
      const bytes = await buktiFile.arrayBuffer();
      await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
      bukti_file = `/uploads/${filename}`;
    } catch (_) {
      try {
        const bytes = await buktiFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        bukti_file = `data:${buktiFile.type || 'image/jpeg'};base64,${base64}`;
      } catch (_) {
        bukti_file = null;
      }
    }
  }

  db.prepare(`
    UPDATE transaksi SET tanggal=?, jenis=?, kategori_id=?, jumlah=?, keterangan=?, bukti_file=?
    WHERE id = ?
  `).run(tanggal, jenis, kategori_id || null, jumlah, keterangan, bukti_file, id);

  return Response.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'bendahara') return Response.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM transaksi WHERE id = ?').get(id);
  if (!existing) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });
  if (existing.user_id !== user.id) return Response.json({ error: 'Hanya bisa hapus transaksi milik sendiri' }, { status: 403 });

  if (existing.bukti_file) {
    try {
      await unlink(path.join(process.cwd(), 'public', existing.bukti_file));
    } catch (_) {}
  }

  db.prepare('DELETE FROM transaksi WHERE id = ?').run(id);
  return Response.json({ ok: true });
}
