'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, imageUrl } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

export default function ItemPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const isOwner = user && item && user.id === item.userId;

  const load = useCallback(() => api(`/items/${id}`).then(setItem).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isOwner) api(`/items/${id}/messages`).then(setMessages).catch(() => {});
  }, [isOwner, id]);

  async function send(e) {
    e.preventDefault(); setError('');
    try { await api(`/items/${id}/messages`, { method: 'POST', body: { body: text } }); setSent(true); setText(''); }
    catch (err) { setError(err.message); }
  }
  async function toggle() {
    try { setItem(await api(`/items/${id}`, { method: 'PATCH', body: { status: item.status === 'open' ? 'resolved' : 'open' } })); }
    catch (err) { setError(err.message); }
  }
  async function remove() {
    if (!confirm('Delete this post?')) return;
    try { await api(`/items/${id}`, { method: 'DELETE' }); router.push('/my-items'); }
    catch (err) { setError(err.message); }
  }

  if (!item) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  const img = imageUrl(item.image);

  return (
    <article className="detail">
      {img && <img src={img} alt={item.title} />}
      <div>
        <span className={`badge ${item.type}`}>{item.type}</span>
        {item.status === 'resolved' && <span className="badge resolved">resolved</span>}
        <h1>{item.title}</h1>
        <p className="muted">📍 {item.location} · {item.date} · {item.category}</p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
        <p className="muted">Posted by {item.ownerName}</p>

        {error && <p className="error">{error}</p>}

        {isOwner ? (
          <>
            <div className="row">
              <button className="btn" onClick={toggle}>{item.status === 'open' ? 'Mark resolved' : 'Reopen'}</button>
              <button className="btn danger" onClick={remove}>Delete</button>
            </div>
            <h3>Messages ({messages.length})</h3>
            {messages.length === 0 && <p className="muted">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className="msg">
                <strong>{m.fromName}</strong> <a href={`mailto:${m.fromEmail}`}>{m.fromEmail}</a>
                <p>{m.body}</p>
              </div>
            ))}
          </>
        ) : user ? (
          sent ? <p className="success">Message sent! The poster will contact you by email.</p> : (
            <form className="form" onSubmit={send}>
              <h3>{item.type === 'lost' ? 'I found this' : 'This is mine'}</h3>
              <textarea required rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe how you can prove ownership or where you saw it…" />
              <button className="btn">Send message</button>
            </form>
          )
        ) : (
          <p><Link href="/login">Log in</Link> to contact the poster.</p>
        )}
      </div>
    </article>
  );
}
