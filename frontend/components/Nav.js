'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function Nav() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">🔍 Lost &amp; Found</Link>
        <nav>
          <Link href="/post" className="btn small">+ Report item</Link>
          {user ? (
            <>
              <Link href="/my-items">My items</Link>
              <button className="link" onClick={logout}>Log out ({user.name})</button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
