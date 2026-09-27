import { getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return Response.json({ user: null });
  }
  return Response.json({ user: session.user });
}
