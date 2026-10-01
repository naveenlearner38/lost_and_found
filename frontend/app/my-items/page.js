'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import ItemCard from '../../components/ItemCard';

export default function MyItems() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) api('/items?mine=true').then(setItems).catch((e) => setError(e.message));
  }, [user]);

  if (!ready) return null;
  if (!user) return <p>Please <Link href="/login">log in</Link>.</p>;
  return (
    <>
      <h2>My items</h2>
      {error && <p className="error">{error}</p>}
      {items === null ? <p className="muted">Loading…</p> : items.length === 0 ? <p className="muted">You haven't posted anything yet.</p> : (
        <div className="grid">{items.map((i) => <ItemCard key={i.id} item={i} />)}</div>
      )}
    </>
  );
}
