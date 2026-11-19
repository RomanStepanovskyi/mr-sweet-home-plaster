// Small fetch wrapper: JSON in, JSON out, errors as exceptions.
export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || 'Request failed');
    this.status = status;
    this.errors = data?.errors || {};
  }
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  finishes: () => request('GET', '/api/finishes'),
  finish: (slug) => request('GET', `/api/finishes/${slug}`),
  estimate: (job) => request('POST', '/api/estimate', job),
  submitRequest: (data) => request('POST', '/api/requests', data),

  me: () => request('GET', '/api/auth/me'),
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  logout: () => request('POST', '/api/auth/logout'),

  adminRequests: (status) => request('GET', `/api/admin/requests${status ? `?status=${status}` : ''}`),
  adminStats: () => request('GET', '/api/admin/stats'),
  updateStatus: (id, status) => request('PATCH', `/api/admin/requests/${id}`, { status }),
  updatePrice: (id, priceMin, priceMax) => request('PATCH', `/api/admin/finishes/${id}`, { priceMin, priceMax }),
};

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
