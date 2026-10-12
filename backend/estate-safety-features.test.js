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
