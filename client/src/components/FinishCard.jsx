import { Link } from 'react-router-dom';
import { money } from '../api.js';

export default function FinishCard({ finish, index }) {
  return (
    <Link to={`/finishes/${finish.slug}`} className="finish-card">
      <span className="finish-img">
        <img src={finish.image} alt={`${finish.name} texture`} loading="lazy" />
      </span>
      <span className="finish-body">
        {index !== undefined && <span className="finish-num">{String(index + 1).padStart(2, '0')}</span>}
        <strong>{finish.name}</strong>
        <em>{finish.tagline}</em>
        <span className="finish-price">from {money(finish.priceMin)} / sq ft</span>
      </span>
    </Link>
  );
}
