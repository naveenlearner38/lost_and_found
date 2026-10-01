const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const sign = (user) => jwt.sign({ sub: user.id }, SECRET, { expiresIn: '7d' });

function parse(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.slice(7), SECRET).sub;
  } catch {
    return null;
  }
}

function optionalAuth(req, _res, next) {
  req.userId = parse(req);
  next();
}

function requireAuth(req, res, next) {
  req.userId = parse(req);
  if (!req.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
}

module.exports = { sign, optionalAuth, requireAuth };
