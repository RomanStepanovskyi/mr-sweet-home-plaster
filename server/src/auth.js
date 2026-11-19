import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const COOKIE = 'admin_token';
const TTL_SECONDS = 60 * 60 * 8; // 8-hour session

export function createAuth(db, secret) {
  const findAdmin = db.prepare('SELECT id, email, password_hash FROM admins WHERE email = ?');

  // Compare against a dummy hash when the email is unknown so response time
  // doesn't reveal which emails exist.
  const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

  function login(email, password) {
    const admin = findAdmin.get(String(email || '').trim().toLowerCase());
    const ok = bcrypt.compareSync(String(password || ''), admin ? admin.password_hash : DUMMY_HASH);
    if (!admin || !ok) return null;
    const token = jwt.sign({ sub: admin.id, email: admin.email }, secret, { expiresIn: TTL_SECONDS });
    return { token, admin: { id: admin.id, email: admin.email } };
  }

  function cookieOptions(req) {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      maxAge: TTL_SECONDS * 1000,
      path: '/',
    };
  }

  /** Express middleware: only lets signed-in admins through. */
  function requireAdmin(req, res, next) {
    try {
      const payload = jwt.verify(req.cookies?.[COOKIE] || '', secret);
      req.admin = { id: payload.sub, email: payload.email };
      next();
    } catch {
      res.status(401).json({ ok: false, error: 'Please sign in.' });
    }
  }

  return { login, cookieOptions, requireAdmin };
}
