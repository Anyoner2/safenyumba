const configuredBaseUrl = import.meta.env.VITE_API_URL
const apiBaseUrl = (configuredBaseUrl || (import.meta.env.DEV ? 'http://127.0.0.1:4000/api' : '')).replace(/\/+$/, '')

async function request(path, { body, method = 'GET' } = {}) {
  if (!apiBaseUrl) {
    throw new Error('The backend URL is not configured for this build.')
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = localStorage.getItem('safe-nyumba-token')
  if (token) headers.Authorization = `Token ${token}`

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error('Could not reach the API. Make sure the Express server is running.')
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.detail
      ?? Object.values(payload ?? {}).flatMap((value) => Array.isArray(value) ? value : [value]).find((value) => typeof value === 'string')
    throw new Error(detail || `The API request failed (${response.status}).`)
  }
  return payload
}

export function getProperties(searchParams) {
  const query = searchParams?.toString()
  return request(`/properties/${query ? `?${query}` : ''}`)
}

export function getEstates() {
  return request('/estates/')
}

export function submitProperty(property) {
  return request('/property-submissions/', { method: 'POST', body: property })
}

export function registerAccount(account) {
  return request('/auth/register/', { method: 'POST', body: account })
}

export function loginAccount(credentials) {
  return request('/auth/login/', { method: 'POST', body: credentials })
}

export function getCurrentUser() {
  return request('/auth/me/')
}

export function logoutAccount() {
  return request('/auth/logout/', { method: 'POST' })
}

export function getRentPayments() {
  return request('/rent-payments/')
}

export function createRentPayment(payment) {
  return request('/rent-payments/', { method: 'POST', body: payment })
}

export function markRentPaymentPaid(id) {
  return request(`/rent-payments/${encodeURIComponent(id)}/paid/`, { method: 'PATCH' })
}

export function getLandlordDashboard() {
  return request('/dashboard/landlord/')
}

export function getEstateDashboard() {
  return request('/dashboard/estate/')
}

export function getSavedProperties() {
  return request('/saved-properties/')
}

export function saveProperty(id) {
  return request(`/saved-properties/${encodeURIComponent(id)}/`, { method: 'POST' })
}

export function unsaveProperty(id) {
  return request(`/saved-properties/${encodeURIComponent(id)}/`, { method: 'DELETE' })
}

export function getNotifications() {
  return request('/notifications/')
}

export function markAllNotificationsRead() {
  return request('/notifications/read-all/', { method: 'PATCH' })
}

export function updatePropertyVacancy(id, vacant) {
  return request(`/properties/${encodeURIComponent(id)}/vacancy/`, {
    method: 'PATCH',
    body: { vacant },
  })
}

export function getMaintenanceRequests() {
  return request('/maintenance-requests/')
}

export function createMaintenanceRequest(maintenanceRequest) {
  return request('/maintenance-requests/', { method: 'POST', body: maintenanceRequest })
}

export function updateMaintenanceRequestStatus(id, status) {
  return request(`/maintenance-requests/${encodeURIComponent(id)}/status/`, {
    method: 'PATCH',
    body: { status },
  })
}

export function getAnnouncements(estateSlug = '') {
  const query = estateSlug ? `?estate=${encodeURIComponent(estateSlug)}` : ''
  return request(`/announcements/${query}`)
}

export function createAnnouncement(announcement) {
  return request('/announcements/', { method: 'POST', body: announcement })
}