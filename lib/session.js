import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'kas-bendahara-desa-super-secret-key-2024-minimum-32chars',
  cookieName: 'kas_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8 jam
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user) {
    return null;
  }
  return session.user;
}

export async function requireRole(...roles) {
  const user = await requireAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}
