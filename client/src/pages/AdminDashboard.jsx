import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';
import { Brand } from '../components/Layout.jsx';

const STATUSES = ['new', 'contacted', 'scheduled', 'closed'];
const fmtDate = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

function PriceRow({ finish, onSaved }) {
  const [min, setMin] = useState(finish.priceMin);
  const [max, setMax] = useState(finish.priceMax);
  const [state, setState] = useState(''); // '' | saving | saved | error
  const [error, setError] = useState('');
  const dirty = Number(min) !== finish.priceMin || Number(max) !== finish.priceMax;

  async function save() {
    setState('saving');
    try {
      const { finish: updated } = await api.updatePrice(finish.id, Number(min), Number(max));
      onSaved(updated);
      setState('saved');
      setError('');
    } catch (e) {
      setState('error');
      setError(e.message);
    }
  }

  return (
    <tr>
      <td>{finish.name}</td>
      <td><input type="number" step="0.5" min="0" value={min} onChange={(e) => { setMin(e.target.value); setState(''); }} aria-label={`${finish.name} minimum price`} /></td>
      <td><input type="number" step="0.5" min="0" value={max} onChange={(e) => { setMax(e.target.value); setState(''); }} aria-label={`${finish.name} maximum price`} /></td>
      <td>
        <button className="btn btn-small" disabled={!dirty || state === 'saving'} onClick={save}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {state === 'saved' && <span className="saved"> Saved</span>}
        {state === 'error' && <span className="field-error"> {error}</span>}
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [finishes, setFinishes] = useState([]);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const [reqs, st] = await Promise.all([api.adminRequests(filter), api.adminStats()]);
    setRequests(reqs);
    setStats(st);
  }, [filter]);

  // Guard: send visitors who aren't signed in to the login page.
  useEffect(() => {
    api.me()
      .then(({ admin }) => setAdmin(admin))
      .catch(() => navigate('/admin/login', { replace: true }));
    api.finishes().then(setFinishes);
  }, [navigate]);

  useEffect(() => {
    if (admin) load().catch(() => navigate('/admin/login', { replace: true }));
  }, [admin, load, navigate]);

  async function changeStatus(id, status) {
    await api.updateStatus(id, status);
    load();
  }

  async function logout() {
    await api.logout();
    navigate('/admin/login');
  }

  if (!admin) return <div className="admin-loading">Checking session…</div>;

  return (
    <div className="admin">
      <header className="admin-bar">
        <Brand />
        <div className="admin-user">
          <span className="muted small">{admin.email}</span>
          <Link to="/" className="text-link small">View site</Link>
          <button className="btn btn-ghost btn-small" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="admin-body">
        <h1 className="page-title">Dashboard</h1>

        {stats && (
          <div className="stats">
            <div><span>Total requests</span><strong>{stats.total}</strong></div>
            <div><span>New</span><strong>{stats.new ?? 0}</strong></div>
            <div><span>Open pipeline</span><strong>{money(stats.pipeline)}</strong></div>
          </div>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Estimate requests</h2>
            <label className="small">
              Status{' '}
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          {requests.length === 0 ? (
            <p className="muted empty">No requests yet. Submit one from the <Link to="/estimate">estimate page</Link>.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th><th>Client</th><th>Project</th><th>Estimate</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="nowrap">{fmtDate(r.created_at)}</td>
                      <td>
                        <strong>{r.name}</strong>
                        <div className="muted small">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                        {r.message && <div className="small note">“{r.message}”</div>}
                      </td>
                      <td>
                        {r.finish_name}
                        <div className="muted small">{r.area} sq ft · {r.surface} · {r.condition.replace('-', ' ')}</div>
                      </td>
                      <td className="nowrap">{money(r.estimate_min)} – {money(r.estimate_max)}</td>
                      <td>
                        <select className={`status status-${r.status}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} aria-label={`Status for ${r.name}`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Prices per sq ft</h2>
            <span className="muted small">Changes apply to new estimates immediately.</span>
          </div>
          <div className="table-wrap">
            <table className="table prices">
              <thead><tr><th>Finish</th><th>Min $</th><th>Max $</th><th /></tr></thead>
              <tbody>
                {finishes.map((f) => (
                  <PriceRow key={f.id} finish={f} onSaved={(u) => setFinishes((all) => all.map((x) => (x.id === u.id ? u : x)))} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
