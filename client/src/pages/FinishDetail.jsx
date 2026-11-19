import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../api.js';
import NotFound from './NotFound.jsx';

export default function FinishDetail() {
  const { slug } = useParams();
  const [finish, setFinish] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    api
      .finish(slug)
      .then((f) => {
        setFinish(f);
        setStatus('ok');
      })
      .catch((e) => setStatus(e.status === 404 ? 'missing' : 'error'));
  }, [slug]);

  if (status === 'missing') return <NotFound />;
  if (status !== 'ok') {
    return (
      <section className="section page-top">
        <div className="container">
          <p className="muted">{status === 'error' ? 'Couldn’t load this finish.' : 'Loading…'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-top">
      <div className="container detail">
        <figure className="detail-img">
          <img src={finish.image} alt={`${finish.name} texture`} />
        </figure>
        <div className="detail-body">
          <Link to="/finishes" className="text-link">← All finishes</Link>
          <h1 className="page-title">{finish.name}</h1>
          <p className="tagline">{finish.tagline}</p>
          <p>{finish.description}</p>

          <h2 className="h-small">Best for</h2>
          <ul className="chips">
            {finish.bestFor.map((b) => <li key={b}>{b}</li>)}
          </ul>

          <div className="price-box">
            <span>Typical price</span>
            <strong>
              {money(finish.priceMin)} – {money(finish.priceMax)} <small>/ sq ft</small>
            </strong>
          </div>

          <Link to={`/estimate?finish=${finish.slug}`} className="btn">Estimate this finish</Link>
        </div>
      </div>
    </section>
  );
}
