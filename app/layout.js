import './globals.css';

export const metadata = {
  title: 'Kas Bendahara Desa',
  description: 'Sistem Pencatatan Keuangan Kas Desa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
