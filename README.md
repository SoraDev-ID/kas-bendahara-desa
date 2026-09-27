# 💰 Kas Bendahara Desa

Aplikasi pencatatan kas keuangan desa berbasis web. Dibangun sebagai demo/prototype untuk membantu bendahara desa mencatat pemasukan, pengeluaran, dan membuat laporan keuangan bulanan secara digital.

> ⚠️ **Ini adalah versi demo/prototype.** Belum direkomendasikan untuk penggunaan produksi tanpa pengujian lebih lanjut.

---

## ✨ Fitur Utama

- **Dashboard** — ringkasan saldo, total pemasukan & pengeluaran, grafik keuangan bulanan
- **Input Transaksi** — catat pemasukan dan pengeluaran beserta bukti (upload file)
- **Riwayat Transaksi** — daftar semua transaksi dengan filter tanggal dan kategori
- **Manajemen Kategori** — kelola kategori pemasukan/pengeluaran sesuai kebutuhan desa
- **Laporan Bulanan** — rekap keuangan per bulan, bisa diekspor ke PDF
- **Multi-role** — tiga level akses: Bendahara, Kepala Desa, dan Sekretaris Desa

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Auth | [iron-session](https://github.com/vvo/iron-session) |
| Charts | [Recharts](https://recharts.org/) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) + html2canvas |
| Password | bcryptjs |

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- Node.js v18 atau lebih baru
- npm

### Langkah-langkah

**1. Clone repository**

```bash
git clone https://github.com/<username>/kas-bendahara-desa.git
cd kas-bendahara-desa
```

**2. Install dependencies**

```bash
npm install
```

**3. Jalankan development server**

```bash
npm run dev
```

**4. Buka di browser**

```
http://localhost:3000
```

Database SQLite akan dibuat otomatis di `data/kas.db` saat server pertama kali dijalankan. Akun demo dan kategori default juga akan di-seed secara otomatis — tidak perlu setup manual.

---

## 👤 Akun Demo

Setelah server pertama kali dijalankan, tiga akun berikut sudah tersedia:

| Role | Email | Password |
|------|-------|----------|
| Bendahara | `bendahara@desa.id` | `bendahara123` |
| Kepala Desa | `kades@desa.id` | `kades123` |
| Sekretaris Desa | `sekdes@desa.id` | `sekdes123` |

> **Catatan keamanan:** Ganti password akun-akun ini sebelum deploy ke lingkungan nyata.

Jika ingin mereset database ke kondisi awal (hanya akun & kategori default, tanpa data transaksi), hapus file `data/kas.db` lalu restart server.

---

## 📁 Struktur Project

```
kas-bendahara-desa/
├── app/
│   ├── (app)/          # Halaman utama (dashboard, transaksi, laporan, dll)
│   ├── api/            # API routes (Next.js Route Handlers)
│   └── login/          # Halaman login
├── components/         # Komponen React yang dapat digunakan ulang
├── lib/
│   ├── db.js           # Koneksi & inisialisasi database SQLite
│   ├── session.js      # Konfigurasi iron-session
│   └── utils.js        # Helper functions
├── public/             # Aset statis
└── data/               # Folder database (dibuat otomatis, tidak ter-commit)
```

---

## ⚠️ Catatan Penting

- **Bukan untuk produksi** — aplikasi ini dibuat sebagai demo/prototype
- File database (`data/kas.db`) tidak ter-commit ke repository untuk menjaga privasi data
- Tidak ada fitur enkripsi data transaksi — pertimbangkan ini sebelum menyimpan data sensitif
- Upload bukti transaksi disimpan di `public/uploads/` (juga tidak ter-commit)

---

## 📄 Lisensi

MIT License — bebas digunakan dan dimodifikasi.
