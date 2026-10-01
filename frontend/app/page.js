'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import ItemCard from '../components/ItemCard';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({ q: '', type: '', category: '', status: 'open' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
      setLoading(true);
      api(`/items?${qs}`).then((d) => { setItems(d); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <section className="hero">
        <h1>Lost something? Found something?</h1>
        <p>Post it here and help belongings find their way home.</p>
      </section>
      <div className="filters">
        <input placeholder="Search title, description, location…" value={f.q} onChange={set('q')} />
        <select value={f.type} onChange={set('type')}>
          <option value="">Lost &amp; Found</option><option value="lost">Lost</option><option value="found">Found</option>
        </select>
        <select value={f.category} onChange={set('category')}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={f.status} onChange={set('status')}>
          <option value="open">Open</option><option value="resolved">Resolved</option><option value="">Any status</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : items.length === 0 ? <p className="muted">No items match.</p> : (
        <div className="grid">{items.map((i) => <ItemCard key={i.id} item={i} />)}</div>
      )}
    </>
  );
}
