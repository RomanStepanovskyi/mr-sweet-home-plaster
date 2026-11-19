export const SURFACES = ['walls', 'ceiling'];
export const CONDITIONS = ['smooth', 'needs-repair'];

const round10 = (n) => Math.round(n / 10) * 10;

/**
 * Calculates a price range for a job. The server is the single source of
 * truth for pricing, so the client always asks the API for an estimate.
 */
export function calculateEstimate({ finish, area, surface, condition }, settings) {
  let multiplier = 1;
  if (surface === 'ceiling') multiplier *= settings.ceiling_multiplier;
  if (condition === 'needs-repair') multiplier *= settings.repair_multiplier;

  const min = Math.max(settings.minimum_job, round10(area * finish.priceMin * multiplier));
  const max = Math.max(settings.minimum_job, round10(area * finish.priceMax * multiplier));

  return {
    min,
    max,
    perSqFt: { min: finish.priceMin, max: finish.priceMax },
    multiplier: Math.round(multiplier * 100) / 100,
    minimumApplied: min === settings.minimum_job,
  };
}

/** Validates the job fields shared by /estimate and /requests. */
export function validateJob(body = {}) {
  const errors = {};
  const area = Number(body.area);
  if (!body.finish || typeof body.finish !== 'string') errors.finish = 'Please choose a finish.';
  if (!Number.isFinite(area) || area < 10 || area > 5000) errors.area = 'Enter an area between 10 and 5,000 sq ft.';
  if (!SURFACES.includes(body.surface)) errors.surface = 'Choose walls or ceiling.';
  if (!CONDITIONS.includes(body.condition)) errors.condition = 'Choose the surface condition.';
  return { errors, job: { finish: body.finish, area, surface: body.surface, condition: body.condition } };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

export function validateContact(body = {}) {
  const errors = {};
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  const contact = {
    name: s(body.name),
    email: s(body.email).toLowerCase(),
    phone: s(body.phone),
    message: s(body.message).slice(0, 2000),
  };
  if (contact.name.length < 2 || contact.name.length > 80) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(contact.email)) errors.email = 'Please enter a valid email address.';
  if (contact.phone && !PHONE_RE.test(contact.phone)) errors.phone = 'Please enter a valid phone number.';
  return { errors, contact };
}
