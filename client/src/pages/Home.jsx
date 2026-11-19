import { Link } from 'react-router-dom';
import FinishCard from '../components/FinishCard.jsx';
import { useFinishes } from '../useFinishes.js';

const WORK = [
  { src: '/work/plaster-green-wall.jpg', title: 'Green Venetian plaster feature wall' },
  { src: '/work/plaster-arched-mirror.jpg', title: 'Plaster bathroom with arched mirror' },
  { src: '/work/plaster-green-detail.jpg', title: 'Hand-troweled texture, up close' },
  { src: '/work/plaster-curved-wall.jpg', title: 'Curved plaster wall with wood ceiling' },
];

const STEPS = [
  ['Samples', 'We bring physical samples so you can see finish and color in your own light.'],
  ['Prep', 'Surfaces are protected, repaired and primed — the part that makes plaster last.'],
  ['Application', 'Layer by layer, troweled and burnished by hand over several days.'],
  ['Seal & reveal', 'A protective coat where needed, a clean site and a final walkthrough.'],
];

export default function Home() {
  const { finishes } = useFinishes();

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Charlotte, North Carolina</p>
            <h1>
              Walls with <span>depth</span>
            </h1>
            <p className="lead">
              Venetian plaster, marmorino, microcement and limewash — applied by hand, layer by
              layer, for surfaces that look and feel like natural stone.
            </p>
            <div className="actions">
              <Link to="/estimate" className="btn">Get an instant estimate</Link>
              <Link to="/finishes" className="btn btn-ghost">Explore finishes</Link>
            </div>
          </div>
          <figure className="hero-photo">
            <img src="/work/plaster-green-wall.jpg" alt="Green Venetian plaster accent wall in a living room" />
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head split">
            <div>
              <p className="eyebrow">Finishes</p>
              <h2>Five finishes, endless tones</h2>
            </div>
            <Link to="/finishes" className="text-link">View all finishes →</Link>
          </div>
          <div className="finish-grid">
            {finishes.map((f, i) => <FinishCard key={f.id} finish={f} index={i} />)}
          </div>
        </div>
      </section>

      <section className="section section-dark" id="work">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Our work</p>
            <h2>Recent plaster projects</h2>
          </div>
          <ul className="work-grid">
            {WORK.map((w) => (
              <li key={w.src}>
                <figure>
                  <img src={w.src} alt={w.title} loading="lazy" />
                  <figcaption>{w.title}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="process">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Process</p>
            <h2>Slow craft, clear schedule</h2>
          </div>
          <ol className="steps">
            {STEPS.map(([title, text]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <h2>Know your wall size? Get a price range in seconds.</h2>
          <Link to="/estimate" className="btn">Open the calculator</Link>
        </div>
      </section>
    </>
  );
}
