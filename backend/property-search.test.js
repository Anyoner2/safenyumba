import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

import app from './server.js'

async function startServer() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` }
}

async function register(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Estate Manager',
      email,
      password: 'secret123',
      confirm_password: 'secret123',
    }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

test('property search supports rent, type, bedroom, location, and amenity filters', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const response = await fetch(
      `${baseUrl}/api/properties/?minRent=40000&maxRent=70000&bedrooms=2&kind=Apartment&amenity=security&location=kilimani`,
    )
    assert.equal(response.status, 200)
    const properties = await response.json()
    assert.deepEqual(properties.map((property) => property.id), ['kilimani-two-bedroom'])

    const invalidRange = await fetch(`${baseUrl}/api/properties/?minRent=70000&maxRent=40000`)
    assert.equal(invalidRange.status, 400)
  } finally {
    server.close()
  }
})

test('viewing requests are validated and appear only in their assigned estate dashboard', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const email = `manager-${crypto.randomUUID()}@example.com`
    const token = await register(baseUrl, email)
    const manager = globalThis.__safeNyumbaData.users.find((user) => user.email === email)
    manager.role = 'estate_manager'
    manager.managed_estate = 'karen'

    const headers = { 'Content-Type': 'application/json' }
    const payload = {
      property_id: 'karen-two-bedroom',
      request_type: 'viewing',
      requester_name: 'Prospective Tenant',
      email: 'tenant@example.com',
      phone: '+254700000000',
      preferred_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      message: 'I would like to see the apartment.',
    }
    const invalid = await fetch(`${baseUrl}/api/viewing-requests/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, email: 'invalid' }),
    })
    assert.equal(invalid.status, 400)

    const createdResponse = await fetch(`${baseUrl}/api/viewing-requests/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    assert.equal(created.property_title, 'Karen 2-bedroom apartment')

    const unauthorized = await fetch(`${baseUrl}/api/dashboard/estate/`)
    assert.equal(unauthorized.status, 401)
    const dashboard = await fetch(`${baseUrl}/api/dashboard/estate/`, {
      headers: { Authorization: `Token ${token}` },
    })
    assert.equal(dashboard.status, 200)
    const data = await dashboard.json()
    assert.equal(data.viewingRequests[0].id, created.id)
    assert.equal(data.viewingRequests[0].email, payload.email)
    assert.equal(data.estate.slug, 'karen')
  } finally {
    server.close()
  }
})
