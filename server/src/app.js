import express from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { rowToFinish, getSettings } from './db.js';
import { calculateEstimate, validateJob, validateContact } from './estimate.js';
import { createAuth, COOKIE } from './auth.js';

const STATUSES = ['new', 'contacted', 'scheduled', 'closed'];

export function createApp({ db, jwtSecret, clientDist } = {}) {
  const app = express();
  const auth = createAuth(db, jwtSecret);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());

  const q = {
    finishes: db.prepare('SELECT * FROM finishes ORDER BY sort'),
    finishBySlug: db.prepare('SELECT * FROM finishes WHERE slug = ?'),
    finishById: db.prepare('SELECT * FROM finishes WHERE id = ?'),
    insertRequest: db.prepare(`
      INSERT INTO requests (name, email, phone, finish_id, area, surface, condition, estimate_min, estimate_max, message)
      VALUES (@name, @email, @phone, @finish_id, @area, @surface, @condition, @estimate_min, @estimate_max, @message)
    `),
    requests: db.prepare(`
      SELECT r.*, f.name AS finish_name FROM requests r
      JOIN finishes f ON f.id = r.finish_id
      WHERE (@status IS NULL OR r.status = @status)
      ORDER BY r.created_at DESC, r.id DESC
    `),
    updateStatus: db.prepare('UPDATE requests SET status = ? WHERE id = ?'),
    updatePrice: db.prepare('UPDATE finishes SET price_min = ?, price_max = ? WHERE id = ?'),
    stats: db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'new') AS new,
        COALESCE(SUM(CASE WHEN status != 'closed' THEN (estimate_min + estimate_max) / 2 END), 0) AS pipeline
      FROM requests
    `),
  };

  const priceJob = (job) => {
    const row = q.finishBySlug.get(job.finish);
    if (!row) return null;
    const finish = rowToFinish(row);
    return { finish, estimate: calculateEstimate({ ...job, finish }, getSettings(db)) };
  };

  // ---------- Public API ----------
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/finishes', (_req, res) => {
    res.json(q.finishes.all().map(rowToFinish));
  });

  app.get('/api/finishes/:slug', (req, res) => {
    const row = q.finishBySlug.get(req.params.slug);
    if (!row) return res.status(404).json({ ok: false, error: 'Finish not found' });
    res.json(rowToFinish(row));
  });

  app.post('/api/estimate', (req, res) => {
    const { errors, job } = validateJob(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });
    const priced = priceJob(job);
    if (!priced) return res.status(400).json({ ok: false, errors: { finish: 'Unknown finish.' } });
    res.json({ ok: true, finish: priced.finish.name, ...priced.estimate });
  });

  app.post('/api/requests', (req, res) => {
    if (req.body?.website) return res.status(201).json({ ok: true }); // honeypot
    const jobCheck = validateJob(req.body);
    const contactCheck = validateContact(req.body);
    const errors = { ...jobCheck.errors, ...contactCheck.errors };
    if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

    const priced = priceJob(jobCheck.job);
    if (!priced) return res.status(400).json({ ok: false, errors: { finish: 'Unknown finish.' } });

    // The estimate is recalculated on the server — never trusted from the client.
    const info = q.insertRequest.run({
      ...contactCheck.contact,
      phone: contactCheck.contact.phone || null,
      message: contactCheck.contact.message || null,
      finish_id: priced.finish.id,
      area: jobCheck.job.area,
      surface: jobCheck.job.surface,
      condition: jobCheck.job.condition,
      estimate_min: priced.estimate.min,
      estimate_max: priced.estimate.max,
    });
    res.status(201).json({ ok: true, id: info.lastInsertRowid, estimate: priced.estimate });
  });

  // ---------- Auth ----------
  app.post('/api/auth/login', (req, res) => {
    const result = auth.login(req.body?.email, req.body?.password);
    if (!result) return res.status(401).json({ ok: false, error: 'Incorrect email or password.' });
    res.cookie(COOKIE, result.token, auth.cookieOptions(req));
    res.json({ ok: true, admin: result.admin });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE, { ...auth.cookieOptions(req), maxAge: undefined });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', auth.requireAdmin, (req, res) => res.json({ ok: true, admin: req.admin }));

  // ---------- Admin API (requires sign-in) ----------
  const admin = express.Router();
  admin.use(auth.requireAdmin);

  admin.get('/requests', (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null;
    res.json(q.requests.all({ status }));
  });

  admin.get('/stats', (_req, res) => res.json(q.stats.get()));

  admin.patch('/requests/:id', (req, res) => {
    if (!STATUSES.includes(req.body?.status)) {
      return res.status(400).json({ ok: false, error: `Status must be one of: ${STATUSES.join(', ')}` });
    }
    const info = q.updateStatus.run(req.body.status, Number(req.params.id));
    if (!info.changes) return res.status(404).json({ ok: false, error: 'Request not found' });
    res.json({ ok: true });
  });

  admin.patch('/finishes/:id', (req, res) => {
    const min = Number(req.body?.priceMin);
    const max = Number(req.body?.priceMax);
    if (!(min > 0 && max >= min && max <= 500)) {
      return res.status(400).json({ ok: false, error: 'Prices must be positive, and max must be at least min.' });
    }
    const info = q.updatePrice.run(min, max, Number(req.params.id));
    if (!info.changes) return res.status(404).json({ ok: false, error: 'Finish not found' });
    res.json({ ok: true, finish: rowToFinish(q.finishById.get(Number(req.params.id))) });
  });

  app.use('/api/admin', admin);
  app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

  // ---------- Serve the React app in production ----------
  if (clientDist && existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile('index.html', { root: clientDist }));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  });

  return app;
}
