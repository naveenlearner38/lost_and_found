import Link from 'next/link';
import { imageUrl } from '../lib/api';

export default function ItemCard({ item }) {
  const img = imageUrl(item.image);
  return (
    <Link href={`/items/${item.id}`} className="card">
      {img ? <img src={img} alt={item.title} /> : <div className="noimg">No photo</div>}
      <div className="card-body">
        <div>
          <span className={`badge ${item.type}`}>{item.type}</span>
          {item.status === 'resolved' && <span className="badge resolved">resolved</span>}
        </div>
        <h3>{item.title}</h3>
        <p className="muted">📍 {item.location}</p>
        <p className="muted">{item.date} · {item.category}</p>
      </div>
    </Link>
  );
}
