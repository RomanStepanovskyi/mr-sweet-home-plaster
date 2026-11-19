// Default catalog. Prices are per square foot (USD) and can be changed
// from the admin dashboard — they are placeholders until real rates are set.
export const FINISHES = [
  {
    slug: 'venetian-plaster',
    name: 'Venetian Plaster',
    tagline: 'Polished, marble-like depth',
    description:
      'Thin layers of lime plaster are troweled and burnished by hand until the wall takes on the soft sheen and movement of polished stone. Every wall is one of a kind.',
    best_for: ['Feature walls', 'Living & dining rooms', 'Entryways'],
    price_min: 12,
    price_max: 20,
    image: '/finishes/venetian.jpg',
  },
  {
    slug: 'marmorino',
    name: 'Marmorino',
    tagline: 'Matte stone with quiet texture',
    description:
      'A lime plaster with fine marble dust that dries to a velvety, matte finish. Calm and natural — ideal when you want texture without high gloss.',
    best_for: ['Bedrooms', 'Ceilings', 'Curved walls'],
    price_min: 10,
    price_max: 16,
    image: '/finishes/marmorino.jpg',
  },
  {
    slug: 'microcement',
    name: 'Microcement',
    tagline: 'Seamless walls, floors and showers',
    description:
      'A thin, durable cement coating applied over existing surfaces with no grout lines. Sealed for water resistance, it works in bathrooms, showers and floors.',
    best_for: ['Bathrooms & showers', 'Floors', 'Vanities'],
    price_min: 14,
    price_max: 22,
    image: '/finishes/microcement.jpg',
  },
  {
    slug: 'travertino',
    name: 'Travertino',
    tagline: 'Layered, natural stone look',
    description:
      'Built up in bands to recreate the porous, layered character of travertine stone. Warm and architectural, especially under grazing light.',
    best_for: ['Accent walls', 'Fireplaces', 'Commercial lobbies'],
    price_min: 11,
    price_max: 18,
    image: '/finishes/travertino.jpg',
  },
  {
    slug: 'limewash',
    name: 'Limewash',
    tagline: 'Soft, cloudy color with movement',
    description:
      'A breathable mineral paint brushed on in overlapping strokes for a soft, cloudy effect. The most budget-friendly way to add texture and character.',
    best_for: ['Whole rooms', 'Exteriors', 'Brick'],
    price_min: 4,
    price_max: 7,
    image: '/finishes/limewash.jpg',
  },
];

export const SETTINGS = {
  ceiling_multiplier: 1.25, // ceilings take longer and need more prep
  repair_multiplier: 1.15, // walls that need patching / skim coat first
  minimum_job: 600, // smallest job we take, in USD
};
