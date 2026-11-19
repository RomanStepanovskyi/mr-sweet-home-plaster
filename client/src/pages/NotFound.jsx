import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section page-top">
      <div className="container narrow center">
        <p className="eyebrow">404</p>
        <h1 className="page-title">This wall is still bare</h1>
        <p className="muted">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    </section>
  );
}
