import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const bulan = searchParams.get('bulan'); // format: YYYY-MM
  const tahun = searchParams.get('tahun');
  const jenis = searchParams.get('jenis');
  const kategori_id = searchParams.get('kategori_id');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = `
    SELECT t.*, k.nama as kategori_nama, k.jenis as kategori_jenis, u.nama as user_nama,
           s.nama as approver_nama
    FROM transaksi t
    LEFT JOIN kategori k ON t.kategori_id = k.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users s ON t.approved_by = s.id
    WHERE 1=1
  `;
  const params = [];

  if (bulan) {
    query += ` AND strftime('%Y-%m', t.tanggal) = ?`;
    params.push(bulan);
  }
  if (tahun) {
    query += ` AND strftime('%Y', t.tanggal) = ?`;
    params.push(tahun);
  }
  if (jenis) {
    query += ` AND t.jenis = ?`;
    params.push(jenis);
  }
  if (kategori_id) {
    query += ` AND t.kategori_id = ?`;
    params.push(kategori_id);
  }
  if (search) {
    query += ` AND (t.keterangan LIKE ? OR k.nama LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY t.tanggal DESC, t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return Response.json({ data: rows });
}

export async function POST(request) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'bendahara') return Response.json({ error: 'Hanya bendahara yang bisa input transaksi' }, { status: 403 });

  try {
    const formData = await request.formData();
    const tanggal = formData.get('tanggal');
    const jenis = formData.get('jenis');
    const kategori_id = formData.get('kategori_id');
    const jumlah = parseInt(formData.get('jumlah') || '0');
    const keterangan = formData.get('keterangan') || '';
    const buktiFile = formData.get('bukti');

    if (!tanggal || !jenis || !jumlah) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    let bukti_file = null;
    if (buktiFile && buktiFile.size > 0) {
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
        // Fallback jika filesystem read-only (Netlify/Serverless): simpan sebagai Data URI base64
        try {
          const bytes = await buktiFile.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          bukti_file = `data:${buktiFile.type || 'image/jpeg'};base64,${base64}`;
        } catch (_) {
          bukti_file = null;
        }
      }
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO transaksi (tanggal, jenis, kategori_id, user_id, jumlah, keterangan, bukti_file)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tanggal, jenis, kategori_id || null, user.id, jumlah, keterangan, bukti_file);

    const transaksi = db.prepare(`
      SELECT t.*, k.nama as kategori_nama, u.nama as user_nama
      FROM transaksi t
      LEFT JOIN kategori k ON t.kategori_id = k.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return Response.json({ data: transaksi }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Gagal menyimpan transaksi' }, { status: 500 });
  }
}
