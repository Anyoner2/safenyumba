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

test('owners manage their own properties, unit availability, rent, and tenant details', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const ownerEmail = `portfolio-${crypto.randomUUID()}@example.com`
    const otherEmail = `portfolio-other-${crypto.randomUUID()}@example.com`
    const ownerToken = await register(baseUrl, ownerEmail)
    const otherToken = await register(baseUrl, otherEmail)
    const ownerHeaders = { Authorization: `Token ${ownerToken}`, 'Content-Type': 'application/json' }
    const otherHeaders = { Authorization: `Token ${otherToken}`, 'Content-Type': 'application/json' }

    const invalidPhoto = await fetch(`${baseUrl}/api/owner/properties/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Greenview Apartments',
        city: 'Nairobi',
        location: 'Kilimani',
        kind: 'Apartment',
        photos: ['data:image/png;base64,ZmFrZQ=='],
      }),
    })
    assert.equal(invalidPhoto.status, 400)

    const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ggAAAAASUVORK5CYII='
    const propertyResponse = await fetch(`${baseUrl}/api/owner/properties/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Greenview Apartments',
        city: 'Nairobi',
        location: 'Kilimani',
        kind: 'Apartment',
        amenity: 'Lift, security',
        photos: [photo],
      }),
    })
    assert.equal(propertyResponse.status, 201)
    const property = await propertyResponse.json()

    const unitResponse = await fetch(`${baseUrl}/api/owner/properties/${property.id}/units/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'Block A, Unit 4', bedrooms: 2, rent: 48000 }),
    })
    assert.equal(unitResponse.status, 201)
    const unit = await unitResponse.json()
    assert.equal(unit.status, 'vacant')

    const saveResponse = await fetch(`${baseUrl}/api/saved-properties/owner-unit-${unit.id}/`, {
      method: 'POST',
      headers: otherHeaders,
    })
    assert.equal(saveResponse.status, 201)

    const privateUnit = await fetch(
      `${baseUrl}/api/owner/properties/${property.id}/units/${unit.id}/`,
      { method: 'PATCH', headers: otherHeaders, body: JSON.stringify({ status: 'occupied' }) },
    )
    assert.equal(privateUnit.status, 404)

    const occupied = await fetch(
      `${baseUrl}/api/owner/properties/${property.id}/units/${unit.id}/`,
      {
        method: 'PATCH',
        headers: ownerHeaders,
        body: JSON.stringify({
          rent: 52000,
          status: 'occupied',
          tenant_name: 'Amina Tenant',
          tenant_email: 'amina@example.com',
          tenant_phone: '+254700000001',
        }),
      },
    )
    assert.equal(occupied.status, 200)
    assert.equal((await occupied.json()).rent, 52000)

    const publicHomes = await (await fetch(`${baseUrl}/api/properties/?location=Kilimani`)).json()
    assert.equal(publicHomes.some((home) => home.id === `owner-unit-${unit.id}`), false)

    const vacant = await fetch(
      `${baseUrl}/api/owner/properties/${property.id}/units/${unit.id}/`,
      { method: 'PATCH', headers: ownerHeaders, body: JSON.stringify({ status: 'vacant' }) },
    )
    const vacancyUpdate = await vacant.json()
    assert.equal(vacancyUpdate.status, 'vacant')
    assert.equal(vacancyUpdate.notificationsCreated, 1)
    const vacancyAlerts = await (await fetch(`${baseUrl}/api/notifications/`, {
      headers: { Authorization: `Token ${otherToken}` },
    })).json()
    assert.equal(vacancyAlerts[0].property.id, `owner-unit-${unit.id}`)

    const publishedHomes = await (await fetch(`${baseUrl}/api/properties/?location=Kilimani&minRent=52000`)).json()
    const publishedUnit = publishedHomes.find((home) => home.id === `owner-unit-${unit.id}`)
    assert.equal(publishedUnit.title, 'Greenview Apartments · Block A, Unit 4')
    assert.equal(publishedUnit.image, photo)

    const viewing = await fetch(`${baseUrl}/api/viewing-requests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: publishedUnit.id,
        request_type: 'contact',
        requester_name: 'Prospective Tenant',
        email: 'prospective@example.com',
        phone: '+254700000002',
      }),
    })
    assert.equal(viewing.status, 201)

    const ownerDashboard = await fetch(`${baseUrl}/api/dashboard/landlord/`, {
      headers: { Authorization: `Token ${ownerToken}` },
    })
    const dashboard = await ownerDashboard.json()
    assert.equal(dashboard.properties[0].units[0].tenant_name, '')
    assert.equal(dashboard.viewingRequests.length, 1)
    assert.equal(dashboard.viewingRequests[0].email, 'prospective@example.com')

    const otherDashboard = await fetch(`${baseUrl}/api/dashboard/landlord/`, {
      headers: { Authorization: `Token ${otherToken}` },
    })
    assert.deepEqual((await otherDashboard.json()).properties, [])
  } finally {
    server.close()
  }
})
