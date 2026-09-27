'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Bendahara', email: 'bendahara@desa.id', password: 'bendahara123', icon: '💼' },
    { label: 'Kepala Desa', email: 'kades@desa.id', password: 'kades123', icon: '🏛️' },
    { label: 'Sekretaris', email: 'sekdes@desa.id', password: 'sekdes123', icon: '📝' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏛️</div>
          <h1 className="login-title">Kas Bendahara Desa</h1>
          <p className="login-subtitle">Sistem Pencatatan Keuangan Kas Desa</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="contoh@desa.id"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Masukkan password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%', marginTop:'8px'}} disabled={loading}>
            {loading ? '⏳ Memproses...' : '🔐 Masuk'}
          </button>
        </form>

        <div style={{marginTop:'24px', paddingTop:'20px', borderTop:'1px solid var(--border-light)'}}>
          <p style={{fontSize:'12px', color:'var(--text-secondary)', marginBottom:'10px', textAlign:'center'}}>
            🧪 <strong>Akun Demo:</strong>
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                className="btn btn-outline btn-sm"
                style={{justifyContent:'flex-start', gap:'8px'}}
                onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
              >
                <span>{acc.icon}</span>
                <span>{acc.label}</span>
                <span style={{marginLeft:'auto', opacity:0.6, fontSize:'11px'}}>{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
