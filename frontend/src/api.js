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