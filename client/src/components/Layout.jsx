import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export function Brand({ compact = false }) {
  return (
    <Link to="/" className="brand" aria-label="Mr. Sweet Home — Venetian Plaster & Wall Decor, home">
      <img src="/logo.png" alt="" width="52" height="52" />
      {!compact && (
        <span>
          Mr. Sweet Home
          <small>Venetian Plaster · Wall Decor</small>
        </span>
      )}
    </Link>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Brand />
          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="bar" />
            <span className="bar" />
          </button>
          <nav id="site-nav" className={`nav ${open ? 'is-open' : ''}`}>
            <NavLink to="/finishes" onClick={close}>Finishes</NavLink>
            <Link to="/#work" onClick={close}>Our work</Link>
            <Link to="/#process" onClick={close}>Process</Link>
            <NavLink to="/estimate" className="btn btn-small" onClick={close}>
              Get an estimate
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <Brand />
          <p>Hand-troweled decorative plaster · Charlotte, North Carolina</p>
          <p className="footer-small">
            © {new Date().getFullYear()} Mr. Sweet Home LLC ·{' '}
            <Link to="/admin/login">Admin</Link> · Site by{' '}
            <a href="https://github.com/RomanStepanovskyi" target="_blank" rel="noreferrer">Roman Stepanovskyi</a>
          </p>
        </div>
      </footer>
    </>
  );
}
