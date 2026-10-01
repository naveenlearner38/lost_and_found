export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const imageUrl = (p) => (p ? `${API}${p}` : null);

export function getToken() {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
    cache: 'no-store',
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
