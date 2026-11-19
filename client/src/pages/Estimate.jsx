import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, money } from '../api.js';
import { useFinishes } from '../useFinishes.js';

const SURFACES = [
  { id: 'walls', label: 'Walls' },
  { id: 'ceiling', label: 'Ceiling' },
];
const CONDITIONS = [
  { id: 'smooth', label: 'Smooth & ready', hint: 'Painted drywall in good shape' },
  { id: 'needs-repair', label: 'Needs repair', hint: 'Cracks, texture or patching first' },
];

export default function Estimate() {
  const [params] = useSearchParams();
  const { finishes } = useFinishes();

  const [job, setJob] = useState({
    finish: params.get('finish') || 'venetian-plaster',
    area: 120,
    surface: 'walls',
    condition: 'smooth',
  });
  const [dims, setDims] = useState({ width: '', height: '' });
  const [estimate, setEstimate] = useState(null);
  const [estimateError, setEstimateError] = useState('');

  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  // Re-price whenever the job changes (debounced so typing doesn't spam the API).
  useEffect(() => {
    const t = setTimeout(() => {
      api
        .estimate(job)
        .then((e) => {
          setEstimate(e);
          setEstimateError('');
        })
        .catch((e) => {
          setEstimate(null);
          setEstimateError(Object.values(e.errors)[0] || 'Couldn’t calculate an estimate.');
        });
    }, 250);
    return () => clearTimeout(t);
  }, [job]);

  const setField = (k, v) => setJob((j) => ({ ...j, [k]: v }));

  const applyDims = () => {
    const area = Math.round(Number(dims.width) * Number(dims.height));
    if (area > 0) setField('area', area);
  };

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (contact.name.trim().length < 2) found.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) found.email = 'Please enter a valid email address.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus('sending');
    try {
      await api.submitRequest({ ...job, ...contact });
      setStatus('sent');
    } catch (err) {
      setErrors(err.errors);
      setStatus('error');
    }
  }

  const chosen = finishes.find((f) => f.slug === job.finish);

  if (status === 'sent') {
    return (
      <section className="section page-top">
        <div className="container narrow center">
          <p className="eyebrow">Request received</p>
          <h1 className="page-title">Thank you, {contact.name.split(' ')[0]}.</h1>
          <p className="muted">
            We’ll contact you to schedule a visit with samples. Your estimate:{' '}
            <strong className="gold">{money(estimate.min)} – {money(estimate.max)}</strong> for{' '}
            {chosen?.name}.
          </p>
          <Link to="/" className="btn">Back to home</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Instant estimate</p>
          <h1 className="page-title">Price your wall</h1>
          <p className="section-lead">A ballpark range in seconds. Final pricing is confirmed after a free site visit.</p>
        </div>

        <div className="calc">
          <div className="calc-steps">
            <fieldset>
              <legend><span>1</span> Finish</legend>
              <div className="swatches">
                {finishes.map((f) => (
                  <label key={f.slug} className={`swatch ${job.finish === f.slug ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="finish"
                      value={f.slug}
                      checked={job.finish === f.slug}
                      onChange={() => setField('finish', f.slug)}
                    />
                    <img src={f.image} alt="" />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend><span>2</span> Area</legend>
              <div className="area-row">
                <label className="field">
                  Square feet
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={job.area}
                    onChange={(e) => setField('area', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </label>
                <div className="dims">
                  <span className="muted small">Or measure one wall:</span>
                  <div className="dims-row">
                    <input
                      aria-label="Wall width in feet"
                      placeholder="Width ft"
                      type="number"
                      value={dims.width}
                      onChange={(e) => setDims({ ...dims, width: e.target.value })}
                    />
                    <span aria-hidden="true">×</span>
                    <input
                      aria-label="Wall height in feet"
                      placeholder="Height ft"
                      type="number"
                      value={dims.height}
                      onChange={(e) => setDims({ ...dims, height: e.target.value })}
                    />
                    <button type="button" className="btn btn-ghost btn-small" onClick={applyDims}>Use</button>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>3</span> Surface</legend>
              <div className="toggle">
                {SURFACES.map((s) => (
                  <label key={s.id} className={job.surface === s.id ? 'is-active' : ''}>
                    <input type="radio" name="surface" checked={job.surface === s.id} onChange={() => setField('surface', s.id)} />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend><span>4</span> Condition</legend>
              <div className="toggle toggle-tall">
                {CONDITIONS.map((c) => (
                  <label key={c.id} className={job.condition === c.id ? 'is-active' : ''}>
                    <input type="radio" name="condition" checked={job.condition === c.id} onChange={() => setField('condition', c.id)} />
                    {c.label}
                    <small>{c.hint}</small>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="calc-result" aria-live="polite">
            <p className="eyebrow">Your estimate</p>
            {estimate ? (
              <>
                <p className="range">
                  {money(estimate.min)} <span>–</span> {money(estimate.max)}
                </p>
                <dl className="breakdown">
                  <div><dt>Finish</dt><dd>{estimate.finish}</dd></div>
                  <div><dt>Area</dt><dd>{job.area} sq ft</dd></div>
                  <div><dt>Rate</dt><dd>{money(estimate.perSqFt.min)}–{money(estimate.perSqFt.max)} / sq ft</dd></div>
                  {estimate.multiplier !== 1 && <div><dt>Adjustments</dt><dd>× {estimate.multiplier}</dd></div>}
                </dl>
                {estimate.minimumApplied && <p className="muted small">Minimum project price applies.</p>}
              </>
            ) : (
              <p className="field-error">{estimateError || 'Calculating…'}</p>
            )}

            <form className="contact" onSubmit={submit} noValidate>
              <p className="small">Like the number? Send it to us and we’ll schedule a visit.</p>
              <label className="field">
                Name
                <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} aria-invalid={!!errors.name} autoComplete="name" />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </label>
              <label className="field">
                Email
                <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} aria-invalid={!!errors.email} autoComplete="email" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label className="field">
                <span>Phone <span className="muted">(optional)</span></span>
                <input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </label>
              <label className="field">
                <span>Notes <span className="muted">(optional)</span></span>
                <textarea rows="3" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Room, color ideas, timeline…" />
              </label>
              <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} />
              {status === 'error' && <p className="form-alert" role="alert">Please check the form and try again.</p>}
              <button className="btn btn-block" disabled={status === 'sending' || !estimate}>
                {status === 'sending' ? 'Sending…' : 'Request a visit'}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </section>
  );
}
