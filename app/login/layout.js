import { AuthProvider } from '@/components/AuthProvider';

export const metadata = {
  title: { template: '%s — Kas Bendahara Desa', default: 'Kas Bendahara Desa' },
};

export default function LoginLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
