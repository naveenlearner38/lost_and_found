const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'laf-'));
process.env.DATA_DIR = tmp;
process.env.UPLOAD_DIR = path.join(tmp, 'up');

const app = require('./src/app');

test('register, post item, search, message, resolve', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (p, method = 'GET', body, token) => {
    const r = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
    return { status: r.status, data: r.status === 204 ? null : await r.json() };
  };
  try {
    const a = (await call('/auth/register', 'POST', { name: 'Ann', email: 'a@x.com', password: 'secret1' })).data;
    const b = (await call('/auth/register', 'POST', { name: 'Bob', email: 'b@x.com', password: 'secret1' })).data;
    assert.equal((await call('/items', 'POST', { title: 'x' })).status, 401);
    const item = (await call('/items', 'POST', { type: 'lost', title: 'Blue wallet', description: 'leather', location: 'Park', category: 'wallet' }, a.token)).data;
    assert.equal((await call('/items?q=wallet')).data.length, 1);
    assert.equal((await call('/items?q=zzz')).data.length, 0);
    assert.equal((await call('/items?mine=true', 'GET', null, a.token)).data.length, 1);
    assert.equal((await call(`/items/${item.id}/messages`, 'POST', { body: 'Found it!' }, b.token)).status, 201);
    assert.equal((await call(`/items/${item.id}/messages`, 'GET', null, b.token)).status, 403);
    assert.equal((await call(`/items/${item.id}/messages`, 'GET', null, a.token)).data.length, 1);
    assert.equal((await call(`/items/${item.id}`, 'PATCH', { status: 'resolved' }, b.token)).status, 403);
    assert.equal((await call(`/items/${item.id}`, 'PATCH', { status: 'resolved' }, a.token)).data.status, 'resolved');
    assert.equal((await call(`/items/${item.id}`, 'DELETE', null, a.token)).status, 204);
  } finally {
    server.close();
  }
});
