import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const session = await getSession();
    session.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
    await session.save();

    return Response.json({ user: session.user });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ 
      error: 'Terjadi kesalahan server',
      detail: err?.message || String(err)
    }, { status: 500 });
  }
}
