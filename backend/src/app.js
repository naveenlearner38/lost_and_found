const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db, save, id } = require('./store');
const { sign, optionalAuth, requireAuth } = require('./auth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${id()}${path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype) ? null : new Error('Only images allowed'), true),
});

const CATEGORIES = ['electronics', 'documents', 'wallet', 'keys', 'bags', 'clothing', 'pets', 'jewelry', 'other'];
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const publicItem = (i) => {
  const owner = db.users.find((u) => u.id === i.userId);
  return { ...i, ownerName: owner ? owner.name : 'Unknown' };
};

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/categories', (_req, res) => res.json(CATEGORIES));

// ---- Auth
app.post('/api/auth/register', (req, res) => {
  const name = str(req.body.name, 80);
  const email = str(req.body.email, 200).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6)
    return res.status(400).json({ error: 'Name, valid email and a password of 6+ characters are required' });
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: id(), name, email, passwordHash: bcrypt.hashSync(password, 10) };
  db.users.push(user);
  save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = str(req.body.email, 200).toLowerCase();
  const user = db.users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.passwordHash))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: 'Unknown user' });
  res.json(publicUser(user));
});

// ---- Items
app.get('/api/items', (req, res) => {
  const { type, category, status, q, mine } = req.query;
  let items = db.items;
  if (mine === 'true') {
    const uid = optionalAuthId(req);
    if (!uid) return res.status(401).json({ error: 'Authentication required' });
    items = items.filter((i) => i.userId === uid);
  }
  if (type === 'lost' || type === 'found') items = items.filter((i) => i.type === type);
  if (category) items = items.filter((i) => i.category === category);
  if (status === 'open' || status === 'resolved') items = items.filter((i) => i.status === status);
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter((i) => `${i.title} ${i.description} ${i.location}`.toLowerCase().includes(needle));
  }
  items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(items.map(publicItem));
});

function optionalAuthId(req) {
  let out = null;
  optionalAuth(req, null, () => (out = req.userId));
  return out;
}

app.get('/api/items/:id', (req, res) => {
  const item = db.items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(publicItem(item));
});

app.post('/api/items', requireAuth, upload.single('image'), (req, res) => {
  const b = req.body;
  const item = {
    id: id(),
    userId: req.userId,
    type: b.type === 'found' ? 'found' : 'lost',
    title: str(b.title, 120),
    description: str(b.description, 2000),
    category: CATEGORIES.includes(b.category) ? b.category : 'other',
    location: str(b.location, 200),
    date: str(b.date, 10) || new Date().toISOString().slice(0, 10),
    image: req.file ? `/uploads/${req.file.filename}` : null,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  if (!item.title || !item.description || !item.location) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Title, description and location are required' });
  }
  db.items.push(item);
  save();
  res.status(201).json(publicItem(item));
});

function ownedItem(req, res) {
  const item = db.items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' }), null;
  if (item.userId !== req.userId) return res.status(403).json({ error: 'Not your item' }), null;
  return item;
}

app.patch('/api/items/:id', requireAuth, (req, res) => {
  const item = ownedItem(req, res);
  if (!item) return;
  const b = req.body;
  if (b.status === 'open' || b.status === 'resolved') item.status = b.status;
  for (const [k, max] of [['title', 120], ['description', 2000], ['location', 200]]) {
    if (b[k] !== undefined && str(b[k], max)) item[k] = str(b[k], max);
  }
  save();
  res.json(publicItem(item));
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
  const item = ownedItem(req, res);
  if (!item) return;
  db.items.splice(db.items.indexOf(item), 1);
  db.messages = db.messages.filter((m) => m.itemId !== item.id);
  if (item.image) fs.unlink(path.join(UPLOAD_DIR, path.basename(item.image)), () => {});
  save();
  res.status(204).end();
});

// ---- Messages (claims / contact the poster)
app.post('/api/items/:id/messages', requireAuth, (req, res) => {
  const item = db.items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.userId === req.userId) return res.status(400).json({ error: "You can't message yourself" });
  const body = str(req.body.body, 1000);
  if (!body) return res.status(400).json({ error: 'Message is required' });
  const from = db.users.find((u) => u.id === req.userId);
  const msg = {
    id: id(), itemId: item.id, fromUserId: from.id, fromName: from.name,
    fromEmail: from.email, body, createdAt: new Date().toISOString(),
  };
  db.messages.push(msg);
  save();
  res.status(201).json({ id: msg.id });
});

// Owner reads messages on their item.
app.get('/api/items/:id/messages', requireAuth, (req, res) => {
  const item = ownedItem(req, res);
  if (!item) return;
  res.json(db.messages.filter((m) => m.itemId === item.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError || err.message === 'Only images allowed' ? 400 : 500;
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
  if (status === 500) console.error(err);
});

module.exports = app;
