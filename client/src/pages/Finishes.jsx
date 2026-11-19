import FinishCard from '../components/FinishCard.jsx';
import { useFinishes } from '../useFinishes.js';

export default function Finishes() {
  const { finishes, loading, error } = useFinishes();

  return (
    <section className="section page-top">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Finishes</p>
          <h1 className="page-title">Choose your finish</h1>
          <p className="section-lead">
            Each finish is mixed and tinted for your space. Prices are per square foot and depend on
            surface, condition and detail work.
          </p>
        </div>
        {loading && <p className="muted">Loading finishes…</p>}
        {error && <p className="form-alert">Couldn’t load finishes. Please refresh the page.</p>}
        <div className="finish-grid finish-grid-lg">
          {finishes.map((f, i) => <FinishCard key={f.id} finish={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
