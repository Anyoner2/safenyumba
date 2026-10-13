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
      full_name: 'Estate Contact Manager',
      email,
      password: 'secret123',
      confirm_password: 'secret123',
    }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

test('recommendations rank matching listings and listing warnings flag close duplicates', async () => {
  const { server, baseUrl } = await startServer()
  const ownerEmail = `safety-owner-${crypto.randomUUID()}@example.com`
  let ownerId

  try {
    const ownerToken = await register(baseUrl, ownerEmail)
    ownerId = globalThis.__safeNyumbaData.users.find((user) => user.email === ownerEmail).id
    const headers = { Authorization: `Token ${ownerToken}`, 'Content-Type': 'application/json' }
    const preferences = new URLSearchParams({
      location: 'Kilimani',
      budget: '70000',
      bedrooms: '2',
      amenity: 'security',
    })
    const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations/?${preferences}`)
    assert.equal(recommendationsResponse.status, 200)
    const recommendations = await recommendationsResponse.json()
    assert.equal(recommendations[0].id, 'kilimani-two-bedroom')
    assert.equal(recommendations[0].score, 17)
    assert.ok(recommendations[0].reasons.some((reason) => reason.includes('preferred area')))
    assert.deepEqual(recommendations[0].listingWarnings, [])
    assert.equal((await fetch(`${baseUrl}/api/recommendations/?budget=not-a-number`)).status, 400)

    const propertyId = `safety-duplicate-property-${crypto.randomUUID()}`
    const unitId = `safety-duplicate-unit-${crypto.randomUUID()}`
    globalThis.__safeNyumbaData.ownerProperties.push({
      id: propertyId,
      owner_id: ownerId,
      name: 'Kilimani similar apartment',
      city: 'Nairobi',
      location: 'Kilimani',
      kind: 'Apartment',
      amenity: 'Lift, security',
      photos: [],
      created_at: new Date().toISOString(),
    })
    globalThis.__safeNyumbaData.ownerUnits.push({
      id: unitId,
      property_id: propertyId,
      name: 'Unit 2',
      bedrooms: 2,
      rent: 68000,
      status: 'vacant',
      created_at: new Date().toISOString(),
    })

    const listingsResponse = await fetch(`${baseUrl}/api/properties/?location=Kilimani`)
    assert.equal(listingsResponse.status, 200)
    const listings = await listingsResponse.json()
    const original = listings.find((property) => property.id === 'kilimani-two-bedroom')
    assert.ok(original.listingWarnings.some((warning) => warning.includes('similar listing')))
    assert.ok(listings.some((property) => property.id === `owner-unit-${unitId}`))
  } finally {
    globalThis.__safeNyumbaData.ownerProperties = globalThis.__safeNyumbaData.ownerProperties
      .filter((property) => property.owner_id !== ownerId)
    globalThis.__safeNyumbaData.ownerUnits = globalThis.__safeNyumbaData.ownerUnits
      .filter((unit) => !unit.id.startsWith('safety-duplicate-unit-'))
    server.close()
  }
})

test('estate managers can maintain estate contacts while residents can view them', async () => {
  const { server, baseUrl } = await startServer()

  try {
    const managerEmail = `emergency-manager-${crypto.randomUUID()}@example.com`
    const otherManagerEmail = `emergency-other-manager-${crypto.randomUUID()}@example.com`
    const residentEmail = `emergency-resident-${crypto.randomUUID()}@example.com`
    const managerToken = await register(baseUrl, managerEmail)
    const otherManagerToken = await register(baseUrl, otherManagerEmail)
    const residentToken = await register(baseUrl, residentEmail)
    const users = globalThis.__safeNyumbaData.users
    const manager = users.find((user) => user.email === managerEmail)
    const otherManager = users.find((user) => user.email === otherManagerEmail)
    manager.role = 'estate_manager'
    manager.managed_estate = 'kilimani'
    otherManager.role = 'estate_manager'
    otherManager.managed_estate = 'westlands'

    const managerHeaders = { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' }
    const otherManagerHeaders = { Authorization: `Token ${otherManagerToken}`, 'Content-Type': 'application/json' }
    const residentHeaders = { Authorization: `Token ${residentToken}`, 'Content-Type': 'application/json' }
    const payload = {
      name: 'Gatehouse security',
      service: 'Estate security',
      phone: '+254 700 123 456',
      notes: 'Available at the main gate.',
    }

    assert.equal((await fetch(`${baseUrl}/api/emergency-contacts/`)).status, 200)
    assert.equal((await fetch(`${baseUrl}/api/emergency-contacts/`, {
      method: 'POST',
      headers: residentHeaders,
      body: JSON.stringify(payload),
    })).status, 403)
    assert.equal((await fetch(`${baseUrl}/api/emergency-contacts/`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ ...payload, phone: 'not a phone' }),
    })).status, 400)

    const createdResponse = await fetch(`${baseUrl}/api/emergency-contacts/`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify(payload),
    })
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    assert.equal(created.estate_slug, 'kilimani')
    assert.equal(created.phone, payload.phone)

    const publicList = await (await fetch(`${baseUrl}/api/emergency-contacts/?estate=kilimani`)).json()
    assert.equal(publicList.length, 1)
    assert.equal(publicList[0].name, payload.name)
    assert.equal(Object.hasOwn(publicList[0], 'user_id'), false)
    assert.deepEqual(await (await fetch(`${baseUrl}/api/emergency-contacts/?estate=westlands`)).json(), [])

    const crossEstateDelete = await fetch(`${baseUrl}/api/emergency-contacts/${created.id}/`, {
      method: 'DELETE',
      headers: otherManagerHeaders,
    })
    assert.equal(crossEstateDelete.status, 404)
    const deleted = await fetch(`${baseUrl}/api/emergency-contacts/${created.id}/`, {
      method: 'DELETE',
      headers: managerHeaders,
    })
    assert.equal(deleted.status, 204)
    assert.deepEqual(await (await fetch(`${baseUrl}/api/emergency-contacts/?estate=kilimani`)).json(), [])
  } finally {
    server.close()
  }
})

test('estate overview returns vacant homes and private-data-safe estate aggregates', async () => {
  const { server, baseUrl } = await startServer()
  const ownerEmail = `nyayo-owner-${crypto.randomUUID()}@example.com`

  try {
    const ownerToken = await register(baseUrl, ownerEmail)
    const owner = globalThis.__safeNyumbaData.users.find((user) => user.email === ownerEmail)
    const ownerHeaders = { Authorization: `Token ${ownerToken}`, 'Content-Type': 'application/json' }
    const propertyResponse = await fetch(`${baseUrl}/api/owner/properties/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Nyayo Court Apartments',
        city: 'Nairobi',
        location: 'Nyayo Estate',
        kind: 'Apartment',
        amenity: 'Parking',
        photos: [],
      }),
    })
    assert.equal(propertyResponse.status, 201)
    const property = await propertyResponse.json()

    async function addUnit(name, status, tenantEmail = '') {
      const unitResponse = await fetch(`${baseUrl}/api/owner/properties/${property.id}/units/`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({ name, bedrooms: 2, rent: 25000 }),
      })
      assert.equal(unitResponse.status, 201)
      const unit = await unitResponse.json()
      if (status !== 'vacant') {
        const updateResponse = await fetch(`${baseUrl}/api/owner/properties/${property.id}/units/${unit.id}/`, {
          method: 'PATCH',
          headers: ownerHeaders,
          body: JSON.stringify({
            status,
            tenant_name: `Private tenant ${name}`,
            tenant_email: tenantEmail,
            tenant_phone: '+254700000001',
          }),
        })
        assert.equal(updateResponse.status, 200)
      }
      return unit
    }

    await addUnit('Occupied 1', 'occupied', 'same-tenant@example.com')
    await addUnit('Occupied 2', 'occupied', 'same-tenant@example.com')
    await addUnit('Vacant 1', 'vacant')

    const managerEmail = `nyayo-manager-${crypto.randomUUID()}@example.com`
    const managerToken = await register(baseUrl, managerEmail)
    const manager = globalThis.__safeNyumbaData.users.find((user) => user.email === managerEmail)
    manager.role = 'estate_manager'
    manager.managed_estate = 'nyayo-estate'
    const managerHeaders = { Authorization: `Token ${managerToken}`, 'Content-Type': 'application/json' }

    const contactResponse = await fetch(`${baseUrl}/api/emergency-contacts/`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'Nyayo gatehouse',
        service: 'Estate security',
        phone: '+254700123456',
      }),
    })
    assert.equal(contactResponse.status, 201)

    const announcementResponse = await fetch(`${baseUrl}/api/announcements/`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ title: 'Estate notice', body: 'A scheduled community update.' }),
    })
    assert.equal(announcementResponse.status, 201)

    const issueResponse = await fetch(`${baseUrl}/api/maintenance-requests/`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        estate_slug: 'nyayo-estate',
        unit_name: 'Private unit reference',
        title: 'Private leak report',
        description: 'Private report details',
        priority: 'normal',
      }),
    })
    assert.equal(issueResponse.status, 201)

    const overviewResponse = await fetch(`${baseUrl}/api/estates/nyayo-estate/overview/`)
    assert.equal(overviewResponse.status, 200)
    const overview = await overviewResponse.json()
    assert.equal(overview.estate.slug, 'nyayo-estate')
    assert.equal(overview.estate.homes, 1)
    assert.equal(overview.homes.length, 3)
    assert.deepEqual(overview.homes.map((home) => home.status), ['vacant', 'occupied', 'occupied'])
    assert.equal(overview.availableHomes.length, 1)
    assert.equal(overview.availableHomes[0].status, 'vacant')
    assert.equal(overview.residentCount, 1)
    assert.equal(overview.openIssues, 1)
    assert.equal(overview.emergencyContacts[0].name, 'Nyayo gatehouse')
    assert.equal(overview.announcements[0].title, 'Estate notice')
    assert.equal(JSON.stringify(overview).includes('same-tenant@example.com'), false)
    assert.equal(JSON.stringify(overview).includes('Private leak report'), false)
    assert.equal(JSON.stringify(overview).includes('Private report details'), false)
    assert.equal((await fetch(`${baseUrl}/api/estates/unknown/overview/`)).status, 404)
    assert.equal((await fetch(`${baseUrl}/api/estates/unknown/nearby-places/`)).status, 404)
  } finally {
    const owner = globalThis.__safeNyumbaData.users.find((user) => user.email === ownerEmail)
    const propertyIds = globalThis.__safeNyumbaData.ownerProperties
      .filter((property) => property.owner_id === owner?.id)
      .map((property) => property.id)
    globalThis.__safeNyumbaData.ownerProperties = globalThis.__safeNyumbaData.ownerProperties
      .filter((property) => property.owner_id !== owner?.id)
    globalThis.__safeNyumbaData.ownerUnits = globalThis.__safeNyumbaData.ownerUnits
      .filter((unit) => !propertyIds.includes(unit.property_id))
    globalThis.__safeNyumbaData.maintenanceRequests = globalThis.__safeNyumbaData.maintenanceRequests
      .filter((request) => request.user_id !== owner?.id)
    globalThis.__safeNyumbaData.emergencyContacts = globalThis.__safeNyumbaData.emergencyContacts
      .filter((contact) => contact.estate_slug !== 'nyayo-estate')
    globalThis.__safeNyumbaData.announcements = globalThis.__safeNyumbaData.announcements
      .filter((announcement) => announcement.estate_slug !== 'nyayo-estate')
    server.close()
  }
})

test('nearby-place endpoint groups and caches OpenStreetMap results', async () => {
  const { server, baseUrl } = await startServer()
  const realFetch = globalThis.fetch
  const requests = []

  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options })
    if (String(url).startsWith('https://nominatim.openstreetmap.org/search?')) {
      return {
        ok: true,
        json: async () => [{ lat: '-1.3200', lon: '36.9000' }],
      }
    }
    if (String(url) === 'https://overpass-api.de/api/interpreter') {
      return {
        ok: true,
        json: async () => ({
          elements: [
            { type: 'node', id: 1, lat: -1.321, lon: 36.901, tags: { name: 'Nyayo Market', shop: 'supermarket' } },
            { type: 'node', id: 2, lat: -1.322, lon: 36.902, tags: { name: 'Embakasi Clinic', amenity: 'clinic' } },
            { type: 'node', id: 3, lat: -1.323, lon: 36.903, tags: { name: 'Nyayo School', amenity: 'school' } },
            { type: 'node', id: 4, lat: -1.324, lon: 36.904, tags: { name: 'Nyayo Bus Stop', highway: 'bus_stop' } },
          ],
        }),
      }
    }
    throw new Error(`Unexpected external request: ${url}`)
  }

  try {
    const firstResponse = await realFetch(`${baseUrl}/api/estates/nyayo-estate/nearby-places/`)
    assert.equal(firstResponse.status, 200)
    const first = await firstResponse.json()
    assert.deepEqual(first.counts, { shops: 1, hospitals: 1, schools: 1, transport: 1 })
    assert.equal(first.center.radiusMeters, 2000)
    assert.equal(first.categories.shops[0].name, 'Nyayo Market')
    assert.equal(first.categories.hospitals[0].name, 'Embakasi Clinic')
    assert.equal(first.categories.schools[0].name, 'Nyayo School')
    assert.equal(first.categories.transport[0].name, 'Nyayo Bus Stop')
    assert.equal(requests.length, 2)
    assert.match(requests[1].options.body, /around%3A2000/)

    const cachedResponse = await realFetch(`${baseUrl}/api/estates/nyayo-estate/nearby-places/`)
    assert.equal(cachedResponse.status, 200)
    assert.deepEqual(await cachedResponse.json(), first)
    assert.equal(requests.length, 2)
  } finally {
    globalThis.fetch = realFetch
    server.close()
  }
})
