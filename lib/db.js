import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import os from 'os';

let db;

function getDbPath() {
  // Lingkungan serverless seperti Netlify / AWS Lambda / Vercel memiliki filesystem read-only di process.cwd().
  // Satu-satunya direktori yang dapat ditulisi adalah os.tmpdir() (/tmp).
  const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL;
  if (isServerless) {
    return path.join(os.tmpdir(), 'kas.db');
  }

  // Coba gunakan folder data lokal jika bisa ditulisi, fallback ke tmpdir jika read-only
  try {
    const localDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'kas.db');
  } catch (err) {
    return path.join(os.tmpdir(), 'kas.db');
  }
}

export function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    const dbDir = path.dirname(dbPath);

    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (_) {}

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (_) {}

    db = new Database(dbPath);
    try {
      db.pragma('journal_mode = WAL');
    } catch (_) {
      try {
        db.pragma('journal_mode = DELETE');
      } catch (_) {}
    }
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('bendahara','kades','sekdes')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kategori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      jenis TEXT NOT NULL CHECK(jenis IN ('masuk','keluar')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      jenis TEXT NOT NULL CHECK(jenis IN ('masuk','keluar')),
      kategori_id INTEGER,
      user_id INTEGER NOT NULL,
      jumlah INTEGER NOT NULL,
      keterangan TEXT,
      bukti_file TEXT,
      catatan_sekdes TEXT,
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(kategori_id) REFERENCES kategori(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(approved_by) REFERENCES users(id)
    );
  `);

  // Seed default users jika belum ada
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount.c === 0) {
    const hashPw = (pw) => bcrypt.hashSync(pw, 10);
    db.prepare(`INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)`).run('Bendahara Desa', 'bendahara@desa.id', hashPw('bendahara123'), 'bendahara');
    db.prepare(`INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)`).run('Kepala Desa', 'kades@desa.id', hashPw('kades123'), 'kades');
    db.prepare(`INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)`).run('Sekretaris Desa', 'sekdes@desa.id', hashPw('sekdes123'), 'sekdes');
  }

  // Seed kategori default
  const katCount = db.prepare('SELECT COUNT(*) as c FROM kategori').get();
  if (katCount.c === 0) {
    const kategoriDefault = [
      { nama: 'Dana Desa', jenis: 'masuk' },
      { nama: 'ADD (Alokasi Dana Desa)', jenis: 'masuk' },
      { nama: 'PBB (Pajak Bumi dan Bangunan)', jenis: 'masuk' },
      { nama: 'Pendapatan Lain-lain', jenis: 'masuk' },
      { nama: 'Belanja Operasional', jenis: 'keluar' },
      { nama: 'Belanja Modal', jenis: 'keluar' },
      { nama: 'Belanja Pegawai', jenis: 'keluar' },
      { nama: 'Belanja Barang/Jasa', jenis: 'keluar' },
      { nama: 'Lain-lain', jenis: 'keluar' },
    ];
    const stmt = db.prepare('INSERT INTO kategori (nama, jenis) VALUES (?, ?)');
    for (const k of kategoriDefault) stmt.run(k.nama, k.jenis);
  }
}
