import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createApp } from './app.js';
import { openDb } from './db.js';

const root = (p) => fileURLToPath(new URL(p, import.meta.url));

const PORT = process.env.PORT || 3002;

// Demo credentials are used only when real ones aren't configured.
const adminEmail = process.env.ADMIN_EMAIL || 'demo@plaster.dev';
const adminPassword = process.env.ADMIN_PASSWORD || 'demo1234';
if (!process.env.ADMIN_PASSWORD) {
  console.warn(`ADMIN_PASSWORD not set — using demo admin login ${adminEmail} / ${adminPassword}`);
}

const db = openDb(process.env.DB_FILE || root('../data.db'), { adminEmail, adminPassword });
const jwtSecret = process.env.JWT_SECRET || randomBytes(32).toString('hex');

const app = createApp({ db, jwtSecret, clientDist: root('../../client/dist') });

app.listen(PORT, () => {
  console.log(`Plaster studio API running on http://localhost:${PORT}`);
});
