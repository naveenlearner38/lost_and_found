'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthForm({ mode }) {
  const reg = mode === 'register';
  const router = useRouter();
  const { login } = useAuth();
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      login(await api(`/auth/${mode}`, { method: 'POST', body: v }));
      router.push('/');
    } catch (err) { setError(err.message); }
  }

  return (
    <form className="form narrow" onSubmit={submit}>
      <h2>{reg ? 'Create account' : 'Log in'}</h2>
      {reg && <label>Name<input required value={v.name} onChange={set('name')} /></label>}
      <label>Email<input type="email" required value={v.email} onChange={set('email')} /></label>
      <label>Password<input type="password" required minLength={6} value={v.password} onChange={set('password')} /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn">{reg ? 'Sign up' : 'Log in'}</button>
    </form>
  );
}
