import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { calculateEstimate } from '../src/estimate.js';

const ADMIN = { email: 'admin@test.dev', password: 'secret-pass' };
let app;

beforeEach(() => {
  const db = openDb(':memory:', { adminEmail: ADMIN.email, adminPassword: ADMIN.password });
  app = createApp({ db, jwtSecret: 'test-secret' });
});

const job = { finish: 'venetian-plaster', area: 100, surface: 'walls', condition: 'smooth' };
const contact = { name: 'Jane Doe', email: 'jane@example.com', message: 'Dining room feature wall' };

async function signIn() {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send(ADMIN).expect(200);
  return agent;
}

// ---------- Pricing logic ----------
test('estimate multiplies area by price range', () => {
  const finish = { priceMin: 10, priceMax: 20 };
  const settings = { ceiling_multiplier: 1.25, repair_multiplier: 1.15, minimum_job: 600 };
  const e = calculateEstimate({ finish, area: 100, surface: 'walls', condition: 'smooth' }, settings);
  assert.equal(e.min, 1000);
  assert.equal(e.max, 2000);
});

test('estimate applies ceiling + repair multipliers and the minimum job', () => {
  const finish = { priceMin: 10, priceMax: 20 };
  const settings = { ceiling_multiplier: 1.25, repair_multiplier: 1.2, minimum_job: 600 };
  const big = calculateEstimate({ finish, area: 100, surface: 'ceiling', condition: 'needs-repair' }, settings);
  assert.equal(big.min, 1500);
  const small = calculateEstimate({ finish, area: 10, surface: 'walls', condition: 'smooth' }, settings);
  assert.equal(small.min, 600);
  assert.equal(small.minimumApplied, true);
});

// ---------- Public API ----------
test('GET /api/finishes returns the seeded catalog', async () => {
  const res = await request(app).get('/api/finishes').expect(200);
  assert.equal(res.body.length, 5);
  assert.equal(res.body[0].slug, 'venetian-plaster');
  assert.ok(Array.isArray(res.body[0].bestFor));
});

test('GET /api/finishes/:slug returns 404 for unknown finish', async () => {
  await request(app).get('/api/finishes/nope').expect(404);
});

test('POST /api/estimate prices a job on the server', async () => {
  const res = await request(app).post('/api/estimate').send(job).expect(200);
  assert.equal(res.body.min, 1200); // 100 sq ft × $12
  assert.equal(res.body.max, 2000); // 100 sq ft × $20
});

test('POST /api/estimate validates input', async () => {
  const res = await request(app).post('/api/estimate').send({ area: 3 }).expect(400);
  assert.deepEqual(Object.keys(res.body.errors).sort(), ['area', 'condition', 'finish', 'surface']);
});

test('POST /api/requests saves a request with a server-side estimate', async () => {
  const res = await request(app)
    .post('/api/requests')
    .send({ ...job, ...contact, estimate_min: 1 }) // a tampered price is ignored
    .expect(201);
  assert.equal(res.body.estimate.min, 1200);
});

// ---------- Auth & admin ----------
test('admin endpoints require sign-in', async () => {
  await request(app).get('/api/admin/requests').expect(401);
  await request(app).patch('/api/admin/finishes/1').send({ priceMin: 1, priceMax: 2 }).expect(401);
});

test('login rejects a wrong password and sets no cookie', async () => {
  const res = await request(app).post('/api/auth/login').send({ ...ADMIN, password: 'wrong' }).expect(401);
  assert.equal(res.headers['set-cookie'], undefined);
});

test('login sets an httpOnly cookie', async () => {
  const res = await request(app).post('/api/auth/login').send(ADMIN).expect(200);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/);
});

test('admin can list requests and update their status', async () => {
  await request(app).post('/api/requests').send({ ...job, ...contact }).expect(201);
  const agent = await signIn();

  const list = await agent.get('/api/admin/requests').expect(200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].finish_name, 'Venetian Plaster');

  await agent.patch(`/api/admin/requests/${list.body[0].id}`).send({ status: 'contacted' }).expect(200);
  await agent.patch(`/api/admin/requests/${list.body[0].id}`).send({ status: 'bogus' }).expect(400);

  const filtered = await agent.get('/api/admin/requests?status=contacted').expect(200);
  assert.equal(filtered.body.length, 1);
});

test('price changes in admin flow straight into new estimates', async () => {
  const agent = await signIn();
  await agent.patch('/api/admin/finishes/1').send({ priceMin: 15, priceMax: 25 }).expect(200);
  await agent.patch('/api/admin/finishes/1').send({ priceMin: 30, priceMax: 20 }).expect(400);

  const res = await request(app).post('/api/estimate').send(job).expect(200);
  assert.equal(res.body.min, 1500);
  assert.equal(res.body.max, 2500);
});
