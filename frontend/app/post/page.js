'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function Post() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);

  if (!ready) return null;
  if (!user) return <p>Please <Link href="/login">log in</Link> to report an item.</p>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const item = await api('/items', { method: 'POST', form: new FormData(e.target) });
      router.push(`/items/${item.id}`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <form className="form narrow" onSubmit={submit}>
      <h2>Report an item</h2>
      <label>I…
        <select name="type"><option value="lost">lost something</option><option value="found">found something</option></select>
      </label>
      <label>Title<input name="title" required maxLength={120} placeholder="Black leather wallet" /></label>
      <label>Description<textarea name="description" required rows={4} placeholder="Distinguishing details (don't reveal everything — verify claimers)" /></label>
      <label>Category
        <select name="category">{categories.map((c) => <option key={c}>{c}</option>)}</select>
      </label>
      <label>Location<input name="location" required placeholder="Central Park, near fountain" /></label>
      <label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      <label>Photo (optional)<input name="image" type="file" accept="image/*" /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Posting…' : 'Post item'}</button>
    </form>
  );
}
